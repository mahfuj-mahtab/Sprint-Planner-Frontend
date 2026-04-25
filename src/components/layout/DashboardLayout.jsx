import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import LeftSidebar from "@/components/LeftSidebar";
import Profileheader from "@/components/profileheader";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children, sidebar = <LeftSidebar /> }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-dvh bg-background text-foreground overflow-hidden">
      <aside className="hidden md:block w-64 shrink-0 bg-sidebar border-r border-border overflow-y-auto">
        {sidebar}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-sidebar border-r border-border overflow-y-auto transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebar}
        </div>
      </div>

      <div className="flex-1 min-w-0 bg-background overflow-y-auto">
        <Profileheader onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
}

