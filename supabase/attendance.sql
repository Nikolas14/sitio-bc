-- Frequência diária dos funcionários, em três etapas:
--   frango / boi = em quais abates a pessoa confirmou presença no WhatsApp (lista de chamada)
--   confirmed    = vai em pelo menos um abate (derivado de frango ou boi)
--   present      = quem realmente foi: true (presente), false (falta), null (ainda não lançado)
-- Uma linha por funcionário e por data. Sem linha = não confirmou e sem lançamento.

create table if not exists public."ESTOQUE_employee_attendance" (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public."ESTOQUE_employee"(id) on delete cascade,
  work_date date not null,
  confirmed boolean not null default false,
  frango boolean not null default false,
  boi boolean not null default false,
  received_chicken boolean not null default false,
  present boolean,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

-- Bases que já tinham versões anteriores da tabela.
alter table public."ESTOQUE_employee_attendance"
  add column if not exists confirmed boolean not null default false,
  add column if not exists frango boolean not null default false,
  add column if not exists boi boolean not null default false,
  add column if not exists received_chicken boolean not null default false;
alter table public."ESTOQUE_employee_attendance" alter column present drop not null;

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

-- Dia de abate (uma linha por data): quando a lista foi assinada.
create table if not exists public."ESTOQUE_abate_day" (
  work_date date primary key,
  signed_at timestamptz
);

alter table public."ESTOQUE_abate_day" drop column if exists frango;
alter table public."ESTOQUE_abate_day" drop column if exists boi;

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
