/**
 * A keyed list of similar records, sent as per-field defaults plus what each
 * record does differently.
 *
 * Environments repeat themselves: most share a base domain, most build a path
 * or a namespace from their own slug. `packEnvs` finds, per field, the rule
 * most of them follow and sends it once; `expandEnv` rebuilds one record from
 * it. The packed form is correct by construction: `packEnvs` checks every
 * record round-trips and sends the ones that do not fully explicit.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | Array<Json>
  | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

export interface PackedEnvs {
  /**
   * Per field, the value most records have. A string may name `{{env.slug}}`
   * or `{{env.slug|nodash}}` (the slug without dashes), filled per record.
   */
  envDefaults: JsonObject
  /**
   * Every record, by slug: what differs from `envDefaults`. `null` removes a
   * default the record does not have.
   */
  envs: Record<string, JsonObject>
}

const SLUG = '{{env.slug}}'
const NODASH = '{{env.slug|nodash}}'

const isObject = (v: Json | undefined): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
/** A field holding a value: anything but a non-empty object. */
const isLeaf = (v: Json) => !isObject(v) || Object.keys(v).length === 0
const has = (o: JsonObject, k: string) => Object.hasOwn(o, k)

/** Key-order-free JSON, for equality. */
function canon(v: Json): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`
  if (isObject(v)) {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon(v[k]!)}`)
      .join(',')}}`
  }
  return JSON.stringify(v)
}
const equal = (a: Json | undefined, b: Json | undefined) =>
  a === undefined || b === undefined ? a === b : canon(a) === canon(b)

/*
 * Plain token replacement rather than `substituteTemplate`: that one also
 * reads `{{a ?? b}}` and would rewrite any such text a value carries.
 */
function fill(rule: Json, slug: string): Json {
  if (typeof rule === 'string') {
    return rule
      .replaceAll(SLUG, slug)
      .replaceAll(NODASH, slug.replaceAll('-', ''))
  }
  if (isObject(rule)) {
    return Object.fromEntries(
      Object.entries(rule).map(([k, v]) => [k, fill(v, slug)]),
    )
  }
  return rule
}

function merge(base: JsonObject, over: JsonObject): JsonObject {
  const out = { ...base }
  for (const [k, v] of Object.entries(over)) {
    const b = out[k]
    if (v === null && has(out, k)) delete out[k]
    else if (isObject(v) && isObject(b) && !isLeaf(v)) out[k] = merge(b, v)
    else out[k] = v
  }
  return out
}

/** One record of the packed list, or `undefined` for an unknown slug. */
export function expandEnv<T>(
  packed: { envDefaults?: JsonObject; envs: Record<string, unknown> },
  slug: string,
): T | undefined {
  const own = packed.envs[slug] as JsonObject | undefined
  if (own === undefined) return undefined
  return merge(fill(packed.envDefaults ?? {}, slug) as JsonObject, own) as T
}

/**
 * What turns `base` into `actual` under `merge`; `undefined` when nothing.
 * `all` lists every field of `actual`, even those `base` already has.
 */
function diff(
  base: Json | undefined,
  actual: Json | undefined,
  all: boolean,
): Json | undefined {
  if (actual === undefined) return base === undefined ? undefined : null
  if (isObject(actual) && !isLeaf(actual) && isObject(base) && !isLeaf(base)) {
    const out: JsonObject = {}
    for (const k of new Set([...Object.keys(base), ...Object.keys(actual)])) {
      const d = diff(base[k], actual[k], all)
      if (d !== undefined) out[k] = d
    }
    return Object.keys(out).length > 0 || all ? out : undefined
  }
  return !all && equal(base, actual) ? undefined : actual
}

function leaves(
  o: JsonObject,
  path: Array<string> = [],
): Array<[Array<string>, Json]> {
  return Object.entries(o).flatMap(
    ([k, v]): Array<[Array<string>, Json]> =>
      isLeaf(v) ? [[[...path, k], v]] : leaves(v as JsonObject, [...path, k]),
  )
}

function at(o: JsonObject, path: Array<string>): Json | undefined {
  let v: Json | undefined = o
  for (const k of path) v = isObject(v) && has(v, k) ? v[k] : undefined
  return v
}

/**
 * The rules a value could follow: itself, and itself with its record's slug
 * (or the slug without dashes) as a placeholder.
 * ponytail: three rule kinds only (constant, slug, slug without dashes); a
 * field built another way from the slug (a prefix cut, a case change) gets no
 * rule and every record carries it. Add a kind here when one shows up.
 */
function candidates(v: Json, slug: string): Array<Json> {
  const out: Array<Json> = [v]
  if (typeof v !== 'string') return out
  if (v.includes(slug)) out.push(v.replaceAll(slug, SLUG))
  const nodash = slug.replaceAll('-', '')
  if (nodash !== slug && v.includes(nodash)) {
    out.push(v.replaceAll(nodash, NODASH))
  }
  return out
}

/** Bytes a field costs where it is written: `"key":value,`. */
const cost = (key: string, v: Json) =>
  JSON.stringify(key).length + JSON.stringify(v).length + 2

function chooseDefaults(records: Array<[string, JsonObject]>): JsonObject {
  const byPath = new Map<string, { path: Array<string>; values: Array<Json> }>()
  for (const [, r] of records) {
    for (const [path] of leaves(r)) {
      const k = JSON.stringify(path)
      if (!byPath.has(k)) byPath.set(k, { path, values: [] })
    }
  }
  const chosen: Array<{ path: Array<string>; rule: Json; saved: number }> = []
  for (const { path } of byPath.values()) {
    const key = path[path.length - 1]!
    const counts = new Map<string, { rule: Json; n: number }>()
    for (const [slug, r] of records) {
      const v = at(r, path)
      if (v === undefined || !isLeaf(v)) continue
      for (const c of new Set(candidates(v, slug).map((x) => canon(x)))) {
        const hit = counts.get(c) ?? { rule: JSON.parse(c) as Json, n: 0 }
        hit.n++
        counts.set(c, hit)
      }
    }
    const best = [...counts.entries()].sort(
      ([a, x], [b, y]) => y.n - x.n || a.length - b.length,
    )[0]
    if (!best) continue
    const rule = best[1].rule
    let without = 0
    let withRule = cost(key, rule)
    for (const [slug, r] of records) {
      const v = at(r, path)
      if (v !== undefined) without += cost(key, v)
      if (v === undefined) withRule += cost(key, null)
      else if (!equal(fill(rule, slug), v)) withRule += cost(key, v)
    }
    if (withRule < without)
      chosen.push({ path, rule, saved: without - withRule })
  }
  // A field and a field inside it cannot both have a rule; the bigger saving wins.
  const defaults: JsonObject = {}
  for (const { path, rule } of chosen.sort((a, b) => b.saved - a.saved)) {
    let node = defaults
    let blocked = false
    for (const k of path.slice(0, -1)) {
      const next = node[k]
      if (next === undefined) node = node[k] = {}
      else if (isObject(next) && !isLeaf(next)) node = next
      else {
        blocked = true
        break
      }
    }
    const last = path[path.length - 1]!
    if (!blocked && !has(node, last)) node[last] = rule
  }
  return defaults
}

/**
 * Packs records keyed by slug. Each record round-trips:
 * `expandEnv(packEnvs(x), slug)` deep-equals `x[slug]` as JSON, else that
 * record is sent fully explicit.
 */
export function packEnvs(records: Record<string, unknown>): PackedEnvs {
  const list = Object.entries(
    JSON.parse(JSON.stringify(records)) as Record<string, JsonObject>,
  )
  const envDefaults = chooseDefaults(list)
  const envs: Record<string, JsonObject> = {}
  for (const [slug, r] of list) {
    const base = fill(envDefaults, slug) as JsonObject
    const tries = [diff(base, r, false) ?? {}, diff(base, r, true) ?? {}]
    const ok = tries.find((o) => equal(merge(base, o as JsonObject), r))
    // Neither form round-trips (a `null` the record really holds): no
    // defaults at all, which is the input as it is.
    if (ok === undefined)
      return { envDefaults: {}, envs: Object.fromEntries(list) }
    envs[slug] = ok as JsonObject
  }
  return { envDefaults, envs }
}
