# Clase 05 — Comandos y prompts, en orden de ejecución

## 1. Crear el proyecto

```bash
# En la carpeta donde guardás tus proyectos
cd ~/proyectos

# Recomendado: con flags, saltea el cuestionario y queda igual para todos
npx create-next-app@latest bitacora --ts --eslint --tailwind --app --src-dir --turbopack --import-alias "@/*"
```

Si lo corren interactivo (`npx create-next-app@latest bitacora`), la primera
pregunta es **"Would you like to use the recommended Next.js defaults?"** —
¡NO aceptar los defaults! (no incluyen `src/`). Elegir **"No, customize
settings"** y responder:

```
✔ Would you like to use TypeScript?        → Yes
✔ Which linter would you like to use?      → ESLint
✔ Would you like to use React Compiler?    → No
✔ Would you like to use Tailwind CSS?      → Yes
✔ Would you like to use src/ directory?    → Yes
✔ Would you like to use App Router?        → Yes
```

```bash
cd bitacora
cursor .        # si falla: abrir Cursor → File → Open Folder → bitacora
```

## 2. Correr la app

```bash
npm run dev
# → http://localhost:3000
# Ctrl+C para frenar. Si dice "port 3000 in use", hay otro dev server corriendo:
# Ctrl+C en la terminal vieja, o aceptar el 3001.
```

## 3. Crear las rutas del mapa de pantallas

Cada pantalla = carpeta con `page.tsx` adentro de `src/app/`:

```bash
mkdir -p src/app/entradas src/app/nueva src/app/perfil
```

Prompt en Cursor (chat lateral) para generar las páginas:

```
@src/app Creá una page.tsx mínima en las carpetas entradas, nueva y perfil.
Cada una con un h1 con el nombre de la pantalla y un párrafo placeholder.
TypeScript, Tailwind, export default. No toques page.tsx ni layout.tsx de la raíz.
```

Verificás: `localhost:3000/entradas`, `/nueva`, `/perfil`.

## 4. El componente: con o sin v0

**Opción A — tenés el export de v0:**

```bash
mkdir -p src/components
# Pegás el archivo exportado de v0, ej: src/components/EntradaCard.tsx
```

Y en el chat:

```
@src/app/page.tsx @src/components/EntradaCard.tsx
Importá EntradaCard en la página de inicio y mostralo con datos de ejemplo
escritos a mano. No modifiques el componente, solo la página.
```

**Opción B — no tenés el componente de v0 (la IA lo crea):**

```
@src/app/page.tsx
Creá el componente EntradaCard en src/components/EntradaCard.tsx: una card
de una entrada de bitácora con props titulo (string), fecha (string) y
contenido (string). TypeScript, Tailwind, export default. Estilo simple:
fondo blanco, borde redondeado, sombra suave, título en negrita.

Después importalo en la página de inicio y mostrá 3 entradas de ejemplo
con datos escritos a mano. No instales nada ni toques otros archivos.
```

> Ojo: si referenciás con `@` un archivo que no existe, la IA (bien) te va a
> avisar en vez de inventarlo. En la opción B solo se referencia `page.tsx`.

Si el componente de v0 tira error al pegarlo:

```
@src/components/EntradaCard.tsx Este componente lo exporté de v0 y tira este
error al compilar: [PEGAR ERROR DE LA TERMINAL]. Arreglalo tocando lo mínimo
posible y explicame en una línea qué era.
```

## 5. Reglas del proyecto (Cursor)

Cursor → Settings → Rules (o crear `.cursor/rules/reglas.mdc` en el proyecto). Contenido:

```
- Proyecto Next.js con App Router, TypeScript y Tailwind. No cambies ese stack.
- Respondé y comentá el código en español.
- No instales librerías nuevas sin avisarme antes y explicarme por qué.
- Hacé cambios chicos y acotados: modificá solo lo que pido, no refactorices de más.
- No borres código que no mencioné en el pedido.
- No toques .env.local ni .gitignore.
```

**Si usás Claude Code (tu caso):** las reglas van en un archivo `CLAUDE.md`
en la raíz del proyecto — se carga solo al inicio de cada sesión. Lo podés
crear a mano con el mismo contenido de arriba, o pedirle a Claude Code que
lo genere con el comando `/init` y después editarlo. Ejemplo:

```markdown
# bitacora

Proyecto Next.js con App Router, TypeScript y Tailwind. No cambies ese stack.

## Reglas
- Respondé y comentá el código en español.
- No instales librerías nuevas sin avisarme antes y explicarme por qué.
- Hacé cambios chicos y acotados: modificá solo lo que pido, no refactorices de más.
- No borres código que no mencioné en el pedido.
- No toques .env.local ni .gitignore.

## Comandos
- `npm run dev` — servidor de desarrollo en localhost:3000
```

