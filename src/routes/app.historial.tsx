import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { descargarPdf } from "@/lib/ops-pdf";
import { getData, nombreSupervisor, useOpsData } from "@/lib/ops-store";

export const Route = createFileRoute("/app/historial")({
  head: () => ({
    meta: [
      { title: "Historial de reportes | Guardia Ops" },
      {
        name: "description",
        content: "Filtre reportes de guardia por fecha, tipo de guardia, supervisor y estado de sincronización.",
      },
      { property: "og:title", content: "Historial de reportes | Guardia Ops" },
      { property: "og:description", content: "Busque y descargue cualquier reporte de guardia registrado." },
    ],
  }),
  component: Historial,
});

function Historial() {
  const data = useOpsData();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [guardia, setGuardia] = useState("todas");
  const [supervisor, setSupervisor] = useState("todos");

  const filtrados = data.reportes.filter((r) => {
    if (desde && r.fecha < desde) return false;
    if (hasta && r.fecha > hasta) return false;
    if (guardia !== "todas" && r.tipoGuardia !== guardia) return false;
    if (supervisor !== "todos" && r.supervisorId !== supervisor) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Historial de reportes</h1>
        <p className="text-sm text-muted-foreground">{filtrados.length} reporte(s) encontrados</p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Guardia</Label>
          <select
            value={guardia}
            onChange={(e) => setGuardia(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="todas">Todas</option>
            <option value="dia">Día</option>
            <option value="noche">Noche</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Supervisor</Label>
          <select
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="todos">Todos</option>
            {data.usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
        </div>
      </div>

      <ul className="space-y-3">
        {filtrados.length === 0 && (
          <li className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No hay reportes con esos filtros.
          </li>
        )}
        {filtrados.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <FileText className="size-4 text-primary" /> {r.correlativo}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.fecha} · Guardia {r.tipoGuardia === "dia" ? "Día" : "Noche"} ·{" "}
                  {nombreSupervisor(data, r.supervisorId)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={`rounded px-2 py-0.5 font-semibold ${
                      r.estado === "finalizado"
                        ? "bg-status-operativo/15 text-status-operativo"
                        : "bg-status-mantenimiento/15 text-status-mantenimiento"
                    }`}
                  >
                    {r.estado === "finalizado" ? "Finalizado" : "Borrador"}
                  </span>
                  <span className="text-muted-foreground">
                    {r.lanzamientos.length} lanzamientos · {r.carguios.length} carguíos · {r.fallas.length} fallas
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {r.estado === "finalizado" && (
                  <Button variant="outline" size="sm" onClick={() => descargarPdf(r, getData())}>
                    <Download className="mr-1 size-4" /> PDF
                  </Button>
                )}
                <Button asChild size="sm">
                  <Link to="/app/reporte/$id" params={{ id: r.id }}>
                    Ver
                  </Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
