-- Contas a pagar: boletos a pagar.
-- paid_at null = em aberto; preenchido = pago. banco = banco usado no pagamento.
-- Idempotente: pode rodar mais de uma vez.

create table if not exists public."ESTOQUE_boleto" (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  empresa text not null,
  vencimento date not null,
  valor numeric(12,2) not null,
  paid_at timestamptz,
  banco text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boleto_vencimento_idx
  on public."ESTOQUE_boleto" (vencimento);

alter table public."ESTOQUE_boleto" enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy where polrelid = 'public."ESTOQUE_boleto"'::regclass) then
    create policy "Boletos disponíveis no sistema"
      on public."ESTOQUE_boleto"
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
