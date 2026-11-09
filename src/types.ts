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
  codigo?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  custoTotal: number;
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
