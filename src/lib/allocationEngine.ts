import {
  PQItem,
  ScheduleTask,
  AllocationLink,
  WeeklyProgressItem,
  ParametrosFluxoCaixa,
  ProjecaoMensalDRE,
  RecursoProjectConfig
} from '../types';

/**
 * MOTOR DE REGRAS DE ALOCAÇÃO (CÁLCULO AUTOMÁTICO DE calculatedQuantity)
 * Executa as 6 regras matemáticas mapeadas na engenharia reversa SEEL/SABESP:
 * 1. DIRECT_1_1: Alocação 1:1 integral
 * 2. TASK_QUANTITY_LOOKUP: Puxa diretamente physicalQuantity da tarefa
 * 3. PROPORTIONAL_TO_TASK_QTY: Rateio proporcional ao driver físico das tarefas
 * 4. PROPORTIONAL_TO_DURATION: Rateio proporcional à duração em dias úteis
 * 5. UNIFORM_SPLIT: Divisão igualitária 1/N
 * 6. CROSS_ITEM_FACTOR: Dependência técnica cruzada sobre outro item na mesma tarefa
 * 7. MANUAL: Quantidade explícita
 */
export function calculateAllocations(
  pqItems: PQItem[],
  tasks: ScheduleTask[],
  allocations: AllocationLink[],
  recursosConfig?: RecursoProjectConfig[]
): AllocationLink[] {
  const pqMap = new Map<string, PQItem>(pqItems.map((item) => [item.id, item]));
  const taskMap = new Map<number, ScheduleTask>(tasks.map((t) => [t.uniqueId, t]));
  const recursosMap = new Map<string, RecursoProjectConfig>(
    (recursosConfig || []).map((r) => [r.id || r.pqItemId || r.nomeRecurso, r])
  );

  // Indexa links por taskUniqueId e pqItemId para dependências cruzadas
  const linkKeyMap = new Map<string, AllocationLink>();
  allocations.forEach((link) => {
    linkKeyMap.set(`${link.taskUniqueId}_${link.pqItemId}`, link);
    linkKeyMap.set(`seq_${link.seq}`, link);
  });

  return allocations.map((link) => {
    const pqItem = pqMap.get(link.pqItemId);
    const task = taskMap.get(link.taskUniqueId);

    if (!pqItem || !task) {
      return {
        ...link,
        calculatedQuantity: link.calculatedQuantity || 0,
        totalCostAllocated: 0,
        totalRevenueAllocated: 0
      };
    }

    let calculatedQty = 0;
    const rule = link.allocationRule;
    const params = link.ruleParams || {};

    switch (rule) {
      case 'DIRECT_1_1': {
        // Aloca 100% da quantidade orçada do item da PQ
        calculatedQty = pqItem.quantidadeOrcada;
        break;
      }

      case 'TASK_QUANTITY_LOOKUP': {
        // Puxa a quantidade física própria da atividade no cronograma
        calculatedQty = task.physicalQuantity || 0;
        break;
      }

      case 'PROPORTIONAL_TO_TASK_QTY': {
        // Rateio proporcional: (Q_tarefa / SUM(Q_grupo)) * Q_Total_PQ
        const groupIds = params.groupTaskIds && params.groupTaskIds.length > 0
          ? params.groupTaskIds
          : [task.uniqueId];

        let sumGroupPhysicalQty = 0;
        groupIds.forEach((id) => {
          const t = taskMap.get(id);
          if (t) sumGroupPhysicalQty += Number(t.physicalQuantity) || 0;
        });

        if (sumGroupPhysicalQty > 0) {
          const ratio = (task.physicalQuantity || 0) / sumGroupPhysicalQty;
          calculatedQty = ratio * pqItem.quantidadeOrcada;
        } else {
          calculatedQty = 0;
        }
        break;
      }

      case 'PROPORTIONAL_TO_DURATION': {
        // Rateio proporcional: (Duração_tarefa / SUM(Duração_grupo)) * Q_Total_PQ
        const groupIds = params.groupTaskIds && params.groupTaskIds.length > 0
          ? params.groupTaskIds
          : [task.uniqueId];

        let sumGroupDuration = 0;
        groupIds.forEach((id) => {
          const t = taskMap.get(id);
          if (t) sumGroupDuration += Number(t.workingDaysDuration) || 0;
        });

        if (sumGroupDuration > 0) {
          const ratio = (task.workingDaysDuration || 0) / sumGroupDuration;
          calculatedQty = ratio * pqItem.quantidadeOrcada;
        } else {
          calculatedQty = 0;
        }
        break;
      }

      case 'UNIFORM_SPLIT': {
        // Divisão igualitária 1/N
        const n = params.groupTaskIds && params.groupTaskIds.length > 0
          ? params.groupTaskIds.length
          : 1;
        calculatedQty = pqItem.quantidadeOrcada / Math.max(1, n);
        break;
      }

      case 'CROSS_ITEM_FACTOR': {
        // Índice técnico sobre outro item da mesma tarefa
        // Exemplo: Argamassa projetada m³ = Hidrojateamento m² * 0.08m
        const sourceItem = params.sourceSeqOrItemId;
        let baseQty = 0;

        if (sourceItem) {
          const sourceLink = linkKeyMap.get(`${task.uniqueId}_${sourceItem}`);
          if (sourceLink) {
            baseQty = sourceLink.calculatedQuantity;
          } else {
            // Tenta achar por seq
            const bySeq = linkKeyMap.get(`seq_${sourceItem}`);
            if (bySeq) baseQty = bySeq.calculatedQuantity;
          }
        }

        const factor = params.technicalFactor ?? 1;
        calculatedQty = baseQty * factor;
        break;
      }

      case 'MANUAL':
      default: {
        calculatedQty = params.manualQuantity !== undefined
          ? params.manualQuantity
          : link.calculatedQuantity || 0;
        break;
      }
    }

    const recursoConfig = recursosMap.get(link.pqItemId) || recursosMap.get(pqItem.id);
    const puCusto = recursoConfig?.custoCpu !== undefined ? recursoConfig.custoCpu : (pqItem.precoUnitarioCustoDireto || 0);
    const puVenda = recursoConfig?.vendaCpu !== undefined ? recursoConfig.vendaCpu : (pqItem.precoUnitarioVenda || 0);

    const totalCostAllocated = calculatedQty * puCusto;
    const totalRevenueAllocated = calculatedQty * puVenda;

    return {
      ...link,
      calculatedQuantity: Math.round(calculatedQty * 1000) / 1000,
      totalCostAllocated: Math.round(totalCostAllocated * 100) / 100,
      totalRevenueAllocated: Math.round(totalRevenueAllocated * 100) / 100
    };
  });
}

