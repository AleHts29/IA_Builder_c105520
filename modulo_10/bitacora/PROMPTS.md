# PROMPTS.md — Guía de prompting para tu proyecto

> Guía de referencia del AI Builders Program. Tenela abierta al lado del
> editor mientras trabajás. Las plantillas están para copiar y pegar:
> reemplazá lo que está entre `[corchetes]` por lo tuyo.

---

## 1. Las cuatro partes de un buen pedido

Un prompt que funciona tiene estas cuatro cosas. Si te sale mal una respuesta,
casi siempre falta una:

1. **El archivo**, señalado con `@`. Sin esto el modelo no busca: adivina.
2. **Las piezas**, descritas una por una. Qué campos, qué botones, qué datos.
3. **El comportamiento de los bordes**. Qué pasa si falta un dato, qué pasa
   mientras carga, qué pasa si falla.
4. **El corte de alcance**, explícito. "Por ahora sólo X", "no instales nada",
   "no toques otros archivos".

**Mal pedido:**

```
Hacé que se puedan cargar notas.
```

**Buen pedido:**

```
En @FormularioNota.tsx quiero un formulario para cargar una nota.

Necesita:
- Un select para elegir el cliente, que recibe la lista por props.
- Un textarea para el texto.
- Un botón "Guardar", deshabilitado si falta el cliente o el texto,
  y que muestre "Guardando..." mientras procesa.

Por ahora, al enviar sólo mostrá los datos en la consola: el guardado real
lo hacemos más adelante. No agregues librerías.
```

Sin esa última línea, la IA te improvisa una base de datos que no pediste.

---

## 2. La regla que ordena todo: pedí de a una pieza

El error más común del track no es escribir mal un prompt: es **pedir
demasiado en uno solo**.

| Pedido | Resultado |
|---|---|
| "Hacé el sistema de notas" | Toca ocho archivos, no entendés ninguno |
| "Agregá el campo título al formulario" | Un diff de diez líneas que podés revisar |

Una funcionalidad grande son cinco pedidos chicos, cada uno con su prueba y su
commit. **Si el diff no entra en una pantalla, el pedido era demasiado
grande.**

---

## 3. Plantillas para copiar

### Crear algo nuevo

```
@[archivo donde va] @[archivo con el tipo o el contexto]
Creá [nombre del archivo o componente] que [qué hace].

Necesita:
- [pieza 1]
- [pieza 2]

[Qué pasa en el caso borde: si falta un dato, si está vacío, si falla]
No instales librerías. No toques otros archivos.
```

### Modificar algo que existe

```
@[archivo]
[Un solo cambio, descrito en una frase.]
No cambies el diseño ni el comportamiento del resto. Sólo este archivo.
```

### Entender código que no escribiste

```
@[archivo] Explicame este archivo línea por línea, como si fuera mi primer
proyecto. Sin modificar nada.
```

Usalo sin culpa. **No entender lo que estás viendo no es un problema: es el
estado normal.** El problema es aceptar sin entender.

### Rechazar un diff y volver a pedir

```
Rechacé tu cambio porque [tocaba 4 archivos / borraba código que no mencioné /
instalaba una librería].
Volvé a proponerlo modificando únicamente @[archivo], sin [lo que sobró].
```

### Separar un archivo que creció

```
@[archivo] Este archivo pasa las [N] líneas y hace dos cosas.
Separá [qué parte] en [nuevo archivo], sin cambiar el comportamiento
ni los mensajes. Decime qué archivos vas a tocar antes de proponer el cambio.
```

### Pedir el plan antes del código

```
@[archivos] Quiero [funcionalidad].
Antes de escribir código, decime qué archivos vas a tocar y por qué.
No modifiques nada todavía.
```

Úsalo cuando el pedido es grande y no estás seguro del alcance. Te ahorra
rechazar un diff enorme.

---

## 4. El prompt de debugging

Lo que **no** funciona: *"no anda, arreglalo"*. La IA no ve tu pantalla, no ve
tu terminal y no sabe qué esperabas.

**La plantilla de las cuatro partes:**

```
Estoy viendo este error en @[archivo]:

[pegar el error completo, tal cual, incluyendo la primera línea]

Qué esperaba: [lo que tenía que pasar]
Qué pasa en realidad: [lo que pasa]
Lo último que cambié: [el último cambio que hiciste antes de que se rompiera]

Explicame primero por qué pasa, y después arreglalo tocando sólo este archivo.
```

