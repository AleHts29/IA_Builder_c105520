create table entradas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  titulo text not null,
  texto text not null,
  pendientes jsonb,
  created_at timestamp with time zone default now()
);

alter table entradas enable row level security;
