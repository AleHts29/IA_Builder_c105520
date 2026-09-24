import type { Entrada } from "@/lib/types";

// MOCK: no guarda nada en ningún lado. Simula una llamada a un servidor
// (1 segundo de demora) y falla al azar 1 de cada 3 veces, para practicar
// el manejo de errores en la interfaz.
export async function guardarEntrada(entrada: Entrada): Promise<Entrada> {
  // Esperamos 1 segundo simulando la latencia de red
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Falla 1 de cada 3 veces (aproximadamente el 33% de los intentos)
  if (Math.random() < 1 / 3) {
    throw new Error("No se pudo guardar la entrada. Revisá tu conexión y probá de nuevo.");
  }

  return entrada;
}
