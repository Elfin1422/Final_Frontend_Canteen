export default function MenuItemCard({ item, adminMode, onEdit, onDelete, onToggle, onAddToCart }) {
  return (
    <div className={`menu-card${!item.is_available ? ' unavailable' : ''}`}>
      <div className="menu-card-img">
        {item.image
          ? <img src={`${import.meta.env.VITE_STORAGE_URL}/${item.image}`} alt={item.name} />
          : <span className="menu-placeholder">🍽️</span>
        }
        {!item.is_available && <div className="out-of-stock-badge">Out of Stock</div>}
        {item.is_available && item.stock_quantity <= item.low_stock_threshold && (
          <div className="low-stock-badge">Low Stock</div>
        )}
      </div>

      <div className="menu-card-body">
        <div className="menu-card-cat">{item.category?.name}</div>
        <h4 className="menu-card-name">{item.name}</h4>
        {item.description && <p className="menu-card-desc">{item.description}</p>}
        <div className="menu-card-footer">
          <span className="menu-price">₱{Number(item.price).toFixed(2)}</span>
          {adminMode ? (
            <div className="menu-admin-actions">
              <button type="button" className="btn-sm btn-outline" onClick={() => onToggle?.(item)}>
                {item.is_available ? 'Disable' : 'Enable'}
              </button>
              <button type="button" className="btn-sm btn-outline" onClick={() => onEdit?.(item)}>Edit</button>
              <button type="button" className="btn-sm btn-danger-outline" onClick={() => onDelete?.(item)}>Del</button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-add"
              disabled={!item.is_available}
              onClick={() => onAddToCart?.(item)}
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
