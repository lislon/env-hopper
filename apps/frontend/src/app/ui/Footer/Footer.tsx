'use client';
import React from 'react';
import { GitHubLink } from './GitHubLink/GitHubLink';
import { CustomHtml } from './CustomHtml/CustomHtml';

export function Footer() {
  return <div className="mt-8 w-full p-4 flex justify-end items-end gap-4">
    <CustomHtml />
    <GitHubLink />
  </div>;
}
