// apps/web/src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, getToken, clearSession, getMe, UserSession } from '../../lib/auth';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    const token = getToken();
    if (!session || !token) {
      clearSession();
      router.replace('/login');
      return;
    }

    // Role-based path checks
    const role = session.role;
    const path = pathname || '';
    let isAllowed = true;

    if (path.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      isAllowed = false;
    } else if (path.startsWith('/dashboard/operator') && role !== 'OPERATOR' && role !== 'ADMIN') {
      isAllowed = false;
    } else if (path.startsWith('/dashboard/responder') && role !== 'RESPONDER' && role !== 'ADMIN') {
      isAllowed = false;
    } else if (path.startsWith('/dashboard/tourist') && role !== 'TOURIST' && role !== 'ADMIN') {
      isAllowed = false;
    }

    if (!isAllowed) {
      const defaultDashboards = {
        TOURIST: '/dashboard/tourist',
        OPERATOR: '/dashboard/operator',
        RESPONDER: '/dashboard/responder',
        ADMIN: '/dashboard/admin',
      };
      router.replace(defaultDashboards[role] || '/login');
      return;
    }

    // Verify token validity by calling /auth/me
    let active = true;
    getMe()
      .then((res) => {
        if (!active) return;
        setUser(res.user);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        clearSession();
        router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [router, pathname]);

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b0f19',
        color: '#ffffff',
        fontFamily: 'sans-serif'
      }}>
        <div className="glass shimmer" style={{ padding: '2rem 3rem', borderRadius: '16px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Loading Dashboard...</h2>
          <p style={{ color: '#94a3b8' }}>Verifying active session credentials...</p>
        </div>
      </div>
    );
  }

  // Define sidebar menus based on roles
  const menuItems = {
    TOURIST: [
      { name: 'Safety Console', path: '/dashboard/tourist' },
      { name: 'My Active Trip', path: '/dashboard/tourist/trip' },
      { name: 'Emergency Profile', path: '/dashboard/tourist/profile' },
    ],
    OPERATOR: [
      { name: 'Command Live', path: '/dashboard/operator' },
      { name: 'Responders Control', path: '/dashboard/operator/responders' },
      { name: 'Safety Ledger', path: '/dashboard/operator/audit' },
    ],
    RESPONDER: [
      { name: 'Assignments Panel', path: '/dashboard/responder' },
      { name: 'Report Logs', path: '/dashboard/responder/history' },
    ],
    ADMIN: [
      { name: 'Admin Console', path: '/dashboard/admin' },
      { name: 'Risk Zones Control', path: '/dashboard/admin/zones' },
      { name: 'System Logs', path: '/dashboard/admin/logs' },
    ],
  };

  const currentMenu = menuItems[user.role] || [];

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">AtlasGuard</span>
          <span 
            className={`badge ${
              user.role === 'ADMIN' ? 'badge-admin' :
              user.role === 'OPERATOR' ? 'badge-operator' :
              user.role === 'RESPONDER' ? 'badge-responder' : 'badge-role'
            }`} 
            style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
          >
            {user.role}
          </span>
        </div>
        
        <nav style={{ flex: 1 }}>
          <ul className="sidebar-menu">
            {currentMenu.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path} 
                  className={`sidebar-item ${pathname === item.path ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="header">
          <div className="header-title-section">
            <h1 style={{ textTransform: 'capitalize' }}>
              {user.role.toLowerCase()} Dashboard
            </h1>
            <p>Welcome back, {user.name}</p>
          </div>

          <div className="user-profile-widget">
            <div className="avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.email}</span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
