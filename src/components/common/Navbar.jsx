import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">🍽️ CanteenPOS</div>
      <div className="topbar-right">
        {user && (
          <>
            <span className="topbar-user">{user.name} · <em>{user.role}</em></span>
            <button type="button" className="btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
