export type TipoInsumo = 'Material' | 'Mão de Obra' | 'Equipamento' | 'Terceirizado';

export interface AdicionaisMO {
  dissidio?: number; // Dissídio (% sobre salário)
  ajudaDeCusto?: number; // Ajuda de custo (% sobre salário)
  horaExtra?: number; // Hora Extra (% sobre salário)
  adicionalNoturno?: number; // Adicional Noturno (% sobre salário)
  periculosidade?: number; // Periculosidade (% sobre salário)
  insalubridade?: number; // Insalubridade (% sobre salário)
}

export interface ItemMochila {
  id: string;
  seq: number;
  categoria?: 'ALIMENTAÇÃO' | 'TRANSPORTE' | 'UNIFORMES / EPI' | 'ASSISTÊNCIA' | 'ALOJAMENTO' | 'OUTROS' | string;
  descricao: string;
  custo_unit: number;
  valorUnitario?: number;
  unid: string;
  unidade?: string;
  quantidade?: number;
  custoMensal?: number;
  custoHora?: number;
  total: number;
}

export interface MochilaMOInsumo {
  insumoId: string; // ID ou id_insumo do InsumoBase
  insumoCodigo?: string;
  insumoDescricao?: string;
  unidadeBase?: string; // "/mês" ou "h"
  salarioMes?: number; // PrUn. (Salário/mês) ex: 25.000,00
  salarioHora?: number; // PrUn (Salário/h) ex: 132,14
  adicionais?: AdicionaisMO;
  encargoPerc?: number; // % Encargos Sociais ex: 75.0%
  horasMes?: number; // Horas/mês divisor ex: 189.2
  itens: ItemMochila[];
  // Valores calculados
  salarioComAdicionaisHora?: number;
  custoHoraEncargo?: number;
  custoMesMochila?: number;
  prUnBaseSalarioHora?: number; // Salário/h + adicionais
  salarioComEncargoHora?: number; // prUnBaseSalarioHora * (1 + encargoPerc/100)
  totalMensalMochila?: number; // Soma dos itens da mochila
  custoHoraMochila?: number; // totalMensalMochila / horasMes
  salarioEncargoMochilaHora?: number; // salarioComEncargoHora + custoHoraMochila
  atualizadoEm?: string;
  atualizadoPor?: string;
}

export interface ConfigEncargosObra {
  horasMesPadrao: number; // Padrão: 189.2h
  percentualEncargoPadrao: number; // Padrão: 75.0%
  detalhesGrupos?: {
    grupoA?: number; // ex: 16.80% (INSS, FGTS, SESI, SENAI, Sebrae, INCRA)
    grupoB?: number; // ex: 48.20% (Férias, 13º Salário, Repouso Remunerado)
    grupoC?: number; // ex: 4.50% (Aviso Prévio Indenizado, FGTS Rescisão)
    grupoD?: number; // ex: 5.50% (Incidências Cumulativas)
  };
}

export interface MochilaMOConfig {
  horasMesPadrao: number; // Padrão: 189.2h
  percentualEncargoPadrao?: number; // Padrão: 75.0%
  itens: ItemMochila[];
  totalMensal: number;
  custoHoraMochila: number; // totalMensal / horasMesPadrao (R$/h)
  atualizadoEm?: string;
  atualizadoPor?: string;
}

export interface Insumo {
  id?: string;
  id_insumo: string;
  tipo: TipoInsumo;
  descricao: string;
  unid: string;
  coef: number;
  pr_unit: number;
  mochilaIncorporada?: boolean;
  custoMochilaUnit?: number;
  precoBaseMO?: number;
  isMochilaAvulsa?: boolean;
  isMochilaSeparada?: boolean;
}

export interface InsumoBase {
  id: string;
  id_insumo: string;
  obraId?: string;
  tipo: TipoInsumo;
  descricao: string;
  unid: string;
  pr_unit: number;
}

export interface Comentario {
  id: string;
  data: string;
  autor: string;
  texto: string;
}

