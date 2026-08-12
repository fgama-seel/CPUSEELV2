export type TipoInsumo = 'Material' | 'Mão de Obra' | 'Equipamento';

export interface Insumo {
  id_insumo: string;
  tipo: TipoInsumo;
  descricao: string;
  unid: string;
  coef: number;
  pr_unit: number;
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
  vendaLiquida: number;
  resultado: number;
  margem: number;
}

export interface Obra {
  id: string;
  codigo: string; // e.g. "966"
  nome: string; // e.g. "Obra 966 - TRANSPORTE ETA"
  cliente: string;
  custoIndiretoAtual: number;
  faturamentoDiretoAtual: number;
  orcamentoOriginal: OrcamentoOriginal;
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
