# Memória — Sitio BC

> Registro de sessões e estado do projeto para agentes de IA.
> Recriado do zero em **06/10/2026**. Contexto completo em `opencode/contexto/AGENTS.md`.
> NUNCA colar segredos (URLs, chaves, senhas) aqui — só nomes de variáveis.

## Estado do projeto — verificado em 06/10/2026

- `npm run lint` → **0 erros / 0 warnings**.
- `npx tsc --noEmit` → **limpo** (exit 0).
- 16 páginas (`page.tsx`) + 1 API route (`POST /api/admin/verify`) + layout raiz.
- Toda página tem `page.module.css`. Não há `loading.tsx` / `error.tsx` / `not-found.tsx`.
- Sem framework de testes configurado.
- Branch `master`, remoto `https://github.com/Nikolas14/sitio-bc.git`.

## Arquitetura (forte — não mexer)

- Separação limpa: `app/` (rotas) · `components/` (UI) · `hooks/` (dados) · `utils/` · `types/`.
- Hooks de dados padronizados: `useXxx()` → dados + `loading` + `error` + `refresh`.
- Domínio tipado em `types/index.tsx` (`IProduct`, `ICustomer`, `ITransaction`, `IOperation`, `IReceiptItem`).
- Fluxo de venda sólido: EAN-13 de balança, F10, foco no input, kg por categoria.
- Cobrança: trava de edição por status + pagamento parcial com auto-status (`useCobrancaManager`).
- Recibo em imagem via `html-to-image` (`pixelRatio: 3`).
- Erros padronizados: `error` state nos hooks + `useToast()` na UI (sem `alert()`).
- Senha admin validada **no servidor** (`/api/admin/verify` + `timingSafeEqual`); não vai ao bundle.

## Pontos fracos / pendências

### ALTA prioridade

1. **Segurança real do banco (RLS + RPC)** — escritas ainda partem do cliente com a
   anon key (venda, entrada, cobrança, cadastros, projeções). Quem tiver a anon key
   escreve direto. A senha admin é trava operacional.
   - Ação: mapear tabelas, criar **RPCs transacionais** no Postgres e ativar **RLS**.
   - Só mexer no esquema com o dono.
2. **Escrita multi-tabela sem transação** — `finalizarVenda`/`finalizarEntrada` fazem
   insert em `ESTOQUE_transaction` e depois `ESTOQUE_operation`; falha no meio deixa
   dado órfão. Resolver junto com as RPCs.
3. **`.env.example` inseguro** — o arquivo atual contém **valores reais**
   (URL, anon key, `ADMIN_USER`, `ADMIN_PASSWORD`) e cita um `proxy.ts` que **não existe**.
   Mesmo estando no `.gitignore`, deve ser reescrito só com nomes/placeholders e
   alinhado ao README (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`).

### MÉDIA prioridade

4. **Tipos duplicados** — `FinancialSummary` repetido em `app/mov/components` e
   `app/cobranca/components/{ControlPanel,ReceiptCard,PrintTemplate}`; `IProjection`
   (hook `useProjections`) × `IProjectionItem` (hook `useProjectionsList`);
   `AvailabilityRow` (hook) × `AvailabilityItem` (componente). Centralizar em `types/index.tsx`.
5. **Hooks quase duplicados** — `useProjections` / `useProjectionsList` / `useProjectionsManager`
   fazem consultas muito parecidas; `useCobranca` / `useCobrancas` / `useCobrancaManager` idem.
6. **`useHistory` e período `15d`** — o tipo `Period` inclui `'15d'`, mas a lógica só trata
   `3d`/`7d`; `15d` cai no fallback de 30 dias. Alinhar UI × lógica.

### BAIXA prioridade

7. **Testes** — nenhum framework configurado.
8. **Barcode hardcoded** — `utils/barcodeParser.ts` usa posições fixas e divisor 100,
   sem checksum. Documentar o padrão da balança.
9. **`DiscountInput` com `key={discountPercent}`** em `app/mov/venda` força remontagem.
10. **Imports inconsistentes** — mistura `@/components/...` e `../../../components/...`.
11. **Diretórios mortos** — `app/escritorio/fechamento/` e `app/api/environment/verify/`
    estão vazios; remover ou implementar.
12. **Commits** — várias mensagens sem padrão semântico (ex.: `fadaf`, `as`, `hgkgk`).
    Padronizar conventional commits.

## Decisões técnicas a lembrar

- Toast próprio (`components/Toast`) em vez de lib externa — evitar deps novas.
- Fetch em `useEffect` com `.then()` (não chamar `fetchX()` com `setLoading(true)` síncrono),
  por causa da regra `react-hooks/set-state-in-effect` do React 19.
- Casts Supabase: `as unknown as T[]` nos joins. Se um dia gerar tipos do banco
  (`supabase gen types`), remover os casts.
- `ADMIN_PASSWORD` é server-only, lida **somente** em `app/api/admin/verify/route.ts`.
  Nunca referenciar em código cliente nem recriar `NEXT_PUBLIC_ADMIN_PASSWORD`.
- `.env*` no `.gitignore` — nunca commitar.
- Documentos de contexto/regras dos agentes ficam em `opencode/`.

## Fluxo de venda/cobrança — alvo (TODOs)

> Fluxo alvo em 5 estágios documentado em `opencode/fluxos/venda.md`.
> O código hoje tem 4 status: `PENDENTE | ENVIADO | COBRADO | CONCLUIDO`.

- [ ] Criar status `FINALIZADO` (entre `COBRADO` e `CONCLUIDO`) em `types/index.tsx`.
- [ ] Quitação total deve ir para `FINALIZADO`, não direto para `CONCLUIDO`.
- [ ] Nova coluna para **data de conclusão dos pagamentos** (base do CÁLCULO de 1 mês).
- [ ] Job/cron: transação parada 1 mês após quitação vira `CONCLUIDO`.
- [ ] Stepper com 5 passos e labels novos (remover "Isopor" do PENDENTE).
- [ ] **WhatsApp**: integração real de envio da cobrança (hoje só gera/baixa PNG);
      transição `ENVIADO → COBRADO` deve ocorrer no envio.
- [ ] Permitir **transição reversa** de status para correções (hoje trava de mão única).
- [ ] Definir se cria tabela de **histórico de pagamentos** (data/valor/forma).
- [ ] PENDENTE → ENVIADO: frete **não obrigatório** (pode zerar) — garantir na UI/validação.
- [ ] Dar **baixa no estoque** ao lançar a venda (isopor pronto) — hoje só o delete/estorno ajusta.
- [ ] Exigir **cliente vinculado** em toda venda; remover o fallback `VENDA_AVULSA`.
- [ ] Cobrança **sem prazo/vencimento**; nota mantém o conteúdo atual (`PrintTemplate`).

## Checklist para a próxima sessão

- [ ] Confirmar credenciais do Supabase no `.env.local`
- [ ] Reescrever `.env.example` com placeholders (sem valores reais)
- [ ] Mapear tabelas e criar RPCs transacionais de venda/entrada/cobrança
- [ ] Ativar RLS nas tabelas `ESTOQUE_*`
- [ ] Unificar tipos duplicados em `types/index.tsx`
- [ ] Avaliar unificação de hooks duplicados
- [ ] Rodar `npm run lint` + `npx tsc --noEmit` após cada bloco
- [ ] Commitar em blocos lógicos com conventional commits (só quando o dono pedir)