export interface CPU {
  id: string; // Firestore document ID
  code: string; // E.g. "18010102"
  obraId: string; // Reference to Obra document ID
  sequencia?: number; // Sequência numérica da Planilha de Quantidades (PQ) (1, 2, 3...)
  isCustoIndireto?: boolean; // Se true, o custo desta CPU é somado automaticamente no Custo Indireto Total do contrato
  nome: string;
  unidade: string;
  prod_teorica: number;
  praticabilidade: number;
  horas_dia: number;
  prod_efetiva: number;
  quantidade_prevista: number;
  preco_venda: number;
  vendaDefinida?: boolean; // If true, sale price is fixed manually. If false/undefined, price is calculated as custoUnit * (1 + bdi / 100)
  fator_fcd: number;
  insumos: Insumo[];
  comentarios: Comentario[];
  createdAt?: string;
  updatedAt?: string;
}

export type CategoriaIndireto =
  | 'ADM_LOCAL_MO'
  | 'EQUIPAMENTOS_INDIRETOS'
  | 'CANTEIRO'
  | 'DIVERSOS_CONSULTORIA'
  | 'TAXAS_CORPORATIVAS';

export interface ItemCustoIndireto {
  id: string;
  obraId?: string;
  categoria: CategoriaIndireto;
  idInsumoBase?: string; // FK do insumo no Banco de Insumos
  codigo?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  custoTotal: number;
  dataInicio?: string; // Data de início do recurso indireto (YYYY-MM-DD)
  dataFim?: string; // Data de término do recurso indireto (YYYY-MM-DD)
  combustivelUnitario?: number; // Para veículos/equipamentos
  distribuicaoMensal?: Record<string, number>; // mês (ex: "jan/26") -> quantidade
  observacoes?: string;
}

export interface TaxasCorporativasObra {
  custoComercialPerc: number; // ex: 0.35%
  seguroRiscoEngenhariaPerc: number; // ex: 0.75%
  custoAdmUNsPerc: number; // ex: 0.30%
  taxaPortalPerc: number; // ex: 0.00%
  riscoInflacionarioPerc: number; // ex: 1.59%
  riscoContingenciasPerc: number; // ex: 1.21%
  bdiReferenciaPerc?: number; // ex: 26.42%
  admCentralPerc?: number; // ex: 11.98%
  custoFinanceiroEmpresaPerc?: number; // ex: 2.17%
  custoFinanceiroNegocioPerc?: number; // ex: 0.02%
  lucroPerc?: number; // ex: 12.25%
  impostosPerc?: number; // ex: 9.20%
}

export interface TarefaCronograma {
  id: string;
  idExclusiva?: number | string; // Unique ID do MS Project (imutável)
  idLinha?: number; // ID sequencial da linha no Project (1, 2, 3...)
  wbs?: string; // Código EDT / WBS (ex: "1.1", "1.2.3")
  nivelEstruturaTopicos: number; // Outline Level do MS Project (1, 2, 3...)
  nome: string;
  inicio: string;
  termino: string;
  duracaoDias: number;
  percentualConcluido?: number;
  custoPrevisto?: number;
  recursos?: string;
  isResumo?: boolean;
}

export interface OrcamentoOriginal {
  vendaTotal: number;
  fatDireto: number;
  vendaSemFat: number;
  custoDireto: number;
  custoIndireto: number;
  custoTotal: number;
  pis: number;
  cofins: number;
  iss: number;
  pisPerc?: number;
  cofinsPerc?: number;
  issPerc?: number;
  vendaLiquida: number;
  resultado: number;
  margem: number;
}

export interface Obra {
  id: string;
  codigo: string; // e.g. "966"
  nome: string; // e.g. "Obra 966 - TRANSPORTE ETA"
  cliente: string;
  bdi?: number; // Percentual de BDI (%) ex: 25.0
  custoIndiretoAtual: number;
  faturamentoDiretoAtual: number;
  aliquotasImpostos?: {
    pisPerc: number;
    cofinsPerc: number;
    issPerc: number;
  };
  taxasCorporativas?: TaxasCorporativasObra;
  cronogramaTarefas?: TarefaCronograma[];
  scheduleTasks?: ScheduleTask[];
  allocationLinks?: AllocationLink[];
  pqItems?: PQItem[];
  recursosConfig?: RecursoProjectConfig[];
  parametrosCaixa?: ParametrosFluxoCaixa;
  versoesCronograma?: VersaoCronograma[];
  orcamentoOriginal: OrcamentoOriginal;
  emailsAcesso?: string[];
  mochilaMO?: MochilaMOConfig;
  mochilasMO?: Record<string, MochilaMOInsumo>; // mochilas específicas por insumo ID
  configEncargos?: ConfigEncargosObra;
  createdAt?: string;
}

