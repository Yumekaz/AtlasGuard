// apps/web/src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser, getSession } from '../../lib/auth';
import { UserRole } from '@atlasguard/shared';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('TOURIST');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    const session = getSession();
    if (session) {
      redirectDashboard(session.role);
    }
  }, []);

  const redirectDashboard = (userRole: UserRole) => {
    const defaultDashboards = {
      TOURIST: '/dashboard/tourist',
      OPERATOR: '/dashboard/operator',
      RESPONDER: '/dashboard/responder',
      ADMIN: '/dashboard/admin',
    };
    router.push(defaultDashboards[userRole] || '/login');
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLogin(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser({ email, password });
        redirectDashboard(res.user.role);
      } else {
        const res = await registerUser({ email, password, name, role });
        redirectDashboard(res.user.role);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass auth-card">
        <div className="auth-header">
          <div className="auth-logo">AtlasGuard</div>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to access emergency safety portal' : 'Create a tourist safety profile'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error: </strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="role">Assign Security Role</label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="TOURIST">TOURIST (Traveler PWA)</option>
                <option value="OPERATOR">OPERATOR (Command Center)</option>
                <option value="RESPONDER">RESPONDER (Field Rescue)</option>
                <option value="ADMIN">ADMIN (Control Console)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? (
              <span>Processing...</span>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Register Safety Profile'}</span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : 'Already registered? '}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        {/* Demo Quick Fills */}
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Demo Profiles Quick-Fill
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={() => handleDemoFill('tourist@demo.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Tourist Demo
            </button>
            <button
              onClick={() => handleDemoFill('operator@demo.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Operator Demo
            </button>
            <button
              onClick={() => handleDemoFill('responder@demo.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Responder Demo
            </button>
            <button
              onClick={() => handleDemoFill('admin@demo.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              Admin Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
