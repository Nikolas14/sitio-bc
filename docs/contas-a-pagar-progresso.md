# Contas a pagar: progresso

Branch: `feat/contas-a-pagar` (a partir de `master`).
Tela: `/contas-pagar`. Link na home, seção "Contas a pagar".
Design: `docs/superpowers/specs/2026-11-23-contas-a-pagar-design.md`. Plano: `docs/superpowers/plans/2026-11-23-contas-a-pagar.md`.

## O que existe hoje

### Tabela
- `ESTOQUE_boleto` no Supabase (projeto `estoque-sitio`), criada e com RLS ligado (política aberta para `anon` e `authenticated`, como nos outros cadastros).
- Colunas: `numero` (único), `empresa`, `vencimento` (date), `valor` (numeric 12,2), `paid_at` (timestamptz, null = em aberto), `banco`, `created_at`, `updated_at`.
- Script em `supabase/contas_pagar.sql` (idempotente). Já aplicado.

### Cadastro (topo da tela)
- Formulário "Novo boleto" numa linha: EMPRESA, NÚMERO, VALOR, VENCIMENTO e Adicionar.
- Cadastro novo não pede senha.
- EMPRESA é um dropdown de busca com lista fechada (`EMPRESAS` em `utils/boletos.ts`).

### Lista (área principal)
- Todos os boletos em tabela: VENCIMENTO, EMPRESA, NÚMERO, VALOR (à direita), STATUS (centralizado), PAGAMENTO.
- Cabeçalho com quantidade em aberto e total em aberto.
- Clicar numa linha abre a ficha em janela.

### Ficha (janela)
- Leitura por padrão. Botão Editar.
- Editar e excluir pedem senha de administrador.
- Marcar como pago: data do pagamento (padrão hoje, editável) + banco (dropdown fechado `BANCOS`). Não pede senha.
- Desfazer pagamento: limpa a data e o banco. Não pede senha.

### Status
- Regras em `utils/boletos.ts` (`statusBoleto`):
  - PAGO: tem `paid_at`.
  - VENCIDO: vencimento anterior a hoje.
  - VENCE EM BREVE: vence de hoje até 7 dias (`DIAS_VENCE_EM_BREVE`).
  - EM ABERTO: demais casos.
- "Hoje" é a data local do usuário.

### Filtros (lateral)
- Busca por número ou empresa.
- Status: Em aberto (padrão, esconde os pagos), Vencidos, Vence em breve, Pagos, Todos.
- Link "N pagos ocultos · mostrar" quando o filtro é Em aberto.
- Empresa: dropdown com "Todas as empresas" como padrão.
- Os filtros combinam entre si.

### Regras de validação
- Número e empresa obrigatórios, sem ser só espaços.
- Valor aceita `1.500,00`, `150` e `150,00`. O ponto é sempre separador de milhar.
- Número repetido: mensagem "Já existe um boleto com esse número."
- Pagamento precisa de data e banco.

## Commits
- `d7732a1` feat: contas a pagar de boletos com pagamento e banco
- `5511515` feat: lista de boletos na área principal com cadastro no topo
- `dd4310a` feat: empresa e banco em lista fechada com busca
- `444efe0` feat: data do pagamento manual, dropdowns com todas as opções e alinhamento da tabela
- Filtros, correção do hover e este documento: commit seguinte a `444efe0`.

## Pendências
- Teste no navegador com dados reais, passando por: cadastro, número repetido, vencimento de ontem e de hoje, marcar como pago sem banco e com banco, desfazer, busca, cada filtro e a abertura pela home.
- Página de configurações do sistema para editar `EMPRESAS` e `BANCOS` (hoje ficam no código).
- Lint: `npm run lint` já falha em `master` com 2 erros fora deste trabalho (`app/cobranca/components/ControlPanel/ControlPanel.tsx:46` e `app/lista_preco/page.tsx:98`).
- Segurança (fora deste trabalho): a tabela `ESTOQUE_product_details` está com RLS desligado. O Supabase marca isso como crítico.

## Ajustes deferidos (menores)
- Valor inválido só é avisado depois de digitar a senha, na edição.
- Campo de banco aceita Enter duas vezes e grava duas vezes (inofensivo).
- Status "hoje" não atualiza se a página ficar aberta depois da meia-noite.
- Valor na ficha em leitura sem separador de milhar (`R$ 1500,00`), diferente da lista.