export type StatusAcesso = 'APPROVED' | 'PENDING' | 'REVOKED';
export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface UserPermission {
  id: string; // Email or UID
  email: string;
  nome: string;
  status: StatusAcesso;
  role: UserRole;
  obrasPermitidas: string[]; // List of Obra IDs or ['*'] for all
  solicitadoEm: string;
  aprovadoPor?: string;
}

export interface ABCInsumoItem {
  id_insumo: string;
  descricao: string;
  unid: string;
  tipo: TipoInsumo;
  qtdTotal: number;
  custoTotal: number;
  percTotal: number;
}

export interface UserAuth {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// ==========================================
// MÓDULO MATRIZ PQ vs CRONOGRAMA & ENGENHARIA REVERSA SEEL/SABESP
// ==========================================

export interface PQItem {
  id: string; // ex: "3010103", "60101021"
  parentId: string | null; // ex: "6010102"
  obraId?: string;
  lote: 'LOTE 1' | 'LOTE 2' | string;
  grupo: string; // ex: "03 - PERFURAÇÕES PARA INJEÇÕES"
  descricao: string;
  unidade: string; // "M", "KG", "M3", "GB", "MES", "un"
  quantidadeOrcada: number;
  precoUnitarioVenda: number;
  precoUnitarioCustoDireto: number; // vindo da CPU, sem BDI/indireto
  isSplitParent?: boolean; // Se true, é cabeçalho de item desmembrado (ex: 6010102)
  splitRatioVenda?: number; // 0.40 para fornecimento ou 0.60 para aplicação
  codigoRecursoProject?: string; // ex: "3010103"
  seq?: number; // Sequência numérica da Planilha de Quantidades / CPU (1, 2, 3...)
}

export interface ScheduleTask {
  uniqueId: number; // Id exclusiva do MS Project (Chave Primária)
  wbs: string; // EDT, ex: "1.1.1.2.2.2.16.1"
  outlineLevel: number; // Nível 1 a 8 (Nível 7 = Pacote/Bloco, Nível 8 = Tarefa Executiva)
  parentUniqueId: number | null;
  name: string; // Nome da Tarefa
  startDate: string; // Data Início (YYYY-MM-DD)
  finishDate: string; // Data Término (YYYY-MM-DD)
  physicalQuantity: number; // Quantidade física própria da tarefa no cronograma
  unit: string;
  dailyProductivityPerTeam: number; // PROD. P/DU
  teamsCount: number; // EQUIPES
  workersPerTeam: number; // QTD PESSOAS/EQ
  workingDaysDuration: number; // ROUNDUP(physicalQuantity / (dailyProductivityPerTeam * teamsCount))
  isSummary?: boolean; // Se é tarefa resumo
  msProjectResourceString?: string; // Texto formatado: item[qtd unid];...
  rollUpResourceString?: string; // Para tarefas de Nível 7 (Roll-up)
}

export type AllocationRuleType =
  | 'DIRECT_1_1'
  | 'TASK_QUANTITY_LOOKUP'
  | 'PROPORTIONAL_TO_TASK_QTY'
  | 'PROPORTIONAL_TO_DURATION'
  | 'UNIFORM_SPLIT'
  | 'CROSS_ITEM_FACTOR'
  | 'MANUAL';

export interface AllocationRuleParams {
  groupTaskIds?: number[]; // IDs das tarefas do grupo de rateio
  sourceSeqOrItemId?: string; // Item base de dependência cruzada
  technicalFactor?: number; // ex: 0.08 (8cm espessura) ou 3.0 m/furo
  manualQuantity?: number;
}

export interface AllocationLink {
  seq: number; // Identificador sequencial único do vínculo (ex: 1, 2, ... 1479)
  obraId?: string;
  pqItemId: string; // FK para PQItem.id
  taskUniqueId: number; // FK para ScheduleTask.uniqueId
  allocationRule: AllocationRuleType;
  ruleParams?: AllocationRuleParams;
  calculatedQuantity: number; // QUANT. MEMÓRIA DE CÁLCULO
  totalCostAllocated: number; // calculatedQuantity * pqItem.precoUnitarioCustoDireto
  totalRevenueAllocated: number; // calculatedQuantity * pqItem.precoUnitarioVenda
  observacoes?: string;
}

export interface WeeklyProgressItem {
  seq: number; // FK para AllocationLink.seq
  semana: string; // ex: "Sem 01 (Jan/26)", "Sem 02 (Jan/26)"
  semanaNumero: number;
  quantidadeRealizadaSemana: number;
  dataApontamento?: string;
  observacao?: string;
}

export interface ParametrosFluxoCaixa {
  lagFaturamentoMeses: number; // Padrão: 2 meses (60 dias)
  mesProducaoOffset?: number; // 0 = Produz no Mês M
  mesFaturamentoOffset?: number; // 1 = Fatura no Mês M+1
  mesRecebimentoOffset?: number; // 2 = Recebe no Mês M+2
  diaInicioMedicao?: number; // Dia de início do ciclo de medição (ex: 26 do mês anterior ou 1)
  diaFimMedicao?: number; // Dia de término do ciclo de medição (ex: 25 do mês atual ou 30)
  ajustesMensaisManual?: Record<
    string,
    {
      faturamento?: number;
      recebimento?: number;
      custo?: number;
      producao?: number;
      motivo?: string;
      editadoEm?: string;
    }
  >;
  ajustesRecursosManual?: Record<
    string,
    Record<
      string,
      {
        qtd?: number;
        custo?: number;
        faturamento?: number;
        motivo?: string;
        editadoEm?: string;
      }
    >
  >;
  recursosHistogramaTravados?: Record<string, boolean>;
  ajustesHistogramaManual?: Record<
    string,
    Record<
      string,
      {
        val?: number;
        motivo?: string;
        editadoEm?: string;
      }
    >
  >;
  descontoAdiantamentoPerc: number; // Padrão: 13.0%
  retencaoContratualPerc: number; // Padrão: 5.0%
  impostosPerc: number; // Padrão: 6.65% (PIS + COFINS + ISS)
  adiantamentoInicialValor?: number;
  devolucaoRetencaoMesFinal?: boolean;
  productivityMultiplier: number; // 1.0 = Base, 1.25 = +25% de produtividade
}

export interface ProjecaoMensalDRE {
  mesAno: string; // "jan/26", "fev/26"
  mesNumero: number;
  diasUteisMes: number;

