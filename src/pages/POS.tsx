import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { menuAPI, categoryAPI, orderAPI } from '../services/api';
import { MenuItem, Category } from '../types';
import { useCart } from '../contexts/CartContext';
import './POS.css';

const POS: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderData, setOrderData] = useState({
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash' as 'cash' | 'card' | 'digital_wallet',
    notes: '',
  });

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getTotal
  } = useCart();

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll({ active_only: true });
      setCategories(res.data);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const fetchMenuItems = async () => {
    try {
      const params: any = { available_only: true };
      if (selectedCategory) params.category_id = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await menuAPI.getAll(params);
      setMenuItems(res.data.data);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem(item, 1);
    toast.success(`${item.name} added to cart`);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = items.map(i => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        special_instructions: i.special_instructions
      }));

      await orderAPI.create({
        items: orderItems,
        customer_name: orderData.customer_name || undefined,
        customer_phone: orderData.customer_phone || undefined,
        payment_method: orderData.payment_method,
        notes: orderData.notes || undefined,
      });

      toast.success('Order created successfully!');
      clearCart();
      setShowCheckout(false);

      setOrderData({
        customer_name: '',
        customer_phone: '',
        payment_method: 'cash',
        notes: ''
      });

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pos-container">

      {/* LEFT MENU */}
      <div className="menu-section">

        <div className="menu-header">
          <h1>Point of Sale</h1>

          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
        </div>

        {/* Categories */}
        <div className="categories">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
          >
            All
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">

          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleAddToCart(item)}
              className="menu-card"
            >
              <div className="menu-image"></div>

              <h3>{item.name}</h3>

              <p className="price">
                {formatCurrency(item.price)}
              </p>
            </button>
          ))}

        </div>

      </div>

      {/* CART */}
      <div className="cart-section">

        <div className="cart-header">
          <h2>Current Order</h2>
          <span>{items.length} items</span>
        </div>

        <div className="cart-items">

          {items.length === 0 ? (
            <div className="empty-cart">
              Cart is empty
            </div>
          ) : (
            items.map(item => (
              <div key={item.menu_item_id} className="cart-item">

                <div className="cart-info">
                  <h4>{item.menu_item.name}</h4>
                  <span>{formatCurrency(item.menu_item.price)}</span>
                </div>

                <div className="cart-qty">

                  <button onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>
                    +
                  </button>

                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.menu_item_id)}
                >
                  ✕
                </button>

              </div>
            ))
          )}

        </div>

        {/* TOTAL */}
        <div className="cart-total">

          <div className="total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>

          <div className="total-row">
            <span>Tax</span>
            <span>{formatCurrency(getTax())}</span>
          </div>

          <div className="total-row total">
            <span>Total</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>

          <div className="cart-buttons">
            <button className="btn-secondary" onClick={clearCart}>
              Clear
            </button>

            <button className="btn-primary" onClick={() => setShowCheckout(true)}>
              Checkout
            </button>
          </div>

        </div>

      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="modal-overlay">

          <div className="modal">

            <h2>Complete Order</h2>

            <input
              className="input"
              placeholder="Customer Name"
              value={orderData.customer_name}
              onChange={(e) =>
                setOrderData({ ...orderData, customer_name: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Customer Phone"
              value={orderData.customer_phone}
              onChange={(e) =>
                setOrderData({ ...orderData, customer_phone: e.target.value })
              }
            />

            <select
              className="input"
              value={orderData.payment_method}
              onChange={(e) =>
                setOrderData({ ...orderData, payment_method: e.target.value as any })
              }
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital_wallet">Digital Wallet</option>
            </select>

            <textarea
              className="input"
              placeholder="Notes"
              rows={3}
              value={orderData.notes}
              onChange={(e) =>
                setOrderData({ ...orderData, notes: e.target.value })
              }
            />

            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default POS;