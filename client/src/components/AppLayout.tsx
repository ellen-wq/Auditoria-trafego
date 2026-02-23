import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { api } from '../services/api';
import type { User } from '../services/api';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
  const user = api.getUser() as User;

  return (
    <div className="layout">
      <Sidebar user={user} />
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <span key={i}>
                    {i > 0 && <span className="breadcrumb-sep">›</span>}
                    {crumb.href && !isLast ? (
                      <Link to={crumb.href} className="breadcrumb-item">{crumb.label}</Link>
                    ) : (
                      <span className={`breadcrumb-item${isLast ? ' active' : ''}`}>{crumb.label}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