> El concepto es idéntico en ambas herramientas (instrucciones permanentes
> que aplican a todas las conversaciones del proyecto); cambia el archivo:
> Cursor → `.cursor/rules/`, Claude Code → `CLAUDE.md`. Buen punto para
> mencionar en la slide 15: no dependen del editor, dependen del hábito.

## 6. Git — setup inicial (una sola vez)

```bash
# create-next-app ya hizo git init y un primer commit. Verificar:
git log --oneline

# Confirmar que .env.local está ignorado (tiene que aparecer en la salida):
cat .gitignore | grep env

# Crear el repo en GitHub (vacío, sin README) y conectarlo:
git remote add origin git@github.com:AleHts29/bitacora.git
git branch -M main
git push -u origin main
```

## 7. El loop de trabajo (lo que repetís toda la clase)

El loop son 7 pasos que se repiten por cada cambio que pedís. Acá van **dos
vueltas completas con ejemplos reales**: una que sale bien y una que sale mal.

### Cómo ver el diff en cada paso

Tenés dos momentos para mirar el diff: **antes de aceptar** (lo que te muestra
la herramienta) y **después de aceptar** (lo que te muestra Git).

**Antes de aceptar — lo que muestra la herramienta:**

- **Claude Code:** antes de aplicar cada edición te muestra el diff en la
  terminal (rojo = borra, verde = agrega) y te pregunta si aplicarla. Ese es
  tu momento de revisar. Si respondés "yes, and don't ask again" o activás el
  auto-accept, deja de preguntarte — para la clase, NO lo hagas: el punto es
  revisar cada cambio.
- **Cursor:** el diff aparece pintado directo en el editor (rojo/verde) con
  botones Accept/Reject por bloque y por archivo.

**Después de aceptar — verificar con Git** (funciona igual en las dos
herramientas, porque compara contra tu último commit):

```bash
# Pregunta 1: ¿cuántos archivos tocó?
git status                 # lista de archivos modificados
git diff --stat            # lo mismo + cuántas líneas por archivo

# Pregunta 2: ¿borró código que no pediste?
git diff                   # línea por línea: rojo = borrado, verde = agregado
                           # (salís con la tecla q)
git diff src/app/page.tsx  # solo un archivo, si el diff completo es largo

# Pregunta 3: ¿instaló algo nuevo?
git diff package.json      # si acá hay líneas verdes, agregó una librería
```

Regla práctica para la clase: **`git diff --stat` primero, siempre.** Una
línea por archivo tocado — es la forma más rápida de contestar la pregunta 1.
Si pediste un botón y salen 4 archivos, ya sabés que algo se fue de tema sin
leer una sola línea de código.

Y el chequeo espejo después de commitear: `git status` tiene que decir
`nothing to commit, working tree clean` — si no lo dice, te quedó algo sin
guardar.

### Vuelta 1 — el cambio sale bien

**Paso 1 — Correr la app** (una sola vez por sesión, queda corriendo):

```bash
npm run dev
# → abrís http://localhost:3000 y lo dejás abierto al lado del editor
```

**Paso 2 — Pedir UN cambio acotado**, señalando archivos con `@`:

```
@src/app/page.tsx @src/components/EntradaCard.tsx
Agregá un botón "Nueva entrada" arriba de la lista de entradas en la página
de inicio, que navegue a /nueva. Usá el componente Link de Next.js.
No toques EntradaCard ni ningún otro archivo.
```

**Paso 3 — Revisar el diff ANTES de aceptar** (en el prompt de Claude Code
o en el editor de Cursor; después de aceptar, verificás con los comandos
de Git de arriba). Tres chequeos concretos:

- *¿Cuántos archivos toca?* → Pediste un botón en la página de inicio;
  el diff debería tocar solo `src/app/page.tsx`. Si además toca
  `layout.tsx` y `globals.css` → pará y preguntá por qué.
- *¿Borra código que no mencionaste?* → Mirá las líneas en rojo. Si borra
  las 3 entradas de ejemplo que ya tenías → alerta, no lo pediste.
- *¿Instala algo?* → Si el diff agrega una librería a `package.json`
  (ej: `react-router-dom` — que además acá está mal, Next.js trae su propio
  router) → rechazá y preguntá.

En este caso el diff toca solo `page.tsx`, agrega un `<Link href="/nueva">`
y no borra nada → **aceptás**.

**Paso 4 — Probar en el navegador.** Lo que pediste Y lo de al lado:

- Lo que pediste: el botón aparece y al clickearlo te lleva a `/nueva`. ✓
- Lo de al lado: las 3 entradas de ejemplo siguen visibles, la consola del
  navegador (F12) no muestra errores nuevos, la terminal tampoco. ✓

**Paso 5 — Funciona → punto de guardado:**

```bash
git add .
git commit -m "boton nueva entrada navega a /nueva"
```

