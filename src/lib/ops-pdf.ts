import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
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
  // Encabezado del reporte
  doc.setFillColor(28, 33, 43);
  doc.rect(0, 0, ancho, 90, "F");
  doc.setTextColor(245, 180, 60);
  doc.setFontSize(18);
  doc.text("REPORTE DE OPERACIONES POR GUARDIA", 40, 40);
  doc.setTextColor(235, 235, 235);
  doc.setFontSize(10);
  doc.text(`Correlativo: ${rep.correlativo}`, 40, 60);
  doc.text(
    `Fecha: ${rep.fecha}   |   Guardia: ${
      rep.tipoGuardia === "dia" ? "Día" : "Noche"
    }   |   Supervisor: ${nombreSupervisor(data, rep.supervisorId)}`,
    40,
    76,
  );
  let y = 115;
  // Generador de secciones y tablas
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
  // Estado de robots
  seccion(
    "ESTADO DE ROBOTS LANZADORES",
    ["Equipo", "Estado", "Combustible", "Aditivo"],
    Object.entries(rep.robots).map(([id, det]) => [
      nombreEquipoSnapshot(id),
      ESTADO_LABEL[det.estado],
      [
        det.combustible.inicio && "Inicio",
        det.combustible.media && "Media",
        det.combustible.final && "Final",
      ]
        .filter(Boolean)
        .join(", ") || "No registrado",
      det.aditivo === null
        ? "No registrado"
        : det.aditivo
          ? "Sí"
          : "No",
    ]),
  );
  // Estado de mixers
  seccion(
    "ESTADO DE MIXERS",
    ["Equipo", "Estado"],
    Object.entries(rep.mixers).map(([id, det]) => [
      nombreEquipoSnapshot(id),
      ESTADO_LABEL[det.estado],
    ]),
  );
  // Lanzamientos
  seccion(
    "LANZAMIENTOS DE ROBOTS",
    ["Hora", "Robot", "Nivel", "Labor", "Cantidad", "Unidad", "Notas"],
    rep.lanzamientos.map((l) => [
      l.hora,
      nombreEquipoSnapshot(l.robotId),
      l.nivel,
      l.labor,
      l.cantidad,
      "m³",
      l.notas || "-",
    ]),
  );
  // Carguíos
  seccion(
    "CARGUÍO DE MIXERS",
    ["Hora", "Mixer", "Nivel", "Labor", "Cantidad", "Unidad", "Notas"],
    rep.carguios.map((c) => [
      c.hora,
      nombreEquipoSnapshot(c.mixerId),
      c.nivel,
      c.labor,
      c.cantidad,
      "m³",
      c.notas || "-",
    ]),
  );
  // Fallas
  seccion(
    "FALLAS REPORTADAS",
    [
      "Hora",
      "Equipo",
      "Tipo",
      "Descripción",
      "Acción tomada",
      "Estado final",
    ],
    rep.fallas.map((f) => [
      f.hora,
      nombreEquipoSnapshot(f.equipoId),
      f.tipo,
      f.descripcion,
      f.accion,
      ESTADO_LABEL[f.estadoFinal],
    ]),
  );
  // Desechos y morteros
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
  // Observaciones generales
  const altoPagina = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  const texto = doc.splitTextToSize(
    rep.observaciones || "Sin observaciones registradas.",
    ancho - 80,
  );
  const altoLinea = 12;
  const altoNecesario = texto.length * altoLinea;
  if (y + 30 + altoNecesario > altoPagina - 40) {
    doc.addPage();
    y = 60;
  }
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("OBSERVACIONES GENERALES", 40, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(texto, 40, y + 6);
  // Una fotografía por página
  const fotos = Array.isArray(rep.fotos) ? rep.fotos : [];
  fotos.forEach((foto, indice) => {
    doc.addPage();
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPaginaFoto = doc.internal.pageSize.getHeight();
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `FOTOGRAFÍA DE GUARDIA ${indice + 1} DE ${fotos.length}`,
      40,
      40,
    );
    try {
      const propiedades = doc.getImageProperties(foto);
      const margen = 40;
      const espacioSuperior = 65;
      const espacioInferior = 40;
      const anchoDisponible = anchoPagina - margen * 2;
      const altoDisponible =
        altoPaginaFoto - espacioSuperior - espacioInferior;
      const escala = Math.min(
        anchoDisponible / propiedades.width,
        altoDisponible / propiedades.height,
      );
      const anchoImagen = propiedades.width * escala;
      const altoImagen = propiedades.height * escala;
      const x = (anchoPagina - anchoImagen) / 2;
      const yImagen =
        espacioSuperior + (altoDisponible - altoImagen) / 2;
      doc.addImage(
        foto,
        "JPEG",
        x,
        yImagen,
        anchoImagen,
        altoImagen,
      );
    } catch (error) {
      console.error(
        `No se pudo incorporar la fotografía ${indice + 1} al PDF.`,
        error,
      );
      doc.setFontSize(10);
      doc.text(
        "No se pudo incorporar esta fotografía.",
        40,
        80,
      );
    }
  });
  return doc;
}
// Descarga del PDF en navegador o dispositivo nativo
export async function descargarPdf(rep: Reporte, data: OpsData) {
  const doc = construirPdf(rep, data);
  const fileName = `Reporte_${nombreSupervisor(data, rep.supervisorId)
    .replace(/\s+/g, "-")}_${rep.fecha.replace(/\//g, "-")}_${
    rep.tipoGuardia === "dia" ? "Dia" : "Noche"
  }.pdf`;
  // Navegador / Vercel / PWA
  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName);
    return;
  }
  // Android / Capacitor
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];
  if (!base64) {
    throw new Error("No se pudo generar el contenido del PDF.");
  }
  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
  });
}