import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import { TopBar, Badge } from '../components/common/index.jsx';
import MenuList from '../components/menu/MenuList.jsx';
import OrderReceipt from '../components/orders/OrderReceipt.jsx';
import { useCart } from '../context/CartContext.jsx';
import { orderService } from '../services/orderService.js';

const LINKS = [
  { to: '/customer/menu',   icon: '🍱', label: 'Menu'      },
  { to: '/customer/orders', icon: '📋', label: 'My Orders' },
];

const TITLES = {
  '/customer/menu':   'Menu',
  '/customer/orders': 'My Orders',
};

function CustomerMenu() {
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [placing, setPlacing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [notes, setNotes]     = useState('');
  const [error, setError]     = useState('');

  const placeOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const order = await orderService.create({
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        notes,
      });
      setReceipt(order);
      clearCart();
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (receipt) {
    return <OrderReceipt receipt={receipt} onNewOrder={() => setReceipt(null)} />;
  }

  return (
    <div className="pos-layout">
      <div className="pos-menu-panel">
        <MenuList onAddToCart={addItem} />
      </div>
      <div className="pos-cart-panel">
        <h3 className="cart-title">
          My Cart {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </h3>
        {items.length === 0 ? (
          <div className="cart-empty">Your cart is empty</div>
        ) : (
          <>
            {items.map(i => (
              <div key={i.menu_item_id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{i.name}</div>
                  <div className="cart-item-price">₱{Number(i.price).toFixed(2)}</div>
                </div>
                <div className="cart-item-qty">
                  <button type="button" onClick={() => updateQuantity(i.menu_item_id, i.quantity - 1)}>−</button>
                  <span>{i.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(i.menu_item_id, i.quantity + 1)}>+</button>
                </div>
                <span className="cart-item-sub">₱{(i.price * i.quantity).toFixed(2)}</span>
                <button type="button" className="cart-remove" onClick={() => removeItem(i.menu_item_id)}>✕</button>
              </div>
            ))}
            <div className="cart-summary">
              <div className="summary-row summary-total">
                <span>Total</span><span>₱{(total * 1.12).toFixed(2)}</span>
              </div>
            </div>
            <div className="cart-notes">
              <textarea placeholder="Notes…" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            {error && <div className="alert-error">{error}</div>}
            <button type="button" className="btn-primary btn-full" disabled={placing} onClick={placeOrder}>
              {placing ? 'Placing…' : 'Place Order'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MyOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getAll().then(d => setOrders(d.data ?? d)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>;
  if (orders.length === 0) return <div className="empty-state">No orders yet</div>;

  return (
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
                <span>{i.menu_item?.name}</span><span>×{i.quantity}</span>
              </div>
            ))}
          </div>
          <div className="order-card-foot">
            <span className="order-total">₱{Number(order.total_amount).toFixed(2)}</span>
            <span className="order-time">{new Date(order.created_at).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerDashboard() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Menu';
  return (
    <div className="app-layout">
      <Sidebar links={LINKS} />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-body">
          <Routes>
            <Route path="menu"   element={<CustomerMenu />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="*"      element={<Navigate to="menu" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
