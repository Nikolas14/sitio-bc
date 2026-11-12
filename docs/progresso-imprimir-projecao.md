# Progresso: impressão de pedido e desconto por cliente

Data: 12/11/2026. Para retomar depois do almoço.

## Já no master (PR #3 mesclado, `8dd8b4e`)
- **Painel de disponibilidade (`/projecao/saldo`):** ordena por nome do produto por padrão. Clicar no cabeçalho ordena por aquela coluna, alternando crescente e decrescente.
- **Desconto por cliente:** coluna `discount_percent` em `ESTOQUE_customer` (0 a 100), com campo "DESCONTO (%)" no cadastro. Ao escolher o cliente na venda, o desconto entra automaticamente e continua editável.
- **Aeroporto na cobrança (`/cobranca/[id]`):** coluna `customer_id` em `ESTOQUE_transaction`, gravada na venda. A cobrança mostra o aeroporto de destino abaixo do nome do cliente. Vendas antigas não têm vínculo.
- **Rótulos:** "SÉRIE" e "Série" trocados por "CUPOM" na cobrança.

As duas colunas novas já estão aplicadas no banco `estoque-sitio`.

## Branch `feat/imprimir-projecao` (ainda sem commit de código)
- **Nova rota `/projecao/imprimir`:** item "Imprimir pedido" no menu principal (`app/page.tsx`).
  - Layout igual ao da Nova Projeção: sidebar com cliente, identificador e botão "IMPRIMIR PEDIDO" (`ButtonFinish`); painel à direita com barra escura, dados do cliente e caixa de texto para colar o pedido.
  - O texto colado é impresso como está, sem leitura de linhas nem casamento com produtos.
  - A folha impressa tem o cabeçalho de projeção, a referência, os dados do cliente e o pedido.
  - Não grava nada no banco.
- **Desconto na `/projecao`:** ao escolher o cliente, o desconto dele entra no campo "Desconto Aplicado (%)", editável. O "PREÇO PROJETADO" já sai com o desconto. Na impressão, a referência mostra "Desconto X%".
- **Desconto na `/projecao/imprimir`:** linha DESCONTO nos dados do cliente, quando houver. Não há cálculo, porque a tela não tem preços.
- O desconto da projeção não é gravado, porque `ESTOQUE_projection` não tem campo para isso.

## Pendências
1. **Testar no navegador:** `/projecao/imprimir` (layout, impressão, folha), o desconto na `/projecao` (preço e impressão) e a venda com desconto e aeroporto na cobrança.
2. **Commitar** o código de `feat/imprimir-projecao` e abrir o PR.
3. **Decidir** se o desconto da projeção deve ser gravado. Isso exige uma coluna nova em `ESTOQUE_projection`.
4. **Confirmar o rótulo** do "Id" que você quis trocar por "Cupom" (só troquei "Série" na cobrança).
5. **Recibo impresso:** o aeroporto aparece só na tela da cobrança, não no `PrintTemplate`.
6. **Vendas antigas:** sem `customer_id`, não mostram aeroporto.
7. **Módulo de funcionários:** pendências na `docs/funcionarios-progresso.md`, na branch `feat/funcionarios-frequencia`.

## Avisos fora deste trabalho
- `ControlPanel.tsx` (já no master) tem um erro do eslint, `react-hooks/set-state-in-effect`.
- O advisor do Supabase marca como crítico que `ESTOQUE_product_details` está sem RLS. Não foi alterado.
- A tabela `ESTOQUE_abate_day` não é usada.
- O `master` local estava 12 commits atrás do `origin/master` antes de atualizar.
