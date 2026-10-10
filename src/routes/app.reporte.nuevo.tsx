import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Pencil, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  getData,
  guardarReporte,
  iniciarNuevaGuardia,
  nombreEquipo,
  nombreSupervisor,
  sincronizarEquiposReporte,
  nuevoReporte,
  uid,
  useOpsData,
} from "@/lib/ops-store";
import {
  ESTADOS,
  ESTADO_CLASSES,
  ESTADO_LABEL,
  TIPOS_DESECHO,
  TIPOS_FALLA,
  type EstadoEquipo,
  type MixerDetalle,
  type Reporte,
  type RobotDetalle,
} from "@/lib/ops-types";

export const Route = createFileRoute("/app/reporte/nuevo")({
  validateSearch: (search) => ({
    continuar: search.continuar,
  }),
  head: () => ({
    meta: [
      { title: "Nuevo reporte de guardia | MINE REPORT BATCH" },
      {
        name: "description",
        content: "Flujo guiado paso a paso para registrar la guardia: equipos, combustible, lanzamientos y fallas.",
      },
      { property: "og:title", content: "Nuevo reporte de guardia | MINE REPORT BATCH" },
      { property: "og:description", content: "Registre la guardia paso a paso, incluso sin conexión." },
    ],
  }),
  component: NuevoReporte,
});

const PASOS = [
  "Datos de guardia",
  "Estado de robots",
  "Estado de mixers",
  "Combustible y aditivo",
  "Lanzamientos",
  "Carguío de mixers",
  "Fallas",
  "Desechos / morteros",
  "Observaciones",
  "Resumen",
];

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

