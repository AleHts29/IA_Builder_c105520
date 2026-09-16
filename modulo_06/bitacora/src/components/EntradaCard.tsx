type EntradaCardProps = {
  titulo: string;
  fecha: string;
  contenido: string;
};

export default function EntradaCard({ titulo, fecha, contenido }: EntradaCardProps) {
  return (
    <article className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="text-xl font-bold text-zinc-900">{titulo}</h2>
      <p className="mt-1 text-sm text-zinc-500">{fecha}</p>
      <p className="mt-4 text-zinc-700">{contenido}</p>
    </article>
  );
}
