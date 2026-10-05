import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Lock, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { construirPdf, descargarPdf } from "@/lib/ops-pdf";
import { getData, nombreEquipo, nombreSupervisor, useOpsData } from "@/lib/ops-store";
import { ESTADO_CLASSES, ESTADO_LABEL } from "@/lib/ops-types";

export const Route = createFileRoute("/app/reporte/$id")({
  head: () => ({
    meta: [
      { title: "Reporte de guardia | MINE REPORT BATCH" },
      { name: "description", content: "Reporte de guardia finalizado con PDF descargable y opciones de compartir." },
      { property: "og:title", content: "Reporte de guardia | MINE REPORT BATCH" },
      { property: "og:description", content: "Consulte el detalle de la guardia y comparta el PDF del reporte." },
    ],
  }),
  component: DetalleReporte,
});

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary">{titulo}</h2>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </section>
  );
}

function DetalleReporte() {
  const { id } = Route.useParams();
  const data = useOpsData();
  const rep = data.reportes.find((r) => r.id === id);

  if (!rep) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No se encontró el reporte solicitado.</p>
        <Button asChild className="mt-4">
          <Link to="/app/historial">Ir al historial</Link>
        </Button>
      </div>
    );
  }

  const nombreEquipoSnapshot = (id: string) => {
  const equipo =
    rep.robotsSnapshot[id] ??
    rep.mixersSnapshot[id];

  if (equipo) {
    return `${equipo.codigo} · ${equipo.modelo}`;
  }

  return nombreEquipo(data, id);
};

const resumenTexto = `Reporte de guardia ${rep.correlativo}
Fecha: ${rep.fecha} (${rep.tipoGuardia === "dia" ? "Día" : "Noche"})
Supervisor: ${nombreSupervisor(data, rep.supervisorId)}`;

const compartirPdf = async () => {
  try {
    const doc = construirPdf(rep, getData());

    const pdfBlob = doc.output("blob");

    const pdfFile = new File(
      [pdfBlob],
      `${rep.correlativo}.pdf`,
      { type: "application/pdf" },
    );

    const shareData = {
      title: rep.correlativo,
      text: resumenTexto,
      files: [pdfFile],
    };

    if (!navigator.share || !navigator.canShare) {
      toast.error("Este dispositivo no permite compartir archivos PDF.");
      return;
    }

    if (!navigator.canShare({ files: [pdfFile] })) {
      toast.error("No se puede adjuntar el PDF desde este dispositivo.");
      return;
    }

    await navigator.share(shareData);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    console.error(error);
    toast.error("No se pudo compartir el reporte.");
  }
};

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">{rep.correlativo}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rep.fecha} · Guardia {rep.tipoGuardia === "dia" ? "Día" : "Noche"} ·{" "}
              {nombreSupervisor(data, rep.supervisorId)}
            </p>
          </div>
          <span
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
              rep.estado === "finalizado"
                ? "bg-status-operativo/15 text-status-operativo"
                : "bg-status-mantenimiento/15 text-status-mantenimiento"
            }`}
          >
            {rep.estado === "finalizado" && <Lock className="size-3" />}
            {rep.estado === "finalizado" ? "Finalizado · edición bloqueada" : "Borrador"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
  <Button onClick={() => descargarPdf(rep, getData())}>
    <Download className="mr-1 size-4" /> Descargar PDF
  </Button>

  <Button variant="outline" onClick={compartirPdf}>
    <Upload className="mr-1 size-4" /> Compartir PDF
  </Button>
</div>
      </div>

      <Seccion titulo="Estado de robots">
        {Object.entries(rep.robots).map(([rid, det]) => (
          <div key={rid} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
            <span>{nombreEquipo(data, rid)}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Comb.{" "}
                {[det.combustible.inicio && "Inicio", det.combustible.media && "Media", det.combustible.final && "Final"]
                  .filter(Boolean)
                  .join("/") || "—"}{" "}
                · Aditivo {det.aditivo === null ? "—" : det.aditivo ? "Sí" : "No"}
              </span>
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_CLASSES[det.estado]}`}>
                {ESTADO_LABEL[det.estado]}
              </span>
            </span>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Estado de mixers">
        {Object.entries(rep.mixers).map(([mid, det]) => (
          <div key={mid} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <span>{nombreEquipo(data, mid)}</span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_CLASSES[det.estado]}`}>
              {ESTADO_LABEL[det.estado]}
            </span>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Lanzamientos de robots">
        {rep.lanzamientos.length === 0 && <p className="text-muted-foreground">Sin registros.</p>}
        {rep.lanzamientos.map((l) => (
          <p key={l.id} className="border-b border-border/60 pb-2">
            <span className="font-mono text-xs text-primary">{l.hora}</span> · {nombreEquipo(data, l.robotId)} ·{" "}
            {l.labor} · {l.cantidad} m³{" "}
{l.notas && <span className="text-muted-foreground">({l.notas})</span>}
          </p>
        ))}
      </Seccion>

      <Seccion titulo="Carguío de mixers">
        {rep.carguios.length === 0 && <p className="text-muted-foreground">Sin registros.</p>}
        {rep.carguios.map((c) => (
          <p key={c.id} className="border-b border-border/60 pb-2">
            <span className="font-mono text-xs text-primary">{c.hora}</span> · {nombreEquipo(data, c.mixerId)} ·{" "}
            {c.labor} · {c.cantidad} m³{" "}
{c.notas && <span className="text-muted-foreground">({c.notas})</span>}
          </p>
        ))}
      </Seccion>

      <Seccion titulo="Fallas">
        {rep.fallas.length === 0 && <p className="text-muted-foreground">Sin registros.</p>}
        {rep.fallas.map((f) => (
          <div key={f.id} className="border-b border-border/60 pb-2">
            <p>
              <span className="font-mono text-xs text-primary">{f.hora}</span> · {nombreEquipo(data, f.equipoId)} ·{" "}
              {f.tipo} → {ESTADO_LABEL[f.estadoFinal]}
            </p>
            <p className="text-xs text-muted-foreground">
              {f.descripcion} — Acción: {f.accion}
            </p>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Desechos / morteros">
        {rep.desechos.length === 0 && <p className="text-muted-foreground">Sin registros.</p>}
        {rep.desechos.map((d) => (
          <p key={d.id} className="border-b border-border/60 pb-2">
            <span className="font-mono text-xs text-primary">{d.hora}</span> · {d.tipo} · {nombreEquipo(data, d.equipoId)}{" "}
            · {d.cantidad} {d.unidad === "m3" ? "m³" : "kg"}{" "}
            {d.descripcion && <span className="text-muted-foreground">({d.descripcion})</span>}
          </p>
        ))}
      </Seccion>

      <Seccion titulo="Observaciones generales">
        <p className="whitespace-pre-line text-muted-foreground">{rep.observaciones || "Sin observaciones."}</p>
      </Seccion>
    </div>
  );
}
