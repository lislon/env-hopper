// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import rootConfig from '@root/eslint.config.mjs';

export default [
  ...rootConfig,
  {
    files: ['src/**/*.{ts}', 'tests/**/*.{ts}'],
  },
];
