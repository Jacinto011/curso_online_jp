// components/withAuth.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export function withAuth(Component, allowedRoles = []) {
  return function WithAuth(props) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/auth/login');
        } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          router.push('/unauthorized');
        }
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
      return <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}