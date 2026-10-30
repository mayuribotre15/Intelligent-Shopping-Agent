import React, { useEffect, useState, useCallback } from 'react';
import { agentAPI, productsAPI } from '../services/api';
import { useShoppingStore } from '../store/store';
import ProductCard from '../components/ProductCard';
import AIInsightPanel from '../components/AIInsightPanel';
import { PlatformBarChart, CategoryDonutChart, PriceLineChart, SavingsBarChart } from '../components/Charts';
import toast from 'react-hot-toast';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, fontSize: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color || '#eff6ff',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { dashboardData, dashboardLoading, setDashboard, setDashboardLoading, addToCompare } = useShoppingStore();
  const [priceData, setPriceData] = useState(null);
  const [dealsData, setDealsData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await agentAPI.dashboard();
      setDashboard(res.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  }, [setDashboard, setDashboardLoading]);

  const loadPriceHistory = useCallback(async () => {
    try {
      const res = await productsAPI.priceHistory('B08N5WRWNW');
      setPriceData(res.data);
    } catch { /* optional */ }
  }, []);

  const loadDeals = useCallback(async () => {
    try {
      const res = await agentAPI.comparePrices('headphones');
      setDealsData(res.data);
    } catch { /* optional */ }
  }, []);

  const loadAISummary = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await agentAPI.query({ message: 'Give me a smart shopping pulse summary of current deals and trends for electronics' });
      setAiSummary(res.data.message || '');
    } catch { /* optional */ }
    finally { setAiLoading(false); }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadPriceHistory();
    loadDeals();
    loadAISummary();
  }, [loadDashboard, loadPriceHistory, loadDeals, loadAISummary]);

  const data = dashboardData;

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          📊 Smart Shopping Pulse
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
          Real-time product comparisons, price trends, and AI-powered insights · Powered by IBM watsonx.ai
        </p>
        {data?.last_updated && (
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            Last updated: {new Date(data.last_updated).toLocaleString()} · {data.data_disclaimer}
          </span>
        )}
      </div>

      {/* Stat cards */}
      {dashboardLoading ? (
        <div style={{ display: 'flex', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 80, background: '#f1f5f9', borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard icon="📦" label="Products Tracked" value={data?.total_products_tracked || 0} color="#eff6ff" />
          <StatCard icon="🏪" label="Platforms" value={Object.keys(data?.platform_summary || {}).length} color="#f5f3ff" />
          <StatCard icon="🔥" label="Categories" value={Object.keys(data?.trending_categories || {}).length} sub="Trending" color="#fff7ed" />
          <StatCard
            icon="💰"
            label="Best Deal Saving"
            value={dealsData?.potential_savings ? `$${dealsData.potential_savings}` : '—'}
            sub="vs. highest price"
            color="#ecfdf5"
          />
        </div>
      )}

      {/* AI Summary */}
      <AIInsightPanel
        title="AI Shopping Pulse Summary"
        content={aiSummary}
        loading={aiLoading}
        type="analysis"
        disclaimer="AI insights are generated from available product data. Prices and deals should be verified on retailer websites before purchase."
      />

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📈 Sony WH-1000XM5 Price History</h3>
          <PriceLineChart history={priceData?.price_history} />
          {priceData?.disclaimer && (
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>⚠️ {priceData.disclaimer}</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🏪 Average Price by Platform</h3>
          <PlatformBarChart platformSummary={data?.platform_summary} />
        </div>
      </div>

      {/* Deals savings + categories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>💸 Current Deals – Potential Savings</h3>
          <SavingsBarChart deals={dealsData?.deals} />
          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
            ⚠️ {dealsData?.disclaimer || 'Prices fetched from permitted product feeds. Verify before purchase.'}
          </p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔥 Trending Categories</h3>
          <CategoryDonutChart categories={data?.trending_categories} />
        </div>
      </div>

      {/* Best deal highlight */}
      {dealsData?.best_deal && (
        <div className="card" style={{ marginTop: 20, borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Best Deal Right Now</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{dealsData.best_deal.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span className="price" style={{ fontSize: 18 }}>${dealsData.best_deal.price?.toFixed(2)}</span>
                <span className="badge badge-green">Save ${dealsData.potential_savings} vs. other platforms</span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  Platform: {dealsData.best_deal.platform?.replace('_mock', '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending products */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔥 Trending Products</h2>
        {dashboardLoading ? (
          <div style={{ color: 'var(--color-muted)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {(data?.trending_products || []).map((p, i) => (
              <ProductCard
                key={i}
                product={p}
                compact
                onAddToCompare={addToCompare}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
