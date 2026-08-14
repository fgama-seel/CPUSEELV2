import { ItemMochila, MochilaMOConfig, MochilaMOInsumo, AdicionaisMO, ConfigEncargosObra } from '../types';

export const HORAS_MES_PADRAO = 189.2; // 44h semanais padrão de engenharia civil orçamentária
export const ENCARGO_PADRAO_PERC = 75.0; // 75.00% encargos sociais padrão

// Itens Padrão extraídos fielmente da planilha orçamentária do usuário (imagem)
export const ITENS_MOCHILA_PADRAO: Omit<ItemMochila, 'id'>[] = [
  // ALIMENTAÇÃO
  {
    seq: 1,
    categoria: 'ALIMENTAÇÃO',
    descricao: 'Alimentação',
    custo_unit: 2922.0,
    unid: 'mês',
    quantidade: 1,
    total: 2922.0
  },
  {
    seq: 2,
    categoria: 'ALIMENTAÇÃO',
    descricao: 'Vale Alimentação',
    custo_unit: 158.31,
    unid: 'mês',
    quantidade: 1,
    total: 158.31
  },
  // TRANSPORTE
  {
    seq: 3,
    categoria: 'TRANSPORTE',
    descricao: 'Vale Transporte',
    custo_unit: 0.0,
    unid: 'mês',
    quantidade: 1,
    total: 0.0
  },
  {
    seq: 4,
    categoria: 'TRANSPORTE',
    descricao: 'Vale Combustível Seel',
    custo_unit: 400.0,
    unid: 'mês',
    quantidade: 1,
    total: 400.0
  },
  {
    seq: 5,
    categoria: 'TRANSPORTE',
    descricao: 'Passagem/Viagem',
    custo_unit: 1285.71,
    unid: 'mês',
    quantidade: 1,
    total: 1285.71
  },
  {
    seq: 6,
    categoria: 'TRANSPORTE',
    descricao: 'Custos Baixada',
    custo_unit: 0.0,
    unid: 'mês',
    quantidade: 1,
    total: 0.0
  },
  // UNIFORMES / EPI
  {
    seq: 7,
    categoria: 'UNIFORMES / EPI',
    descricao: 'Uniformes',
    custo_unit: 150.0,
    unid: 'mês',
    quantidade: 1,
    total: 150.0
  },
  {
    seq: 8,
    categoria: 'UNIFORMES / EPI',
    descricao: 'EPI',
    custo_unit: 206.8,
    unid: 'mês',
    quantidade: 1,
    total: 206.8
  },
  // ASSISTÊNCIA
  {
    seq: 9,
    categoria: 'ASSISTÊNCIA',
    descricao: 'Plano de Saúde',
    custo_unit: 0.0,
    unid: 'mês',
    quantidade: 1,
    total: 0.0
  },
  {
    seq: 10,
    categoria: 'ASSISTÊNCIA',
    descricao: 'Seguro de Vida',
    custo_unit: 13.27,
    unid: 'mês',
    quantidade: 1,
    total: 13.27
  },
  // ALOJAMENTO
  {
    seq: 11,
    categoria: 'ALOJAMENTO',
    descricao: 'Custo Lavanderia',
    custo_unit: 30.0,
    unid: 'mês',
    quantidade: 1,
    total: 30.0
  },
  {
    seq: 12,
    categoria: 'ALOJAMENTO',
    descricao: 'Moradia + Manutenção',
    custo_unit: 1231.63,
    unid: 'mês',
    quantidade: 1,
    total: 1231.63
  },
  // OUTROS
  {
    seq: 13,
    categoria: 'OUTROS',
    descricao: 'PLR',
    custo_unit: 0.0,
    unid: 'mês',
    quantidade: 1,
    total: 0.0
  }
];

export function gerarItensMochilaPadrao(): ItemMochila[] {
  return ITENS_MOCHILA_PADRAO.map((item, idx) => ({
    ...item,
    id: `item_mochila_${idx + 1}`
  }));
}

export function gerarMochilaPadrao(): MochilaMOConfig {
  const itens: ItemMochila[] = gerarItensMochilaPadrao();
  const totalMensal = itens.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const custoHoraMochila = HORAS_MES_PADRAO > 0 ? totalMensal / HORAS_MES_PADRAO : 0;

  return {
    horasMesPadrao: HORAS_MES_PADRAO,
    percentualEncargoPadrao: ENCARGO_PADRAO_PERC,
    itens,
    totalMensal: Number(totalMensal.toFixed(2)),
    custoHoraMochila: Number(custoHoraMochila.toFixed(4)),
    atualizadoEm: new Date().toISOString()
  };
}

