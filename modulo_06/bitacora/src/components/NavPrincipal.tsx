"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/", etiqueta: "home" },
  { href: "/entradas", etiqueta: "entradas" },
  { href: "/nueva", etiqueta: "nueva" },
  { href: "/perfil", etiqueta: "perfil" },
];

// Navegación principal; resalta la sección en la que estás parado
export default function NavPrincipal() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border">
      <ul className="mx-auto flex w-full max-w-2xl gap-1 px-6 py-3 font-mono text-[0.76rem]">
        {SECCIONES.map((seccion) => {
          const activa = pathname === seccion.href;
          return (
            <li key={seccion.href}>
              <Link
                href={seccion.href}
                aria-current={activa ? "page" : undefined}
                className={`inline-block rounded-[7px] px-[11px] py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  activa
                    ? "border border-accent-line bg-accent-wash text-accent"
                    : "border border-transparent text-muted hover:text-brand"
                }`}
              >
                {seccion.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