function Contadores({ estados }: { estados: EstadoEquipo[] }) {
  return (
    <div className="sticky top-2 z-20 grid grid-cols-2 gap-2 rounded-lg border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur sm:grid-cols-4">
      {ESTADOS.map((e) => (
        <div key={e.value} className="rounded border border-border bg-background p-3 text-center">
          <p className="text-2xl font-black">{estados.filter((x) => x === e.value).length}</p>
          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_CLASSES[e.value]}`}>
            {e.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function NuevoReporte() {
  const data = useOpsData();
  const navigate = useNavigate();
  const [rep, setRep] = useState<Reporte | null>(null);
const [paso, setPaso] = useState(0);
const [errores, setErrores] = useState<string[]>([]);
const [mostrarIndice, setMostrarIndice] = useState(false);
const [guardadoLocal, setGuardadoLocal] = useState(true);

  useEffect(() => {
  const d = getData();
  const borrador = d.reportes.find(
    (r) => r.estado === "borrador",
  );

  const continuarDesdeUrl =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("continuar") === "1";

  // CONTINUAR: recuperar el reporte que está en curso.
  // Nunca debe mostrar la alerta ni crear una nueva guardia.
  if (continuarDesdeUrl && borrador) {
    setRep(borrador);
    setMostrarIndice(true);
    setGuardadoLocal(true);
    return;
  }

  // INICIAR: solamente aquí se permite reemplazar
  // el reporte que está actualmente en curso.
  if (borrador) {
    const confirmar = window.confirm(
      "Ya existe un reporte en curso.\n\n" +
        "Si inicias una nueva guardia, el reporte actual se eliminará.\n\n" +
        "¿Deseas iniciar una nueva guardia?",
    );

    if (!confirmar) {
      setRep(borrador);
      setMostrarIndice(true);
      setGuardadoLocal(true);
      return;
    }
  }

  try {
    const nuevo = iniciarNuevaGuardia();

    setRep(nuevo);
    setMostrarIndice(false);
    setGuardadoLocal(true);
  } catch (error) {
    console.error("No se pudo iniciar la nueva guardia.", error);
    setGuardadoLocal(false);

    toast.error(
      "No se pudo guardar la nueva guardia en el dispositivo. Inténtelo nuevamente.",
    );
  }
}, []);

  // Incorporar al reporte los equipos activos añadidos al catálogo.
  useEffect(() => {
    setRep((actual) => {
      if (!actual || actual.estado !== "borrador") {
        return actual;
      }
      return sincronizarEquiposReporte(actual, data);
    });
  }, [data.robots, data.mixers, rep?.id, rep?.estado]);

    // Autoguardado en el dispositivo
  useEffect(() => {
    if (!rep || rep.estado === "finalizado") return;

    const guardado = guardarReporte(rep);

    setGuardadoLocal(guardado);

    if (!guardado) {
      console.error(
        "No se pudo guardar el reporte localmente. Los cambios actuales podrían perderse al cerrar la aplicación.",
      );
    }
  }, [rep]);

  const robotsActivos = useMemo(
  () =>
    rep
      ? Object.values(rep.robotsSnapshot).filter((r) => rep.robots[r.id])
      : [],
  [rep],
);

const mixersActivos = useMemo(
  () =>
    rep
      ? Object.values(rep.mixersSnapshot).filter((m) => rep.mixers[m.id])
      : [],
  [rep],
);

  if (!rep) {
    return <div className="px-4 py-10 text-sm text-muted-foreground">Cargando reporte…</div>;
  }

  const up = (patch: Partial<Reporte>) => setRep({ ...rep, ...patch });

  const ROBOT_DETALLE_BASE: RobotDetalle = {
    estado: "operativo",
    combustible: { inicio: false, media: false, final: false },
    aditivo: null,
  };
  const detRobot = (id: string): RobotDetalle => rep.robots[id] ?? ROBOT_DETALLE_BASE;
  const detMixer = (id: string): MixerDetalle => rep.mixers[id] ?? { estado: "operativo" };

  const robotsOperativos = robotsActivos.filter((r) => rep.robots[r.id]?.estado === "operativo");
  const mixersOperativos = mixersActivos.filter((m) => rep.mixers[m.id]?.estado === "operativo");

  const validar = (): string[] => {
  const e: string[] = [];

  if (!rep.fecha) {
    e.push("Falta la fecha de guardia.");
  }

  if (!rep.supervisorId) {
    e.push("Debe seleccionar el supervisor de guardia.");
  }

  return e;
};

const revisarPendientes = (): string[] => {
  const pendientes: string[] = [];

  const robotsSinCombustible = robotsOperativos
  .filter((r) => {
    const c = detRobot(r.id).combustible;

    return !c.inicio && !c.media && !c.final;
  })
  .map((r) => r.codigo);

const robotsSinAditivo = robotsOperativos
  .filter((r) => detRobot(r.id).aditivo === null)
  .map((r) => r.codigo);

  if (robotsSinCombustible.length > 0) {
    pendientes.push(
      `Sin control de combustible: ${robotsSinCombustible.join(", ")}`
    );
  }

  if (robotsSinAditivo.length > 0) {
    pendientes.push(
      `Sin indicar aditivo: ${robotsSinAditivo.join(", ")}`
    );
  }

  if (robotsOperativos.length > 0 && rep.lanzamientos.length === 0) {
    pendientes.push("No se registraron lanzamientos.");
  }

  if (mixersOperativos.length > 0 && rep.carguios.length === 0) {
    pendientes.push("No se registraron carguíos de mixer.");
  }


  return pendientes;
};

  const finalizar = () => {
  if (rep.estado === "finalizado") {
    toast.error("Este reporte ya fue finalizado.");
    return;
  }

  const e = validar();
  setErrores(e);

  if (e.length > 0) {
    toast.error("Falta completar información obligatoria");
    return;
  }

  const pendientes = revisarPendientes();

  if (pendientes.length > 0) {
    const continuar = window.confirm(
      `Hay información que aún no fue registrada:\n\n• ${pendientes.join(
        "\n• "
      )}\n\n¿Deseas finalizar la guardia de todas formas?`
    );

    if (!continuar) {
      return;
    }
  }

  const final: Reporte = {
    ...rep,
    correlativo: `RG-${rep.fecha.replaceAll("-", "")}-${rep.tipoGuardia === "dia" ? "D" : "N"}`,
    estado: "finalizado",
    finalizadoEn: new Date().toISOString(),
  };

  const guardado = guardarReporte(final);

if (!guardado) {
  setGuardadoLocal(false);
  toast.error(
    "No se pudo guardar el reporte final. No cierre la aplicación e inténtelo nuevamente.",
  );
  return;
}

setGuardadoLocal(true);
toast.success("Reporte finalizado y bloqueado");
navigate({ to: "/app/reporte/$id", params: { id: final.id } });
};

const abrirPaso = (indice: number) => {
  setPaso(indice);
  setMostrarIndice(false);
};

const estadoPaso = (indice: number): "completo" | "pendiente" | "sin-registros" => {
  switch (indice) {
    case 0:
      return rep.fecha && rep.supervisorId ? "completo" : "pendiente";

    case 1:
  return rep.robotsRevisados ? "completo" : "pendiente";

case 2:
  return rep.mixersRevisados ? "completo" : "pendiente";

    case 3: {
  const robotsOperativos = robotsActivos.filter(
    (r) => rep.robots[r.id]?.estado === "operativo"
  );

  if (robotsOperativos.length === 0) {
    return "sin-registros";
  }

  const completo = robotsOperativos.every((r) => {
    const det = detRobot(r.id);
    const combustible =
      det.combustible.inicio ||
      det.combustible.media ||
      det.combustible.final;

    return combustible && det.aditivo !== null;
  });

  return completo ? "completo" : "pendiente";
}

    case 4:
  if (robotsOperativos.length === 0) {
    return "sin-registros";
  }

  return rep.lanzamientos.length > 0 ? "completo" : "pendiente";

    case 5:
  if (mixersOperativos.length === 0) {
    return "sin-registros";
  }

  return rep.carguios.length > 0 ? "completo" : "pendiente";

    case 6:
      return rep.fallas.length > 0 ? "completo" : "sin-registros";

    case 7:
      return rep.desechos.length > 0 ? "completo" : "sin-registros";

    case 8:
  return rep.observaciones.trim() ? "completo" : "sin-registros";

    case 9:
  return "pendiente";

    default:
      return "pendiente";
  }
};

    return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      {mostrarIndice ? (
        <div className="space-y-4">
          <div>
  <p className="text-xs uppercase tracking-widest text-primary">
    Reporte de guardia
  </p>

  <h1 className="text-xl font-bold uppercase tracking-tight sm:text-2xl">
    Índice del reporte
  </h1>

  <p className="mt-1 text-sm text-muted-foreground">
    Selecciona la sección que deseas revisar o completar.
  </p>

  <div className="mt-4 rounded-lg border border-border bg-card p-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-muted-foreground">
        Progreso del reporte
      </span>

      <span className="text-sm font-bold">
        {PASOS.filter((_, i) => estadoPaso(i) === "completo").length}/{PASOS.length}
      </span>
    </div>

    <Progress
      value={
        (PASOS.filter((_, i) => estadoPaso(i) === "completo").length /
          PASOS.length) *
        100
      }
      className="mt-2"
    />
  </div>
</div>

          <div className="space-y-2">
            {PASOS.map((nombre, indice) => {
  const estado = estadoPaso(indice);

  const estadoTexto = {
    completo: "Completo",
    pendiente: "Pendiente",
    "sin-registros": "Sin registros",
  }[estado];

  const estadoClase = {
    completo: "bg-green-100 text-green-700",
    pendiente: "bg-amber-100 text-amber-700",
    "sin-registros": "bg-muted text-muted-foreground",
  }[estado];

  return (
    <button
      key={nombre}
      type="button"
      onClick={() => abrirPaso(indice)}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition hover:bg-accent"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Paso {indice + 1}
        </p>

        <p className="mt-0.5 text-sm font-semibold">
          {nombre}
        </p>

        <span
          className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${estadoClase}`}
        >
          {estadoTexto}
        </span>
      </div>

      <ArrowRight className="ml-3 size-4 shrink-0 text-muted-foreground" />
    </button>
  );
})}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest text-primary">
              Paso {paso + 1} de {PASOS.length}
            </p>
        <h1 className="text-xl font-bold uppercase tracking-tight sm:text-2xl">{PASOS[paso]}</h1>
        <Progress value={((paso + 1) / PASOS.length) * 100} className="mt-3" />

