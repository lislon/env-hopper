import React from 'react';
import { EhCustomization } from '@env-hopper/types';

export interface CustomHtmlProps {
  customization: EhCustomization;
}

export function CustomHtml({ customization: { footerHtml } }: CustomHtmlProps) {
  return (
    <>
      {footerHtml !== '' ? (
        <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
      ) : null}
    </>
  );
}
