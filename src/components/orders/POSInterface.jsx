import { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import MenuList from '../menu/MenuList.jsx';
import OrderReceipt from './OrderReceipt.jsx';
import { orderService } from '../../services/orderService.js';

const TAX_RATE = 0.12;

export default function POSInterface({ onOrderPlaced }) {
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const [notes, setNotes]     = useState('');
  const [placing, setPlacing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError]     = useState('');

  const tax        = total * TAX_RATE;
  const grandTotal = total + tax;

  const placeOrder = async () => {
    if (!items.length) return;
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
      onOrderPlaced?.();
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
          🛒 Cart {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </h3>

        {items.length === 0 ? (
          <div className="cart-empty">Add items from the menu</div>
        ) : (
          items.map(item => (
            <div key={item.menu_item_id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">₱{Number(item.price).toFixed(2)}</div>
              </div>
              <div className="cart-item-qty">
                <button type="button" onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>+</button>
              </div>
              <span className="cart-item-sub">₱{(item.price * item.quantity).toFixed(2)}</span>
              <button type="button" className="cart-remove" onClick={() => removeItem(item.menu_item_id)}>✕</button>
            </div>
          ))
        )}

        <div className="cart-notes">
          <textarea placeholder="Order notes…" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><span>₱{total.toFixed(2)}</span></div>
          <div className="summary-row"><span>Tax (12%)</span><span>₱{tax.toFixed(2)}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>₱{grandTotal.toFixed(2)}</span></div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <button
          type="button"
          className="btn-primary btn-full btn-place"
          disabled={!items.length || placing}
          onClick={placeOrder}
        >
          {placing ? 'Placing…' : `Place Order · ₱${grandTotal.toFixed(2)}`}
        </button>

        {items.length > 0 && (
          <button type="button" className="btn-outline btn-full" onClick={clearCart}>Clear Cart</button>
        )}
      </div>
    </div>
  );
}