export function calcularMochila(
  itensOrConfig?: ItemMochila[] | MochilaMOConfig | null,
  horasMesInput?: number
): { totalMensal: number; custoHoraMochila: number } {
  if (!itensOrConfig) {
    return { totalMensal: 0, custoHoraMochila: 0 };
  }

  let itensList: ItemMochila[] = [];
  let horasMes = HORAS_MES_PADRAO;

  if (Array.isArray(itensOrConfig)) {
    itensList = itensOrConfig;
    if (horasMesInput !== undefined && Number(horasMesInput) > 0) {
      horasMes = Number(horasMesInput);
    }
  } else if (typeof itensOrConfig === 'object') {
    if (Array.isArray(itensOrConfig.itens)) {
      itensList = itensOrConfig.itens;
    }
    if (horasMesInput !== undefined && Number(horasMesInput) > 0) {
      horasMes = Number(horasMesInput);
    } else if (itensOrConfig.horasMesPadrao && Number(itensOrConfig.horasMesPadrao) > 0) {
      horasMes = Number(itensOrConfig.horasMesPadrao);
    }
  }

  if (!itensList || !Array.isArray(itensList) || itensList.length === 0) {
    return { totalMensal: 0, custoHoraMochila: 0 };
  }

  const totalMensal = itensList.reduce((sum, item) => {
    if (!item) return sum;
    const qtd = item.quantidade !== undefined ? Number(item.quantidade) : 1;
    const unt = Number(item.custo_unit) || 0;
    const tot = item.total !== undefined ? Number(item.total) : qtd * unt;
    return sum + (Number(tot) || 0);
  }, 0);

  const horas = Number(horasMes) > 0 ? Number(horasMes) : HORAS_MES_PADRAO;
  const custoHoraMochila = totalMensal / horas;

  return {
    totalMensal: Number(totalMensal.toFixed(2)),
    custoHoraMochila: Number(custoHoraMochila.toFixed(4))
  };
}

export function calcularMochilaInsumo(
  mochila: Partial<MochilaMOInsumo>,
  configObra?: ConfigEncargosObra
): MochilaMOInsumo {
  const horasMes = Number(mochila.horasMes) || configObra?.horasMesPadrao || HORAS_MES_PADRAO;
  const encargoPerc = mochila.encargoPerc !== undefined ? Number(mochila.encargoPerc) : (configObra?.percentualEncargoPadrao !== undefined ? configObra.percentualEncargoPadrao : ENCARGO_PADRAO_PERC);

  // 1. Salário Base / h
  let salarioHora = Number(mochila.salarioHora) || 0;
  let salarioMes = Number(mochila.salarioMes) || 0;

  if (salarioMes > 0 && (!salarioHora || mochila.unidadeBase === '/mês')) {
    salarioHora = salarioMes / horasMes;
  } else if (salarioHora > 0 && (!salarioMes || mochila.unidadeBase === 'h')) {
    salarioMes = salarioHora * horasMes;
  }

  // 2. Adicionais de Mão de Obra (% sobre o Salário Base)
  const adic = mochila.adicionais || {};
  const dissidio = Number(adic.dissidio) || 0;
  const ajudaDeCusto = Number(adic.ajudaDeCusto) || 0;
  const horaExtra = Number(adic.horaExtra) || 0;
  const adicionalNoturno = Number(adic.adicionalNoturno) || 0;
  const periculosidade = Number(adic.periculosidade) || 0;
  const insalubridade = Number(adic.insalubridade) || 0;

  const somaAdicionaisPerc = dissidio + ajudaDeCusto + horaExtra + adicionalNoturno + periculosidade + insalubridade;
  const somaAdicionais = salarioHora * (somaAdicionaisPerc / 100);

  // 3. PrUn. Base (Salário/h) = Salário/h + Adicionais
  const prUnBaseSalarioHora = salarioHora + somaAdicionais;
  const salarioComAdicionaisHora = prUnBaseSalarioHora;

  // 4. Salário + Encargo (R$/h) = prUnBaseSalarioHora * (1 + encargoPerc/100)
  const custoHoraEncargo = prUnBaseSalarioHora * (encargoPerc / 100);
  const salarioComEncargoHora = prUnBaseSalarioHora + custoHoraEncargo;

  // 5. Itens da Mochila
  const itensOriginais = mochila.itens && mochila.itens.length > 0 ? mochila.itens : gerarItensMochilaPadrao();
  const itens: ItemMochila[] = itensOriginais.map((it) => {
    const qtd = it.quantidade !== undefined ? Number(it.quantidade) : 1;
    const unt = Number(it.custo_unit !== undefined ? it.custo_unit : it.valorUnitario) || 0;
    const tot = it.total !== undefined ? Number(it.total) : qtd * unt;
    const cMes = it.custoMensal !== undefined ? Number(it.custoMensal) : tot;
    const cHora = it.custoHora !== undefined ? Number(it.custoHora) : (horasMes > 0 ? cMes / horasMes : 0);
    return {
      ...it,
      custo_unit: unt,
      valorUnitario: unt,
      unid: it.unid || it.unidade || 'mês',
      unidade: it.unid || it.unidade || 'mês',
      quantidade: qtd,
      total: tot,
      custoMensal: cMes,
      custoHora: cHora
    };
  });

  const totalMensalMochila = itens.reduce((sum, it) => {
    return sum + (Number(it.total) || 0);
  }, 0);

  // 6. Mochila (R$/h) = totalMensalMochila / horasMes
  const custoHoraMochila = totalMensalMochila / horasMes;

  // 7. Salário + Encargo + Mochila (R$/h)
  const salarioEncargoMochilaHora = salarioComEncargoHora + custoHoraMochila;

  return {
    insumoId: mochila.insumoId || '',
    insumoCodigo: mochila.insumoCodigo,
    insumoDescricao: mochila.insumoDescricao,
    unidadeBase: mochila.unidadeBase || 'h',
    salarioMes: Number(salarioMes.toFixed(2)),
    salarioHora: Number(salarioHora.toFixed(4)),
    adicionais: {
      dissidio,
      ajudaDeCusto,
      horaExtra,
      adicionalNoturno,
      periculosidade,
      insalubridade
    },
    encargoPerc,
    horasMes,
    itens,
    salarioComAdicionaisHora: Number(salarioComAdicionaisHora.toFixed(4)),
    custoHoraEncargo: Number(custoHoraEncargo.toFixed(4)),
    custoMesMochila: Number(totalMensalMochila.toFixed(2)),
    prUnBaseSalarioHora: Number(prUnBaseSalarioHora.toFixed(4)),
    salarioComEncargoHora: Number(salarioComEncargoHora.toFixed(4)),
    totalMensalMochila: Number(totalMensalMochila.toFixed(2)),
    custoHoraMochila: Number(custoHoraMochila.toFixed(4)),
    salarioEncargoMochilaHora: Number(salarioEncargoMochilaHora.toFixed(4)),
    atualizadoEm: new Date().toISOString()
  };
}

