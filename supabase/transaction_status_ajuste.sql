-- Libera o status 'AJUSTE' em ESTOQUE_transaction.
-- Usado pela Conferência de Estoque (/estoque/conferencia): cada conferência gera
-- até duas transações AJUSTE (uma IN e uma OUT) que corrigem o saldo do livro.
-- 'AJUSTE' fica fora da cobrança (useCobrancas filtra esse status).
alter table public."ESTOQUE_transaction"
  drop constraint if exists "ESTOQUE_transaction_status_check";

alter table public."ESTOQUE_transaction"
  add constraint "ESTOQUE_transaction_status_check"
  check (status = any (array['ENVIADO', 'PENDENTE', 'COBRADO', 'CONCLUIDO', 'CANCELADO', 'ENTRADA', 'AJUSTE']));
