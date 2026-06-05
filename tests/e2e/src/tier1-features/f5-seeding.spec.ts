import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F5 - SQLite Database Seeding Validation', () => {
  test('Verify TOURIST demo account exists and can log in', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: 'password123',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('TOURIST');
    expect(body.user.email).toBe('tourist@demo.com');
  });

  test('Verify OPERATOR demo account exists and can log in', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'operator@demo.com',
        password: 'password123',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('OPERATOR');
    expect(body.user.email).toBe('operator@demo.com');
  });

  test('Verify RESPONDER demo account exists and can log in', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'responder@demo.com',
        password: 'password123',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('RESPONDER');
    expect(body.user.email).toBe('responder@demo.com');
  });

  test('Verify ADMIN demo account exists and can log in', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
    expect(body.user.email).toBe('admin@demo.com');
  });

  test('Verify seed response payload contains correct user profile fields and token', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('name');
    expect(body.user).toHaveProperty('role');
  });
});
