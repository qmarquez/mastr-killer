import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/",
    "./jest.config.ts"
  ],
  collectCoverageFrom: [
    "**/*.(t|j)s"
  ],
};

export default config;