-- Cadastro e folha dos funcionários de abate.
-- Executar no Supabase antes de usar /cadastro/funcionario.

create table if not exists public."ESTOQUE_employee" (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  whatsapp_group text not null default '',
  phone text not null default '',
  cpf text not null default '',
  rg text not null default '',
  pix_type text not null default '',
  pix_key text not null default '',
  bank text not null default '',
  notes text not null default '',
  nickname text not null default '',
  sex text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."ESTOQUE_employee_attendance" (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public."ESTOQUE_employee"(id) on delete cascade,
  work_date date not null,
  abate_type text not null check (abate_type in ('FRANGO', 'BOI')),
  worked boolean not null default false,
  received_chicken boolean not null default false,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date, abate_type)
);

create table if not exists public."ESTOQUE_employee_extra" (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public."ESTOQUE_employee"(id) on delete cascade,
  week_start date not null,
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public."ESTOQUE_employee_weekly_payment" (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public."ESTOQUE_employee"(id) on delete cascade,
  week_start date not null,
  base_amount numeric(10, 2) not null default 0,
  chicken_discount numeric(10, 2) not null default 0,
  extras_total numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  pix_type text not null default '',
  pix_key text not null default '',
  paid_at timestamptz,
  closed_at timestamptz,
  reopened_at timestamptz,
  unique (employee_id, week_start)
);

create unique index if not exists employee_name_unique_idx
  on public."ESTOQUE_employee" (name);

-- Migração para bases que receberam a primeira versão da tabela.
alter table public."ESTOQUE_employee"
  add column if not exists whatsapp_group text not null default '';
alter table public."ESTOQUE_employee" drop column if exists abate_01;
alter table public."ESTOQUE_employee" drop column if exists abate_02;
alter table public."ESTOQUE_employee" drop column if exists daily_rate;

create index if not exists employee_attendance_date_idx
  on public."ESTOQUE_employee_attendance" (work_date, abate_type);

create index if not exists employee_extra_week_idx
  on public."ESTOQUE_employee_extra" (week_start);

create index if not exists employee_payment_week_idx
  on public."ESTOQUE_employee_weekly_payment" (week_start);

grant select, insert, update, delete on public."ESTOQUE_employee" to anon, authenticated;
grant select, insert, update, delete on public."ESTOQUE_employee_attendance" to anon, authenticated;
grant select, insert, update, delete on public."ESTOQUE_employee_extra" to anon, authenticated;
grant select, insert, update, delete on public."ESTOQUE_employee_weekly_payment" to anon, authenticated;
