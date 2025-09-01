import React from 'react';
import GitHubIconForDark from './github-mark-white.svg?react';
import GitHubIconForLight from './github-mark.svg?react';
import { useTheme } from '../../../context/ThemeContext';

export function GitHubLink() {
  const { currentTheme } = useTheme();
  return (
    <div>
      <a
        href="https://github.com/lislon/env-hopper"
        className="hover:underline"
        title="Source code"
      >
        <div className="flex justify-center items-center gap-1">
          <div>
            {currentTheme === 'dark' && (
              <GitHubIconForDark width="16px" height="16px" />
            )}
            {currentTheme === 'light' && (
              <GitHubIconForLight width="16px" height="16px" />
            )}
          </div>
          lislon/env-hopper
        </div>
      </a>
    </div>
  );
}