/**
 * AUDITORIA DE SALDOS DA PQ EM TEMPO REAL
 */
export interface PQSaldoAuditoria {
  pqItem: PQItem;
  quantidadeOrcada: number;
  quantidadeAlocada: number;
  saldoQuantidade: number;
  saldoFinanceiroVenda: number;
  saldoFinanceiroCusto: number;
  percentualAlocado: number;
  status: 'TOTALMENTE_ALOCADO' | 'SUB_ALOCADO' | 'SUPER_ALOCADO';
}

export function auditPQSaldos(
  pqItems: PQItem[],
  allocations: AllocationLink[]
): Map<string, PQSaldoAuditoria> {
  const alocacaoMap = new Map<string, number>();

  allocations.forEach((link) => {
    const current = alocacaoMap.get(link.pqItemId) || 0;
    alocacaoMap.set(link.pqItemId, current + (link.calculatedQuantity || 0));
  });

  const resultMap = new Map<string, PQSaldoAuditoria>();

  pqItems.forEach((item) => {
    const qtdOrcada = item.quantidadeOrcada || 0;
    const qtdAlocada = alocacaoMap.get(item.id) || 0;
    const saldoQtd = qtdOrcada - qtdAlocada;
    const saldoVenda = saldoQtd * (item.precoUnitarioVenda || 0);
    const saldoCusto = saldoQtd * (item.precoUnitarioCustoDireto || 0);
    const percAlocado = qtdOrcada > 0 ? (qtdAlocada / qtdOrcada) * 100 : 0;

    let status: 'TOTALMENTE_ALOCADO' | 'SUB_ALOCADO' | 'SUPER_ALOCADO' = 'TOTALMENTE_ALOCADO';
    if (Math.abs(saldoQtd) > 0.01) {
      status = saldoQtd > 0 ? 'SUB_ALOCADO' : 'SUPER_ALOCADO';
    }

    resultMap.set(item.id, {
      pqItem: item,
      quantidadeOrcada: qtdOrcada,
      quantidadeAlocada: Math.round(qtdAlocada * 1000) / 1000,
      saldoQuantidade: Math.round(saldoQtd * 1000) / 1000,
      saldoFinanceiroVenda: Math.round(saldoVenda * 100) / 100,
      saldoFinanceiroCusto: Math.round(saldoCusto * 100) / 100,
      percentualAlocado: Math.round(percAlocado * 10) / 10,
      status
    });
  });

  return resultMap;
}