export function gerarMochilaPadraoParaInsumo(
  insumoId: string,
  insumoDescricao: string,
  prUnit: number,
  insumoCodigo?: string,
  configObra?: ConfigEncargosObra
): MochilaMOInsumo {
  return calcularMochilaInsumo(
    {
      insumoId,
      insumoCodigo,
      insumoDescricao,
      unidadeBase: 'h',
      salarioHora: prUnit,
      itens: gerarItensMochilaPadrao()
    },
    configObra
  );
}

export function clonarMochilaParaInsumo(
  origem: MochilaMOInsumo | MochilaMOConfig,
  novoInsumoId: string,
  novoInsumoDesc: string,
  novoInsumoCodigo?: string,
  novoSalario?: number
): MochilaMOInsumo {
  const itensOriginais = Array.isArray(origem.itens) ? origem.itens : gerarItensMochilaPadrao();
  const itensClonados: ItemMochila[] = itensOriginais.map((item, idx) => ({
    ...item,
    id: `item_mochila_${Date.now()}_${idx + 1}`
  }));

  const isMochilaInsumo = 'insumoId' in origem;
  const mochilaOrigem = isMochilaInsumo ? (origem as MochilaMOInsumo) : null;

  const horasOrigem = mochilaOrigem?.horasMes || (origem as MochilaMOConfig).horasMesPadrao || HORAS_MES_PADRAO;

  const baseMochila: Partial<MochilaMOInsumo> = {
    insumoId: novoInsumoId,
    insumoCodigo: novoInsumoCodigo || mochilaOrigem?.insumoCodigo,
    insumoDescricao: novoInsumoDesc,
    unidadeBase: mochilaOrigem?.unidadeBase || 'h',
    salarioMes: novoSalario !== undefined ? novoSalario * horasOrigem : mochilaOrigem?.salarioMes,
    salarioHora: novoSalario !== undefined ? novoSalario : mochilaOrigem?.salarioHora,
    adicionais: mochilaOrigem?.adicionais ? { ...mochilaOrigem.adicionais } : { dissidio: 0, ajudaDeCusto: 0, horaExtra: 0, adicionalNoturno: 0, periculosidade: 0, insalubridade: 0 },
    encargoPerc: mochilaOrigem?.encargoPerc !== undefined ? mochilaOrigem.encargoPerc : ENCARGO_PADRAO_PERC,
    horasMes: horasOrigem,
    itens: itensClonados
  };

  return calcularMochilaInsumo(baseMochila);
}

