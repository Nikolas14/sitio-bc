-- Configurações do sistema: opções e valores de cálculo que antes ficavam no código.
-- Uma linha por chave. valor é jsonb: lista (bancos, empresas) ou número (dias, descontos, acréscimos).
-- Idempotente: pode rodar mais de uma vez; as linhas já existentes não são sobrescritas.

create table if not exists public."ESTOQUE_configuracao" (
  chave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public."ESTOQUE_configuracao" enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy where polrelid = 'public."ESTOQUE_configuracao"'::regclass) then
    create policy "Configurações disponíveis no sistema"
      on public."ESTOQUE_configuracao"
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

insert into public."ESTOQUE_configuracao" (chave, valor) values
  ('empresas', '["MIKI", "RODIN", "LEITE MENDEL", "GBS", "ALUGUEL SHLOMO", "HCI", "UNIMED RABINO", "CLARO MOLDEM", "CLARO SITIO", "INTERNETE SITIO", "CLARO BC", "EQUATORIAL SITIO", "EQUATORIAL SITIO TAXA", "EQUATORIAL BC", "EQUATORIAL RABINO"]'),
  ('bancos', '["ITAU", "BRADESCO", "STONE", "INTER", "C6"]'),
  ('dias_vence_em_breve', '7'),
  ('desconto_frango', '10'),
  ('acrescimo_frete_kg', '0.5')
on conflict (chave) do nothing;
