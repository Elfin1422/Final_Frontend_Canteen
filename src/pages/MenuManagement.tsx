import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { menuAPI, categoryAPI } from '../services/api';
import { MenuItem, Category } from '../types';
import './MenuManagement.css';

const MenuManagement: React.FC = () => {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    preparation_time: '10',
    is_available: true,
    is_featured: false,
    image: null as File | null,
  });

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const fetchMenuItems = async () => {
    try {

      const params: any = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await menuAPI.getAll(params);
      setMenuItems(response.data.data);

    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item?: MenuItem) => {

    if (item) {
      setEditingItem(item);

      setFormData({
        name: item.name,
        description: item.description || '',
        category_id: String(item.category_id),
        price: String(item.price),
        cost: String(item.cost || ''),
        stock_quantity: String(item.stock_quantity),
        low_stock_threshold: String(item.low_stock_threshold),
        preparation_time: String(item.preparation_time),
        is_available: item.is_available,
        is_featured: item.is_featured,
        image: null,
      });

    } else {

      setEditingItem(null);

      setFormData({
        name: '',
        description: '',
        category_id: '',
        price: '',
        cost: '',
        stock_quantity: '',
        low_stock_threshold: '10',
        preparation_time: '10',
        is_available: true,
        is_featured: false,
        image: null,
      });

    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {

      if (key === 'image' && value) {
        data.append('image', value);
      } else if (value !== null && value !== undefined) {
        data.append(key, String(value));
      }

    });

    try {

      if (editingItem) {
        await menuAPI.update(editingItem.id, data);
        toast.success('Menu item updated');
      } else {
        await menuAPI.create(data);
        toast.success('Menu item created');
      }

      setShowModal(false);
      fetchMenuItems();

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    }

  };

  const handleDelete = async (id: number) => {

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {

      await menuAPI.delete(id);
      toast.success('Menu item deleted');
      fetchMenuItems();

    } catch {
      toast.error('Failed to delete menu item');
    }

  };

  const handleToggleAvailability = async (item: MenuItem) => {

    try {

      await menuAPI.toggleAvailability(item.id);
      toast.success('Availability updated');
      fetchMenuItems();

    } catch {
      toast.error('Failed to update availability');
    }

  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="menu-page">

      <div className="menu-header">
        <h1>Menu Management</h1>

        <button
          className="btn-primary"
          onClick={() => handleOpenModal()}
        >
          + Add Item
        </button>
      </div>

      <div className="menu-filters">

        <input
          type="text"
          placeholder="Search items..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="input"
          value={selectedCategory || ''}
          onChange={(e) =>
            setSelectedCategory(
              e.target.value ? Number(e.target.value) : null
            )
          }
        >

          <option value="">All Categories</option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}

        </select>

      </div>

      <div className="table-container">

        <table className="menu-table">

          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {menuItems.map((item) => (

              <tr key={item.id}>

                <td>
                  <div className="item-info">

                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="item-placeholder"></div>
                    )}

                    <div>
                      <p className="item-name">{item.name}</p>

                      {item.is_featured && (
                        <span className="badge-warning">
                          Featured
                        </span>
                      )}

                    </div>

                  </div>
                </td>

                <td>{item.category?.name}</td>

                <td>{formatCurrency(item.price)}</td>

                <td
                  className={
                    item.stock_quantity <= item.low_stock_threshold
                      ? 'low-stock'
                      : ''
                  }
                >
                  {item.stock_quantity}
                </td>

                <td>

                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={
                      item.is_available
                        ? 'status available'
                        : 'status unavailable'
                    }
                  >
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </button>

                </td>

                <td className="actions">

                  <button
                    className="edit-btn"
                    onClick={() => handleOpenModal(item)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            <h2>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>

            <form onSubmit={handleSubmit} className="menu-form">

              <input
                placeholder="Name"
                className="input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <textarea
                placeholder="Description"
                className="input"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Price"
                className="input"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </div>
  );
};

export default MenuManagement;