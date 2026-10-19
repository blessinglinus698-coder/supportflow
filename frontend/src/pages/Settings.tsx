import { useRef, useState } from "react";
import { Moon, Sun, User, Camera } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { name, email, photoUrl, setName, setEmail, setPhotoUrl } = useProfile();
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [savedMsg, setSavedMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => theme !== "light" && toggleTheme()}
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
            onClick={() => theme !== "dark" && toggleTheme()}
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
    </div>
  );
}

export default Settings;