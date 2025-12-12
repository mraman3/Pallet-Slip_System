const { createDefaultPreset } = require("ts-jest");
const tsJestTransformCfg = createDefaultPreset().transform;

// Load .env so we can read DATABASE_URL_TEST
require("dotenv").config();

// Force Prisma to use the test database when running Jest
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Only pick up files in tests/ folder
  testMatch: ["**/tests/**/*.test.ts"],

  transform: {
    ...tsJestTransformCfg,
  },

  modulePaths: ["<rootDir>/src"],

  // Prisma sometimes needs more timeout
  testTimeout: 20000,
  maxWorkers: 1,
};
