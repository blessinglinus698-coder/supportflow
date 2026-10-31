import { useState, useEffect } from "react";

interface ContactFormConfig {
  enabled: boolean;
  title: string;
  intro: string;
  phoneMode: "required" | "optional" | "hidden";
  emailMode: "required" | "optional";
}

function Contact() {
  const [config, setConfig] = useState<ContactFormConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/public/contact-form-config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Failed to load contact form config:", err))
      .finally(() => setConfigLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const res = await fetch("http://localhost:5000/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      setStatus("success");
      setFeedback(data.message);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setFeedback(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
    fontFamily: "inherit",
    background: "var(--color-bg)",
    color: "var(--color-text)",
  };

  if (configLoading) {
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
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (config && !config.enabled) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--color-bg)",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 32,
            width: 420,
            textAlign: "center",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
            Form unavailable
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            This contact form isn't accepting submissions right now. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  const phoneMode = config?.phoneMode || "optional";
  const emailMode = config?.emailMode || "required";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--color-bg)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 32,
          width: 420,
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>
          {config?.title || "Contact Support"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 20 }}>
          {config?.intro || "Tell us what's going on and we'll get back to you."}
        </p>

        {status === "success" ? (
          <p style={{ color: "#22c55e", fontSize: 14 }}>{feedback}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />

            <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>
              Email {emailMode === "optional" ? "(optional)" : ""}
            </label>
            <input
              type="email"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={emailMode === "required"}
            />

            {phoneMode !== "hidden" && (
              <>
                <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>
                  Phone {phoneMode === "optional" ? "(optional)" : ""}
                </label>
                <input
                  style={inputStyle}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={phoneMode === "required"}
                />
              </>
            )}

            <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Message</label>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />

            {status === "error" && (
              <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{feedback}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                width: "100%",
                background: "var(--gradient-brand)",
                color: "#fff",
                border: "none",
                padding: "11px 0",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: status === "submitting" ? "default" : "pointer",
                opacity: status === "submitting" ? 0.6 : 1,
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Contact;