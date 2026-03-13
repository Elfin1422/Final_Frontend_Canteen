import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { TableSkeleton } from '../common/SkeletonLoader.jsx';

export default function InventoryTable() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lowOnly, setLowOnly]     = useState(false);
  const [adjusting, setAdjusting] = useState(null);
  const [form, setForm]           = useState({ quantity_change: 0, type: 'restock', reason: '' });
  const [saving, setSaving]       = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url  = lowOnly ? '/inventory?low_stock=1' : '/inventory';
      const data = await api.get(url);
      setItems(data.data ?? data);
    } finally {
      setLoading(false);
    }
  }, [lowOnly]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const submitAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/inventory/${adjusting.id}/adjust`, form);
      setAdjusting(null);
      setForm({ quantity_change: 0, type: 'restock', reason: '' });
      fetchItems();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h3>Inventory</h3>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={e => setLowOnly(e.target.checked)}
          />
          Show low stock only
        </label>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr
                key={item.id}
                className={item.stock_quantity <= item.low_stock_threshold ? 'row-warn' : ''}
              >
                <td><strong>{item.name}</strong></td>
                <td>{item.category?.name}</td>
                <td>₱{Number(item.price).toFixed(2)}</td>
                <td>
                  <span className={item.stock_quantity <= item.low_stock_threshold ? 'stock-low' : 'stock-ok'}>
                    {item.stock_quantity}
                  </span>
                  <span className="stock-threshold"> / {item.low_stock_threshold} min</span>
                </td>
                <td>
                  {item.stock_quantity === 0
                    ? <span className="badge badge-red">Out of Stock</span>
                    : item.stock_quantity <= item.low_stock_threshold
                      ? <span className="badge badge-yellow">Low Stock</span>
                      : <span className="badge badge-green">OK</span>
                  }
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-sm btn-outline"
                    onClick={() => setAdjusting(item)}
                  >
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adjusting && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Adjust Stock: {adjusting.name}</h3>
            <p className="modal-sub">
              Current stock: <strong>{adjusting.stock_quantity}</strong>
            </p>
            <form onSubmit={submitAdjust}>
              <div className="field">
                <label>Quantity Change (+ add / − remove)</label>
                <input
                  type="number"
                  value={form.quantity_change}
                  onChange={e => setForm(f => ({ ...f, quantity_change: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="restock">Restock</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="waste">Waste</option>
                </select>
              </div>
              <div className="field">
                <label>Reason</label>
                <input
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Optional reason…"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setAdjusting(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
