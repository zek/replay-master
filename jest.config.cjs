/** @type {import('ts-jest/presets').defaultsESM} */
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.m?[tj]s?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.(m)?js$': '$1',
  },
  coverageDirectory: "./coverage",
  rootDir: "./",
  roots: [
    "./test"
  ],
  setupFiles: ["dotenv/config"],
};
