import React from 'react';
import GitHubIconForDark from './github-mark-white.svg?react';
import GitHubIconForLight from './github-mark.svg?react';

export function GitHubLink() {
  return (
    <a
      href="https://github.com/lislon/env-hopper"
      className="hover:underline"
      title="Source code"
    >
      <div className="flex justify-center items-center gap-1">
        <div>
          <GitHubIconForDark
            width="16px"
            height="16px"
            className="hidden dark:block"
          />
          <GitHubIconForLight
            width="16px"
            height="16px"
            className="dark:hidden"
          />
        </div>
        lislon/env-hopper
      </div>
    </a>
  );
}
