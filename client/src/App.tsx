import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuditoriaUploadPage from './pages/AuditoriaUploadPage';
import AuditoriaResultadoPage from './pages/AuditoriaResultadoPage';
import HistoricoPage from './pages/HistoricoPage';
import CriativosPage from './pages/CriativosPage';
import PerfilPage from './pages/PerfilPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MentoradosPage from './pages/MentoradosPage';
import MentoradoDetalhePage from './pages/MentoradoDetalhePage';
import AdminCriativosPage from './pages/AdminCriativosPage';

function LegacyMentoradoDetalheRedirect() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  return <Navigate to={userId ? `/admin/mentorados/${userId}` : '/admin/mentorados'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/index.html" element={<Navigate to="/login" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/register.html" element={<Navigate to="/register" replace />} />

      {/* Mentee routes */}
      <Route path="/app/upload" element={<ProtectedRoute><AuditoriaUploadPage /></ProtectedRoute>} />
      <Route path="/app/resultado/:id" element={<ProtectedRoute><AuditoriaResultadoPage /></ProtectedRoute>} />
      <Route path="/app/resultado" element={<ProtectedRoute><AuditoriaResultadoPage /></ProtectedRoute>} />
      <Route path="/app/historico" element={<ProtectedRoute><HistoricoPage /></ProtectedRoute>} />
      <Route path="/app/criativos" element={<ProtectedRoute><CriativosPage /></ProtectedRoute>} />
      <Route path="/app/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
      <Route path="/app/dashboard" element={<ProtectedRoute><Navigate to="/app/upload" replace /></ProtectedRoute>} />
      <Route path="/app/dashboard.html" element={<ProtectedRoute><Navigate to="/app/upload" replace /></ProtectedRoute>} />
      <Route path="/app/auditoria-upload.html" element={<ProtectedRoute><Navigate to="/app/upload" replace /></ProtectedRoute>} />
      <Route path="/app/auditoria-resultado.html" element={<ProtectedRoute><AuditoriaResultadoPage /></ProtectedRoute>} />
      <Route path="/app/historico.html" element={<ProtectedRoute><Navigate to="/app/historico" replace /></ProtectedRoute>} />
      <Route path="/app/criativos.html" element={<ProtectedRoute><Navigate to="/app/criativos" replace /></ProtectedRoute>} />
      <Route path="/app/perfil.html" element={<ProtectedRoute><Navigate to="/app/perfil" replace /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="LIDERANCA"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/mentorados" element={<ProtectedRoute requiredRole="LIDERANCA"><MentoradosPage /></ProtectedRoute>} />
      <Route path="/admin/mentorados/:id" element={<ProtectedRoute requiredRole="LIDERANCA"><MentoradoDetalhePage /></ProtectedRoute>} />
      <Route path="/admin/criativos" element={<ProtectedRoute requiredRole="LIDERANCA"><AdminCriativosPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard.html" element={<ProtectedRoute requiredRole="LIDERANCA"><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
      <Route path="/admin/mentorados.html" element={<ProtectedRoute requiredRole="LIDERANCA"><Navigate to="/admin/mentorados" replace /></ProtectedRoute>} />
      <Route path="/admin/mentorados-detalhe.html" element={<ProtectedRoute requiredRole="LIDERANCA"><LegacyMentoradoDetalheRedirect /></ProtectedRoute>} />
      <Route path="/admin/criativos.html" element={<ProtectedRoute requiredRole="LIDERANCA"><Navigate to="/admin/criativos" replace /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
