import type { Primitive } from 'type-fest'

/*
  Taken from https://gist.github.com/tkrotoff/a6baf96eb6b61b445a9142e5555511a0
 * [Generic way to convert all instances of null to undefined in TypeScript](https://stackoverflow.com/q/50374869)
 *
 * This only works with JS objects hence the file name *Object*Values
 *
 * ["I intend to stop using `null` in my JS code in favor of `undefined`"](https://github.com/sindresorhus/meta/discussions/7)
 * [Proposal: NullToUndefined and UndefinedToNull](https://github.com/sindresorhus/type-fest/issues/603)
 *
 * Types implementation inspired by:
 * - https://github.com/sindresorhus/type-fest/blob/v2.12.2/source/delimiter-cased-properties-deep.d.ts
 * - https://github.com/sindresorhus/type-fest/blob/v2.12.2/source/readonly-deep.d.ts
 *
 * https://gist.github.com/tkrotoff/a6baf96eb6b61b445a9142e5555511a0
 */
export type NullToUndefined<T> = T extends null
  ? undefined
  : T extends Primitive | Function | Date | RegExp
    ? T
    : T extends Array<infer U>
      ? Array<NullToUndefined<U>>
      : T extends Map<infer K, infer V>
        ? Map<K, NullToUndefined<V>>
        : T extends Set<infer U>
          ? Set<NullToUndefined<U>>
          : T extends object
            ? { [K in keyof T]: NullToUndefined<T[K]> }
            : unknown

export type UndefinedToNull<T> = T extends undefined
  ? null
  : T extends Primitive | Function | Date | RegExp
    ? T
    : T extends Array<infer U>
      ? Array<UndefinedToNull<U>>
      : T extends Map<infer K, infer V>
        ? Map<K, UndefinedToNull<V>>
        : T extends Set<infer U>
          ? Set<NullToUndefined<U>>
          : T extends object
            ? { [K in keyof T]: UndefinedToNull<T[K]> }
            : unknown

function _nullToUndefined<T>(obj: T): NullToUndefined<T> {
  if (obj === null) {
    return undefined as any
  }

  if (typeof obj === 'object') {
    if (obj instanceof Map) {
      obj.forEach((value, key) => obj.set(key, _nullToUndefined(value)))
    } else {
      for (const key in obj) {
        obj[key] = _nullToUndefined(obj[key]) as any
      }
    }
  }

  return obj as any
}

/**
 * Recursively converts all null values to undefined.
 *
 * @param obj object to convert
 * @returns a copy of the object with all its null values converted to undefined
 */
export function nullToUndefined<
  T,
  // Can cause: "Type instantiation is excessively deep and possibly infinite."
  // extends Jsonifiable
>(obj: T) {
  return _nullToUndefined(structuredClone(obj))
}

function _undefinedToNull<T>(obj: T): UndefinedToNull<T> {
  if (obj === undefined) {
    return null as any
  }

  if (typeof obj === 'object') {
    if (obj instanceof Map) {
      obj.forEach((value, key) => obj.set(key, _undefinedToNull(value)))
    } else {
      for (const key in obj) {
        obj[key] = _undefinedToNull(obj[key]) as any
      }
    }
  }

  return obj as any
}

/**
 * Recursively converts all undefined values to null.
 *
 * @param obj object to convert
 * @returns a copy of the object with all its undefined values converted to null
 */
export function undefinedToNull<
  T,
  // Can cause: "Type instantiation is excessively deep and possibly infinite."
  // extends Jsonifiable
>(obj: T) {
  return _undefinedToNull(structuredClone(obj))
}
