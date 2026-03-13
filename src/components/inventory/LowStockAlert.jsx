import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';

export default function LowStockAlert() {
  const [items, setItems]     = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    api.get('/inventory?low_stock=1')
      .then(d => setItems(d.data ?? d))
      .catch(console.error);
  }, []);

  if (!visible || items.length === 0) return null;

  return (
    <div className="low-stock-alert">
      <div className="lsa-header">
        <span>
          ⚠️ <strong>{items.length} item{items.length > 1 ? 's' : ''}</strong> running low on stock
        </span>
        <button type="button" className="lsa-close" onClick={() => setVisible(false)}>✕</button>
      </div>
      <div className="lsa-items">
        {items.map(item => (
          <span key={item.id} className="lsa-chip">
            {item.name} <strong>({item.stock_quantity} left)</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
