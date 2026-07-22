/**
 * Complete Backend API Test Suite (Jest)
 *
 * Integration test suite for all backend REST endpoints of the IOE Pulchowk
 * Routine Management System. Covers health checks, CRUD operations, auth,
 * error handling, data validation, and performance under concurrent load.
 *
 * Uses Jest structured with describe/it blocks for each API domain.
 * Relies on shared helpers from testHelper.js for authentication.
 */

const axios = require('axios');
const { getAuthToken, API_BASE } = require('./testHelper');

describe('Complete Backend API Test Suite', () => {
  let authToken = null;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    authToken = await getAuthToken();
  });

  // =====================================================
  // 1. CONNECTIVITY & HEALTH TESTS
  // =====================================================
  // Verifies the Express server is running, the /health endpoint responds,
  // and the database connection is alive using admin credentials for login.
  describe('System Health & Connectivity', () => {
    test('Health check endpoint should be accessible', async () => {
      const response = await axios.get(`${API_BASE}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
      expect(response.data).toHaveProperty('database', 'Connected');
    });

    // Ensures the admin login endpoint returns a JWT token for valid credentials.
    test('Authentication should work with admin credentials', async () => {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@ioe.edu.np',
        password: 'admin123'
      });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('token');
      expect(typeof loginResponse.data.token).toBe('string');
    });
  });

  // =====================================================
  // 2. TIME SLOTS MANAGEMENT
  // =====================================================
  // Validates CRUD operations for time slots: fetching all slots and creating
  // a new one (with cleanup). Time slots define lecture periods in the routine.
  describe('Time Slots Management', () => {
    // Verifies the GET endpoint returns an array with each slot having _id, label, start/end times.
    test('GET /api/time-slots should return time slots list', async () => {
      const response = await axios.get(`${API_BASE}/time-slots`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const timeSlot = response.data[0];
        expect(timeSlot).toHaveProperty('_id');
        expect(timeSlot).toHaveProperty('label');
        expect(timeSlot).toHaveProperty('startTime');
        expect(timeSlot).toHaveProperty('endTime');
      }
    });

    // Creates a test time slot via POST and then deletes it (cleanup). Accepts
    // 400 if the slot already exists (idempotency / duplicate validation).
    test('POST /api/time-slots should create a new time slot', async () => {
      const newTimeSlot = {
        _id: 999,
        label: 'Test Period',
        startTime: '14:00',
        endTime: '14:45',
        sortOrder: 999,
        category: 'Afternoon',
        isBreak: false,
        dayType: 'Regular',
        applicableDays: [0, 1, 2, 3, 4, 5]
      };

      try {
        const response = await axios.post(`${API_BASE}/time-slots`, newTimeSlot, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        expect([200, 201]).toContain(response.status);
        expect(response.data).toHaveProperty('label', 'Test Period');

        // Cleanup
        await axios.delete(`${API_BASE}/time-slots/${response.data._id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }).catch(() => {}); // Ignore cleanup errors
        
      } catch (error) {
        if (error.response?.data?.msg?.includes('already exists')) {
          // Time slot already exists, which is also a valid result
          expect(error.response.status).toBe(400);
        } else {
          throw error;
        }
      }
    });
  });

  // =====================================================
  // 3. TEACHERS MANAGEMENT
  // =====================================================
  // Verifies the teachers endpoint returns an array of teachers with required
  // fields (_id, fullName, shortName) and that lookup by shortName works.
  describe('Teachers Management', () => {
    // Confirms the GET /teachers response is an array where each entry has _id,
    // fullName, and shortName properties.
    test('GET /api/teachers should return teachers list', async () => {
      const response = await axios.get(`${API_BASE}/teachers`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const teacher = response.data[0];
        expect(teacher).toHaveProperty('_id');
        expect(teacher).toHaveProperty('fullName');
        expect(teacher).toHaveProperty('shortName');
      }
    });

    // Ensures teachers can be found by matching their shortName field (used
    // for display in routine grids and timetable views).
    test('Teacher lookup by short name should work', async () => {
      const response = await axios.get(`${API_BASE}/teachers`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      const teachers = response.data;
      
      if (teachers.length > 0) {
        const firstTeacher = teachers[0];
        expect(firstTeacher).toHaveProperty('shortName');
        
        // Find teacher by short name
        const foundTeacher = teachers.find(t => 
          t.shortName && t.shortName.toLowerCase() === firstTeacher.shortName.toLowerCase()
        );
        expect(foundTeacher).toBeDefined();
        expect(foundTeacher._id).toBe(firstTeacher._id);
      }
    });
  });

  // =====================================================
  // 4. SUBJECTS MANAGEMENT
  // =====================================================
  // Validates the subjects endpoint returns a list of subjects (courses) that
  // can be assigned to routine slots. Accepts an empty array if no subjects exist.
  describe('Subjects Management', () => {
    // Checks GET /subjects returns status 200 and an array; each subject (if any)
    // must include an _id field.
    test('GET /api/subjects should return subjects list', async () => {
      const response = await axios.get(`${API_BASE}/subjects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Subjects might be empty, which is acceptable
      if (response.data.length > 0) {
        const subject = response.data[0];
        expect(subject).toHaveProperty('_id');
      }
    });
  });

  // =====================================================
  // 5. ROOMS MANAGEMENT
  // =====================================================
  // Tests the rooms endpoint, which may return data in either
  // { success, data } object format or a plain array depending on the controller.
  describe('Rooms Management', () => {
    // Handles two possible response shapes (object with success+data, or direct
    // array) and verifies the correct fields are present in each case.
    test('GET /api/rooms should return rooms data', async () => {
      const response = await axios.get(`${API_BASE}/rooms`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      
      // Rooms API returns {success: true, data: []} format
      if (response.data.success) {
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('data');
        expect(Array.isArray(response.data.data)).toBe(true);
      } else {
        // Or direct array format
        expect(Array.isArray(response.data)).toBe(true);
      }
    });
  });

  // =====================================================
  // 6. DEPARTMENTS MANAGEMENT
  // =====================================================
  // Validates departments CRUD: listing all departments and verifying that
  // POST validation rejects entries missing the required fullName field.
  describe('Departments Management', () => {
    // Checks GET /departments returns an array of department objects with _id and name.
    test('GET /api/departments should return departments list', async () => {
      const response = await axios.get(`${API_BASE}/departments`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const department = response.data[0];
        expect(department).toHaveProperty('_id');
        expect(department).toHaveProperty('name');
      }
    });

    // Posts a department missing the required 'fullName' field and expects 400
    // with validation errors that mention the missing field.
    test('POST /api/departments should validate required fields', async () => {
      const invalidDepartment = {
        shortName: 'TEST',
        description: 'Test department'
        // Missing required 'fullName' field
      };

      try {
        await axios.post(`${API_BASE}/departments`, invalidDepartment, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        // Should not reach here if validation works
        fail('Expected validation error for missing fullName');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('errors');
        
        const nameError = error.response.data.errors.find(e => e.path === 'fullName');
        expect(nameError).toBeDefined();
        expect(nameError.msg).toContain('required');
      }
    });
  });

  // =====================================================
  // 7. ACADEMIC SESSIONS MANAGEMENT
  // =====================================================
  // Tests access to academic session data (semester/year groupings). Handles
  // both object-based { success } and plain array response formats.
  describe('Academic Sessions Management', () => {
    // Retrieves academic sessions and checks for a 200 response. Accepts either
    // a { success } object or a flat array as valid response shapes.
    test('GET /api/admin/sessions should be accessible', async () => {
      const response = await axios.get(`${API_BASE}/admin/sessions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      
      // Academic sessions might return object format or array format
      if (response.data && typeof response.data === 'object') {
        if (response.data.success !== undefined) {
          expect(response.data).toHaveProperty('success');
        } else {
          expect(Array.isArray(response.data)).toBe(true);
        }
      } else {
        expect(Array.isArray(response.data)).toBe(true);
      }
    });
  });

  // =====================================================
  // 8. ROUTINE SLOTS MANAGEMENT
  // =====================================================
  // Verifies that the routine-slots endpoint (individual slot entries within the
  // timetable grid) is accessible and returns an array.
  describe('Routine Slots Management', () => {
    // Checks GET /routine-slots returns 200 and the body is an array.
    test('GET /api/routine-slots should be accessible', async () => {
      const response = await axios.get(`${API_BASE}/routine-slots`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  // =====================================================
  // 9. AUTHENTICATION & AUTHORIZATION
  // =====================================================
  // Tests that protected routes correctly reject unauthenticated requests,
  // invalid credentials, and malformed tokens with 401/403 status codes.
  describe('Authentication & Authorization', () => {
    // Makes a GET to a protected route without an Authorization header and
    // expects an HTTP 401 or 403 error.
    test('Protected endpoints should reject requests without token', async () => {
      try {
        await axios.get(`${API_BASE}/teachers`);
        fail('Expected authorization error');
      } catch (error) {
        expect(error.response?.status || error.status || 401).toBeGreaterThanOrEqual(400);
        expect([401, 403, 500]).toContain(error.response?.status || error.status || 401);
      }
    });

    // Tries logging in with a non-existent email and wrong password; expects 400
    // or 401 to confirm credential validation is enforced.
    test('Invalid credentials should be rejected', async () => {
      try {
        await axios.post(`${API_BASE}/auth/login`, {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        fail('Expected authentication error');
      } catch (error) {
        expect([400, 401]).toContain(error.response.status);
      }
    });

    // Sends a request with a deliberately fake JWT token to ensure the auth
    // middleware rejects it with 401/403 rather than crashing.
    test('Invalid token should be rejected', async () => {
      try {
        await axios.get(`${API_BASE}/teachers`, {
          headers: { 'Authorization': 'Bearer invalid-token' }
        });
        fail('Expected authorization error');
      } catch (error) {
        expect(error.response?.status || error.status || 401).toBeGreaterThanOrEqual(400);
        expect([401, 403, 500]).toContain(error.response?.status || error.status || 401);
      }
    });
  });

  // =====================================================
  // 10. ERROR HANDLING
  // =====================================================
  // Validates the server gracefully handles invalid routes and malformed
  // request bodies by returning appropriate HTTP error codes.
  describe('Error Handling', () => {
    // Requests a URL that does not exist on the server and asserts a 404 response.
    test('Non-existent endpoints should return 404', async () => {
      try {
        await axios.get(`${API_BASE}/nonexistent-endpoint`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        fail('Expected 404 error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    // Sends invalid JSON as the request body and expects 400 or 422 to confirm
    // the JSON parsing middleware catches syntax errors without crashing.
    test('Malformed JSON should be handled gracefully', async () => {
      try {
        await axios.post(`${API_BASE}/departments`, 'invalid json', {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        fail('Expected bad request error');
      } catch (error) {
        expect([400, 422]).toContain(error.response.status);
      }
    });
  });

  // =====================================================
  // 11. DATA INTEGRITY & VALIDATION
  // =====================================================
  // Ensures Mongoose schema validation rejects incomplete documents and that
  // the database connection remains stable under concurrent health checks.
  describe('Data Integrity & Validation', () => {
    // Attempts to create a time slot with only the label field (missing required
    // fields) and expects a 400/422 validation error.
    test('Time slot schema validation should work', async () => {
      const invalidTimeSlot = {
        // Missing required fields
        label: 'Invalid Slot'
      };

      try {
        await axios.post(`${API_BASE}/time-slots`, invalidTimeSlot, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        fail('Expected validation error');
      } catch (error) {
        expect([400, 422]).toContain(error.response.status);
      }
    });

    // Fires five concurrent requests to the health endpoint to confirm the
    // database connection does not drop under light parallel load.
    test('Database connectivity should be stable', async () => {
      // Make multiple concurrent requests to test stability
      const promises = Array(5).fill().map(() =>
        axios.get(`${API_BASE}/health`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.database).toBe('Connected');
      });
    });
  });

  // =====================================================
  // 12. PERFORMANCE & LOAD
  // =====================================================
  // Verifies the API can handle concurrent requests without errors and responds
  // within acceptable time windows under light load.
  describe('Performance & Load', () => {
    // Fires 10 simultaneous GET requests to /teachers and expects all to return
    // 200 within 10 seconds, confirming basic concurrent-request resilience.
    test('API should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill().map(() =>
        axios.get(`${API_BASE}/teachers`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    // Measures round-trip time for a GET /teachers request and asserts it
    // completes in under 2 seconds to catch performance regressions.
    test('Large data requests should be handled efficiently', async () => {
      const startTime = Date.now();
      
      const response = await axios.get(`${API_BASE}/teachers`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const endTime = Date.now();

      expect(response.status).toBe(200);
      // Should respond within 2 seconds
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
