"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Traduce los errores de Supabase Auth a mensajes en español que dicen qué hacer
function traducirError(mensaje: string): string {
  if (mensaje.includes("already registered")) {
    return "Ya existe una cuenta con ese email. Iniciá sesión o usá otro email.";
  }
  if (mensaje.includes("Password should be at least")) {
    return "La contraseña es muy corta. Usá al menos 6 caracteres.";
  }
  if (mensaje.includes("invalid")) {
    return "El email no parece válido. Revisalo y probá de nuevo.";
  }
  return "No pudimos crear la cuenta. Probá de nuevo en unos segundos.";
}

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // El botón sólo se habilita si hay email y contraseña, y no se está enviando
  const deshabilitado = email.trim() === "" || password === "" || cargando;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      // Tratamos el error antes de seguir
      if (error) {
        console.error("Falló signUp:", error);
        setError(traducirError(error.message));
        return;
      }
      setExito(true);
    } catch (e) {
      // Errores inesperados (red caída, etc.): detalle a consola, mensaje claro al usuario
      console.error("Error inesperado al registrarse:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const claseInput =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[0.92rem] text-brand placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash";

  if (exito) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-12">
        <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Cuenta creada</h1>
        <p className="mt-3 text-[0.92rem] text-muted">
          Si te llega un correo de confirmación, abrilo y después{" "}
          <Link href="/login" className="text-accent">iniciá sesión</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-[1.35rem] font-semibold tracking-tight text-brand">Crear cuenta</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error !== null && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[0.88rem] text-red-300">
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
          <input type="password" name="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres"
            value={password} onChange={(e) => setPassword(e.target.value)} className={claseInput} />
        </label>

        <button type="submit" disabled={deshabilitado}
          className="w-full cursor-pointer rounded-lg bg-accent px-3.5 py-[11px] text-[0.92rem] font-semibold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-disabled disabled:text-placeholder">
          {cargando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-[0.88rem] text-muted">
        ¿Ya tenés cuenta? <Link href="/login" className="text-accent">Iniciá sesión</Link>
      </p>
    </main>
  );
}
