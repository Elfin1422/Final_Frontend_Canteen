/**
 * Login.jsx
 * Handles user authentication with client-side validation.
 * On success, redirects to the user's role-based dashboard.
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

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});   // per-field validation errors
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  /** Client-side field validation — returns error map */
  const validate = ({ email, password }) => {
    const e = {};
    if (!email)                          e.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email  = 'Enter a valid email address.';
    if (!password)                       e.password = 'Password is required.';
    else if (password.length < 6)        e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleChange = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    // Clear field error as user types
    if (errors[key]) setErrors(er => ({ ...er, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Validate before hitting the API
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

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
      <div className="login-card">
        <div className="login-brand">
          <span className="login-icon">🍽️</span>
          <h1>CanteenPOS</h1>
          <p>School Canteen Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* API-level error (wrong credentials, etc.) */}
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
          <p style={{ marginTop: '1rem' }}>
            No account yet?{' '}
            <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 500 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
