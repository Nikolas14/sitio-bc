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
- **`ESTOQUE_product.current_stock`** — coluna de saldo do produto.
- **`ESTOQUE_v_inventory_summary`** — view de estoque consolidado (consumida por `useInventory`).
- **`ESTOQUE_v_estoque_vs_projecao`** — view de disponibilidade (estoque real × projetado).

> ⚠️ A definição das **views não está no repositório** — só existe `supabase/customers.sql`.
> É a maior incógnita do modelo (ver "Ponto que trava o desenho").

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

- Vem da **view** `ESTOQUE_v_inventory_summary` (`hooks/useInventory.ts:17`).
- A coluna `ESTOQUE_product.current_stock` **não é escrita** ao lançar venda/entrada —
  só é atualizada no **estorno/exclusão**.

### Estorno / exclusão

- `hooks/useDeleteTransaction.ts`: para cada item, lê `current_stock`, aplica
  `IN → subtrai` / `OUT → devolve` e grava de volta; depois apaga `ESTOQUE_operation`
  e `ESTOQUE_transaction`.
- Roda no **cliente**, item a item, **sem transação** (não atômico).

## Ponto que trava o desenho (precisa resolver primeiro)

**Onde mora o saldo de verdade?**

- **(a)** A view **soma as `ESTOQUE_operation`** (`IN − OUT`) ⇒ o saldo é **derivado**;
  nesse caso `current_stock` é redundante e o ajuste feito no delete **pode estar dobrando**
  o estorno (a exclusão das operations já reverteria o saldo).
- **(b)** A view **lê `current_stock`** (mantida por trigger no banco) ⇒ o correto é ter
  trigger e o ajuste no cliente fica frágil/duplicado.

**Ação:** colar o SQL de `ESTOQUE_v_inventory_summary` e `ESTOQUE_v_estoque_vs_projecao`
para definirmos o modelo com segurança.

## Decisões de desenho (a discutir)

1. **Fonte da verdade:** ledger computado (soma das operações) ou saldo materializado
   (`current_stock`)?
2. **Atomicidade:** mover venda/entrada/estorno para **RPC transacional** no Postgres,
   com trava de saldo negativo?
3. **Estorno:** deletar a transação (hoje) ou lançar **movimento de estorno**
   (rastreável, não destrutivo)?
4. **Tipos de movimento:** além de venda/entrada, teremos **ajuste, perda/quebra,
   inventário, devolução, transferência**? (hoje só `IN`/`OUT` ligados a uma venda/entrada)
5. **Unidade:** tudo em kg? Como ficam itens por **unidade** (isopor, embalagem)?
6. **Custo:** a entrada precisa registrar **custo de compra** (separado do preço de venda)?
7. **Concorrência:** evitar *lost update* no ajuste manual de `current_stock`.

## Pendências técnicas relacionadas (herdadas)

- **Status `'ENTRADA'`** não está no union de `ITransaction['status']`
  (`types/index.tsx:40`) — dívida técnica.
- **Escrita multi-tabela sem transação** — `finalizarEntrada`/`finalizarVenda` fazem
  insert na `transaction` e depois nas `operation`; falha no meio deixa dado órfão.
- **Sem RLS** — escritas partem do cliente com a anon key (ver `AGENTS.md`).
- **Baixa de estoque no lançamento** — a venda deve dar baixa (isopor pronto); depende
  de qual é a fonte da verdade (ver `venda.md`).

## Próxima sessão

- [ ] Colar/mapear o SQL das views `ESTOQUE_v_inventory_summary` e `ESTOQUE_v_estoque_vs_projecao`
- [ ] Decidir a **fonte da verdade** do saldo (item "Ponto que trava o desenho")
- [ ] Decidir se estorno vira **movimento** em vez de delete
- [ ] Definir **tipos de movimento** (ajuste, perda, inventário, devolução, transferência)
- [ ] Definir tratamento de **unidade** (kg × unidade) e **custo de compra**
- [ ] Desenhar RPCs transacionais de entrada/saída/estorno
