import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { TicketsProvider } from "./context/TicketsContext";
import { CustomersProvider } from "./context/CustomersContext";
import { AgentsProvider } from "./context/AgentsContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
            <TicketsProvider>
              <CustomersProvider>
                <AgentsProvider>
                  <App />
                </AgentsProvider>
              </CustomersProvider>
            </TicketsProvider>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);