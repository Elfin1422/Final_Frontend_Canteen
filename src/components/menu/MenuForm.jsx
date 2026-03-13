/**
 * MenuForm.jsx
 * Modal form for creating or editing menu items.
 * Includes client-side validation with per-field error messages.
 * Uses FormData for multipart image uploads.
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';

export default function MenuForm({ item, onSaved, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: '', name: '', description: '', price: '',
    stock_quantity: 0, low_stock_threshold: 10, is_available: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors]       = useState({});
  const [apiError, setApiError]   = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(console.error);
    if (item) {
      setForm({
        category_id:         item.category_id ?? '',
        name:                item.name ?? '',
        description:         item.description ?? '',
        price:               item.price ?? '',
        stock_quantity:      item.stock_quantity ?? 0,
        low_stock_threshold: item.low_stock_threshold ?? 10,
        is_available:        item.is_available ?? true,
      });
    }
  }, [item]);

  /** Client-side validation rules */
  const validate = (f) => {
    const e = {};
    if (!f.category_id)              e.category_id = 'Please select a category.';
    if (!f.name.trim())              e.name        = 'Item name is required.';
    else if (f.name.length > 255)    e.name        = 'Name must be under 255 characters.';
    if (f.price === '' || f.price === null) e.price = 'Price is required.';
    else if (isNaN(f.price) || Number(f.price) < 0)  e.price = 'Price must be a positive number.';
    if (Number(f.stock_quantity) < 0) e.stock_quantity = 'Stock cannot be negative.';
    return e;
  };

  const handleChange = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (item) {
        fd.append('_method', 'PUT');
        await api.postForm(`/menu/${item.id}`, fd);
      } else {
        await api.postForm('/menu', fd);
      }
      onSaved?.();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{item ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
        {apiError && <div className="alert-error" style={{ marginBottom: '.75rem' }}>{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">

            <div className="field">
              <label>Category</label>
              <select value={form.category_id} onChange={handleChange('category_id')}
                className={errors.category_id ? 'input-error' : ''}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <span className="field-error">{errors.category_id}</span>}
            </div>

            <div className="field">
              <label>Item Name</label>
              <input value={form.name} onChange={handleChange('name')}
                placeholder="e.g. Chicken Adobo"
                className={errors.name ? 'input-error' : ''} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="field field-full">
              <label>Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.description} onChange={handleChange('description')}
                rows={2} placeholder="Brief description of the item…" />
            </div>

            <div className="field">
              <label>Price (₱)</label>
              <input type="number" step="0.01" min="0" value={form.price}
                onChange={handleChange('price')}
                className={errors.price ? 'input-error' : ''} />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>

            <div className="field">
              <label>Stock Quantity</label>
              <input type="number" min="0" value={form.stock_quantity}
                onChange={handleChange('stock_quantity')}
                className={errors.stock_quantity ? 'input-error' : ''} />
              {errors.stock_quantity && <span className="field-error">{errors.stock_quantity}</span>}
            </div>

            <div className="field">
              <label>Low Stock Threshold</label>
              <input type="number" min="0" value={form.low_stock_threshold}
                onChange={handleChange('low_stock_threshold')} />
            </div>

            <div className="field">
              <label>Image <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(JPG/PNG, max 2MB)</span></label>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => setImageFile(e.target.files[0])} />
            </div>

            <div className="field field-check">
              <label>
                <input type="checkbox" checked={form.is_available}
                  onChange={handleChange('is_available')} />
                Available for ordering
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
