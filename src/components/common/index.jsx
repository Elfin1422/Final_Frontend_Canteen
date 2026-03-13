export { default as Sidebar }        from './Sidebar.jsx';
export { default as Navbar }         from './Navbar.jsx';
export { default as LoadingSpinner } from './LoadingSpinner.jsx';
export { default as ErrorBoundary }  from './ErrorBoundary.jsx';

// Shared UI primitives kept here
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function TopBar({ title }) {
  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-right">
        <span className="topbar-time">
          {new Date().toLocaleDateString('en-PH', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </span>
      </div>
    </header>
  );
}

export function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    pending:   { label: 'Pending',   cls: 'badge-yellow' },
    preparing: { label: 'Preparing', cls: 'badge-blue'   },
    ready:     { label: 'Ready',     cls: 'badge-green'  },
    completed: { label: 'Completed', cls: 'badge-gray'   },
    cancelled: { label: 'Cancelled', cls: 'badge-red'    },
  };
  const b = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}
