/**
 * Let `fetch` accept jsdom's `AbortSignal`.
 *
 * jsdom installs its own `AbortController`/`AbortSignal` over node's, but node's
 * `fetch` is undici, which captured the real ones at startup and rejects
 * anything else with "Expected signal to be an instance of AbortSignal". The two
 * classes are unrelated and node's original is no longer reachable to hand over,
 * so every `fetch` carrying a signal fails — tRPC queries via react-query, and
 * the auth client's session probe, which is where it surfaces first.
 *
 * `Request` is the boundary to patch, not `fetch`: msw's interceptor replaces
 * `globalThis.fetch` when the server starts listening, so a wrapper installed
 * here is simply dropped — but the interceptor still builds its `Request` from
 * the global, and so does undici internally on the unintercepted path.
 *
 * ponytail: drops the signal rather than bridging it, so an aborted request
 * still runs to completion. Nothing here asserts on cancellation; if something
 * ever does, bridge it by racing the signal's `abort` event against the reply.
 */
const NativeRequest = globalThis.Request

class RequestWithoutForeignSignal extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init?.signal) {
      const { signal: _signal, ...rest } = init
      super(input, rest)
    } else {
      super(input, init)
    }
  }
}

globalThis.Request = RequestWithoutForeignSignal
