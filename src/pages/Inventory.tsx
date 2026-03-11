import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { inventoryAPI, categoryAPI } from '../services/api';
import { MenuItem, Category, InventoryLog } from '../types';
import './Inventory.css';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');

  const [restockModal, setRestockModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });

  const [restockQuantity, setRestockQuantity] = useState(1);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchInventory();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const fetchInventory = async () => {
    try {
      const params: any = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (showLowStock) params.low_stock = true;

      const response = await inventoryAPI.getAll(params);
      setItems(response.data.data);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await inventoryAPI.getLogs();
      setLogs(response.data.data);
    } catch {
      toast.error('Failed to load inventory logs');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, showLowStock]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const handleRestock = async () => {
    if (!restockModal.item) return;

    try {
      await inventoryAPI.restock(restockModal.item.id, restockQuantity, 'Manual restock');
      toast.success('Stock updated successfully');
      setRestockModal({ open: false, item: null });
      fetchInventory();
    } catch {
      toast.error('Failed to restock item');
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal.item || !adjustReason) return;

    try {
      await inventoryAPI.adjustStock(adjustModal.item.id, adjustQuantity, adjustReason);
      toast.success('Stock adjusted successfully');
      setAdjustModal({ open: false, item: null });
      fetchInventory();
    } catch {
      toast.error('Failed to adjust stock');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="inventory-page">

      <div className="inventory-header">
        <h1>Inventory Management</h1>

        <div className="tab-buttons">
          <button
            className={activeTab === 'inventory' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>

          <button
            className={activeTab === 'logs' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          <div className="filters">
            <select
              value={selectedCategory || ''}
              onChange={(e) =>
                setSelectedCategory(e.target.value ? Number(e.target.value) : null)
              }
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              Show Low Stock
            </label>
          </div>

          <div className="table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category?.name}</td>

                    <td
                      className={
                        item.stock_quantity <= item.low_stock_threshold
                          ? 'low-stock'
                          : ''
                      }
                    >
                      {item.stock_quantity}
                    </td>

                    <td>{item.low_stock_threshold}</td>

                    <td>
                      {item.is_available ? (
                        <span className="badge success">Available</span>
                      ) : (
                        <span className="badge danger">Unavailable</span>
                      )}
                    </td>

                    <td className="actions">
                      <button
                        className="btn success"
                        onClick={() => setRestockModal({ open: true, item })}
                      >
                        Restock
                      </button>

                      <button
                        className="btn secondary"
                        onClick={() => {
                          setAdjustModal({ open: true, item });
                          setAdjustQuantity(item.stock_quantity);
                        }}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Change</th>
                <th>Old → New</th>
                <th>Reason</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.menu_item?.name}</td>
                  <td>{log.change_type}</td>
                  <td>{log.quantity_change}</td>
                  <td>{log.old_quantity} → {log.new_quantity}</td>
                  <td>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock Modal */}
      {restockModal.open && restockModal.item && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Restock {restockModal.item.name}</h2>

            <input
              type="number"
              min="1"
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(Number(e.target.value))}
              className="input"
            />

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setRestockModal({ open: false, item: null })}
              >
                Cancel
              </button>

              <button className="btn success" onClick={handleRestock}>
                Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal.open && adjustModal.item && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Adjust Stock</h2>

            <input
              type="number"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(Number(e.target.value))}
              className="input"
            />

            <input
              type="text"
              placeholder="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="input"
            />

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setAdjustModal({ open: false, item: null })}
              >
                Cancel
              </button>

              <button
                className="btn primary"
                disabled={!adjustReason}
                onClick={handleAdjust}
              >
                Adjust
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;