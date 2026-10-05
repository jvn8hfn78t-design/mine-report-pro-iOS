import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nombreSupervisor, useOpsData } from "@/lib/ops-store";
import { type EstadoEquipo } from "@/lib/ops-types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Panel de guardia | REPORT BATCH" },
      {
        name: "description",
        content: "Panel de guardia y estado de equipos.",
      },
      {
        property: "og:title",
        content: "Panel de guardia | REPORT BATCH",
      },
      {
        property: "og:description",
        content: "Panel de guardia y estado de equipos.",
      },
    ],
  }),
  component: Panel,
});

function Panel() {
  const data = useOpsData();
  const borrador = data.reportes.find((r) => r.estado === "borrador");

  const [detalle, setDetalle] = useState<
    "robots" | "mixers" | null
  >(null);

  const conteo = (
    tipo: "robots" | "mixers",
    estado: EstadoEquipo,
  ) => {
    if (!borrador) return 0;

    return Object.values(borrador[tipo]).filter(
      (equipo) => equipo.estado === estado,
    ).length;
  };

  const equiposDetalle =
  detalle && borrador
    ? Object.entries(borrador[detalle])
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          REPORT BATCH
        </h1>

        <p className="text-sm text-muted-foreground">
          Panel de guardia
        </p>
      </div>

      {/* GUARDIA ACTUAL */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Guardia actual
        </h2>

        {borrador ? (
          <div className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide">
              Reporte en curso
            </p>

            <div className="mt-3 space-y-1">
              <p className="text-base font-semibold">
                Guardia{" "}
                {borrador.tipoGuardia === "dia"
                  ? "Día"
                  : "Noche"}
              </p>

              <p className="text-sm text-muted-foreground">
                Supervisor:{" "}
                {nombreSupervisor(
                  data,
                  borrador.supervisorId,
                )}
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="mt-4 w-full"
            >
              <Link
                to="/app/reporte/nuevo"
                search={{ continuar: "1" }}
              >
                Continuar reporte
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
                ) : (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              No hay un reporte activo en esta guardia.
            </p>
          </div>
        )}

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Link
            to="/app/reporte/nuevo"
            search={{ continuar: "0" }}
          >
            <FilePlus2 className="mr-1 size-4" />
            Iniciar reporte
          </Link>
        </Button>
      </section>

      {/* EQUIPOS DE LA GUARDIA */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide">
            Equipos de la guardia
          </h2>

          <p className="text-xs text-muted-foreground">
            Estado actual
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* ROBOTS */}
          <div className="flex min-h-[220px] flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-bold">
              ROBOTS
            </p>

            <div className="mt-3 space-y-2 text-xs font-semibold sm:text-sm">
              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-green-500" />
                {conteo("robots", "operativo")} Operativos
              </p>

              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-blue-500" />
                {conteo("robots", "standby")} Standby
              </p>

              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-yellow-500" />
                {conteo("robots", "mantenimiento")} Mant.
              </p>

              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-red-500" />
                {conteo("robots", "inoperativo")} Inoperat.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setDetalle(
                  detalle === "robots"
                    ? null
                    : "robots",
                )
              }
              className="mt-auto pt-4 text-left text-xs font-semibold text-primary"
            >
              {detalle === "robots"
                ? "Ocultar detalle"
                : "Ver detalle"}
            </button>
          </div>

          {/* MIXERS */}
          <div className="flex min-h-[220px] flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-bold">
              MIXERS
            </p>

            <div className="mt-3 space-y-2 text-xs font-semibold sm:text-sm">
              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-green-500" />
                {conteo("mixers", "operativo")} Operativos
              </p>

              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-blue-500" />
                {conteo("mixers", "standby")} Standby
              </p>

              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-yellow-500" />
                {conteo("mixers", "mantenimiento")} Mant.
              </p>

              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-red-500" />
                {conteo("mixers", "inoperativo")} Inoperat.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setDetalle(
                  detalle === "mixers"
                    ? null
                    : "mixers",
                )
              }
              className="mt-auto pt-4 text-left text-xs font-semibold text-primary"
            >
              {detalle === "mixers"
                ? "Ocultar detalle"
                : "Ver detalle"}
            </button>
          </div>
        </div>

        {/* DETALLE DE EQUIPOS */}
        {detalle && borrador && (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-bold uppercase">
                {detalle === "robots"
                  ? "Robots"
                  : "Mixers"}{" "}
                de la guardia
              </p>
            </div>

            <div className="divide-y divide-border">
              {equiposDetalle.map(([equipoId, equipo]) => (
  <div
    key={equipoId}
    className="flex items-center justify-between gap-3 px-4 py-3"
  >
    <span className="text-sm font-medium">
      {equipoId.toUpperCase()}
    </span>

    <span className="text-xs font-semibold text-muted-foreground">
      {equipo.estado === "operativo"
        ? "Operativo"
        : equipo.estado === "standby"
          ? "Standby"
          : equipo.estado === "mantenimiento"
            ? "Mantenimiento"
            : "Inoperativo"}
    </span>
  </div>
))}
            </div>
          </div>
        )}

        {!borrador && (
          <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
            Inicia un reporte para cargar los equipos de
            la guardia y consultar sus estados.
          </div>
        )}
      </section>
    </div>
  );
}