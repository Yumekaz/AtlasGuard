import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F1 - User Registration', () => {
  test('Successful registration with role TOURIST', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'tourist_test@example.com',
        password: 'password123',
        name: 'Tourist Test',
        role: 'TOURIST',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.role).toBe('TOURIST');
    expect(body.token).toBeDefined();
  });

  test('Successful registration with role OPERATOR', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'operator_test@example.com',
        password: 'password123',
        name: 'Operator Test',
        role: 'OPERATOR',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.role).toBe('OPERATOR');
    expect(body.token).toBeDefined();
  });

  test('Successful registration with role RESPONDER', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'responder_test@example.com',
        password: 'password123',
        name: 'Responder Test',
        role: 'RESPONDER',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.role).toBe('RESPONDER');
    expect(body.token).toBeDefined();
  });

  test('Successful registration with role ADMIN', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'admin_test@example.com',
        password: 'password123',
        name: 'Admin Test',
        role: 'ADMIN',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
    expect(body.token).toBeDefined();
  });

  test('Verify response payload format contains { user: { id, email, name, role }, token }', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: 'format_test@example.com',
        password: 'password123',
        name: 'Format Test',
        role: 'TOURIST',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('token');
    
    const user = body.user;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('role');
    
    expect(typeof user.id).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof body.token).toBe('string');
  });
});
