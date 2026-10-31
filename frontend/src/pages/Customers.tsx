import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useCustomers } from "../context/CustomersContext";
import type { Customer } from "../types/customer";

interface CustomerFormValues {
  name: string;
  email: string;
  company: string;
}

interface CustomerModalProps {
  title: string;
  initialValues: CustomerFormValues;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
}

function CustomerModal({ title, initialValues, submitLabel, onClose, onSubmit }: CustomerModalProps) {
  const [name, setName] = useState(initialValues.name);
  const [email, setEmail] = useState(initialValues.email);
  const [company, setCompany] = useState(initialValues.company);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), company: company.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 40 }} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 26,
          width: 400,
          zIndex: 50,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 18 }}>{title}</h2>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
          />

          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Email</label>
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane@company.com"
          />

          <label style={{ fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>Company</label>
          <input
            style={inputStyle}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional"
          />

          {error && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 10 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: "none",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                background: "var(--gradient-brand)",
                color: "#fff",
                border: "none",
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.6 : 1,
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Customers() {
  const { customers, loading, addCustomer, updateCustomer } = useCustomers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  return (
    <div style={{ padding: 28, background: "var(--color-bg)", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>Customers</h1>
        <button
          onClick={() => setShowAddModal(true)}
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
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Loading customers...</p>
      ) : (
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-bg)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Email</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Company</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Open Tickets</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total Tickets</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.4px" }}>Joined</th>
                <th style={{ padding: "12px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderTop: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text)" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{c.email}</td>
                  <td style={{ padding: "12px 16px" }}>{c.company}</td>
                  <td style={{ padding: "12px 16px" }}>{c.openTickets}</td>
                  <td style={{ padding: "12px 16px" }}>{c.totalTickets}</td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{c.joined}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setEditingCustomer(c)}
                      title="Edit customer"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <p style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
              No customers yet.
            </p>
          )}
        </div>
      )}

      {showAddModal && (
        <CustomerModal
          title="Add Customer"
          initialValues={{ name: "", email: "", company: "" }}
          submitLabel="Add Customer"
          onClose={() => setShowAddModal(false)}
          onSubmit={(values) => addCustomer(values)}
        />
      )}

      {editingCustomer && (
        <CustomerModal
          title="Edit Customer"
          initialValues={{
            name: editingCustomer.name,
            email: editingCustomer.email,
            company: editingCustomer.company,
          }}
          submitLabel="Save Changes"
          onClose={() => setEditingCustomer(null)}
          onSubmit={(values) => updateCustomer(editingCustomer.id, values)}
        />
      )}
    </div>
  );
}

export default Customers;