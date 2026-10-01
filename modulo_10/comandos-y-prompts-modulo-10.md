# Módulo 10 — Paso a paso: comandos, SQL y prompts

Continuación del cheatsheet del módulo 8. Arranca desde el proyecto con IA ya
conectada: route handler en `src/app/api/extraer-pendientes/`, la key de
Gemini en `.env.local` sin `NEXT_PUBLIC_`, `src/lib/entradas.ts` con el
guardado, y la columna `pendientes` llenándose sola.

**Lo que cambia hoy:** hasta ahora tu app le manda al modelo **el dato que
tiene adelante** — la entrada que se está guardando. Hoy le va a poder mandar
**lo que el usuario acumuló durante meses**.

La diferencia en una frase: extraer los pendientes de la nota de hoy es
módulo 8. Poder contestar *"¿qué le prometí a Laura sobre el rediseño en los
últimos tres meses?"* es módulo 10.

---

## 0. Cinco decisiones antes de tocar nada

### 0.1 — ¿RAG o agente? (casi seguro: RAG)

**La regla que decide, y decila tal cual en clase:** si podés dibujar el
diagrama de flujo, **no necesitás un agente**. Programá el flujo y listo.

| Pedido | Qué es | Por qué |
|---|---|---|
| "Extraé los pendientes de esta nota" | Flujo fijo (módulo 8) | Siempre hace lo mismo |
| "¿Qué le prometí a Laura?" | **RAG** | Buscar y responder. Dos pasos, siempre los mismos |
| "Revisá si hay algo vencido con Laura y creá una tarea urgente" | **Agente** | El modelo decide si busca, qué busca, si corresponde crear algo |

**Este documento hace RAG en el núcleo (secciones 1 a 9) y deja el agente
como extensión opcional (secciones 10 a 13).** Es lo que dice la slide 25:
*no todos necesitan un agente, la mayoría resuelve con RAG solo*.

> **Para el aula:** un buen porcentaje va a querer hacer el agente porque es
> lo más vistoso. Es también la vía más rápida a un proyecto que no llega a
> la semana 8. Si alguien no puede explicar en una frase qué decisión toma el
> modelo que su código no podría tomar, no necesita un agente.

### 0.2 — Qué pregunta querés poder responder

Escribila antes de escribir código. Es el paso 2 de la práctica y define todo
lo demás.

En Bitácora: *"¿qué dije sobre [tema] en mis entradas anteriores?"*

Si no sabés qué pregunta querés responder, no sabés si el RAG anda.

### 0.3 — El modelo de embeddings y las dimensiones

⚠️ **El material usa `text-embedding-004` y está vencido.** El modelo actual
es `gemini-embedding-2`, y tiene una diferencia que importa: **sus
dimensiones son configurables** (de 128 a 3072; recomendadas 768, 1536 y
3072), no fijas.

Eso significa que el `vector(768)` del SQL del material **sólo funciona si le
pedís explícitamente 768 dimensiones al generar el embedding**. Si no se lo
pedís, te va a devolver un vector de otro tamaño y el insert va a fallar con
un error de dimensiones.

**Para la clase, 768.** Razones, en orden:
- Coincide con el SQL del material, así que no hay que reescribir nada.
- Ocupa un cuarto de lo que ocupa 3072, y a esta escala la diferencia de
  calidad es imperceptible.
- Los índices de pgvector tienen un tope de 2000 dimensiones: con 3072 no
  podrías indexar cuando crezcas.

> **Verificá el nombre del modelo el día anterior**, igual que en el módulo 8:
> un nombre vencido es un 404 en vivo. La sección 3.4 del cheatsheet del
> módulo 8 lista los modelos que tu key puede usar.

### 0.4 — Un embedding es barato; una llamada a un LLM no

Dato que ordena todas las decisiones de hoy: **generar embeddings consume
muchísimo menos que una llamada normal al modelo**. Podés generarlos para
todo tu contenido sin acercarte a los límites del plan gratuito.

Por eso el patrón es: embeddings para **todo**, llamada al LLM sólo para
**los cinco fragmentos que importan**.

### 0.5 — El filtro por usuario va en el SQL, no en el prompt

Lo más importante de la clase desde el punto de vista de seguridad, y lo
desarrollamos en la sección 4. Adelanto: **el material pasa el `user_id` como
parámetro de la función**, y eso es una puerta abierta si la llamada sale del
navegador. Lo vamos a hacer distinto.

---

## 1. Arrancar la sesión

**Para qué:** confirmar que la base del módulo 8 está firme antes de
construirle encima.

```bash
cd /ruta/a/tu/bitacora
git status                 # working tree clean
npm run dev                # dejalo corriendo
```

Y en otra terminal: `claude`

**Chequeo previo, 30 segundos:** guardá una entrada nueva y confirmá que los
pendientes se siguen llenando solos. Si eso no anda, arreglalo antes de
seguir — hoy vas a tocar el mismo route handler.

---

## 2. Reglas del módulo 10 en `CLAUDE.md`

