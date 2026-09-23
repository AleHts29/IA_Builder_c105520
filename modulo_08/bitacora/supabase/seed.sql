-- Datos de prueba. Cambiar el email por el del usuario de auth.users.
-- Correr desde el SQL Editor del panel de Supabase.

insert into entradas (user_id, titulo, texto)
select id, 'Primera reunión con el cliente', 'Quedamos en mandar la propuesta el viernes.'
from auth.users where email = 'tu@email.com';

insert into entradas (user_id, titulo, texto)
select id, 'Llamada de seguimiento', 'Pidieron una versión reducida del alcance.'
from auth.users where email = 'tu@email.com';

insert into entradas (user_id, titulo, texto)
select id, 'Nota corta', 'Ok.'
from auth.users where email = 'tu@email.com';
