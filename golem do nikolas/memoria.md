# Memória — Sitio BC

> Análise original em 09/09/2026. Sessão de trabalho em 22/09/2026 registrada abaixo.
> Contexto completo em `golem do nikolas/AGENTS.md`.
> NUNCA colar segredos (URLs, keys, senhas) neste arquivo nem no README — só nomes de variáveis.

## Sessão 22/09/2026 — o que foi feito (concluído)
- **Lint zerado**: de 42 errors + 14 warnings para **0/0** (`npm run lint`). `tsc --noEmit` limpo. `next build` passa.
- **`any` eliminado**: tipados `CobrancaTable` (`ITransaction[]`), `ControlPanel`/`ReceiptCard`/`PrintTemplate` (`FinancialSummary`, `IReceiptItem[]`), `estoque/page` (`GrupoItem`), `mov/venda` + `mov/entrada` (`CartItem` exportado de `InventoryCart`), `projecao/*` (`AvailabilityItem`, `IProjection`/`IProjectionItem`, `CartItem`), hooks (`ITransaction`, `IOperation`, `IProduct`, `IReceiptItem`, payloads locais).
- **Side effect no `useMemo` corrigido** (item 2 da análise original): `setDiscount` saiu do `useMemo` em `useCobrancaManager.ts`; sincronizado via `useEffect`. `isLocked` com deps `[trans]`.
- **`react-hooks/set-state-in-effect`**: efeitos de fetch reescritos com padrão `.then()` (a regra do React 19 sinaliza `setState` síncrono em efeito). Arquivos: `useAvailability`, `usePickingSummary`, `useProjectionsList`, `useProjectionsManager`, `useTransactions`, `useTransactionItems`, `useProductManager`.
- **`react-hooks/immutability`**: `ProductHistoryTable` reescrito com `reduce` sem `let` mutável.
- **`exhaustive-deps`**: `finalizarVenda`/`finalizarEntrada` viraram `useCallback` e entraram nas deps do F10.
- **Erros padronizados** (item 5): criado `components/Toast/` (`ToastProvider` + `useToast()`, sem deps novas), integrado em `app/layout.tsx`. Zero `alert()` e zero `console.error` ativo no código (só resta um `console.log` comentado em `useInventory.ts:24`).
  - Hooks retornam `error: string | null` e `boolean`/`string|null` nas ações; páginas exibem toast.
  - `gerarImagem` e `registrarPagamento` retornam `Promise<boolean>`.
- **Senha admin fora do bundle** (parte do item 1): criado `POST /api/admin/verify/route.ts` (compara com `ADMIN_PASSWORD` server-only via `timingSafeEqual`) + `utils/adminAuth.ts` (`verifyAdminPassword()`). Migrados: `cadastro/produto`, `cadastro/cliente`, `transacoes`, `projecao/lista`.
- **Senha para cliente** (pedido do dono): salvar e excluir cliente exigem `AdminPasswordModal` (mesma senha admin). `useCustomerManager` expõe `saveCustomer()`/`deleteCustomer()` sem `confirm()` nativo.
- **`.env.local`**: criado com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `ADMIN_PASSWORD` (server-only, SEM prefixo `NEXT_PUBLIC_`). `NEXT_PUBLIC_ADMIN_PASSWORD` removido do código e do `.env.local`. Na Vercel: apagar a var `NEXT_PUBLIC_*` de senha e cadastrar `ADMIN_PASSWORD` como server-only.
- **Ajustes de build**: `ReceiptSummary` aceita `subWithDiscount?` (não usado); `ProjectionSidebarNav`/`ProjectionDetail` usam interfaces mínimas locais; `DeleteItem.product_id` opcional; casts de join do Supabase via `as unknown as` (o client sem tipos gerados infere joins como array).
- **Warnings diversos**: removidos imports/vars sem uso, `<img>` → `next/image` em `lista_preco`.

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

## O que FALTA — próximas sessões (por prioridade)
1. **RLS + RPCs (segurança real, restante do item 1)**: a senha saiu do bundle, MAS as escritas ainda partem do cliente com a anon key — quem souber o endpoint escreve direto. Mapear tabelas e criar RPCs de venda/cobrança/estoque no painel Supabase + ativar RLS. Só mexer no esquema com o dono.
2. **Escrita multi-tabela sem transação** (item 4): `finalizarVenda`/`finalizarEntrada` fazem insert em `ESTOQUE_transaction` e depois `ESTOQUE_operation` — falha no meio deixa dado órfão. Resolver junto com as RPCs.
3. **Unificar tipos duplicados**: `FinancialSummary` repetido em `ControlPanel`, `ReceiptCard`, `PrintTemplate`; `IProjection` (hook) x `IProjectionItem` (lista); `AvailabilityRow` (hook) x `AvailabilityItem` (componente). Centralizar em `types/index.tsx`.
4. **Higiene restante (itens 8–12)**: criar `.env.example` (só nomes, sem valores); `DiscountInput` com `key={discountPercent}` em `mov/venda`; imports relativos `../../../` → `@/`; documentar padrão do `barcodeParser`; avaliar unificar `useCobranca`/`useCobrancas`/`useCobrancaManager`.
5. **Testes** (item 7): nenhum framework configurado.
6. **Commits** (item 13): 36 arquivos modificados e não commitados nesta sessão — revisar `git status`/`git diff` e commitar em blocos (lint, toast, senha servidor, cliente) com conventional commits.

