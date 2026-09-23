"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Barra superior: muestra quién está conectado y permite cerrar sesión
export default function BarraUsuario() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarUsuario() {
      const { data, error } = await supabase.auth.getUser();
      // Sin sesión, getUser devuelve error: lo tratamos como "no hay usuario"
      if (error) {
        setEmail(null);
      } else {
        setEmail(data.user?.email ?? null);
      }
      setCargando(false);
    }
    cargarUsuario();

    // El layout no se vuelve a montar al navegar: escuchamos login/logout para actualizar la barra
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setEmail(sesion?.user.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleCerrarSesion() {
    setError(null);
    setCerrando(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Falló signOut:", error);
        setError("No pudimos cerrar la sesión. Probá de nuevo.");
        return;
      }
      router.push("/login");
    } catch (e) {
      console.error("Error inesperado al cerrar sesión:", e);
      setError("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setCerrando(false);
    }
  }

  // Mientras averiguamos si hay sesión no mostramos nada, para evitar un parpadeo
  if (cargando) return <div className="h-10" />;

  return (
    <div className="flex h-10 items-center justify-end gap-3 border-b border-border px-6 text-[0.85rem]">
      {error !== null && <span role="alert" className="text-red-300">{error}</span>}
      {email !== null ? (
        <>
          <span className="text-muted">{email}</span>
          <button
            type="button"
            onClick={handleCerrarSesion}
            disabled={cerrando}
            className="cursor-pointer text-accent disabled:cursor-not-allowed disabled:text-placeholder"
          >
            {cerrando ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </>
      ) : (
        <Link href="/login" className="text-accent">Iniciar sesión</Link>
      )}
    </div>
  );
}
