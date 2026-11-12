-- Desconto gravado em cada projeção (snapshot do desconto do cliente no momento do pedido).
alter table public."ESTOQUE_projection"
  add column if not exists discount_percent numeric not null default 0
  check (discount_percent >= 0 and discount_percent <= 100);