**Por qué pedir la explicación antes de la solución:** aprendés, y si la
explicación no tiene sentido, ya sabés que la solución tampoco.

### Antes de escribir el prompt, tres pasos de 30 segundos

1. **¿Dónde está el error?** Consola del navegador (F12) = interfaz.
   Terminal de `npm run dev` = servidor. Si la pantalla quedó en blanco,
   mirá las dos.
2. **Leé la primera línea, no las cincuenta.** El mensaje y el archivo con
   número de línea están arriba. El resto es rastro interno.
3. **¿Qué fue lo último que funcionó?** Si hace diez minutos andaba, el
   problema está en esos diez minutos. Por eso commiteás seguido.

### Errores sin mensaje

A veces no se rompe nada, simplemente no hace lo que querías. Ahí describí el
comportamiento con precisión:

```
@[archivo] Al [acción], [lo que pasa]. Debería [lo que esperabas].
No hay ningún error en la consola ni en la terminal.
```

---

## 5. Cómo revisar lo que te propone

**Nunca aceptes sin mirar.** Tres preguntas, no hacen falta más:

1. **¿Cuántos archivos toca?** Pediste un botón y toca cuatro → algo se fue
   de tema.
2. **¿Borra código que no mencionaste?** Mirá las líneas en rojo.
3. **¿Instala algo nuevo?** Preguntá por qué antes de aceptar.

**Y la cuarta, después de aceptar: probá.** Lo que pediste *y lo de al lado*.
Los efectos colaterales aparecen en "lo de al lado".

Para verificar con Git, después de aceptar:

```bash
git diff --stat            # cuántos archivos y cuántas líneas
git diff                   # línea por línea: rojo = borrado, verde = agregado
git diff package.json      # ¿instaló una librería?
```

---

## 6. Cuando la IA te está mintiendo

No miente a propósito: **cuando no sabe, completa**. Cuatro señales:

| Señal | Qué hacer |
|---|---|
| Inventa funciones o propiedades que no existen | Buscala en la documentación. Si no está, no existe |
| Propone instalar una librería para algo simple | Preguntá si se puede sin ella |
| Reescribe todo el archivo para un cambio chico | Rechazá y pedí de nuevo, más acotado |
| Cambia de explicación cada vez que insistís | No sabe la causa. Frená |

### La regla de los tres intentos

Si **tres pedidos seguidos** no lo resuelven, dejá de insistir. Volvé atrás
con `git restore .` y probá otro camino, o traelo a la clase.

**Insistir es lo que convierte un bug de diez minutos en una tarde perdida.**

---

## 7. Las reglas del proyecto (se escriben una vez)

Lo que más mejora las respuestas con la menor inversión. Van en `CLAUDE.md`
en la raíz del proyecto (o en `.cursor/rules/` si usás Cursor), y aplican a
**todas** las conversaciones.

```markdown
# [nombre del proyecto]

Proyecto Next.js con App Router, TypeScript y Tailwind. No cambies ese stack.

## Reglas
- Respondé y comentá el código en español.
- No instales librerías nuevas sin avisarme antes y explicarme por qué.
- Hacé cambios chicos y acotados: modificá solo lo que pido.
- No borres código que no mencioné en el pedido.
- No toques .env.local ni .gitignore.
- Si un archivo pasa las 100 líneas, avisame antes de seguir agregándole cosas.
- Todo componente que use estado o eventos lleva "use client" en la primera línea.
- Toda consulta a la base chequea { data, error } y trata el error antes de usar data.
- Ningún update o delete sin .eq(): jamás una operación sin filtro.
- Las llamadas a modelos de IA salen siempre del servidor, nunca del navegador.
- Las API keys de modelos van sin el prefijo NEXT_PUBLIC_.

## Comandos
- `npm run dev` — servidor de desarrollo en localhost:3000
```

**Las reglas se cargan al iniciar la sesión.** Si editás el archivo con la
sesión abierta, salí y volvé a entrar.

---

## 8. El ciclo de trabajo

Todo prompt vive adentro de este loop. No cambia en todo el track:

```
npm run dev  (queda corriendo)
   │
   ▼
pedir UN cambio chico con @archivos
   │
   ▼
revisar el diff: ¿archivos? ¿borrados? ¿instala algo?
   │
   ▼
aceptar → probar (lo pedido + lo de al lado + consola + terminal)
   │
   ├── anda ──────► git add . && git commit -m "qué quedó funcionando"
   │
   └── no anda y llevás 15 min ──► git restore .  → pedir distinto y más chico

al terminar la sesión: git push
```