**Para qué:** que no tengas que repetir en cada prompt el filtro por usuario
ni el tope de vueltas.

```markdown
## Reglas del módulo 10
- Toda búsqueda vectorial filtra por el usuario de la sesión, con auth.uid()
  dentro de la función SQL. Nunca aceptes el user_id como parámetro del cliente.
- El modelo responde ÚNICAMENTE con los fragmentos recuperados. Si no están,
  la respuesta es "no encontré esa información".
- Toda respuesta del RAG muestra sus fuentes en la interfaz.
- Si hay agente: tope de vueltas siempre, y el userId sale de la sesión.
- Ninguna herramienta que escriba corre sin confirmación humana.
- No agregues librerías de RAG ni frameworks de agentes: Supabase y el SDK
  que ya tenemos alcanzan.
```

```bash
git add CLAUDE.md && git commit -m "reglas del modulo 10 en CLAUDE.md"
```

**Cómo probar:** salí de Claude Code y volvé a entrar (las reglas se cargan al
inicio). Preguntale: *"¿qué regla tenés sobre el filtro por usuario en las
búsquedas?"*. Si responde que va con `auth.uid()` dentro del SQL, cargó.

---

## 3. Habilitar pgvector y agregar la columna

**Para qué:** que Postgres sepa guardar y comparar vectores. Sin la extensión,
el tipo `vector` no existe.

SQL Editor de Supabase:

```sql
create extension if not exists vector;

alter table entradas add column embedding vector(768);
```

**El 768 tiene que coincidir exactamente** con lo que le vas a pedir al
modelo en la sección 5. Es el error de dimensiones más común y se ve feo en
vivo.

**Cómo probar que quedó:**

```sql
-- 1. La extensión está instalada
select extname from pg_extension where extname = 'vector';
-- → devuelve una fila

-- 2. La columna existe y es del tipo correcto
select column_name, udt_name
from information_schema.columns
where table_name = 'entradas' and column_name = 'embedding';
-- → embedding | vector
```

Actualizá `supabase/schema.sql` con estas dos líneas y commiteá:

```bash
git add supabase/schema.sql && git commit -m "schema: pgvector y columna embedding"
```

> **Sobre el índice:** con decenas o cientos de entradas, Postgres recorre
> todo y responde en milisegundos. El índice (`hnsw`) se agrega cuando tenés
> miles. Mencionalo y seguí: un índice sobre 20 filas no enseña nada.

---

## 4. La función de búsqueda (y el fix de seguridad)

**Para qué:** esta función es la que compara la pregunta contra todo el
contenido del usuario y devuelve los fragmentos más parecidos. Es el corazón
del RAG.

### 4.1 — El SQL

```sql
create or replace function buscar_entradas(
  query_embedding vector(768),
  cantidad int default 5
)
returns table (id uuid, titulo text, texto text, created_at timestamptz, similitud float)
language sql
stable
security invoker
set search_path = public
as $$
  select
    entradas.id,
    entradas.titulo,
    entradas.texto,
    entradas.created_at,
    1 - (entradas.embedding <=> query_embedding) as similitud
  from entradas
  where entradas.user_id = auth.uid()        -- el dueño sale de la sesión
    and entradas.embedding is not null
  order by entradas.embedding <=> query_embedding
  limit cantidad;
$$;
```

### 4.2 — Las dos cosas para explicar en vivo

**El operador `<=>`** mide la distancia entre dos vectores: cuanto más chica,
más parecido el significado. El `1 - distancia` lo convierte en una
similitud de 0 a 1, que es más fácil de leer.

**El `where user_id = auth.uid()` no es opcional.** Sin esa línea, la
búsqueda recorre las entradas de todos los usuarios de tu app. Es el mismo
cuidado del módulo 7, y acá se olvida más seguido porque la función parece
"sólo una búsqueda".

### 4.3 — Por qué esto NO se hace como en el material

> **Esto es lo mejor que tenés para enseñar hoy, y es un desvío del
> material.** La unidad escribe la función recibiendo `usuario uuid` como
> parámetro y la llama pasándole `user.id` desde el código.
>
> **El problema:** si esa llamada sale del navegador — y en Bitácora sale del
> navegador, porque `/entradas` es un componente cliente — **cualquiera puede
> abrir la consola y pasar el uuid de otro usuario**. La función haría el
> trabajo con total obediencia.
>
> **La solución:** `auth.uid()` adentro de la función. Ese valor lo pone
> Postgres a partir del token de la sesión, y **no se puede falsificar desde
> el cliente**.
>
> Es exactamente la misma lección del módulo 8 (la key va en el servidor) y
> del módulo 7 (el `.eq()` no es opcional), aplicada a un lugar nuevo:
> **los datos de identidad nunca vienen de quien hace el pedido.**

### 4.4 — Cómo probar que el filtro funciona

Todavía no hay embeddings, pero podés verificar que la función existe y que
filtra:

```sql
-- Un vector de ceros: no va a matchear nada útil, pero prueba que corre
select * from buscar_entradas(array_fill(0, array[768])::vector, 5);
```

