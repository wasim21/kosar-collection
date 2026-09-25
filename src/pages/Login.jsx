import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError(
        "Please enter your username and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Invalid username or password."
        );
      }

      localStorage.setItem(
        "kosar_token",
        data.token
      );

      localStorage.setItem(
        "kosar_user",
        JSON.stringify(data.user)
      );

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background-shape shape-one" />
      <div className="login-background-shape shape-two" />

      <div className="login-container">
        <div className="login-card">

          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Store size={24} />
            </div>

            <div>
              <h1>KOSAR</h1>
              <span>COLLECTION</span>
            </div>
          </div>

          <div className="login-divider" />

          {/* Heading */}
          <div className="login-heading">
            <h2>Welcome Back</h2>

            <p>
              Sign in to manage your shop
            </p>
          </div>

          {/* Login Form */}
          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            {/* Username */}
            <div className="login-field">
              <label htmlFor="username">
                Username
              </label>

              <div className="login-input-wrapper">
                <UserRound
                  size={19}
                  className="login-input-icon"
                />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">
                <LockKeyhole
                  size={19}
                  className="login-input-icon"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Security */}
          <div className="login-security">
            <ShieldCheck size={17} />

            <div>
              <strong>Secure Access</strong>
              <span>
                Authorized personnel only
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <span>
              © {new Date().getFullYear()} WaseemCodes
            </span>

            <span>
              
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
