import { createFilter, PluginOption } from 'vite';

/**
 * https://stackoverflow.com/questions/78744180/vite-react-use-client-sourcemap-warning
 */
export function removeUseClient(): PluginOption {
  const filter = createFilter(/.*\.(js|ts|jsx|tsx)$/);

  return {
    name: 'remove-use-client',

    transform(code: string, id: string) {
      if (!filter(id)) {
        return null;
      }

      const newCode = code.replace(/['"]use client['"];\s*/g, '');

      return { code: newCode, map: null };
    },
  };
}
