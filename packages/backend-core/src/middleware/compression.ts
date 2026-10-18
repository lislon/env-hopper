import compression from 'compression'
import type { RequestHandler } from 'express'

/**
 * gzip / brotli for every response, streamed ones included.
 *
 * A streamed query (`httpBatchStreamLink`) and server-sent events must reach
 * the client chunk by chunk, while zlib holds output until its buffer fills.
 * tRPC's adapter calls `res.flush()`, which this middleware provides, after
 * every chunk, so each chunk still leaves the moment it is yielded.
 *
 * `threshold: 0`: without a Content-Length the size test looks at the first
 * write only, and a stream's first write is a short head line, so the default
 * 1 KB threshold would leave every stream uncompressed.
 *
 * Mount it before the routes it should cover.
 */
export function ehCompression(): RequestHandler {
  return compression({ threshold: 0 })
}