- Si devuelve **0 filas sin error** → la función está bien creada (todavía no
  hay embeddings, es lo esperado).
- Si devuelve **error de función inexistente** → el `create` no corrió.
- Si devuelve **filas de otro usuario** → algo quedó mal en el `where`.

```bash
# Agregá la función a supabase/schema.sql
git add supabase/schema.sql && git commit -m "schema: funcion buscar_entradas con filtro por auth.uid()"
```

---

## 5. Generar el embedding al guardar

**Para qué:** que cada entrada nueva quede lista para ser encontrada. Sin
esto, el vector store queda vacío para siempre.

Va en el **mismo route handler donde ya extraés los pendientes**: ya recibe
el texto, ya tiene la key, ya está en el servidor.

**Prompt:**

```
@src/app/api/extraer-pendientes/route.ts
Además de extraer los pendientes, generá el embedding del texto en la misma
llamada al endpoint:
- Usá ai.models.embedContent con el modelo gemini-embedding-2.
- Pedí explícitamente 768 dimensiones con outputDimensionality: 768, porque
  la columna de la base es vector(768).
- Devolvé { pendientes, embedding } en la respuesta.
- Si la generación del embedding falla, logueá el error y devolvé embedding
  null: los pendientes tienen que seguir funcionando igual.
Sólo este archivo.
```

**Prompt (guardarlo):**

```
@src/lib/entradas.ts
En extraerYGuardarPendientes, guardá también el embedding que ahora devuelve
el endpoint: un solo update con { pendientes, embedding }.
Si el embedding viene null, guardá sólo los pendientes.
Sólo este archivo.
```

> **Por qué en un solo update y no dos:** es la misma fila. Dos updates son
> dos viajes a la base para escribir dos columnas de un mismo registro.

**Cómo probar:**

```
1. Guardá una entrada nueva desde /entradas.
2. Esperá a que aparezcan los pendientes.
3. En el SQL Editor:
```

```sql
select titulo,
       pendientes is not null as tiene_pendientes,
       embedding is not null  as tiene_embedding
from entradas
order by created_at desc
limit 3;
```

| Lo que ves | Qué significa |
|---|---|
| `tiene_embedding = true` en la última | ✅ Anda |
| `false`, y en la terminal hay un error de dimensiones | El `outputDimensionality: 768` no se aplicó |
| `false`, y el error dice model not found | Nombre de modelo vencido (sección 0.3) |

```bash
git add . && git commit -m "genera y guarda el embedding al crear una entrada"
```

---

## 6. Completar las entradas viejas (backfill)

**Para qué:** todas las entradas que cargaste en los módulos 7 y 8 no tienen
embedding, así que **son invisibles para la búsqueda**. Si no hacés esto, el
RAG va a responder "no encontré nada" sobre contenido que sí existe.

**Cuántas te faltan:**

```sql
select count(*) filter (where embedding is null) as sin_embedding,
       count(*) filter (where embedding is not null) as con_embedding
from entradas;
```

**Prompt:**

```
@src/app/perfil/page.tsx @src/lib/entradas.ts @src/lib/supabase.ts
/perfil es una página de relleno. Convertila temporalmente en una pantalla de
mantenimiento con un botón "Generar embeddings faltantes" que:
- Traiga las entradas del usuario donde embedding is null.
- Las recorra DE A UNA, en serie (nunca en paralelo), llamando al endpoint
  de extraer-pendientes y guardando el embedding.
- Muestre el progreso: "Procesando 3 de 12...".
- Si una falla, la saltee y siga con la siguiente, contando los errores.
- Al terminar muestre cuántas procesó y cuántas fallaron.
Componente cliente. Sólo este archivo.
```

> **El "de a una, en serie" es la parte importante.** Mandar veinte llamadas
> en paralelo es el error #1 de la slide 15 del módulo 8 — llamar al modelo
> dentro de un bucle sin control — y con el cupo gratuito te comés el límite
> del día en diez segundos. Señalalo cuando revisen el diff: si ves un
> `Promise.all` ahí, está mal.

**Cómo probar:** corré el botón y volvé a la consulta de arriba.
`sin_embedding` tiene que quedar en 0.

```bash
git add . && git commit -m "pantalla temporal de backfill de embeddings"
```

---

## 7. El endpoint de consulta

**Para qué:** es el que recibe la pregunta, busca los fragmentos y arma la
respuesta. Es el RAG completo, de punta a punta.

**Prompt:**

