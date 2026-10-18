import zlib from 'node:zlib'
import compression from 'compression'
import type { RequestHandler } from 'express'

/**
 * gzip / brotli for every response, streamed ones included.
 *
 * A streamed query (`httpBatchStreamLink`) and server-sent events must reach
 * the client chunk by chunk, while zlib holds output until its buffer fills.
 * So every write is flushed, a SYNC flush that keeps what came before as the
 * dictionary. tRPC also calls `res.flush()` after each chunk; the middleware's
 * own flush is a FULL flush, which drops the dictionary at every chunk (a
 * streamed slice came out 5x bigger under gzip), so it is replaced by a no-op:
 * the write before it has already been flushed.
 *
 * `threshold: 0`: without a Content-Length the size test looks at the first
 * write only, and a stream's first write is a short head line, so the default
 * 1 KB threshold would leave every stream uncompressed.
 *
 * Mount it before the routes it should cover.
 */
export function ehCompression(): RequestHandler {
  const compress = compression({
    threshold: 0,
    flush: zlib.constants.Z_SYNC_FLUSH,
    brotli: { flush: zlib.constants.BROTLI_OPERATION_FLUSH },
  })
  return (req, res, next) =>
    compress(req, res, (err?: unknown) => {
      ;(res as { flush?: () => void }).flush = () => {}
      next(err)
    })
}
