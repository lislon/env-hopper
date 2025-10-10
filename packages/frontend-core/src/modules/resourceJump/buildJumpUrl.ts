import type {
  EnvSlug,
  JumpResourceSlug,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

export function buildJumpUrl(
  jumpResourceSlug: JumpResourceSlug | undefined,
  envSlug: EnvSlug | undefined,
  resourceJumps: ResourceJumpsData,
): string {
  const { baseResourceJumpUrls, resourceJumpsData, envData } = resourceJumps

  const baseUrl = baseResourceJumpUrls[jumpResourceSlug || ''] || ''
  let finalUrl = baseUrl
  let prevUrl = ''

  while (finalUrl !== prevUrl) {
    prevUrl = finalUrl
    finalUrl = finalUrl.replace(/{{(.+?)}}/g, function (match, contents) {
      if (contents.startsWith('app.meta.')) {
        const varName = contents.replace('app.meta.', '')
        const r = resourceJumpsData[jumpResourceSlug || '']?.[varName]
        if (r !== undefined) {
          return r
        }
      }
      if (contents.startsWith('env.meta.')) {
        const varName = contents.replace('env.meta.', '')
        const r = envData[envSlug || '']?.[varName]
        if (r !== undefined) {
          return r
        }
      }
      return match
    })
  }

  return finalUrl || `not found ${jumpResourceSlug}`
}
