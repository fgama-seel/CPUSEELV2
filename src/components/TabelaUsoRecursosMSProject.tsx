import React, { useState, useMemo } from 'react';
import {
  ListTree,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Download,
  Edit3,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Save,
  X,
  MessageSquare,
  HelpCircle,
  Package,
  Calculator
} from 'lucide-react';
import {
  ScheduleTask,
  AllocationLink,
  RecursoProjectConfig,
  PQItem,
  ParametrosFluxoCaixa,
  Obra,
  CPU
} from '../types';
import { formatMoney, exportarUsoRecursosProject } from '../lib/excelExport';

interface TabelaUsoRecursosMSProjectProps {
  activeObra: Obra | null;
  tasks: ScheduleTask[];
  allocationLinks: AllocationLink[];
  recursosConfig: RecursoProjectConfig[];
  pqItems: PQItem[];
  cpus?: CPU[];
  parametrosCaixa: ParametrosFluxoCaixa;
  onUpdateParametrosCaixa: (params: ParametrosFluxoCaixa) => void;
}

interface CelulaAjusteModalState {
  recursoId: string;
  recursoNome: string;
  mes: string;
  tipoDado: 'qtd' | 'custo' | 'faturamento';
  valorAtual: number;
  valorOriginal: number;
  motivo: string;
}

