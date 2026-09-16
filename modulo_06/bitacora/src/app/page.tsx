import Link from "next/link";
import ListaEntradas from "@/components/ListaEntradas";
import type { Entrada } from "@/lib/types";

// Entradas de ejemplo para mostrar en el home
const entradas: Entrada[] = [
  {
    id: "1",
    titulo: "Arranqué el proyecto",
    fecha: "12 de septiembre de 2026",
    texto: "Creé el proyecto con Next.js y aprendí a levantarlo con npm run dev.",
  },
  {
    id: "2",
    titulo: "Las carpetas son las rutas",
    fecha: "13 de septiembre de 2026",
    texto: "Armé las páginas de entradas, nueva y perfil dentro de src/app.",
  },
  {
    id: "3",
    titulo: "Mi primer componente",
    fecha: "14 de septiembre de 2026",
    texto: "Hice EntradaCard para mostrar cada entrada de la bitácora.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-bold">Mi bitácora</h1>
      {/* Botón que lleva a la pantalla para crear una entrada */}
      <Link
        href="/nueva"
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
      >
        Nueva entrada
      </Link>
      <ListaEntradas entradas={entradas} />
    </main>
  );
}
