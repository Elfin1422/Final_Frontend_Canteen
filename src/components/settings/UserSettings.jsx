/**
 * UserSettings.jsx
 * Allows Admin and Customer users to update their profile info and password.
 * Cashiers do not have access to this page.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export default function UserSettings() {
  const { user, setUser } = useAuth();

  /* ── Profile form ── */
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [profileErrors, setProfileErrors]   = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileSaving, setProfileSaving]   = useState(false);

  /* ── Password form ── */
  const [passwords, setPasswords] = useState({
    current_password: '', password: '', password_confirmation: '',
  });
  const [passErrors, setPassErrors]   = useState({});
  const [passSuccess, setPassSuccess] = useState('');
  const [passSaving, setPassSaving]   = useState(false);

  /* ── Validation ── */
  const validateProfile = (f) => {
    const e = {};
    if (!f.name.trim())                  e.name  = 'Name is required.';
    else if (f.name.trim().length < 2)   e.name  = 'Name must be at least 2 characters.';
    if (!f.email)                        e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = 'Enter a valid email address.';
    return e;
  };

  const validatePasswords = (f) => {
    const e = {};
    if (!f.current_password)             e.current_password = 'Enter your current password.';
    if (!f.password)                     e.password = 'New password is required.';
    else if (f.password.length < 8)      e.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(f.password) && !/[0-9]/.test(f.password))
                                         e.password = 'Include at least one number or uppercase letter.';
    if (!f.password_confirmation)        e.password_confirmation = 'Please confirm your new password.';
    else if (f.password !== f.password_confirmation)
                                         e.password_confirmation = 'Passwords do not match.';
    return e;
  };

  /* ── Handlers ── */
  const handleProfileChange = (key) => (e) => {
    setProfile(p => ({ ...p, [key]: e.target.value }));
    if (profileErrors[key]) setProfileErrors(er => ({ ...er, [key]: '' }));
    setProfileSuccess('');
  };

  const handlePassChange = (key) => (e) => {
    setPasswords(p => ({ ...p, [key]: e.target.value }));
    if (passErrors[key]) setPassErrors(er => ({ ...er, [key]: '' }));
    setPassSuccess('');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    const errs = validateProfile(profile);
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileSaving(true);
    try {
      const updated = await api.put('/user/profile', profile);
      if (setUser) setUser(updated);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileErrors({ api: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    const errs = validatePasswords(passwords);
    if (Object.keys(errs).length) { setPassErrors(errs); return; }
    setPassSaving(true);
    try {
      await api.put('/user/password', passwords);
      setPassSuccess('Password changed successfully.');
      setPasswords({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setPassErrors({ api: err.message || 'Failed to change password.' });
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="settings-page">

      {/* ── Profile card ── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h3 className="settings-card-title">Profile Information</h3>
            <p className="settings-card-sub">Update your name and email address</p>
          </div>
        </div>

        <form onSubmit={saveProfile} noValidate>
          {profileErrors.api && <div className="alert-error" style={{ marginBottom: '.75rem' }}>{profileErrors.api}</div>}
          {profileSuccess    && <div className="alert-success">{profileSuccess}</div>}

          <div className="settings-fields">
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={handleProfileChange('name')}
                placeholder="Your full name"
                className={profileErrors.name ? 'input-error' : ''}
              />
              {profileErrors.name && <span className="field-error">{profileErrors.name}</span>}
            </div>

            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={handleProfileChange('email')}
                placeholder="your@email.com"
                className={profileErrors.email ? 'input-error' : ''}
              />
              {profileErrors.email && <span className="field-error">{profileErrors.email}</span>}
            </div>
          </div>

          <div className="settings-role-badge">
            Role: <span className={`badge badge-${user?.role === 'admin' ? 'red' : 'blue'}`}>
              {user?.role}
            </span>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password card ── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-icon-box">🔒</div>
          <div>
            <h3 className="settings-card-title">Change Password</h3>
            <p className="settings-card-sub">Keep your account secure with a strong password</p>
          </div>
        </div>

        <form onSubmit={savePassword} noValidate>
          {passErrors.api && <div className="alert-error" style={{ marginBottom: '.75rem' }}>{passErrors.api}</div>}
          {passSuccess    && <div className="alert-success">{passSuccess}</div>}

          <div className="settings-fields">
            <div className="field">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.current_password}
                onChange={handlePassChange('current_password')}
                placeholder="Enter current password"
                className={passErrors.current_password ? 'input-error' : ''}
              />
              {passErrors.current_password && <span className="field-error">{passErrors.current_password}</span>}
            </div>

            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.password}
                onChange={handlePassChange('password')}
                placeholder="Min. 8 characters"
                className={passErrors.password ? 'input-error' : ''}
              />
              {passErrors.password && <span className="field-error">{passErrors.password}</span>}
            </div>

            <div className="field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.password_confirmation}
                onChange={handlePassChange('password_confirmation')}
                placeholder="Re-enter new password"
                className={passErrors.password_confirmation ? 'input-error' : ''}
              />
              {passErrors.password_confirmation && <span className="field-error">{passErrors.password_confirmation}</span>}
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={passSaving}>
              {passSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
