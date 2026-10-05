import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Boxes, FilePlus2, History, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const nav = [
  { to: "/app", label: "Panel", icon: LayoutDashboard, exact: true },
  { to: "/app/reporte/nuevo", label: "Nuevo", icon: FilePlus2 },
  { to: "/app/historial", label: "Historial", icon: History },
  { to: "/app/catalogos", label: "Catálogos", icon: Boxes },
] as const;

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest">
  MINE REPORT PRO
</span>
        </Link>
        <nav className="hidden gap-1 sm:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n ? n.exact : false }}
              activeProps={{ className: "bg-primary/15 text-primary" }}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 pb-20 sm:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card sm:hidden">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: "exact" in n ? n.exact : false }}
            activeProps={{ className: "text-primary" }}
            className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
