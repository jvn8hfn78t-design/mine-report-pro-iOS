export type EstadoEquipo = "operativo" | "inoperativo" | "mantenimiento" | "standby";

export const ESTADOS: { value: EstadoEquipo; label: string }[] = [
  { value: "operativo", label: "Operativo" },
  { value: "inoperativo", label: "Inoperativo" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "standby", label: "Stand By" },
];

export const ESTADO_CLASSES: Record<EstadoEquipo, string> = {
  operativo: "bg-status-operativo text-status-operativo-foreground",
  inoperativo: "bg-status-inoperativo text-status-inoperativo-foreground",
  mantenimiento: "bg-status-mantenimiento text-status-mantenimiento-foreground",
  standby: "bg-status-standby text-status-standby-foreground",
};

export const ESTADO_LABEL: Record<EstadoEquipo, string> = {
  operativo: "Operativo",
  inoperativo: "Inoperativo",
  mantenimiento: "Mantenimiento",
  standby: "Stand By",
};

export interface Equipo {
  id: string;
  codigo: string;
  modelo: string;
  ubicacion: string;
  activo: boolean;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  turnoPreferido: "dia" | "noche" | "rotativo";
  activo: boolean;
}

export interface RobotDetalle {
  estado: EstadoEquipo;
  combustible: { inicio: boolean; media: boolean; final: boolean };
  aditivo: boolean | null;
}

export interface MixerDetalle {
  estado: EstadoEquipo;
}

export interface Lanzamiento {
  id: string;
  robotId: string;
  hora: string;
  labor: string;
  cantidad: number;
  notas: string;
}

export interface Carguio {
  id: string;
  mixerId: string;
  hora: string;
  labor: string;
  cantidad: number;
  notas: string;
}

export interface Falla {
  id: string;
  equipoId: string;
  hora: string;
  tipo: string;
  descripcion: string;
  accion: string;
  estadoFinal: EstadoEquipo;
}

export interface Desecho {
  id: string;
  tipo: string;
  hora: string;
  equipoId: string;
  cantidad: number;
  unidad: "m3";
  descripcion: string;
}

export type EstadoReporte = "borrador" | "finalizado";

export interface Reporte {
  id: string;
  correlativo: string;
  fecha: string;
  tipoGuardia: "dia" | "noche";
  supervisorId: string;
  robotsRevisados: boolean;
  mixersRevisados: boolean;
  robotsSnapshot: Record<string, Equipo>;
  mixersSnapshot: Record<string, Equipo>;
  robots: Record<string, RobotDetalle>;
  mixers: Record<string, MixerDetalle>;
  lanzamientos: Lanzamiento[];
  carguios: Carguio[];
  fallas: Falla[];
  desechos: Desecho[];
  observaciones: string;
  estado: EstadoReporte;
  creadoEn: string;
  finalizadoEn: string | null;
}

export const TIPOS_FALLA = [
  "Mecánica",
  "Hidráulica",
  "Eléctrica",
  "Electrónica / control",
  "Neumática",
  "Operativa",
  "Otra",
];

export const TIPOS_DESECHO = [
  "Mortero",
  "Desecho",
  "Otro",
];