/**
 * REGRA 1 (SPLIT 40/60 FORNECIMENTO E APLICAÇÃO)
 * Desmembra um item pai em dois subitens filhos com 40% e 60% do P.U. de Venda,
 * mantendo 100% da quantidade orçada física em cada um.
 */
export function splitPQItem40_60(
  item: PQItem,
  ratioFornecimento = 0.4,
  ratioAplicacao = 0.6
): { parent: PQItem; subItem1: PQItem; subItem2: PQItem } {
  const puVenda1 = Math.round(item.precoUnitarioVenda * ratioFornecimento * 100) / 100;
  const puVenda2 = Math.round(item.precoUnitarioVenda * ratioAplicacao * 100) / 100;

  const parent: PQItem = {
    ...item,
    isSplitParent: true
  };

  const subItem1: PQItem = {
    id: `${item.id}1`,
    parentId: item.id,
    obraId: item.obraId,
    lote: item.lote,
    grupo: item.grupo,
    descricao: `${item.descricao} - FORNECIMENTO (${Math.round(ratioFornecimento * 100)}%)`,
    unidade: item.unidade,
    quantidadeOrcada: item.quantidadeOrcada,
    precoUnitarioVenda: puVenda1,
    precoUnitarioCustoDireto: Math.round(item.precoUnitarioCustoDireto * ratioFornecimento * 100) / 100,
    isSplitParent: false,
    splitRatioVenda: ratioFornecimento,
    codigoRecursoProject: `${item.id}1`
  };

  const subItem2: PQItem = {
    id: `${item.id}2`,
    parentId: item.id,
    obraId: item.obraId,
    lote: item.lote,
    grupo: item.grupo,
    descricao: `${item.descricao} - APLICAÇÃO / INSTALAÇÃO (${Math.round(ratioAplicacao * 100)}%)`,
    unidade: item.unidade,
    quantidadeOrcada: item.quantidadeOrcada,
    precoUnitarioVenda: puVenda2,
    precoUnitarioCustoDireto: Math.round(item.precoUnitarioCustoDireto * ratioAplicacao * 100) / 100,
    isSplitParent: false,
    splitRatioVenda: ratioAplicacao,
    codigoRecursoProject: `${item.id}2`
  };

  return { parent, subItem1, subItem2 };
}

/**
 * GERADOR DE STRINGS DE RECURSOS PARA O MS PROJECT (Com Roll-Up de Nível 7)
 * Formato gerado para cada tarefa: item[qtd unid];item[qtd unid]...
 */
