import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import { TopBar } from '../components/common/index.jsx';
import AdminDashboard  from '../components/dashboard/AdminDashboard.jsx';
import MenuList  from '../components/menu/MenuList.jsx';
import MenuForm  from '../components/menu/MenuForm.jsx';
import InventoryTable from '../components/inventory/InventoryTable.jsx';
import LowStockAlert  from '../components/inventory/LowStockAlert.jsx';
import OrderQueue     from '../components/orders/OrderQueue.jsx';
import { api } from '../services/api.js';
import ReportsPage from '../components/reports/ReportsPage.jsx';

const LINKS = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/menu',      icon: '🍱', label: 'Menu'      },
  { to: '/admin/orders',    icon: '📋', label: 'Orders'    },
  { to: '/admin/inventory', icon: '📦', label: 'Inventory' },
  { to: '/admin/reports',   icon: '📈', label: 'Reports'   },
];

const TITLES = {
  '/admin/dashboard': 'Sales Dashboard',
  '/admin/menu':      'Menu Management',
  '/admin/orders':    'Order Queue',
  '/admin/inventory': 'Inventory',
  '/admin/reports':   'Reports',
};

function AdminMenu() {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [refresh, setRefresh] = useState(0);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    await api.delete(`/menu/${item.id}`);
    setRefresh(r => r + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Menu Management</h3>
        <button type="button" className="btn-primary" onClick={() => setAdding(true)}>+ Add Item</button>
      </div>
      <MenuList key={refresh} adminMode onEdit={setEditing} onDelete={handleDelete} />
      {(adding || editing) && (
        <MenuForm
          item={editing}
          onSaved={() => { setEditing(null); setAdding(false); setRefresh(r => r + 1); }}
          onCancel={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Admin';
  return (
    <div className="app-layout">
      <Sidebar links={LINKS} />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-body">
          <Routes>
            <Route path="dashboard" element={<><LowStockAlert /><AdminDashboard /></>} />
            <Route path="menu"      element={<AdminMenu />} />
            <Route path="orders"    element={<OrderQueue />} />
            <Route path="inventory" element={<InventoryTable />} />
            <Route path="reports"   element={<ReportsPage />} />
            <Route path="*"         element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
