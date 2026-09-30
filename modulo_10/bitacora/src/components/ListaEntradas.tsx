import EntradaCard from "@/components/EntradaCard";
import EstadoVacio from "@/components/EstadoVacio";
import type { Entrada } from "@/lib/types";

type ListaEntradasProps = {
  entradas: Entrada[];
  // Se llama después de borrar una entrada, para que la página refresque la lista
  onBorrada: () => void | Promise<void>;
  // Se llama con la entrada elegida para que la página cargue el formulario en modo edición
  onEditar: (entrada: Entrada) => void;
  // Id de la entrada cuyos pendientes se están extrayendo; null = ninguna
  analizandoId?: string | null;
};

// Renderiza una tarjeta por cada entrada, o el estado vacío si no hay ninguna
export default function ListaEntradas({ entradas, onBorrada, onEditar, analizandoId }: ListaEntradasProps) {
  if (entradas.length === 0) {
    return <EstadoVacio />;
  }

  return (
    <div>
      {entradas.map((entrada) => (
        // EntradaCard espera "contenido", así que le pasamos entrada.texto.
        // La fecha sale de created_at, en formato local AAAA-MM-DD ("en-CA")
        <EntradaCard
          key={entrada.id}
          id={entrada.id}
          titulo={entrada.titulo}
          fecha={entrada.created_at ? new Date(entrada.created_at).toLocaleDateString("en-CA") : ""}
          contenido={entrada.texto}
          pendientes={entrada.pendientes}
          analizando={entrada.id === analizandoId}
          onBorrada={onBorrada}
          onEditar={() => onEditar(entrada)}
        />
      ))}
    </div>
  );
}
