import React from 'react';

export default function AIInsightPanel({ title, content, loading, type = 'info', disclaimer }) {
  const colors = {
    info: { border: '#3b82f6', bg: '#eff6ff', icon: '🤖' },
    success: { border: '#059669', bg: '#ecfdf5', icon: '✅' },
    warning: { border: '#d97706', bg: '#fffbeb', icon: '⚠️' },
    analysis: { border: '#7c3aed', bg: '#f5f3ff', icon: '🔬' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      border: `1.5px solid ${c.border}`,
      borderRadius: 12,
      background: c.bg,
      padding: 20,
      marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{c.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{title}</span>
        <span className="ai-chip" style={{ marginLeft: 'auto' }}>Llama 3.3 70B</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-muted)' }}>
          <span className="spinner" />
          <span style={{ fontSize: 13 }}>Analysing with IBM watsonx.ai…</span>
        </div>
      ) : (
        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
          {content || 'No analysis available.'}
        </div>
      )}

      {disclaimer && !loading && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--color-muted)',
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span>ℹ️</span>
          <span>{disclaimer}</span>
        </div>
      )}
    </div>
  );
}
