import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName });
      toast.success('Account created! Please sign in.');
      setTab('login');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🛍️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>Smart Shop AI</h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>Powered by IBM watsonx.ai · Llama 3.3 70B Instruct</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 24, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontWeight: tab === t ? 600 : 400, fontSize: 13,
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'register' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-muted)' }}>Full Name</label>
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-muted)' }}>Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-muted)' }}>Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                  placeholder="Min. 8 characters"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: '#fff', borderTopColor: 'transparent' }} /> Please wait…</> : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ fontSize: 12, color: 'var(--color-muted)' }}>Continue without account →</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', marginTop: 16, lineHeight: 1.5 }}>
          🔒 Your data is stored securely. We follow GDPR and responsible AI practices.<br />
          Deployed on IBM Cloud · AI by IBM watsonx.ai
        </p>
      </div>
    </div>
  );
}
