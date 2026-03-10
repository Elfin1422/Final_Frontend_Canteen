import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { inventoryAPI, menuAPI, categoryAPI } from '../services/api';
import { MenuItem, Category, InventoryLog } from '../types';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  
  // Modal states
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
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const fetchInventory = async () => {
    try {
      const params: any = {};
      if (selectedCategory) {
        params.category_id = selectedCategory;
      }
      if (showLowStock) {
        params.low_stock = true;
      }
      const response = await inventoryAPI.getAll(params);
      setItems(response.data.data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await inventoryAPI.getLogs();
      setLogs(response.data.data);
    } catch (error) {
      toast.error('Failed to load inventory logs');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, showLowStock]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleRestock = async () => {
    if (!restockModal.item) return;
    
    try {
      await inventoryAPI.restock(restockModal.item.id, restockQuantity, 'Manual restock');
      toast.success('Stock updated successfully');
      setRestockModal({ open: false, item: null });
      setRestockQuantity(1);
      fetchInventory();
    } catch (error) {
      toast.error('Failed to restock item');
    }
  };

  const handleAdjust = async () => {
    if (!adjustModal.item || !adjustReason) return;
    
    try {
      await inventoryAPI.adjustStock(adjustModal.item.id, adjustQuantity, adjustReason);
      toast.success('Stock adjusted successfully');
      setAdjustModal({ open: false, item: null });
      setAdjustQuantity(0);
      setAdjustReason('');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'inventory' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'logs' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Logs
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="input w-48"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span>Show Low Stock Only</span>
            </label>
          </div>

          {/* Inventory Table */}
          <div className="table-container card">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Item</th>
                  <th className="table-header-cell">Category</th>
                  <th className="table-header-cell">Stock</th>
                  <th className="table-header-cell">Threshold</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{item.name}</td>
                    <td className="table-cell">{item.category?.name}</td>
                    <td className="table-cell">
                      <span className={item.stock_quantity <= item.low_stock_threshold ? 'text-red-600 font-bold' : ''}>
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td className="table-cell">{item.low_stock_threshold}</td>
                    <td className="table-cell">
                      {item.is_available ? (
                        <span className="badge-success">Available</span>
                      ) : (
                        <span className="badge-danger">Unavailable</span>
                      )}
                      {item.stock_quantity <= item.low_stock_threshold && (
                        <span className="badge-danger ml-2">Low Stock</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRestockModal({ open: true, item })}
                          className="text-sm btn-success py-1 px-2"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => {
                            setAdjustModal({ open: true, item });
                            setAdjustQuantity(item.stock_quantity);
                          }}
                          className="text-sm btn-secondary py-1 px-2"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Logs Table */
        <div className="table-container card">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Item</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Change</th>
                <th className="table-header-cell">Old → New</th>
                <th className="table-header-cell">Reason</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="table-cell">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="table-cell">{log.menu_item?.name}</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      log.change_type === 'addition' ? 'badge-success' :
                      log.change_type === 'deduction' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {log.change_type}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                    </span>
                  </td>
                  <td className="table-cell">{log.old_quantity} → {log.new_quantity}</td>
                  <td className="table-cell">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock Modal */}
      {restockModal.open && restockModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Restock {restockModal.item.name}</h2>
            <p className="text-gray-500 mb-4">Current stock: {restockModal.item.stock_quantity}</p>
            
            <div className="mb-4">
              <label className="label">Quantity to Add</label>
              <input
                type="number"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(Number(e.target.value))}
                className="input"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRestockModal({ open: false, item: null })}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                className="flex-1 btn-success"
              >
                Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal.open && adjustModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Adjust Stock - {adjustModal.item.name}</h2>
            
            <div className="mb-4">
              <label className="label">New Quantity</label>
              <input
                type="number"
                min="0"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                className="input"
              />
            </div>

            <div className="mb-4">
              <label className="label">Reason</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="input"
                placeholder="Enter reason for adjustment"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAdjustModal({ open: false, item: null })}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={!adjustReason}
                className="flex-1 btn-primary disabled:opacity-50"
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
