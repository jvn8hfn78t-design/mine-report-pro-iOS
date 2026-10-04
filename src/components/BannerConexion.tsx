import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConexion } from "@/hooks/use-conexion";

export function BannerConexion() {
  const { estado } = useConexion();

  const config = {
    conectado: {
      texto: "Conectado",
      detalle: "Los cambios se guardan automáticamente en este dispositivo",
      icono: <Wifi className="size-4" />,
      clase: "bg-status-operativo/15 text-status-operativo border-status-operativo/40",
    },
    "sin-conexion": {
      texto: "Sin conexión",
      detalle: "Puede seguir trabajando: todo queda guardado en este dispositivo",
      icono: <WifiOff className="size-4" />,
      clase: "bg-status-mantenimiento/15 text-status-mantenimiento border-status-mantenimiento/40",
    },
  }[estado];

  return (
    <div className={cn("flex items-center gap-3 border-b px-4 py-2 text-xs sm:text-sm", config.clase)}>
      <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
        {config.icono}
        {config.texto}
      </span>
      <span className="hidden flex-1 truncate text-muted-foreground sm:block">{config.detalle}</span>
    </div>
  );
}
