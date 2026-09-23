"use client";

// Pantalla TEMPORAL de diagnóstico: muestra el resultado crudo de un select a "entradas".
// Borrarla cuando se confirme la conexión con Supabase.
import { useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function TestDbPage() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function consultar() {
      const { data, error } = await supabase.from("entradas").select("*");
      // Guardamos los dos tal cual para verlos en pantalla, sin procesar.
      setData(data);
      setError(error);
      setCargando(false);
    }
    consultar();
  }, []);

  if (cargando) return <p className="p-4">Consultando Supabase...</p>;

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Diagnóstico: tabla entradas</h1>
      <section>
        <h2 className="font-semibold">error</h2>
        <pre className="bg-gray-100 p-2 overflow-auto text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </section>
      <section>
        <h2 className="font-semibold">data</h2>
        <pre className="bg-gray-100 p-2 overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>
    </main>
  );
}
