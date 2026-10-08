# Fluxo — Entrada e Saída de Estoque

> Fluxo **técnico** de como o estoque entra e sai no Sitio BC.
> Este documento está em **rascunho/aberto**: registra o que existe hoje e as decisões
> de desenho que ainda precisam ser tomadas.
> Contexto geral em `opencode/contexto/AGENTS.md`; fluxo de venda em `opencode/fluxos/venda.md`;
> histórico/estado em `opencode/memoria/memoria.md`.

## Estado atual (como é hoje)

### Modelo de dados

- **`ESTOQUE_operation`** — livro de movimentos. 1 linha por movimento:
  `product_id`, `transaction_id`, `type` (`IN`/`OUT`), `quant` (**kg**), `created_at`.
- **`ESTOQUE_transaction`** — cabeçalho da movimentação: `type` (`IN`/`OUT`),
  `customer_vendor`, totais (`total_price`, `total_kg`), `discount_percent`, `status`.
- **`ESTOQUE_product.current_stock`** — coluna **vestigial**: nenhuma view nem tela a lê.
  O `current_stock` que o app exibe vem da **view** (alias calculado), não da coluna.
- **`ESTOQUE_v_inventory_summary`** — view de estoque consolidado (consumida por `useInventory`).
  `current_stock` = `SUM(IN − OUT)` por produto, direto de `ESTOQUE_operation`.
- **`ESTOQUE_v_estoque_vs_projecao`** — view de disponibilidade (estoque real × projetado).
  `estoque_real` = `SUM(IN − OUT)`; `total_projetado` = `SUM(quant)` das projeções
  `ABERTO`; `saldo_previsto` = `estoque_real − total_projetado`.

> ✅ As definições das views foram confirmadas (10/2026): **ambas derivam o saldo do
> livro `ESTOQUE_operation`** (`IN − OUT`). Ver "Fonte da verdade — resolvida".

### Entrada — `/mov/entrada`

- Bipagem de etiquetas de balança → carrinho.
- `finalizarEntrada` (`app/mov/entrada/page.tsx:36`) insere:
  - `ESTOQUE_transaction`: `type: 'IN'`, `status: 'ENTRADA'`,
    `customer_vendor` = referência/abate (ou `ENTRADA_AVULSA`), `discount_percent: 0`.
  - `ESTOQUE_operation`: `type: 'IN'`, `quant` = peso em kg.
- O `total_price` da entrada usa o **preço de venda** do produto — **não há custo de compra**.

### Saída — `/mov/venda`

- Bipagem → carrinho → desconto → F10.
- Insere `ESTOQUE_transaction` (`type: 'OUT'`, `status: 'PENDENTE'`) + `ESTOQUE_operation` (`type: 'OUT'`).
- Ver `opencode/fluxos/venda.md` para o ciclo de cobrança.

### Saldo exibido

- Vem da **view** `ESTOQUE_v_inventory_summary` (`hooks/useInventory.ts:17`) — ledger `IN − OUT`.
- A coluna `ESTOQUE_product.current_stock` **não é escrita** ao lançar venda/entrada
  e **não é lida** por nenhuma view/tela.

### Estorno / exclusão

- `hooks/useDeleteTransaction.ts`: apaga as `ESTOQUE_operation` da transação e depois a
  `ESTOQUE_transaction`. Como o saldo é **derivado do livro**, isso já reverte o estoque.
- Roda no **cliente**, em dois deletes, **sem transação** (não atômico).

## Fonte da verdade — resolvida (10/2026)

As views foram coladas e confirmam a hipótese **(a)**:

- `ESTOQUE_v_inventory_summary.current_stock` = `SUM(CASE IN: +quant, OUT: −quant)`
  sobre `ESTOQUE_operation` (LEFT JOIN product).
- `ESTOQUE_v_estoque_vs_projecao.estoque_real` = mesma soma; `saldo_previsto` subtrai o projetado.

⇒ **O saldo é derivado do livro (`ESTOQUE_operation`).** `ESTOQUE_product.current_stock`
é redundante e vestigial.

