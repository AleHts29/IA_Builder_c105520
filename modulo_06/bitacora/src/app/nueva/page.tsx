"use client";

import FormularioEntrada from "@/components/FormularioEntrada";
import type { Entrada } from "@/lib/types";

export default function NuevaPage() {
  // Por ahora no guardamos en ningún lado: sólo mostramos la entrada en consola
  function handleGuardar(entrada: Entrada) {
    console.log("Entrada nueva:", entrada);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Nueva entrada</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted">
        Acá vas a poder crear una nueva entrada en tu bitácora.
      </p>

      <FormularioEntrada onGuardar={handleGuardar} />
    </main>
  );
}