```
@src/lib/supabase.ts @src/app/api/extraer-pendientes/route.ts
Creá src/app/api/preguntar/route.ts, un route handler con un POST que:

1. Lee { pregunta } del body. Si falta o está vacía, 400. Si supera los 500
   caracteres, 400 con mensaje claro en español.
2. Lee el access token del header Authorization y crea un cliente de Supabase
   con ese token, para que auth.uid() funcione dentro de la función SQL.
   Si no hay token válido, responde 401.
3. Genera el embedding de la pregunta con gemini-embedding-2 y
   outputDimensionality: 768 (el mismo modelo y dimensiones del contenido).
4. Llama a la función buscar_entradas por rpc con ese embedding y cantidad 5.
5. Si no vuelve ninguna entrada, responde { respuesta: "No encontré
   información sobre eso en tus entradas.", fuentes: [] } SIN llamar al modelo.
6. Si vuelven entradas, arma el contexto numerando cada una con su fecha y
   título, y llama al modelo con systemInstruction que diga:
   - Respondé usando ÚNICAMENTE las entradas que te paso.
   - Si la respuesta no está en ellas, decí "No encontré esa información en
     tus entradas". No completes con suposiciones.
   - Citá de qué entrada sacaste cada dato, con su número entre corchetes.
   - Sé breve y concreto.
7. Devuelve { respuesta, fuentes } donde fuentes es la lista de entradas
   usadas con id, titulo, fecha y similitud.
8. Loguea usageMetadata con el prefijo [tokens].
Todo en try/catch: console.error del detalle y 500 con mensaje genérico.
No toques ningún otro archivo.
```

### Las dos instrucciones que son toda la unidad

**"Usá únicamente las entradas que te paso"** y **"si no está, decí que no lo
encontraste"**. Sin ellas el modelo completa con lo que le parece razonable, y
**una respuesta inventada sobre lo que le prometiste a un cliente es peor que
no tener la funcionalidad**.

Decilo así en clase: el resto del endpoint es plomería. Esas dos líneas son el
producto.

### El paso 5 también importa

Si la búsqueda no trae nada, **no se llama al modelo**. Es más rápido, más
barato, y no hay forma de que invente. El mejor manejo de una alucinación es
no darle la oportunidad.

**Cómo probar, sin interfaz:**

```bash
# Necesitás un access token. Sacalo desde la consola del navegador,
# con sesión iniciada en la app:
#   (await supabase.auth.getSession()).data.session.access_token

TOKEN="pegá-el-token-acá"

curl -s -X POST http://localhost:3000/api/preguntar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"pregunta":"¿qué dije sobre la propuesta?"}' | jq
```

| Lo que ves | Qué significa |
|---|---|
| `respuesta` con datos de tus entradas + `fuentes` con 1-5 items | ✅ El RAG completo funciona |
| `401` | El token está vencido o mal copiado |
| `"No encontré información..."` con `fuentes: []` | La búsqueda no trajo nada: revisá la sección 6 |
| Error de dimensiones | La pregunta se embebió con otro tamaño que el contenido |

```bash
git add . && git commit -m "endpoint de consulta RAG con fuentes"
```

---

## 8. La interfaz de preguntas

**Para qué:** que el RAG sea usable. Y sobre todo, **que las fuentes se vean**:
es criterio de evaluación de la misión.

**Prompt:**

```
@src/app/entradas/page.tsx @src/lib/supabase.ts
Creá src/components/Preguntar.tsx, componente cliente:
- Un input para la pregunta y un botón "Preguntar".
- El botón se deshabilita si el input está vacío o mientras procesa, y
  muestra "Buscando en tus entradas..." mientras tanto.
- Llama a /api/preguntar mandando el access token de la sesión en el header
  Authorization.
- Muestra la respuesta, y DEBAJO las fuentes: título y fecha de cada entrada
  usada, numeradas igual que en la respuesta.
- try/catch con mensaje de error en español. Un fallo acá no rompe la lista
  de entradas.
Agregalo arriba de la lista en /entradas. Sólo estos dos archivos.
```

> **"Buscando en tus entradas..." es mejor que "Cargando"**, por lo mismo que
> el módulo 8: explica por qué tarda. Y acá el usuario **sí espera**, a
> diferencia de la extracción de pendientes — está mirando la pantalla
> esperando su respuesta. Es una decisión de producto distinta, y vale
> señalarla.

**Las fuentes cumplen dos funciones** y conviene decir las dos: el usuario
puede verificar, y **si la respuesta está mal, se da cuenta enseguida**. Un
RAG sin fuentes visibles es un generador de afirmaciones plausibles.

**Cómo probar:** preguntá algo que sepas que está en tus entradas, y después
algo que sepas que no está. El segundo caso es el que importa: tiene que decir
que no lo encontró.

```bash
git add . && git commit -m "interfaz de preguntas con fuentes visibles"
```

---

## 9. Las diez preguntas de prueba

**Para qué:** sin esto **no sabés si un cambio mejoró o empeoró el sistema**.
Es lo que separa ajustar de adivinar.

Creá `PREGUNTAS-DE-PRUEBA.md` en la raíz del proyecto:

