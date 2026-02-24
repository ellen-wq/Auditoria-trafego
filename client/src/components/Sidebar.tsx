import { NavLink } from 'react-router-dom';
import type { User } from '../services/api';
import { api } from '../services/api';

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    api.logout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-x">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
        <div className="logo-text">fluxer<span>.</span></div>
      </div>

      <nav className="sidebar-group">
        <div className="sidebar-group-title">Mentoria</div>
        <NavLink to="/app/upload" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Auditoria de Tráfego
        </NavLink>
        <NavLink to="/app/historico" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Histórico
        </NavLink>
        {user.role !== 'LIDERANCA' && (
          <NavLink to="/app/criativos" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Engenharia Reversa
          </NavLink>
        )}
      </nav>

      {user.role === 'LIDERANCA' && (
        <nav className="sidebar-group">
          <div className="sidebar-group-title">Gestão</div>
          <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard Liderança
          </NavLink>
          <NavLink to="/admin/mentorados" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Mentorados
          </NavLink>
        </nav>
      )}

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">
              {user.role === 'LIDERANCA' ? 'Liderança' : 'Mentorado'}
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
