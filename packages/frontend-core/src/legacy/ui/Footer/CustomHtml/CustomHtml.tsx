import type { LegacyCustomization } from '../../../adapter/legacyApi'

export interface CustomHtmlProps {
  customization: LegacyCustomization
}

export function CustomHtml({ customization: { footerHtml } }: CustomHtmlProps) {
  return (
    <>
      {footerHtml !== '' ? (
        <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
      ) : null}
    </>
  )
}
