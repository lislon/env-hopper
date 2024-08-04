/**
 * @type {import('semantic-release').GlobalConfig}
 * @link https://semantic-release.gitbook.io/semantic-release/usage/configuration
 */
export default {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    // https://github.com/felipecrs/semantic-release-export-data#github-actions-example
    'semantic-release-export-data',
    '@semantic-release/github',
  ],
};