export function generateMsProjectResourceStrings(
  tasks: ScheduleTask[],
  allocations: AllocationLink[],
  pqItems: PQItem[],
  recursosConfig?: RecursoProjectConfig[]
): ScheduleTask[] {
  const pqMap = new Map<string, PQItem>(pqItems.map((item) => [item.id, item]));
  const recursosMap = new Map<string, RecursoProjectConfig>(
    (recursosConfig || []).map((r) => [r.id || r.pqItemId || r.nomeRecurso, r])
  );

  // Agrupa alocações por taskUniqueId
  const linksByTask = new Map<number, AllocationLink[]>();
  allocations.forEach((link) => {
    if (!linksByTask.has(link.taskUniqueId)) {
      linksByTask.set(link.taskUniqueId, []);
    }
    linksByTask.get(link.taskUniqueId)!.push(link);
  });

  // 1. Gera strings para tarefas de Nível 8 (operacionais)
  const updatedTasks = tasks.map((task) => {
    const taskLinks = linksByTask.get(task.uniqueId) || [];
    if (taskLinks.length === 0) {
      return {
        ...task,
        msProjectResourceString: ''
      };
    }

    const resourceParts = taskLinks.map((link) => {
      const pqItem = pqMap.get(link.pqItemId);
      const recursoConfig = recursosMap.get(link.pqItemId) || (pqItem ? recursosMap.get(pqItem.id) : undefined);

      // Nome do Recurso: definido pelo usuário ou código da PQ
      const code = recursoConfig?.nomeRecurso?.trim() || (pqItem ? pqItem.id : link.pqItemId);
      // Unidade: definida pelo usuário ou unidade da PQ
      const unit = recursoConfig?.unidadeMaterial?.trim() || (pqItem ? pqItem.unidade : 'un');

      const formattedQty = link.calculatedQuantity.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `${code}[${formattedQty} ${unit}]`;
    });

    return {
      ...task,
      msProjectResourceString: resourceParts.join(';')
    };
  });

  // 2. Gera Roll-up de Nível 7 (Pacote/Bloco) agregando as tarefas filhas de Nível 8
  const taskByIdMap = new Map<number, ScheduleTask>(updatedTasks.map((t) => [t.uniqueId, t]));

  return updatedTasks.map((task) => {
    if (task.outlineLevel === 7 || task.isSummary) {
      // Procura todas as filhas com parentUniqueId === task.uniqueId
      const children = updatedTasks.filter((t) => t.parentUniqueId === task.uniqueId);
      const allChildResourceStrings = children
        .map((c) => c.msProjectResourceString)
        .filter(Boolean);

      return {
        ...task,
        rollUpResourceString: allChildResourceStrings.join(';')
      };
    }
    return task;
  });
}

/**
 * MOTOR DE PROJEÇÃO TEMPORAL (DRE MENSAL, PRODUÇÃO, CUSTOS E FLUXO DE CAIXA)
 * Calcula distribuição por dias úteis, lag de faturamento e deduções contratuais (Adiantamento, Retenção e Impostos).
 */
