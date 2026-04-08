import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { signIn, registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("signin");
  const [signInData, setSignInData] = useState({
    email: "admin@facetrack.local",
    password: "admin123",
  });
  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSignInChange = (event) => {
    const { name, value } = event.target;
    setSignInData((current) => ({ ...current, [name]: value }));
  };

  const handleSignUpChange = (event) => {
    const { name, value } = event.target;
    setSignUpData((current) => ({ ...current, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await signIn(signInData);
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await registerUser(signUpData);
      setSuccess(response.message);
      setSignInData((current) => ({
        ...current,
        email: signUpData.email,
        password: signUpData.password,
      }));
      setSignUpData({ fullName: "", email: "", password: "" });
      setMode("signin");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-card__eyebrow">Secure Access</span>
        <h1>Admin Login</h1>
        <p>Sign in to manage students and review live attendance activity, or create a new account.</p>

        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "signin" ? "auth-toggle__tab auth-toggle__tab--active" : "auth-toggle__tab"}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "auth-toggle__tab auth-toggle__tab--active" : "auth-toggle__tab"}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-form-shell">
          {mode === "signin" ? (
            <form onSubmit={handleSignInSubmit} className="auth-form">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={signInData.email}
                  onChange={handleSignInChange}
                  placeholder="Enter your email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={signInData.password}
                  onChange={handleSignInChange}
                  placeholder="Enter your password"
                />
              </label>
              {error ? <div className="alert alert--danger">{error}</div> : null}
              {success ? <div className="alert alert--success">{success}</div> : null}
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="auth-form">
              <label>
                Full Name
                <input
                  type="text"
                  name="fullName"
                  value={signUpData.fullName}
                  onChange={handleSignUpChange}
                  placeholder="Enter your full name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={signUpData.email}
                  onChange={handleSignUpChange}
                  placeholder="Enter your email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={signUpData.password}
                  onChange={handleSignUpChange}
                  placeholder="Create a password"
                />
              </label>
              {error ? <div className="alert alert--danger">{error}</div> : null}
              {success ? <div className="alert alert--success">{success}</div> : null}
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
