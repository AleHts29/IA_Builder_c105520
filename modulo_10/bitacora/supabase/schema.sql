create table entradas (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references auth.users (id),
    titulo text not null,
    texto text not null,
    pendientes jsonb,
    created_at timestamp
    with
        time zone default now()
);

alter table entradas enable row level security;

-- 1. La extensión está instalada
select extname from pg_extension where extname = 'vector';
-- → devuelve una fila

-- 2. La columna existe y es del tipo correcto
select column_name, udt_name
from information_schema.columns
where
    table_name = 'entradas'
    and column_name = 'embedding';
-- → embedding | vector