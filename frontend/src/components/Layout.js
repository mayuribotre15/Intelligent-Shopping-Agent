import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/compare', label: 'Compare', icon: '⚖️' },
  { to: '/agent', label: 'AI Agent', icon: '🤖' },
  { to: '/lists', label: 'My Lists', icon: '📋' },
  { to: '/preferences', label: 'Preferences', icon: '⚙️' },
];

export default function Layout() {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🛍️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>Smart Shop AI</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Powered by IBM watsonx.ai</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                marginBottom: 4,
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                background: isActive ? '#eff6ff' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--color-border)' }}>
          <div className="ai-chip" style={{ marginBottom: 12, fontSize: 11 }}>
            ✨ Llama 3.3 70B Instruct
          </div>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Sign Out
            </button>
          ) : (
            <NavLink to="/login">
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Sign In</button>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