<div className="mt-3 flex items-center justify-between gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setMostrarIndice(true)}
  >
    <span className="mr-2">☰</span>
    Índice del reporte
  </Button>

  <span
  className={`flex items-center gap-1 text-[11px] ${
    guardadoLocal ? "text-muted-foreground" : "text-destructive"
  }`}
>
  <Save className="size-3" />
  {guardadoLocal ? "Guardado automático" : "No se pudo guardar"}
</span>
</div>
      </div>

      <div className="space-y-5 rounded-lg border border-border bg-card p-4">
        {paso === 0 && (
          <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input type="date" value={rep.fecha} onChange={(e) => up({ fecha: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tipo de guardia</Label>
              <select
                className={selectClass}
                value={rep.tipoGuardia}
                onChange={(e) => up({ tipoGuardia: e.target.value as "dia" | "noche" })}
              >
                <option value="dia">Día</option>
                <option value="noche">Noche</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Supervisor</Label>
              <select
                className={selectClass}
                value={rep.supervisorId}
                onChange={(e) => up({ supervisorId: e.target.value })}
              >
                <option value="">Seleccione…</option>
                {data.usuarios
                  .filter((u) => u.activo)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} — {u.rol}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {paso === 1 && (
          <>
            <Contadores estados={robotsActivos.map((r) => detRobot(r.id).estado)} />
            <ul className="space-y-3">
              {robotsActivos.map((r) => (
                <li key={r.id} className="rounded border border-border p-3">
                  <p className="text-sm font-semibold">
                    {r.codigo} <span className="font-normal text-muted-foreground">· {r.modelo}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ESTADOS.map((e) => (
                      <button
                        key={e.value}
                        onClick={() =>
                          setRep({
                            ...rep,
                            robots: { ...rep.robots, [r.id]: { ...detRobot(r.id), estado: e.value } },
                          })
                        }
                        className={`rounded px-2 py-2 text-xs font-semibold transition ${
                          detRobot(r.id).estado === e.value
                            ? ESTADO_CLASSES[e.value]
                            : "border border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {paso === 2 && (
          <>
            <Contadores estados={mixersActivos.map((m) => detMixer(m.id).estado)} />
            <ul className="space-y-3">
              {mixersActivos.map((m) => (
                <li key={m.id} className="rounded border border-border p-3">
                  <p className="text-sm font-semibold">
                    {m.codigo} <span className="font-normal text-muted-foreground">· {m.modelo}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ESTADOS.map((e) => (
                      <button
                        key={e.value}
                        onClick={() =>
                          setRep({ ...rep, mixers: { ...rep.mixers, [m.id]: { ...detMixer(m.id), estado: e.value } } })
                        }
                        className={`rounded px-2 py-2 text-xs font-semibold transition ${
                          detMixer(m.id).estado === e.value
                            ? ESTADO_CLASSES[e.value]
                            : "border border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {paso === 3 && (
          <>
            <p className="text-sm text-muted-foreground">
              Control exclusivo de robots lanzadores: marque los momentos en que se cargó combustible e indique si
              tiene aditivo.
            </p>
            <ul className="space-y-3">
              {robotsActivos.map((r) => {
                const det = detRobot(r.id);
                const setDet = (patch: Partial<RobotDetalle>) =>
                  setRep({ ...rep, robots: { ...rep.robots, [r.id]: { ...det, ...patch } } });
                return (
                  <li key={r.id} className="rounded border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{r.codigo}</p>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ESTADO_CLASSES[det.estado]}`}>
                        {ESTADO_LABEL[det.estado]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {(["inicio", "media", "final"] as const).map((k) => (
                        <label key={k} className="flex items-center gap-2 text-sm capitalize">
                          <Checkbox
                            checked={det.combustible[k]}
                            onCheckedChange={(v) =>
                              setDet({ combustible: { ...det.combustible, [k]: Boolean(v) } })
                            }
                          />
                          {k}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Aditivo:</span>
                      {[
                        { v: true, l: "Sí" },
                        { v: false, l: "No" },
                      ].map((o) => (
                        <button
                          key={o.l}
                          onClick={() => setDet({ aditivo: o.v })}
                          className={`rounded px-3 py-1 text-xs font-semibold ${
                            det.aditivo === o.v
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {paso === 4 && (
          <>
            <p className="text-sm text-muted-foreground">
              Solo robots en estado Operativo ({robotsOperativos.length} disponibles).
            </p>
            {robotsOperativos.length === 0 ? (
              <p className="rounded border border-border p-4 text-sm">No hay robots operativos en esta guardia.</p>
            ) : (
              <>
                {rep.lanzamientos.map((l, i) => (
                  <div key={l.id} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between sm:col-span-2">
                      <p className="text-xs font-semibold uppercase text-primary">Lanzamiento {i + 1}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar lanzamiento"
                        onClick={() => up({ lanzamientos: rep.lanzamientos.filter((x) => x.id !== l.id) })}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Robot</Label>
                      <select
                        className={selectClass}
                        value={l.robotId}
                        onChange={(e) =>
                          up({
                            lanzamientos: rep.lanzamientos.map((x) =>
                              x.id === l.id ? { ...x, robotId: e.target.value } : x,
                            ),
                          })
                        }
                      >
                        {robotsOperativos.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.codigo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hora</Label>
                      <Input
                        type="time"
                        value={l.hora}
                        onChange={(e) =>
                          up({
                            lanzamientos: rep.lanzamientos.map((x) =>
                              x.id === l.id ? { ...x, hora: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
  <Label className="text-xs">Nivel</Label>
  <Input
    value={l.nivel}
    placeholder="Ej. Nv. 4500"
    onChange={(e) =>
      up({
        lanzamientos: rep.lanzamientos.map((x) =>
          x.id === l.id ? { ...x, nivel: e.target.value } : x,
        ),
      })
    }
  />
</div>

<div className="space-y-1">
  <Label className="text-xs">Labor</Label>
  <Input
    value={l.labor}
    onChange={(e) =>
      up({
        lanzamientos: rep.lanzamientos.map((x) =>
          x.id === l.id ? { ...x, labor: e.target.value } : x,
        ),
      })
    }
  />
</div>

<div className="space-y-1">
  <Label className="text-xs">Cantidad</Label>
  <Input
  type="number"
  min="0"
  step="0.01"
  value={l.cantidad === 0 ? "" : l.cantidad}
  placeholder="0"
  onChange={(e) => {
    const valor = e.target.value;

    up({
      lanzamientos: rep.lanzamientos.map((x) =>
        x.id === l.id
          ? {
              ...x,
              cantidad: valor === "" ? 0 : Number(valor),
            }
          : x,
      ),
    });
  }}
/>
</div>

<div className="space-y-1">
  <Label className="text-xs">Unidad</Label>
  <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium">
    m³
  </div>
</div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Notas</Label>
                      <Textarea
                        rows={2}
                        value={l.notas}
                        onChange={(e) =>
                          up({
                            lanzamientos: rep.lanzamientos.map((x) =>
                              x.id === l.id ? { ...x, notas: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    up({
                      lanzamientos: [
                        ...rep.lanzamientos,
                        {
  id: uid("lz"),
  robotId: robotsOperativos[0]?.id ?? "",
  hora: new Date().toTimeString().slice(0, 5),
  nivel: "",
  labor: "",
  cantidad: 0,
  notas: "",
},
                      ],
                    })
                  }
                >
                  <Plus className="mr-1 size-4" /> Añadir lanzamiento
                </Button>
              </>
            )}
          </>
        )}

        {paso === 5 && (
          <>
            <p className="text-sm text-muted-foreground">
              Solo mixers en estado Operativo ({mixersOperativos.length} disponibles).
            </p>
            {mixersOperativos.length === 0 ? (
              <p className="rounded border border-border p-4 text-sm">No hay mixers operativos en esta guardia.</p>
            ) : (
              <>
                {rep.carguios.map((c, i) => (
                  <div key={c.id} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between sm:col-span-2">
                      <p className="text-xs font-semibold uppercase text-primary">Carguío {i + 1}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar carguío"
                        onClick={() => up({ carguios: rep.carguios.filter((x) => x.id !== c.id) })}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mixer</Label>
                      <select
                        className={selectClass}
                        value={c.mixerId}
                        onChange={(e) =>
                          up({
                            carguios: rep.carguios.map((x) => (x.id === c.id ? { ...x, mixerId: e.target.value } : x)),
                          })
                        }
                      >
                        {mixersOperativos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.codigo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hora</Label>
                      <Input
                        type="time"
                        value={c.hora}
                        onChange={(e) =>
                          up({
                            carguios: rep.carguios.map((x) => (x.id === c.id ? { ...x, hora: e.target.value } : x)),
                          })
                        }
                      />
                    </div>

<div className="space-y-1">
  <Label className="text-xs">Nivel</Label>
  <Input
    value={c.nivel}
    placeholder="Ej. Nv. 4500"
    onChange={(e) =>
      up({
        carguios: rep.carguios.map((x) =>
          x.id === c.id ? { ...x, nivel: e.target.value } : x,
        ),
      })
    }
  />
</div>

<div className="space-y-1">
  <Label className="text-xs">Labor</Label>
  <Input
    value={c.labor}
    onChange={(e) =>
      up({
        carguios: rep.carguios.map((x) =>
          x.id === c.id ? { ...x, labor: e.target.value } : x,
        ),
      })
    }
  />
</div>

<div className="space-y-1">
  <Label className="text-xs">Cantidad</Label>
  <Input
  type="number"
  min="0"
  step="0.01"
  value={c.cantidad === 0 ? "" : c.cantidad}
  placeholder="0"
  onChange={(e) => {
    const valor = e.target.value;

    up({
      carguios: rep.carguios.map((x) =>
        x.id === c.id
          ? {
              ...x,
              cantidad: valor === "" ? 0 : Number(valor),
            }
          : x,
      ),
    });
  }}
/>
</div>

<div className="space-y-1">
  <Label className="text-xs">Unidad</Label>
  <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium">
    m³
  </div>
</div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Notas</Label>
                      <Textarea
                        rows={2}
                        value={c.notas}
                        onChange={(e) =>
                          up({
                            carguios: rep.carguios.map((x) => (x.id === c.id ? { ...x, notas: e.target.value } : x)),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() =>
                    up({
                      carguios: [
                        ...rep.carguios,
                        {
  id: uid("cg"),
  mixerId: mixersOperativos[0]?.id ?? "",
  hora: new Date().toTimeString().slice(0, 5),
  nivel: "",
  labor: "",
  cantidad: 0,
  notas: "",
},
                      ],
                    })
                  }
                >
                  <Plus className="mr-1 size-4" /> Añadir carguío
                </Button>
              </>
            )}
          </>
        )}

        {paso === 6 && (
          <>
            <p className="text-sm text-muted-foreground">Registre las fallas ocurridas durante la guardia.</p>
            {rep.fallas.map((f, i) => {
              const setF = (patch: Partial<typeof f>) =>
                up({ fallas: rep.fallas.map((x) => (x.id === f.id ? { ...x, ...patch } : x)) });
              return (
                <div key={f.id} className="grid gap-3 rounded border border-border p-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-primary">Falla {i + 1}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar falla"
                      onClick={() => up({ fallas: rep.fallas.filter((x) => x.id !== f.id) })}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Equipo</Label>
                    <select className={selectClass} value={f.equipoId} onChange={(e) => setF({ equipoId: e.target.value })}>
                      {[...robotsActivos, ...mixersActivos].map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora</Label>
                    <Input type="time" value={f.hora} onChange={(e) => setF({ hora: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de falla</Label>
                    <select className={selectClass} value={f.tipo} onChange={(e) => setF({ tipo: e.target.value })}>
                      {TIPOS_FALLA.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estado final del equipo</Label>
                    <select
                      className={selectClass}
                      value={f.estadoFinal}
                      onChange={(e) => setF({ estadoFinal: e.target.value as EstadoEquipo })}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Descripción</Label>
                    <Textarea rows={2} value={f.descripcion} onChange={(e) => setF({ descripcion: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Acción tomada</Label>
                    <Textarea rows={2} value={f.accion} onChange={(e) => setF({ accion: e.target.value })} />
                  </div>
                </div>
              );
            })}
            <Button
              size="sm"
              onClick={() =>
                up({
                  fallas: [
                    ...rep.fallas,
                    {
                      id: uid("fa"),
                      equipoId: robotsActivos[0]?.id ?? mixersActivos[0]?.id ?? "",
                      hora: new Date().toTimeString().slice(0, 5),
                      tipo: TIPOS_FALLA[0] ?? "Otra",
                      descripcion: "",
                      accion: "",
                      estadoFinal: "mantenimiento",
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1 size-4" /> Añadir falla
            </Button>
          </>
        )}

        {paso === 7 && (
          <>
            <p className="text-sm text-muted-foreground">Desechos, rebote y morteros generados en la guardia.</p>
            {rep.desechos.map((d, i) => {
              const setD = (patch: Partial<typeof d>) =>
                up({ desechos: rep.desechos.map((x) => (x.id === d.id ? { ...x, ...patch } : x)) });
              return (
                <div key={d.id} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-primary">Registro {i + 1}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar registro"
                      onClick={() => up({ desechos: rep.desechos.filter((x) => x.id !== d.id) })}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <select className={selectClass} value={d.tipo} onChange={(e) => setD({ tipo: e.target.value })}>
                      {TIPOS_DESECHO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora</Label>
                    <Input type="time" value={d.hora} onChange={(e) => setD({ hora: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Equipo</Label>
                    <select className={selectClass} value={d.equipoId} onChange={(e) => setD({ equipoId: e.target.value })}>
                      {[...robotsActivos, ...mixersActivos].map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
  <Label className="text-xs">Cantidad (m³)</Label>
  <Input
    type="number"
    min={0}
    step="0.01"
    value={d.cantidad === 0 ? "" : d.cantidad}
    placeholder="0"
    onChange={(e) => {
      const valor = e.target.value;

      setD({
        cantidad: valor === "" ? 0 : Number(valor),
      });
    }}
  />
</div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Descripción</Label>
                    <Textarea rows={2} value={d.descripcion} onChange={(e) => setD({ descripcion: e.target.value })} />
                  </div>
                </div>
              );
            })}
            <Button
              size="sm"
              onClick={() =>
                up({
                  desechos: [
                    ...rep.desechos,
                    {
                      id: uid("de"),
                      tipo: TIPOS_DESECHO[0] ?? "Otro",
                      hora: new Date().toTimeString().slice(0, 5),
                      equipoId: robotsActivos[0]?.id ?? mixersActivos[0]?.id ?? "",
                      cantidad: 0,
                      unidad: "m3",
                      descripcion: "",
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1 size-4" /> Añadir desecho / mortero
            </Button>
          </>
        )}

        {paso === 8 && (
          <div className="space-y-1">
            <Label>Observaciones generales de guardia</Label>
            <Textarea
              rows={7}
              value={rep.observaciones}
              placeholder="Condiciones del terreno, seguridad, coordinaciones, pendientes para la siguiente guardia…"
              onChange={(e) => up({ observaciones: e.target.value })}
            />
          </div>
        )}

        {paso === 9 && (
          <div className="space-y-4">
            {errores.length > 0 && (
              <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm">
                <p className="font-semibold text-destructive">Corrija antes de finalizar:</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {errores.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {[
              {
                titulo: "Datos de guardia",
                paso: 0,
                contenido: `${rep.fecha} · Guardia ${rep.tipoGuardia === "dia" ? "Día" : "Noche"} · ${nombreSupervisor(data, rep.supervisorId)}`,
              },
              {
                titulo: "Estado de robots",
                paso: 1,
                contenido: robotsActivos
                  .map((r) => `${r.codigo}: ${ESTADO_LABEL[detRobot(r.id).estado]}`)
                  .join(" · "),
              },
              {
                titulo: "Estado de mixers",
                paso: 2,
                contenido: mixersActivos.map((m) => `${m.codigo}: ${ESTADO_LABEL[detMixer(m.id).estado]}`).join(" · "),
              },
              {
                titulo: "Combustible y aditivo",
                paso: 3,
                contenido: robotsActivos
                  .map((r) => {
                    const det = detRobot(r.id);
                    const c = [det.combustible.inicio && "I", det.combustible.media && "M", det.combustible.final && "F"]
                      .filter(Boolean)
                      .join("/");
                    return `${r.codigo}: ${c || "sin registro"} · aditivo ${det.aditivo === null ? "?" : det.aditivo ? "sí" : "no"}`;
                  })
                  .join(" · "),
              },
              {
                titulo: "Lanzamientos",
                paso: 4,
                  contenido:
  rep.lanzamientos
    .map(
      (l) =>
        `${l.hora} ${rep.robotsSnapshot[l.robotId]?.codigo ?? l.robotId}: ${l.nivel} · ${l.labor} · ${l.cantidad} m³`,
    )
    .join(" · ") || "Sin registros",
              },
              {
                titulo: "Carguío de mixers",
                paso: 5,
                  contenido:
  rep.carguios
    .map(
      (c) =>
        `${c.hora} ${rep.mixersSnapshot[c.mixerId]?.codigo ?? c.mixerId}: ${c.nivel} · ${c.labor} · ${c.cantidad} m³`,
    )
    .join(" · ") || "Sin registros",
              },
              {
                titulo: "Fallas",
                paso: 6,
                contenido:
                  rep.fallas.map((f) => `${f.hora} ${nombreEquipo(data, f.equipoId)}: ${f.tipo}`).join(" · ") ||
                  "Sin registros",
              },
              {
  titulo: "Desechos / morteros",
  paso: 7,
  contenido:
    rep.desechos
      .map((d) => `${d.hora} ${d.tipo}: ${d.cantidad} m³`)
      .join(" · ") || "Sin registros",
},
              { titulo: "Observaciones", paso: 8, contenido: rep.observaciones || "Sin observaciones" },
            ].map((s) => (
              <div key={s.titulo} className="rounded border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{s.titulo}</p>
                  <Button variant="ghost" size="sm" onClick={() => setPaso(s.paso)}>
                    <Pencil className="mr-1 size-3" /> Editar
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.contenido}</p>
              </div>
            ))}

            <Button className="w-full" size="lg" onClick={finalizar}>
              <CheckCircle2 className="mr-1 size-4" /> Finalizar guardia
            </Button>
          </div>
        )}
      </div>

            <div className="mt-5 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          disabled={paso === 0}
          onClick={() => setPaso(paso - 1)}
        >
          <ArrowLeft className="mr-1 size-4" />
          Anterior
        </Button>

        <Button
  disabled={paso === PASOS.length - 1}
  onClick={() => {
    if (paso === 1) {
      setRep({ ...rep, robotsRevisados: true });
    } else if (paso === 2) {
      setRep({ ...rep, mixersRevisados: true });
    }

    setPaso(paso + 1);
  }}
>
  Siguiente
  <ArrowRight className="ml-1 size-4" />
</Button>
      </div>
      </>
      )}
    </div>
  );
}
