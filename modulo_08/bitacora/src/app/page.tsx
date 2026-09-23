import Link from "next/link";

// Clases compartidas por los dos links de la home
const claseLink =
  "inline-block rounded-[7px] border border-accent-line bg-accent-wash px-[11px] py-1.5 font-mono text-[0.76rem] text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">
        Mi bitácora<span className="text-accent">.</span>
      </h1>
      <p className="mt-1.5 text-[0.9rem] text-muted">
        Anotá lo que aprendés cada día y repasalo cuando quieras.
      </p>

      <nav className="mt-7 flex gap-3">
        <Link href="/entradas" className={claseLink}>
          ver entradas
        </Link>
        <Link href="/nueva" className={claseLink}>
          + nueva
        </Link>
      </nav>
    </main>
  );
}
