# Bitácora — Especificaciones del proyecto

> Estado del proyecto al 23 de septiembre de 2026 (módulo 7: Supabase).

## Stack

| Capa | Tecnología | Versión instalada |
|---|---|---|
| Framework | **Next.js** con App Router (las rutas son carpetas en `src/app`) | 16.3.5 |
| Librería de UI | **React** + React DOM | 19.2.8 |
| Lenguaje | **TypeScript** en modo `strict` | 5.9.3 |
| Estilos | **Tailwind CSS** vía `@tailwindcss/postcss` | 4.3.3 |
| Base de datos y auth | **Supabase** vía `@supabase/supabase-js` | 2.117.1 |
| Lint | **ESLint** con `eslint-config-next` (core-web-vitals + TypeScript) | 9.39.5 |
| Bundler en desarrollo | **Turbopack** (el que usa `next dev` por defecto en Next 16) | incluido en Next |
| Node requerido | **>= 20.9.0** (lo exige Next) | — |

No hay otras dependencias: sin ORMs, librerías de formularios, validación, manejo de estado ni tests.

## Configuración

- **`next.config.ts`**: vacío, usa los valores por defecto.
- **`tsconfig.json`**: alias `@/*` → `./src/*` (por eso los imports son `@/components/...` y `@/lib/...`).
- **`src/app/globals.css`**: `@import "tailwindcss"` y tokens de color del diseño "Dark dev" en `@theme` (`bg-surface`, `text-accent`, `border-border`, etc.). Tailwind 4 no necesita `tailwind.config`.
- **`eslint.config.mjs`**: ignora `.next/`, `out/`, `build/` y `next-env.d.ts`.
- **`.env.local`**: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Después de cambiarlas hay que reiniciar `npm run dev`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en localhost:3000 |
| `npm run build` | Build de producción |
| `npm run start` | Levanta el build de producción |
| `npm run lint` | Corre ESLint |

## Estructura

```
src/
├── app/
│   ├── layout.tsx          layout raíz: fuentes Geist, NavPrincipal y BarraUsuario arriba de cada página
│   ├── page.tsx            "/"          home: título, bajada y links a /entradas y /nueva
│   ├── entradas/page.tsx   "/entradas"  protegida; lista real + formulario (crear/editar) + borrar
│   ├── nueva/page.tsx      "/nueva"     protegida; formulario que inserta en Supabase
│   ├── login/page.tsx      "/login"     signInWithPassword → redirige a /entradas
│   ├── registro/page.tsx   "/registro"  signUp → pantalla "Cuenta creada"
│   ├── perfil/page.tsx     "/perfil"    página de relleno
│   └── test-db/page.tsx    "/test-db"   TEMPORAL: muestra data/error crudos de un select
├── components/
│   ├── NavPrincipal.tsx        "use client", navegación con la sección activa resaltada
│   ├── BarraUsuario.tsx        "use client", email del usuario + "Cerrar sesión", o link a /login
│   ├── FormularioEntrada.tsx   "use client", crea (insert) o edita (update) una entrada
│   ├── ListaEntradas.tsx       recorre las entradas o muestra EstadoVacio; pasa onBorrada/onEditar
│   ├── EntradaCard.tsx         "use client", tarjeta con botones "Editar" y "Borrar"
│   └── EstadoVacio.tsx         mensaje de lista vacía con link a /nueva
└── lib/
    ├── supabase.ts         cliente único de Supabase (no crear otro)
    └── types.ts            type Entrada (= columnas de la tabla) y type DatosEntrada

supabase/
├── schema.sql              tabla entradas + RLS activado
└── seed.sql                3 entradas de prueba (cambiar 'tu@email.com' por el email real)
```

## Rutas

```
                  layout.tsx  (NavPrincipal + BarraUsuario en todas las páginas)
                         │
   ┌──────────┬──────────┼───────────┬───────────┬───────────┐
   ▼          ▼          ▼           ▼           ▼           ▼
  "/"    "/entradas"  "/nueva"   "/perfil"   "/login"   "/registro"
 (home)  (protegida)  (protegida) (relleno)
```

- `NavPrincipal` enlaza a `/`, `/entradas`, `/nueva` y `/perfil`.
- `/login` y `/registro` se enlazan entre sí, y `BarraUsuario` lleva a `/login` cuando no hay sesión.
- **Protección**: `/entradas` y `/nueva` llaman a `supabase.auth.getUser()` al montarse. Mientras verifican no muestran nada, y si no hay usuario hacen `router.replace("/login")`. Es protección de interfaz: lo que protege los datos son las políticas RLS.

## Base de datos (Supabase)

### Tabla `entradas` (`supabase/schema.sql`)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `uuid` | `not null`, referencia a `auth.users(id)` |
| `titulo` | `text` | `not null` |
| `texto` | `text` | `not null` |
| `pendientes` | `jsonb` | nullable, forma todavía no definida |
| `created_at` | `timestamptz` | `default now()` |

RLS está activado. El schema del repo **no incluye políticas**: hay que crearlas en Supabase, siempre filtrando por dueño (nunca `using (true)`):

```sql
create policy "ver propias"      on entradas for select using (auth.uid() = user_id);
create policy "insertar propias" on entradas for insert with check (auth.uid() = user_id);
create policy "editar propias"   on entradas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "borrar propias"   on entradas for delete using (auth.uid() = user_id);
```

> Si falta la política de select, la lista queda vacía sin error. Si faltan las de update o delete, la app muestra "No se guardaron los cambios…" o "No se borró la entrada…", porque las operaciones usan `.select()` para detectar que no cambiaron filas.

