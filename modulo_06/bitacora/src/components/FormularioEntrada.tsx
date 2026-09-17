"use client";

import { useState } from "react";
import type { Entrada } from "@/lib/types";

type FormularioEntradaProps = {
  onGuardar: (entrada: Entrada) => void | Promise<void>;
};

// Formulario para cargar una entrada nueva; quien lo usa decide qué hacer con ella
export default function FormularioEntrada({ onGuardar }: FormularioEntradaProps) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);

  // El botón sólo se habilita si hay título y texto, y no se está guardando
  const deshabilitado = titulo.trim() === "" || texto.trim() === "" || guardando;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (deshabilitado) return;

    setGuardando(true);
    try {
      await onGuardar({
        id: Date.now().toString(),
        titulo: titulo.trim(),
        texto: texto.trim(),
        // Fecha local en formato ISO (ej: "2026-09-16"); "en-CA" usa AAAA-MM-DD
        fecha: new Date().toLocaleDateString("en-CA"),
      });
      // Limpiamos los campos después de guardar
      setTitulo("");
      setTexto("");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col">
        <span className="mb-[7px] font-mono text-[0.7rem] text-muted">título</span>
        <input
          type="text"
          name="titulo"
          placeholder="Un título corto"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash"
        />
      </label>

      <label className="flex flex-col">
        <span className="mb-[7px] font-mono text-[0.7rem] text-muted">texto</span>
        <textarea
          name="texto"
          rows={4}
          placeholder="¿Qué aprendiste hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-24 resize-y w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash"
        />
      </label>

      <button
        type="submit"
        disabled={deshabilitado}
        className="w-full cursor-pointer rounded-lg bg-accent px-3.5 py-[11px] text-[0.92rem] font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-placeholder"
      >
        {guardando ? "Guardando..." : "Guardar entrada"}
      </button>
    </form>
  );
}
