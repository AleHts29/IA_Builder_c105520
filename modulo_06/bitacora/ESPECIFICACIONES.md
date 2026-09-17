# Bitácora — Especificaciones del proyecto

> Estado del proyecto al 16 de septiembre de 2026.

## Stack

| Capa | Tecnología | Versión instalada |
|---|---|---|
| Framework | **Next.js** con App Router (las rutas son carpetas en `src/app`) | 16.3.5 |
| Librería de UI | **React** + React DOM | 19.2.8 |
| Lenguaje | **TypeScript** en modo `strict` | 5.9.3 |
| Estilos | **Tailwind CSS** vía `@tailwindcss/postcss` | 4.3.3 |
| Lint | **ESLint** con `eslint-config-next` (core-web-vitals + TypeScript) | 9.39.5 |
| Bundler en desarrollo | **Turbopack** (el que usa `next dev` por defecto en Next 16) | incluido en Next |
| Node requerido | **>= 20.9.0** (lo exige Next) | — |

No hay otras dependencias: sin librerías de formularios, validación, manejo de estado, base de datos ni tests.

## Configuración

- **`next.config.ts`**: vacío, usa los valores por defecto.
- **`tsconfig.json`**: alias `@/*` → `./src/*` (por eso los imports son `@/components/...` y `@/lib/...`).
- **`src/app/globals.css`**: `@import "tailwindcss"` y variables `--background` / `--foreground`. Tailwind 4 no necesita `tailwind.config`.
- **`eslint.config.mjs`**: ignora `.next/`, `out/`, `build/` y `next-env.d.ts`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Levanta el build de producción |
| `npm run lint` | Corre ESLint |

## Estructura

```
src/
├── app/
│   ├── layout.tsx          layout raíz (fuentes Geist, globals.css)
│   ├── page.tsx            "/"          home con 3 entradas de ejemplo
│   ├── nueva/page.tsx      "/nueva"     "use client", usa FormularioEntrada
│   ├── entradas/page.tsx   "/entradas"  página de relleno
│   └── perfil/page.tsx     "/perfil"    página de relleno
├── components/
│   ├── EntradaCard.tsx         tarjeta de una entrada
│   ├── ListaEntradas.tsx       recorre las entradas o muestra EstadoVacio
│   ├── EstadoVacio.tsx         mensaje de lista vacía
│   └── FormularioEntrada.tsx   "use client", formulario con estado
└── lib/
    └── types.ts            type Entrada { id, titulo, texto, fecha }
```

## Rutas

```
                    layout.tsx  (envuelve todas las páginas)
                         │
     ┌───────────────┬───┴───────────┬───────────────┐
     ▼               ▼               ▼               ▼
    "/"          "/nueva"        "/entradas"      "/perfil"
  (Home)       (formulario)    (relleno)         (relleno)
     │               ▲
     └── botón ──────┘
    "Nueva entrada"
```

- El único enlace entre páginas es el botón del home hacia `/nueva`.
- `/entradas` y `/perfil` sólo tienen un título y un párrafo.

## Flujo de datos

### Home (`/`)

```
lib/types.ts ── type Entrada
      │
      ▼
app/page.tsx ── const entradas: Entrada[] (3 de ejemplo)
      │  props: entradas
      ▼
ListaEntradas ── ¿está vacío? ── sí → EstadoVacio
      │ no: .map(), key = entrada.id
      │ texto → contenido
      ▼
EntradaCard (una por entrada)
```

Los datos bajan en una sola dirección, de padre a hijo por props.

### Nueva entrada (`/nueva`)

```
app/nueva/page.tsx  ("use client")
      │  props: onGuardar = console.log
      ▼
FormularioEntrada  ("use client")
  estado: titulo, texto, guardando
  botón "Guardar entrada" deshabilitado si falta título/texto o si está guardando
  al enviar: arma la Entrada (id = Date.now(), fecha en formato es-AR)
             → llama a onGuardar(entrada) → limpia los campos
```

`/nueva` lleva `"use client"` porque le pasa una función (`onGuardar`) a un componente cliente, y una página de servidor no puede pasar funciones por props.

## Tipo `Entrada`

```ts
export type Entrada = {
  id: string;
  titulo: string;
  texto: string;
  fecha: string;
};
```

`EntradaCard` recibe esos datos con la prop `contenido` en lugar de `texto`; la traducción se hace en `ListaEntradas`.

## Pendientes y observaciones

- **Sin persistencia**: el formulario sólo hace `console.log`, y el home muestra entradas fijas escritas en el código.
- **Formulario y home no están conectados**: una entrada nueva no aparece en la lista.
- **Restos del template**: `layout.tsx` todavía tiene el título "Create Next App" y `lang="en"`.
- **Versión de Node**: si la terminal usa Node 18, `next dev` no arranca. Usar Node 20.9 o superior (por ejemplo `nvm use 22`).
