# Regras — Pesagens (balança / EAN-13)

> Checklist específico de leitura, peso e gravação de pesagens.
> Contexto em `opencode/contexto/AGENTS.md`; regras gerais em `opencode/regras/regras.md`;
> estado atual em `opencode/memoria/memoria.md`.

## Fonte da verdade

- Toda leitura de etiqueta de balança passa por `parseScaleBarcode` em `utils/barcodeParser.ts`.
- **Nunca** reimplementar a parseada em páginas/componentes — sempre importar `@/utils/barcodeParser`.
- Fluxos que usam pesagem: `/mov/venda` (OUT) e `/mov/entrada` (IN).

## Padrão do código (EAN-13 de balança)

- 13 dígitos, **começa com `2`**; qualquer outro formato retorna `null`.
- Posições (1-indexado): `d1` = prefixo `2`; `d4..d7` = ID do produto; `d8..d12` = peso bruto;
  `d2`, `d3` e `d13` (dígito final) **não** são usados.
- Peso em kg = peso bruto ÷ **100** (3 casas decimais, ex.: `00150` → `1.50 kg`).
- O parser **não** valida checksum/dígito verificador — não assumir essa garantia.

## Unidades e precisão

- Peso é sempre número em **kg** (`number`), nunca string.
- Gravar o peso **sem arredondar** antes de persistir.
- Exibição: item do carrinho com **3 casas** (`toFixed(3)`); totais/pills/resumos com **2 casas** (`toFixed(2)`).
- Preço é **por kg**: subtotal do item = `price * weightKg`.

## Persistência (Supabase)

- `ESTOQUE_operation.quant` recebe o **peso em kg** (não unidade): `type: 'OUT'` na venda, `type: 'IN'` na entrada.
- `ESTOQUE_transaction.total_kg` = soma dos pesos dos itens.
- Venda grava `total_price` como valor **bruto** (desconto em `discount_percent`), status `PENDENTE`.
- Entrada grava status `ENTRADA`.
- Escritas passam pelo cliente `@/api/supabase` (ainda sem RLS — ver pendência em `AGENTS.md`).

## Interação (bipagem)

- Ao bipar: validar que o produto existe (via `useInventory`); se não, erro em português, limpar o input e manter o foco.
- Item válido: adicionar ao carrinho, limpar o input e devolver o foco (`inputRef.current?.focus()`).
- F10 só finaliza quando `items.length > 0` e `!loading`.
- Nomes de produto gravados em **MAIÚSCULAS** (`toUpperCase().trim()`).

## Não fazer

- **Não** alterar posições/divisor do parser nem o prefixo `2` sem confirmar o padrão físico da balança com o dono.
- **Não** trocar peso por quantidade/contagem nem arredondar para facilitar UI.
- **Não** adicionar validação de checksum por conta própria — é melhoria pendente, decidir com o dono.
- **Não** criar novas libs para leitura de código de barras.

## Pendências relacionadas

- Padrão da balança ainda hardcoded (posições fixas, divisor 100, sem checksum).
- Ausência de validação de faixa de peso (peso `0` ou absurdo) e de produto repetido.
