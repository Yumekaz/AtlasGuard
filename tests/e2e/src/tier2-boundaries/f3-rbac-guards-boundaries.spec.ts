import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('F3 Boundaries - NestJS API RBAC Guard Enforcement', () => {
  test('Authenticate with expired JWT (returns 401)', async ({ request }) => {
    // Standard expired JWT or mock expired JWT string
    const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${expiredJwt}`,
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Authenticate with malformed JWT signature (returns 401)', async ({ request }) => {
    const malformedJwt = 'header.payload.badsignature';
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${malformedJwt}`,
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Authenticate with JWT missing role claim (returns 403)', async ({ request }) => {
    // Craft a token that has sub, email, name but NO role
    // Base64Url for {"sub":"123","email":"test@demo.com","name":"No Role"}
    // header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // payload: {"sub":"123","email":"test@demo.com","name":"No Role"} -> eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZGVtby5jb20iLCJuYW1lIjoiTm8gUm9sZSJ9
    const jwtWithoutRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZGVtby5jb20iLCJuYW1lIjoiTm8gUm9sZSJ9.signature';
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${jwtWithoutRole}`,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('Authenticate with token lacking Bearer prefix (returns 401/400)', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': 'token123', // lacking "Bearer "
      },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('API Guard strict role case sensitivity (role Tourist vs TOURIST checks)', async ({ request }) => {
    // Generate token where role is set to 'Tourist' (improper case)
    // payload: {"sub":"123","email":"test@demo.com","name":"Tourist Case","role":"Tourist"}
    // eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZGVtby5jb20iLCJuYW1lIjoiVG91cmlzdCBDYXNlIiwicm9sZSI6IlRvdXJpc3QifQ
    const jwtWithWrongCaseRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZGVtby5jb20iLCJuYW1lIjoiVG91cmlzdCBDYXNlIiwicm9sZSI6IlRvdXJpc3QifQ.signature';
    const res = await request.get(`${API_URL}/operator/incidents`, {
      headers: {
        'Authorization': `Bearer ${jwtWithWrongCaseRole}`,
      },
    });
    // Should be rejected with 403 Forbidden because 'Tourist' is not equal to 'TOURIST' or 'OPERATOR' etc.
    expect(res.status()).toBe(403);
  });
});
