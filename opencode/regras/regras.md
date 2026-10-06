# Regras — Sitio BC

> Checklist objetivo para qualquer agente que editar este repositório.
> Contexto completo em `opencode/contexto/AGENTS.md`; estado atual em `opencode/memoria/memoria.md`.

## Segurança

- **NUNCA** criar/recriar `NEXT_PUBLIC_ADMIN_PASSWORD`. A senha é `ADMIN_PASSWORD`,
  server-only, lida só em `app/api/admin/verify/route.ts`.
- **NUNCA** commitar `.env*`. `.env.example` só com nomes/placeholders, **sem valores reais**.
- **NUNCA** colar segredos (URL, chave, senha) em código, README ou `opencode/`.
- **NUNCA** alterar o esquema Supabase sem o dono. Sem RLS ainda — trate como pendência conhecida.
- Novas validações de senha devem passar por `utils/adminAuth.ts` → `POST /api/admin/verify`.

## Código

- UI em **português**; identificadores em **inglês**.
- Páginas `'use client'`; sem lógica de banco direto na página além do que já existe —
  preferir hooks `useXxx()` que retornam `{ dados, loading, error, refresh }`.
- Banco só via `supabase` de `@/api/supabase`; tipos de `@/types`.
- Nomes de produto em **MAIÚSCULAS** (`toUpperCase().trim()`).
- Erros: retornar `error: string | null` no hook e exibir `useToast()` na UI.
  **Proibido `alert()`** e `console.error` ativo.
- Fetch em `useEffect` com padrão `.then()` (regra `react-hooks/set-state-in-effect`, React 19).
- **Não adicionar dependências** de UI/notificação (toast e modais são próprios).
- Sem comentários desnecessários. Logs de debug em português existentes podem ficar; não criar novos.
- Manter `page.module.css` por rota; componentes por rota em `app/<rota>/components/`.

## Tipos

- Tipar tudo; evitar `any` (ponto fraco histórico já corrigido — não reintroduzir).
- Joins do Supabase: cast `as unknown as T[]` (client sem tipos gerados).
- Centralizar interfaces compartilhadas em `types/index.tsx` quando possível.

## Verificação obrigatória

```bash
npm run lint          # deve ficar 0/0
npx tsc --noEmit      # deve ficar limpo
```

Rodar depois de qualquer alteração relevante, antes de finalizar.

## Git

- **Só commitar quando o dono pedir explicitamente.**
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`.
- Commitar em blocos lógicos (não misturar lint + feature + segurança num commit só).
- Antes de commitar: revisar `git status` e `git diff`; nunca incluir `.env*`.

## Pesagens

- Leitura de etiqueta de balança e gravação de peso seguem `opencode/regras/pesagens.md`.

## Arquivos de agente

- Contexto/regras/memória dos agentes ficam em `opencode/`.
- Ao concluir uma sessão relevante, atualizar `opencode/memoria/memoria.md` (o que foi feito + pendências).
- Nunca duplicar regras em vários lugares; `AGENTS.md` = contexto, `regras.md`/`pesagens.md` = checklist,
  `memoria.md` = histórico/estado.
