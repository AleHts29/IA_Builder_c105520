export default function NuevaPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Nueva entrada</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Acá vas a poder crear una nueva entrada en tu bitácora.
      </p>

      {/* Formulario para cargar una entrada (todavía no guarda los datos) */}
      <form className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Título</span>
          <input
            type="text"
            name="titulo"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Texto</span>
          <textarea
            name="texto"
            rows={6}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="self-start rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
        >
          Guardar
        </button>
      </form>
    </main>
  );
}
