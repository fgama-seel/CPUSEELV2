# Plano de Implementação — SEEL Engenharia: Custos Indiretos, Relatórios Executivos e Melhorias de Navegação

Plano detalhado para atender às quatro demandas solicitadas, incluindo os novos requisitos de **Nível de Estrutura de Tópicos (Outline Level)** e **ID Exclusiva (Unique ID)** do Microsoft Project.

---

## 1. Executive Summary & Technical Scope

### 1.1 Contexto e Objetivos
1. **Menu Lateral Retrátil (Sidebar Compacta/Colapsável):**
   * Transformar a barra lateral em um componente recolhível com botão estilo sanduíche/hambúrguer no topo (recolhe de `w-64` para `w-18` no desktop, com ícones e tooltips intuitivos, e suporte a fechamento em dispositivos móveis).
   * Remover a listagem vertical de CPUs do menu lateral, deixando o sidebar focado na seleção de Obra, navegação entre Abas e botões rápidos. A busca, filtro e seleção detalhada de CPUs passam a residir exclusivamente na aba **"Tabela de CPUs"**.
2. **Sequência da Planilha de Quantidades (PQ):**
   * Adicionar a propriedade `sequencia?: number` na estrutura de dados da `CPU` e no Firestore.
   * Exibir uma coluna destacada na tabela de CPUs para visualização da ordem original (1, 2, 3, 4...).
   * Permitir ordenação imediata pela sequência natural da PQ, além de manter suporte à importação/edição dessa sequência.
3. **Gestão Abrangente de Custos Indiretos:**
   * **Classificação de CPU:** Adicionar o campo `isCustoIndireto?: boolean` na CPU. Quando marcado, o custo total dessa CPU é somado automaticamente à composição de Custo Indireto da obra, bloqueando edição manual arbitrária e evitando divergências orçamentárias.
   * **Nova Aba "Custos Indiretos":** Criar uma aba robusta com 5 submódulos baseados nos PDFs e planilhas enviados:
     * *Mão de Obra Indireta (Adm Local):* Gerência, engenharia, planejamento, QSMS, encarregados, topografia, motoristas com salários, encargos e alocação mensal.
     * *Equipamentos Indiretos:* Carros 4x4, ônibus, vans, muncks, caminhões-pipa com mensalidades e combustível.
     * *Instalação e Operação de Canteiro:* Serviços preliminares, containers, escritórios, vestiários, energia, água, vigilância armada/não armada.
     * *Itens Diversos & Consultorias:* Projetos executivos, ensaios de concreto, topografia, consultorias ambientais, softwares e informática.
     * *Taxas Comerciais & Corporativas (% sobre faturamento / BDI):* Custo comercial, seguros de risco de engenharia, taxa de portal, contingências, administração central.
   * **Totalização Automática no Resumo:** O "Custo Indireto Total" do Resumo do Contrato passa a ser a soma de:
     $$\text{Custo Indireto Total} = \sum \text{CPUs marcadas como Indiretas} + \sum \text{Itens de Custos Indiretos Globais da Obra}$$
4. **Relatórios Gerenciais Executivos e Cronograma MS Project:**
   * **Nova Aba "Relatórios Gerenciais":** Dashboard executivo apresentando:
     * *Curva S de Desembolso Financeiro:* Gráfico temporal mês a mês com custo previsto acumulado e distribuição mensal.
     * *Histograma de Recursos Humanos:* Quantitativo de profissionais diretos e indiretos alocados ao longo dos meses de obra.
     * *Indicadores de Turnover e Horas:* Taxa de rotatividade estimada e consumo de homem-hora.
     * *Resumo Financeiro Executivo:* Custo Direto vs. Custo Indireto vs. Margem Operacional.
   * **Módulo de Importação de Cronograma MS Project (Excel / CSV) com WBS e ID Exclusiva:**
     * Suporte completo para **Nível de Estrutura de Tópicos (Outline Level 1, 2, 3...)** para renderizar a árvore hierárquica (tarefas-resumo e subtarefas com recuo e expansão/recolhimento).
     * Suporte para **ID Exclusiva (Unique ID)** do MS Project, garantindo rastreabilidade imutável mesmo se linhas forem inseridas ou reordenadas no Project.
     * Reconhecimento automático dos cabeçalhos em português e inglês:
       * `ID Exclusiva` / `ID exclusiva` / `Unique ID` / `UID`
       * `Nível de tópicos` / `Nível da estrutura de tópicos` / `Outline Level` / `Level`
       * `EDT` / `WBS` / `Código da Estrutura`
       * `Nome da Tarefa` / `Task Name` / `Nome`
       * `Início` / `Start` / `Data Inicial`
       * `Término` / `Finish` / `Data Final`
       * `Duração` / `Duration`
       * `Custo` / `Cost` / `Trabalho` / `Recursos`

