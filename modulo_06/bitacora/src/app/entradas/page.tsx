"use client";

import { useState } from "react";
import FormularioEntrada from "@/components/FormularioEntrada";
import ListaEntradas from "@/components/ListaEntradas";
import type { Entrada } from "@/lib/types";

// Entradas de ejemplo con las que arranca la lista
const ENTRADAS_INICIALES: Entrada[] = [
  {
    id: "1",
    titulo: "Arranqué el proyecto",
    fecha: "2026-09-12",
    texto: "Creé el proyecto con Next.js y aprendí a levantarlo con npm run dev.",
  },
  {
    id: "2",
    titulo: "Mi primer componente",
    fecha: "2026-09-14",
    texto: "Hice EntradaCard para mostrar cada entrada de la bitácora.",
  },
];

export default function EntradasPage() {
  const [entradas, setEntradas] = useState<Entrada[]>(ENTRADAS_INICIALES);

  // Agrega la entrada nueva al principio de la lista, con id y fecha propios
  function handleGuardar(entrada: Entrada) {
    const nueva: Entrada = {
      ...entrada,
      id: crypto.randomUUID(),
      // Fecha local en formato ISO (ej: "2026-09-23"); "en-CA" usa AAAA-MM-DD
      fecha: new Date().toLocaleDateString("en-CA"),
    };
    setEntradas((actuales) => [nueva, ...actuales]);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Entradas</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted">
        Acá vas a ver la lista de entradas de tu bitácora.
      </p>

      <FormularioEntrada onGuardar={handleGuardar} />

      <div className="mt-10">
        <ListaEntradas entradas={entradas} />
      </div>
    </main>
  );
}
