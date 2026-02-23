import { Navigate } from 'react-router-dom';
import { api } from '../services/api';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'MENTORADO' | 'LIDERANCA';
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const token = api.getToken();
  const user = api.getUser();

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
