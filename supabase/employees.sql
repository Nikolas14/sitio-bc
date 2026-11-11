-- Cadastro de funcionários (grupo = ABATE 01 / ABATE 02, conforme a planilha).
-- Idempotente: serve para base nova e para a base que já tinha a tabela do módulo antigo.

create table if not exists public."ESTOQUE_employee" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_name text not null default '',
  phone text not null default '',
  cpf text not null default '',
  rg text not null default '',
  pix_key text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Base antiga: a coluna whatsapp_group virou group_name (sem perda de dados).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ESTOQUE_employee' and column_name = 'whatsapp_group'
  ) then
    alter table public."ESTOQUE_employee" rename column whatsapp_group to group_name;
  end if;
end $$;

alter table public."ESTOQUE_employee" enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy where polrelid = 'public."ESTOQUE_employee"'::regclass) then
    create policy "Funcionários disponíveis no sistema"
      on public."ESTOQUE_employee"
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