---

## 2. Domain-Specific Design & Anti-Slop Directive

* **Arquitetura Visual:** Aplicação densa de engenharia e gestão de contratos civis/geotecnia (estilo SaaS industrial de alta densidade).
* **Paleta de Cores Corporativa:**
  * Fundos: `slate-900` para barra lateral e barras de título; `slate-100` / `slate-50` para telas de trabalho; `white` com bordas sutis `slate-200` para cartões de dados.
  * Acentos e Destaques: `blue-600` para ações primárias; `emerald-600` para valores de venda e lucro; `amber-600` para custos indiretos e contingências; `rose-600` para alertas e exclusões; `indigo-600` para tarefas e cronogramas.
* **Hierarquia WBS / EAP do MS Project:**
  * Renderização com recuo visual progressivo conforme o `nivelEstruturaTopicos` (ex: Nível 1 em negrito com fundo sutil, Nível 2 com `pl-6`, Nível 3 com `pl-10`).
  * Ícones colapsáveis (`ChevronDown` / `ChevronRight`) para tarefas resumo que possuem subtarefas subordinadas.
* **Disciplina Anti-Slop:**
  * Nada de badges tipo "pílula" estática flutuante com gradientes roxos genéricos.
  * Valores numéricos, IDs e datas estritamente formatados com `font-mono` e `tabular-nums` para alinhamento vertical perfeito.
  * Altura de linhas compacta ($36\text{px}$ a $40\text{px}$) para máxima densidade de dados em telas desktop.

---

## 3. Component Hierarchy & State Architecture

```
src/
├── types.ts                              # Atualizado com sequencia em CPU, isCustoIndireto, IndiretosConfig e TarefaCronograma
├── App.tsx                               # Controle do estado colapsado do Sidebar, novas abas 'indiretos' e 'relatorios'
├── components/
│   ├── Sidebar.tsx                       # Barra lateral retrátil (toggle hambúrguer), sem listagem de CPUs
│   ├── AbaTabelaCPUs.tsx                 # Coluna de Sequência PQ (1, 2, 3..), Toggle Custo Indireto, busca integrada
│   ├── AbaResumo.tsx                     # Custo Indireto Total calculado automaticamente (bloqueado para edição arbitrária)
│   ├── AbaCustosIndiretos.tsx            # NOVA: Módulos de Adm Local, Equipamentos, Canteiro, Diversos e Taxas Corporativas
│   ├── AbaRelatoriosGerenciais.tsx       # NOVA: Curva S, Histograma de Mão de Obra, Turnover e Árvore MS Project
│   ├── ModalImportarCronogramaProject.tsx# NOVO: Importador do MS Project com ID Exclusiva e Nível de Tópicos
│   └── ModalImportarBD.tsx               # Suporte a leitura de sequencia PQ
```

### 3.1 Contratos de Dados Atualizados (`types.ts`)
* **Extensão na `CPU`:**
  ```ts
  sequencia?: number; // Número da sequência da Planilha de Quantidades (ex: 1, 2, 3...)
  isCustoIndireto?: boolean; // Se true, computa no Custo Indireto Total da Obra
  ```
