import React, { useEffect, useState, useCallback } from 'react';
import { preferencesAPI } from '../services/api';
import { useShoppingStore } from '../store/store';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books', 'Beauty', 'Toys', 'Automotive'];
const BRANDS = ['Apple', 'Samsung', 'Sony', 'Bose', 'Nike', 'Adidas', 'LG', 'Dell', 'HP', 'Lenovo'];
const URGENCY_OPTIONS = [
  { value: 'urgent', label: '🔥 Urgent – Need it now' },
  { value: 'flexible', label: '📅 Flexible – Within a month' },
  { value: 'waiting', label: '⏳ Waiting for a deal' },
];
const SUSTAINABILITY_OPTIONS = [
  { value: 'high', label: '🌿 High – Eco-first priority' },
  { value: 'medium', label: '⚖️ Medium – Balance of factors' },
  { value: 'low', label: '💼 Low – Not a primary concern' },
];

export default function Preferences() {
  const { setPreferences } = useShoppingStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    budget_min: '',
    budget_max: '',
    preferred_categories: [],
    preferred_brands: [],
    required_features: [],
    shopping_urgency: 'flexible',
    location: '',
    sustainability_preference: 'medium',
    currency: 'USD',
  });
  const [featureInput, setFeatureInput] = useState('');

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await preferencesAPI.get();
      const p = res.data;
      setPrefs({
        budget_min: p.budget_min || '',
        budget_max: p.budget_max || '',
        preferred_categories: p.preferred_categories || [],
        preferred_brands: p.preferred_brands || [],
        required_features: p.required_features || [],
        shopping_urgency: p.shopping_urgency || 'flexible',
        location: p.location || '',
        sustainability_preference: p.sustainability_preference || 'medium',
        currency: p.currency || 'USD',
      });
    } catch { /* no prefs yet */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...prefs,
        budget_min: prefs.budget_min ? parseFloat(prefs.budget_min) : null,
        budget_max: prefs.budget_max ? parseFloat(prefs.budget_max) : null,
      };
      const res = await preferencesAPI.upsert(payload);
      setPreferences(res.data);
      toast.success('Preferences saved!');
    } catch { toast.error('Failed to save preferences.'); }
    finally { setSaving(false); }
  }

  function toggleArrayItem(field, value) {
    setPrefs((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  function addFeature() {
    const f = featureInput.trim();
    if (f && !prefs.required_features.includes(f)) {
      setPrefs((prev) => ({ ...prev, required_features: [...prev.required_features, f] }));
    }
    setFeatureInput('');
  }

  if (loading) return <div style={{ color: 'var(--color-muted)' }}>Loading preferences…</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>⚙️ Shopping Preferences</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 24 }}>
        Personalise your AI-powered shopping experience · Preferences are stored securely
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Budget */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💰 Budget Range</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>Minimum ($)</span>
              <input
                type="number" min={0}
                value={prefs.budget_min}
                onChange={(e) => setPrefs({ ...prefs, budget_min: e.target.value })}
                placeholder="0"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
              />
            </label>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>Maximum ($)</span>
              <input
                type="number" min={0}
                value={prefs.budget_max}
                onChange={(e) => setPrefs({ ...prefs, budget_max: e.target.value })}
                placeholder="No limit"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
              />
            </label>
          </div>
        </div>

        {/* Categories */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🗂️ Preferred Categories</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleArrayItem('preferred_categories', cat)}
                className={`btn btn-sm ${prefs.preferred_categories.includes(cat) ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12 }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🏷️ Preferred Brands</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => toggleArrayItem('preferred_brands', brand)}
                className={`btn btn-sm ${prefs.preferred_brands.includes(brand) ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12 }}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Required features */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>✨ Required Features</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFeature()}
              placeholder="e.g. Noise cancellation, Waterproof, USB-C…"
              style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={addFeature}>Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {prefs.required_features.map((f) => (
              <span key={f} className="badge badge-blue" style={{ cursor: 'pointer' }} onClick={() => toggleArrayItem('required_features', f)}>
                {f} ✕
              </span>
            ))}
          </div>
        </div>

        {/* Shopping urgency */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>⏱️ Shopping Urgency</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {URGENCY_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio" name="urgency" value={opt.value}
                  checked={prefs.shopping_urgency === opt.value}
                  onChange={() => setPrefs({ ...prefs, shopping_urgency: opt.value })}
                />
                <span style={{ fontSize: 14 }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sustainability */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🌿 Sustainability Preference</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUSTAINABILITY_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio" name="sustainability" value={opt.value}
                  checked={prefs.sustainability_preference === opt.value}
                  onChange={() => setPrefs({ ...prefs, sustainability_preference: opt.value })}
                />
                <span style={{ fontSize: 14 }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📍 Location</h3>
          <input
            value={prefs.location}
            onChange={(e) => setPrefs({ ...prefs, location: e.target.value })}
            placeholder="e.g. Sydney, Australia"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 14 }}
          />
          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
            Used to filter shipping and availability. Not shared with third parties.
          </p>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={loadPrefs}>Reset</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : '💾 Save Preferences'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
          🔒 Your preferences are stored securely and used only to personalise your shopping experience.
        </div>
      </div>
    </div>
  );
}
