import { useState, useEffect, FormEvent } from 'react';
import { login, getEntityBranding } from '../services/api';

interface LoginProps {
  onLogin: (user: { user_id: number; full_name: string; role: string; entity_id: number }) => void;
}

interface Branding {
  entity_name: string;
  logo_path: string | null;
  abbreviation: string | null;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding>({
    entity_name: '',
    logo_path: null,
    abbreviation: null,
  });

  useEffect(() => {
    getEntityBranding()
      .then((res) => setBranding(res.data))
      .catch(() => setBranding({ entity_name: 'Municipality', logo_path: null, abbreviation: null }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('psfgs_token', res.data.access_token);
      onLogin({
        user_id: res.data.user_id,
        full_name: res.data.full_name,
        role: res.data.role,
        entity_id: res.data.entity_id,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = branding.logo_path || null;

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={branding.entity_name}
              style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 12 }}
            />
          ) : (
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1F3864', letterSpacing: '0.05em' }}>PSFGS</div>
          )}
          <div style={{ fontSize: 11, color: '#5A6478', marginTop: 4 }}>Public Sector Financial Governance Suite</div>
        </div>
        <h1>Sign In</h1>
        <p>{branding.entity_name || 'Municipality'}</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@municipality.gov.za"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 13, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 10, color: '#8B93A7', textAlign: 'center' }}>
          Glance Management Technologies (Pty) Ltd &middot; Secure Access
        </div>
      </div>
    </div>
  );
}