* **Novas Estruturas para Custos Indiretos da Obra (`types.ts`):**
  ```ts
  export interface ItemCustoIndireto {
    id: string;
    categoria: 'ADM_LOCAL_MO' | 'EQUIPAMENTOS_INDIRETOS' | 'CANTEIRO' | 'DIVERSOS_CONSULTORIA' | 'TAXAS_CORPORATIVAS';
    codigo?: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    precoUnitario: number;
    custoTotal: number;
    distribuicaoMensal?: Record<string, number>; // mês (ex: "jan/26") -> quantidade ou percentual
  }

  export interface TaxasCorporativasObra {
    custoComercialPerc: number; // ex: 0.35%
    seguroRiscoEngenhariaPerc: number; // ex: 0.75%
    custoAdmUNsPerc: number; // ex: 0.30%
    taxaPortalPerc: number; // ex: 0.00%
    riscoInflacionarioPerc: number; // ex: 1.59%
    riscoContingenciasPerc: number; // ex: 1.21%
  }
  ```
* **Estrutura para Cronograma MS Project com ID Exclusiva e Nível de Tópicos (`types.ts`):**
  ```ts
  export interface TarefaCronograma {
    id: string;                    // Identificador interno no app
    idExclusiva?: number | string; // Unique ID do MS Project (ex: 104, 205)
    idLinha?: number;              // ID sequencial da linha (1, 2, 3...)
    wbs?: string;                  // EDT / WBS (ex: "1.2.4")
    nivelEstruturaTopicos: number; // Outline Level do MS Project (1 para fases principais, 2 para subfases, etc.)
    nome: string;                  // Nome da Tarefa
    inicio: string;                // Data de Início
    termino: string;               // Data de Término
    duracaoDias: number;           // Duração em dias
    percentualConcluido?: number;  // % Avanço físico (0 a 100%)
    custoPrevisto?: number;        // Custo orçado da tarefa
    recursos?: string;             // Recursos ou equipes atribuídas
    isResumo?: boolean;            // Se true, é uma tarefa-mãe (resumo de nível superior)
    expandido?: boolean;           // Controle de expansão/recolhimento da árvore
  }
  ```

---

## 4. Step-by-Step Implementation Plan

### Etapa 1: Modelos de Dados e Tipagens (`src/types.ts`)
* Adicionar `sequencia` e `isCustoIndireto` na interface `CPU`.
* Criar interfaces para os submódulos de custos indiretos (`ItemCustoIndireto`, `TaxasCorporativasObra`, `IndiretosObraConfig`).
* Criar interfaces para o cronograma do MS Project com `idExclusiva` e `nivelEstruturaTopicos`.
* Atualizar a interface `Obra` para persistir `itensCustosIndiretos`, `taxasCorporativas` e `cronogramaTarefas`.

### Etapa 2: Sidebar Retrátil com Botão Hambúrguer (`src/components/Sidebar.tsx` e `src/App.tsx`)
* Criar estado `isCollapsed` (largura total `w-64` vs. recolhida `w-18`).
* Adicionar botão sanduíche/hambúrguer no topo do sidebar com transição suave e ícone de recolhimento (`Menu` / `PanelLeftClose`).
* Remover a seção de busca e lista vertical de CPUs do Sidebar, tornando o menu muito mais limpo e focado na navegação da obra.
* Incluir os botões das novas abas: **"Custos Indiretos"** e **"Relatórios & Cronograma"**.

### Etapa 3: Coluna de Sequência e Toggle de Custo Indireto na Tabela de CPUs (`src/components/AbaTabelaCPUs.tsx`)
* Inserir coluna `Seq.` (com ordenação crescente/decrescente pela sequência original da PQ).
* Adicionar badge/botão clicável em cada linha de CPU para classificar como "Direto" ou "Indireto".
* Criar destaque visual com badge âmbar quando a CPU for indireta.
* Permitir editar a sequência numérica diretamente na tabela ou na edição da CPU.

### Etapa 4: Bloqueio de Edição Manual e Cálculo Automático no Resumo (`src/components/AbaResumo.tsx`)
* Remover campo de input editável no Custo Indireto Total do Resumo.
* Integrar o cálculo em tempo real:
  * Soma de todas as CPUs com `isCustoIndireto === true`.
  * Soma de todos os itens cadastrados na aba de Custos Indiretos.
  * Exibir detalhamento visual com link para a aba de Custos Indiretos.

