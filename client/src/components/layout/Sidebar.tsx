import { NavLink, useLocation } from "react-router-dom";
import { Briefcase, Key, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Applications", icon: Briefcase },
  { to: "/api-keys", label: "API Keys", icon: Key },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (item: typeof navItems[number]) => {
    if (item.to === "/") {
      return location.pathname === "/" || location.pathname.startsWith("/applications");
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 px-6 py-5">
        <img src="/logo.png" alt="JobWise" className="h-6 w-6" />
        <span className="text-lg font-semibold">JobWise</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={() =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
