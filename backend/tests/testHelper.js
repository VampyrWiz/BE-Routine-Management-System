/**
 * Test Helper Utilities
 *
 * Shared configuration, authentication wrappers, sample test data templates,
 * and utility functions used by all test suites in the project.
 * Reduces duplication by centralising API base URL, admin credentials,
 * authenticated request helpers, and common validators.
 */

const axios = require('axios');
const mongoose = require('mongoose');

// Base URL for all API requests during testing.
const API_BASE = 'http://localhost:7102/api';

// Predefined admin credentials for authenticating test requests.
const adminCredentials = {
  email: 'admin@ioe.edu.np',
  password: 'admin123'
};

// Placeholder; the test environment reuses the existing live DB connection
// rather than spinning up a dedicated test database.
async function connectTestDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Test DB: Using existing connection');
    }
    return true;
  } catch (error) {
    console.error('Test DB connection failed:', error.message);
    return false;
  }
}

// Placeholder — does not actually drop collections. Logs a message to indicate
// cleanup would occur, avoiding accidental data loss during test runs.
async function clearTestDB() {
  try {
    console.log('Test DB: Cleanup simulated');
    return true;
  } catch (error) {
    console.error('Test DB cleanup failed:', error.message);
    return false;
  }
}

// Placeholder — does not disconnect Mongoose. Logs a message instead, keeping
// the connection alive for subsequent tests in the same process.
async function closeTestDB() {
  try {
    console.log('Test DB: Connection close simulated');
    return true;
  } catch (error) {
    console.error('Test DB close failed:', error.message);
    return false;
  }
}

// Authenticates with admin credentials and returns the JWT token string.
// Throws if login fails, which will cause the calling test to fail fast.
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    return response.data.token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw new Error('Failed to get auth token');
  }
}

// Sample payload templates for creating test records. Each entry contains
// realistic-but-fake data for the corresponding resource type.
const testData = {
  teacher: {
    name: 'Test Teacher',
    shortName: 'TT',
    email: 'test@ioe.edu.np',
    department: 'Computer Engineering',
    position: 'Lecturer',
    isActive: true
  },
  subject: {
    code: 'TEST101',
    name: 'Test Subject',
    creditHours: 3,
    type: 'Theory',
    year: 4,
    semester: 7,
    isActive: true
  },
  room: {
    number: 'TEST-101',
    name: 'Test Room',
    capacity: 60,
    type: 'Classroom',
    isActive: true
  },
  timeSlot: {
    startTime: '10:15',
    endTime: '11:00',
    slotIndex: 0,
    displayName: '10:15-11:00 AM',
    category: 'CLASS',
    isActive: true
  }
};

/**
 * Login as admin and return auth token
 * Identical to getAuthToken() but re-throws the original error instead of
 * wrapping it, giving callers more control over error handling.
 */
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

/**
 * Make authenticated API request
 * Generic wrapper around axios that attaches a Bearer token header.
 * If no token is provided, it logs in as admin automatically.
 * Always returns a structured { success, status, data/error } object,
 * never throws — callers should check the `success` flag.
 */
async function makeAuthenticatedRequest(method, endpoint, data = null, token = null) {
  if (!token) {
    token = await loginAsAdmin();
  }

  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: { 'Authorization': `Bearer ${token}` }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test API endpoint availability
 * Performs a simple GET without auth to check whether an endpoint is reachable.
 * Returns { available, status } rather than throwing on non-2xx responses.
 */
async function testEndpointAvailability(endpoint) {
  try {
    const response = await axios.get(`${API_BASE}${endpoint}`);
    return {
      available: true,
      status: response.status
    };
  } catch (error) {
    return {
      available: false,
      status: error.response?.status,
      error: error.message
    };
  }
}

/**
 * Clean up test data
 * Iterates over an array of created items and sends a DELETE request for each.
 * Silently swallows individual deletion failures so one failure does not abort
 * the cleanup of remaining items.
 */
async function cleanupTestData(token, resourceType, createdItems = []) {
  console.log(`Cleaning up ${resourceType} test data...`);
  
  for (const item of createdItems) {
    try {
      await makeAuthenticatedRequest('DELETE', `/${resourceType}/${item._id}`, null, token);
      console.log(`✅ Deleted ${resourceType}: ${item._id}`);
    } catch (error) {
      console.log(`⚠️ Failed to delete ${resourceType}: ${item._id}`);
    }
  }
}

/**
 * Wait for a specified amount of time
 * Simple promise-based delay for throttling test requests or waiting for
 * asynchronous side-effects to settle.
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test data
 * Produces a pseudo-random alphanumeric string of the given length.
 * Useful for creating unique test record names/emails to avoid collisions.
 */
function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Validate response structure
 * Checks that a response object (from makeAuthenticatedRequest) succeeded and
 * contains all the expected top-level fields in its data. Returns
 * { isValid, errors } for compositional assertion in tests.
 */
function validateResponse(response, expectedFields = []) {
  const errors = [];
  
  if (!response.success && response.status >= 400) {
    errors.push(`Request failed with status ${response.status}`);
  }
  
  if (response.success && response.data) {
    for (const field of expectedFields) {
      if (!(field in response.data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  API_BASE,
  adminCredentials,
  testData,
  connectTestDB,
  clearTestDB,
  closeTestDB,
  getAuthToken,
  loginAsAdmin,
  makeAuthenticatedRequest,
  testEndpointAvailability,
  cleanupTestData,
  wait,
  generateRandomString,
  validateResponse
};
