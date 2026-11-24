-- Frequência dos funcionários. Uma lista por semana (segunda a domingo), com frango e/ou boi por pessoa:
--   frango / boi = em quais abates a pessoa está na lista da semana
--   confirmed    = está na lista da semana (vai em pelo menos um abate)
--   present_frango / present_boi = quem realmente foi em cada abate: true (presente), false (falta), null (ainda não lançado)
-- Uma linha por funcionário e por semana (work_date = segunda-feira). Sem linha = não está na lista e sem lançamento.

create table if not exists public."ESTOQUE_employee_attendance" (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public."ESTOQUE_employee"(id) on delete cascade,
  work_date date not null,
  confirmed boolean not null default false,
  frango boolean not null default false,
  boi boolean not null default false,
  received_chicken boolean not null default false,
  present_frango boolean,
  present_boi boolean,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

-- Bases que já tinham versões anteriores da tabela.
alter table public."ESTOQUE_employee_attendance"
  add column if not exists confirmed boolean not null default false,
  add column if not exists frango boolean not null default false,
  add column if not exists boi boolean not null default false,
  add column if not exists received_chicken boolean not null default false,
  add column if not exists present_frango boolean,
  add column if not exists present_boi boolean;

-- Bases com a presença única (present) passam a ter presença por abate.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ESTOQUE_employee_attendance'
      and column_name = 'present'
  ) then
    update public."ESTOQUE_employee_attendance" set present_frango = present where frango and present is not null and present_frango is null;
    update public."ESTOQUE_employee_attendance" set present_boi = present where boi and present is not null and present_boi is null;
    alter table public."ESTOQUE_employee_attendance" drop column present;
  end if;
end $$;

create index if not exists employee_attendance_date_idx
  on public."ESTOQUE_employee_attendance" (work_date);

alter table public."ESTOQUE_employee_attendance" enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy where polrelid = 'public."ESTOQUE_employee_attendance"'::regclass) then
    create policy "Frequência disponível no sistema"
      on public."ESTOQUE_employee_attendance"
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- Registro da semana (uma linha por segunda-feira): a semana tem frango? tem boi?
create table if not exists public."ESTOQUE_abate_day" (
  work_date date primary key,
  signed_at timestamptz
);

alter table public."ESTOQUE_abate_day" drop column if exists kind;

alter table public."ESTOQUE_abate_day"
  add column if not exists frango boolean not null default false,
  add column if not exists boi boolean not null default false;

alter table public."ESTOQUE_abate_day" enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy where polrelid = 'public."ESTOQUE_abate_day"'::regclass) then
    create policy "Dias de abate disponíveis no sistema"
      on public."ESTOQUE_abate_day"
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
