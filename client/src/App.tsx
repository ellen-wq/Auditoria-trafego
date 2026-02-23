import { Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Mentee routes */}
      <Route path="/app/upload" element={<ProtectedRoute><AuditoriaUploadPage /></ProtectedRoute>} />
      <Route path="/app/resultado" element={<ProtectedRoute><AuditoriaResultadoPage /></ProtectedRoute>} />
      <Route path="/app/historico" element={<ProtectedRoute><HistoricoPage /></ProtectedRoute>} />
      <Route path="/app/criativos" element={<ProtectedRoute><CriativosPage /></ProtectedRoute>} />
      <Route path="/app/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="LIDERANCA"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/mentorados" element={<ProtectedRoute requiredRole="LIDERANCA"><MentoradosPage /></ProtectedRoute>} />
      <Route path="/admin/mentorados/:id" element={<ProtectedRoute requiredRole="LIDERANCA"><MentoradoDetalhePage /></ProtectedRoute>} />
      <Route path="/admin/criativos" element={<ProtectedRoute requiredRole="LIDERANCA"><AdminCriativosPage /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