**Impacto:** o ajuste manual de `current_stock` que existia no `useDeleteTransaction`
foi **removido** — era redundante (a exclusão das operations já reverte o saldo) e podia
divergir a coluna. Não confundir o **campo** `current_stock` do app (que vem da view)
com a **coluna** homônima da tabela (morta).

## Preço congelado no movimento — resolvido (10/2026)

**Problema:** recibo/cobrança calculavam o preço pelo `ESTOQUE_product.price` **vivo**
(join), então um reajuste no cadastro recalculava **todas** as notas antigas — risco de
cobrar a mais depois da cobrança enviada. O `total_price` do cabeçalho já era congelado,
mas o detalhamento por item não.

**Solução:** coluna `unit_price` (numeric) em `ESTOQUE_operation`, gravada no lançamento.

- Migração + backfill: `supabase/operations_unit_price.sql` (rodar no Supabase).
- **Escrita:** `app/mov/venda/page.tsx` e `app/mov/entrada/page.tsx` gravam `unit_price`.
- **Leitura:** `useCobrancaManager`, `ReceiptTable`, `TransactionItemsTable` e
  `PrintTemplate` usam `unit_price ?? ESTOQUE_product.price` (fallback p/ linhas antigas).
- **Ainda não congelado:** o **nome** do produto continua vivo (mudança de nome altera a
  nota, mas não o valor). Congelar nome é possível no mesmo mecanismo, se desejado.

## Decisões de desenho (a discutir)

1. ~~**Fonte da verdade:** ledger ou `current_stock`?~~ ✅ **Ledger** (resolvido acima).
2. **Atomicidade:** mover venda/entrada/estorno para **RPC transacional** no Postgres
   (sem trava de saldo negativo — decisão do dono: não bloquear a venda).
3. **Estorno:** deletar a transação (hoje) ou lançar **movimento de estorno**
   (rastreável, não destrutivo)? Flag na transação exige **recriar as views** com filtro.
4. **Tipos de movimento:** além de venda/entrada, teremos **ajuste, perda/quebra,
   inventário, devolução, transferência**? (hoje só `IN`/`OUT` ligados a uma venda/entrada)
5. **Unidade:** tudo em kg? Como ficam itens por **unidade** (isopor, embalagem)?
6. ~~**Custo:**~~ Adiado pelo dono — sem custo de compra por enquanto.
7. ~~**Concorrência:** *lost update* no `current_stock`.~~ ✅ Deixou de existir ao remover
   o ajuste manual da coluna.
8. **Coluna `current_stock`:** dropar `ESTOQUE_product.current_stock` (só com o dono).
9. ~~**Preço histórico instável.**~~ ✅ Resolvido com `unit_price` (ver acima).

## Pendências técnicas relacionadas (herdadas)

- **Status `'ENTRADA'`** não está no union de `ITransaction['status']`
  (`types/index.tsx:40`) — dívida técnica.
- **Escrita multi-tabela sem transação** — `finalizarEntrada`/`finalizarVenda` fazem
  insert na `transaction` e depois nas `operation`; falha no meio deixa dado órfão.
- **Sem RLS** — escritas partem do cliente com a anon key (ver `AGENTS.md`).
- **Baixa de estoque no lançamento** — a venda deve dar baixa (isopor pronto); depende
  de qual é a fonte da verdade (ver `venda.md`).

## Próxima sessão

- [x] Colar/mapear o SQL das views `ESTOQUE_v_inventory_summary` e `ESTOQUE_v_estoque_vs_projecao`
- [x] Decidir a **fonte da verdade** do saldo → **ledger (`ESTOQUE_operation`)**
- [x] Remover ajuste manual de `current_stock` no `useDeleteTransaction`
- [x] Congelar preço no movimento (`unit_price` em `ESTOQUE_operation` + backfill)
- [ ] **Rodar `supabase/operations_unit_price.sql` no Supabase** (mudança de esquema)
- [ ] Decidir se estorno vira **movimento** em vez de delete
- [ ] Definir **tipos de movimento** (ajuste, perda, inventário, devolução, transferência)
- [ ] Definir tratamento de **unidade** (kg × unidade) e **custo de compra**
- [ ] Desenhar RPCs transacionais de entrada/saída/estorno
- [ ] Avaliar (com o dono) **dropar** `ESTOQUE_product.current_stock`
