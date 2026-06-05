import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F2 Boundaries - User Login', () => {
  test('Login with non-existent email (returns 401/404)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'doesnotexist@demo.com',
        password: 'password123',
      },
    });
    expect([401, 404]).toContain(res.status());
  });

  test('Login with incorrect password (returns 401)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: 'wrongpassword',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Login with empty/missing email or password (returns 400)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: '',
        password: '',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Login with SQL injection attempts in email/password (returns gracefully, no crash)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: "' OR '1'='1",
        password: "' OR '1'='1",
      },
    });
    // SQL injection shouldn't crash backend. It should return 400 or 401.
    expect([400, 401]).toContain(res.status());
  });

  test('Login with malformed email format (returns 400/401)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'notanemail',
        password: 'password123',
      },
    });
    expect([400, 401]).toContain(res.status());
  });
});
