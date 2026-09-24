# Sitio BC — Gestão de vendas e estoque de carnes

Sistema do **Beit Chabad Belém** para caixa/venda, entrada de carga, cobrança, estoque, cadastros, catálogo de preços e projeções de envio.

## Funcionalidades

- **Caixa / Venda** (`/mov/venda`) — leitura de código de barras EAN-13 de balança, atalho F10, desconto, resumo por categoria (kg)
- **Entrada de Carga** (`/mov/entrada`) — conferência de peso por bipagem
- **Histórico** (`/transacoes`) — recibo detalhado, exclusão com senha + estorno de estoque
- **Cobrança** (`/cobranca`) — status `PENDENTE → ENVIADO → COBRADO → CONCLUIDO`, trava de edição, pagamento parcial, recibo em imagem (`html-to-image`)
- **Estoque** (`/estoque`, `/estoque/detalhado`) — saldo geral e extrato por produto
- **Cadastros** (`/cadastro/produto`, `/cadastro/cliente`) — produtos e clientes; salvar/excluir exigem senha admin
- **Catálogo** (`/lista_preco`) — tabela de preços por categoria, pronta para impressão
- **Projeções** (`/projecao`, `/projecao/lista`, `/projecao/saldo`, `/projecao/resumo`) — cargas projetadas, disponibilidade (estoque real × projetado) e picking
- **Pedidos / Avisos** — impressão de pedidos e murais

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **lucide-react**
- **Supabase** (`@supabase/supabase-js`) como banco
- Toasts e modais próprios (sem libs extras)

## Como rodar

Pré-requisitos: Node 20+ e um projeto no Supabase.

```bash
npm install
```

Crie o arquivo `.env.local` na raiz (ele está no `.gitignore`, nunca commite):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_PASSWORD=
```

| Variável | Onde usar | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Chave anon (pública por natureza) |
| `ADMIN_PASSWORD` | **somente servidor** (Vercel, sem expor ao browser) | Senha de produtos, clientes, transações e projeções |

```bash
npm run dev     # http://localhost:3000
npm run lint    # ESLint — deve estar zerado
npm run build   # build de produção
npm run start   # serve o build
```

## Estrutura

```
app/            rotas (cada pasta é uma rota) + POST /api/admin/verify
components/     UI por módulo (Toast, AdminPasswordModal, InventoryCart, ...)
hooks/          dados no padrão useXxx() → dados + loading + error + refresh
utils/          barcodeParser.ts, adminAuth.ts
types/          IProduct, ITransaction, IOperation, ICustomer, IReceiptItem
api/            supabase.ts — cliente único do Supabase
supabase/       scripts SQL auxiliares
```

## Banco (Supabase)

| Tabela / view | Uso |
| --- | --- |
| `ESTOQUE_product` | produtos (`id`, `name`, `type`, `current_stock`, `price`, `weightAlt`) |
| `ESTOQUE_transaction` | transações IN/OUT (cliente, totais, status, pagamento) |
| `ESTOQUE_operation` | itens vinculados a `transaction_id` (`product_id`, `type`, `quant`) |
| `ESTOQUE_customer` | clientes e dados de retirada |
| `ESTOQUE_projection` | itens projetados (`reference`, `status`) |
| `ESTOQUE_v_inventory_summary` | view de estoque consolidado |
| `ESTOQUE_v_estoque_vs_projecao` | view estoque real × projetado |

## Senha admin

A verificação acontece **no servidor** (`POST /api/admin/verify`, compara com `ADMIN_PASSWORD` via `timingSafeEqual`). A senha nunca vai para o JavaScript do navegador.

> ⚠️ Nunca crie `NEXT_PUBLIC_ADMIN_PASSWORD` — o prefixo `NEXT_PUBLIC_` expõe o valor no bundle. Se existir essa variável na Vercel, apague-a.

## Convenções

- UI em português; identificadores em inglês
- Páginas `'use client'`; dados via hooks `useXxx()`
- Erros: `error state` nos hooks + toast na UI (`useToast()`); sem `alert()`
- `npm run lint` + `npx tsc --noEmit` limpos antes de commitar
- Commits em conventional commits (`feat:`, `fix:`…)

## Segurança — pendente

As escritas ainda partem do cliente com a anon key. Falta: ativar **RLS** nas tabelas `ESTOQUE_*` e mover venda/cobrança/estoque para **RPCs** transacionais no Postgres. Até lá, a senha admin é trava operacional, não proteção total.
