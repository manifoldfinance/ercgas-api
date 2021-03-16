module.exports = {
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
    },
  },
  automock: false,
  setupFiles: [
    './jest.setup.js',
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
    '__tests__/(.*)': '<rootDir>/__tests__/$1',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
};