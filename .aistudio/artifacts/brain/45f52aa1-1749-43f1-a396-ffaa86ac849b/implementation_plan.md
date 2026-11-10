# Plano de Implementação Revisado: Importação MS Project (.mpp / .xml), Matriz Simplificada & Ciclo de Caixa

## Análise de Viabilidade Técnica: Arquivo `.mpp` do Microsoft Project

### Natureza do formato `.mpp`
O arquivo `.mpp` é um formato binário proprietário da Microsoft, fechado e encriptado internamente (baseado em OLE Structured Storage). No ambiente web moderno (navegador / JavaScript / Node.js sem runtime Java externo como MPXJ), a leitura direta de arquivos `.mpp` binários é instável ou sujeita a quebra entre versões do Project (2013, 2016, 2019, 2021, Project 365).

### A Melhor Solução Nativa: `.xml` do MS Project
O próprio Microsoft Project possui um formato nativo oficial e aberto: **XML do Microsoft Project (`.xml`)**.
- No MS Project: basta ir em **Arquivo $\rightarrow$ Salvar Como $\rightarrow$ Formato XML do MS Project (*.xml)**.
- O arquivo `.xml` exporta **100% da estrutura do projeto**: ID Exclusiva, EDT/WBS, Níveis de tópicos (OutlineLevel), Datas de início/término, durações, tarefas resumo vs tarefas operacionais, recursos e alocações.
- O sistema web pode ler esse `.xml` com **precisão cirúrgica e instantânea**, sem necessidade de converter para Excel, sem risco de corrupção e sem erros de cabeçalho de colunas.

---

## 1. Arquitetura de Importação na Aba "Cronograma Executivo"

O importador da aba Cronograma aceitará de forma unificada:
1. **XML Nativo do MS Project (`.xml`)**: O usuário salva direto do Project como XML e arrasta para a aplicação. O sistema extrai automaticamente tarefas, durações, datas e WBS sem nenhuma intervenção manual.
2. **Planilha Excel / CSV (`.xlsx`, `.csv`)**: Formato tabular já existente para cópia e colagem rápida de dados.
3. **Instrução Visual com 2 Passos no Project**: Guia simples em tela mostrando como salvar em XML no MS Project em 3 segundos.

---

## 2. Simplificação da Matriz PQ vs. Cronograma

- **Filtro Direto para Linhas de Serviço**: Exibição focada nas tarefas operacionais da EAP (ocultando tarefas de resumo/títulos que não recebem alocação direta).
- **Grid de Trabalho Ágil**:
  - Exibição de cada linha executiva: `ID Exclusiva`, `EDT`, `Nome do Serviço`, `Quantidade Física`, `Duração (DU)`.
  - Recursos da PQ já alocados com chips visuais.
  - Botão **"Distribuir Recurso"** por linha: modal rápido para selecionar o item da PQ e definir quantidade direta ou aplicar regra de cálculo.
  - Painel Superior de Saldos da PQ: acompanhamento em tempo real de quantidade orçada, alocada e saldo pendente.

---

## 3. Cópia dos Recursos de Volta para o MS Project

- Geração automática da string padronizada:
  `3010102[3,58 un];3010103[104,98 M];3010107[4169,47 KG]...`
- Botão para copiar individualmente por tarefa e botão para **copiar tabela completa de recursos** para colar em massa na coluna "Nomes dos Recursos" do Project.
- Suporte ao Roll-Up para tarefas de Nível 7 (Pacote/Bloco).

---

## 4. Projeção de Produção, Faturamento e Caixa ($M \rightarrow M+1 \rightarrow M+2$)

- **Parâmetros Globais Editáveis**:
  - Mês de Produção $M$;
  - Mês de Faturamento $M + X$ (padrão: $M+1$);
  - Mês de Recebimento $M + Y$ (padrão: $M+2$).
- **Tabela DRE & Fluxo de Caixa com Edição Mês a Mês**:
  - O usuário pode ajustar manualmente qualquer valor projetado de faturamento ou recebimento nos meses do contrato para refletir o cronograma financeiro real e a curva de desembolso.

---

## 5. Sequência de Implementação

1. **Parser de XML do MS Project (`src/lib/msprojectXmlParser.ts`)**: Suporte nativo para carregar arquivos `.xml` exportados pelo MS Project.
2. **Aba Dedicada "Cronograma Executivo" (`src/components/AbaCronogramaExecutivo.tsx`)**: Upload de `.xml`, `.xlsx`, `.csv` e tabela de recursos, projeção e cópia de recursos.
3. **Aba "Relatórios Gerenciais" (`src/components/AbaRelatoriosGerenciais.tsx`)**: Desmembramento da visualização executiva, curva S e histogramas.
4. **Matriz PQ Simplificada (`src/components/AbaMatrizPQ.tsx`)**: Grid exclusivo de linhas de serviço com ação rápida de alocação.
5. **Ciclo de Caixa M / M+1 / M+2**: Campos configuráveis e edição mês a mês na tabela de fluxo de caixa.
6. **Compilação e Verificação**: Testes via `compile_applet` e `lint_applet`.
