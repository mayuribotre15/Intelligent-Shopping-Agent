import React, { useEffect, useState, useCallback } from 'react';
import { listsAPI } from '../services/api';
import { useShoppingStore } from '../store/store';
import toast from 'react-hot-toast';

export default function ShoppingLists() {
  const { shoppingLists, setShoppingLists, priceAlerts, setPriceAlerts } = useShoppingStore();
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState(null);
  const [newItem, setNewItem] = useState({ product_name: '', target_price: '', quantity: 1, notes: '' });
  const [addingItem, setAddingItem] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [listsRes, alertsRes] = await Promise.all([listsAPI.getLists(), listsAPI.getAlerts()]);
      setShoppingLists(listsRes.data);
      setPriceAlerts(alertsRes.data);
    } catch { toast.error('Failed to load shopping lists.'); }
    finally { setLoading(false); }
  }, [setShoppingLists, setPriceAlerts]);

  useEffect(() => { loadLists(); }, [loadLists]);

  async function createList() {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      await listsAPI.createList({ name: newListName, items: [] });
      setNewListName('');
      await loadLists();
      toast.success('List created!');
    } catch { toast.error('Failed to create list.'); }
    finally { setCreating(false); }
  }

  async function addItemToList() {
    if (!activeList || !newItem.product_name.trim()) return;
    setAddingItem(true);
    try {
      await listsAPI.addItem(activeList.id, {
        product_name: newItem.product_name,
        target_price: newItem.target_price ? parseFloat(newItem.target_price) : null,
        quantity: parseInt(newItem.quantity) || 1,
        notes: newItem.notes || null,
      });
      setNewItem({ product_name: '', target_price: '', quantity: 1, notes: '' });
      await loadLists();
      toast.success('Item added!');
    } catch { toast.error('Failed to add item.'); }
    finally { setAddingItem(false); }
  }

  async function removeItem(listId, itemId) {
    try {
      await listsAPI.removeItem(listId, itemId);
      await loadLists();
      toast.success('Item removed.');
    } catch { toast.error('Failed to remove item.'); }
  }

  async function deleteAlert(id) {
    try {
      await listsAPI.deleteAlert(id);
      await loadLists();
      toast.success('Alert deleted.');
    } catch { toast.error('Failed to delete alert.'); }
  }

  const totalItems = shoppingLists.reduce((s, l) => s + (l.items?.length || 0), 0);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📋 My Shopping Lists</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 24 }}>
        Manage personalised shopping lists and target-price alerts
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '📋', label: 'Lists', value: shoppingLists.length },
          { icon: '🛒', label: 'Total Items', value: totalItems },
          { icon: '🔔', label: 'Price Alerts', value: priceAlerts.length },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create list */}
      <div className="card" style={{ padding: 18, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create New List</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createList()}
            placeholder="e.g. Christmas Gifts, Office Setup…"
            style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13 }}
          />
          <button className="btn btn-primary btn-sm" onClick={createList} disabled={creating || !newListName.trim()}>
            {creating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '+ Create'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : shoppingLists.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p>No shopping lists yet. Create one above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {shoppingLists.map((list) => (
            <div key={list.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>{list.name}</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveList(activeList?.id === list.id ? null : list)}
                  style={{ fontSize: 12 }}
                >
                  {activeList?.id === list.id ? 'Done' : '+ Add Item'}
                </button>
              </div>

              {/* Add item form */}
              {activeList?.id === list.id && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                  <input
                    placeholder="Product name *"
                    value={newItem.product_name}
                    onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="number" placeholder="Target price $"
                      value={newItem.target_price}
                      onChange={(e) => setNewItem({ ...newItem, target_price: e.target.value })}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12 }}
                    />
                    <input
                      type="number" placeholder="Qty" min={1}
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      style={{ width: 70, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12 }}
                    />
                  </div>
                  <input
                    placeholder="Notes (optional)"
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 12, marginBottom: 8 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={addItemToList} disabled={addingItem || !newItem.product_name.trim()}>
                    {addingItem ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Add Item'}
                  </button>
                </div>
              )}

              {/* Items */}
              {list.items?.length === 0 ? (
                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>No items yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.items.map((item) => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', background: '#f8fafc', borderRadius: 8,
                      border: '1px solid var(--color-border)',
                    }}>
                      <span style={{ fontSize: 16 }}>🛒</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                          Qty: {item.quantity}
                          {item.target_price && ` · Target: $${item.target_price}`}
                          {item.notes && ` · ${item.notes}`}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(list.id, item.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 10 }}>
                {list.items?.length || 0} items · Updated {new Date(list.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Alerts */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔔 Price Alerts</h2>
        {priceAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
            <p>No price alerts set. Add products to your list with a target price to enable alerts.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {priceAlerts.map((alert) => (
              <div key={alert.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24 }}>🔔</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Target: ${alert.target_price?.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {alert.is_active ? '🟢 Active' : '⚫ Inactive'}
                    {alert.triggered_at && ` · Triggered: ${new Date(alert.triggered_at).toLocaleDateString()}`}
                    {' · Created: '}{new Date(alert.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteAlert(alert.id)}
                >Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
