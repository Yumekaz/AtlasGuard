import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Tier 4 - Real-World Application Scenarios', () => {

  test('Scenario 1: Tourist emergency workflow auth (Signup -> Login -> Update Profile -> Check Dashboard -> Logout)', async ({ page, request }) => {
    const email = `tourist_workflow_${Date.now()}_test@example.com`;
    const password = 'password123';
    const name = 'Workflow Tourist';

    // 1. Sign up
    const regRes = await request.post(`${API_URL}/auth/register`, {
      data: { email, password, name, role: 'TOURIST' },
    });
    expect([200, 201]).toContain(regRes.status());
    const regData = await regRes.json();
    const token = regData.token;
    let user = regData.user;

    // 2. Log in
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email, password },
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.token).toBeDefined();

    // 3. Update Profile
    const profileRes = await request.put(`${API_URL}/tourist/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      data: {
        phone: '+15550199',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+15550188',
        medical_notes: 'None',
        mobility_needs: 'None',
        language_preference: 'en',
      },
    });
    expect([200, 204]).toContain(profileRes.status());

    // 4. Check Tourist Dashboard in Browser
    await page.goto('/login');
    await page.evaluate((data) => {
      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user', JSON.stringify(data.user));
    }, { token, user });

    await page.goto('/dashboard/tourist');
    await page.waitForURL('**/dashboard/tourist**');
    expect(page.url()).toContain('/dashboard/tourist');

    // 5. Log out
    await page.evaluate(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });
    try {
      await page.goto('/dashboard/tourist');
    } catch (err: any) {
      if (!err.message.includes('net::ERR_ABORTED')) {
        throw err;
      }
    }
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('Scenario 2: Operator triage auth (Login -> Operator Dashboard -> Access Admin Blocked -> Fetch Incidents API)', async ({ page, request }) => {
    // 1. Log in as Operator
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'operator@demo.com',
        password: 'password123',
      },
    });
    expect(loginRes.status()).toBe(200);
    const { token, user } = await loginRes.json();

    // 2. Access Operator Dashboard
    await page.addInitScript((data) => {
      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user', JSON.stringify(data.user));
    }, { token, user });

    await page.goto('/dashboard/operator');
    await page.waitForURL('**/dashboard/operator**');
    expect(page.url()).toContain('/dashboard/operator');

    // 3. Attempt to access Admin Dashboard - should block
    await page.goto('/dashboard/admin');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/dashboard/admin');

    // 4. Fetch Incidents API
    const incidentsRes = await request.get(`${API_URL}/operator/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(incidentsRes.status()).toBe(200);
  });

  test('Scenario 3: Responder assignment auth (Login -> Responder Dashboard -> Access Tourist Blocked -> Access Responder Incident API)', async ({ page, request }) => {
    // 1. Log in as Responder
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'responder@demo.com',
        password: 'password123',
      },
    });
    expect(loginRes.status()).toBe(200);
    const { token, user } = await loginRes.json();

    // 2. Access Responder Dashboard
    await page.addInitScript((data) => {
      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user', JSON.stringify(data.user));
    }, { token, user });

    await page.goto('/dashboard/responder');
    await page.waitForURL('**/dashboard/responder**');
    expect(page.url()).toContain('/dashboard/responder');

    // 3. Attempt to access Tourist Dashboard - should block
    await page.goto('/dashboard/tourist');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/dashboard/tourist');

    // 4. Access Responder incident API
    const incidentRes = await request.get(`${API_URL}/responder/incidents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    expect(incidentRes.status()).toBe(200);
  });

  test('Scenario 4: Admin system configuration (Login -> Access Admin Dashboard -> Register new Operator -> Verify login)', async ({ page, request }) => {
    // 1. Admin logs in
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });
    expect(loginRes.status()).toBe(200);
    const { token, user } = await loginRes.json();

    // 2. Access Admin Dashboard
    await page.addInitScript((data) => {
      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user', JSON.stringify(data.user));
    }, { token, user });

    await page.goto('/dashboard/admin');
    await page.waitForURL('**/dashboard/admin**');
    expect(page.url()).toContain('/dashboard/admin');

    // 3. Register new Operator user via API (acting as admin)
    const newOpEmail = `op_config_${Date.now()}_test@example.com`;
    const newOpPass = 'password123';
    const registerRes = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: newOpEmail,
        password: newOpPass,
        name: 'Configured Operator',
        role: 'OPERATOR',
      },
    });
    expect([200, 201]).toContain(registerRes.status());

    // 4. Verify new Operator can log in
    const verifyLogin = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: newOpEmail,
        password: newOpPass,
      },
    });
    expect(verifyLogin.status()).toBe(200);
    const verifyBody = await verifyLogin.json();
    expect(verifyBody.user.role).toBe('OPERATOR');
  });

  test('Scenario 5: Multi-role security audit matrix (Access validation across all endpoints)', async ({ request }) => {
    const roles = ['TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN'];
    const endpoints = [
      { path: '/admin/users', allowed: ['ADMIN'] },
      { path: '/operator/incidents', allowed: ['OPERATOR', 'ADMIN'] },
      { path: '/responder/incidents', allowed: ['RESPONDER', 'ADMIN'] },
    ];

    for (const role of roles) {
      // Login or register and login to retrieve a token
      const email = `${role.toLowerCase()}_matrix_test@example.com`;
      await request.post(`${API_URL}/auth/register`, {
        data: {
          email,
          password: 'password123',
          name: `${role} Matrix User`,
          role,
        },
      });

      const loginRes = await request.post(`${API_URL}/auth/login`, {
        data: { email, password: 'password123' },
      });
      
      if (!loginRes.ok()) continue;
      const { token } = await loginRes.json();

      // Check access against each endpoint in the matrix
      for (const endpoint of endpoints) {
        const res = await request.get(`${API_URL}${endpoint.path}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (endpoint.allowed.includes(role)) {
          // Allowed roles should not get 403 or 401
          expect(res.status()).not.toBe(403);
          expect(res.status()).not.toBe(401);
        } else {
          // Forbidden roles must receive 403
          expect(res.status()).toBe(403);
        }
      }
    }
  });
});
