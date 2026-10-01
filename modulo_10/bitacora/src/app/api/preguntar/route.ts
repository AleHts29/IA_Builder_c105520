import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Instrucciones del sistema: van aparte de la pregunta y del contexto
const INSTRUCCIONES = [
  "Respondé usando ÚNICAMENTE las entradas de la bitácora que te paso.",
  'Si la respuesta no está en ellas, decí "No encontré esa información en tus entradas".',
  "No completes con suposiciones ni con conocimiento propio.",
  "Citá de qué entrada sacaste cada dato, con su número entre corchetes, por ejemplo [2].",
  "Sé breve y concreto.",
].join(" ");

// Mismo modelo y dimensiones con los que se indexó el contenido
const MODELO_EMBEDDING = "gemini-embedding-2";
const DIMENSIONES = 768;
const CANTIDAD = 5;
const MAXIMO_PREGUNTA = 500;

// Cada fila que devuelve la función SQL buscar_entradas
type EntradaEncontrada = {
  id: string;
  titulo: string;
  texto: string;
  created_at: string | null;
  similitud: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pregunta = body?.pregunta;

    if (typeof pregunta !== "string" || pregunta.trim() === "") {
      return Response.json({ error: "Escribí una pregunta." }, { status: 400 });
    }
    if (pregunta.trim().length > MAXIMO_PREGUNTA) {
      return Response.json(
        { error: `La pregunta no puede pasar los ${MAXIMO_PREGUNTA} caracteres. Acortala y probá de nuevo.` },
        { status: 400 }
      );
    }

    // El token de la sesión viaja en el header: con él, auth.uid() funciona
    // dentro de la función SQL y la búsqueda queda limitada a este usuario
    const cabecera = request.headers.get("Authorization");
    const token = cabecera?.startsWith("Bearer ") ? cabecera.slice(7).trim() : null;
    if (!token) {
      return Response.json({ error: "Iniciá sesión para preguntar." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Si el token no sirve, cortamos antes de gastar una llamada al modelo
    const { data: datosUsuario, error: errorUsuario } = await supabase.auth.getUser();
    if (errorUsuario || !datosUsuario.user) {
      console.error("Token inválido en /api/preguntar:", errorUsuario);
      return Response.json({ error: "Tu sesión venció. Iniciá sesión de nuevo." }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const embedding = await ai.models.embedContent({
      model: MODELO_EMBEDDING,
      contents: pregunta,
      config: { outputDimensionality: DIMENSIONES },
    });

    const vector = embedding.embeddings?.[0]?.values;
    // Validamos antes de usarlo: la función SQL espera un vector de 768
    if (!Array.isArray(vector) || vector.length !== DIMENSIONES) {
      throw new Error(`El embedding de la pregunta no vino con ${DIMENSIONES} dimensiones`);
    }

    // La función filtra por auth.uid() adentro: nunca le mandamos el user_id
    const { data: encontradas, error: errorBusqueda } = await supabase.rpc("buscar_entradas", {
      query_embedding: vector,
      cantidad: CANTIDAD,
    });

    // Tratamos el error antes de usar los datos
    if (errorBusqueda) {
      // Mostramos los campos del error: los objetos de Supabase se loguean vacíos
      console.error("Falló la búsqueda vectorial:", errorBusqueda.message, errorBusqueda.hint);
      throw new Error(errorBusqueda.message);
    }

    const filas: EntradaEncontrada[] = Array.isArray(encontradas) ? encontradas : [];
    // Sin entradas no hay nada que responder: no llamamos al modelo
    if (filas.length === 0) {
      return Response.json({
        respuesta: "No encontré información sobre eso en tus entradas.",
        fuentes: [],
      });
    }

    // Cada entrada numerada, para que el modelo pueda citarla como [1], [2]...
    const contexto = filas
      .map((fila, i) => {
        const fecha = fila.created_at ? new Date(fila.created_at).toLocaleDateString("en-CA") : "sin fecha";
        return `[${i + 1}] ${fecha} · ${fila.titulo}\n${fila.texto}`;
      })
      .join("\n\n");

    const respuesta = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        { text: `ENTRADAS DE LA BITÁCORA:\n${contexto}` },
        { text: `PREGUNTA:\n${pregunta}` },
      ],
      config: { systemInstruction: INSTRUCCIONES },
    });

    console.log("[tokens]", respuesta.usageMetadata);

    // Validamos la respuesta antes de usarla: puede venir vacía
    if (typeof respuesta.text !== "string") {
      throw new Error("El modelo no devolvió texto");
    }

    return Response.json({
      respuesta: respuesta.text,
      fuentes: filas.map((fila) => ({
        id: fila.id,
        titulo: fila.titulo,
        fecha: fila.created_at ? new Date(fila.created_at).toLocaleDateString("en-CA") : "",
        similitud: fila.similitud,
      })),
    });
  } catch (e) {
    // El detalle técnico queda en el servidor; al cliente le mandamos algo entendible
    console.error("Falló preguntar:", e);
    return Response.json(
      { error: "No pudimos responder tu pregunta. Probá de nuevo en unos segundos." },
      { status: 500 }
    );
  }
}
