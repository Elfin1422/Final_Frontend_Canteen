import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authAPI } from "../services/api";
import { User } from "../types";
import "./Users.css";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState({
    role: "",
    search: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const params: any = {};

      if (filter.role) params.role = filter.role;
      if (filter.search) params.search = filter.search;

      const response = await authAPI.getUsers(params);
      setUsers(response.data.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await authAPI.toggleUserStatus(userId);
      toast.success("User status updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case "admin":
        return "badge purple";
      case "cashier":
        return "badge blue";
      case "customer":
        return "badge green";
      default:
        return "badge gray";
    }
  };

  if (isLoading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="users-container">

      <div className="users-header">
        <h1>User Management</h1>

        <div className="filters">

          <select
            value={filter.role}
            onChange={(e) =>
              setFilter({ ...filter, role: e.target.value })
            }
            className="input"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            <option value="customer">Customer</option>
          </select>

          <input
            type="text"
            placeholder="Search users..."
            value={filter.search}
            onChange={(e) =>
              setFilter({ ...filter, search: e.target.value })
            }
            className="input"
          />

        </div>
      </div>

      <div className="card table-container">

        <table className="table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>

                <td>{user.name}</td>
                <td>{user.email}</td>

                <td>
                  <span className={getRoleClass(user.role)}>
                    {user.role}
                  </span>
                </td>

                <td>{user.phone || "-"}</td>

                <td>
                  {user.is_active ? (
                    <span className="badge success">Active</span>
                  ) : (
                    <span className="badge danger">Inactive</span>
                  )}
                </td>

                <td>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>

                <td>
                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className={
                      user.is_active
                        ? "btn-deactivate"
                        : "btn-activate"
                    }
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Users;