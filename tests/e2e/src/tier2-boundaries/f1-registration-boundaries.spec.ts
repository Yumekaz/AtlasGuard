import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F1 Boundaries - User Registration', () => {
  test('Register with existing email (returns 400/409 error)', async ({ request }) => {
    // Attempt 1: register new user
    const email = 'existing_boundary_test@example.com';
    await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: 'password123',
        name: 'Existing Test',
        role: 'TOURIST',
      },
    });

    // Attempt 2: register with same email
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: 'password123',
        name: 'Existing Test Dupe',
        role: 'TOURIST',
      },
    });
    expect([400, 409]).toContain(res.status());
  });

  test('Register with invalid email format (returns 400)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'invalid-email-format',
        password: 'password123',
        name: 'Invalid Email Test',
        role: 'TOURIST',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Register with too short password (returns 400)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'short_pass@example.com',
        password: '123', // too short password (e.g. less than 6 or 8 chars)
        name: 'Short Pass Test',
        role: 'TOURIST',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Register with missing/empty fields (returns 400)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: '',
        password: '',
        name: '',
        role: 'TOURIST',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Register with invalid/unsupported role (returns 400)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'bad_role@example.com',
        password: 'password123',
        name: 'Bad Role Test',
        role: 'SUPER_HERO', // invalid role
      },
    });
    expect(res.status()).toBe(400);
  });
});
