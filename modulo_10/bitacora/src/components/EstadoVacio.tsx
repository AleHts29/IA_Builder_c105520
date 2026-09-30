import Link from "next/link";

// Mensaje que se muestra cuando no hay entradas cargadas
export default function EstadoVacio() {
  return (
    <div className="mt-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="mb-2.5 font-mono text-[0.72rem] text-muted">0 entradas</p>
      <h2 className="mb-1.5 font-semibold text-title">Todavía no escribiste nada</h2>
      <p className="mb-[18px] text-[0.88rem] text-text">Tu primera entrada va a aparecer acá.</p>
      <Link
        href="/nueva"
        className="inline-block rounded-[7px] border border-accent-line bg-accent-wash px-[11px] py-1.5 font-mono text-[0.76rem] text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        + nueva entrada
      </Link>
    </div>
  );
}