```markdown
# Preguntas de prueba del RAG

| # | Pregunta | Respuesta esperada | Resultado |
|---|---|---|---|
| 1 | [una que está claramente en una entrada] | [el dato] | |
| 2 | [una que cruza dos entradas] | [el dato] | |
| 3 | [una con palabras distintas a las de la entrada] | [el dato] | |
| 4 | [una sobre algo que NO está] | "No encontré esa información" | |
| 5 | [una ambigua] | Algo razonable, o que no encontró | |
| 6 | [una muy específica: una fecha, un nombre] | [el dato] | |
| 7 | [una muy general: "¿de qué hablé este mes?"] | Un resumen con fuentes | |
| 8 | [una con un error de tipeo a propósito] | Igual que la 1 | |
| 9 | [una vacía o de una palabra] | Manejo del caso borde | |
| 10 | [una que pida algo que el sistema no hace] | Que no invente la capacidad | |
```

**La número 3 es la que demuestra el valor de los embeddings.** Si tu entrada
dice *"el cliente pidió cambiar los colores"* y preguntás *"¿hay que rehacer
la paleta?"*, no comparten ni una palabra — y la búsqueda por significado lo
encuentra igual. Una búsqueda por palabra clave no encontraría nada.

**Corrélas y anotá el resultado.** Cada vez que cambies el prompt, el
chunking o la cantidad de fragmentos, volvé a correrlas.

### Diagnóstico cuando una sale mal, EN ORDEN

Es el Coder Tip de la slide 9, y es el contenido más útil de la unidad:

| Paso | Pregunta | Si la respuesta es "no" |
|---|---|---|
| 1 | ¿Los fragmentos recuperados eran los correctos? | El problema es el **chunking** o la **cantidad**. Mirá `fuentes` en la respuesta cruda |
| 2 | ¿Eran los correctos pero respondió mal? | El problema es el **prompt** |
| 3 | ¿La información no existía? | Entonces la respuesta correcta era "no encontré eso". Si inventó, **reforzá esa regla** |

**No se puede saltear el orden.** Si tocás el prompt cuando el problema era la
búsqueda, vas a estar una hora sin entender por qué no mejora.

```bash
git add . && git commit -m "diez preguntas de prueba del RAG"
git push
```

---

# Extensión opcional: el agente (secciones 10 a 13)

> **Antes de seguir, el filtro:** ¿podés describir en una frase una decisión
> que tome el modelo y que tu código no podría tomar solo? Si no, **saltate
> esta parte**. Tu misión está cumplida con el RAG.

---

## 10. Persona, Tarea y Contexto

**Para qué:** un agente mal definido es un agente que hace cualquier cosa.
Esto se escribe **antes** del código, en un archivo de texto.

Creá `src/lib/agente-instrucciones.ts`:

```ts
export const INSTRUCCIONES = `
PERSONA
Sos el asistente de Bitácora. Ayudás a una persona a gestionar sus entradas
y los compromisos que quedaron en ellas.
No opinás sobre decisiones personales ni redactás mensajes para terceros.

TAREA
Podés: buscar en las entradas del usuario, listar los pendientes abiertos,
y crear una entrada nueva cuando el usuario lo pide de forma clara.
No podés borrar ni modificar nada existente.

CONTEXTO
Trabajás sólo con las entradas del usuario conectado.
La fecha de hoy es ${new Date().toISOString().slice(0, 10)}.
`;
```

> **La fecha parece un detalle y no lo es:** sin ella, el modelo no puede
> evaluar si algo está vencido. Es la causa más común de un agente que da
> respuestas raras sobre plazos.

---

## 11. Las herramientas y el ciclo

**Para qué:** una herramienta es una función de tu código que el modelo puede
**pedir** que se ejecute. Vos las declarás, el modelo decide cuándo usarlas,
**tu código las ejecuta**. El modelo nunca toca tu base de datos: sólo pide.

**Prompt:**

```
@src/lib/agente-instrucciones.ts @src/lib/supabase.ts
Creá src/app/api/agente/route.ts con un POST que implemente un ciclo de
tool calling:

Herramientas declaradas (dos, no más):
- buscar_entradas: busca por significado en las entradas del usuario.
  Descripción: "Busca en las entradas del usuario por significado. Usar
  cuando pregunten qué se habló, qué se anotó o qué se acordó sobre un tema."
  Parámetros: consulta (string, qué buscar en lenguaje natural).
- crear_entrada: crea una entrada nueva.
  Descripción: "Crea una entrada nueva. Usar SÓLO cuando el usuario lo pide
  explícitamente, nunca por iniciativa propia."
  Parámetros: titulo (string), texto (string).

El ciclo:
- Un for con tope de 5 vueltas. El tope no es negociable.
- En cada vuelta llama al modelo con el historial y las herramientas.
- Si el modelo NO pide herramientas, devuelve su respuesta y termina.
- Si pide una, la ejecuta con ejecutarHerramienta(nombre, args, userId) y
  agrega el pedido y el resultado al historial.
- Si se agotan las 5 vueltas, devuelve un mensaje diciendo que no pudo
  resolverlo, nunca un error crudo.

ejecutarHerramienta recibe el userId COMO PARÁMETRO desde la sesión, nunca
desde los argumentos del modelo. Un switch por nombre, y default que devuelve
{ error: "Herramienta desconocida" }.

Loguea cada vuelta: qué herramienta pidió, con qué argumentos y los tokens.
```

