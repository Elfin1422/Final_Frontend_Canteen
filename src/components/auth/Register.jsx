/**
 * Register.jsx
 * Split-panel registration page — creates Customer accounts only.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function Register() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]         = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = (f) => {
    const e = {};
    if (!f.name.trim())                  e.name = 'Full name is required.';
    else if (f.name.trim().length < 2)   e.name = 'Name must be at least 2 characters.';
    if (!f.email)                             e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(f.email))  e.email = 'Enter a valid email address.';
    if (!f.password)                          e.password = 'Password is required.';
    else if (f.password.length < 8)           e.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(f.password) && !/[0-9]/.test(f.password))
                                              e.password = 'Include at least one number or uppercase letter.';
    if (!f.password_confirmation)             e.password_confirmation = 'Please confirm your password.';
    else if (f.password !== f.password_confirmation)
                                              e.password_confirmation = 'Passwords do not match.';
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
      await api.post('/register', { ...form, role: 'customer' });
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
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
          <p className="brand-sub">Join the school canteen system and order your favorite meals online.</p>
          <div className="brand-badge">👤 Customer Registration</div>
          <div className="brand-dots">
            <span /><span /><span /><span />
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="login-form-panel">
          <p className="form-title">Create account</p>
          <p className="form-subtitle">Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {apiError && <div className="alert-error">{apiError}</div>}

            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Juan dela Cruz"
                className={errors.name ? 'input-error' : ''}
                autoFocus
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@canteen.com"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Min. 8 characters"
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={handleChange('password_confirmation')}
                placeholder="Re-enter password"
                className={errors.password_confirmation ? 'input-error' : ''}
              />
              {errors.password_confirmation && <span className="field-error">{errors.password_confirmation}</span>}
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="login-demo" style={{ marginTop: '1.25rem' }}>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#6b0f1a', fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
