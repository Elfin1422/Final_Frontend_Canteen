import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../services/orderService.js';
import { Badge } from '../common/index.jsx';

const STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' };

export default function OrderQueue() {
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll(`?status=${filter}`);
      setOrders(data.data ?? data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await orderService.updateStatus(order.id, next);
    fetchOrders();
  };

  const cancel = async (order) => {
    if (!window.confirm('Cancel this order?')) return;
    await orderService.updateStatus(order.id, 'cancelled');
    fetchOrders();
  };

  return (
    <div className="order-queue">
      <div className="queue-tabs">
        {STATUSES.map(s => (
          <button
            key={s}
            type="button"
            className={`queue-tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button type="button" className="queue-tab" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">No {filter} orders</div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order.id} className={`order-card status-${order.status}`}>
              <div className="order-card-head">
                <span className="order-number">{order.order_number}</span>
                <Badge status={order.status} />
              </div>

              <div className="order-items-list">
                {order.order_items?.map(i => (
                  <div key={i.id} className="order-item-row">
                    <span>{i.menu_item?.name}</span>
                    <span>×{i.quantity}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="order-notes">📝 {order.notes}</div>
              )}

              <div className="order-card-foot">
                <span className="order-total">₱{Number(order.total_amount).toFixed(2)}</span>
                <span className="order-time">
                  {new Date(order.created_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="order-actions">
                {NEXT_STATUS[order.status] && (
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => advance(order)}
                  >
                    → {NEXT_STATUS[order.status].charAt(0).toUpperCase() + NEXT_STATUS[order.status].slice(1)}
                  </button>
                )}
                {['pending', 'preparing'].includes(order.status) && (
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => cancel(order)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
