import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4001/graphql',
  documents: 'src/**/*.{ts,tsx}',
  generates: {
    './src/graphql-types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
    },
  },
  hooks: {},
};

export default config; 