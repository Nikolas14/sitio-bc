# Funcionários: progresso

Branch: `feat/funcionarios-frequencia` (criada a partir de `fix/custos-adicionais-zero-inicial`).
Commits: `022df1f` (cadastro + frequência inicial), `b6e9ef2` (lista de chamada por abate e impressão), e o commit desta atualização.

## O que existe hoje

### Menu
- **Cadastros → Funcionários**: `/cadastro/funcionarios`
- **Funcionários** (categoria nova):
  - `/funcionarios/lista-chamada`
  - `/funcionarios/frequencia`
  - `/funcionarios/historico`

### Cadastro (`/cadastro/funcionarios`)
- Campos: NOME, GRUPO, TELEFONE, CPF, RG, CHAVE PIX, OBS.
- GRUPO é um dropdown com **1**, **2** e **Nenhum**. Os valores gravados são `ABATE 01`, `ABATE 02` e vazio.
- A ficha abre só para leitura. O texto pode ser copiado. O botão **Editar** libera o formulário, e **Cancelar** descarta as mudanças.
- Salvar e excluir pedem a senha de admin (mesmo padrão do cadastro de clientes).
- A chave Pix não é convertida para maiúsculas, porque chaves aleatórias são case-sensitive.

### Lista de chamada (`/funcionarios/lista-chamada`)
- Barra lateral: data, busca de funcionário (sem limite de resultados, com rolagem), caixinhas **Frango** e **Boi** ("Vai em", já marcadas por padrão) e o botão **Adicionar à lista**.
- Área principal: lista do dia em ordem alfabética. Cada linha tem os botões **Frango**, **Boi** e **Remover**. Quem não vai em nenhum abate sai da lista.
- **Zerar lista**: pede confirmação e tira todo mundo da lista do dia. A frequência já lançada é mantida.
- Cada ação grava direto no banco. Não há botão de salvar nesta tela.
- Impressão (botões "Imprimir tudo", "Imprimir frango" e "Imprimir boi"):
  - 30 linhas por página. As linhas que sobram ficam em branco. O total aparece em cada página.
  - Frango: colunas Nº, Nome, Recebeu frango e Presença (com a mesma largura).
  - Tudo e boi: colunas Nº, Nome e Presença.

### Frequência (`/funcionarios/frequencia`)
- Mostra só quem está na lista de chamada do dia.
- Filtro: Todos, Frango, Boi.
- **Valor da diária (R$)**: duas caixas de texto, uma para Frango e outra para Boi. Aceita "150", "150,00" ou "1.500,00". Vazio fica sem valor. Os valores não são gravados: o total é calculado na hora e some quando a página é recarregada ou a data muda.
- Etiquetas Frango e Boi em cada linha.
- Botões na ordem: **Recebeu frango**, **Falta**, **Presente**. O "Recebeu frango" aparece só para quem foi no frango e está presente. Quando não aparece, um espaço reservado mantém o alinhamento.
- Quem está na lista começa como Presente. Marcar Falta desmarca o recebimento de frango.
- Total por pessoa (só para quem está presente): soma das diárias dos abates em que foi, menos **R$ 10,00** se recebeu frango. Aparece abaixo das etiquetas, por exemplo "Total R$ 140,00 · desc. frango R$ 10,00". Constante `DESCONTO_FRANGO` em `utils/diarias.ts`.
- **Extra (R$)**: caixa de texto em cada linha, para valor extra da pessoa no dia. Soma ao total (também de quem não foi). Aceita negativo, por exemplo "-20". Aparece no total e no resumo como "Extras". Não é gravado.
- Resumo: na lista, presentes, faltas, receberam frango, descontos (frango) e total a pagar.
- Impressão (botão "Imprimir relatório", na barra lateral, abaixo de "Salvar frequência"): relatório de pagamento só de quem foi (presente) na lista do dia, com Nº, Nome, Abate, Presença, Recebeu frango, Total, Pix e Obs. 30 linhas por página. Cabeçalho com data, pessoas, presentes, faltas, total a pagar e as diárias usadas. Os valores são os da tela no momento da impressão.
- **Salvar frequência** grava presença e recebimento. Não altera a lista de chamada.

