import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  Route,
  MapPin,
  Users,
  Navigation,
  Map,
  Play,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Buses", icon: Bus, path: "/buses" },
  { label: "Routes", icon: Route, path: "/routes" },
  { label: "Stops", icon: MapPin, path: "/stops" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Trips", icon: Navigation, path: "/trips" },
  { label: "Live Map", icon: Map, path: "/live-map" },
  { label: "Demo", icon: Play, path: "/demo" },
];

interface SidebarProps {
  onLogout: () => void;
  userName: string;
}

export function Sidebar({ onLogout, userName }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar-background">
      <div className="flex h-14 items-center border-b px-4">
        <Bus className="mr-2 h-6 w-6 text-primary" />
        <span className="font-semibold">Bus Tracker Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{userName}</span>
          <button
            onClick={onLogout}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
