"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Traduce los errores de Supabase Auth a mensajes en español que dicen qué hacer
function traducirError(mensaje: string): string {
  if (mensaje.includes("Invalid login credentials")) {
    return "El email o la contraseña no coinciden. Revisalos y probá de nuevo.";
  }
  if (mensaje.includes("Email not confirmed")) {
    return "Todavía no confirmaste tu email. Buscá el correo de confirmación en tu bandeja.";
  }
  return "No pudimos iniciar sesión. Probá de nuevo en unos segundos.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El botón sólo se habilita si hay email y contraseña, y no se está enviando
  const deshabilitado = email.trim() === "" || password === "" || cargando;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      // Tratamos el error antes de seguir
      if (error) {
        console.error("Falló signInWithPassword:", error);
        setError(traducirError(error.message));
        return;
      }
      router.push("/entradas");
    } catch (e) {
      // Errores inesperados (red caída, etc.): detalle a consola, mensaje claro al usuario
      console.error("Error inesperado al iniciar sesión:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const claseInput =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash";

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Iniciar sesión</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error !== null && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[0.88rem] text-red-300"
          >
            {error}
          </p>
        )}

        <label className="flex flex-col">
          <span className="mb-[7px] font-mono text-[0.7rem] text-muted">email</span>
          <input type="email" name="email" autoComplete="email" placeholder="vos@ejemplo.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className={claseInput} />
        </label>

        <label className="flex flex-col">
          <span className="mb-[7px] font-mono text-[0.7rem] text-muted">contraseña</span>
          <input type="password" name="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={claseInput} />
        </label>

        <button
          type="submit"
          disabled={deshabilitado}
          className="w-full cursor-pointer rounded-lg bg-accent px-3.5 py-[11px] text-[0.92rem] font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-placeholder"
        >
          {cargando ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-4 text-[0.88rem] text-muted">
        ¿No tenés cuenta? <Link href="/registro" className="text-accent">Registrate</Link>
      </p>
    </main>
  );
}
