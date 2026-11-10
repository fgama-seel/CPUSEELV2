# Plano de Implementação Revisado: Histograma 100% Real por Composições, Verbas Mensais, Trava de Linha & MS Project

Este plano especifica a arquitetura e as regras para o novo histograma dinâmico baseado estritamente nas composições reais (CPUs e Custos Indiretos) e nas tarefas do cronograma XML do MS Project, com suporte a verbas mensais, trava de segurança por linha e detecção de desvios.

## 1. O que foi pedido
- **Origem dos Dados 100% Real (Sem Dados Fictícios):**
  - **Mão de Obra Indireta:** Extraída estritamente dos insumos classificados como indiretos/apoio nas CPUs e na tabela de Custos Indiretos da obra.
  - **Mão de Obra Direta:** Extraída estritamente dos insumos do tipo Mão de Obra classificados como diretos dentro das CPUs atreladas às tarefas do cronograma.
  - **Equipamentos:** Extraídos estritamente dos insumos do tipo Equipamento (diretos e indiretos).
- **Tratamento de Verbas Mensais (`MES` / `GB`):**
  - Distribuir a quantidade unitariamente mês a mês no decorrer da vigência da tarefa/contrato.
  - Se houver sobra de saldo (frações/resto), acumular o saldo remanescente no último mês e sinalizar visualmente.
  - Permitir edição manual na célula/mês com campo de observação para redistribuição.
- **Trava de Linha contra Novos Cronogramas (Cadeado):**
  - Adicionar um botão de **Travar Linha (Ícone de Cadeado)** em cada linha de recurso do histograma.
  - Linhas travadas preservam seus valores e ajustes manuais, mesmo se o usuário importar um novo XML de cronograma no MS Project.
- **Cálculo por Produtividade da CPU & Comparativo MS Project (Opção A):**
  - **Dias Teóricos CPU:** $\text{Dias} = \text{Quantidade Alocada} / (\text{prod\_teorica} \times \text{praticabilidade})$.
  - **Alerta de Desvio:** Comparar a duração teórica da CPU com a duração agendada no MS Project (`workingDaysDuration`). Se houver divergência significativo ($> 10\%$), exibir um badge de alerta de desvio.
  - **Nivelamento de Sobreposição:** Em tarefas sobrepostas no mesmo mês, aplicar a trava de capacidade máxima física de equipes/equipamentos para evitar picos irreais.
- **Regra de "Sem Meia Pessoa":**
  - Qualquer fração de horas $> 0$ e $< 189,2\text{ h}$ no mês é convertida para **1 pessoa/máquina**.

---

## 2. Qual o problema
- Atualmente, a visualização do histograma ainda possuía trechos com tabela de referência estática quando faltavam vínculos, em vez de se basear unicamente nas composições (insumos de CPUs e Custos Indiretos) e nas tarefas do MS Project.
- Não existia funcionalidade para travar linhas individualmente e protegê-las contra reimportações de cronogramas.

---

## 3. Opções de Solução

### Opção A (Recomendada - Processamento Estrito por Insumos de CPU + Trava por Cadeado + Alerta de Desvio):
- **Origem Estrita por Insumos:**
  - Varre todas as CPUs e Custos Indiretos da obra ativa.
  - Separa os insumos por `categoria` e `tipo`: MO Indireta, MO Direta e Equipamento.
- **Verba Mensal & Resíduo no Último Mês:**
  - Se o insumo tiver unidade `MES` / `MÊS` / `GB`, calcula $\text{Qtd/Mês} = \text{floor}(\text{QtdTotal} / \text{Meses})$.
  - O resíduo sobra é adicionado no último mês com sinalização de destaque.
- **Trava de Linha por Cadeado (`isLocked`):**
  - Salva o estado `recursosTravados: Record<string, boolean>` no `localStorage` por obra.
  - Ao reimportar o cronograma XML, o algoritmo ignora recálculos para as chaves registradas como `isLocked === true`.
- **Nivelamento de Equipes:**
  - Aplica o teto da capacidade máxima física em frentes simultâneas/sobrepostas.

### Opção B (Distribuição Genérica sem Distinção de Insumo):
- Agrupar apenas o valor financeiro e dividir por um custo médio.
- *Desvantagem:* Perde a rastreabilidade analítica por insumo e função da CPU.

---

## 4. Etapas de Execução

1. **Atualizar Tipos em `src/types.ts`:**
   - Adicionar `recursosHistogramaTravados?: Record<string, boolean>` em `ParametrosFluxoCaixa` ou no estado da obra.
2. **Reformular `GraficoHistogramaBarras.tsx` & `AbaRelatoriosGerenciais.tsx`:**
   - Implementar o motor de extração estrita de insumos das CPUs e Custos Indiretos.
   - Implementar o algoritmo de distribuição de verbas mensais (`MES`/`GB`) com acúmulo de sobra no último mês.
   - Adicionar a coluna de **Trava de Linha (Cadeado)** permitindo congelar/descongelar o recálculo de qualquer função.
   - Adicionar badge de alerta visual de desvio de produtividade (CPU vs MS Project).
   - Garantir que não exista nenhum dado fictício de fallback.
3. **Persistência em Firestore/LocalStorage:**
   - Salvar ajustes manuais de linhas e estado de cadeado por obra.

---

## 5. Como Testar
1. **Verificar Origem 100% Real por Insumos de CPU:**
   - Acesse **Relatórios Gerenciais** $\rightarrow$ **Histograma**.
   - Confirme que a tabela de Mão de Obra Direta e Equipamentos traz unicamente os insumos reais das CPUs cadastradas na obra ativa.
2. **Testar Verba Mensal e Sobra no Último Mês:**
   - Cadastre uma verba mensal (ex.: 5 meses de consultoria para um contrato de 4 meses).
   - Verifique a distribuição unitária nos primeiros meses e o acúmulo do saldo no último mês com a marcação destacada.
3. **Testar Trava por Cadeado contra Importação de Cronograma:**
   - Clique no ícone de **Cadeado** em uma linha para travá-la.
   - Acesse **Cronograma Executivo** e reimporte um novo arquivo XML.
   - Volte ao histograma e confirme que a linha travada manteve exatamente seus valores e não foi sobrescrita.
