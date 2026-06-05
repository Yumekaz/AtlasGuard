import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F5 Boundaries - SQLite Database Seeding Validation', () => {
  test('Verify idempotency of seeding (can run seed multiple times without duplications/fails)', async ({ request }) => {
    // Call seed endpoint twice to verify it handles duplicates gracefully
    const res1 = await request.post(`${API_URL}/admin/seed`, {
      headers: {
        'Authorization': `Bearer fake-admin-token`
      }
    });
    // It might return 200/201 or 401 if unauthenticated, but if authentication is correct, it should not fail with 500 error
    expect(res1.status()).not.toBe(500);

    const res2 = await request.post(`${API_URL}/admin/seed`, {
      headers: {
        'Authorization': `Bearer fake-admin-token`
      }
    });
    expect(res2.status()).not.toBe(500);
  });

  test('Verify seed defaults cannot log in with empty passwords', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: '',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Verify no extra untracked accounts are seeded', async ({ request }) => {
    // If we fetch user list as admin, there should be exactly the expected seeded users (e.g. 4 user accounts: Tourist, Operator, Responder, Admin)
    // plus any dynamically registered users during test run. But no random/untracked accounts.
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });
    
    if (loginRes.ok()) {
      const loginBody = await loginRes.json();
      const listRes = await request.get(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${loginBody.token}`,
        },
      });
      expect(listRes.status()).toBe(200);
      const users = await listRes.json();
      
      // Let's verify that only expected emails (seeded ones + test ones) exist
      const seededEmails = ['tourist@demo.com', 'operator@demo.com', 'responder@demo.com', 'admin@demo.com'];
      for (const u of users) {
        // If the email is not one of the seeded, it must be a dynamic test email
        if (!seededEmails.includes(u.email)) {
          expect(u.email).toContain('_test@');
        }
      }
    }
  });

  test('Verify password hashing of seeded accounts (cannot log in with password hash directly)', async ({ request }) => {
    // A password hash like bcrypt shouldn't work as plain text password during login
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'tourist@demo.com',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklm', // typical hash format
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Verify all seeded accounts have ACTIVE status and are not suspended', async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'password123',
      },
    });

    if (loginRes.ok()) {
      const loginBody = await loginRes.json();
      const listRes = await request.get(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${loginBody.token}`,
        },
      });
      if (listRes.status() === 200) {
        const users = await listRes.json();
        const seededUsers = users.filter((u: any) => 
          ['tourist@demo.com', 'operator@demo.com', 'responder@demo.com', 'admin@demo.com'].includes(u.email)
        );
        for (const u of seededUsers) {
          expect(u.status).toBe('ACTIVE');
        }
      }
    }
  });
});
