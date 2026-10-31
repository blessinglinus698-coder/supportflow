import { useRef, useState, useEffect, useCallback } from "react";
import { Moon, Sun, Waves, User, Camera, MessageSquare, Link2, Copy, Trash2, Plus } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000";

interface ContactFormSettings {
  enabled: boolean;
  title: string;
  intro: string;
  phoneMode: "required" | "optional" | "hidden";
  emailMode: "required" | "optional";
}

interface ExternalSource {
  id: string;
  label: string;
  apiKey: string;
  enabled: boolean;
  createdAt: string;
}

function getAuthHeaders() {
  let token: string | null;
  try {
    token = sessionStorage.getItem("supportflow-token");
  } catch {
    token = null;
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function Settings() {
  const { theme, setTheme } = useTheme();
  const { name, email, photoUrl, setName, setEmail, setPhotoUrl } = useProfile();
  const { agent } = useAuth();
  const isAdmin = agent?.role === "admin";

  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [savedMsg, setSavedMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact form settings (admin only)
  const [formSettings, setFormSettings] = useState<ContactFormSettings | null>(null);
  const [formLoading, setFormLoading] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formError, setFormError] = useState("");

  // External sources (admin only)
  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [newSourceLabel, setNewSourceLabel] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadContactFormSettings = useCallback(async () => {
    if (!isAdmin) return;
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/contact-form`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load contact form settings");
      const data = await res.json();
      setFormSettings(data);
    } catch (err) {
      console.error(err);
      setFormError("Couldn't load contact form settings.");
    } finally {
      setFormLoading(false);
    }
  }, [isAdmin]);

  const loadSources = useCallback(async () => {
    if (!isAdmin) return;
    setSourcesLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/external-sources`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load external sources");
      const data = await res.json();
      setSources(data);
    } catch (err) {
      console.error(err);
      setSourceError("Couldn't load external sources.");
    } finally {
      setSourcesLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time admin data load on mount; these are async fetches, not synchronous state churn
    loadContactFormSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time admin data load on mount; these are async fetches, not synchronous state churn
    loadSources();
  }, [loadContactFormSettings, loadSources]);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 14,
    padding: 24,
    boxShadow: "var(--shadow-card)",
    maxWidth: 700,
    marginBottom: 20,
  };

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    fontSize: 14,
    fontFamily: "inherit",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--color-text-muted)",
    fontWeight: 600,
    marginBottom: 4,
    display: "block",
  };

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg("Profile updated.");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveContactForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formSettings) return;
    setFormSaving(true);
    setFormError("");
    setFormMsg("");
    try {
      const res = await fetch(`${API_URL}/api/settings/contact-form`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          enabled: formSettings.enabled,
          title: formSettings.title,
          intro: formSettings.intro,
          phoneMode: formSettings.phoneMode,
          emailMode: formSettings.emailMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setFormSettings(data);
      setFormMsg("Contact form settings saved.");
      setTimeout(() => setFormMsg(""), 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleToggleFormEnabled() {
    if (!formSettings) return;
    const previous = formSettings;
    const next = { ...formSettings, enabled: !formSettings.enabled };
    setFormSettings(next);
    try {
      const res = await fetch(`${API_URL}/api/settings/contact-form`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: next.enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setFormSettings(data);
    } catch (err) {
      setFormSettings(previous);
      setFormError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleCreateSource(e: React.FormEvent) {
    e.preventDefault();
    setSourceError("");
    if (!newSourceLabel.trim()) {
      setSourceError("Enter a name for the source first.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/settings/external-sources`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ label: newSourceLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create source");
      setSources((prev) => [data, ...prev]);
      setNewSourceLabel("");
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Failed to create source");
    }
  }

  async function handleToggleSource(source: ExternalSource) {
    try {
      const res = await fetch(`${API_URL}/api/settings/external-sources/${source.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !source.enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update source");
      setSources((prev) => prev.map((s) => (s.id === source.id ? data : s)));
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Failed to update source");
    }
  }

  async function handleDeleteSource(source: ExternalSource) {
    if (
      !window.confirm(`Remove "${source.label}"? Any site still using this key will stop being able to submit.`)
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/settings/external-sources/${source.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete source");
      }
      setSources((prev) => prev.filter((s) => s.id !== source.id));
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Failed to delete source");
    }
  }

  function handleCopyKey(source: ExternalSource) {
    navigator.clipboard
      .writeText(source.apiKey)
      .then(() => {
        setCopiedId(source.id);
        setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => {
        setSourceError("Couldn't copy to clipboard — select and copy the key manually.");
      });
  }

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "100%" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 22 }}>
        Settings
      </h1>

      {/* Edit Profile */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <User size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>Edit Profile</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: photoUrl ? `url(${photoUrl}) center/cover` : "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
            }}
            title="Click to change photo"
          >
            {!photoUrl && name.charAt(0).toUpperCase()}
            <div
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--color-card)",
                border: "2px solid var(--color-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={13} color="var(--color-primary)" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>
              Profile photo
            </p>
            <p
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: 13, color: "var(--color-primary)", cursor: "pointer", fontWeight: 600 }}
            >
              {photoUrl ? "Change photo" : "Upload photo"}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: "none" }}
          />
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button
            type="submit"
            style={{
              alignSelf: "flex-start",
              background: "var(--gradient-brand)",
              color: "#fff",
              border: "none",
              padding: "9px 18px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
          {savedMsg && <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{savedMsg}</p>}
        </form>
      </div>

      {/* Appearance */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>Appearance</h2>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 16 }}>
          Choose how SupportFlow looks on your device.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setTheme("light")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: theme === "light" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              background: theme === "light" ? "#eef2ff" : "var(--color-bg)",
              color: "var(--color-text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Sun size={16} /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: theme === "dark" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              background: theme === "dark" ? "#1e293b" : "var(--color-bg)",
              color: "var(--color-text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Moon size={16} /> Dark
          </button>
          <button
            onClick={() => setTheme("ocean")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: theme === "ocean" ? "2px solid #22d3ee" : "1px solid var(--color-border)",
              background: theme === "ocean" ? "#0a1f29" : "var(--color-bg)",
              color: theme === "ocean" ? "#e4fbf7" : "var(--color-text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Waves size={16} /> Ocean Bed
          </button>
        </div>
      </div>

      {/* Time & Date */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Time & Date</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Timezone</label>
            <select style={inputStyle} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Date Format</label>
            <select style={inputStyle} value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          {/* Contact Form */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <MessageSquare size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>Contact Form</h2>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 18 }}>
              Controls the public contact page at <code>/contact</code> — where new customer messages become
              tickets.
            </p>

            {formLoading ? (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Loading...</p>
            ) : formSettings ? (
              <form
                onSubmit={handleSaveContactForm}
                style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                      Accepting submissions
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      Turn off to temporarily stop new messages from the public form.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFormEnabled}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      background: formSettings.enabled ? "var(--color-primary)" : "var(--color-border)",
                      position: "relative",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    aria-label="Toggle contact form"
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: formSettings.enabled ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.15s ease",
                      }}
                    />
                  </button>
                </div>

                <div>
                  <label style={labelStyle}>Form title</label>
                  <input
                    style={inputStyle}
                    value={formSettings.title}
                    onChange={(e) => setFormSettings({ ...formSettings, title: e.target.value })}
                    maxLength={120}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Intro text</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                    value={formSettings.intro}
                    onChange={(e) => setFormSettings({ ...formSettings, intro: e.target.value })}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email field</label>
                  <select
                    style={inputStyle}
                    value={formSettings.emailMode}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        emailMode: e.target.value as ContactFormSettings["emailMode"],
                      })
                    }
                  >
                    <option value="required">Required</option>
                    <option value="optional">Optional</option>
                  </select>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                    No "Hidden" option — email is how a submission gets matched to a customer record. Leaving it
                    optional means a submission without one always creates a new customer.
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Phone number field</label>
                  <select
                    style={inputStyle}
                    value={formSettings.phoneMode}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        phoneMode: e.target.value as ContactFormSettings["phoneMode"],
                      })
                    }
                  >
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={formSaving}
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--gradient-brand)",
                    color: "#fff",
                    border: "none",
                    padding: "9px 18px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: formSaving ? "default" : "pointer",
                    opacity: formSaving ? 0.6 : 1,
                  }}
                >
                  {formSaving ? "Saving..." : "Save Changes"}
                </button>
                {formMsg && <p style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{formMsg}</p>}
                {formError && <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{formError}</p>}
              </form>
            ) : (
              <p style={{ fontSize: 13, color: "#ef4444" }}>{formError || "Couldn't load settings."}</p>
            )}
          </div>

          {/* External Sources */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Link2 size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>External Sources</h2>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 18 }}>
              Let another organization's own website or form send messages into SupportFlow. Each source gets
              its own API key — have them send it as an <code>X-Source-Key</code> header when posting to your
              contact endpoint.
            </p>

            <form onSubmit={handleCreateSource} style={{ display: "flex", gap: 10, marginBottom: 18, maxWidth: 440 }}>
              <input
                style={inputStyle}
                placeholder="e.g. Partner Co. website"
                value={newSourceLabel}
                onChange={(e) => setNewSourceLabel(e.target.value)}
              />
              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--gradient-brand)",
                  color: "#fff",
                  border: "none",
                  padding: "9px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Plus size={15} /> Add Source
              </button>
            </form>

            {sourceError && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{sourceError}</p>}

            {sourcesLoading ? (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Loading...</p>
            ) : sources.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No external sources yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sources.map((source) => (
                  <div
                    key={source.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg)",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>
                        {source.label}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <code
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                            background: "var(--color-card)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {source.apiKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(source)}
                          title="Copy API key"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: copiedId === source.id ? "#16a34a" : "var(--color-text-muted)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Copy size={14} />
                        </button>
                        {copiedId === source.id && (
                          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Copied</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: source.enabled ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.2)",
                          color: source.enabled ? "#16a34a" : "var(--color-text-muted)",
                        }}
                      >
                        {source.enabled ? "Active" : "Disabled"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSource(source)}
                        style={{
                          background: "none",
                          border: "1px solid var(--color-border)",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--color-text)",
                          cursor: "pointer",
                        }}
                      >
                        {source.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSource(source)}
                        title="Delete source"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Settings;