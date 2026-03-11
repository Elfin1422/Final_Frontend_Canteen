import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import "./Register.css";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: [],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setErrors({});

    try {
      await register(formData);

      toast.success("Registration successful!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-header">
          <h1>Canteen Management</h1>
          <h2>Create your account</h2>

          <p>
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">

          <div className="form-group">
            <label>Full Name</label>

            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={errors.name ? "input-error" : "input"}
              required
            />

            {errors.name && <p className="error">{errors.name[0]}</p>}
          </div>

          <div className="form-group">
            <label>Email address</label>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? "input-error" : "input"}
              required
            />

            {errors.email && <p className="error">{errors.email[0]}</p>}
          </div>

          <div className="form-group">
            <label>Phone Number (optional)</label>

            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className={errors.phone ? "input-error" : "input"}
            />

            {errors.phone && <p className="error">{errors.phone[0]}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? "input-error" : "input"}
              required
            />

            {errors.password && <p className="error">{errors.password[0]}</p>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              name="password_confirmation"
              type="password"
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={errors.password_confirmation ? "input-error" : "input"}
              required
            />

            {errors.password_confirmation && (
              <p className="error">{errors.password_confirmation[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary full"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Register;