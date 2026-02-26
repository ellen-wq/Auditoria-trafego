import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RecoverPasswordPage from './pages/RecoverPasswordPage';
import RegisterPage from './pages/RegisterPage';
import RegisterPrestadorPage from './pages/RegisterPrestadorPage';
import AuditoriaUploadPage from './pages/AuditoriaUploadPage';
import MetaAdsConnectPage from './pages/MetaAdsConnectPage';
import AuditoriaResultadoPage from './pages/AuditoriaResultadoPage';
import HistoricoPage from './pages/HistoricoPage';
import CriativosPage from './pages/CriativosPage';
import PerfilPage from './pages/PerfilPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MentoradosPage from './pages/MentoradosPage';
import MentoradoDetalhePage from './pages/MentoradoDetalhePage';
import AdminCriativosPage from './pages/AdminCriativosPage';
import {
  TinderAdminDashboardPage,
  TinderAdminJobsPage,
  TinderAdminLogsPage,
  TinderAdminReviewsPage,
  TinderAdminUsersPage,
  TinderAvaliacoesPrestadorPage,
  TinderComunidadePage,
  TinderExpertPage,
  TinderFavoritosPage,
  TinderJobCreatePage,
  TinderJobDetailPage,
  TinderMatchesPage,
  TinderMeuPerfilPrestadorPage,
  TinderPerfilExpertPage,
  TinderPerfilPage,
  TinderPrestadoresPage,
  TinderServiceDetailPage,
  TinderSimplePlaceholderPage,
  TinderUserPublicPage,
  TinderVagasPage,
} from './pages/TinderDoFluxoPages';

function LegacyMentoradoDetalheRedirect() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  return <Navigate to={userId ? `/admin/mentorados/${userId}` : '/admin/mentorados'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/prestador" element={<RegisterPrestadorPage />} />
      <Route path="/index.html" element={<Navigate to="/login" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/register.html" element={<Navigate to="/register" replace />} />

      {/* Mentee routes */}
      <Route path="/app/upload" element={<ProtectedRoute><AuditoriaUploadPage /></ProtectedRoute>} />
      <Route path="/app/metaads/connect" element={<ProtectedRoute><MetaAdsConnectPage /></ProtectedRoute>} />
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

      {/* Tinder do Fluxo */}
      <Route path="/tinder-do-fluxo/comunidade" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderComunidadePage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/expert" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderExpertPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/prestadores" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderPrestadoresPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/prestadores/:id" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderServiceDetailPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/vagas" element={<ProtectedRoute allowedRoles={['MENTORADO', 'PRESTADOR', 'LIDERANCA']}><TinderVagasPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/vagas/criar" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderJobCreatePage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/vagas/:id" element={<ProtectedRoute allowedRoles={['MENTORADO', 'PRESTADOR', 'LIDERANCA']}><TinderJobDetailPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/matches" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderMatchesPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/favoritos" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderFavoritosPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/perfil" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderPerfilPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/perfil-expert" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderPerfilExpertPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/meu-perfil" element={<ProtectedRoute allowedRoles={['PRESTADOR', 'LIDERANCA']}><TinderMeuPerfilPrestadorPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/avaliacoes" element={<ProtectedRoute allowedRoles={['PRESTADOR', 'LIDERANCA']}><TinderAvaliacoesPrestadorPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/u/:id" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderUserPublicPage /></ProtectedRoute>} />

      <Route path="/tinder-do-fluxo/admin/dashboard" element={<ProtectedRoute allowedRoles={['LIDERANCA']}><TinderAdminDashboardPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/admin/usuarios" element={<ProtectedRoute allowedRoles={['LIDERANCA']}><TinderAdminUsersPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/admin/vagas" element={<ProtectedRoute allowedRoles={['LIDERANCA']}><TinderAdminJobsPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/admin/avaliacoes" element={<ProtectedRoute allowedRoles={['LIDERANCA']}><TinderAdminReviewsPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo/admin/logs" element={<ProtectedRoute allowedRoles={['LIDERANCA']}><TinderAdminLogsPage /></ProtectedRoute>} />
      <Route path="/tinder-do-fluxo" element={<ProtectedRoute><TinderSimplePlaceholderPage title="Tinder do Fluxo" subtitle="Escolha uma área no menu lateral." /></ProtectedRoute>} />

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
