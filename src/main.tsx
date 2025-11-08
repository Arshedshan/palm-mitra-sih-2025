// Replace this file: src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; // <-- Farmer context
import { InvestorAuthProvider } from "./context/InvestorAuthContext"; // <-- Investor context

createRoot(document.getElementById("root")!).render(
  // Wrap the entire app in BOTH providers
  // They will live side-by-side
  <AuthProvider>
    <InvestorAuthProvider>
      <App />
    </InvestorAuthProvider>
  </AuthProvider>
);