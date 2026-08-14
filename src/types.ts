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
