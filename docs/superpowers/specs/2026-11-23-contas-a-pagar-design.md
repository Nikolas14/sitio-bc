# Contas a pagar (boletos): design

Data: 2026-11-23. Branch: `feat/contas-a-pagar` (a partir de `master`).

## Intenção

Cadastrar os boletos que a casa tem para pagar e acompanhar cada um até o pagamento, para não perder o prazo de vencimento. Ao marcar um boleto como pago, registrar qual banco foi usado.

## Objetivos

- Cadastrar boleto com: número, empresa, data de vencimento e valor.
- Listar os boletos com o que está em aberto primeiro, por data de vencimento (mais próximo primeiro).
- Destacar visualmente o que está vencido e o que vence nos próximos 7 dias.
- Marcar boleto como pago, escolhendo o banco usado no pagamento. A data do pagamento é a data em que foi marcado.
- Editar e excluir boleto.

## Não objetivos

- Não gerar, ler ou validar a linha digitável do boleto.
- Não há alerta automático (WhatsApp, e-mail ou notificação). Só destaque na tela.
- Não há anexo de PDF do boleto.
- Não há controle de caixa nem integração com o módulo de estoque/vendas.

## Antimetas

- Não pedir mais dados além dos definidos acima. Sem campos de observação, categoria ou parcela, a menos que o usuário peça depois.
- Não bloquear a lista quando não há boleto cadastrado (mostrar mensagem vazia).

## Restrições

- Mesmo padrão do módulo de funcionários: tabela `ESTOQUE_*` no Supabase, hook `use*Manager`, tela com lista lateral + ficha, RLS aberta para `anon` e `authenticated`.
- Salvar e excluir pedem a senha de administrador (`AdminPasswordModal`), como no cadastro de funcionários.
- Textos da interface em português. Valores em nome de campos e dados gravados em maiúsculas, exceto datas e números.

## Abordagens consideradas

1. **Tabela própria `ESTOQUE_boleto` (escolhida).** Segue o padrão dos cadastros existentes. Simples e isolada.
2. Reaproveitar `ESTOQUE_transaction` com um tipo novo. Mistura boleto com venda e exige mudar o fluxo de cobrança. Descartada.

## Modelo de dados

Tabela `public."ESTOQUE_boleto"`:

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` |
| `numero` | text, not null, unique | número do boleto. Minha escolha: não repete. |
| `empresa` | text, not null | nome da empresa referente ao boleto |
| `vencimento` | date, not null | data de vencimento |
| `valor` | numeric(12,2), not null | valor do boleto |
| `paid_at` | timestamptz, null | null = em aberto; preenchido = pago |
| `banco` | text, not null, default '' | banco usado no pagamento. Campo com sugestões, não lista fechada. |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now() |

Status derivado (não gravado):
- **Pago**: `paid_at` preenchido.
- **Vencido**: em aberto e `vencimento` anterior a hoje.
- **Vence em breve**: em aberto e `vencimento` entre hoje e os próximos 7 dias.
- **Em aberto**: demais casos em aberto.

## Telas

- **Menu (home):** nova seção "Contas a pagar" com o item "Boletos" → `/contas-pagar`.
- **`/contas-pagar`:**
  - Barra lateral: título, busca (número ou empresa), lista. Cada item mostra empresa, número, vencimento, valor e um rótulo de status (Vencido, Vence em breve, Em aberto, Pago). Botão "+ Novo boleto" embaixo.
  - Área principal: ficha do boleto, no mesmo modelo de leitura/edição do cadastro de funcionários.
  - Na ficha de boleto em aberto há o botão **Marcar como pago**. Ele mostra o campo BANCO (com sugestões: Banco do Brasil, Bradesco, Caixa, Itaú, Santander, Sicoob, Sicredi, Nubank, Inter) e o botão **Confirmar pagamento**. Confirmar grava `paid_at = agora` e `banco`.
  - Boleto pago mostra "Pago em dd/mm/aaaa · banco X" e o botão **Desfazer pagamento**, que limpa `paid_at` e `banco`.
  - Marcar como pago e desfazer não pedem senha de administrador. Salvar e excluir pedem.

## Dúvidas em aberto

Nenhuma. Decisões tomadas por mim, pendentes de correção do usuário:
- Número do boleto é único.
- Marcar como pago e desfazer não pedem senha.
- Campo de banco é texto com sugestões, não lista fechada.
- A tabela é criada por `supabase/contas_pagar.sql`, que o usuário roda no Supabase.
