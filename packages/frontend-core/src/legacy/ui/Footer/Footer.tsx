'use client'
import { CustomHtml } from './CustomHtml/CustomHtml'
import { GitHubLink } from './GitHubLink/GitHubLink'
import { useLegacyCustomization } from '../../adapter/legacyApi'

export function Footer() {
  const customization = useLegacyCustomization()

  return (
    <>
      <CustomHtml customization={customization} />
      <GitHubLink />
    </>
  )
}
