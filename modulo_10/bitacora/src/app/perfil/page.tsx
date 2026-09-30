"use client";

import { useState } from "react";
import { extraerYGuardarPendientes } from "@/lib/entradas";
import { supabase } from "@/lib/supabase";

type Resultado = { procesadas: number; fallidas: number };

// Pantalla temporal de mantenimiento: completa los embeddings que falten
export default function PerfilPage() {
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerar() {
    setError(null);
    setResultado(null);
    setProgreso(null);
    setProcesando(true);
    try {
      // RLS limita la consulta a las entradas del usuario conectado
      const { data, error: errorSelect } = await supabase
        .from("entradas")
        .select("id, texto")
        .is("embedding", null)
        .order("created_at", { ascending: true });

      // Tratamos el error antes de usar data
      if (errorSelect) {
        console.error("Falló el select de entradas sin embedding:", errorSelect);
        setError("No pudimos traer tus entradas. Recargá la página y probá de nuevo.");
        return;
      }
      if (!data || data.length === 0) {
        setResultado({ procesadas: 0, fallidas: 0 });
        return;
      }

      // De a una, en serie: nunca en paralelo, para no saturar la API del modelo
      let procesadas = 0;
      let fallidas = 0;
      for (let i = 0; i < data.length; i++) {
        setProgreso({ actual: i + 1, total: data.length });
        const pendientes = await extraerYGuardarPendientes(data[i].id, data[i].texto);
        // Si devuelve null falló: la salteamos y seguimos con la siguiente
        if (pendientes === null) {
          fallidas++;
        } else {
          procesadas++;
        }
      }
      setResultado({ procesadas, fallidas });
    } catch (e) {
      console.error("Error inesperado al generar embeddings:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setProgreso(null);
      setProcesando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Mantenimiento</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted">
        Completá los embeddings de las entradas que todavía no los tienen.
      </p>

      <button
        type="button"
        onClick={handleGenerar}
        disabled={procesando}
        className="mt-8 w-full cursor-pointer rounded-lg bg-accent px-3.5 py-[11px] text-[0.92rem] font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-placeholder"
      >
        {procesando ? "Generando..." : "Generar embeddings faltantes"}
      </button>

      {progreso !== null && (
        <p className="mt-4 font-mono text-[0.76rem] text-muted">
          Procesando {progreso.actual} de {progreso.total}...
        </p>
      )}

      {resultado !== null && (
        <p className="mt-4 text-[0.9rem] text-text">
          Listo: {resultado.procesadas} procesadas, {resultado.fallidas} con error.
          {resultado.fallidas > 0 && " Volvé a apretar el botón para reintentar las que fallaron."}
        </p>
      )}

      {error !== null && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[0.88rem] text-red-300"
        >
          {error}
        </p>
      )}
    </main>
  );
}
