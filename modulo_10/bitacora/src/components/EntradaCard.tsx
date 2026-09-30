"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type EntradaCardProps = {
  id: string;
  titulo: string;
  fecha: string;
  contenido: string;
  // Compromisos que la IA extrajo del texto; puede no haber ninguno
  pendientes: string[] | null;
  // true mientras la IA analiza esta entrada
  analizando?: boolean;
  onBorrada: () => void | Promise<void>;
  onEditar: () => void;
};

// Entrada sin tarjeta: separador inferior y marca lateral que se pinta de acento en hover
export default function EntradaCard({
  id,
  titulo,
  fecha,
  contenido,
  pendientes,
  analizando,
  onBorrada,
  onEditar,
}: EntradaCardProps) {
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBorrar() {
    // Pedimos confirmación: borrar no se puede deshacer
    if (!window.confirm(`¿Borrar la entrada "${titulo}"? No se puede deshacer.`)) return;

    setError(null);
    setBorrando(true);
    try {
      // Siempre con filtro por id: nunca un delete sin .eq()
      // .select() devuelve las filas borradas, para detectar si RLS no dejó borrar nada
      const { data, error } = await supabase.from("entradas").delete().eq("id", id).select();
      if (error) {
        console.error("Falló el delete de la entrada:", error);
        setError("No pudimos borrar la entrada. Probá de nuevo en unos segundos.");
        return;
      }
      if (data.length === 0) {
        setError("No se borró la entrada: puede que ya no exista o que no sea tuya. Recargá la página.");
        return;
      }
      await onBorrada();
    } catch (e) {
      console.error("Error inesperado al borrar:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <article className="relative border-b border-border py-4 pl-4 last:border-b-0 before:absolute before:top-[18px] before:bottom-[18px] before:left-0 before:w-0.5 before:rounded-sm before:bg-tick-idle before:transition-colors hover:before:bg-accent">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-mono text-[0.7rem] text-muted">{fecha}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onEditar}
            disabled={borrando}
            className="cursor-pointer font-mono text-[0.7rem] text-accent disabled:cursor-not-allowed disabled:text-placeholder"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleBorrar}
            disabled={borrando}
            className="cursor-pointer font-mono text-[0.7rem] text-red-300 disabled:cursor-not-allowed disabled:text-placeholder"
          >
            {borrando ? "Borrando..." : "Borrar"}
          </button>
        </div>
      </div>
      <h2 className="mb-1.5 text-[1.08rem] font-semibold tracking-tight text-title">{titulo}</h2>
      <p className="max-w-[44ch] text-[0.9rem] text-text">{contenido}</p>
      {/* Mientras la IA analiza, ocupa el lugar de los pendientes */}
      {analizando ? (
        <p className="mt-3 font-mono text-[0.7rem] text-muted">Analizando la nota...</p>
      ) : null}
      {/* Sección opcional: sólo si la IA encontró compromisos en el texto */}
      {!analizando && pendientes !== null && pendientes.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 font-mono text-[0.7rem] text-muted">Pendientes</p>
          <ul className="max-w-[44ch] list-disc pl-4 text-[0.85rem] text-text marker:text-accent">
            {pendientes.map((pendiente) => (
              <li key={pendiente}>{pendiente}</li>
            ))}
          </ul>
        </div>
      )}
      {error !== null && (
        <p role="alert" className="mt-2 text-[0.82rem] text-red-300">
          {error}
        </p>
      )}
    </article>
  );
}
