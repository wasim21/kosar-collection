import { useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

function ProtectedLayout({ children }) {
  const token = localStorage.getItem("kosar_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [, setAuthChange] = useState(false);

  const token = localStorage.getItem("kosar_token");

  return (
    <Routes>

      {/* =========================
          LOGIN
      ========================= */}

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* =========================
          PROTECTED APPLICATION
      ========================= */}

      <Route
        path="/*"
        element={
          <ProtectedLayout>
            <Routes>

              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/sales"
                element={<Sales />}
              />

              <Route
                path="/purchases"
                element={<Purchases />}
              />

              <Route
                path="/inventory"
                element={<Inventory />}
              />

              <Route
                path="/expenses"
                element={<Expenses />}
              />

              <Route
                path="/reports"
                element={<Reports />}
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />

            </Routes>
          </ProtectedLayout>
        }
      />

    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}
