import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setData, uid, useOpsData } from "@/lib/ops-store";
import type { Equipo, Usuario } from "@/lib/ops-types";

export const Route = createFileRoute("/app/catalogos")({
  head: () => ({
    meta: [
      { title: "Catálogos de equipos y personal | MINE REPORT BATCH" },
      {
        name: "description",
        content: "Administre robots lanzadores, mixers y supervisores disponibles para los reportes de guardia.",
      },
      { property: "og:title", content: "Catálogos de equipos y personal | MINE REPORT BATCH" },
      { property: "og:description", content: "Robots, mixers y usuarios precargados y listos para editar." },
    ],
  }),
  component: Catalogos,
});

type Tipo = "robots" | "mixers";

function EquipoTab({ tipo }: { tipo: Tipo }) {
  const data = useOpsData();
  const lista = data[tipo];
  const [edit, setEdit] = useState<Equipo | null>(null);

  const vacio: Equipo = { id: "", codigo: "", modelo: "", ubicacion: "", activo: true };

  const guardar = (eq: Equipo) => {
    setData((d) => {
      const actual = d[tipo];
      const nuevo = eq.id
        ? actual.map((e) => (e.id === eq.id ? eq : e))
        : [...actual, { ...eq, id: uid(tipo === "robots" ? "rb" : "mx") }];
      return { ...d, [tipo]: nuevo };
    });
    setEdit(null);
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => setEdit(vacio)}>
        <Plus className="mr-1 size-4" /> Añadir {tipo === "robots" ? "robot" : "mixer"}
      </Button>

      {edit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar(edit);
          }}
          className="grid gap-3 rounded-lg border border-primary/40 bg-card p-4 sm:grid-cols-3"
        >
          <div className="space-y-1">
            <Label className="text-xs">Código</Label>
            <Input required value={edit.codigo} onChange={(e) => setEdit({ ...edit, codigo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Modelo</Label>
            <Input required value={edit.modelo} onChange={(e) => setEdit({ ...edit, modelo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ubicación</Label>
            <Input value={edit.ubicacion} onChange={(e) => setEdit({ ...edit, ubicacion: e.target.value })} />
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {lista.map((eq) => (
          <li key={eq.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                {eq.codigo} <span className="font-normal text-muted-foreground">· {eq.modelo}</span>
              </p>
              <p className="text-xs text-muted-foreground">{eq.ubicacion || "Sin ubicación"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                  eq.activo ? "bg-status-operativo/15 text-status-operativo" : "bg-muted text-muted-foreground"
                }`}
              >
                {eq.activo ? "Activo" : "Inactivo"}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setEdit(eq)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Activar o desactivar"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    [tipo]: d[tipo].map((e) => (e.id === eq.id ? { ...e, activo: !e.activo } : e)),
                  }))
                }
              >
                <Power className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar"
                onClick={() => setData((d) => ({ ...d, [tipo]: d[tipo].filter((e) => e.id !== eq.id) }))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UsuariosTab() {
  const data = useOpsData();
  const [edit, setEdit] = useState<Usuario | null>(null);
  const vacio: Usuario = { id: "", nombre: "", rol: "", turnoPreferido: "rotativo", activo: true };

  const guardar = (u: Usuario) => {
    setData((d) => ({
      ...d,
      usuarios: u.id ? d.usuarios.map((x) => (x.id === u.id ? u : x)) : [...d.usuarios, { ...u, id: uid("us") }],
    }));
    setEdit(null);
  };

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => setEdit(vacio)}>
        <Plus className="mr-1 size-4" /> Añadir usuario
      </Button>

      {edit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar(edit);
          }}
          className="grid gap-3 rounded-lg border border-primary/40 bg-card p-4 sm:grid-cols-3"
        >
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input required value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rol</Label>
            <Input required value={edit.rol} onChange={(e) => setEdit({ ...edit, rol: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Turno</Label>
            <select
              value={edit.turnoPreferido}
              onChange={(e) => setEdit({ ...edit, turnoPreferido: e.target.value as Usuario["turnoPreferido"] })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="dia">Día</option>
              <option value="noche">Noche</option>
              <option value="rotativo">Rotativo</option>
            </select>
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEdit(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {data.usuarios.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{u.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {u.rol} · Turno {u.turnoPreferido}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                  u.activo ? "bg-status-operativo/15 text-status-operativo" : "bg-muted text-muted-foreground"
                }`}
              >
                {u.activo ? "Activo" : "Inactivo"}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setEdit(u)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Activar o desactivar"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    usuarios: d.usuarios.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x)),
                  }))
                }
              >
                <Power className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Catalogos() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Catálogos</h1>
        <p className="text-sm text-muted-foreground">Robots, mixers y personal disponibles para los reportes.</p>
      </div>
      <Tabs defaultValue="robots">
        <TabsList>
          <TabsTrigger value="robots">Robots</TabsTrigger>
          <TabsTrigger value="mixers">Mixers</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="robots" className="mt-4">
          <EquipoTab tipo="robots" />
        </TabsContent>
        <TabsContent value="mixers" className="mt-4">
          <EquipoTab tipo="mixers" />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-4">
          <UsuariosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
