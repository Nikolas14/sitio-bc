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
