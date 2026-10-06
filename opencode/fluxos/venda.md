# Fluxo — Venda e Cobrança

> Visão de **negócio** de como uma venda percorre o sistema, da saída do produto até a conclusão.
> O objetivo deste documento é explicar o fluxo com clareza para facilitar a implementação depois.
> Contexto técnico geral em `opencode/contexto/AGENTS.md`; histórico/estado em `opencode/memoria/memoria.md`.
>
> Detalhes de implementação (arquivos, campos e status no banco) ficam na última seção,
> **"Notas técnicas (para quando formos desenvolver)"** — não são regra de negócio.

## Resumo em uma frase

Toda venda é uma **saída de estoque vinculada a um cliente** e percorre **5 estados** —
**Isopor → Envio → Cobrado → Finalizado → Concluído** — até ser quitada e concluída.

## O ciclo

```
Lançar a venda          (1) ISOPOR       (2) ENVIO        (3) COBRADO     (4) FINALIZADO    (5) CONCLUÍDO
/mov/venda       ──▶    PENDENTE    ──▶  ENVIADO     ──▶  COBRADO    ──▶  FINALIZADO   ──▶  CONCLUIDO
saída de estoque        lançar frete     enviar a nota    aguardar        pagamento         1 mês após
                        e imposto        de cobrança      pagamento       confirmado        a quitação
                                         (WhatsApp)       (parcial ok)                      (automático)
```

## Regras gerais

1. **Cliente é obrigatório.** Toda venda tem um cliente vinculado; não existe mais venda avulsa.
2. **Toda venda percorre o ciclo completo.** Por enquanto, nenhuma venda à vista/balcão pula estados.
3. A venda é uma **saída de estoque**. Quando o **isopor fica pronto**, deve **dar baixa no estoque**.
4. A cobrança **não tem prazo/vencimento**.
5. **Valor final** = `(subtotal dos itens − desconto) + imposto + frete`.
6. As transições de estado são, por natureza, **para frente** (há interesse futuro em permitir
   voltar para correções).
7. Pagamento pode ser **parcial** e vai **acumulando** até cobrir o valor final.

## Etapa de lançamento — `/mov/venda`

Antes de entrar no ciclo, a venda é lançada no caixa.

**Informações necessárias:**

| Dado | Obrigatório | Observação |
| --- | --- | --- |
| Cliente | **Sim** | venda sempre vinculada a um cliente |
| Itens | Sim | ao menos 1 item bipado |
| Peso (kg) | — | lido da etiqueta de balança |
| Preço por kg | — | vem do cadastro do produto |
| Desconto (%) | Não | padrão `0` |

**Regras da bipagem:**
- Cada etiqueta válida adiciona o produto ao carrinho, limpa o campo e devolve o foco.
- Produto inexistente: mensagem em português, campo limpo e foco mantido.
- A gravação (F10) só ocorre com ao menos 1 item e sem salvamento em andamento.
- Subtotal do item = `preço × peso`; total = soma dos itens − desconto.

Ao finalizar, a venda entra no ciclo no estado **Isopor**.

## Estado 1 — Isopor (PENDENTE)

**Objetivo:** registrar o frete do envio (e eventual imposto) antes de despachar.

- O nome "Isopor" vem da operação: um **isopor** (caixa fechada com carnes) fica
  pendente justamente quando está **pronto para envio**. Remessas de isopor com carne
  são enviadas para **todo o Brasil**.
- Aqui se lança o **frete do envio** (com apoio de cálculo automático LATAM) e o **imposto**.
- **O frete não é obrigatório** — pode ser zerado (ex.: retirada local / venda sem envio).
- Este é o **único estado editável** (custos/trava). Depois de avançar, a edição é bloqueada.
- **Ação:** "Salvar e Finalizar Custos" ⇒ avança para **Envio**.
- **Baixa de estoque:** quando o isopor fica pronto, o estoque deve ser abatido
  (hoje isso não acontece — ver notas técnicas).

## Estado 2 — Envio (ENVIADO)

**Objetivo:** enviar a nota de cobrança ao cliente.

- Custos travados e produto despachado.
- **Ação:** gerar a nota de cobrança (imagem) e enviar ao cliente.
- Conteúdo da nota = **o mesmo já existente hoje**: cliente, referência, itens, subtotal,
  desconto, frete, imposto, total e a chave Pix (CNPJ). **Sem prazo/vencimento.**
