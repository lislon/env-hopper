/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  plugins: [
    // to get docker container export image
    // https://github.com/felipecrs/semantic-release-export-data#github-actions-example
    'semantic-release-export-data',
    '@semantic-release/github'
  ]
};