### Histórico (`/funcionarios/historico`)
- Escolhe-se um funcionário e aparecem as datas, se confirmou e a situação (presente, falta ou sem lançamento).
- Resumo: confirmações, presenças e faltas, e percentual de presença real.
- Ainda não mostra os abates nem o recebimento de frango.

## Banco (projeto `estoque-sitio`)

- **`ESTOQUE_employee`**: cadastro. Colunas usadas: `name`, `group_name`, `phone`, `cpf`, `rg`, `pix_key`, `notes`. As colunas antigas `pix_type`, `bank`, `nickname`, `sex` e `active` continuam existindo, sem uso.
- **`ESTOQUE_employee_attendance`**: uma linha por funcionário e data (chave única). Colunas: `confirmed` (vai em algum abate), `frango`, `boi`, `received_chicken`, `present` (true, false ou null).
- **`ESTOQUE_abate_day`**: guardava a assinatura da lista. Não é usada. A tabela continua no banco, sem apagar.
- As tabelas novas têm RLS com acesso para `anon` e `authenticated`, no mesmo padrão de clientes.
- SQL de referência: `supabase/employees.sql` e `supabase/attendance.sql`.

## Dados importados
- 111 funcionários da aba `FUNCIONARIOS_DADOS` da planilha, com os valores como estão (só sem espaços nas pontas).
  - Grupo 1 (ABATE 01): 36
  - Grupo 2 (ABATE 02): 61
  - Sem grupo: 14
- Registro de teste **NIKOLAS OHANA**, mantido. O grupo dele é `1 E 2`, um valor que não existe no dropdown.
- Confirmações de 11/11 que existiam antes da separação por abate foram marcadas como frango e boi.
- Campos de telefone, CPF e Pix da planilha têm formatos inconsistentes e observações misturadas (ex.: "N EXISTE", "NÃO TEM TEL."). Ficou para depois, por decisão sua.

## Decisões tomadas
- A assinatura da lista foi removida. Não há registro de quem assinou nem trava de edição.
- O salvamento de presença fica só na Frequência.
- Frango e boi são escolhidos por pessoa e por data, não por dia.
- Lista e frequência ficam em telas separadas, com a frequência partindo da lista.

## Pendências
1. **Fechamento e pagamento**: o total do dia já é calculado na Frequência (diárias por abate em que a pessoa foi, menos o desconto de R$ 10,00 de quem recebeu frango). As diárias são digitadas e não gravadas. Se o fechamento precisar dos valores depois, decidir como guardá-los.
2. **Fechamento semanal** (segunda a domingo), com extras positivos e negativos, folha para impressão com nome, valor e Pix, e registro de pagamento. Não começou.
3. **Confirmar a regra "frango e boi em dias diferentes"**. Hoje a tela permite que a mesma pessoa vá nos dois abates na mesma data.
4. **Frequência com quem não está na lista**: hoje só aparece quem foi adicionado na lista. Se precisar lançar presença de quem não estava, dá para permitir.
5. **Histórico**: mostrar abate e recebimento de frango por data.
6. **Registro de teste**: o grupo "1 E 2" do NIKOLAS OHANA precisa ser ajustado ou o registro apagado.
7. **Tabela `ESTOQUE_abate_day`**: sem uso. Remover quando você decidir.
8. **Senhas do escritório e do galpão**: a versão antiga tinha, mas não existe mais nesta branch.
9. **Testes no navegador**: a impressão (quebra de página, colunas, alinhamento dos botões), a rolagem da busca e o fluxo completo ainda não foram testados na tela.
10. **Fora deste módulo**: o advisor do Supabase marcou como crítico que `ESTOQUE_product_details` está sem RLS. Não foi alterado.

## Como rodar e conferir
- `npm run dev` e abrir `http://localhost:3000/funcionarios/lista-chamada`.
- Checagem de código: `npx tsc --noEmit` e `npx eslint app/funcionarios hooks components/SearchSelect`.
