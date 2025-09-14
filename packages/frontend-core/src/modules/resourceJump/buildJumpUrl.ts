import type {
  EnvSlug,
  JumpResouceSlug,
  ResourceJumpsData,
} from '@env-hopper/backend-core'

export function buildJumpUrl(
  jumpResourceSlug: JumpResouceSlug | undefined,
  envSlug: EnvSlug | undefined,
  resourceJumps: ResourceJumpsData,
): string {
  const { baseResouceJumpUrls, resourceJumpsData, envData } = resourceJumps

  const baseUrl = baseResouceJumpUrls[jumpResourceSlug || ''] || ''
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