### Vuelta 2 — el cambio sale mal

**Paso 2 de nuevo**, otro pedido:

```
@src/app/nueva/page.tsx
Agregá un formulario con campos título y texto y un botón Guardar.
```

**Paso 3:** el diff se ve razonable, aceptás.

**Paso 4:** probás… y la página `/nueva` tira error en el navegador.
Intentás arreglarlo con un par de prompts más:

```
@src/app/nueva/page.tsx La página tira este error: [PEGAR ERROR].
Arreglalo con el cambio más chico posible.
```

**Paso 6 — Pasaron 15 minutos y sigue rota.** No insistís más — volvés
al último commit (el del botón, que funcionaba):

```bash
git restore .
```

Con eso el formulario roto desaparece y quedás exactamente donde estabas
al final de la vuelta 1. **No perdiste nada que funcionara** — perdiste
15 minutos, no la tarde. Ahora pedís lo mismo pero distinto, más chico:

```
@src/app/nueva/page.tsx
Agregá SOLO un campo de texto para el título y un botón Guardar que por
ahora no haga nada. Sin estado, sin lógica. Un paso a la vez.
```

Diff chico → aceptás → anda → probás → commit:

```bash
git add .
git commit -m "campo titulo y boton guardar visibles en /nueva"
```

### Paso 7 — Al cerrar la sesión, subís todo:

```bash
git push
```

### El loop en limpio (para tener a la vista)

```
npm run dev  (queda corriendo)
   │
   ▼
pedir UN cambio chico con @archivos
   │
   ▼
revisar diff: ¿archivos? ¿borrados? ¿instala algo?
   │
   ▼
aceptar → probar (lo pedido + lo de al lado + consola + terminal)
   │
   ├── anda ──────► git add . && git commit -m "qué quedó funcionando"
   │                          │ (volvés a pedir el siguiente cambio)
   │
   └── no anda y llevás 15 min ──► git restore .  → repedir distinto/más chico
   
al terminar la sesión: git push
```

**Mensajes de commit:** dicen *qué quedó funcionando*, no la acción.
- ✗ `"cambios"`, `"fix"`, `"update"`
- ✓ `"boton nueva entrada navega a /nueva"`, `"lista de entradas con 3 cards de ejemplo"`

**Frecuencia:** un commit por cada cosa que funciona. En una clase de 2 horas
son fácilmente 4–6 commits — si al final tenés uno solo, commiteaste poco.

## 8. Prompts modelo para pedir cambios

Cambio puntual (seleccionar el código → Cmd/Ctrl+K):

```
Cambiá este botón para que sea verde y diga "Guardar entrada". Nada más.
```

Cambio conversado (chat lateral, varios archivos):

```
@src/app/nueva/page.tsx @src/components/EntradaCard.tsx
Quiero un formulario en /nueva con campos título y texto, y un botón Guardar.
Por ahora sin guardar datos de verdad: al enviar, mostrá la entrada nueva
debajo del formulario usando EntradaCard. Decime qué archivos vas a tocar
antes de proponer el cambio.
```

Cuando hay un error:

```
@src/app/nueva/page.tsx La terminal muestra este error: [PEGAR ERROR COMPLETO].
Arreglalo con el cambio más chico posible y explicame qué pasaba.
```

Cuando no entendés el código:

```
@src/app/layout.tsx Explicame este archivo línea por línea, como si fuera
mi primer proyecto. Sin modificar nada.
```

Cuando el diff toca de más (rechazar y repedirlo):

```
Rechacé tu cambio porque tocaba 4 archivos y yo pedí algo en uno solo.
Volvé a proponerlo modificando únicamente @src/app/nueva/page.tsx.
```

## 9. Ramas (solo para experimentos riesgosos)

```bash
git checkout -b integracion-ia   # crear y moverse
# ... experimento ...
git checkout main                # si salió mal, volvés y quedó todo como estaba
```

## 10. Checklist de la misión (antes de la clase 6)

```bash
npm run dev                       # → app sin errores en consola
git log --oneline                 # → un commit por funcionalidad
git restore .                     # → probado al menos una vez, a propósito
git push                          # → repo actualizado
```

Y en GitHub, verificar a ojo: **no existe `.env.local` en el repo**, y cada pantalla del núcleo tiene su carpeta con `page.tsx`.

---

## Extra — plantar el error para la demo (bloque 3)

Opción simple y con error claro en terminal: romper un import en `src/app/page.tsx`:

```tsx
import EntradaCard from "@/components/EntradaCrd";   // typo a propósito
```

Flujo de la demo: correr `npm run dev` → copiar el error tal cual → prompt con
contexto (`@src/app/page.tsx` + error pegado) → revisar el diff en voz alta con
las 3 preguntas (¿cuántos archivos? ¿borra algo? ¿instala algo?) → aceptar →
probar en terminal y navegador.
