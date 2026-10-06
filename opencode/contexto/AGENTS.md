# AGENTS.md — Sitio BC

> Documentação/contexto para agentes de IA (opencode e afins).
> Esta pasta (`opencode/`) é o "cérebro" do projeto. Organização por tipo de documento:
> `contexto/` (este arquivo), `regras/` (checklist) e `memoria/` (histórico/estado).
> **NUNCA** colar segredos (URLs, chaves, senhas) aqui — só nomes de variáveis.

## Visão geral

Sistema de gestão de vendas e estoque de carnes do **Beit Chabad Belém**.
Dashboard com caixa/venda, entrada de carga, histórico de transações, cobrança,
estoque, cadastros, catálogo de preços, pedidos e projeções.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Supabase** (`@supabase/supabase-js`) — banco de dados
- **lucide-react** — ícones
- **html-to-image** — gerar recibo/imagem
- **xlsx** — planilhas
- Fontes **Geist** / **Geist Mono** via `next/font`
- ESLint 9 (`eslint-config-next`, core-web-vitals + typescript)

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build (`next start`) |
| `npm run lint` | ESLint (sem `--fix`) — deve ficar zerado |
| `npx tsc --noEmit` | Checagem de tipos — deve ficar limpa |

Sempre rodar `npm run lint` + `npx tsc --noEmit` antes de finalizar/commitar.

## Estrutura

```
app/            rotas (App Router) — cada pasta é uma rota; page.tsx é client
  page.tsx        dashboard (menu de atalhos)
  mov/venda       caixa/venda
  mov/entrada     entrada de carga
  transacoes      histórico / recibos
  cobranca/       lista de cobranças
  cobranca/[id]   gestão de uma cobrança
  estoque/        estoque geral
  estoque/detalhado  extrato por produto
  cadastro/produto   CRUD produtos (exige senha admin)
  cadastro/cliente   CRUD clientes (senha admin para salvar/excluir)
  lista_preco/    catálogo de preços (impressão/PDF)
  pedidos/        impressão de pedidos
  projecao/       nova projeção
  projecao/lista  lista de projeções (excluir exige senha admin)
  projecao/saldo  disponibilidade (estoque real × projetado)
  projecao/resumo picking list
  api/admin/verify/route.ts   POST que valida a senha admin (server)
components/     UI compartilhada (Toast, AdminPasswordModal, InventoryCart, ...)
hooks/          hooks de dados no padrão useXxx()
utils/          barcodeParser.ts, adminAuth.ts
types/          interfaces compartilhadas (index.tsx)
api/            supabase.ts — cliente único do Supabase
supabase/       scripts SQL auxiliares
opencode/       este diretório — contexto/regras/memória dos agentes
```

> `app/escritorio/fechamento/` e `app/api/environment/verify/` existem como
> diretórios **vazios** (sem rota implementada).

## Rotas

| Rota | Função | Admin |
| --- | --- | --- |
| `/` | Dashboard com atalhos | — |
| `/mov/venda` | Venda: bipa EAN-13 de balança, carrinho, desconto %, F10 grava `transaction` OUT | — |
| `/mov/entrada` | Entrada de carga: bipagem, F10 grava `transaction` IN | — |
| `/transacoes` | Histórico, recibo, excluir com estorno de estoque | senha |
| `/cobranca` | Lista de cobranças (transações OUT) com filtro de status | — |
| `/cobranca/[id]` | Stepper de status, custos, pagamento parcial, recibo em imagem | — |
| `/estoque` | Saldo agrupado por categoria | — |
| `/estoque/detalhado` | Histórico por produto e período | — |
| `/cadastro/produto` | CRUD de produtos | bloqueia página |
| `/cadastro/cliente` | CRUD de clientes | salvar/excluir |
| `/lista_preco` | Catálogo de preços para impressão | — |
| `/pedidos` | Impressão de pedidos (cliente + texto colado) | — |
| `/projecao` | Nova projeção (`ESTOQUE_projection`, status `ABERTO`) | — |
| `/projecao/lista` | Lista/agrupa projeções, excluir por referência | excluir |
| `/projecao/saldo` | Disponibilidade: estoque real × projetado | — |
| `/projecao/resumo` | Picking list consolidada | — |
| `POST /api/admin/verify` | Valida senha admin no servidor | — |

## Banco (Supabase)

Cliente único em `api/supabase.ts` (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

| Tabela / view | Uso |
| --- | --- |
| `ESTOQUE_product` | produtos (`id`, `name`, `type`, `current_stock`, `price`, `weightAlt`) |
| `ESTOQUE_transaction` | transações IN/OUT (`customer_vendor`, totais, `status`, `paid_amount`, frete, imposto, desconto) |
| `ESTOQUE_operation` | itens por `transaction_id` (`product_id`, `type`, `quant`) + join `ESTOQUE_product` |
| `ESTOQUE_customer` | clientes e dados de retirada |
| `ESTOQUE_projection` | itens projetados (`reference`, `status`, `quant`) + join `ESTOQUE_product` |
| `ESTOQUE_v_inventory_summary` | view de estoque consolidado |
| `ESTOQUE_v_estoque_vs_projecao` | view estoque real × projetado |

- Status de cobrança: `PENDENTE | ENVIADO | COBRADO | CONCLUIDO`.
- Tipos de produto: `FRANGO | CARNE | EMBUTIDOS | SORVETE | PEIXE | OUTROS | EXTRA | INTERNO | ISOPOR`.
- Joins do Supabase (client sem tipos gerados) exigem cast `as unknown as T[]`.
- ⚠️ Só alterar o **esquema** do banco com conhecimento do dono.

## Convenções

- UI em **português**; identificadores em **inglês**.
- Páginas são `'use client'`; dados via hooks `useXxx()` → `{ dados, loading, error, refresh }`.
- Import do cliente: `@/api/supabase`; tipos: `@/types`.
- Nomes de produto gravados em **MAIÚSCULAS** (`name.toUpperCase().trim()`).
- Erros: `error: string | null` nos hooks + `useToast()` na UI. **Sem `alert()`** e sem `console.error` ativo.
- Fetch dentro de `useEffect` usa padrão `.then()` (a regra `react-hooks/set-state-in-effect` do React 19 sinaliza `setState` síncrono em efeito).
- Sem comentários desnecessários. Logs de debug em português já existentes podem ficar; não adicionar novos.
- Toast/modal próprios — **não adicionar libs** de UI/notificação.

## Regras de ouro (nunca violar)

1. **Nunca** criar/recriar `NEXT_PUBLIC_ADMIN_PASSWORD`. A senha é server-only (`ADMIN_PASSWORD`), lida **somente** em `app/api/admin/verify/route.ts`.
2. **Nunca** commitar `.env*` (estão no `.gitignore`). `.env.example` deve ter só nomes/placeholders, sem valores reais.
3. **Nunca** colar segredos em `opencode/`, README ou código.
4. **Nunca** mexer no esquema Supabase sem o dono.
5. Rodar `npm run lint` + `npx tsc --noEmit` antes de finalizar.
6. Só commitar quando o usuário pedir explicitamente.

## Segurança — pendente (importante)

As escritas ainda partem do **cliente** com a anon key: quem souber o endpoint
escreve direto no Supabase. A senha admin é trava **operacional**, não proteção total.
Falta:

- Ativar **RLS** nas tabelas `ESTOQUE_*`.
- Mover venda/entrada/cobrança/estoque para **RPCs** transacionais no Postgres.

Detalhes e prioridades em `opencode/memoria/memoria.md`.
