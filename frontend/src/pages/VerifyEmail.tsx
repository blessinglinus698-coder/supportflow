import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(() =>
    token ? "" : "This verification link is missing its token."
  );

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await fetch("http://localhost:5000/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Verification failed");
        }
        setStatus("success");
        setMessage("Your email has been verified.");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    verify();
  }, [token]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 36,
          width: 380,
          textAlign: "center",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {status === "loading" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
              Verifying your email...
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>One moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
              ✅ Email verified
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>{message}</p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                background: "var(--gradient-brand)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
              Verification failed
            </h2>
            <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 20 }}>{message}</p>
            <Link to="/login" style={{ color: "var(--color-primary)", fontSize: 14, fontWeight: 600 }}>
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;