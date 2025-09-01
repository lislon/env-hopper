import { useCallback } from 'react';

export type UsePrefetchReturn = (url: string) => void;

/**
 * Prefetches a given URL in background that probably be needed in the future.
 */
export function usePrefetch(): UsePrefetchReturn {
  return useCallback((url) => {
    const id = 'eh-preload';
    const old = document.getElementById(id) as HTMLLinkElement | null;
    if (old?.href !== 'url') {
      old?.remove();
      const link = document.createElement('link');
      link.rel = 'prerender';
      link.href = url;
      link.id = id;
      document.head.appendChild(link);
    }
  }, []);
}
