import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F2 - User Login & JWT Generation', () => {
  test('Successful login with tourist demo credentials (tourist@demo.com / password123)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: 'password123',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.email).toBe('tourist@demo.com');
    expect(body.user.role).toBe('TOURIST');
    expect(body.token).toBeDefined();
  });

  test('Successful login with operator demo credentials (operator@demo.com / password123)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'operator@demo.com',
        password: 'password123',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.email).toBe('operator@demo.com');
    expect(body.user.role).toBe('OPERATOR');
    expect(body.token).toBeDefined();
  });

  test('Successful login with responder demo credentials (responder@demo.com / password123)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'responder@demo.com',
        password: 'password123',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.email).toBe('responder@demo.com');
    expect(body.user.role).toBe('RESPONDER');
    expect(body.token).toBeDefined();
  });

  test('Successful login with admin demo credentials (admin@demo.com / password123)', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.email).toBe('admin@demo.com');
    expect(body.user.role).toBe('ADMIN');
    expect(body.token).toBeDefined();
  });

  test('Verify response payload format contains user object and JWT token', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: 'password123',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('token');
    
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('name');
    expect(body.user).toHaveProperty('role');
    
    expect(typeof body.user.id).toBe('string');
    expect(typeof body.user.email).toBe('string');
    expect(typeof body.user.name).toBe('string');
    expect(typeof body.user.role).toBe('string');
    expect(typeof body.token).toBe('string');
  });
});
