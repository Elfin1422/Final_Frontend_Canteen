/**
 * Login.jsx
 * Split-panel login page with maroon brand panel and white form panel.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Admin',    email: 'admin@canteen.com'    },
  { label: 'Cashier',  email: 'cashier@canteen.com'  },
  { label: 'Customer', email: 'customer@canteen.com' },
];

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = ({ email, password }) => {
    const e = {};
    if (!email)                           e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email   = 'Enter a valid email address.';
    if (!password)                        e.password = 'Password is required.';
    else if (password.length < 6)         e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleChange = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setApiError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-split">

        {/* ── Left: Maroon brand panel ── */}
        <div className="login-brand-panel">
          <span className="brand-icon">🍽️</span>
          <h1>CanteenPOS</h1>
          <p className="brand-sub">School Canteen Management System for IT15/L Integrative Programming</p>
          <div className="brand-badge">🎓 Log In Here</div>
          <div className="brand-dots">
            <span /><span /><span /><span />
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="login-form-panel">
          <p className="form-title">Welcome back</p>
          <p className="form-subtitle">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {apiError && <div className="alert-error">{apiError}</div>}

            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@canteen.com"
                className={errors.email ? 'input-error' : ''}
                autoFocus
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-demo">
            <p>Demo accounts</p>
            <div className="demo-chips">
              {DEMO_ACCOUNTS.map(d => (
                <button
                  key={d.label}
                  className="chip"
                  type="button"
                  onClick={() => { setForm({ email: d.email, password: 'password' }); setErrors({}); }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p style={{ marginTop: '1.25rem', fontSize: '.85rem', color: 'var(--muted)' }}>
              No account yet?{' '}
              <Link to="/register" style={{ color: '#6b0f1a', fontWeight: 600 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
