type EntradaCardProps = {
  titulo: string;
  fecha: string;
  contenido: string;
};

// Entrada sin tarjeta: separador inferior y marca lateral que se pinta de acento en hover
export default function EntradaCard({ titulo, fecha, contenido }: EntradaCardProps) {
  return (
    <article className="relative border-b border-border py-4 pl-4 last:border-b-0 before:absolute before:top-[18px] before:bottom-[18px] before:left-0 before:w-0.5 before:rounded-sm before:bg-tick-idle before:transition-colors hover:before:bg-accent">
      <p className="mb-1.5 font-mono text-[0.7rem] text-muted">{fecha}</p>
      <h2 className="mb-1.5 text-[1.08rem] font-semibold tracking-tight text-title">{titulo}</h2>
      <p className="max-w-[44ch] text-[0.9rem] text-text">{contenido}</p>
    </article>
  );
}
