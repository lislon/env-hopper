import { PluginOption } from 'vite';

export function mockSvg(): PluginOption {
  return {
    name: 'mockSvg',
    enforce: 'pre',
    transform(_, id) {
      if (id.endsWith('.svg')) {
        return 'export default () => {}';
      }
      return undefined;
    },
  };
}