export function calculateTemporalProjections(
  allocations: AllocationLink[],
  pqItems: PQItem[],
  tasks: ScheduleTask[],
  custoIndiretoTotal: number,
  params: ParametrosFluxoCaixa
): ProjecaoMensalDRE[] {
  const pqMap = new Map<string, PQItem>(pqItems.map((item) => [item.id, item]));
  const taskMap = new Map<number, ScheduleTask>(tasks.map((t) => [t.uniqueId, t]));

  // Identifica todos os meses do projeto
  const mesesSet = new Set<string>();

  tasks.forEach((t) => {
    if (!t.startDate || !t.finishDate) return;
    const dtIni = new Date(t.startDate);
    const dtFim = new Date(t.finishDate);
    if (isNaN(dtIni.getTime()) || isNaN(dtFim.getTime()) || dtFim < dtIni) return;

    let curAno = dtIni.getFullYear();
    let curMes = dtIni.getMonth();
    const endAno = dtFim.getFullYear();
    const endMes = dtFim.getMonth();

    while (curAno < endAno || (curAno === endAno && curMes <= endMes)) {
      const sortKey = `${curAno}-${String(curMes + 1).padStart(2, '0')}`;
      mesesSet.add(sortKey);
      curMes++;
      if (curMes > 11) {
        curMes = 0;
        curAno++;
      }
    }
  });

  const sortedMesesKeys = Array.from(mesesSet).sort();
  if (sortedMesesKeys.length === 0) return [];

  // Mapeia dias úteis e acumuladores de cada mês
  interface MesAcumulador {
    mesAno: string;
    sortKey: string;
    mesNumero: number;
    producaoLote1: number;
    custoDiretoLote1: number;
    producaoLote2: number;
    custoDiretoLote2: number;
  }

  const acumuladorMeses = new Map<string, MesAcumulador>();
  const nomesMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  sortedMesesKeys.forEach((key, index) => {
    const [anoStr, mesStr] = key.split('-');
    const mesIndex = parseInt(mesStr, 10) - 1;
    const anoAbrev = anoStr.substring(2);
    const mesAno = `${nomesMeses[mesIndex]}/${anoAbrev}`;

    acumuladorMeses.set(key, {
      mesAno,
      sortKey: key,
      mesNumero: index + 1,
      producaoLote1: 0,
      custoDiretoLote1: 0,
      producaoLote2: 0,
      custoDiretoLote2: 0
    });
  });

  // Aplica multiplicador de produtividade (cenário +25%)
  const multProd = params.productivityMultiplier || 1.0;

  // Distribui cada AllocationLink nos meses de vigência de sua tarefa
  allocations.forEach((link) => {
    const task = taskMap.get(link.taskUniqueId);
    const pqItem = pqMap.get(link.pqItemId);
    if (!task || !pqItem || !task.startDate || !task.finishDate) return;

    const dtIni = new Date(task.startDate);
    const dtFim = new Date(task.finishDate);
    if (isNaN(dtIni.getTime()) || isNaN(dtFim.getTime()) || dtFim < dtIni) return;

    // Se houver cenário acelerado, a duração é reduzida proporcionalmente
    const duracaoOriginal = Number(task.workingDaysDuration) || 1;
    const duracaoEfetiva = Math.max(1, Math.ceil(duracaoOriginal / multProd));

    const anoIni = dtIni.getFullYear();
    const mesIni = dtIni.getMonth();
    const anoFim = dtFim.getFullYear();
    const mesFim = dtFim.getMonth();

    const totalMesesTarefa = Math.max(1, (anoFim - anoIni) * 12 + (mesFim - mesIni) + 1);
    const prodPorMes = link.totalRevenueAllocated / totalMesesTarefa;
    const custoPorMes = link.totalCostAllocated / totalMesesTarefa;

    const isLote1 = (pqItem.lote || '').toUpperCase().includes('1');

    let curAno = anoIni;
    let curMes = mesIni;

    while (curAno < anoFim || (curAno === anoFim && curMes <= mesFim)) {
      const sortKey = `${curAno}-${String(curMes + 1).padStart(2, '0')}`;
      const mesData = acumuladorMeses.get(sortKey);

      if (mesData) {
        if (isLote1) {
          mesData.producaoLote1 += prodPorMes;
          mesData.custoDiretoLote1 += custoPorMes;
        } else {
          mesData.producaoLote2 += prodPorMes;
          mesData.custoDiretoLote2 += custoPorMes;
        }
      }

      curMes++;
      if (curMes > 11) {
        curMes = 0;
        curAno++;
      }
    }
  });

  // Rateio linear do Custo Indireto pelos meses totais
  const totalMesesObra = sortedMesesKeys.length;
  const custoIndiretoLinearMes = custoIndiretoTotal / Math.max(1, totalMesesObra);

  const lagFaturamento = params.lagFaturamentoMeses || 2;
  const percAdiantamento = (params.descontoAdiantamentoPerc || 13.0) / 100;
  const percRetencao = (params.retencaoContratualPerc || 5.0) / 100;
  const percImpostos = (params.impostosPerc || 6.65) / 100;

  let fluxoCaixaAcumulado = 0;

  const resultadoDRE: ProjecaoMensalDRE[] = sortedMesesKeys.map((key, index) => {
    const item = acumuladorMeses.get(key)!;

    const producaoBrutaTotal = item.producaoLote1 + item.producaoLote2;
    const custoDiretoTotal = item.custoDiretoLote1 + item.custoDiretoLote2;
    const custoTotal = custoDiretoTotal + custoIndiretoLinearMes;

    // Ciclo Operacional: Produção em M -> Faturamento em M+X -> Recebimento em M+Y
    const offsetFat = params.mesFaturamentoOffset !== undefined ? params.mesFaturamentoOffset : 1;
    const offsetRec = params.mesRecebimentoOffset !== undefined ? params.mesRecebimentoOffset : (params.lagFaturamentoMeses || 2);

    // 1. Faturamento do Mês: originado da produção de (index - offsetFat)
    let faturamentoMensal = 0;
    const indexOrigemProducaoFat = index - offsetFat;
    if (indexOrigemProducaoFat >= 0) {
      const keyOrigemFat = sortedMesesKeys[indexOrigemProducaoFat];
      const itemOrigemFat = acumuladorMeses.get(keyOrigemFat);
      if (itemOrigemFat) {
        faturamentoMensal = itemOrigemFat.producaoLote1 + itemOrigemFat.producaoLote2;
      }
    }

    // Sobrescrita manual de faturamento se houver ajuste do usuário
    const ajusteMes = params.ajustesMensaisManual && params.ajustesMensaisManual[item.mesAno];
    if (ajusteMes && ajusteMes.faturamento !== undefined) {
      faturamentoMensal = ajusteMes.faturamento;
    }

    // Deduções Contratuais
    const descontoAdiantamento = faturamentoMensal * percAdiantamento;
    const retencaoContratual = faturamentoMensal * percRetencao;
    const impostos = faturamentoMensal * percImpostos;

    // 2. Recebimento Líquido do Mês: originado do faturamento líquido de (index - (offsetRec - offsetFat))
    // Ou seja, se fatura em M+1 e recebe em M+2, o dinheiro entra 1 mês após o faturamento
    let recebimentoLiquido = 0;
    const offsetFatParaRec = Math.max(0, offsetRec - offsetFat);
    const indexOrigemRecebimento = index - offsetFatParaRec;
    if (indexOrigemRecebimento >= 0) {
      const keyOrigemRec = sortedMesesKeys[indexOrigemRecebimento];
      const ajusteOrigem = params.ajustesMensaisManual && params.ajustesMensaisManual[keyOrigemRec];
      let fatBase = 0;
      const iProd = indexOrigemRecebimento - offsetFat;
      if (iProd >= 0) {
        const kP = sortedMesesKeys[iProd];
        const itP = acumuladorMeses.get(kP);
        fatBase = itP ? itP.producaoLote1 + itP.producaoLote2 : 0;
      }
      if (ajusteOrigem && ajusteOrigem.faturamento !== undefined) {
        fatBase = ajusteOrigem.faturamento;
      }
      recebimentoLiquido = fatBase * (1 - (percAdiantamento + percRetencao + percImpostos));
    }

    // Sobrescrita manual direta de recebimento se houver ajuste do usuário
    if (ajusteMes && ajusteMes.recebimento !== undefined) {
      recebimentoLiquido = ajusteMes.recebimento;
    }

    // Entrada de adiantamento no primeiro mês
    if (index === 0 && params.adiantamentoInicialValor) {
      recebimentoLiquido += params.adiantamentoInicialValor;
    }

    // Devolução da retenção contratual acumulada no último mês
    if (index === totalMesesObra - 1 && params.devolucaoRetencaoMesFinal) {
      const totalRetencaoContrato = sortedMesesKeys.reduce((acc, k, i) => {
        const iOrig = i - offsetFat;
        if (iOrig >= 0) {
          const kOrig = sortedMesesKeys[iOrig];
          const it = acumuladorMeses.get(kOrig);
          const fat = it ? it.producaoLote1 + it.producaoLote2 : 0;
          return acc + fat * percRetencao;
        }
        return acc;
      }, 0);
      recebimentoLiquido += totalRetencaoContrato;
    }

    const fluxoCaixaMensal = recebimentoLiquido - custoTotal;
    fluxoCaixaAcumulado += fluxoCaixaMensal;

    return {
      mesAno: item.mesAno,
      mesNumero: item.mesNumero,
      diasUteisMes: 22,
      producaoLote1: Math.round(item.producaoLote1 * 100) / 100,
      custoDiretoLote1: Math.round(item.custoDiretoLote1 * 100) / 100,
      producaoLote2: Math.round(item.producaoLote2 * 100) / 100,
      custoDiretoLote2: Math.round(item.custoDiretoLote2 * 100) / 100,
      producaoBrutaTotal: Math.round(producaoBrutaTotal * 100) / 100,
      custoDiretoTotal: Math.round(custoDiretoTotal * 100) / 100,
      custoIndiretoTotal: Math.round(custoIndiretoLinearMes * 100) / 100,
      custoTotal: Math.round(custoTotal * 100) / 100,
      faturamentoMensal: Math.round(faturamentoMensal * 100) / 100,
      descontoAdiantamento: Math.round(descontoAdiantamento * 100) / 100,
      retencaoContratual: Math.round(retencaoContratual * 100) / 100,
      impostos: Math.round(impostos * 100) / 100,
      recebimentoLiquido: Math.round(recebimentoLiquido * 100) / 100,
      fluxoCaixaMensal: Math.round(fluxoCaixaMensal * 100) / 100,
      fluxoCaixaAcumulado: Math.round(fluxoCaixaAcumulado * 100) / 100
    };
  });

  return resultadoDRE;
}