### Etapa 5: Criação da Nova Aba "Custos Indiretos" (`src/components/AbaCustosIndiretos.tsx`)
* Sub-abas organizadas conforme os arquivos anexados:
  1. **Mão de Obra Indireta (Adm Local):** Gerente de Contrato, Engenheiros, Planejamento, Apontador, QSMS, etc.
  2. **Equipamentos Indiretos:** Carros 4x4, ambulâncias, munck, caminhão pipa, vans.
  3. **Instalação e Operação de Canteiro:** Tapumes, vestiários, containers, gerador, luz/força, segurança armada.
  4. **Diversos & Consultorias:** Projetos, topografia, controle tecnológico de concreto/solo, licenças e softwares.
  5. **Taxas e BDI Corporativo:** Percentuais comerciais, seguros de engenharia e contingências (conforme imagem da planilha).
* Ações de adicionar novo item, editar e excluir com persistência no Firestore e cache local.

### Etapa 6: Criação da Aba "Relatórios Gerenciais" e Módulo MS Project (`src/components/AbaRelatoriosGerenciais.tsx` e `ModalImportarCronogramaProject.tsx`)
* **Parser Inteligente do MS Project (Excel / CSV):**
  * Reconhecimento das colunas: `ID Exclusiva` (Unique ID), `Nível de Estrutura de Tópicos` (Outline Level), `EDT/WBS`, `Nome da Tarefa`, `Início`, `Término`, `Duração`, `Custo`.
  * Estruturação automática em árvore com recuo proporcional ao nível de tópico.
* **Visualização da Estrutura de Tópicos:**
  * Botões "Expandir Todos" e "Recolher Todos".
  * Linhas de resumo destacadas em negrito com badges de ID Exclusiva e Nível.
* **Curva S Financeira:** Gráfico com evolução mensal acumulada e barras de custo mensal.
* **Histograma de Mão de Obra:** Gráfico de efetivo por função e mês.
* **Indicadores Executivos:** Custo Direto %, Custo Indireto %, Índice de BDI Efetivo e Turnover estimado.

### Etapa 7: Verificação, Lint e Testes
* Executar `lint_applet` e `compile_applet`.
* Testar colapso da barra lateral, ordenação por sequência da PQ, alternância direto/indireto, cálculo automático no Resumo e importação do MS Project com ID Exclusiva e Nível de Tópicos.

---

## 5. Verification & Testing Plan

1. **Teste de Barra Lateral Retrátil:**
   * Clicar no botão hambúrguer para recolher o menu para `w-18`.
   * Verificar se os ícones continuam acessíveis com tooltips de navegação.
   * Expandir novamente e confirmar a ausência da lista antiga de CPUs.
2. **Teste de Sequência na Tabela de CPUs:**
   * Verificar se as CPUs possuem número sequencial da PQ (1, 2, 3..).
   * Clicar no cabeçalho "Seq." e ordenar de forma crescente e decrescente.
3. **Teste de Classificação de Custo Indireto:**
   * Alternar uma CPU (ex: "Transporte ETA e Montagem") para Custo Indireto.
   * Ir na aba "Resumo" e checar se o valor foi somado ao Custo Indireto Total e subtraído do Custo Direto, sem possibilidade de edição manual arbitrária.
4. **Teste da Aba Custos Indiretos:**
   * Abrir a aba "Custos Indiretos", navegar pelas sub-abas (Mão de Obra Indireta, Canteiro, Equipamentos, Diversos, Taxas).
   * Inserir ou editar um custo e verificar a repercussão instantânea no Resumo do Contrato.
5. **Teste da Aba Relatórios Gerenciais & Importador MS Project:**
   * Importar uma planilha de exemplo do MS Project contendo `ID Exclusiva`, `Nível de tópicos`, `Nome`, `Início` e `Término`.
   * Verificar se a árvore hierárquica é renderizada com recuos corretos e badges de ID Exclusiva.
   * Testar a expansão/recolhimento das tarefas de nível superior e a exibição da Curva S.