### Los tres puntos para leer en voz alta cuando lo revisen

**1. La descripción es el prompt de la herramienta.** El modelo decide cuándo
usarla leyendo eso y nada más. *"Busca notas"* es una descripción mala; la de
arriba dice **qué hace y en qué situación usarla**. La mitad de los problemas
de un agente se arreglan mejorando descripciones.

**2. El tope de 5 vueltas no es estilo.** Sin él, un modelo confundido puede
pedir herramientas indefinidamente, y **cada vuelta consume tu cupo**. Es la
protección más importante de la unidad.

**3. El `userId` nunca viene del modelo.** Sale de la sesión, siempre. Si
dejás que el modelo elija sobre qué usuario opera, cualquiera puede pedirle
que lea los datos de otro. **Esto no se resuelve con instrucciones en el
prompt: se resuelve en el código.** Es la misma lección de la sección 4.

**Cómo probar el tope:** cambialo temporalmente a 1 y hacé una pregunta que
requiera buscar. Tiene que salir con el mensaje de "no pude resolverlo", no
con un error. Después volvelo a 5.

```bash
git add . && git commit -m "agente con dos herramientas y tope de vueltas"
```

---

## 12. Guardrails en tres capas

**Para qué:** los límites que el agente no puede cruzar. **Van las tres, no
una.**

| Capa | Qué es | Qué tan fuerte |
|---|---|---|
| En el prompt | "No hagas X" | **La más débil.** Se puede sortear escribiendo instrucciones en el propio texto |
| En las herramientas | Si no existe una herramienta para borrar, el agente no puede borrar | **La más efectiva y la más simple** |
| En el código | Verificaciones antes de ejecutar: que el dato sea del usuario, que el texto no esté vacío, que no cree veinte de una | La que atrapa lo que pasó las otras dos |

> **La capa de herramientas es la que más rinde y la que más se ignora.** No
> le des herramientas destructivas y no vas a necesitar rezar para que no las
> use. Por eso el agente de la sección 11 no tiene `borrar_entrada`.

### Human-in-the-loop

**Regla simple: leer no necesita confirmación, escribir sí.**

Buscar, listar y consultar corren solos. Crear, modificar, borrar o mandar
algo hacia afuera **se confirman**.

**Prompt:**

```
@src/app/api/agente/route.ts @src/components/[tu componente del agente]
Cuando el modelo pida crear_entrada, NO la ejecutes: devolvé al cliente
{ confirmacion: { herramienta, argumentos, mensaje } } con un mensaje en
español que describa exactamente qué va a crear.
La interfaz muestra ese mensaje con botones "Sí, crear" y "No".
Sólo si el usuario confirma, el cliente vuelve a llamar al endpoint con
{ confirmado: true } y ahí sí se ejecuta.
buscar_entradas sigue corriendo sin confirmación.
```

Es más lento, y **es lo que hace que un agente sea usable por alguien que no
seas vos**.

```bash
git add . && git commit -m "guardrails y confirmacion humana en acciones de escritura"
```

---

## 13. El registro de consultas

**Para qué:** un agente es una caja más difícil de ver que el resto de tu app.
Cuando algo salga raro — y va a salir — **ese registro es la única forma de
entender qué pasó**.

```sql
create table agente_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  pregunta text not null,
  herramientas jsonb,
  vueltas int,
  tokens int,
  created_at timestamptz default now()
);

alter table agente_log enable row level security;

create policy "ver propios logs" on agente_log for select
  using (auth.uid() = user_id);
create policy "crear propios logs" on agente_log for insert
  with check (auth.uid() = user_id);
```

**Prompt:**

```
@src/app/api/agente/route.ts
Al terminar cada consulta, insertá una fila en agente_log con: la pregunta,
un arreglo de las herramientas que pidió con sus argumentos, cuántas vueltas
dio y el total de tokens.
Si el insert del log falla, logueá el error y seguí: el log nunca puede
romper la respuesta al usuario.
```

> **En el Demo Day, poder mostrar ese log dice más sobre tu criterio técnico
> que la demo misma.** Cualquiera muestra un agente que funciona; mostrar que
> sabés qué hizo y cuánto costó es otra cosa. Decíselo con esas palabras.

```bash
git add . && git commit -m "registro de consultas del agente"
git push
```

---

## 14. Práctica en vivo — los 5 pasos

### Paso 1 — Arquitecturas forenses

**Objetivo:** diagnosticar un RAG que falla, antes de armar el propio.

**El escenario para presentar:** un chatbot de RRHH con 10.000 PDFs de
políticas internas. Responde, pero mal: mezcla políticas de países distintos,
cita cosas que no están, y a veces da información de hace dos años.

**Pistas del diagrama que les mostrás:**
- Cada PDF se embebió **entero**, en un solo vector.
- Los fragmentos se guardan con el texto y nada más: **sin fecha, sin país,
  sin versión del documento**.
- Los embeddings se generaron **una vez, al cargar el sistema**. Los
  documentos se actualizaron después.

**Los tres errores, y el que es fatal:**

