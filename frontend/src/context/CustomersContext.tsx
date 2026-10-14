import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Customer } from "../types/customer";

const API_URL = "http://localhost:5000/api/customers";

interface CustomersContextValue {
  customers: Customer[];
  loading: boolean;
  addCustomer: (customer: Omit<Customer, "id" | "openTickets" | "totalTickets" | "joined">) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextValue | undefined>(undefined);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch((err) => console.error("Failed to load customers:", err))
      .finally(() => setLoading(false));
  }, []);

  async function addCustomer(customer: Omit<Customer, "id" | "openTickets" | "totalTickets" | "joined">) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
    const newCustomer = await res.json();
    setCustomers((prev) => [newCustomer, ...prev]);
  }

  return (
    <CustomersContext.Provider value={{ customers, loading, addCustomer }}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error("useCustomers must be used within a CustomersProvider");
  }
  return context;
}