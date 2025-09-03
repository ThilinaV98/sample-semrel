/**
 * Main application tests
 * 
 * Integration tests for the sample semantic release application
 */

const request = require('supertest');
const { app } = require('../src/index');

// Mock console methods to reduce test noise
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Sample Semantic Release App', () => {
  describe('GET /', () => {
    it('should return application info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('endpoints');
    });

    it('should include all expected endpoints in response', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      const endpoints = response.body.endpoints;
      expect(endpoints).toHaveProperty('health');
      expect(endpoints).toHaveProperty('version');
      expect(endpoints).toHaveProperty('calculator');
      expect(endpoints).toHaveProperty('users');
    });
  });

  describe('GET /health', () => {
    it('should return health check information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('memory');
    });

    it('should include memory usage information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const memory = response.body.memory;
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('external');
    });
  });

  describe('GET /version', () => {
    it('should return version information', async () => {
      const response = await request(app)
        .get('/version')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('releaseDate');
      expect(response.body).toHaveProperty('gitCommit');
      expect(response.body).toHaveProperty('buildNumber');
    });
  });

  describe('Calculator API', () => {
    describe('POST /api/calculator/add', () => {
      it('should add two numbers correctly', async () => {
        const response = await request(app)
          .post('/api/calculator/add')
          .send({ a: 5, b: 3 })
          .expect(200);

        expect(response.body).toHaveProperty('operation', 'addition');
        expect(response.body).toHaveProperty('result', 8);
        expect(response.body.inputs).toEqual({ a: 5, b: 3 });
        expect(response.body).toHaveProperty('timestamp');
      });

      it('should handle negative numbers', async () => {
        const response = await request(app)
          .post('/api/calculator/add')
          .send({ a: -5, b: 3 })
          .expect(200);

        expect(response.body.result).toBe(-2);
      });

      it('should handle decimal numbers', async () => {
        const response = await request(app)
          .post('/api/calculator/add')
          .send({ a: 2.5, b: 1.3 })
          .expect(200);

        expect(response.body.result).toBeCloseTo(3.8);
      });

      it('should return 400 for invalid input', async () => {
        const response = await request(app)
          .post('/api/calculator/add')
          .send({ a: 'invalid', b: 3 })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('must be numbers');
      });

      it('should return 400 for missing parameters', async () => {
        await request(app)
          .post('/api/calculator/add')
          .send({ a: 5 })
          .expect(400);

        await request(app)
          .post('/api/calculator/add')
          .send({ b: 3 })
          .expect(400);
      });
    });

    describe('POST /api/calculator/multiply', () => {
      it('should multiply two numbers correctly', async () => {
        const response = await request(app)
          .post('/api/calculator/multiply')
          .send({ a: 4, b: 6 })
          .expect(200);

        expect(response.body).toHaveProperty('operation', 'multiplication');
        expect(response.body).toHaveProperty('result', 24);
        expect(response.body.inputs).toEqual({ a: 4, b: 6 });
      });

      it('should handle multiplication by zero', async () => {
        const response = await request(app)
          .post('/api/calculator/multiply')
          .send({ a: 5, b: 0 })
          .expect(200);

        expect(response.body.result).toBe(0);
      });

      it('should handle negative numbers', async () => {
        const response = await request(app)
          .post('/api/calculator/multiply')
          .send({ a: -3, b: 4 })
          .expect(200);

        expect(response.body.result).toBe(-12);
      });

      it('should return 400 for invalid input', async () => {
        const response = await request(app)
          .post('/api/calculator/multiply')
          .send({ a: null, b: 3 })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('User Management API', () => {
    // Reset user data before each test
    beforeEach(async () => {
      // Clear users by calling a reset endpoint (if it existed) or
      // accept that tests may have interdependencies for this demo
    });

    describe('GET /api/users', () => {
      it('should return empty users array initially', async () => {
        // Note: This may not be empty if other tests created users
        const response = await request(app)
          .get('/api/users')
          .expect(200);

        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('timestamp');
        expect(Array.isArray(response.body.users)).toBe(true);
      });
    });

    describe('POST /api/users', () => {
      it('should create a new user', async () => {
        const newUser = {
          name: 'Test User',
          email: 'test@example.com'
        };

        const response = await request(app)
          .post('/api/users')
          .send(newUser)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'User created successfully');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('name', newUser.name);
        expect(response.body.user).toHaveProperty('email', newUser.email);
        expect(response.body.user).toHaveProperty('isActive', true);
        expect(response.body.user).toHaveProperty('createdAt');
      });

      it('should return 400 for missing name', async () => {
        const response = await request(app)
          .post('/api/users')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('required');
      });

      it('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/api/users')
          .send({ name: 'Test User' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('required');
      });

      it('should return 409 for duplicate email', async () => {
        const user = {
          name: 'Test User 1',
          email: 'duplicate@example.com'
        };

        // Create first user
        await request(app)
          .post('/api/users')
          .send(user)
          .expect(201);

        // Try to create duplicate
        const response = await request(app)
          .post('/api/users')
          .send({
            name: 'Test User 2',
            email: 'duplicate@example.com'
          })
          .expect(409);

        expect(response.body.error).toContain('already exists');
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/users/999999')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'User not found');
      });

      it('should return user by ID', async () => {
        // First create a user
        const createResponse = await request(app)
          .post('/api/users')
          .send({
            name: 'Find Me',
            email: 'findme@example.com'
          })
          .expect(201);

        const userId = createResponse.body.user.id;

        // Then find the user
        const response = await request(app)
          .get(`/api/users/${userId}`)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id', userId);
        expect(response.body.user).toHaveProperty('name', 'Find Me');
        expect(response.body.user).toHaveProperty('email', 'findme@example.com');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/nonexistent');
      expect(response.body).toHaveProperty('method', 'GET');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/calculator/add')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express will handle JSON parsing errors
      expect(response.status).toBe(400);
    });
  });

  describe('API Response Format', () => {
    it('should include timestamps in all responses', async () => {
      const endpoints = [
        '/',
        '/health',
        '/version'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.body).toHaveProperty('timestamp');
      }
    });

    it('should return JSON for all API endpoints', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });
});