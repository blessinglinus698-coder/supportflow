import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, loading, token } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 32,
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 6 }}>
          SupportFlow
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 24 }}>
          Sign in to your account
        </p>

        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            display: "block",
            marginBottom: 4,
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            marginBottom: 16,
            background: "var(--color-bg)",
            color: "var(--color-text)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />

        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            display: "block",
            marginBottom: 4,
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            marginBottom: 20,
            background: "var(--color-bg)",
            color: "var(--color-text)",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />

        {error && (
          <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "var(--gradient-brand)",
            color: "#fff",
            border: "none",
            padding: "11px 0",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 18, textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;