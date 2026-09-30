"use client";

import { useState } from "react";
import { actualizarEntrada, crearEntrada, extraerYGuardarPendientes } from "@/lib/entradas";
import { supabase } from "@/lib/supabase";
import type { DatosEntrada, Entrada } from "@/lib/types";

type FormularioEntradaProps = {
  onGuardar: (entrada: DatosEntrada) => void | Promise<void>;
  // Si viene, el formulario arranca con sus datos y al guardar hace update en vez de insert
  entradaAEditar?: Entrada | null;
  onCancelar?: () => void;
  // Avisan cuándo empieza y cuándo termina la extracción de pendientes (salga bien o mal).
  // Son opcionales: /nueva usa el formulario sin ellas.
  onAnalizando?: (id: string) => void;
  onAnalizado?: () => void;
};

const MAXIMO_TEXTO = 5000;

// Devuelve un mensaje de error, o null si los datos están bien
function validarEntrada(titulo: string, texto: string): string | null {
  if (titulo.trim() === "") {
    return "Escribí un título para la entrada.";
  }
  if (texto.trim() === "") {
    return "Escribí el texto de la entrada.";
  }
  if (texto.trim().length > MAXIMO_TEXTO) {
    return `El texto no puede pasar los ${MAXIMO_TEXTO} caracteres. Acortalo y volvé a intentar.`;
  }
  return null;
}

// Formulario para cargar una entrada nueva o editar una existente
// Los campos arrancan con los datos de entradaAEditar: quien lo usa le pone una key para reiniciarlo
export default function FormularioEntrada({
  onGuardar,
  entradaAEditar,
  onCancelar,
  onAnalizando,
  onAnalizado,
}: FormularioEntradaProps) {
  const [titulo, setTitulo] = useState(entradaAEditar?.titulo ?? "");
  const [texto, setTexto] = useState(entradaAEditar?.texto ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El botón sólo se habilita si hay título y texto, y no se está guardando
  const deshabilitado = titulo.trim() === "" || texto.trim() === "" || guardando;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validamos primero: si algo está mal, mostramos el mensaje y cortamos
    const mensaje = validarEntrada(titulo, texto);
    if (mensaje !== null) {
      setError(mensaje);
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      // Traemos el usuario conectado para asociarle la entrada
      const { data: datosUsuario, error: errorUsuario } = await supabase.auth.getUser();
      if (errorUsuario || !datosUsuario.user) {
        console.error("No hay usuario conectado:", errorUsuario);
        setError("Tu sesión se cerró. Iniciá sesión de nuevo para guardar la entrada.");
        return;
      }

      // Lo que carga el usuario; id y created_at los pone la base
      const entrada: DatosEntrada = {
        titulo: titulo.trim(),
        texto: texto.trim(),
      };
      if (entradaAEditar) {
        const { data, error: errorUpdate } = await actualizarEntrada(entradaAEditar.id, entrada);
        if (errorUpdate) {
          throw errorUpdate;
        }
        // Si RLS no dejó cambiar nada, no hay error pero tampoco filas
        if (data.length === 0) {
          setError("No se guardaron los cambios: puede que la entrada ya no exista. Recargá la página.");
          return;
        }
        await onGuardar(entrada);
        // Limpiamos los campos después de guardar
        setTitulo("");
        setTexto("");
      } else {
        const { data, error: errorInsert } = await crearEntrada({
          ...entrada,
          user_id: datosUsuario.user.id,
        });
        // Si el insert falla, lo mandamos al catch para mostrar el mensaje de error
        if (errorInsert) {
          throw errorInsert;
        }

        // Primero mostramos la entrada: limpiamos los campos y refrescamos la lista
        setTitulo("");
        setTexto("");
        await onGuardar(entrada);

        // Después, en segundo plano, los pendientes. Sin await: no bloquea el formulario
        // y si falla no muestra ningún error, sólo no habrá pendientes.
        const creada = data?.[0];
        if (creada) {
          onAnalizando?.(creada.id);
          extraerYGuardarPendientes(creada.id, entrada.texto)
            .then(async (pendientes) => {
              // Refrescamos de nuevo para que la lista muestre los pendientes ya guardados
              if (pendientes !== null) {
                await onGuardar(entrada);
              }
            })
            // Avisamos que terminó pase lo que pase, para que se saque el "Analizando..."
            .finally(() => onAnalizado?.());
        }
      }
    } catch (e) {
      // El detalle técnico va a la consola; al usuario le mostramos algo entendible
      console.error("Falló el guardado de la entrada:", e);
      setError("No pudimos guardar la entrada. Probá de nuevo en unos segundos.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      {error !== null && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[0.88rem] text-red-300"
        >
          {error}
        </p>
      )}

      <label className="flex flex-col">
        <span className="mb-[7px] font-mono text-[0.7rem] text-muted">título</span>
        <input
          type="text"
          name="titulo"
          placeholder="Un título corto"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash"
        />
      </label>

      <label className="flex flex-col">
        <span className="mb-[7px] font-mono text-[0.7rem] text-muted">texto</span>
        <textarea
          name="texto"
          rows={4}
          placeholder="¿Qué aprendiste hoy?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-24 resize-y w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash"
        />
      </label>

      <button
        type="submit"
        disabled={deshabilitado}
        className="w-full cursor-pointer rounded-lg bg-accent px-3.5 py-[11px] text-[0.92rem] font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-placeholder"
      >
        {guardando ? "Guardando..." : entradaAEditar ? "Guardar cambios" : "Guardar entrada"}
      </button>

      {entradaAEditar && onCancelar && (
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="cursor-pointer font-mono text-[0.76rem] text-muted disabled:cursor-not-allowed"
        >
          cancelar edición
        </button>
      )}
    </form>
  );
}
