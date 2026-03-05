import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../services/api';
import { api } from '../services/api';
import logoAnimation from '../assets/fluxo.logo.animation.svg';

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isAuditMenuOpen, setIsAuditMenuOpen] = useState(false);
  const [isTinderMenuOpen, setIsTinderMenuOpen] = useState(() => {
    try {
      return localStorage.getItem('sidebar_tinder_open') === '1';
    } catch {
      return false;
    }
  });
  const [isEmBreveMenuOpen, setIsEmBreveMenuOpen] = useState(false);

  const isTinderRouteActive = useMemo(
    () => location.pathname.startsWith('/tinder-do-fluxo'),
    [location.pathname]
  );
  const isCopyAuditRouteActive = useMemo(
    () => location.pathname.startsWith('/auditoria-copy'),
    [location.pathname]
  );

  useEffect(() => {
    if (!isTinderRouteActive) return;
    if (user.role !== 'MENTORADO' && user.role !== 'LIDERANCA') return;
    queryClient.prefetchQuery({
      queryKey: ['tinder-do-fluxo', 'matches'],
      queryFn: () => api.get<{ matches: any[] }>('/api/tinder-do-fluxo/matches').then((r) => r.matches || []),
      staleTime: 60 * 1000,
    });
  }, [isTinderRouteActive, user.role, queryClient]);

  useEffect(() => {
    if (isCopyAuditRouteActive) setIsEmBreveMenuOpen(true);
  }, [isCopyAuditRouteActive]);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_tinder_open', isTinderMenuOpen ? '1' : '0');
    } catch {
      // Ignora indisponibilidade de storage.
    }
  }, [isTinderMenuOpen]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    api.logout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoAnimation} alt="Fluxer" className="sidebar-logo-image" />
      </div>

      <nav className="sidebar-group">
        <button
          type="button"
          className={`sidebar-accordion-trigger${isTinderMenuOpen ? ' open' : ''}${isTinderRouteActive ? ' active' : ''}`}
          onClick={() => setIsTinderMenuOpen((prev) => !prev)}
          aria-expanded={isTinderMenuOpen}
          aria-controls="tinder-accordion-content"
        >
          <span className="sidebar-accordion-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54 2.54c.61-.61 1.09-1.35 1.27-2.19.18-.84-.05-1.7-.63-2.38L14 7" />
              <path d="M14 11a5 5 0 0 0-7.54-2.54c-.61.61-1.09 1.35-1.27 2.19-.18.84.05 1.7.63 2.38L10 17" />
            </svg>
            Fluxer Hub
          </span>
          <svg className="sidebar-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div id="tinder-accordion-content" className={`sidebar-accordion-content${isTinderMenuOpen ? ' open' : ''}`}>
          {user.role === 'MENTORADO' && (
            <>
              <NavLink to="/tinder-do-fluxo/expert" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Expert & Coprodutor</NavLink>
              <NavLink to="/tinder-do-fluxo/prestadores" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Prestadores</NavLink>
              <NavLink to="/tinder-do-fluxo/vagas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Vagas</NavLink>
              <NavLink to="/tinder-do-fluxo/vagas/minhas-candidaturas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Minhas Candidaturas</NavLink>
              <NavLink to="/tinder-do-fluxo/matches" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Conexões</NavLink>
              <NavLink to="/tinder-do-fluxo/favoritos-2-0" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Favoritos</NavLink>
              <NavLink to="/tinder-do-fluxo/perfil" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Meu Perfil</NavLink>
            </>
          )}
          {user.role === 'PRESTADOR' && (
            <>
              <NavLink to="/tinder-do-fluxo/perfil" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Meu Perfil</NavLink>
              <NavLink to="/tinder-do-fluxo/vagas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Vagas</NavLink>
              <NavLink to="/tinder-do-fluxo/vagas/minhas-candidaturas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Minhas Candidaturas</NavLink>
              <NavLink to="/tinder-do-fluxo/avaliacoes" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Minhas Avaliações</NavLink>
            </>
          )}
          {user.role === 'LIDERANCA' && (
            <>
              <div className="sidebar-subgroup-title">Operacional</div>
              <NavLink to="/tinder-do-fluxo/expert" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Expert & Coprodutor</NavLink>
              <NavLink to="/tinder-do-fluxo/prestadores" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Prestadores</NavLink>
              <NavLink to="/tinder-do-fluxo/vagas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Vagas</NavLink>
              <NavLink to="/tinder-do-fluxo/vagas/minhas-candidaturas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Minhas Candidaturas</NavLink>
              <NavLink to="/tinder-do-fluxo/matches" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Conexões</NavLink>
              <NavLink to="/tinder-do-fluxo/favoritos-2-0" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Favoritos</NavLink>
              <NavLink to="/tinder-do-fluxo/avaliacoes" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Avaliações de Prestador</NavLink>

              <div className="sidebar-subgroup-title">Admin</div>
              <NavLink to="/tinder-do-fluxo/admin/dashboard" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
              <NavLink to="/tinder-do-fluxo/admin/usuarios" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Usuários</NavLink>
              <NavLink to="/tinder-do-fluxo/admin/vagas" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Vagas</NavLink>
              <NavLink to="/tinder-do-fluxo/admin/avaliacoes" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Avaliações</NavLink>
              <NavLink to="/tinder-do-fluxo/admin/logs" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>Logs</NavLink>
            </>
          )}
        </div>
      </nav>

      <nav className="sidebar-group">
        <button
          type="button"
          className={`sidebar-accordion-trigger${isAuditMenuOpen ? ' open' : ''}`}
          onClick={() => setIsAuditMenuOpen((prev) => !prev)}
          aria-expanded={isAuditMenuOpen}
          aria-controls="audit-accordion-content"
        >
          <span className="sidebar-accordion-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Auditoria de Tráfego
          </span>
          <svg className="sidebar-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          id="audit-accordion-content"
          className={`sidebar-accordion-content${isAuditMenuOpen ? ' open' : ''}`}
        >
          <NavLink to="/app/upload" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Nova Auditoria
        </NavLink>
          <NavLink to="/app/historico" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Histórico
        </NavLink>
      {user.role === 'LIDERANCA' && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard Liderança
          </NavLink>
              <NavLink to="/admin/mentorados" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Mentorados
          </NavLink>
            </>
          )}
          {user.role !== 'LIDERANCA' && (
            <NavLink to="/app/criativos" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Engenharia Reversa
            </NavLink>
          )}
        </div>
        </nav>

      <nav className="sidebar-group">
        <button
          type="button"
          className={`sidebar-accordion-trigger${isEmBreveMenuOpen ? ' open' : ''}`}
          onClick={() => setIsEmBreveMenuOpen((prev) => !prev)}
          aria-expanded={isEmBreveMenuOpen}
          aria-controls="em-breve-accordion-content"
        >
          <span className="sidebar-accordion-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Em breve
          </span>
          <svg className="sidebar-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div id="em-breve-accordion-content" className={`sidebar-accordion-content sidebar-accordion-content--em-breve${isEmBreveMenuOpen ? ' open' : ''}`}>
          <div className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5" />
              <path d="M8 21H3v-5" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
            FluxoMétrics
          </div>
          <div className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Checkpoint
          </div>
          <div className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="8" y1="14" x2="16" y2="14" />
            </svg>
            Criador de Página
          </div>
          <div className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 015 0c0 1.6-2.5 2.1-2.5 4" />
              <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
            </svg>
            Criador de Quiz
          </div>
          <div className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3h10l4 6-9 12L3 9l4-6z" />
            </svg>
            Done for You
          </div>
          <div className="sidebar-link sidebar-link-disabled" aria-disabled="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Agenda Inteligente
          </div>
          <div className="sidebar-subgroup-title">Auditoria de Copy</div>
          <NavLink end to="/auditoria-copy/historico" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
            Histórico
          </NavLink>
          <NavLink end to="/auditoria-copy/solicitacoes" className={({ isActive }) => `sidebar-link sidebar-sub-link${isActive ? ' active' : ''}`}>
            Solicitações
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">
              {user.role === 'LIDERANCA'
                ? 'Liderança'
                : user.role === 'PRESTADOR'
                  ? 'Prestador'
                  : 'Mentorado'}
            </div>
          </div>
        </div>
        <a href="#" className="sidebar-link" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair
        </a>
      </div>
    </aside>
  );
}
