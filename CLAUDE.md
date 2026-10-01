@modulo_05/bitacora/AGENTS.md

# bitacora

Proyecto Next.js con App Router, TypeScript y Tailwind. No cambies ese stack.

## Reglas
- Respondé y comentá el código en español.
- No instales librerías nuevas sin avisarme antes y explicarme por qué.
- Hacé cambios chicos y acotados: modificá solo lo que pido, no refactorices de más.
- No borres código que no mencioné en el pedido.
- No toques .env.local ni .gitignore.
- Siempre que termines una implementacion, grantiza que todo funciona de forma correcta y que nada se este roto
- Componentes chicos: si un archivo pasa las 100 líneas, avisame antes de seguir.
- Todo componente que use useState o eventos lleva "use client" en la primera línea.
- Mensajes de validación y de error en español, y que digan qué hacer.
- No agregues librerías de formularios, validación ni manejo de estado.
- Un pedido = un archivo, salvo que te diga lo contrario.

## Reglas del módulo 8
- Las llamadas al modelo salen SIEMPRE del servidor (route handlers en src/app/api/).
  Nunca desde un componente cliente.
- La API key del modelo va en .env.local SIN el prefijo NEXT_PUBLIC_.
- Las instrucciones del sistema van en config.systemInstruction, separadas del
  texto del usuario. Nunca concatenadas en el mismo string.
- Toda respuesta del modelo se parsea con try/catch y se valida antes de usarse.
- Si la IA falla, la operación principal (guardar la entrada) se completa igual.
  Nunca se le muestra un error al usuario por una función de IA que falló.
- Nunca llames al modelo dentro de un bucle ni reintentes sin un tope.

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

## Comandos
- `npm run dev` — servidor de desarrollo en localhost:3000
