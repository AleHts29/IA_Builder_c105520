"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Fuente = { id: string; titulo: string; fecha: string; similitud: number };

// Pregunta sobre tus entradas: busca las más parecidas y responde sólo con ellas
export default function Preguntar() {
  const [pregunta, setPregunta] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [error, setError] = useState<string | null>(null);

  const deshabilitado = pregunta.trim() === "" || buscando;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (deshabilitado) return;

    setError(null);
    setRespuesta(null);
    setFuentes([]);
    setBuscando(true);
    try {
      // El endpoint necesita el token para que la búsqueda sea sólo de tus entradas
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Tu sesión se cerró. Iniciá sesión de nuevo para preguntar.");
        return;
      }

      const r = await fetch("/api/preguntar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pregunta: pregunta.trim() }),
      });
      const datos = await r.json();

      if (!r.ok) {
        console.error("Falló /api/preguntar. Status:", r.status, datos);
        setError(datos?.error ?? "No pudimos responder tu pregunta. Probá de nuevo en unos segundos.");
        return;
      }

      setRespuesta(datos.respuesta);
      setFuentes(Array.isArray(datos.fuentes) ? datos.fuentes : []);
    } catch (e) {
      console.error("Error inesperado al preguntar:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col">
          <span className="mb-[7px] font-mono text-[0.7rem] text-muted">preguntá sobre tus entradas</span>
          <input
            type="text"
            name="pregunta"
            placeholder="¿Qué me quedó pendiente con el deploy?"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash"
          />
        </label>
        <button
          type="submit"
          disabled={deshabilitado}
          className="w-full cursor-pointer rounded-lg bg-accent px-3.5 py-[11px] text-[0.92rem] font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-placeholder"
        >
          {buscando ? "Buscando en tus entradas..." : "Preguntar"}
        </button>
      </form>

      {respuesta !== null && (
        <div className="mt-4">
          <p className="whitespace-pre-line text-[0.9rem] text-text">{respuesta}</p>
          {/* Las fuentes van numeradas igual que las citas [1], [2]... de la respuesta */}
          {fuentes.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 font-mono text-[0.7rem] text-muted">Fuentes</p>
              <ol className="text-[0.82rem] text-muted">
                {fuentes.map((fuente, i) => (
                  <li key={fuente.id}>
                    [{i + 1}] {fuente.titulo} · {fuente.fecha}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {error !== null && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[0.88rem] text-red-300"
        >
          {error}
        </p>
      )}
    </section>
  );
}