| Error | Por qué duele |
|---|---|
| **Chunking**: un PDF entero en un vector | El embedding mezcla todos los temas del documento y no matchea nada específico |
| **Metadatos**: no se guardó ni fecha ni país | No se puede filtrar ni citar, y por eso mezcla países |
| **Embeddings desactualizados**: nunca se regeneraron | **Este es el fatal.** Los otros dan respuestas imprecisas; este da respuestas **seguras y falsas** sobre políticas que ya cambiaron |

**La conclusión que tienen que sacar, y que es la de toda la unidad:** una
respuesta imprecisa se nota. Una respuesta segura y desactualizada, no.

**Las tres mejores prácticas que salen de acá:** chunking por unidad de
significado, metadatos guardados junto al vector, y validación de que los
embeddings estén al día.

> **Conectalo con el proyecto de ellos:** la sección 6 de este documento
> (backfill) existe justamente por el tercer error. Y si alguien edita una
> entrada, **el embedding viejo queda apuntando al texto anterior**. Eso es
> deuda que se paga en el módulo 11. Dejalo planteado.

### Paso 2 — Tu pregunta y tu vector store

Secciones 0.2 a 6 de este documento, aplicadas a su proyecto.

```
[ ] Escribir la pregunta que querés poder responder
[ ] create extension vector + columna con las dimensiones correctas
[ ] La función de búsqueda CON filtro por usuario
[ ] Embeddings al guardar
[ ] Backfill de los registros viejos
```

**Qué mirar mientras recorrés:** funciones sin el `where user_id`, y
dimensiones que no coinciden entre el `vector(N)` y el `outputDimensionality`.
Son el 80% de lo que se traba.

### Paso 3 — Laboratorio de herramientas

**Objetivo:** escribir descripciones que el agente no malinterprete.

**El caso:** un agente de una app de suscripciones con dos herramientas —
**cancelar_suscripcion** y **consultar_saldo**.

**Que escriban la descripción de cada una.** Después probalas contra estos
tres pedidos ambiguos:

| Pedido del usuario | Qué debería pasar |
|---|---|
| "quiero dar de baja" | Confirmar antes de cancelar. Es destructiva |
| "cuánto estoy pagando" | Consultar saldo. **No** cancelar |
| "ya no quiero pagar más esto" | **El difícil.** Es ambiguo: ¿quiere cancelar o quejarse del precio? Debería preguntar |

**La descripción mala:** *"Cancela la suscripción"*.
**La buena:** dice **qué hace, en qué situación usarla, y en cuál no**. Por
ejemplo: *"Cancela la suscripción activa del usuario. Usar SÓLO cuando el
usuario pide explícitamente cancelar o dar de baja. NO usar si sólo pregunta
por el precio, se queja del costo o pide información de su plan."*

**El cierre del paso:** la mitad de los problemas de un agente se arreglan
mejorando descripciones, no cambiando el modelo.

### Paso 4 — Armá el endpoint con fuentes

Secciones 7 a 9. El resultado esperado es el RAG respondiendo con fuentes
verificables y las diez preguntas corridas.

### Paso 5 — Guardrails y confirmación

Secciones 12 y 13, **sólo para quienes hicieron el agente**. Los demás usan
este tiempo para las diez preguntas.

**Cerrá preguntando:** *"¿a quién le contestó algo que no estaba en sus
datos?"*. Los que levanten la mano tienen que reforzar la instrucción del
system prompt — y es el criterio de evaluación de la misión.

---

## 15. Errores para plantar (#FindTheBug)

```bash
# A) Sacar el "where user_id = auth.uid()" de la función de búsqueda
#    → la búsqueda devuelve entradas de TODOS los usuarios.
#    Demostralo con dos cuentas, como en el módulo 7. Es el más grave del día.

# B) Cambiar outputDimensionality a 1536 dejando la columna en vector(768)
#    → "expected 768 dimensions, not 1536". El error de dimensiones clásico.

# C) Sacar del system prompt la línea de "usá únicamente estas entradas"
#    → preguntá algo que NO esté en tus datos y mirá cómo inventa una
#    respuesta perfectamente plausible. Es la mejor demo de la clase.

# D) Editar una entrada sin regenerar su embedding
#    → la búsqueda la sigue encontrando por el texto VIEJO.
#    Es exactamente el error fatal del paso 1 de la práctica, en su proyecto.

# E) En el agente: sacar el tope de vueltas
#    → hacé una pregunta confusa y miralo pedir herramientas sin parar.
#    Cortalo a mano antes de que se coma el cupo.
```

**Prompt de debugging con un caso de hoy:**

```
Estoy viendo este problema en @src/app/api/preguntar/route.ts:

[pegar el error, o "no hay error" si no aparece ninguno]

Qué esperaba: que al preguntar "¿qué dije sobre la propuesta?" traiga la
entrada del 15 de septiembre, que habla de eso.
Qué pasa en realidad: responde "No encontré esa información en tus entradas".
Lo último que cambié: generé los embeddings de las entradas viejas.

Explicame primero por qué pasa, y después arreglalo tocando sólo este archivo.
```

