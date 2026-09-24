import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import "./StaffLogin.css";

function StaffLogin() {
  const [loginForm, setLoginForm] = useState({ userId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      // 1. Send Login Request
      const response = await authApi.staffLogin(loginForm.userId, loginForm.password);

      // 2. Extract user and role safely matching your backend JSON output
      const userData = response?.user || response?.staff || {};
      const userRole = userData.role || response?.role || "staff";
      const displayName = userData.full_name || userData.username || loginForm.userId;

      // 3. Save to localStorage
      if (response?.token) {
        localStorage.setItem("auth_token", response.token);
      }
      localStorage.setItem("staff_role", userRole);
      localStorage.setItem("auth_user_name", displayName);

      // 4. Role-based redirect
      if (userRole === "admin" || userRole === "super_admin") {
        navigate("/admin");
      } else {
        navigate("/staff");
      }
    } catch (err) {
      setLoginError(err.message || "Invalid Username or Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <h2>Staff Portal Login</h2>
        <p className="login-subtitle">Access your schedule & appointment management</p>

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label>User ID / Username</label>
            <input
              type="text"
              required
              value={loginForm.userId}
              onChange={(e) => setLoginForm({ ...loginForm, userId: e.target.value })}
              placeholder="e.g. gabbablu"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {loginError && <p className="login-error-msg">{loginError}</p>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-container">
                <span className="spinning-circle" />
                Logging in...
              </span>
            ) : (
              "Log In to Schedule"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StaffLogin;