**Mensajes de commit:** dicen *qué quedó funcionando*.
- ✗ `"cambios"`, `"fix"`, `"update"`
- ✓ `"boton nueva entrada navega a /nueva"`, `"validacion del formulario"`

---

## 9. Prompts por etapa del proyecto

### Componentes y estado

```
@[archivo] @[tipo o datos]
Creá [Componente].tsx: recibe [props] y [qué hace con ellas].
Si [caso vacío], mostrá [qué]. Usá [campo] como key en el .map().
TypeScript, Tailwind, export default. No toques otros archivos.
```

```
@[archivo]
Convertilo en componente cliente ("use client") con estado para [qué cambia].
El botón se deshabilita si [falta algo] y muestra "[texto]" mientras procesa.
El submit lleva e.preventDefault(). Sólo este archivo.
```

### Validación y manejo de errores

```
@[archivo]
Agregá una función validar[Algo]([campos]) que devuelva un mensaje en español
o null: [campo] vacío (usá .trim()), [campo] de más de [N] caracteres.
Los mensajes tienen que decir qué hacer, no sólo qué está mal.
Agregá estado error y mostralo arriba del formulario.
Envolvé el guardado en try/catch/finally: el detalle técnico a console.error,
un mensaje entendible al estado de error, y apagar el estado de carga
en el finally. Sólo este archivo.
```

### Base de datos

```
@[pantalla] @src/lib/supabase.ts @src/lib/types.ts
Reemplazá los datos de ejemplo por una consulta real a Supabase:
select de [tabla] ordenado por created_at descendente.
Manejá los tres estados: cargando, error (mensaje en español) y sin datos.
Chequeá siempre { data, error } y tratá el error antes de usar data.
Sólo este archivo.
```

```
@[componente] @src/lib/supabase.ts
Agregá un botón "Borrar" que elimine la fila con .delete().eq("id", id),
con confirmación previa, y una prop onBorrada para refrescar la lista.
Chequeá { error } y mostralo en español si falla.
```

### IA en el producto

```
Creá src/app/api/[nombre]/route.ts, un route handler con un POST que:
- Lee { [campo] } del body. Si falta o está vacío, responde 400.
- Si supera los [N] caracteres, responde 400 con un mensaje claro en español.
- Llama al modelo usando process.env.[TU_KEY] (sin NEXT_PUBLIC_).
- Las instrucciones van en la configuración del sistema, separadas del dato
  del usuario. Nunca concatenadas en el mismo string.
- Exige salida estructurada declarando el esquema de la respuesta.
- Parsea con try/catch: verifica la forma, filtra lo inválido, y devuelve
  vacío ante cualquier problema en vez de fallar.
- Todo en try/catch: console.error del detalle y 500 con un mensaje genérico.
No toques ningún otro archivo.
```

```
@src/lib/[archivo]
Agregá [funcion](id, dato) que llame por fetch al endpoint y guarde el
resultado en la base con .eq("id", id).
Si algo falla: console.error y terminar. NUNCA propaga el error hacia arriba:
si la IA falla, lo que el usuario guardó tiene que quedar guardado igual.
Sólo este archivo.
```

---

## 10. Los cinco errores de prompting que más cuestan

1. **No señalar el archivo con `@`.** El modelo no dice "no sé": adivina, y
   adivina con confianza.
2. **No cortar el alcance.** Sin "por ahora sólo X", te construye de más.
3. **Aceptar sin leer el diff.** Un cambio que no revisaste es un cambio que
   no entendés, y lo vas a tener que debuggear igual más tarde.
4. **Insistir sobre un pedido que no sale.** Tres intentos y volvés atrás.
5. **Pedir la funcionalidad entera en un prompt.** De a una pieza, siempre.

---

## 11. Chuleta de comandos

```bash
npm run dev                  # levantar el proyecto
                             # (reiniciar SIEMPRE después de tocar .env.local)

git status                   # qué cambió
git diff --stat              # cuántos archivos tocó el último cambio
git diff                     # el cambio línea por línea (salís con q)
git add . && git commit -m "qué quedó funcionando"
git restore .                # volver al último commit: descarta lo no commiteado
git push                     # subir a GitHub

npx tsc --noEmit             # ¿hay errores de tipos?
npm run lint                 # ¿hay errores de lint?

git check-ignore -v .env.local   # ¿mis claves están protegidas?
```

**Si `git check-ignore` no devuelve nada, tus claves se van a subir a GitHub.
Frená y arreglalo antes de hacer push.**
