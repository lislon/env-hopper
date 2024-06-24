/* eslint-disable */
export default {
  displayName: 'frontend',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.svg$': 'jest-transformer-svg',
  },
  moduleNameMapper: {
    '\\.svg[?]react$': '<rootDir>/src/app/__mocks__/svg.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx'],
  coverageDirectory: '../../coverage/listApps/frontend',
};
