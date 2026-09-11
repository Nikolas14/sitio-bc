# Memória — Pontos a corrigir (Sitio BC)

> Análise feita em 09/09/2026. Retomar estes pontos numa próxima sessão.
> Contexto completo em `golem do nikolas/AGENTS.md`.

## Forças do projeto (não mexer)
- Arquitetura limpa: `app/`, `components/`, `hooks/`, `utils/`, `types/`.
- Hooks de dados padronizados (`useXxx()` → dados + `loading` + `refresh`).
- Domínio bem tipado em `types/index.tsx` (`ITransaction`, `IOperation`, `IProduct`) e status de cobrança.
- Fluxo de venda sólido (código de barras EAN-13, F10, foco no input, kg por categoria).
- Trava de edição por status + pagamento parcial com auto-status em `useCobrancaManager`.
- Recibo via `html-to-image` com `pixelRatio: 3`.

## Pontos fracos — prioridade ALTA (corrigir)
1. **Segurança — senha de admin no cliente**
   - Arquivo: `hooks/useProductManager.ts` (função `handleAdminConfirm`, linha ~96).
   - Senha comparada no front-end; qualquer pessoa com a anon key escreve direto no Supabase.
   - Fix: configurar **RLS** no Supabase + mover escritas críticas para **RPC** (postgres function). Remover senha do client. Decidir estratégia de auth (ex.: `@supabase/auth-helpers`, magic link, ou jeton de serviço na API route).
2. **Side effect dentro de `useMemo`**
   - Arquivo: `hooks/useCobrancaManager.ts` (linha ~43: `setDiscount(discountValue)` dentro da memoização).
   - Fix: calcular desconto puro no `useMemo` e sincronizar estado via `useEffect` ou derivar direto.

## Pontos fracos — prioridade MEDIA (corrigir depois)
3. **`any` vazando tipagem**
   - `app/mov/venda/page.tsx` (`items: any[]`), `hooks/useTransactionItems.ts`, `hooks/usePickingSummary.ts` (`e8: any[]`), `hooks/useProjections.ts`.
   - Fix: tipar com interfaces de `@/types` (ex.: criar `ISaleItem`, `IProjection`).
4. **Escrita multi-tabela sem transação**
   - Venda (`app/mov/venda/page.tsx` ~`finalizarVenda`): insert em `ESTOQUE_transaction` e depois `ESTOQUE_operation`.
   - Fix: envolver em RPC com `transaction` no Postgres (relacionado ao item 1).
5. **Erros inconsistentes**
   - Mistura de `alert()`, `console.error` e erros silenciados entre arquivos.
   - Fix: padronizar tratamento de erro (ex.: estado de erro + toast).

## Pontos fracos — prioridade BAIXA (melhorias)
6. **Deps de hooks incompletos**
   - `useCobrancaManager.ts:31` usa `trans` e dep é `[trans?.status]`; handle F10 em `app/mov/venda/page.tsx` declara `finalizarVenda` que não está nas deps.
   - Fix: revisar `useMemo`/`useEffect` deps (eslint já cobre — rodar `npm run lint`).
7. **Sem testes** — nenhum framework configurado.
8. **Sem `.env.example`** — documentar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
9. **Barcode hardcoded** — `utils/barcodeParser.ts`: posições fixas e divisor 100 sem checksum; documentar padrão da balança.
10. **`DiscountInput` com `key={discountPercent}`** — remontagem forçada em `app/mov/venda/page.tsx`.
11. **Imports inconsistentes** — mistura `@/components/...` e `../../../components/...`.
12. **Hooks quase duplicados** — `useCobranca`, `useCobrancas`, `useCobrancaManager`.
13. **Commits sem mensagem semântica** — padronizar padrão (ex.: conventional commits).

## Checklist para a próxima sessão
- [ ] Abrir `.env` e confirmar credenciais do Supabase
- [ ] Mapear tabelas e criar RPCs de venda/cobrança no painel Supabase
- [ ] Implementar item 1 (RLS + senha fora do client)
- [ ] Rodar `npm run lint` após cada bloco de mudanças