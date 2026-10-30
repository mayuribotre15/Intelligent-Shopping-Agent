import React, { useState } from 'react';
import { productsAPI } from '../services/api';
import { useShoppingStore } from '../store/store';
import ProductCard from '../components/ProductCard';
import AIInsightPanel from '../components/AIInsightPanel';
import { SavingsBarChart } from '../components/Charts';
import toast from 'react-hot-toast';

const COMPARE_COLORS = ['#1a56db', '#7c3aed', '#059669', '#d97706'];

export default function Compare() {
  const { compareList, removeFromCompare, clearCompare } = useShoppingStore();
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { addToCompare } = useShoppingStore();

  async function runSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await productsAPI.search({ q: searchQuery });
      setSearchResults(res.data.results || []);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  }

  async function runAIComparison() {
    if (compareList.length < 2) { toast.error('Add at least 2 products to compare.'); return; }
    setAiLoading(true);
    setAiAnalysis('');
    try {
      const ids = compareList.map((p) => p.external_id).filter(Boolean);
      const res = await productsAPI.compare(ids);
      setAiAnalysis(res.data.ai_analysis || '');
    } catch { toast.error('AI comparison failed.'); }
    finally { setAiLoading(false); }
  }

  const priceMin = compareList.length ? Math.min(...compareList.map((p) => p.price)) : 0;

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>⚖️ Product Comparison</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 24 }}>
        Compare up to 4 products side-by-side with AI-powered analysis
      </p>

      {/* Search to add */}
      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add Products to Compare</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="Search for a product to add…"
            style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
          <button className="btn btn-primary btn-sm" onClick={runSearch} disabled={searching}>
            {searching ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Search'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
            {searchResults.slice(0, 6).map((p, i) => (
              <div key={i} style={{ minWidth: 200 }}>
                <ProductCard product={p} compact onAddToCompare={addToCompare} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compare list */}
      {compareList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
          <p>Search for products above and click "Compare" to add them here.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>You can compare up to 4 products at once.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{compareList.length} Products Selected</h2>
            <button className="btn btn-primary btn-sm" onClick={runAIComparison} disabled={aiLoading || compareList.length < 2}>
              {aiLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analysing…</> : '🤖 AI Compare'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={clearCompare}>Clear All</button>
          </div>

          {/* Side-by-side table */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--color-border)', width: 140, color: 'var(--color-muted)' }}>Feature</th>
                  {compareList.map((p, i) => (
                    <th key={i} style={{ padding: '10px 12px', borderBottom: `2px solid ${COMPARE_COLORS[i]}`, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <img src={p.image_url} alt={p.title} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, background: '#f8fafc' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 140, lineHeight: 1.3 }}>{p.title?.slice(0, 50)}</span>
                        <button
                          onClick={() => removeFromCompare(p.external_id)}
                          style={{ fontSize: 10, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                        >✕ Remove</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Price', key: 'price', render: (p) => (
                    <span style={{ fontWeight: 700, color: p.price === priceMin ? 'var(--color-success)' : 'var(--color-text)' }}>
                      ${p.price?.toFixed(2)} {p.price === priceMin && '🏆 Lowest'}
                    </span>
                  )},
                  { label: 'Original Price', key: 'original_price', render: (p) => p.original_price ? `$${p.original_price?.toFixed(2)}` : '—' },
                  { label: 'Discount', key: 'discount_percent', render: (p) => p.discount_percent ? `${Math.round(p.discount_percent)}%` : '—' },
                  { label: 'Platform', key: 'platform', render: (p) => (p.platform || '').replace('_mock', '') },
                  { label: 'Rating', key: 'rating', render: (p) => p.rating ? `${p.rating} ★ (${(p.review_count || 0).toLocaleString()} reviews)` : '—' },
                  { label: 'Brand', key: 'brand', render: (p) => p.brand || '—' },
                  { label: 'Shipping', key: 'shipping_cost', render: (p) => p.shipping_cost === 0 ? '✅ Free' : p.shipping_cost ? `$${p.shipping_cost}` : '—' },
                  { label: 'Delivery', key: 'estimated_delivery_days', render: (p) => p.estimated_delivery_days ? `${p.estimated_delivery_days} days` : '—' },
                  { label: 'Seller Rating', key: 'seller_rating', render: (p) => p.seller_rating ? `${p.seller_rating} / 5.0` : '—' },
                  { label: 'Sustainability', key: 'sustainability_score', render: (p) => p.sustainability_score ? `🌿 ${p.sustainability_score}/10` : '—' },
                  { label: 'In Stock', key: 'in_stock', render: (p) => p.in_stock ? '✅ Yes' : '❌ No' },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '9px 12px', color: 'var(--color-muted)', fontWeight: 500 }}>{row.label}</td>
                    {compareList.map((p, i) => (
                      <td key={i} style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 400 }}>
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Price chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>💸 Price Comparison & Potential Savings</h3>
            <SavingsBarChart deals={compareList} />
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
              ⚠️ Prices are from the most recent data fetch. Verify on the retailer's website before purchase.
            </p>
          </div>

          {/* AI Analysis */}
          <AIInsightPanel
            title="AI Product Comparison Analysis"
            content={aiAnalysis}
            loading={aiLoading}
            type="analysis"
            disclaimer="AI analysis is based on available product data. Verify key specifications and prices on retailer websites before making a purchase decision."
          />
        </>
      )}
    </div>
  );
}
