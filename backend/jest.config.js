/**
 * Jest configuration for the backend test suite.
 *
 * - Targets the comprehensive backend test file only.
 * - Enables code coverage for controllers, models, routes, and utils.
 * - Uses `__tests__/setup.js` for global test lifecycle hooks.
 * - Forces exit after test completion to handle lingering handles.
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/backend-complete.test.js'  // Only run our comprehensive test file
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000
};
