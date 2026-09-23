import { GoogleGenAI } from "@google/genai";

// Instrucciones del sistema: van aparte del texto del usuario, nunca concatenadas
const INSTRUCCIONES = [
  "Sos un asistente que lee notas de una bitácora personal.",
  "Extraé del texto los compromisos y tareas pendientes.",
  "Devolvé uno por línea, sin numerar, sin viñetas y sin comentarios.",
  "Si no hay ninguno, no devuelvas nada.",
].join(" ");

// La llamada al modelo sale del servidor: la API key nunca llega al navegador
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const texto = body?.texto;

    if (typeof texto !== "string" || texto.trim() === "") {
      return Response.json({ error: "Falta el texto" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const respuesta = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: texto,
      config: { systemInstruction: INSTRUCCIONES },
    });

    // Validamos la respuesta antes de usarla: puede venir vacía
    if (typeof respuesta.text !== "string") {
      throw new Error("El modelo no devolvió texto");
    }

    return Response.json({ pendientes: respuesta.text });
  } catch (e) {
    // El detalle técnico queda en el servidor; al cliente le mandamos algo entendible
    console.error("Falló extraer-pendientes:", e);
    return Response.json({ error: "No pudimos procesar la nota" }, { status: 500 });
  }
}
