import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OpsData } from "./ops-store";
import { nombreEquipo, nombreSupervisor } from "./ops-store";
import { ESTADO_LABEL, type Reporte } from "./ops-types";

export function construirPdf(rep: Reporte, data: OpsData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();

  const nombreEquipoSnapshot = (id: string) => {
    const equipo =
      rep.robotsSnapshot[id] ??
      rep.mixersSnapshot[id];

    if (equipo) {
      return `${equipo.codigo} · ${equipo.modelo}`;
    }

    return nombreEquipo(data, id);
  };

  doc.setFillColor(28, 33, 43);
  doc.rect(0, 0, ancho, 90, "F");
  doc.setTextColor(245, 180, 60);
  doc.setFontSize(18);
  doc.text("REPORTE DE OPERACIONES POR GUARDIA", 40, 40);
  doc.setTextColor(235, 235, 235);
  doc.setFontSize(10);
  doc.text(`Correlativo: ${rep.correlativo}`, 40, 60);
  doc.text(
    `Fecha: ${rep.fecha}   |   Guardia: ${rep.tipoGuardia === "dia" ? "Día" : "Noche"}   |   Supervisor: ${nombreSupervisor(data, rep.supervisorId)}`,
    40,
    76,
  );

  let y = 115;
    const seccion = (
  tituloSeccion: string,
  head: string[],
  body: (string | number)[][],
) => {
  if (body.length === 0) {
    body = [["Sin registros", ...head.slice(1).map(() => "-")]];
  }

  const altoPagina = doc.internal.pageSize.getHeight();

  if (y > altoPagina - 120) {
    doc.addPage();
    y = 60;
  }

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(tituloSeccion, 40, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: 40, right: 40 },
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [45, 52, 66],
      textColor: [245, 180, 60],
    },
    theme: "grid",
    tableLineColor: [220, 220, 220],
    pageBreak: "auto",
    showHead: "everyPage",
  });

  // @ts-expect-error lastAutoTable es añadido por el plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 26;

};

  seccion(
    "ESTADO DE ROBOTS LANZADORES",
    ["Equipo", "Estado", "Combustible", "Aditivo"],
    Object.entries(rep.robots).map(([id, det]) => [
  nombreEquipoSnapshot(id),
  ESTADO_LABEL[det.estado],
      [det.combustible.inicio && "Inicio", det.combustible.media && "Media", det.combustible.final && "Final"]
        .filter(Boolean)
        .join(", ") || "No registrado",
      det.aditivo === null ? "No registrado" : det.aditivo ? "Sí" : "No",
    ]),
  );

  seccion(
    "ESTADO DE MIXERS",
    ["Equipo", "Estado"],
    Object.entries(rep.mixers).map(([id, det]) => [
  nombreEquipoSnapshot(id),
  ESTADO_LABEL[det.estado],
]),
);

  seccion(
    "LANZAMIENTOS DE ROBOTS",
    [
  "Hora",
  "Robot",
  "Labor",
  "Cantidad",
  "Unidad",
  "Notas"
],
rep.lanzamientos.map((l) => [
  l.hora,
  nombreEquipoSnapshot(l.robotId),
  l.labor,
  l.cantidad,
  "m³",
  l.notas || "-",
]),
  );

  seccion(
    "CARGUÍO DE MIXERS",
    [
  "Hora",
  "Mixer",
  "Labor",
  "Cantidad",
  "Unidad",
  "Notas"
],
rep.carguios.map((c) => [
  c.hora,
  nombreEquipoSnapshot(c.mixerId),
  c.labor,
  c.cantidad,
  "m³",
  c.notas || "-",
]),
  );

  seccion(
    "FALLAS REPORTADAS",
    ["Hora", "Equipo", "Tipo", "Descripción", "Acción tomada", "Estado final"],
    rep.fallas.map((f) => [
  f.hora,
  nombreEquipoSnapshot(f.equipoId),
  f.tipo,
  f.descripcion,
  f.accion,
  ESTADO_LABEL[f.estadoFinal],
]),
  );

  seccion(
    "DESECHOS / MORTEROS",
    ["Hora", "Tipo", "Equipo", "Cantidad", "Descripción"],
    rep.desechos.map((d) => [
  d.hora,
  d.tipo,
  nombreEquipoSnapshot(d.equipoId),
  `${d.cantidad} m³`,
  d.descripcion,
]),
  );

    doc.setFontSize(11);
doc.setTextColor(30, 30, 30);
doc.text("OBSERVACIONES GENERALES", 40, y);
y += 10;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const texto = doc.splitTextToSize(
    rep.observaciones || "Sin observaciones registradas.",
    ancho - 80,
  );

  const altoLinea = 12;
  const altoNecesario = texto.length * altoLinea;

  const altoPagina = doc.internal.pageSize.getHeight();

  if (y + 6 + altoNecesario > altoPagina - 40) {
    doc.addPage();
    y = 60;

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("OBSERVACIONES GENERALES", 40, y);
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
  }

  doc.text(texto, 40, y + 6);

  return doc;
}

export async function descargarPdf(rep: Reporte, data: OpsData) {
  const doc = construirPdf(rep, data);

  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];

  if (!base64) {
    throw new Error("No se pudo generar el contenido del PDF.");
  }

  const fileName = `${rep.correlativo}.pdf`;

  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
  });
}
