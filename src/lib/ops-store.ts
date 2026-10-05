import { useEffect, useState } from "react";
import type { Equipo, Reporte, Usuario, RobotDetalle, MixerDetalle } from "./ops-types";

const KEY = "rog:data:v1";

export interface OpsData {
  robots: Equipo[];
  mixers: Equipo[];
  usuarios: Usuario[];
  reportes: Reporte[];
}

const seedRobots: Equipo[] = [
  { id: "rb-074", codigo: "RB-074", modelo: "", ubicacion: "", activo: true },
  { id: "rb-076", codigo: "RB-076", modelo: "", ubicacion: "", activo: true },
  { id: "rb-077", codigo: "RB-077", modelo: "", ubicacion: "", activo: true },
  { id: "rb-085", codigo: "RB-085", modelo: "", ubicacion: "", activo: true },
  { id: "rb-086", codigo: "RB-086", modelo: "", ubicacion: "", activo: true },
  { id: "rb-105", codigo: "RB-105", modelo: "", ubicacion: "", activo: true },
  { id: "rb-106", codigo: "RB-106", modelo: "", ubicacion: "", activo: true },
  { id: "rb-109", codigo: "RB-109", modelo: "", ubicacion: "", activo: true },
  { id: "rb-113", codigo: "RB-113", modelo: "", ubicacion: "", activo: true },
];

const seedMixers: Equipo[] = [
  { id: "mx-298", codigo: "MX-298", modelo: "", ubicacion: "", activo: true },
  { id: "mx-303", codigo: "MX-303", modelo: "", ubicacion: "", activo: true },
  { id: "mx-307", codigo: "MX-307", modelo: "", ubicacion: "", activo: true },
  { id: "mx-311", codigo: "MX-311", modelo: "", ubicacion: "", activo: true },
  { id: "mx-316", codigo: "MX-316", modelo: "", ubicacion: "", activo: true },
  { id: "mx-318", codigo: "MX-318", modelo: "", ubicacion: "", activo: true },
  { id: "mx-327", codigo: "MX-327", modelo: "", ubicacion: "", activo: true },
  { id: "mx-328", codigo: "MX-328", modelo: "", ubicacion: "", activo: true },
  { id: "mx-329", codigo: "MX-329", modelo: "", ubicacion: "", activo: true },
  { id: "mx-332", codigo: "MX-332", modelo: "", ubicacion: "", activo: true },
  { id: "mx-342", codigo: "MX-342", modelo: "", ubicacion: "", activo: true },
  { id: "mx-343", codigo: "MX-343", modelo: "", ubicacion: "", activo: true },
  { id: "mx-344", codigo: "MX-344", modelo: "", ubicacion: "", activo: true },
  { id: "mx-345", codigo: "MX-345", modelo: "", ubicacion: "", activo: true },
  { id: "mx-346", codigo: "MX-346", modelo: "", ubicacion: "", activo: true },
];

const seedUsuarios: Usuario[] = [
  {
    id: "us-01",
    nombre: "David Palpan",
    rol: "Jefe de Guardia",
    turnoPreferido: "dia",
    activo: true,
  },
  {
    id: "us-02",
    nombre: "Yuler Otarola",
    rol: "Jefe de Guardia",
    turnoPreferido: "noche",
    activo: true,
  },
  {
    id: "us-03",
    nombre: "Eder Velásquez",
    rol: "Jefe de Guardia",
    turnoPreferido: "rotativo",
    activo: true,
  },
  {
    id: "us-04",
    nombre: "Wilfredo Janampa",
    rol: "Supervisor de Operaciones",
    turnoPreferido: "dia",
    activo: true,
  },
  {
    id: "us-05",
    nombre: "José Ospina",
    rol: "Supervisor de Operaciones",
    turnoPreferido: "noche",
    activo: true,
  },
  {
    id: "us-06",
    nombre: "Sider Ricaldi",
    rol: "Supervisor de Operaciones",
    turnoPreferido: "rotativo",
    activo: true,
  },
];


function defaults(): OpsData {
  return {
    robots: seedRobots,
    mixers: seedMixers,
    usuarios: seedUsuarios,
    reportes: [],
  };
}

let cache: OpsData | null = null;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

