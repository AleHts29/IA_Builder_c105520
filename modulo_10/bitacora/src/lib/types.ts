// Tipo que representa una entrada de la bitácora, igual a las columnas de la tabla "entradas"
export type Entrada = {
  id: string;
  user_id: string;
  titulo: string;
  texto: string;
  // Columna jsonb: lista de compromisos cortos extraídos del texto; puede venir en null
  pendientes: string[] | null;
  // Fecha y hora con zona horaria en formato ISO; la columna admite null
  created_at: string | null;
};

// Lo que carga el usuario en el formulario; el resto lo completa la base
export type DatosEntrada = Pick<Entrada, "titulo" | "texto">;
