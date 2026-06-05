import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Tier 3 - Cross-Feature & Pairwise Interactions', () => {
  
  test('Register new TOURIST user -> immediately Login -> Verify JWT token role', async ({ request }) => {
    const email = `tourist_cross_${Date.now()}@example.com`;
    const password = 'password123';
    
    // 1. Register
    const regRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password,
        name: 'Cross Tourist',
        role: 'TOURIST',
      },
    });
    expect([200, 201]).toContain(regRes.status());

    // 2. Immediately Login
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email,
        password,
      },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.user.role).toBe('TOURIST');
    expect(loginBody.token).toBeDefined();
  });

  test('Register new OPERATOR user -> Login -> Call operator-only API route (Verify 200)', async ({ request }) => {
    const email = `operator_cross_${Date.now()}@example.com`;
    const password = 'password123';
    
    // 1. Register
    const regRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password,
        name: 'Cross Operator',
        role: 'OPERATOR',
      },
    });
    expect([200, 201]).toContain(regRes.status());

    // 2. Login
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email,
        password,
      },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    const token = loginBody.token;

    // 3. Call operator-only API route
    const opRes = await request.get(`${API_URL}/operator/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(opRes.status()).toBe(200);
  });

  test('Register new RESPONDER user -> Login -> Access /dashboard/responder -> Access /dashboard/tourist (Verify redirection)', async ({ page, request }) => {
    const email = `responder_cross_${Date.now()}@example.com`;
    const password = 'password123';
    
    // 1. Register and Login to get tokens
    await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password,
        name: 'Cross Responder',
        role: 'RESPONDER',
      },
    });

    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email,
        password,
      },
    });
    
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    const token = loginBody.token;
    const user = loginBody.user;

    // 2. Access /dashboard/responder via UI with seeded credentials
    await page.addInitScript((data) => {
      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user', JSON.stringify(data.user));
    }, { token, user });

    await page.goto('/dashboard/responder');
    await page.waitForURL('**/dashboard/responder**');
    expect(page.url()).toContain('/dashboard/responder');

    // 3. Attempt to navigate to /dashboard/tourist
    await page.goto('/dashboard/tourist');
    await page.waitForTimeout(2000);
    // Should be redirected or blocked
    expect(page.url()).not.toContain('/dashboard/tourist');
  });

  test('Login as seeded ADMIN -> access user list endpoint -> Verify seeded users exist', async ({ request }) => {
    // 1. Login as ADMIN
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    const token = loginBody.token;

    // 2. Fetch all users
    const listRes = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(listRes.status()).toBe(200);
    const users = await listRes.json();

    // 3. Verify seeded accounts are present
    const emails = users.map((u: any) => u.email);
    expect(emails).toContain('tourist@demo.com');
    expect(emails).toContain('operator@demo.com');
    expect(emails).toContain('responder@demo.com');
    expect(emails).toContain('admin@demo.com');
  });

  test('Login -> delete token/simulate logout -> access protected API (Verify 401) -> Login again -> access restored', async ({ request }) => {
    // 1. Login
    const loginRes1 = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: 'password123',
      },
    });
    expect(loginRes1.status()).toBe(200);
    const token1 = (await loginRes1.json()).token;

    // Verify authorized access to profile endpoint
    const accessRes1 = await request.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token1}`,
      },
    });
    expect(accessRes1.status()).toBe(200);

    // 2. Delete token / Access protected route with no auth header
    const accessRes2 = await request.get(`${API_URL}/auth/me`);
    expect(accessRes2.status()).toBe(401);

    // 3. Login again
    const loginRes2 = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: 'password123',
      },
    });
    expect(loginRes2.status()).toBe(200);
    const token2 = (await loginRes2.json()).token;

    // Verify restored access
    const accessRes3 = await request.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token2}`,
      },
    });
    expect(accessRes3.status()).toBe(200);
  });
});
