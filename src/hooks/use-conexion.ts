import { useEffect, useState } from "react";

export type EstadoConexion = "conectado" | "sin-conexion";

export function useConexion() {
  const [estado, setEstado] = useState<EstadoConexion>(
    navigator.onLine ? "conectado" : "sin-conexion"
  );

  useEffect(() => {
    const online = () => setEstado("conectado");
    const offline = () => setEstado("sin-conexion");

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return { estado };
}