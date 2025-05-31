import { useEffect, useState } from 'react';
import PasswordProtection from './PasswordProtection';

interface ProtectedRouteProps {
  children: React.ReactNode;
  title: string;
}

const ProtectedRoute = ({ children, title }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated in this session
    const authStatus = sessionStorage.getItem('auth_protected_content');
    setIsAuthenticated(authStatus === 'true');
    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    // Simple loading state
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PasswordProtection onAuthenticated={handleAuthenticated} title={title} />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
