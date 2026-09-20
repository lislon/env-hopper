/*
 * Reads the skin off a real rendered page instead of off the stylesheet.
 *
 * Why this exists: `getComputedStyle` on a resting element reports nothing about
 * an animation, and CSS cannot be observed at all in a DOM emulator — so neither
 * the compiled-CSS check nor a unit test can tell whether the press animation
 * actually runs. This drives a headless browser, presses the button with real
 * input events so `:active` genuinely applies, and samples the running animations
 * during the press.
 *
 * Not part of `test:unit`: it needs a browser binary. Run it by hand
 * (`pnpm run test:legacy-skin:browser`) when changing the skin.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFileSync, mkdtempSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { readFile } from 'node:fs/promises'

import { compile, here } from './compile.mjs'

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/* --- serve the fixture next to a freshly compiled stylesheet --- */

const dir = compile().outDir
copyFileSync(path.join(here, 'fixture.html'), path.join(dir, 'index.html'))

const server = createServer(async (req, res) => {
  const name = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  try {
    const body = await readFile(path.join(dir, path.basename(name)))
    res.writeHead(200, {
      'content-type': name.endsWith('.css') ? 'text/css' : 'text/html',
    })
    res.end(body)
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}/index.html`

/* --- own browser instance, own profile: the shared one may be in use --- */

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${mkdtempSync(path.join(tmpdir(), 'legacy-skin-chrome-'))}`,
    '--no-first-run',
    '--disable-gpu',
    '--force-prefers-reduced-motion=false',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
)

const devtoolsUrl = await new Promise((resolve, reject) => {
  let buf = ''
  const timer = setTimeout(() => reject(new Error('browser did not start')), 30_000)
  chrome.stderr.on('data', (d) => {
    buf += d
    const m = /ws:\/\/[^\s]+/.exec(buf)
    if (m) {
      clearTimeout(timer)
      resolve(m[0])
    }
  })
})

/* --- minimal CDP client; Node has WebSocket built in --- */

const ws = new WebSocket(devtoolsUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let nextId = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
const evaluate = async (expression) => {
  const { result, exceptionDetails } = await send(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  )
  if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails))
  return result.value
}

await send('Page.enable', {}, sessionId)
/*
 * Headless Chrome reports `prefers-reduced-motion: reduce`, which is exactly the
 * query guarding the press animation — without this the animation is correctly
 * absent and the check would "fail" on a working skin.
 */
await send(
  'Emulation.setEmulatedMedia',
  { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] },
  sessionId,
)
await send('Page.navigate', { url }, sessionId)
await new Promise((r) => setTimeout(r, 1200))

const loaded = await evaluate(`(() => ({
  href: location.href,
  sheets: document.styleSheets.length,
  rules: [...document.styleSheets].map(s => { try { return s.cssRules.length } catch (e) { return 'blocked:' + e.name } }),
  radius: getComputedStyle(document.getElementById('inside')).borderTopLeftRadius,
}))()`)
/*
 * Counting cssRules is no good here — Tailwind 4 nests almost everything inside
 * `@layer` blocks, so the top-level count is tiny. Check that the skin is
 * actually applying instead.
 */
assert.ok(
  loaded.sheets > 0 && loaded.radius !== '0px',
  `the compiled stylesheet did not reach the page: ${JSON.stringify(loaded)}`,
)

/* --- 1. the mount animation, read off the live element --- */

const mounted = await evaluate(`(() => {
  const host = document.getElementById('scoped');
  const b = document.createElement('button');
  b.className = 'btn btn-primary';
  b.textContent = 'freshly mounted';
  host.appendChild(b);
  return b.getAnimations().map(a => ({
    name: a.animationName, state: a.playState,
    duration: a.effect.getTiming().duration,
  }));
})()`)
assert.ok(
  mounted.some((a) => a.animationName === 'button-pop' || a.name === 'button-pop'),
  `a button mounted inside the scope is not running button-pop; got ${JSON.stringify(mounted)}`,
)

