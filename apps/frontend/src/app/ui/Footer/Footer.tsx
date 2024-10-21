'use client';
import React from 'react';
import { GitHubLink } from './GitHubLink/GitHubLink';
import { CustomHtml } from './CustomHtml/CustomHtml';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../../api/ApiQueryMagazine';

export function Footer() {
  const { data: customization } = useSuspenseQuery(
    ApiQueryMagazine.getCustomization(),
  );

  return (
    <>
      <CustomHtml customization={customization} />
      <GitHubLink />
    </>
  );
}
