import { supabase } from "@/lib/supabase";
import type { DatosEntrada, Entrada } from "@/lib/types";

// Lo que carga el usuario más el dueño de la entrada; id y created_at los pone la base
type NuevaEntrada = DatosEntrada & Pick<Entrada, "user_id">;

// Alta de una entrada; .select() devuelve la fila creada, con su id
export async function crearEntrada(datos: NuevaEntrada) {
  return await supabase.from("entradas").insert(datos).select();
}

// Edición: siempre filtrando por id; .select() devuelve las filas cambiadas
export async function actualizarEntrada(id: string, datos: DatosEntrada) {
  return await supabase.from("entradas").update(datos).eq("id", id).select();
}

// Junta los pendientes de las últimas 5 entradas en una sola lista, sin repetidos.
// RLS ya limita la consulta a las entradas del usuario conectado.
export async function pendientesAbiertos(): Promise<string[]> {
  const { data, error } = await supabase
    .from("entradas")
    .select("pendientes")
    .order("created_at", { ascending: false })
    .limit(5);

  // Tratamos el error antes de usar data
  if (error) {
    console.error("Falló el select de pendientes:", error);
    return [];
  }
  if (!data) {
    return [];
  }

  const juntos = data.flatMap((fila) =>
    Array.isArray(fila.pendientes) ? (fila.pendientes as string[]) : []
  );
  // El Set saca los repetidos manteniendo el orden de aparición
  return [...new Set(juntos.filter((p) => typeof p === "string" && p.trim() !== ""))];
}

// Pide los pendientes a la IA y los guarda en la fila.
// Es una mejora opcional: si algo falla devuelve null y nunca corta el guardado de la entrada.
export async function extraerYGuardarPendientes(
  entradaId: string,
  texto: string
): Promise<string[] | null> {
  try {
    // Contexto para el modelo: lo que ya quedó pendiente en entradas anteriores
    const abiertos = await pendientesAbiertos();

    const respuesta = await fetch("/api/extraer-pendientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, pendientesAbiertos: abiertos }),
    });

    if (!respuesta.ok) {
      console.error("No se pudieron extraer los pendientes. Status:", respuesta.status);
      return null;
    }

    const { pendientes } = await respuesta.json();

    const { error } = await supabase.from("entradas").update({ pendientes }).eq("id", entradaId);
    if (error) {
      console.error("No se pudieron guardar los pendientes:", error);
      return null;
    }

    return pendientes;
  } catch (e) {
    console.error("Falló la extracción de pendientes:", e);
    return null;
  }
}
