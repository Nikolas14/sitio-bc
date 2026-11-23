# Instruções para o Claude neste projeto

## Banco de dados (Supabase)

- Projeto do sistema: `estoque-sitio` (ref `ifosphpesybwpegbdgqb`, região sa-east-1).
- O Claude pode criar e alterar estruturas de tabelas nesse projeto pelo MCP do Supabase (`apply_migration`), incluindo colunas, índices e políticas de RLS.
- Antes de alterar uma tabela existente, conferir a estrutura atual com `list_tables`.
- Preferir migrações idempotentes (`create ... if not exists`, `add column if not exists`), no mesmo estilo dos arquivos em `supabase/`.
- Tabelas do sistema usam o prefixo `ESTOQUE_`.
- Não aplicar nada no projeto `junik` (outro projeto da mesma conta).

## Convenções

- Interface em português.
- Commits só quando o usuário pedir.