- O envio é **manual** (baixar a imagem e mandar no WhatsApp).
- **A transição Envio → Cobrado acontece no momento em que a cobrança é enviada** ao cliente.
  Como ainda não há integração direta com o WhatsApp, na prática o gatilho atual é a
  geração da imagem; a ideia final é que o avanço ocorra no envio real.

## Estado 3 — Cobrado (COBRADO)

**Objetivo:** aguardar a confirmação do pagamento do cliente.

- **Ação:** "Registrar Recebimento" (disponível só neste estado).
- O valor pago é **acumulativo**.
- **Pagamento parcial:** o estado **permanece Cobrado** enquanto houver saldo devedor.
- Se o cliente não quitar, a venda **fica em Cobrado indefinidamente** — comportamento
  aceito (a tendência é o cliente não sumir).
- Quando o total pago cobre o valor final, avança para **Finalizado**.

## Estado 4 — Finalizado (FINALIZADO)

**Objetivo:** confirmar que o pagamento foi integralmente quitado.

- Quitação integral confirmada; saldo devedor zerado.
- Registra a **data de conclusão dos pagamentos** (base para o prazo do estado 5).
- Não há mais cobrança ativa; a venda apenas aguarda o prazo de 1 mês.

## Estado 5 — Concluído (CONCLUIDO)

**Objetivo:** encerrar o ciclo.

- **Automático:** passado **1 mês** desde a quitação (venda "parada" no banco de dados),
  ela passa a **Concluído**.
- Estado **terminal** do ciclo.

## Resumo dos estados

| # | Estado (nome) | Chave no sistema | Quem/o que dispara a saída | Vai para |
| --- | --- | --- | --- | --- |
| 1 | Isopor | `PENDENTE` | "Salvar e Finalizar Custos" (frete + imposto) | Envio |
| 2 | Envio | `ENVIADO` | Envio da nota de cobrança ao cliente | Cobrado |
| 3 | Cobrado | `COBRADO` | Pagamento que cobre o valor final | Finalizado |
| 4 | Finalizado | `FINALIZADO` | 1 mês após a quitação (automático) | Concluído |
| 5 | Concluído | `CONCLUIDO` | — (terminal) | — |

## Glossário

- **Isopor:** caixa fechada com carnes pronta para envio. Dá nome ao estado 1 (Pendente).
- **Nota de cobrança:** imagem que lista os itens, valores e a chave Pix, enviada ao cliente.
- **Quitação:** momento em que o total pago cobre o valor final da venda.

---

## Notas técnicas (para quando formos desenvolver)

> Implementação atual e lacunas. Não é regra de negócio.

**Hoje o código tem 4 status**, não 5: `PENDENTE | ENVIADO | COBRADO | CONCLUIDO`
(`types/index.tsx:40,73`). Falta o `FINALIZADO` intermediário.

- **Criar status `FINALIZADO`** entre `COBRADO` e `CONCLUIDO`.
- **Quitação** hoje vai direto para `CONCLUIDO` (`hooks/useCobrancaManager.ts:87-88`);
  deve ir para `FINALIZADO`.
- **Transição de 1 mês** não existe (sem cron/scheduler/lógica por data). Falta uma
  **coluna de data de conclusão dos pagamentos** e o job que conclui após 1 mês parado.
- **Stepper** tem 4 passos (`app/cobranca/components/StatusStepper/StatusStepper.tsx:11-14`);
  precisa de 5, com labels **Isopor · Envio · Cobrado · Finalizado · Concluído**.
- **Histórico de pagamentos** não existe — só o campo cumulativo `paid_amount`
  (avaliar tabela com data/valor/forma para saber a data exata de quitação).
- **WhatsApp**: sem integração real; hoje só gera/baixa o PNG. A transição
  `ENVIADO → COBRADO` deve passar a ocorrer no envio.
- **Transição reversa** de status não existe — hoje é mão única.
- **Baixa de estoque** não acontece no lançamento; só o delete/estorno ajusta `current_stock`.
- **Venda avulsa** ainda existe (`customer || 'VENDA_AVULSA'` em `app/mov/venda/page.tsx:51`);
  tornar o cliente obrigatório e remover o fallback.
- **Cobrança sem prazo/vencimento**; a nota mantém o conteúdo atual (`PrintTemplate`).

Detalhes complementares em `opencode/memoria/memoria.md` (seção "Fluxo de venda/cobrança — alvo").
