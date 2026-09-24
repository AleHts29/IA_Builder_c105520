import { GoogleGenAI, Type } from "@google/genai";

// Instrucciones del sistema: van aparte del texto del usuario, nunca concatenadas
const INSTRUCCIONES = [
  "Sos un asistente que lee notas de una bitácora personal.",
  "Extraé sólo los compromisos concretos y accionables que aparezcan en el texto.",
  "No inventes pendientes que no estén: si no hay ninguno claro, devolvé una lista vacía.",
  "Escribí cada pendiente en infinitivo y en menos de 15 palabras.",
  "Si un compromiso ya figura entre los pendientes abiertos del contexto, no lo repitas en la respuesta.",
].join(" ");

// Forma exacta que le exigimos a la respuesta del modelo
const ESQUEMA = {
  type: Type.OBJECT,
  properties: {
    pendientes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["pendientes"],
};

// Parsea la respuesta del modelo. Ante cualquier problema devuelve [] en vez de romper
function parsearPendientes(texto: string): string[] {
  try {
    const data = JSON.parse(texto);
    if (!Array.isArray(data?.pendientes)) {
      console.error("La respuesta no trae un array en pendientes:", texto);
      return [];
    }
    // Nos quedamos sólo con los strings que tengan contenido
    return data.pendientes
      .filter((p: unknown): p is string => typeof p === "string" && p.trim() !== "")
      .map((p: string) => p.trim());
  } catch (e) {
    console.error("No se pudo parsear la respuesta del modelo:", texto, e);
    return [];
  }
}

// La llamada al modelo sale del servidor: la API key nunca llega al navegador
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const texto = body?.texto;

    if (typeof texto !== "string" || texto.trim() === "") {
      return Response.json({ error: "Falta el texto" }, { status: 400 });
    }

    // Puede venir vacío o no venir: sólo usamos los strings con contenido
    const abiertos: string[] = Array.isArray(body?.pendientesAbiertos)
      ? body.pendientesAbiertos.filter((p: unknown) => typeof p === "string" && p.trim() !== "")
      : [];

    // Cada bloque va en su propia parte y etiquetado, para que el contexto
    // no se confunda con el texto de la nota
    const partes = [];
    if (abiertos.length > 0) {
      partes.push({
        text: `CONTEXTO (pendientes abiertos de entradas anteriores):\n${abiertos.map((p) => `- ${p}`).join("\n")}`,
      });
    }
    partes.push({ text: `NOTA A ANALIZAR:\n${texto}` });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const respuesta = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: partes,
      config: {
        systemInstruction: INSTRUCCIONES,
        responseMimeType: "application/json",
        responseSchema: ESQUEMA,
      },
    });

    // Validamos la respuesta antes de usarla: puede venir vacía
    if (typeof respuesta.text !== "string") {
      throw new Error("El modelo no devolvió texto");
    }

    return Response.json({ pendientes: parsearPendientes(respuesta.text) });
  } catch (e) {
    // El detalle técnico queda en el servidor; al cliente le mandamos algo entendible
    console.error("Falló extraer-pendientes:", e);
    return Response.json({ error: "No pudimos procesar la nota" }, { status: 500 });
  }
}