export const TabelaUsoRecursosMSProject: React.FC<TabelaUsoRecursosMSProjectProps> = ({
  activeObra,
  tasks,
  allocationLinks,
  recursosConfig,
  pqItems,
  cpus = [],
  parametrosCaixa,
  onUpdateParametrosCaixa
}) => {
  // Controle de expansão dos recursos (para ver tarefas filhas)
  const [expandedRecursos, setExpandedRecursos] = useState<Record<string, boolean>>({});
  // Filtro de linha ativa: exibe Qtd, Custo, Faturamento ou Todas
  const [tipoLinhaFiltro, setTipoLinhaFiltro] = useState<'TODAS' | 'QTD' | 'CUSTO' | 'FAT'>('TODAS');
  // Busca por nome do recurso ou tarefa
  const [buscaTexto, setBuscaTexto] = useState('');

  // Modal para ajuste manual de célula
  const [modalAjuste, setModalAjuste] = useState<CelulaAjusteModalState | null>(null);
  const [editValor, setEditValor] = useState<number>(0);
  const [editMotivo, setEditMotivo] = useState<string>('');

  // Período de Medição (Ciclo de Corte: do dia X ao dia Y)
  const diaInicio = parametrosCaixa.diaInicioMedicao ?? 26;
  const diaFim = parametrosCaixa.diaFimMedicao ?? 25;

  const toggleExpand = (recursoId: string) => {
    setExpandedRecursos((prev) => ({
      ...prev,
      [recursoId]: !prev[recursoId]
    }));
  };

  // Mapeia todas as tarefas por uniqueId
  const taskMap = useMemo(() => new Map<number, ScheduleTask>(tasks.map((t) => [t.uniqueId, t])), [tasks]);
  const pqMap = useMemo(() => new Map<string, PQItem>(pqItems.map((p) => [p.id, p])), [pqItems]);

  // Mapeamento do sequenciador "SEQ" a partir da tabela de CPUs
  const cpuSeqMap = useMemo(() => {
    const map = new Map<string, number>();
    cpus.forEach((c, idx) => {
      const numSeq = c.sequencia !== undefined ? c.sequencia : idx + 1;
      if (c.code) map.set(c.code.trim(), numSeq);
      if (c.id) map.set(c.id.trim(), numSeq);
    });
    return map;
  }, [cpus]);

  // Mapeamento do sequenciador a partir da PQ
  const pqSeqMap = useMemo(() => {
    const map = new Map<string, number>();
    pqItems.forEach((p, idx) => {
      const numSeq = p.seq !== undefined ? p.seq : idx + 1;
      map.set(p.id.trim(), numSeq);
      if (p.codigoRecursoProject) map.set(p.codigoRecursoProject.trim(), numSeq);
    });
    return map;
  }, [pqItems]);

  // Identifica todos os meses distintos presentes no cronograma
  const mesesOrdenados = useMemo(() => {
    const setMeses = new Set<string>();

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
        const key = `${curAno}-${String(curMes + 1).padStart(2, '0')}`;
        setMeses.add(key);
        curMes++;
        if (curMes > 11) {
          curMes = 0;
          curAno++;
        }
      }
    });

    const nomesMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const keys = Array.from(setMeses).sort();

    return keys.map((key) => {
      const [anoStr, mesStr] = key.split('-');
      const mesIndex = parseInt(mesStr, 10) - 1;
      const anoAbrev = anoStr.substring(2);
      return {
        key,
        rotulo: `${nomesMeses[mesIndex]}/${anoAbrev}`
      };
    });
  }, [tasks]);

  function nomesMeses(m: number): string {
    return ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][m];
  }

  // Agrupa alocações por Recurso Project e ORDENA PELO SEQUENCIADOR "SEQ" DA TABELA DE CPU
  const usoRecursosGrid = useMemo(() => {
    if (recursosConfig.length === 0 || tasks.length === 0) return [];

    const lista = recursosConfig.map((rec, rIdx) => {
      // Determina o sequenciador SEQ da CPU correspondente
      const seqCalculado =
        rec.seq ??
        cpuSeqMap.get(rec.nomeRecurso.trim()) ??
        cpuSeqMap.get(rec.id.trim()) ??
        pqSeqMap.get(rec.id.trim()) ??
        rIdx + 1;

      // Procura todas as alocações vinculadas a este recurso
      const linksDoRecurso = allocationLinks.filter(
        (l) => l.pqItemId === rec.id || l.pqItemId === rec.pqItemId || l.pqItemId === rec.nomeRecurso
      );

      // Tarefas onde este recurso está alocado
      const tarefasAlocadas = linksDoRecurso
        .map((link) => {
          const t = taskMap.get(link.taskUniqueId);
          if (!t) return null;
          return {
            task: t,
            link
          };
        })
        .filter(Boolean) as { task: ScheduleTask; link: AllocationLink }[];

      // Valores mensais calculados para este recurso
      const valoresMesQtd: Record<string, number> = {};
      const valoresMesCusto: Record<string, number> = {};
      const valoresMesFat: Record<string, number> = {};

      tarefasAlocadas.forEach(({ task, link }) => {
        if (!task.startDate || !task.finishDate) return;
        const dtIni = new Date(task.startDate);
        const dtFim = new Date(task.finishDate);
        if (isNaN(dtIni.getTime()) || isNaN(dtFim.getTime()) || dtFim < dtIni) return;

        const anoIni = dtIni.getFullYear();
        const mesIni = dtIni.getMonth();
        const anoFim = dtFim.getFullYear();
        const mesFim = dtFim.getMonth();
        const totalMeses = Math.max(1, (anoFim - anoIni) * 12 + (mesFim - mesIni) + 1);

        const qtdPorMes = (link.calculatedQuantity || 0) / totalMeses;
        const custoPorMes = (link.totalCostAllocated || qtdPorMes * rec.custoCpu) / totalMeses;
        const fatPorMes = (link.totalRevenueAllocated || qtdPorMes * rec.vendaCpu) / totalMeses;

        let curAno = anoIni;
        let curMes = mesIni;
        while (curAno < anoFim || (curAno === anoFim && curMes <= mesFim)) {
          const rotulo = `${nomesMeses(curMes)}/${String(curAno).substring(2)}`;
          valoresMesQtd[rotulo] = (valoresMesQtd[rotulo] || 0) + qtdPorMes;
          valoresMesCusto[rotulo] = (valoresMesCusto[rotulo] || 0) + custoPorMes;
          valoresMesFat[rotulo] = (valoresMesFat[rotulo] || 0) + fatPorMes;

          curMes++;
          if (curMes > 11) {
            curMes = 0;
            curAno++;
          }
        }
      });

      const totalQtd = Object.values(valoresMesQtd).reduce((a, b) => a + b, 0);
      const totalCusto = Object.values(valoresMesCusto).reduce((a, b) => a + b, 0);
      const totalFat = Object.values(valoresMesFat).reduce((a, b) => a + b, 0);

      return {
        rec,
        seq: seqCalculado,
        tarefasAlocadas,
        valoresMesQtd,
        valoresMesCusto,
        valoresMesFat,
        totalQtd,
        totalCusto,
        totalFat
      };
    });

    // ORDENAÇÃO ESTRITA PELO SEQUENCIADOR "SEQ" (1, 2, 3...) IGUAL À TABELA DE CPU
    lista.sort((a, b) => a.seq - b.seq);
    return lista;
  }, [recursosConfig, tasks, allocationLinks, taskMap, cpuSeqMap, pqSeqMap]);

  // Filtra por busca textual
  const filteredGrid = useMemo(() => {
    if (!buscaTexto) return usoRecursosGrid;
    const b = buscaTexto.toLowerCase();
    return usoRecursosGrid.filter(
      (item) =>
        item.rec.nomeRecurso.toLowerCase().includes(b) ||
        item.rec.descricaoRecurso.toLowerCase().includes(b) ||
        item.tarefasAlocadas.some((t) => t.task.name.toLowerCase().includes(b))
    );
  }, [usoRecursosGrid, buscaTexto]);

  // TOTALIZADOR GERAL DO TOPO: SOMA DE CADA COLUNA MENSAL (QTD, CUSTO E FATURAMENTO)
  const totaisColunasMes = useMemo(() => {
    const totalQtdMes: Record<string, number> = {};
    const totalCustoMes: Record<string, number> = {};
    const totalFatMes: Record<string, number> = {};

    filteredGrid.forEach((item) => {
      const ajustesRecurso = parametrosCaixa.ajustesRecursosManual?.[item.rec.id] || {};

      mesesOrdenados.forEach((m) => {
        const ajuste = ajustesRecurso[m.rotulo];

        const q = ajuste?.qtd !== undefined ? ajuste.qtd! : (item.valoresMesQtd[m.rotulo] || 0);
        const c = ajuste?.custo !== undefined ? ajuste.custo! : (item.valoresMesCusto[m.rotulo] || 0);
        const f = ajuste?.faturamento !== undefined ? ajuste.faturamento! : (item.valoresMesFat[m.rotulo] || 0);

        totalQtdMes[m.rotulo] = (totalQtdMes[m.rotulo] || 0) + q;
        totalCustoMes[m.rotulo] = (totalCustoMes[m.rotulo] || 0) + c;
        totalFatMes[m.rotulo] = (totalFatMes[m.rotulo] || 0) + f;
      });
    });

    const somaGeralQtd = Object.values(totalQtdMes).reduce((a, b) => a + b, 0);
    const somaGeralCusto = Object.values(totalCustoMes).reduce((a, b) => a + b, 0);
    const somaGeralFat = Object.values(totalFatMes).reduce((a, b) => a + b, 0);

    return {
      totalQtdMes,
      totalCustoMes,
      totalFatMes,
      somaGeralQtd,
      somaGeralCusto,
      somaGeralFat
    };
  }, [filteredGrid, mesesOrdenados, parametrosCaixa.ajustesRecursosManual]);

  // Salvar ajuste manual de célula
  const handleSalvarAjuste = () => {
    if (!modalAjuste) return;

    const { recursoId, mes, tipoDado } = modalAjuste;
    const keyRecurso = recursoId;
    const currentAjustes = parametrosCaixa.ajustesRecursosManual || {};
    const recursoAjustes = currentAjustes[keyRecurso] || {};

    const mesAjuste = recursoAjustes[mes] || {};
    const updatedMesAjuste = {
      ...mesAjuste,
      [tipoDado]: editValor,
      motivo: editMotivo || 'Ajuste manual de produção',
      editadoEm: new Date().toISOString()
    };

    const nextAjustes = {
      ...currentAjustes,
      [keyRecurso]: {
        ...recursoAjustes,
        [mes]: updatedMesAjuste
      }
    };

    onUpdateParametrosCaixa({
      ...parametrosCaixa,
      ajustesRecursosManual: nextAjustes
    });

    setModalAjuste(null);
  };

  // Reverter ajuste manual ao valor original do cronograma
  const handleReverterAjuste = (recursoId: string, mes: string, tipoDado: 'qtd' | 'custo' | 'faturamento') => {
    const currentAjustes = { ...(parametrosCaixa.ajustesRecursosManual || {}) };
    if (currentAjustes[recursoId] && currentAjustes[recursoId][mes]) {
      const mesAjuste = { ...currentAjustes[recursoId][mes] };
      delete mesAjuste[tipoDado];

      if (Object.keys(mesAjuste).length === 0 || (!mesAjuste.qtd && !mesAjuste.custo && !mesAjuste.faturamento)) {
        delete currentAjustes[recursoId][mes];
      } else {
        currentAjustes[recursoId][mes] = mesAjuste;
      }

      onUpdateParametrosCaixa({
        ...parametrosCaixa,
        ajustesRecursosManual: currentAjustes
      });
    }
    setModalAjuste(null);
  };

  const handleExportar = () => {
    const exportRows: any[] = [];
    const nomesMesesLista = mesesOrdenados.map((m) => m.rotulo);

    filteredGrid.forEach((item) => {
      exportRows.push({
        recurso: `SEQ ${String(item.seq).padStart(2, '0')} - ${item.rec.nomeRecurso} - ${item.rec.descricaoRecurso}`,
        tipoLinha: `Qtd (${item.rec.unidadeMaterial})`,
        valoresMes: item.valoresMesQtd,
        total: item.totalQtd
      });
      exportRows.push({
        recurso: `SEQ ${String(item.seq).padStart(2, '0')} - ${item.rec.nomeRecurso} - ${item.rec.descricaoRecurso}`,
        tipoLinha: 'Custo Projetado (R$)',
        valoresMes: item.valoresMesCusto,
        total: item.totalCusto
      });
      exportRows.push({
        recurso: `SEQ ${String(item.seq).padStart(2, '0')} - ${item.rec.nomeRecurso} - ${item.rec.descricaoRecurso}`,
        tipoLinha: 'Faturamento Projetado (R$)',
        valoresMes: item.valoresMesFat,
        total: item.totalFat
      });
    });

    exportarUsoRecursosProject(exportRows, nomesMesesLista, activeObra);
  };

  return (
    <div className="space-y-4">
      {/* PAINEL DE CONFIGURAÇÃO DO PERÍODO DE MEDIÇÃO & FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* PERÍODO DE MEDIÇÃO */}
        <div className="bg-indigo-50/80 p-3 rounded-lg border border-indigo-100 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <div className="text-[11px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
              <span>Período Oficial de Medição (Ciclo de Corte)</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-slate-600">Do dia</span>
              <input
                type="number"
                min="1"
                max="31"
                value={diaInicio}
                onChange={(e) => {
                  onUpdateParametrosCaixa({
                    ...parametrosCaixa,
                    diaInicioMedicao: parseInt(e.target.value, 10) || 1
                  });
                }}
                className="w-12 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-center font-bold text-indigo-900"
              />
              <span className="text-slate-600">ao dia</span>
              <input
                type="number"
                min="1"
                max="31"
                value={diaFim}
                onChange={(e) => {
                  onUpdateParametrosCaixa({
                    ...parametrosCaixa,
                    diaFimMedicao: parseInt(e.target.value, 10) || 1
                  });
                }}
                className="w-12 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-center font-bold text-indigo-900"
              />
              <span className="text-[11px] text-slate-500 italic">
                (Padrão Sabesp/Seel: corte do dia 26 ao dia 25)
              </span>
            </div>
          </div>
        </div>

        {/* FILTROS E EXPORTAÇÃO */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="px-2 font-bold text-slate-500">Exibir:</span>
            <button
              onClick={() => setTipoLinhaFiltro('TODAS')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                tipoLinhaFiltro === 'TODAS' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas as Linhas
            </button>
            <button
              onClick={() => setTipoLinhaFiltro('FAT')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                tipoLinhaFiltro === 'FAT' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Faturamento
            </button>
            <button
              onClick={() => setTipoLinhaFiltro('CUSTO')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                tipoLinhaFiltro === 'CUSTO' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custo CPU
            </button>
            <button
              onClick={() => setTipoLinhaFiltro('QTD')}
              className={`px-2 py-1 rounded font-bold cursor-pointer ${
                tipoLinhaFiltro === 'QTD' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Qtd Produção
            </button>
          </div>

          <button
            onClick={handleExportar}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* GRADE "USO DE RECURSOS" (PADRÃO MS PROJECT) COM TOTALIZADOR NO TOPO E ORDENADO POR SEQ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px]">
                <th className="p-3 w-80 sticky left-0 bg-slate-900 z-20 border-r border-slate-700">
                  Item da PQ / Recurso (Ordenado por SEQ)
                </th>
                <th className="p-3 w-36 border-r border-slate-700">Tipo de Dado</th>
                <th className="p-3 w-36 text-right border-r border-slate-700 font-bold">
                  Total Acumulado
                </th>
                {mesesOrdenados.map((m) => (
                  <th
                    key={m.key}
                    className="p-2 text-center w-28 border-r border-slate-700 font-mono font-bold"
                  >
                    {m.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {/* TOTALIZADOR NO TOPO (SOMA PREVISTA DE CADA COLUNA / MÊS) */}
              {filteredGrid.length > 0 && (
                <>
                  {/* TOTALIZADOR 1: FATURAMENTO PROJETADO DO MÊS */}
                  <tr className="bg-emerald-950 text-white font-bold border-b border-emerald-900">
                    <td className="p-2.5 sticky left-0 bg-emerald-950 z-10 border-r border-emerald-900 font-sans flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-black text-emerald-300 uppercase tracking-wider text-[11px]">
                        TOTAL PREVISTO: FATURAMENTO
                      </span>
                    </td>
                    <td className="p-2 border-r border-emerald-900 text-emerald-300 font-sans text-[10px] uppercase">
                      Receita Total (R$)
                    </td>
                    <td className="p-2 text-right border-r border-emerald-900 text-emerald-300 font-black text-sm">
                      {formatMoney(totaisColunasMes.somaGeralFat)}
                    </td>
                    {mesesOrdenados.map((m) => {
                      const val = totaisColunasMes.totalFatMes[m.rotulo] || 0;
                      return (
                        <td
                          key={`tot-fat-${m.key}`}
                          className="p-2 text-right border-r border-emerald-900 text-emerald-200 font-black text-xs"
                        >
                          {val > 0 ? formatMoney(val) : '-'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* TOTALIZADOR 2: CUSTO DIRETO PROJETADO DO MÊS */}
                  <tr className="bg-slate-900 text-white font-bold border-b-2 border-slate-800">
                    <td className="p-2.5 sticky left-0 bg-slate-900 z-10 border-r border-slate-800 font-sans flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="font-black text-rose-300 uppercase tracking-wider text-[11px]">
                        TOTAL PREVISTO: CUSTO DIRETO
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-800 text-rose-300 font-sans text-[10px] uppercase">
                      Custo Total (R$)
                    </td>
                    <td className="p-2 text-right border-r border-slate-800 text-rose-300 font-black text-sm">
                      {formatMoney(totaisColunasMes.somaGeralCusto)}
                    </td>
                    {mesesOrdenados.map((m) => {
                      const val = totaisColunasMes.totalCustoMes[m.rotulo] || 0;
                      return (
                        <td
                          key={`tot-cst-${m.key}`}
                          className="p-2 text-right border-r border-slate-800 text-rose-200 font-black text-xs"
                        >
                          {val > 0 ? formatMoney(val) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </>
              )}

              {/* LISTAGEM DOS RECURSOS ORDENADOS POR SEQ */}
              {filteredGrid.length === 0 ? (
                <tr>
                  <td colSpan={mesesOrdenados.length + 3} className="p-8 text-center text-slate-400 font-sans">
                    Nenhum recurso alocado para exibir no Uso de Recursos. Faça a alocação na aba{' '}
                    <strong>"Matriz PQ vs Cronograma"</strong>.
                  </td>
                </tr>
              ) : (
                filteredGrid.map((item) => {
                  const isExpanded = !!expandedRecursos[item.rec.id];
                  const ajustesRecurso = parametrosCaixa.ajustesRecursosManual?.[item.rec.id] || {};

                  return (
                    <React.Fragment key={`rec-${item.rec.id}`}>
                      {/* LINHA DO RECURSO (COM BADGE SEQ DA CPU) */}
                      <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-200 text-slate-900 hover:bg-slate-150 transition">
                        <td className="p-2 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 font-sans">
                          <div className="flex items-center gap-2">
                            {item.tarefasAlocadas.length > 0 && (
                              <button
                                onClick={() => toggleExpand(item.rec.id)}
                                className="p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* BADGE SEQ (IGUAL À TABELA DE CPU) */}
                            <span className="font-mono text-[10px] font-black bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                              SEQ {String(item.seq).padStart(2, '0')}
                            </span>

                            <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-mono text-indigo-900 font-black">{item.rec.nomeRecurso}</span>
                            <span className="text-slate-600 truncate max-w-[160px]" title={item.rec.descricaoRecurso}>
                              - {item.rec.descricaoRecurso}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-200 font-sans text-[11px] text-slate-600">
                          Resumo ({item.tarefasAlocadas.length} tarefas)
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 text-emerald-800 font-black">
                          {formatMoney(item.totalFat)}
                        </td>
                        {mesesOrdenados.map((m) => {
                          const valFat = item.valoresMesFat[m.rotulo] || 0;
                          return (
                            <td key={`rec-sum-${m.key}`} className="p-2 text-right border-r border-slate-200 font-bold text-slate-800">
                              {valFat > 0 ? formatMoney(valFat) : '-'}
                            </td>
                          );
                        })}
                      </tr>

                      {/* SUB-LINHA 1: FATURAMENTO PROJETADO */}
                      {(tipoLinhaFiltro === 'TODAS' || tipoLinhaFiltro === 'FAT') && (
                        <tr className="hover:bg-slate-50/80 text-[11px] text-slate-700">
                          <td className="p-2 pl-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                            ↳ Faturamento Contratual
                          </td>
                          <td className="p-2 border-r border-slate-200 text-emerald-700 font-semibold font-sans">
                            Faturamento Projetado (R$)
                          </td>
                          <td className="p-2 text-right border-r border-slate-200 font-bold text-emerald-800">
                            {formatMoney(item.totalFat)}
                          </td>
                          {mesesOrdenados.map((m) => {
                            const valOriginal = item.valoresMesFat[m.rotulo] || 0;
                            const ajuste = ajustesRecurso[m.rotulo];
                            const isAdjusted = ajuste?.faturamento !== undefined;
                            const valFinal = isAdjusted ? ajuste.faturamento! : valOriginal;

                            return (
                              <td
                                key={`fat-${m.key}`}
                                className={`p-2 text-right border-r border-slate-200 relative group cursor-pointer ${
                                  isAdjusted ? 'bg-amber-50 font-bold text-emerald-900' : ''
                                }`}
                                onClick={() => {
                                  setModalAjuste({
                                    recursoId: item.rec.id,
                                    recursoNome: `SEQ ${String(item.seq).padStart(2, '0')} - ${item.rec.nomeRecurso} - ${item.rec.descricaoRecurso}`,
                                    mes: m.rotulo,
                                    tipoDado: 'faturamento',
                                    valorAtual: valFinal,
                                    valorOriginal: valOriginal,
                                    motivo: ajuste?.motivo || ''
                                  });
                                  setEditValor(valFinal);
                                  setEditMotivo(ajuste?.motivo || '');
                                }}
                              >
                                {isAdjusted && (
                                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[7px] border-r-[7px] border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent" />
                                )}

                                {/* TOOLTIP FLUTUANTE AO PASSAR O MOUSE */}
                                {isAdjusted && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 font-sans">
                                    <div className="flex items-center gap-1.5 text-amber-400 font-bold pb-1 border-b border-slate-700">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>Ajuste Manual de Faturamento</span>
                                    </div>
                                    <div className="mt-1 space-y-0.5 font-mono text-[10px]">
                                      <div>Original Cronograma: {formatMoney(valOriginal)}</div>
                                      <div className="text-amber-300 font-bold">Ajustado: {formatMoney(valFinal)}</div>
                                    </div>
                                    {ajuste?.motivo && (
                                      <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-300 italic">
                                        "{ajuste.motivo}"
                                      </div>
                                    )}
                                  </div>
                                )}

                                <span>{valFinal > 0 ? formatMoney(valFinal) : '-'}</span>
                              </td>
                            );
                          })}
                        </tr>
                      )}

                      {/* SUB-LINHA 2: CUSTO PROJETADO */}
                      {(tipoLinhaFiltro === 'TODAS' || tipoLinhaFiltro === 'CUSTO') && (
                        <tr className="hover:bg-slate-50/80 text-[11px] text-slate-700">
                          <td className="p-2 pl-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                            ↳ Custo CPU Direto
                          </td>
                          <td className="p-2 border-r border-slate-200 text-rose-700 font-semibold font-sans">
                            Custo Projetado (R$)
                          </td>
                          <td className="p-2 text-right border-r border-slate-200 font-bold text-rose-800">
                            {formatMoney(item.totalCusto)}
                          </td>
                          {mesesOrdenados.map((m) => {
                            const valOriginal = item.valoresMesCusto[m.rotulo] || 0;
                            const ajuste = ajustesRecurso[m.rotulo];
                            const isAdjusted = ajuste?.custo !== undefined;
                            const valFinal = isAdjusted ? ajuste.custo! : valOriginal;

                            return (
                              <td
                                key={`cst-${m.key}`}
                                className={`p-2 text-right border-r border-slate-200 relative group cursor-pointer ${
                                  isAdjusted ? 'bg-amber-50 font-bold text-rose-900' : ''
                                }`}
                                onClick={() => {
                                  setModalAjuste({
                                    recursoId: item.rec.id,
                                    recursoNome: `SEQ ${String(item.seq).padStart(2, '0')} - ${item.rec.nomeRecurso} - ${item.rec.descricaoRecurso}`,
                                    mes: m.rotulo,
                                    tipoDado: 'custo',
                                    valorAtual: valFinal,
                                    valorOriginal: valOriginal,
                                    motivo: ajuste?.motivo || ''
                                  });
                                  setEditValor(valFinal);
                                  setEditMotivo(ajuste?.motivo || '');
                                }}
                              >
                                {isAdjusted && (
                                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[7px] border-r-[7px] border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent" />
                                )}
                                <span>{valFinal > 0 ? formatMoney(valFinal) : '-'}</span>
                              </td>
                            );
                          })}
                        </tr>
                      )}

                      {/* SUB-LINHA 3: QUANTIDADE DE PRODUÇÃO */}
                      {(tipoLinhaFiltro === 'TODAS' || tipoLinhaFiltro === 'QTD') && (
                        <tr className="hover:bg-slate-50/80 text-[11px] text-slate-700">
                          <td className="p-2 pl-8 sticky left-0 bg-white z-10 border-r border-slate-200 font-sans text-slate-600">
                            ↳ Quantidade Física
                          </td>
                          <td className="p-2 border-r border-slate-200 text-indigo-700 font-semibold font-sans">
                            Qtd Produção ({item.rec.unidadeMaterial})
                          </td>
                          <td className="p-2 text-right border-r border-slate-200 font-bold text-indigo-900">
                            {item.totalQtd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                            {item.rec.unidadeMaterial}
                          </td>
                          {mesesOrdenados.map((m) => {
                            const valOriginal = item.valoresMesQtd[m.rotulo] || 0;
                            const ajuste = ajustesRecurso[m.rotulo];
                            const isAdjusted = ajuste?.qtd !== undefined;
                            const valFinal = isAdjusted ? ajuste.qtd! : valOriginal;

                            return (
                              <td
                                key={`qtd-${m.key}`}
                                className={`p-2 text-right border-r border-slate-200 relative group cursor-pointer ${
                                  isAdjusted ? 'bg-amber-50 font-bold text-amber-900' : ''
                                }`}
                                onClick={() => {
                                  setModalAjuste({
                                    recursoId: item.rec.id,
                                    recursoNome: `SEQ ${String(item.seq).padStart(2, '0')} - ${item.rec.nomeRecurso} - ${item.rec.descricaoRecurso}`,
                                    mes: m.rotulo,
                                    tipoDado: 'qtd',
                                    valorAtual: valFinal,
                                    valorOriginal: valOriginal,
                                    motivo: ajuste?.motivo || ''
                                  });
                                  setEditValor(valFinal);
                                  setEditMotivo(ajuste?.motivo || '');
                                }}
                              >
                                {isAdjusted && (
                                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[7px] border-r-[7px] border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent" />
                                )}
                                <span>
                                  {valFinal > 0
                                    ? valFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '-'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      )}

                      {/* TAREFAS FILHAS DO RECURSO (EXPANSÍVEIS) */}
                      {isExpanded &&
                        item.tarefasAlocadas.map(({ task, link }, tIdx) => (
                          <tr
                            key={`task-${item.rec.id}-${task.uniqueId}-${tIdx}`}
                            className="bg-slate-50/70 text-[10px] text-slate-600 italic"
                          >
                            <td className="p-2 pl-12 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 font-sans">
                              <span className="font-mono font-bold text-slate-500 mr-1.5">{task.wbs}</span>
                              <span>{task.name}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200 font-sans text-slate-500">
                              Tarefa ({task.workingDaysDuration} DU)
                            </td>
                            <td className="p-2 text-right border-r border-slate-200 text-slate-700">
                              {link.calculatedQuantity.toFixed(2)} {item.rec.unidadeMaterial}
                            </td>
                            {mesesOrdenados.map((m) => {
                              return (
                                <td key={`tf-${m.key}`} className="p-2 text-right border-r border-slate-200">
                                  -
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / POPOVER PARA AJUSTE MANUAL COM REGISTRO DE JUSTIFICATIVA */}
      {modalAjuste && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Ajustar Produção Manualmente</h3>
              </div>
              <button
                onClick={() => setModalAjuste(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">{modalAjuste.recursoNome}</div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Mês / Competência: <strong>{modalAjuste.mes}</strong></span>
                  <span>Tipo: <strong className="uppercase">{modalAjuste.tipoDado}</strong></span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Valor Calculado pelo Cronograma: <strong>{modalAjuste.valorOriginal.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Novo Valor Ajustado
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editValor}
                  onChange={(e) => setEditValor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Motivo do Ajuste (Ficará na Janela de Observação)</span>
                </label>
                <textarea
                  rows={3}
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  placeholder="Ex: Chuva intensa no período; Paralisação de frente; Adiantamento contratual autorizado..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:border-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Esta justificativa aparecerá ao passar o mouse sobre o triângulo da célula.
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() =>
                    handleReverterAjuste(modalAjuste.recursoId, modalAjuste.mes, modalAjuste.tipoDado)
                  }
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Cronograma</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAjuste(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarAjuste}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Ajuste</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