## Decisões técnicas a lembrar
- Toast próprio em vez de lib externa (evitar deps novas).
- Fetch em `useEffect` usa `.then()` em vez de chamar `fetchX()` com `setLoading(true)` síncrono (exigência da regra `set-state-in-effect` do React 19).
- Casts Supabase: `as unknown as T[]` nos joins (client sem tipos gerados). Se um dia gerar os tipos do banco (`supabase gen types`), remover esses casts.
- `ADMIN_PASSWORD` é server-only e lida SOMENTE em `app/api/admin/verify/route.ts`. Nunca referenciar `ADMIN_PASSWORD` em código cliente nem recriar `NEXT_PUBLIC_ADMIN_PASSWORD`.
- `.env.local` / `.env*` estão no `.gitignore` — nunca commitar.

## Checklist para a próxima sessão
- [ ] Abrir `.env` e confirmar credenciais do Supabase
- [ ] Mapear tabelas e criar RPCs de venda/cobrança no painel Supabase
- [ ] Implementar item 1 (RLS + senha fora do client)
- [ ] Revisar `git status`/`git diff` e commitar os arquivos em blocos lógicos
- [ ] Criar `.env.example` (nomes apenas)
- [ ] Ativar RLS nas tabelas `ESTOQUE_*`
- [ ] Rodar `npm run lint` + `npx tsc --noEmit` após cada bloco

## Registro da sessão — 15/09/2026

### Clientes
- Criada a rota `/cadastro/cliente`, seguindo o padrão `Sidebar + Main` do projeto.
- Cadastro permite criar, editar, excluir e pesquisar clientes por nome, CPF, telefone ou cidade.
- Campos baseados na aba `CADASTRO` da planilha: nome, CPF, endereço, CEP, telefone, cidade, aeroporto, retirada, CPF da retirada, retirada alternativa, CPF da retirada alternativa e observações.
- Tabela Supabase prevista: `ESTOQUE_customer`. O esquema está em `supabase/customers.sql`, com `id` UUID e timestamps automáticos.
- Nome e todos os campos textuais são convertidos para maiúsculas antes de salvar; os campos também aparecem em maiúsculas na tela.
- Para importar clientes existentes, exportar a aba `CADASTRO` como CSV UTF-8 e mapear para os campos snake_case da tabela. Não importar `id`, `created_at` ou `updated_at`.

### Impressão de pedidos
- Criada a rota `/pedidos`, disponível no dashboard como `Imprimir pedido`.
- Fluxo: selecionar um cliente, colar o texto recebido em um campo livre e imprimir uma prévia com os dados do cliente e os itens linha a linha.
- O texto do pedido não é salvo no Supabase nesta primeira versão.
- Produtos podem ser livres/diferentes do cadastro de produtos; não fazer parsing rígido do texto.
- Depois que a janela de impressão é encerrada (`afterprint`), o cliente, a busca e o texto do pedido são limpos.

### Próximo módulo: funcionários e folha de pagamento
- Cadastro de funcionários com os campos: `NOME` (obrigatório), `ABATE 01`, `ABATE 02`, `TELEFONE`, `CPF`, `RG`, `TIPO PIX`, `CHAVE PIX`, `BANCO`, `OBS`, `APELIDO` e `SEXO`.
- `ABATE 01` é o grupo de WhatsApp do frango; `ABATE 02` é o grupo de WhatsApp do boi.
- Frango e boi acontecem em dias diferentes; o funcionário pode trabalhar em apenas um ou nos dois.
- Diária padrão para ambos: R$ 150,00.
- No dia do frango, se o funcionário receber um frango, descontar R$ 10,00 da diária.
- Frequência deve registrar somente se trabalhou ou não.
- Fechamento semanal, com possibilidade de valor extra para mais ou menos.
- Saída desejada: folha de pagamento para impressão.
- Ainda confirmar: se extra é manual positivo/negativo, se terá justificativa, se deve registrar o recebimento do frango por dia, colunas exatas da folha e se os funcionários existentes serão importados.
