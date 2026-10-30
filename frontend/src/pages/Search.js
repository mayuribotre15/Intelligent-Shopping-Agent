import React, { useState, useRef, useCallback } from 'react';
import { searchAPI, productsAPI } from '../services/api';
import { useShoppingStore } from '../store/store';
import ProductCard from '../components/ProductCard';
import AIInsightPanel from '../components/AIInsightPanel';
import { agentAPI } from '../services/api';
import toast from 'react-hot-toast';

const SEARCH_MODES = [
  { id: 'text', label: '⌨️ Text', desc: 'Type a product query' },
  { id: 'voice', label: '🎤 Voice', desc: 'Upload an audio clip' },
  { id: 'image', label: '🖼️ Image', desc: 'Upload a product image' },
];

export default function Search() {
  const [mode, setMode] = useState('text');
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState(null);
  const fileRef = useRef();
  const { addToCompare } = useShoppingStore();

  const handleTextSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setAiInsight('');
    try {
      const res = await searchAPI.text({
        query,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
      });
      setResults(res.data.results || []);
      // AI insight
      setAiLoading(true);
      const ai = await agentAPI.query({ message: `Recommend best products for: "${query}"`, context: { products: res.data.results?.slice(0, 5) } });
      setAiInsight(ai.data.message || '');
    } catch (e) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  }, [query, minPrice, maxPrice]);

  const handleFileSearch = useCallback(async () => {
    if (!selectedFile) { toast.error('Please select a file first.'); return; }
    setLoading(true);
    setResults([]);
    try {
      const formData = new FormData();
      if (mode === 'image') {
        formData.append('image', selectedFile);
        const res = await searchAPI.image(formData);
        setResults(res.data.results || []);
        if (res.data.image_description) {
          setAiInsight(`Image recognised as: "${res.data.image_description}"\n\nShowing related products. ${res.data.note || ''}`);
        }
      } else {
        formData.append('audio', selectedFile);
        const res = await searchAPI.voice(formData);
        setResults(res.data.results || []);
        if (res.data.transcript) setAiInsight(`Voice transcribed as: "${res.data.transcript}"`);
        if (res.data.error) toast.error(res.data.error);
      }
    } catch (e) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, mode]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (mode === 'image') setImagePreview(URL.createObjectURL(file));
    else setImagePreview('');
  }

  async function handleViewDetails(product) {
    setSelectedProduct(product);
    setDetailLoading(true);
    try {
      const res = await productsAPI.priceHistory(product.external_id);
      setPriceHistory(res.data);
    } catch { setPriceHistory(null); }
    finally { setDetailLoading(false); }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🔍 Multimodal Product Search</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 24 }}>
        Search by text, voice, or image · Powered by IBM watsonx.ai
      </p>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SEARCH_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setSelectedFile(null); setImagePreview(''); }}
            className={`btn ${mode === m.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13 }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        {mode === 'text' ? (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                placeholder="e.g. Sony noise-cancelling headphones under $300"
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8,
                  border: '1.5px solid var(--color-border)', fontSize: 14,
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button className="btn btn-primary" onClick={handleTextSearch} disabled={loading}>
                {loading ? <span className="spinner" /> : '🔍 Search'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number" placeholder="Min price $"
                value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}
              />
              <input
                type="number" placeholder="Max price $"
                value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}
              />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  flex: 1, border: '2px dashed var(--color-border)',
                  borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer',
                  background: '#f8fafc', transition: 'border-color 0.15s',
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  const file = e.dataTransfer.files[0];
                  if (file) { setSelectedFile(file); if (mode === 'image') setImagePreview(URL.createObjectURL(file)); }
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ maxHeight: 140, borderRadius: 8 }} />
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{mode === 'image' ? '🖼️' : '🎤'}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                      {mode === 'image' ? 'Drop an image or click to upload (JPEG/PNG)' : 'Drop an audio file or click to upload (WAV/MP3)'}
                    </div>
                    {selectedFile && <div style={{ marginTop: 8, fontWeight: 600, fontSize: 13 }}>{selectedFile.name}</div>}
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={mode === 'image' ? 'image/*' : 'audio/*'}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button className="btn btn-primary" onClick={handleFileSearch} disabled={loading || !selectedFile} style={{ alignSelf: 'flex-end' }}>
                {loading ? <span className="spinner" /> : 'Search'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI insight */}
      {(aiInsight || aiLoading) && (
        <AIInsightPanel
          title="AI Shopping Recommendation"
          content={aiInsight}
          loading={aiLoading}
          type="info"
          disclaimer="AI recommendations are based on available product data only. Always verify prices and specifications before purchase."
        />
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            {results.length} Product{results.length !== 1 ? 's' : ''} Found
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
            {results.map((p, i) => (
              <ProductCard
                key={i}
                product={p}
                onAddToCompare={addToCompare}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product detail drawer */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 460, height: '100vh', overflowY: 'auto',
              background: 'var(--color-surface)', padding: 28,
              boxShadow: 'var(--shadow-lg)',
            }}
            className="fade-in"
          >
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => setSelectedProduct(null)}>✕ Close</button>
            <img src={selectedProduct.image_url} alt={selectedProduct.title} style={{ width: '100%', borderRadius: 10, objectFit: 'contain', maxHeight: 200, background: '#f8fafc' }} />
            <h3 style={{ fontWeight: 700, marginTop: 16, fontSize: 15 }}>{selectedProduct.title}</h3>
            <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
              <span className="price">${selectedProduct.price?.toFixed(2)}</span>
              {selectedProduct.original_price && <span className="price-original">${selectedProduct.original_price?.toFixed(2)}</span>}
              {selectedProduct.discount_percent && <span className="discount-badge">-{Math.round(selectedProduct.discount_percent)}%</span>}
            </div>
            {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Specifications</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '5px 0', color: 'var(--color-muted)', width: '40%' }}>{k}</td>
                        <td style={{ padding: '5px 0', fontWeight: 500 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {detailLoading ? <div style={{ marginTop: 16 }}><span className="spinner" /></div> : (
              priceHistory?.price_history?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>📈 Price History</h4>
                  {priceHistory.price_history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: 'var(--color-muted)' }}>{h.date}</span>
                      <span style={{ fontWeight: 600 }}>${h.price?.toFixed(2)}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>⚠️ {priceHistory.disclaimer}</p>
                </div>
              )
            )}
            {selectedProduct.sustainability_score && (
              <div className="badge badge-green" style={{ marginTop: 16, fontSize: 12 }}>
                🌿 Sustainability: {selectedProduct.sustainability_score}/10
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 16 }}>
              Source: {selectedProduct.source || selectedProduct.platform} · {selectedProduct.fetched_at ? new Date(selectedProduct.fetched_at).toLocaleString() : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
