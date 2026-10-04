import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, FilePlus2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nombreSupervisor, useOpsData } from "@/lib/ops-store";
import { ESTADO_CLASSES, ESTADO_LABEL, type EstadoEquipo } from "@/lib/ops-types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Panel de guardia | Guardia Ops" },
      { name: "description", content: "Resumen de la guardia: equipos, borradores en curso y reportes recientes." },
      { property: "og:title", content: "Panel de guardia | Guardia Ops" },
      { property: "og:description", content: "Resumen de equipos y reportes de guardia en un solo lugar." },
    ],
  }),
  component: Panel,
});

function Panel() {
  const data = useOpsData();
  const borrador = data.reportes.find((r) => r.estado === "borrador");
  const ultimos = data.reportes.slice(0, 5);


const conteoRobots = (estado: EstadoEquipo) =>
  borrador
    ? Object.values(borrador.robots).filter((r) => r.estado === estado).length
    : 0;

const conteoMixers = (estado: EstadoEquipo) =>
  borrador
    ? Object.values(borrador.mixers).filter((m) => m.estado === estado).length
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Panel de guardia</h1>
        <p className="text-sm text-muted-foreground">
          {data.robots.length} robots · {data.mixers.length} mixers · Datos guardados en el dispositivo
        </p>
      </div>

      {borrador ? (
  <div className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm">
    <div className="flex items-center gap-2">
      <span className="text-lg">📝</span>
      <p className="text-sm font-bold uppercase tracking-wide">
        Reporte en curso
      </p>
    </div>

    <div className="mt-3 space-y-1">
      <p className="text-base font-semibold">
        {borrador.correlativo} · Guardia{" "}
        {borrador.tipoGuardia === "dia" ? "Día" : "Noche"}
      </p>

      <p className="text-sm text-muted-foreground">
        Supervisor: {nombreSupervisor(data, borrador.supervisorId)}
      </p>
    </div>

    <Button asChild size="lg" className="mt-4 w-full">
      <Link to="/app/reporte/nuevo" search={{ continuar: "1" }}>
        Continuar reporte
        <ArrowRight className="ml-1 size-4" />
      </Link>
    </Button>
  </div>
) : null}

<Button asChild variant="outline" size="lg" className="w-full">
  <Link to="/app/reporte/nuevo">
    <FilePlus2 className="mr-1 size-4" />
    Iniciar nuevo reporte
  </Link>
</Button>


      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Reportes recientes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/historial">
              <History className="mr-1 size-4" /> Ver historial
            </Link>
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {ultimos.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">Aún no hay reportes.</li>}
          {ultimos.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.correlativo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.fecha} · {r.tipoGuardia === "dia" ? "Día" : "Noche"} · {nombreSupervisor(data, r.supervisorId)}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/reporte/$id" params={{ id: r.id }}>
                  Abrir
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <Button asChild variant="outline">
        <Link to="/app/catalogos">
          <Boxes className="mr-1 size-4" /> Administrar catálogos
        </Link>
      </Button>
    </div>
  );
}
