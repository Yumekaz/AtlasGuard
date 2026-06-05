import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F3 - NestJS API RBAC Guard Enforcement', () => {
  // Helper to obtain a token for a given role
  async function getTokenForRole(request: any, role: string) {
    const email = `${role.toLowerCase()}_rbac_test@example.com`;
    // Register
    await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password: 'password123',
        name: `${role} User`,
        role,
      },
    });
    // Login to get clean token
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email,
        password: 'password123',
      },
    });
    if (loginRes.ok()) {
      const body = await loginRes.json();
      return body.token;
    }
    return null;
  }

  test('TOURIST token cannot access admin routes (returns 403 Forbidden)', async ({ request }) => {
    const token = await getTokenForRole(request, 'TOURIST');
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('OPERATOR token can access operator routes but not admin routes (returns 403)', async ({ request }) => {
    const token = await getTokenForRole(request, 'OPERATOR');
    
    // Access operator route - success (200 or 201)
    const opRes = await request.get(`${API_URL}/operator/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(opRes.status()).not.toBe(403);
    expect(opRes.status()).not.toBe(401);

    // Access admin route - forbidden (403)
    const adminRes = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(adminRes.status()).toBe(403);
  });

  test('RESPONDER token can access responder routes but not operator or admin routes', async ({ request }) => {
    const token = await getTokenForRole(request, 'RESPONDER');

    // Access responder route - success
    const respRes = await request.get(`${API_URL}/responder/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(respRes.status()).not.toBe(403);
    expect(respRes.status()).not.toBe(401);

    // Access operator route - forbidden (403)
    const opRes = await request.get(`${API_URL}/operator/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(opRes.status()).toBe(403);

    // Access admin route - forbidden (403)
    const adminRes = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(adminRes.status()).toBe(403);
  });

  test('ADMIN token can access all protected API endpoints', async ({ request }) => {
    const token = await getTokenForRole(request, 'ADMIN');

    // Admin endpoint
    const adminRes = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(adminRes.status()).not.toBe(403);
    expect(adminRes.status()).not.toBe(401);

    // Operator endpoint
    const opRes = await request.get(`${API_URL}/operator/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(opRes.status()).not.toBe(403);
    expect(opRes.status()).not.toBe(401);

    // Responder endpoint
    const respRes = await request.get(`${API_URL}/responder/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(respRes.status()).not.toBe(403);
    expect(respRes.status()).not.toBe(401);
  });

  test('Unauthenticated request to protected routes returns 401 Unauthorized', async ({ request }) => {
    const adminRes = await request.get(`${API_URL}/admin/users`);
    expect(adminRes.status()).toBe(401);

    const opRes = await request.get(`${API_URL}/operator/incidents`);
    expect(opRes.status()).toBe(401);

    const respRes = await request.get(`${API_URL}/responder/incidents`);
    expect(respRes.status()).toBe(401);
  });
});
