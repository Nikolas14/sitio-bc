-- Frequência diária dos funcionários, em duas etapas:
--   confirmed = quem confirmou presença no grupo do WhatsApp (lista de chamada)
--   present   = quem realmente foi: true (presente), false (falta), null (ainda não lançado)
-- Uma linha por funcionário e por data. Sem linha = não confirmou e sem lançamento.

create table if not exists public."ESTOQUE_employee_attendance" (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public."ESTOQUE_employee"(id) on delete cascade,
  work_date date not null,
  confirmed boolean not null default false,
  present boolean,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

-- Bases que já tinham a versão anterior (só present, not null).
alter table public."ESTOQUE_employee_attendance"
  add column if not exists confirmed boolean not null default false;
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
