create table if not exists public."ESTOQUE_customer" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cpf text not null default '',
  address text not null default '',
  cep text not null default '',
  phone text not null default '',
  city text not null default '',
  airport text not null default '',
  pickup_person text not null default '',
  pickup_cpf text not null default '',
  alternative_pickup_person text not null default '',
  alternative_pickup_cpf text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."ESTOQUE_customer" enable row level security;

create policy "Clientes disponíveis no sistema"
  on public."ESTOQUE_customer"
  for all
  to anon, authenticated
  using (true)
  with check (true);