/**
 * AVANÇO FÍSICO INVERSO (APONTAMENTO PQ -> % CONCLUÍDO DO CRONOGRAMA MS PROJECT)
 * Calcula o avanço ponderado pelo custo direto de cada SEQ dentro da tarefa:
 * % Avanço = SUM(Q_Realizada * Custo_Unit) / SUM(Q_Prevista * Custo_Unit)
 */
export function calculateWeeklyTaskProgress(
  tasks: ScheduleTask[],
  allocations: AllocationLink[],
  weeklyProgress: WeeklyProgressItem[],
  pqItems: PQItem[]
): Map<number, {
  percentualConcluido: number;
  custoPrevisto: number;
  custoRealizado: number;
  superouTeto: boolean;
}> {
  const pqMap = new Map<string, PQItem>(pqItems.map((item) => [item.id, item]));

  // Agrupa apontamentos realizados acumulados por SEQ
  const realizadoPorSeqMap = new Map<number, number>();
  weeklyProgress.forEach((p) => {
    const cur = realizadoPorSeqMap.get(p.seq) || 0;
    realizadoPorSeqMap.set(p.seq, cur + (Number(p.quantidadeRealizadaSemana) || 0));
  });

  // Agrupa alocações por taskUniqueId
  const linksByTask = new Map<number, AllocationLink[]>();
  allocations.forEach((link) => {
    if (!linksByTask.has(link.taskUniqueId)) {
      linksByTask.set(link.taskUniqueId, []);
    }
    linksByTask.get(link.taskUniqueId)!.push(link);
  });

  const resultMap = new Map<number, {
    percentualConcluido: number;
    custoPrevisto: number;
    custoRealizado: number;
    superouTeto: boolean;
  }>();

  tasks.forEach((task) => {
    const taskLinks = linksByTask.get(task.uniqueId) || [];
    if (taskLinks.length === 0) {
      resultMap.set(task.uniqueId, {
        percentualConcluido: 0,
        custoPrevisto: 0,
        custoRealizado: 0,
        superouTeto: false
      });
      return;
    }

    let somaPrevistaPonderada = 0;
    let somaRealizadaPonderada = 0;

    taskLinks.forEach((link) => {
      const pqItem = pqMap.get(link.pqItemId);
      const custoUnit = pqItem ? pqItem.precoUnitarioCustoDireto || 0 : 0;
      const qtdPrevista = link.calculatedQuantity || 0;
      const qtdRealizada = realizadoPorSeqMap.get(link.seq) || 0;

      somaPrevistaPonderada += qtdPrevista * custoUnit;
      somaRealizadaPonderada += qtdRealizada * custoUnit;
    });

    const percentualBruto = somaPrevistaPonderada > 0
      ? (somaRealizadaPonderada / somaPrevistaPonderada) * 100
      : 0;

    const superouTeto = percentualBruto > 100.01;
    const percentualConcluido = Math.min(100, Math.round(percentualBruto * 10) / 10);

    resultMap.set(task.uniqueId, {
      percentualConcluido,
      custoPrevisto: Math.round(somaPrevistaPonderada * 100) / 100,
      custoRealizado: Math.round(somaRealizadaPonderada * 100) / 100,
      superouTeto
    });
  });

  return resultMap;
}
