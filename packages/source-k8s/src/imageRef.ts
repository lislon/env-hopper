import type { ImageRef } from './k8sTypes'

export function parseImageRef(ref: string): ImageRef {
  const at = ref.indexOf('@')
  const [nameAndTag, digest] =
    at >= 0 ? [ref.slice(0, at), ref.slice(at + 1)] : [ref, undefined]
  const slash = nameAndTag.lastIndexOf('/')
  const colon = nameAndTag.lastIndexOf(':')
  const hasTag = colon > slash
  const name = hasTag ? nameAndTag.slice(0, colon) : nameAndTag
  const tag = digest ?? (hasTag ? nameAndTag.slice(colon + 1) : 'latest')
  const first = name.split('/')[0]!
  const isRegistry =
    name.includes('/') &&
    (first.includes('.') || first.includes(':') || first === 'localhost')
  return {
    registry: isRegistry ? first : null,
    repository: isRegistry ? name.slice(first.length + 1) : name,
    tag,
  }
}
