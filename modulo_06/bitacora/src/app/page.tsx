import Link from "next/link";
import ListaEntradas from "@/components/ListaEntradas";
import type { Entrada } from "@/lib/types";

// Entradas de ejemplo para mostrar en el home
const entradas: Entrada[] = [
  {
    id: "1",
    titulo: "Arranqué el proyecto",
    fecha: "2026-09-12",
    texto: "Creé el proyecto con Next.js y aprendí a levantarlo con npm run dev.",
  },
  {
    id: "2",
    titulo: "Las carpetas son las rutas",
    fecha: "2026-09-13",
    texto: "Armé las páginas de entradas, nueva y perfil dentro de src/app.",
  },
  {
    id: "3",
    titulo: "Mi primer componente",
    fecha: "2026-09-14",
    texto: "Hice EntradaCard para mostrar cada entrada de la bitácora.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      {/* Encabezado: marca con punto de acento + botón que lleva a crear una entrada */}
      <header className="mb-7 flex items-center justify-between">
        <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">
          Mi bitácora<span className="text-accent">.</span>
        </h1>
        <Link
          href="/nueva"
          className="inline-block rounded-[7px] border border-accent-line bg-accent-wash px-[11px] py-1.5 font-mono text-[0.76rem] text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          + nueva
        </Link>
      </header>
      <ListaEntradas entradas={entradas} />
    </main>
  );
}
