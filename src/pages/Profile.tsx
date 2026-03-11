import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import "./Profile.css";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data.user);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.updateProfile(passwordData);
      toast.success("Password changed successfully");

      setPasswordData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "badge-admin";
      case "cashier":
        return "badge-cashier";
      case "customer":
        return "badge-customer";
      default:
        return "badge-default";
    }
  };

  return (
    <div className="profile-container">

      <h1 className="page-title">My Profile</h1>

      {/* PROFILE CARD */}
      <div className="card">

        <div className="card-header">
          <h2>Profile Information</h2>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="link-button"
            >
              Edit
            </button>
          )}
        </div>

        <div className="card-body">

          {isEditing ? (
            <div className="form">

              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="form-buttons">
                <button
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn-primary"
                  disabled={isLoading}
                  onClick={handleUpdateProfile}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </div>
          ) : (
            <div className="profile-info">

              <div className="profile-header">

                <div className="avatar">
                  {user?.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3>{user?.name}</h3>

                  <span className={`badge ${getRoleBadgeColor(user?.role || "")}`}>
                    {user?.role}
                  </span>
                </div>

              </div>

              <div className="profile-grid">

                <div>
                  <p className="label">Email</p>
                  <p>{user?.email}</p>
                </div>

                <div>
                  <p className="label">Phone</p>
                  <p>{user?.phone || "-"}</p>
                </div>

                <div>
                  <p className="label">Status</p>
                  <p>
                    {user?.is_active ? (
                      <span className="active">Active</span>
                    ) : (
                      <span className="inactive">Inactive</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="label">Member Since</p>
                  <p>
                    {user?.created_at &&
                      new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* PASSWORD CARD */}
      <div className="card">

        <div className="card-header">

          <h2>Change Password</h2>

          {!isChangingPassword && (
            <button
              className="link-button"
              onClick={() => setIsChangingPassword(true)}
            >
              Change
            </button>
          )}

        </div>

        <div className="card-body">

          {isChangingPassword ? (

            <div className="form">

              <div>
                <label>Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>New Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.password_confirmation}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      password_confirmation: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-buttons">
                <button
                  className="btn-secondary"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn-primary"
                  disabled={isLoading}
                  onClick={handleChangePassword}
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </button>
              </div>

            </div>

          ) : (
            <p className="hint">
              Click "Change" to update your password.
            </p>
          )}

        </div>
      </div>

    </div>
  );
};

export default Profile;