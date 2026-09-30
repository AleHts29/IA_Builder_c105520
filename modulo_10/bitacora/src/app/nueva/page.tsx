"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormularioEntrada from "@/components/FormularioEntrada";
import { supabase } from "@/lib/supabase";
import type { DatosEntrada } from "@/lib/types";

export default function NuevaPage() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  // Si no hay usuario conectado, mandamos a /login antes de mostrar nada
  useEffect(() => {
    async function verificarSesion() {
      const { data, error } = await supabase.auth.getUser();
      // Sin sesión, getUser devuelve error: lo tratamos igual que "no hay usuario"
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      setVerificando(false);
    }
    verificarSesion();
  }, [router]);

  // Por ahora no guardamos en ningún lado: sólo mostramos la entrada en consola
  function handleGuardar(entrada: DatosEntrada) {
    console.log("Entrada nueva:", entrada);
  }

  // Mientras verificamos la sesión no mostramos nada
  if (verificando) return null;

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
