import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (menuItem, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.menu_item_id === menuItem.id);
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === menuItem.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        { menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity },
      ];
    });
  };

  const removeItem = (menuItemId) =>
    setItems(prev => prev.filter(i => i.menu_item_id !== menuItemId));

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) return removeItem(menuItemId);
    setItems(prev =>
      prev.map(i => i.menu_item_id === menuItemId ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => setItems([]);

  const total     = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
