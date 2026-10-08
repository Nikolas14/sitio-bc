-- Congela o preço/kg usado em cada movimento (venda/entrada).
-- Sem isso, recibos e cobranças recalculam pelo preço ATUAL do produto e
-- podem cobrar a mais depois que a nota já foi enviada.
alter table public."ESTOQUE_operation"
  add column if not exists unit_price numeric;

-- Backfill das linhas antigas com o preço atual do produto (melhor esforço).
-- Linhas novas passam a gravar o preço no momento do lançamento.
update public."ESTOQUE_operation" op
set unit_price = p.price
from public."ESTOQUE_product" p
where op.product_id = p.id
  and op.unit_price is null;
