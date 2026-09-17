import EntradaCard from "@/components/EntradaCard";
import EstadoVacio from "@/components/EstadoVacio";
import type { Entrada } from "@/lib/types";

type ListaEntradasProps = {
  entradas: Entrada[];
};

// Renderiza una tarjeta por cada entrada, o el estado vacío si no hay ninguna
export default function ListaEntradas({ entradas }: ListaEntradasProps) {
  if (entradas.length === 0) {
    return <EstadoVacio />;
  }

  return (
    <div>
      {entradas.map((entrada) => (
        // EntradaCard espera "contenido", así que le pasamos entrada.texto
        <EntradaCard
          key={entrada.id}
          titulo={entrada.titulo}
          fecha={entrada.fecha}
          contenido={entrada.texto}
        />
      ))}
    </div>
  );
}
