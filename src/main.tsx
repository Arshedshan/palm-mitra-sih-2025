// Replace this file: src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; // <-- IMPORT

createRoot(document.getElementById("root")!).render(
  // Wrap the entire app in the AuthProvider
  <AuthProvider>
    <App />
  </AuthProvider>
);