  // Lote 1
  producaoLote1: number;
  custoDiretoLote1: number;

  // Lote 2
  producaoLote2: number;
  custoDiretoLote2: number;

  // Totais de Produção e Custos
  producaoBrutaTotal: number;
  custoDiretoTotal: number;
  custoIndiretoTotal: number; // Custo indireto rateado linearmente pelos meses
  custoTotal: number;

  // Faturamento e Caixa
  faturamentoMensal: number;
  descontoAdiantamento: number;
  retencaoContratual: number;
  impostos: number;
  recebimentoLiquido: number;
  fluxoCaixaMensal: number;
  fluxoCaixaAcumulado: number;
}

export interface VersaoCronograma {
  id: string;
  obraId: string;
  nome: string; // ex: "Revisão R00 - Inicial"
  descricao?: string;
  nomeArquivo?: string;
  tipoArquivo?: 'xml' | 'csv' | 'manual';
  criadoEm: string;
  tarefasCount: number;
  tarefas: ScheduleTask[];
}

export interface RecursoProjectConfig {
  id: string; // Identificador único (geralmente o ID ou código da PQ/CPU)
  obraId?: string;
  nomeRecurso: string; // Nome do Recurso no Project (ex: "3010103" ou definido pelo usuário)
  descricaoRecurso: string; // Descrição completa do item da PQ / CPU
  unidadeMaterial: string; // Unidade do material (M, KG, M3, un, MES, etc.)
  tipo: 'Material'; // Tipo fixo "Material"
  custoCpu: number; // Taxa Padrão -> Custo Unitário Direto da CPU
  vendaCpu: number; // Custo -> Valor de Venda Unitário da PQ
  pqItemId?: string;
  cpuId?: string;
  seq?: number; // Sequenciador correspondente à tabela de CPU (1, 2, 3...)
  observacoes?: string;
}

