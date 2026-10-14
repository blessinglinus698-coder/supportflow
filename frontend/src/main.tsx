import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TicketsProvider } from "./context/TicketsContext";
import { CustomersProvider } from "./context/CustomersContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TicketsProvider>
        <CustomersProvider>
          <App />
        </CustomersProvider>
      </TicketsProvider>
    </BrowserRouter>
  </StrictMode>
);