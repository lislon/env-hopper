'use client';
import React from 'react';
import { GitHubLink } from './GitHubLink/GitHubLink';

export function Footer() {
  return (
    <footer className="mt-8 w-full p-4 flex justify-end items-end gap-4 flex-grow">
      {/*<CustomHtml />*/}
      <GitHubLink />
    </footer>
  );
}
