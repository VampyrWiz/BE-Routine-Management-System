/**
 * Jest global test setup file.
 *
 * Runs before all test suites to configure timeouts and register
 * global assertion helpers for validating MongoDB ObjectIds and dates.
 * Closes any active Mongoose connection after all tests complete.
 */

const mongoose = require('mongoose');

// Set test timeout
jest.setTimeout(30000);

// Setup test environment
beforeAll(async () => {
  // Any global setup for tests
});

afterAll(async () => {
  // Close database connections after all tests
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

/**
 * Asserts that a value is a valid 24-hex-character MongoDB ObjectId string.
 */
global.expectValidObjectId = (id) => {
  expect(id).toBeDefined();
  expect(typeof id).toBe('string');
  expect(id).toMatch(/^[0-9a-fA-F]{24}$/);
};

/**
 * Asserts that a value is a valid Date object (or string coercible to one).
 */
global.expectValidDate = (date) => {
  expect(date).toBeDefined();
  expect(new Date(date)).toBeInstanceOf(Date);
  expect(new Date(date).toString()).not.toBe('Invalid Date');
};
