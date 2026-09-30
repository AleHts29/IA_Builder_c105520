"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormularioEntrada from "@/components/FormularioEntrada";
import ListaEntradas from "@/components/ListaEntradas";
import { supabase } from "@/lib/supabase";
import type { Entrada } from "@/lib/types";

export default function EntradasPage() {
  const router = useRouter();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Entrada que se está editando; null = el formulario carga una nueva
  const [entradaAEditar, setEntradaAEditar] = useState<Entrada | null>(null);
  // Entrada cuyos pendientes se están extrayendo; null = ninguna
  const [analizandoId, setAnalizandoId] = useState<string | null>(null);

  // Trae las entradas de Supabase, de la más nueva a la más vieja
  const cargarEntradas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("entradas")
        .select("*")
        .order("created_at", { ascending: false });
      // Tratamos el error antes de usar data
      if (error) {
        console.error("Falló el select de entradas:", error);
        setError("No pudimos cargar tus entradas. Recargá la página para intentar de nuevo.");
        return;
      }
      setEntradas(data ?? []);
    } catch (e) {
      console.error("Error inesperado al cargar entradas:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y recargá la página.");
    } finally {
      setCargando(false);
    }
  }, []);

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
      await cargarEntradas();
    }
    verificarSesion();
  }, [router, cargarEntradas]);

  // Después de guardar volvemos a consultar la tabla, así la entrada nueva aparece arriba sin recargar
  async function handleGuardar() {
    setEntradaAEditar(null);
    await cargarEntradas();
  }

  // Carga la entrada en el formulario y sube hasta él
  function handleEditar(entrada: Entrada) {
    setEntradaAEditar(entrada);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Mientras verificamos la sesión no mostramos nada
  if (verificando) return null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Entradas</h1>
      <p className="mt-1.5 text-[0.9rem] text-muted">
        Acá vas a ver la lista de entradas de tu bitácora.
      </p>

      {/* La key reinicia el formulario al cambiar de entrada (o al volver a "nueva") */}
      <FormularioEntrada
        key={entradaAEditar?.id ?? "nueva"}
        entradaAEditar={entradaAEditar}
        onGuardar={handleGuardar}
        onCancelar={() => setEntradaAEditar(null)}
        onAnalizando={setAnalizandoId}
        onAnalizado={() => setAnalizandoId(null)}
      />

      <div className="mt-10">
        {cargando ? (
          <p className="text-[0.9rem] text-muted">Cargando entradas...</p>
        ) : error !== null ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[0.88rem] text-red-300"
          >
            {error}
          </p>
        ) : (
          // Si no hay entradas, ListaEntradas muestra EstadoVacio
          // Al borrar una entrada, volvemos a consultar la tabla igual que al guardar
          <ListaEntradas
            entradas={entradas}
            onBorrada={cargarEntradas}
            onEditar={handleEditar}
            analizandoId={analizandoId}
          />
        )}
      </div>
    </main>
  );
}