/* --- 2. geometry, inside vs outside the scope --- */

const READ = `(el) => {
  const s = getComputedStyle(el);
  return {
    height: s.height, paddingInline: s.paddingLeft, borderRadius: s.borderTopLeftRadius,
    background: s.backgroundColor, color: s.color, fontSize: s.fontSize,
    display: s.display, animationName: s.animationName,
  };
}`
const geometry = await evaluate(`(() => {
  const read = ${READ};
  return {
    inside: read(document.getElementById('inside')),
    outside: read(document.getElementById('outside')),
    tab: read(document.querySelector('.tab')),
    quickBar: read(document.querySelector('.eh-quick-bar')),
  };
})()`)

assert.notEqual(
  geometry.inside.background,
  geometry.outside.background,
  'the same .btn markup renders identically inside and outside the scope — the skin is not scoped',
)
assert.equal(
  geometry.inside.borderRadius,
  '8px',
  `the button corner radius is not the previous UI's 0.5rem; got ${geometry.inside.borderRadius}`,
)
assert.equal(
  geometry.inside.height,
  '48px',
  `the button height is not the previous UI's 3rem; got ${geometry.inside.height}`,
)
assert.equal(
  geometry.quickBar.display,
  'inline-flex',
  `the quick bar is not laid out horizontally; got ${geometry.quickBar.display}`,
)
assert.ok(
  geometry.outside.borderRadius === '0px' && geometry.outside.background !== geometry.inside.background,
  'a button outside the scope picked up the skin',
)

/* --- 3. the :active driver, sampled during a real press --- */

/*
 * Sampled from computed style, not from getAnimations(): the press animation is
 * declared `0s`, so it can finish before the Animation object is observable, and
 * getAnimations() also returns transitions whose animationName is null.
 */
await evaluate(`(() => {
  window.__press = null;
  const b = document.getElementById('inside');
  b.addEventListener('mousedown', () => {
    const s = getComputedStyle(b);
    window.__press = {
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      transform: s.transform,
      matches: b.matches(':active'),
      hover: b.matches(':hover'),
      focus: b.matches(':focus'),
    };
  });
})()`)

const box = await evaluate(
  `JSON.stringify(document.getElementById('inside').getBoundingClientRect())`,
)
const { x, y, width, height } = JSON.parse(box)
const point = { x: Math.round(x + width / 2), y: Math.round(y + height / 2) }
await send(
  'Input.dispatchMouseEvent',
  { type: 'mousePressed', button: 'left', clickCount: 1, ...point },
  sessionId,
)
await new Promise((r) => setTimeout(r, 120))
const press = await evaluate('JSON.stringify(window.__press)').then(JSON.parse)
await send(
  'Input.dispatchMouseEvent',
  { type: 'mouseReleased', button: 'left', clickCount: 1, ...point },
  sessionId,
)

assert.ok(press, 'the press was never delivered, so :active was never exercised')
assert.ok(press.matches, 'the element did not match :active during the press')
assert.equal(
  press.animationName,
  'button-pop',
  `button-pop is not the animation during the press; got ${JSON.stringify(press)}`,
)
assert.equal(
  press.animationDuration,
  '0s',
  `the press does not restart button-pop from zero; got ${press.animationDuration}`,
)
/*
 * Deliberately not asserting a scaled-down `transform` here. The press rule sets
 * both `animation: button-pop 0s` and `transform: scale(var(--btn-focus-scale))`,
 * and the animation's final keyframe is `scale(1)`, so the computed transform
 * reads as identity — in this browser and, identically, in the previous app. The
 * effect the user sees is the pop *re-triggering*, which is what the two
 * assertions above measure.
 */
assert.equal(
  geometry.inside.animationName,
  'button-pop',
  `the resting button is not set up to pop; got ${geometry.inside.animationName}`,
)

console.log('browser check: ok')
console.log(JSON.stringify({ mounted, geometry, press }, null, 2))

ws.close()
chrome.kill()
server.close()