> **Ojo con este caso:** la respuesta correcta probablemente **no** esté en
> ese archivo. Si `fuentes` viene vacío, el problema está en la búsqueda o en
> los embeddings, no en el endpoint. Es el mismo ejemplo del módulo 7 con RLS:
> **la IA puede darte una solución plausible en el lugar equivocado.**

---

## 16. Checklist de cierre (= criterios de la misión)

```bash
npm run dev
npx tsc --noEmit
npm run lint
git log --oneline       # ~10 commits del día
git push
```

```
[ ] La búsqueda filtra SIEMPRE por el usuario de la sesión, con auth.uid()
    dentro del SQL (no como parámetro del cliente)
[ ] Probado con dos cuentas: nadie ve contenido ajeno
[ ] Todas las entradas tienen embedding (sin_embedding = 0)
[ ] Las dimensiones del vector coinciden con las del modelo
[ ] El modelo dice "no encontré eso" cuando falta información, no inventa
[ ] Las fuentes se muestran en la interfaz, con fecha
[ ] Las diez preguntas corridas, con su resultado anotado
[ ] Si hay agente: tope de vueltas, userId desde la sesión, guardrails en las
    tres capas, y ninguna acción que escribe corre sin confirmación
[ ] Si hay agente: cada consulta queda registrada con herramientas y tokens
[ ] Borraste (o dejaste anotada) la pantalla temporal de backfill en /perfil
```

**Mapa rápido de dónde se arregla cada cosa:**

| Síntoma | Dónde mirar |
|---|---|
| `expected N dimensions` | El `vector(N)` y el `outputDimensionality` no coinciden (secciones 3 y 5) |
| La búsqueda no encuentra nada | ¿Hay embeddings? `select count(*) where embedding is null` (sección 6) |
| Trae entradas que no tienen nada que ver | La pregunta se embebió con otro modelo que el contenido |
| Responde cosas que no están en las entradas | Falta o está débil la instrucción del system prompt (sección 7) |
| Devuelve entradas de otro usuario | Falta `auth.uid()` en la función SQL (sección 4) — **frená todo** |
| 429 al usar el agente | Cada vuelta es una llamada. Bajá el tope o simplificá las herramientas |
| El agente no usa la herramienta cuando debería | La descripción no dice en qué situación usarla (sección 11) |
| Encuentra la entrada por su texto viejo | Se editó sin regenerar el embedding |

---

## Estado del proyecto al terminar el día

```
src/
├── app/
│   ├── api/
│   │   ├── extraer-pendientes/route.ts   (modificado: también genera el embedding)
│   │   ├── preguntar/route.ts            ← nuevo: el RAG completo
│   │   └── agente/route.ts               ← nuevo, OPCIONAL
│   ├── entradas/page.tsx                 (modificado: incluye Preguntar)
│   └── perfil/page.tsx                   (modificado: backfill temporal)
├── components/
│   ├── Preguntar.tsx                     ← nuevo: pregunta + respuesta + fuentes
│   └── ...                               (el resto sin cambios)
└── lib/
    ├── entradas.ts                       (modificado: guarda el embedding)
    ├── agente-instrucciones.ts           ← nuevo, OPCIONAL
    └── ...

supabase/
└── schema.sql                            (modificado: extension, columna, función)

PREGUNTAS-DE-PRUEBA.md                    ← nuevo
```

**En Supabase:** extensión `vector` habilitada, columna `embedding vector(768)`
en `entradas`, función `buscar_entradas` con `auth.uid()`, y — si hay agente —
la tabla `agente_log` con sus dos políticas.

---

## Apéndice — tres cosas que van a preguntar

**"¿Por qué no le mando todas las entradas al modelo y listo?"** Por tres
razones, y conviene darlas en orden: hay un tope de tokens que vas a chocar
en cuanto el usuario acumule contenido; consumís cupo por cada llamada aunque
el 95% del texto sea irrelevante; y — la menos intuitiva — **el modelo
responde peor con ruido**. Cinco fragmentos relevantes dan mejores respuestas
que doscientos donde dos importan.

**"¿Cuántos fragmentos traigo?"** Cinco es un buen punto de partida. Si las
respuestas son incompletas, subí a 8. Si trae basura, bajá a 3. Es un
parámetro para ajustar con las diez preguntas, no una verdad.

**"¿Esto sirve con PDFs o documentos largos?"** Sí, y ahí es donde el chunking
pasa a ser un problema real. En Bitácora una entrada ya es del tamaño correcto
(200-500 palabras), así que no hay que partir nada. Con documentos largos:
fragmentos de 200 a 500 palabras, **cortados por unidades de significado** —
párrafos, secciones, ítems — nunca por cantidad de caracteres, y con una
superposición ligera entre fragmentos consecutivos para no cortar una idea al
medio. La regla que ordena todo: **cada fragmento se tiene que entender solo**.
Si dice "esto hay que cambiarlo" sin decir qué, no sirve recuperado fuera de
contexto.
