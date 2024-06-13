const config = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!dist/**/*'
  ],
  coverageReporters: ['json', 'lcov', 'text'],
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)'],
  testPathIgnorePatterns: [
    'node_modules/',
    'dist/',
    '\\.d\\.ts$' // This line ignores all .d.ts files
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  }
};

module.exports = config;