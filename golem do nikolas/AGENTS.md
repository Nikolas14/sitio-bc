# AGENTS.md — Sitio BC

Documentação de projeto para agentes de IA (opencode e afins). Este arquivo mora em `golem do nikolas/` por decisão do usuário.

## Visão geral

Sistema de gestão de vendas e estoque de carnes do **Beit Chabad Belém** (v2.0, 2026). Dashboard com acesso a caixa/venda, entrada de carga, histórico de transações, cobrança, estoque, cadastro de produtos, catálogo de preços e projeções.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Supabase** (`@supabase/supabase-js`) — banco de dados
- **ESLint 9** com `eslint-config-next` (core-web-vitals + typescript)
- Ícones: **lucide-react**
- Renderização de recibo/imagem: **html-to-image**
- Fontes: Geist e Geist Mono via `next/font`

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Build de produção |
| `npm run start` | `next start` |
| `npm run lint` | ESLint (sem `--fix`) |

## Estrutura

```
app/            rotas (App Router) — cada pasta é uma rota
  mov/venda     caixa/venda
  mov/entrada   entrada de carga
  transacoes/   histórico de transações
  cobranca/     módulo de cobrança
  estoque/      estoque geral e detalhado
  cadastro/produto  cadastro de produtos (exige senha admin)
  lista_preco/  catálogo de preços
  projecao/     projeções (nova, saldo, lista, resumo)
  avisos/       avisos
components/     componentes por módulo (AdminPasswordModal, BarcodeScanner,
                InventoryCart, ModalConfirmacao, StatusFilter, etc.)
hooks/          hooks de dados (useInventory, useTransactions, useCobranca*,
                useProjections*, usePickingSummary, etc.)
utils/          barcodeParser.ts
types/          interfaces compartilhadas (IProduct, ITransaction, IOperation)
api/            supabase.ts — cliente único do Supabase
```

### Estrutura de páginas

- Cada rota tem `page.tsx` (client component) + opcional `page.module.css`.
- `app/layout.tsx` define Metadata (`Sitio BC`) e `lang="pt-br"`.

## Supabase

Cliente único em `api/supabase.ts`, usando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` do `.env`.

Tabelas e views usadas:

| Nome | Tipo | Uso |
| --- | --- | --- |
| `ESTOQUE_product` | tabela | produtos (id, name, type, current_stock, price, weightAlt) |
| `ESTOQUE_transaction` | tabela | transações IN/OUT (customer_vendor, total_price, total_kg, serial_number, shipping_cost, tax_amount, discount_percent, status, paid_amount) |
| `ESTOQUE_operation` | tabela | cada item/venda vinculado a `transaction_id`; campos `product_id`, `type`, `quant`; join com `ESTOQUE_product` |
| `ESTOQUE_v_inventory_summary` | view | estoque consolidado p/ inventário |

Join típico de itens de venda:
```ts
supabase.from('ESTOQUE_operation')
  .select(`*, ESTOQUE_product(name, price)`)
  .eq('transaction_id', id)
```

Status de cobrança: `PENDENTE | ENVIADO | COBRADO | CONCLUIDO`.
Tipos de produto: `FRANGO | CARNE | EMBUTIDOS | SORVETE | PEIXE | OUTROS | EXTRA | INTERNO | ISOPOR`.

> ⚠️ Toda escrita em produtos/operações passa pelo Supabase direto do client; só alterar o esquema do banco com conhecimento prévio do dono.

## Convenções

- Código em **português** nos labels/UI; identificadores em inglês (ex.: `esecoes`, `itens`).
- Páginas são `'use client'`; dados buscados via hooks no padrão `useXxx()` que retornam dados + `loading` + `refresh`.
- Import de cliente Supabase: `@/api/supabase`; tipos: `@/types`.
- Nomes de produto são gravados em MAIÚSCULAS (`name: formData.name.toUpperCase().trim()`).
- Admin de cadastro exige senha validada no hook `useProductManager.handleAdminConfirm`.
- Sem comentários desnecessários; o codebase tem alguns logs de debug em português — mantê-los é aceitável, não adicionar novos.
- Rodar `npm run lint` antes de finalizar alterações.