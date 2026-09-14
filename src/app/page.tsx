import EntradaCard from "@/components/EntradaCard";

const entradas = [
  {
    titulo: "Arranqué el proyecto",
    fecha: "12 de septiembre de 2026",
    contenido: "Creé el proyecto con Next.js y aprendí a levantarlo con npm run dev.",
  },
  {
    titulo: "Las carpetas son las rutas",
    fecha: "13 de septiembre de 2026",
    contenido: "Armé las páginas de entradas, nueva y perfil dentro de src/app.",
  },
  {
    titulo: "Mi primer componente",
    fecha: "14 de septiembre de 2026",
    contenido: "Hice EntradaCard para mostrar cada entrada de la bitácora.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-bold">Mi bitácora</h1>
      {entradas.map((entrada) => (
        <EntradaCard
          key={entrada.titulo}
          titulo={entrada.titulo}
          fecha={entrada.fecha}
          contenido={entrada.contenido}
        />
      ))}
    </main>
  );
}