export function getData(): OpsData {
  if (cache) return cache;
  if (!isBrowser()) return defaults();

  try {
    const raw = window.localStorage.getItem(KEY);

    if (!raw) {
      cache = defaults();
      return cache;
    }

    const guardado = JSON.parse(raw) as Partial<OpsData>;
    const base = defaults();

        const reportesGuardados = Array.isArray(guardado.reportes)
      ? guardado.reportes
      : [];

        const robotsActuales = Array.isArray(guardado.robots)
      ? guardado.robots
      : base.robots;

    const mixersActuales = Array.isArray(guardado.mixers)
      ? guardado.mixers
      : base.mixers;

    const reportesCompatibles = reportesGuardados.map((reporte) => ({
      ...reporte,
      robotsSnapshot:
        reporte.robotsSnapshot ??
        Object.fromEntries(
          robotsActuales
            .filter((r) => r.activo)
            .map((r) => [r.id, { ...r }]),
        ),
      mixersSnapshot:
        reporte.mixersSnapshot ??
        Object.fromEntries(
          mixersActuales
            .filter((m) => m.activo)
            .map((m) => [m.id, { ...m }]),
        ),
    }));

    cache = {
      ...base,
      ...guardado,
      reportes: reportesCompatibles,
    };

    return cache;
  } catch {
    cache = defaults();
    return cache;
  }
}

export function setData(updater: (d: OpsData) => OpsData): boolean {
  const next = updater(getData());
  cache = next;

  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch (error) {
      console.error("No se pudo guardar la información localmente.", error);
      return false;
    }
  }

  listeners.forEach((l) => l());
  return true;
}

export function useOpsData(): OpsData {
  const [data, setLocal] = useState<OpsData>(() => defaults());

  useEffect(() => {
    const sync = () => setLocal({ ...getData() });
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return data;
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function nuevoReporte(data: OpsData): Reporte {
  const ahora = new Date();
  const fecha =
    `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  return {
    id: uid("rep"),
    correlativo: `RG-${fecha.replaceAll("-", "")}-D`,
    fecha,
    tipoGuardia: "dia",
    supervisorId: "",
robotsRevisados: false,
mixersRevisados: false,
robotsSnapshot: Object.fromEntries(
  data.robots
    .filter((r) => r.activo)
    .map((r) => [r.id, { ...r }]),
),
mixersSnapshot: Object.fromEntries(
  data.mixers
    .filter((m) => m.activo)
    .map((m) => [m.id, { ...m }]),
),
robots: Object.fromEntries(
  data.robots.filter((r) => r.activo).map((r) => [
    r.id,
    {
      estado: "operativo",
      combustible: { inicio: false, media: false, final: false },
      aditivo: null,
    } as RobotDetalle,
  ]),
),
mixers: Object.fromEntries(
  data.mixers
    .filter((m) => m.activo)
    .map((m) => [m.id, { estado: "operativo" } as MixerDetalle]),
),
    lanzamientos: [],
    carguios: [],
    fallas: [],
    desechos: [],
    observaciones: "",
    estado: "borrador",
    creadoEn: new Date().toISOString(),
    finalizadoEn: null,
  };
}

export function guardarReporte(rep: Reporte): boolean {
  return setData((d) => {
    const existe = d.reportes.some((r) => r.id === rep.id);

    return {
      ...d,
      reportes: existe
        ? d.reportes.map((r) => (r.id === rep.id ? rep : r))
        : [rep, ...d.reportes],
    };
  });
}

export function eliminarReporte(id: string) {
  setData((d) => ({
    ...d,
    reportes: d.reportes.filter((r) => r.id !== id),
  }));
}

export function iniciarNuevaGuardia(): Reporte {
  const dataActual = getData();

  const dataLimpia: OpsData = {
    ...dataActual,
    reportes: [],
  };

  const nuevo = nuevoReporte(dataLimpia);

  setData((d) => ({
    ...d,
    reportes: [nuevo],
  }));

  return nuevo;
}

export function nombreEquipo(data: OpsData, id: string) {
  const eq = [...data.robots, ...data.mixers].find((e) => e.id === id);
  return eq ? `${eq.codigo} · ${eq.modelo}` : id;
}

export function nombreSupervisor(data: OpsData, id: string) {
  return data.usuarios.find((u) => u.id === id)?.nombre ?? "Sin asignar";
}
