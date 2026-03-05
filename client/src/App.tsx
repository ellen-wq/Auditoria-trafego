import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PageSkeleton from './components/skeletons/PageSkeleton';

// Lazy load pages for code splitting (faster initial load, especially login)
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RecoverPasswordPage = React.lazy(() => import('./pages/RecoverPasswordPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const RegisterPrestadorPage = React.lazy(() => import('./pages/RegisterPrestadorPage'));
const AuditoriaUploadPage = React.lazy(() => import('./pages/AuditoriaUploadPage'));
const MetaAdsConnectPage = React.lazy(() => import('./pages/MetaAdsConnectPage'));
const AuditoriaResultadoPage = React.lazy(() => import('./pages/AuditoriaResultadoPage'));
const HistoricoPage = React.lazy(() => import('./pages/HistoricoPage'));
const CriativosPage = React.lazy(() => import('./pages/CriativosPage'));
const PerfilPage = React.lazy(() => import('./pages/PerfilPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const MentoradosPage = React.lazy(() => import('./pages/MentoradosPage'));
const MentoradoDetalhePage = React.lazy(() => import('./pages/MentoradoDetalhePage'));
const AdminCriativosPage = React.lazy(() => import('./pages/AdminCriativosPage'));
const AuditoriaCopyHistoricoPage = React.lazy(() => import('./pages/AuditoriaCopyHistoricoPage'));
const AuditoriaCopySolicitacoesPage = React.lazy(() => import('./pages/AuditoriaCopySolicitacoesPage'));
const ProfileViewPage = React.lazy(() => import('./pages/ProfileViewPage'));
const ProfileFormPage = React.lazy(() => import('./pages/ProfileFormPage'));
const ProfileRouterPage = React.lazy(() => import('./pages/ProfileRouterPage'));

// Tinder do Fluxo: shared chunk when any of these is first visited
const TinderAdminDashboardPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderAdminDashboardPage })));
const TinderAdminJobsPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderAdminJobsPage })));
const TinderAdminLogsPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderAdminLogsPage })));
const TinderAdminReviewsPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderAdminReviewsPage })));
const TinderAdminUsersPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderAdminUsersPage })));
const TinderAvaliacoesPrestadorPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderAvaliacoesPrestadorPage })));
const TinderComunidadePage = React.lazy(() => import('./pages/ComunidadePage'));
const TinderExpertPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderExpertPage })));
const TinderFavoritosPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderFavoritosPage })));
const TinderFavoritos2Page = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderFavoritos2Page })));
const TinderJobCreatePage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderJobCreatePage })));
const TinderJobDetailPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderJobDetailPage })));
const TinderMatchesPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderMatchesPage })));
const TinderMyApplicationsPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderMyApplicationsPage })));
const TinderPrestadoresPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderPrestadoresPage })));
const TinderServiceDetailPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderServiceDetailPage })));
const TinderSimplePlaceholderPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderSimplePlaceholderPage })));
const TinderUserPublicPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderUserPublicPage })));
const TinderVagasPage = React.lazy(() => import('./pages/TinderDoFluxoPages').then(m => ({ default: m.TinderVagasPage })));

function PageLoadFallback() {
  return <PageSkeleton />;
}

function LegacyMentoradoDetalheRedirect() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  return <Navigate to={userId ? `/admin/mentorados/${userId}` : '/admin/mentorados'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoadFallback />}>
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

        {/* Auditoria de Copy */}
        <Route path="/auditoria-copy/historico" element={<ProtectedRoute><AuditoriaCopyHistoricoPage /></ProtectedRoute>} />
        <Route path="/auditoria-copy/solicitacoes" element={<ProtectedRoute><AuditoriaCopySolicitacoesPage /></ProtectedRoute>} />

        {/* Tinder do Fluxo */}
        <Route path="/tinder-do-fluxo/comunidade" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderComunidadePage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/expert" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderExpertPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/prestadores" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderPrestadoresPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/prestadores/:id" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderServiceDetailPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/vagas" element={<ProtectedRoute allowedRoles={['MENTORADO', 'PRESTADOR', 'LIDERANCA']}><TinderVagasPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/vagas/criar" element={<ProtectedRoute allowedRoles={['MENTORADO', 'PRESTADOR', 'LIDERANCA']}><TinderJobCreatePage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/vagas/minhas-candidaturas" element={<ProtectedRoute allowedRoles={['MENTORADO', 'PRESTADOR', 'LIDERANCA']}><TinderMyApplicationsPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/vagas/:id" element={<ProtectedRoute allowedRoles={['MENTORADO', 'PRESTADOR', 'LIDERANCA']}><TinderJobDetailPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/matches" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA', 'PRESTADOR']} skipProfileCheck><TinderMatchesPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/favoritos" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderFavoritosPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/favoritos-2-0" element={<ProtectedRoute allowedRoles={['MENTORADO', 'LIDERANCA']}><TinderFavoritos2Page /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/perfil" element={<ProtectedRoute skipProfileCheck><ProfileRouterPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/profile-view" element={<ProtectedRoute skipProfileCheck><ProfileViewPage /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/perfil-expert" element={<ProtectedRoute><Navigate to="/tinder-do-fluxo/perfil" replace /></ProtectedRoute>} />
        <Route path="/tinder-do-fluxo/meu-perfil" element={<ProtectedRoute><Navigate to="/tinder-do-fluxo/profile-view" replace /></ProtectedRoute>} />
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
    </Suspense>
  );
}
