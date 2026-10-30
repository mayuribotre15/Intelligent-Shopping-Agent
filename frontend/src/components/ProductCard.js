import React from 'react';

export default function ProductCard({ product, onAddToCompare, onViewDetails, compact }) {
  const discount = product.discount_percent;
  const rating = product.rating;

  function renderStars(r) {
    const full = Math.floor(r || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function platformColor(p) {
    const map = {
      amazon_mock: '#ff9900',
      ebay_mock: '#e53238',
      walmart_mock: '#0071ce',
      bestbuy_mock: '#003087',
    };
    return map[p] || '#64748b';
  }

  return (
    <div className="card fade-in" style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'box-shadow 0.15s, transform 0.15s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', background: '#f8fafc', borderRadius: 8, overflow: 'hidden', height: compact ? 140 : 180 }}>
        <img
          src={product.image_url || 'https://via.placeholder.com/300x200?text=Product'}
          alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
        />
        {discount && (
          <span className="discount-badge" style={{ position: 'absolute', top: 8, right: 8 }}>
            -{Math.round(discount)}%
          </span>
        )}
        {product.sustainability_score && (
          <span className="badge badge-green" style={{ position: 'absolute', top: 8, left: 8, fontSize: 11 }}>
            🌿 {product.sustainability_score}/10
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        {/* Platform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: platformColor(product.platform),
          }} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'capitalize' }}>
            {(product.platform || '').replace('_mock', '')}
          </span>
          {product.brand && (
            <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: 10 }}>{product.brand}</span>
          )}
        </div>

        {/* Title */}
        <h4 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, color: 'var(--color-text)' }}>
          {product.title?.length > 65 ? product.title.slice(0, 65) + '…' : product.title}
        </h4>

        {/* Rating */}
        {rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span className="stars" style={{ fontSize: 13 }}>{renderStars(rating)}</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              {rating} ({(product.review_count || 0).toLocaleString()})
            </span>
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span className="price">${product.price?.toFixed(2)}</span>
          {product.original_price && product.original_price !== product.price && (
            <span className="price-original">${product.original_price?.toFixed(2)}</span>
          )}
        </div>

        {/* Shipping */}
        {product.shipping_cost === 0 ? (
          <span className="badge badge-green" style={{ fontSize: 11 }}>Free Shipping</span>
        ) : product.shipping_cost ? (
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>+${product.shipping_cost} shipping</span>
        ) : null}
      </div>

      {/* Actions */}
      {!compact && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {onAddToCompare && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); onAddToCompare(product); }}
            >
              ⚖️ Compare
            </button>
          )}
          {onViewDetails && (
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1, fontSize: 12 }}
              onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
            >
              View
            </button>
          )}
        </div>
      )}

      {/* Data source */}
      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
        Source: {product.source || product.platform} · {product.fetched_at ? new Date(product.fetched_at).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
