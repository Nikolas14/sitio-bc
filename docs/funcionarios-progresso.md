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
- Uma lista por semana (segunda a domingo). A data escolhida na barra lateral leva à segunda-feira da semana.
- Barra lateral: semana, **Tem na semana** (botões Frango e Boi, que registram se a semana tem cada abate), busca de funcionário (sem limite de resultados, com rolagem), caixinhas **Frango** e **Boi** ("Vai em", já marcadas por padrão) e o botão **Adicionar à lista**.
- Área principal: lista da semana em ordem alfabética. Cada linha tem os botões **Frango**, **Boi** e **Remover**. Quem não vai em nenhum abate sai da lista.
- **Zerar lista**: pede confirmação e tira todo mundo da lista da semana. A frequência já lançada é mantida.
- Cada ação grava direto no banco. Não há botão de salvar nesta tela.
- Impressão (botões "Imprimir tudo", "Imprimir frango" e "Imprimir boi"): 30 linhas por página. Frango tem a coluna Recebeu frango; tudo e boi não têm.

### Frequência (`/funcionarios/frequencia`)
- Mostra só quem está na lista de chamada da semana. A barra lateral mostra os abates da semana.
- **Valor da diária (R$)**: duas caixas de texto, uma para Frango e outra para Boi. Aceita "150", "150,00" ou "1.500,00". Vazio fica sem valor. Os valores não são gravados: o total é calculado na hora e some quando a página é recarregada ou a semana muda.
- Etiquetas Frango e Boi em cada linha.
- Uma linha por abate em que a pessoa está na lista: **Frango** e **Boi**, cada um com **Falta** e **Presente**. Assim dá para faltar no frango e ir no boi na mesma semana.
- Botão **Recebeu frango** à esquerda. Aparece só para quem foi no frango. Quando não aparece, um espaço reservado mantém o alinhamento.
- Quem está na lista de um abate começa como Presente nele. Marcar Falta no frango desmarca o recebimento de frango.
- Total por pessoa: soma das diárias dos abates em que foi, menos **R$ 10,00** se foi no frango e recebeu frango. Aparece abaixo das etiquetas, por exemplo "Total R$ 140,00 · desc. frango R$ 10,00".
- **Extra (R$)**: caixa de texto em cada linha, para valor extra da pessoa no dia. Soma ao total (também de quem não foi). Aceita negativo, por exemplo "-20". Aparece no total e no resumo como "Extras". Não é gravado.
- Resumo: na lista, presentes, faltas, receberam frango, descontos (frango) e total a pagar.
- Impressão (botão "Imprimir relatório", na barra lateral, abaixo de "Salvar frequência"): relatório de pagamento só de quem foi (presente) na lista do dia, com Nº, Nome, Abate, Recebeu frango, Total, Pix e Obs. 30 linhas por página. Cabeçalho com data, pessoas, presentes, faltas, total a pagar e as diárias usadas. Os valores são os da tela no momento da impressão.
- **Salvar frequência** grava presença e recebimento. Não altera a lista de chamada.

### Histórico (`/funcionarios/historico`)
- Escolhe-se um funcionário e aparecem as semanas em que esteve na lista, os abates (Frango, Boi ou os dois), a situação de cada abate (presente, falta ou sem lançamento) e se recebeu frango.
- Resumo: semanas na lista, presenças e faltas (contadas por abate), e percentual de presença real.

## Banco (projeto `estoque-sitio`)

- **`ESTOQUE_employee`**: cadastro. Colunas usadas: `name`, `group_name`, `phone`, `cpf`, `rg`, `pix_key`, `notes`. As colunas antigas `pix_type`, `bank`, `nickname`, `sex` e `active` continuam existindo, sem uso.
- **`ESTOQUE_employee_attendance`**: uma linha por funcionário e semana (chave única; `work_date` é a segunda-feira). Colunas: `confirmed` (está na lista), `frango` e `boi` (abates da pessoa na semana), `received_chicken`, `present_frango` e `present_boi` (true, false ou null, um por abate).
- **`ESTOQUE_abate_day`**: uma linha por semana (`work_date` é a segunda-feira). Colunas `frango` e `boi` dizem se a semana tem cada abate. `signed_at` é antiga e não é usada.
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
- Uma lista por semana, com frango e boi por pessoa. Frango e boi são em dias separados dentro da semana, e quem vai em um costuma ir no outro. A presença é lançada por abate, para registrar quem faltou num e foi no outro.
- A semana começa na segunda-feira. Datas digitadas em qualquer dia da semana caem na lista dessa semana.
- Não há fechamento semanal: a impressão semanal é só uma visão.
- Lista e frequência ficam em telas separadas, com a frequência partindo da lista.

## Pendências
1. **Fechamento e pagamento**: o total do dia já é calculado na Frequência (diárias por abate em que a pessoa foi, menos o desconto de R$ 10,00 de quem recebeu frango). As diárias são digitadas e não gravadas. Se o fechamento precisar dos valores depois, decidir como guardá-los.
2. **Fechamento semanal** (segunda a domingo), com extras positivos e negativos, folha para impressão com nome, valor e Pix, e registro de pagamento. Não começou.
3. **Datas antigas movidas para a segunda-feira**: as listas de 11/11, 17/11 e 24/11 viraram as semanas de 09/11, 16/11 e 23/11. Cada uma com frango e boi registrados.
4. **Frequência com quem não está na lista**: hoje só aparece quem foi adicionado na lista. Se precisar lançar presença de quem não estava, dá para permitir.
5. ~~**Histórico**: mostrar abate e recebimento de frango por data.~~ Feito: a tela mostra os abates, a situação de cada um e o recebimento de frango.
6. **Registro de teste**: o grupo "1 E 2" do NIKOLAS OHANA precisa ser ajustado ou o registro apagado.
7. **Coluna `ESTOQUE_abate_day.signed_at`**: sem uso. Remover quando você decidir.

8. **Senhas do escritório e do galpão**: a versão antiga tinha, mas não existe mais nesta branch.
9. **Testes no navegador**: a impressão (quebra de página, colunas, alinhamento dos botões), a rolagem da busca e o fluxo completo ainda não foram testados na tela.
10. **Fora deste módulo**: o advisor do Supabase marcou como crítico que `ESTOQUE_product_details` está sem RLS. Não foi alterado.

## Como rodar e conferir
- `npm run dev` e abrir `http://localhost:3000/funcionarios/lista-chamada`.
- Checagem de código: `npx tsc --noEmit` e `npx eslint app/funcionarios hooks components/SearchSelect`.
