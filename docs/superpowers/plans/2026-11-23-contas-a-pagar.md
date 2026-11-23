# Contas a pagar (boletos): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tela para cadastrar boletos (número, empresa, vencimento, valor), listar os em aberto por vencimento e marcar como pago informando o banco.

**Architecture:** Tabela `ESTOQUE_boleto` no Supabase. Regras puras (status, valor, bancos) em `utils/boletos.ts`. Hook `useBoletoManager` no mesmo modelo de `useEmployeeManager`. Página `/contas-pagar` no mesmo modelo de `/cadastro/funcionarios` (lista lateral + ficha).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase JS, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-11-23-contas-a-pagar-design.md`

## Global Constraints

- Tabela e colunas exatamente como no spec: `numero` (unique), `empresa`, `vencimento` (date), `valor` (numeric 12,2), `paid_at` (timestamptz, null = em aberto), `banco` (text, default '').
- Status: `PAGO`, `VENCIDO`, `VENCE_EM_BREVE` (até 7 dias), `EM_ABERTO`.
- Salvar e excluir pedem senha de administrador. Marcar como pago e desfazer não pedem.
- Interface em português.
- Sem commit até o usuário pedir.

## Review Focus

- Valor digitado com vírgula e milhar (`1.500,00`, `150`, `150,00`): deve gravar `1500` e `150`. Texto inválido ou vazio: erro claro, não grava.
- Vencimento já passado ao cadastrar: aceita, e a lista mostra como VENCIDO.
- Número de boleto repetido: erro amigável ("já existe um boleto com esse número"), não erro técnico do banco.
- Marcar como pago sem escolher banco: bloqueado. Desfazer pagamento limpa `paid_at` e `banco`.
- "Hoje" calculado na data local do usuário (não UTC), para um boleto que vence hoje não aparecer como vencido.

Cada item acima recebe um teste manual na Task 4 ou Task 5, conforme o dono do código.

## Verificação sem framework de testes

O projeto não tem runner de testes (`package.json` só tem `lint` e `build`). Não vou adicionar um agora (YAGNI). A verificação de cada task é: `npx tsc --noEmit`, `npm run lint` e teste manual no navegador (`npm run dev`) para o que o Review Focus pede.

---

### Task 1: Tabela e tipo

**Files:**
- Create: `supabase/contas_pagar.sql`
- Modify: `types/index.tsx` (acrescentar ao fim do bloco de tipos, antes de `STATUS_COBRANCA`)

**Interfaces:**
- Produces: `IBoleto` (ver abaixo), exportado de `@/types`.

- [ ] **Step 1: Criar `supabase/contas_pagar.sql`**

Idempotente, no mesmo estilo de `supabase/employees.sql`: `create table if not exists public."ESTOQUE_boleto"` com as colunas do spec, `enable row level security` e a policy `for all to anon, authenticated using (true) with check (true)` dentro do mesmo bloco `do $$ ... pg_policy ... $$`.

- [ ] **Step 2: Rodar o SQL no Supabase**

Ação do usuário: colar `supabase/contas_pagar.sql` no SQL editor do Supabase. Esperado: "Success. No rows returned".

- [ ] **Step 3: Acrescentar `IBoleto` em `types/index.tsx`**

```ts
export interface IBoleto {
  id: string;
  numero: string;
  empresa: string;
  vencimento: string; // YYYY-MM-DD
  valor: number;
  paid_at: string | null; // null = em aberto
  banco: string;
  created_at?: string;
  updated_at?: string;
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros.

---

### Task 2: Regras puras

**Files:**
- Create: `utils/boletos.ts`

**Interfaces:**
- Produces:
  - `type StatusBoleto = 'PAGO' | 'VENCIDO' | 'VENCE_EM_BREVE' | 'EM_ABERTO'`
  - `statusBoleto(boleto: IBoleto, hoje: string): StatusBoleto` — `hoje` é `YYYY-MM-DD`. Pago se `paid_at`; vencido se `vencimento < hoje`; vence em breve se `vencimento` está entre `hoje` e `hoje + 7 dias` (inclusive); senão em aberto.
  - `hojeLocal(): string` — data local do usuário em `YYYY-MM-DD` (não usar `toISOString`, que é UTC).
  - `parseValor(texto: string): number | null` — aceita `1.500,00`, `1500,5`, `150`. Retorna `null` se vazio ou inválido. Arredonda para 2 casas.
  - `BANCOS_SUGERIDOS: string[]` — Banco do Brasil, Bradesco, Caixa, Itaú, Santander, Sicoob, Sicredi, Nubank, Inter.

- [ ] **Step 1: Implementar `statusBoleto` e `hojeLocal`**

A comparação é de strings `YYYY-MM-DD` (ordem lexicográfica funciona). Somar 7 dias com `Date` local, depois formatar em `YYYY-MM-DD` com a data local.

- [ ] **Step 2: Implementar `parseValor`**

Remover os pontos de milhar, trocar vírgula por ponto, converter e checar `Number.isFinite` e valor maior que zero. Escolha da implementação: uma linha de regex ou `replace` basta.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros.
Verificação manual: durante a Task 4, conferir no navegador os casos do Review Focus de valor e de vencimento.

---

### Task 3: Hook `useBoletoManager`

**Files:**
- Create: `hooks/useBoletoManager.ts`

**Interfaces:**
- Consumes: `IBoleto`, `parseValor`, `hojeLocal` (Tasks 1 e 2).
- Produces (retorno do hook):
  - `loading`, `error`, `boletos: IBoleto[]`
  - `searchTerm`, `setSearchTerm`, `filteredBoletos: IBoleto[]`
  - `selectedId: string | 'new' | null`, `setSelectedId`
  - `formData: BoletoFormData`, `setFormData`, `handleSelect(boleto: IBoleto | 'new')`
  - `saveBoleto(): Promise<string | null>` — retorna mensagem de erro ou `null`.
  - `deleteBoleto(): Promise<string | null>`
  - `markPaid(banco: string): Promise<string | null>`
  - `undoPaid(): Promise<string | null>`
- `BoletoFormData = { numero: string; empresa: string; vencimento: string; valor: string; banco: string }`. `valor` é texto digitado, convertido com `parseValor` ao salvar.

- [ ] **Step 1: Estrutura do hook**

Copiar o esqueleto de `hooks/useEmployeeManager.ts` (fetch com `setTimeout`, `handleSelect`, `save`, `delete`, `filtered` com `useMemo`). Diferenças:
- Tabela `ESTOQUE_boleto`, ordenação do fetch por `vencimento` ascendente.
- `saveBoleto`: converte `valor` com `parseValor`; se `null`, retorna "Valor inválido.". Se o `insert`/`update` falhar com código `23505` (unique), retorna "Já existe um boleto com esse número.". Empresa e número em maiúsculas com `trim()`.
- `markPaid(banco)`: se `banco.trim()` vazio, retorna "Escolha o banco do pagamento.". Senão faz `update({ paid_at: new Date().toISOString(), banco: banco.trim().toUpperCase() }).eq('id', selectedId)`, recarrega e retorna `null`.
- `undoPaid()`: `update({ paid_at: null, banco: '' })`.
- `filteredBoletos`: busca por número ou empresa. Ordem: em aberto primeiro por `vencimento` ascendente; depois pagos por `paid_at` descendente. Ordenar aqui, não no fetch.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

---

### Task 4: Página `/contas-pagar`

**Files:**
- Create: `app/contas-pagar/page.tsx`
- Create: `app/contas-pagar/page.module.css` (copiar de `app/cadastro/funcionarios/page.module.css` e acrescentar classes de status: `.badgeVencido`, `.badgeBreve`, `.badgeEmAberto`, `.badgePago`; e de bloco de pagamento: `.paymentBox`)

**Interfaces:**
- Consumes: `useBoletoManager` (Task 3), `statusBoleto`, `hojeLocal`, `BANCOS_SUGERIDOS` (Task 2), `IBoleto` (Task 1), `AdminPasswordModal`, `HeaderInput`, `PageLayout`, `useToast` (já existentes).

- [ ] **Step 1: Lista lateral**

`Sidebar` com `HeaderInput` (título "Contas a pagar", busca por número ou empresa). Cada item: empresa (maiúsculas), linha com número · vencimento dd/mm/aaaa · valor em R$, e um badge com o status de `statusBoleto`. Botão "+ Novo boleto" embaixo.

- [ ] **Step 2: Ficha (leitura e edição)**

Mesmo modelo de `cadastro/funcionarios/page.tsx`: começa em leitura, botão "Editar", "Salvar" pede senha (`AdminPasswordModal`), "Excluir" pede senha. Campos: NÚMERO, EMPRESA, VENCIMENTO (`type="date"`), VALOR (texto, ex.: "1.500,00").

- [ ] **Step 3: Bloco de pagamento**

Para boleto já salvo:
- Em aberto: botão **Marcar como pago** abre o bloco com o campo BANCO (`<input list="bancos-sugeridos">` + `<datalist>` com `BANCOS_SUGERIDOS`) e o botão **Confirmar pagamento**, que chama `markPaid`. Sem senha.
- Pago: texto "Pago em dd/mm/aaaa · banco X" e botão **Desfazer pagamento**, que chama `undoPaid`. Sem senha.

- [ ] **Step 4: Verificar no navegador**

Run: `npm run dev`, abrir `/contas-pagar`.
Checar, um a um, os itens do Review Focus:
- Cadastrar com valor "1.500,00" e depois "150": confere na lista.
- Cadastrar com número repetido: mensagem amigável.
- Cadastrar com vencimento de ontem: aparece VENCIDO.
- Vencimento de hoje: aparece VENCE EM BREVE, não VENCIDO.
- Marcar como pago sem banco: bloqueado. Com banco: vira PAGO e mostra o banco. Desfazer: volta a em aberto.
- Busca por número e por empresa.

Expected: todos os itens se comportam como descrito. Se algum falhar, corrigir na task dona do código e repetir a verificação.

---

### Task 5: Atalho na home

**Files:**
- Modify: `app/page.tsx` (array `secoes`, lista de seções)

**Interfaces:**
- Consumes: rota de Task 4.

- [ ] **Step 1: Acrescentar seção**

Nova seção "Contas a pagar" logo após "Operação do dia", com um item `{ title: 'Boletos', path: '/contas-pagar', icon: <Receipt size={24} /> }`. Importar `Receipt` do `lucide-react` (já é dependência).

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`, `npm run lint`, e `npm run build`
Expected: sem erros. Abrir a home no navegador e conferir a nova seção e o clique que leva a `/contas-pagar`.

---

## Fim

Depois da Task 5: rodar `npm run build` uma última vez. Relatar ao usuário o que foi testado e o que não foi (teste manual com dados reais). Não commitar sem o usuário pedir.