### Operaciones por archivo

| Operación | Dónde | Detalle |
|---|---|---|
| `select` | `entradas/page.tsx` | `select("*").order("created_at", { ascending: false })` |
| `insert` | `FormularioEntrada.tsx` | `{ titulo, texto, user_id }` con el `user_id` de `getUser()` |
| `update` | `FormularioEntrada.tsx` | `.update({ titulo, texto }).eq("id", id).select()` |
| `delete` | `EntradaCard.tsx` | con confirmación; `.delete().eq("id", id).select()` |
| auth | `login`, `registro`, `BarraUsuario` | `signInWithPassword`, `signUp`, `getUser`, `onAuthStateChange`, `signOut` |

Todas las consultas revisan `{ data, error }`, tratan el error antes de usar `data` y muestran mensajes en español que dicen qué hacer.

## Flujo de datos

### Entradas (`/entradas`)

```
app/entradas/page.tsx  ("use client")
  estado: entradas, verificando, cargando, error, entradaAEditar
  1. getUser() → sin usuario: /login
  2. cargarEntradas() → select a Supabase
      │
      ├── FormularioEntrada  key = entradaAEditar?.id ?? "nueva"
      │     props: entradaAEditar, onGuardar, onCancelar
      │     sin entradaAEditar → insert   |   con entradaAEditar → update
      │     al guardar: onGuardar → sale del modo edición + cargarEntradas()
      │
      └── cargando → "Cargando entradas..." | error → mensaje | si no:
          ListaEntradas  props: entradas, onBorrada, onEditar
            ¿vacío? → EstadoVacio
            .map() → EntradaCard  props: id, titulo, fecha (de created_at), contenido (= texto)
                       "Editar" → onEditar(entrada) → el formulario se carga y la página sube
                       "Borrar" → confirm → delete → onBorrada → cargarEntradas()
```

La `key` del formulario hace que se reinicie con los datos correctos cada vez que cambia la entrada a editar, sin un `useEffect` que copie props a estado.

### Nueva entrada (`/nueva`)

```
app/nueva/page.tsx  ("use client")  → getUser() → sin usuario: /login
      │  props: onGuardar = console.log
      ▼
FormularioEntrada → insert en Supabase → onGuardar → limpia los campos
```

### Sesión

```
/registro → signUp → "Cuenta creada" (puede requerir confirmar el email)
/login    → signInWithPassword → /entradas
BarraUsuario → getUser() al montar + onAuthStateChange (se actualiza al entrar o salir)
             → "Cerrar sesión" → signOut → /login
```

## Tipos (`src/lib/types.ts`)

```ts
export type Entrada = {
  id: string;
  user_id: string;
  titulo: string;
  texto: string;
  pendientes: unknown;       // jsonb, puede ser null
  created_at: string | null;
};

// Lo que carga el usuario en el formulario; el resto lo completa la base
export type DatosEntrada = Pick<Entrada, "titulo" | "texto">;
```

`EntradaCard` recibe `texto` como la prop `contenido` y la fecha ya formateada (AAAA-MM-DD a partir de `created_at`); esa traducción se hace en `ListaEntradas`.

## Estado de funcionalidades

| Funcionalidad | Estado |
|---|---|
| Registro e inicio de sesión | ✅ Hecho |
| Barra de usuario y cierre de sesión | ✅ Hecho |
| Rutas protegidas (`/entradas`, `/nueva`) | ✅ Hecho (del lado del cliente) |
| Listar entradas desde Supabase | ✅ Hecho |
| Crear entrada (insert con `user_id`) | ✅ Hecho |
| Editar entrada (update) | ✅ Hecho |
| Borrar entrada (delete con confirmación) | ✅ Hecho |
| Políticas RLS | ⚠️ No están en `schema.sql`; hay que confirmar que existan en Supabase |
| Perfil | ⏳ Página de relleno |
| Pendientes (`pendientes` jsonb) | ⏳ Columna creada, sin uso en la app |

> Todo el código pasa `tsc --noEmit` y `eslint`. El flujo completo contra la base real (login → crear → editar → borrar) todavía no se probó de punta a punta.

## Pendientes y observaciones

- **Archivos que pasan las 100 líneas**:
  - `FormularioEntrada.tsx` (159): acordado dividirlo, por ejemplo sacando el insert y el update a `src/lib`.
  - `entradas/page.tsx` (106) y `registro/page.tsx` (102).
- **Borrar `/test-db`**: es una pantalla temporal de diagnóstico.
- **Consulta duplicada a futuro**: si otra pantalla necesita listar entradas, conviene mover el select a una función en `src/lib`.
- **Parpadeo al refrescar**: después de guardar o borrar, la lista muestra "Cargando entradas..." un instante.
- **Edición y texto sin guardar**: si estás escribiendo una entrada nueva y tocás "Editar", lo escrito se pierde.
- **Home y `/perfil` no están protegidos**. `NavPrincipal` no tiene links a `/login` ni a `/registro` (se llega desde `BarraUsuario`).
- **`/perfil` usa estilos viejos** (`text-3xl`, `text-zinc-600`) en lugar de los tokens del diseño.
- **Log desactualizado**: el `console.error` del `catch` de `FormularioEntrada` todavía dice "Falló guardarEntrada".
- **Restos del template**: `layout.tsx` tiene la descripción "Generated by create next app".
- **Versión de Node**: si la terminal usa Node 18, `next dev` no arranca. Usar Node 20.9 o superior (por ejemplo `nvm use 22`).
