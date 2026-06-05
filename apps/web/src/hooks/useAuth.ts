// apps/web/src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession, getMe, UserSession } from '../lib/auth';

export function useAuth(allowedRoles?: ('TOURIST' | 'OPERATOR' | 'RESPONDER' | 'ADMIN')[]) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      clearSession();
      router.push('/login');
      return;
    }

    // Verify token validity by calling /auth/me
    getMe()
      .then((res) => {
        const currentUser = res.user;
        setUser(currentUser);
        
        if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
          // Redirect to their own dashboard if they don't have permission for this one
          const defaultDashboards = {
            TOURIST: '/dashboard/tourist',
            OPERATOR: '/dashboard/operator',
            RESPONDER: '/dashboard/responder',
            ADMIN: '/dashboard/admin',
          };
          router.push(defaultDashboards[currentUser.role] || '/login');
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        clearSession();
        router.push('/login');
      });
  }, [router]);

  return { user, loading };
}
