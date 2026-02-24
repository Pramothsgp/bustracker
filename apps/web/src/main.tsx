import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/sidebar";
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import { BusesPage } from "@/pages/buses";
import { RoutesPage } from "@/pages/routes";
import { StopsPage } from "@/pages/stops";
import { UsersPage } from "@/pages/users";
import { TripsPage } from "@/pages/trips";
import { LiveMapPage } from "@/pages/live-map";
import { DemoPage } from "@/pages/demo";
import "./app.css";

function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar onLogout={logout} userName={user.name} />
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/buses" element={<BusesPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/stops" element={<StopsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/live-map" element={<LiveMapPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
