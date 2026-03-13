import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import MenuItemCard from './MenuItemCard.jsx';
import { MenuSkeleton } from '../common/SkeletonLoader.jsx';

export default function MenuList({ onAddToCart, adminMode = false, onEdit, onDelete }) {
  const [items, setItems]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [loading, setLoading]       = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.set('search', search);
      if (catFilter) params.set('category_id', catFilter);
      const data = await api.get(`/menu?${params.toString()}`);
      setItems(data.data ?? data);
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(console.error);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const toggleAvailability = async (item) => {
    await api.patch(`/menu/${item.id}/toggle`);
    fetchItems();
  };

  return (
    <div className="menu-list">
      <div className="menu-filters">
        <input
          className="search-input"
          placeholder="🔍 Search menu…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="cat-chips">
          <button type="button" className={`chip${catFilter === '' ? ' active' : ''}`} onClick={() => setCatFilter('')}>All</button>
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              className={`chip${String(catFilter) === String(c.id) ? ' active' : ''}`}
              onClick={() => setCatFilter(c.id)}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <MenuSkeleton count={8} />
      ) : (
        <div className="menu-grid">
          {items.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              adminMode={adminMode}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={toggleAvailability}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}
