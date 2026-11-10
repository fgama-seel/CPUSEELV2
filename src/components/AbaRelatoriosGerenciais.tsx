import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CalendarRange,
  Users,
  Upload,
  ChevronDown,
  ChevronRight,
  ListTree,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Download,
  Sparkles,
  Info,
  Truck,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wrench,
  Edit3,
  Save,
  Calendar
} from 'lucide-react';
import { Obra, CPU, TarefaCronograma, ItemCustoIndireto, ScheduleTask, AllocationLink, PQItem, ParametrosFluxoCaixa } from '../types';
import {
  formatMoney,
  exportarCurvaS,
  exportarHistogramaRecursos,
  exportarCronogramaProject
} from '../lib/excelExport';
import { calculateTemporalProjections } from '../lib/allocationEngine';
import { subscribeCustosIndiretos } from '../services/dbService';
import { ModalImportarCronogramaProject } from './ModalImportarCronogramaProject';
import { ModalPadraoPlanilhaProject } from './ModalPadraoPlanilhaProject';

interface AbaRelatoriosGerenciaisProps {
  activeObra: Obra | null;
  cpus: CPU[];
  onSelectTab?: (tab: any) => void;
  scheduleTasks?: any[];
  allocationLinks?: any[];
  pqItems?: any[];
  parametrosCaixa?: any;
  onUpdateParametrosCaixa?: (params: any) => void;
}

interface RecursoConsolidado {
  id: string;
  codigo?: string;
  nome: string;
  categoria: 'Mão de Obra' | 'Equipamento';
  natureza: 'Direto (CPU)' | 'Indireto (Apoio)';
  unidade: string;
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
  percTotal: number;
}

export const AbaRelatoriosGerenciais: React.FC<AbaRelatoriosGerenciaisProps> = ({
  activeObra,
  cpus,
  onSelectTab,
  scheduleTasks,
  allocationLinks,
  pqItems,
  parametrosCaixa,
  onUpdateParametrosCaixa
}) => {
  const [subTab, setSubTab] = useState<'curva_s' | 'histograma'>('curva_s');
  const [isModalProjectOpen, setIsModalProjectOpen] = useState(false);
  const [isModalPadraoOpen, setIsModalPadraoOpen] = useState(false);
  const [itensIndiretos, setItensIndiretos] = useState<ItemCustoIndireto[]>([]);
  const [editingMes, setEditingMes] = useState<string | null>(null);
  const [editFatVal, setEditFatVal] = useState<number>(0);
  const [editRecVal, setEditRecVal] = useState<number>(0);

  // Filtros do Histograma
  const [filtroCategoria, setFiltroCategoria] = useState<'TODOS' | 'MO' | 'EQ'>('TODOS');
  const [filtroNatureza, setFiltroNatureza] = useState<'TODOS' | 'DIRETO' | 'INDIRETO'>('TODOS');
  const [buscaRecurso, setBuscaRecurso] = useState('');

  // Subscribe aos itens de custos indiretos da obra (Adm Local, Equipamentos, Canteiro)
  useEffect(() => {
    if (!activeObra) return;
    const unsub = subscribeCustosIndiretos(activeObra.id, (list) => {
      setItensIndiretos(list);
    });
    return () => unsub();
  }, [activeObra?.id]);

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700">Nenhuma obra selecionada</h3>
        <p className="text-sm">Selecione uma obra no menu lateral para visualizar os Relatórios Gerenciais.</p>
      </div>
    );
  }

  // 1. Cálculos de Custos Diretos e Indiretos Reais
  let custoDiretoTotal = 0;
  let custoIndiretoCpus = 0;
  let vendaTotal = 0;

  cpus.forEach((cpu) => {
    const qtd = Number(cpu.quantidade_prevista) || 1;
    let cUnt = 0;
    if (cpu.insumos) {
      cpu.insumos.forEach((ins) => {
        cUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }
    const cTotal = cUnt * qtd;
    const bdi = activeObra.bdi ?? 25;
    const vUnt = cpu.vendaDefinida ? (Number(cpu.preco_venda) || 0) : cUnt * (1 + bdi / 100);
    const vTotal = vUnt * qtd;

    vendaTotal += vTotal;

    if (cpu.isCustoIndireto) {
      custoIndiretoCpus += cTotal;
    } else {
      custoDiretoTotal += cTotal;
    }
  });

  const totalItensIndiretosAvulsos = itensIndiretos.reduce((acc, i) => acc + (Number(i.custoTotal) || 0), 0);
  const custoIndiretoConsolidado = custoIndiretoCpus + totalItensIndiretosAvulsos;
  const custoTotalGeral = custoDiretoTotal + custoIndiretoConsolidado;

  // 2. Tarefas do Cronograma MS Project salvas na Obra
  const tarefasProject = activeObra.cronogramaTarefas || [];

  // 3. CÁLCULO DA CURVA S REAL (ESTRITAMENTE BASEADA NO CRONOGRAMA FORNECIDO)
  // Sem cronograma, NENHUM dado fictício é inventado.
  const dadosCurvaS = useMemo(() => {
    if (tarefasProject.length === 0) return [];

    // Filtra tarefas válidas com início, término e custo
    const tarefasComCusto = tarefasProject.filter(
      (t) => t.inicio && t.termino && (t.custoPrevisto || 0) > 0 && !t.isResumo
    );

    // Se nenhuma folha tem custo, usa tarefas gerais com datas
    const tarefasParaCurva = tarefasComCusto.length > 0
      ? tarefasComCusto
      : tarefasProject.filter((t) => t.inicio && t.termino && !t.isResumo);

    if (tarefasParaCurva.length === 0) return [];

    // Identificar meses reais a partir das datas das tarefas
    const mesesMap: Record<string, { mesAno: string; sortKey: string; valorPrevisto: number }> = {};

    tarefasParaCurva.forEach((t) => {
      const dtIni = new Date(t.inicio);
      const dtFim = new Date(t.termino);
      if (isNaN(dtIni.getTime()) || isNaN(dtFim.getTime()) || dtFim < dtIni) return;

      const custo = Number(t.custoPrevisto) || 0;

      // Calcular número de meses que a tarefa abrange
      const anoIni = dtIni.getFullYear();
      const mesIni = dtIni.getMonth();
      const anoFim = dtFim.getFullYear();
      const mesFim = dtFim.getMonth();

      const totalMesesTarefa = Math.max(1, (anoFim - anoIni) * 12 + (mesFim - mesIni) + 1);
      const custoPorMes = custo / totalMesesTarefa;

      let curAno = anoIni;
      let curMes = mesIni;

      while (curAno < anoFim || (curAno === anoFim && curMes <= mesFim)) {
        const nomesMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const rotulo = `${nomesMeses[curMes]}/${String(curAno).substring(2)}`;
        const sortKey = `${curAno}-${String(curMes + 1).padStart(2, '0')}`;

        if (!mesesMap[sortKey]) {
          mesesMap[sortKey] = {
            mesAno: rotulo,
            sortKey,
            valorPrevisto: 0
          };
        }
        mesesMap[sortKey].valorPrevisto += custoPorMes;

        curMes++;
        if (curMes > 11) {
          curMes = 0;
          curAno++;
        }
      }
    });

    const chavesOrdenadas = Object.keys(mesesMap).sort();
    if (chavesOrdenadas.length === 0) return [];

    const custoTotalTarefas = chavesOrdenadas.reduce((acc, k) => acc + mesesMap[k].valorPrevisto, 0);
    const baseCusto = custoTotalTarefas > 0 ? custoTotalTarefas : custoTotalGeral;

    let acumPerc = 0;
    let acumValor = 0;

    return chavesOrdenadas.map((k, index) => {
      const item = mesesMap[k];
      const percMes = baseCusto > 0 ? (item.valorPrevisto / baseCusto) * 100 : 0;
      acumPerc += percMes;
      acumValor += item.valorPrevisto;

      return {
        mes: item.mesAno,
        sortKey: item.sortKey,
        num: index + 1,
        valorMensal: item.valorPrevisto,
        percDesembolso: percMes,
        acumPerc: Math.min(100, acumPerc),
        acumValor
      };
    });
  }, [tarefasProject, custoTotalGeral]);

  // 4. CÁLCULO REAL DO HISTOGRAMA (MÃO DE OBRA E EQUIPAMENTOS)
  // Consolidado estritamente a partir dos Insumos Reais das CPUs e dos Itens de Apoio dos Custos Indiretos
  const recursosHistograma = useMemo(() => {
    const lista: RecursoConsolidado[] = [];
    const baseCustoRef = custoTotalGeral > 0 ? custoTotalGeral : 1;

    // A. Mão de Obra Indireta (Adm Local) - dos Custos Indiretos reais
    itensIndiretos
      .filter((i) => i.categoria === 'ADM_LOCAL_MO')
      .forEach((item) => {
        const qtd = Number(item.quantidade) || 0;
        const prUnt = Number(item.precoUnitario) || 0;
        const cTotal = Number(item.custoTotal) || qtd * prUnt;
        lista.push({
          id: `ind-mo-${item.id}`,
          codigo: item.codigo || 'MOI',
          nome: item.descricao,
          categoria: 'Mão de Obra',
          natureza: 'Indireto (Apoio)',
          unidade: item.unidade || 'MÊS',
          quantidade: qtd,
          custoUnitario: prUnt,
          custoTotal: cTotal,
          percTotal: (cTotal / baseCustoRef) * 100
        });
      });

    // B. Equipamentos Indiretos (Apoio, Transporte e Canteiro) - dos Custos Indiretos reais
    itensIndiretos
      .filter((i) => i.categoria === 'EQUIPAMENTOS_INDIRETOS')
      .forEach((item) => {
        const qtd = Number(item.quantidade) || 0;
        const prUnt = Number(item.precoUnitario) || 0;
        const cTotal = Number(item.custoTotal) || qtd * prUnt;
        lista.push({
          id: `ind-eq-${item.id}`,
          codigo: item.codigo || 'EQI',
          nome: item.descricao,
          categoria: 'Equipamento',
          natureza: 'Indireto (Apoio)',
          unidade: item.unidade || 'MÊS',
          quantidade: qtd,
          custoUnitario: prUnt,
          custoTotal: cTotal,
          percTotal: (cTotal / baseCustoRef) * 100
        });
      });

    // C. Mão de Obra Direta e Equipamentos Diretos - dos Insumos Reais dentro das CPUs
    const mapaInsumosDiretos: Record<
      string,
      {
        codigo: string;
        descricao: string;
        tipo: 'Mão de Obra' | 'Equipamento';
        unid: string;
        qtdAcum: number;
        custoAcum: number;
      }
    > = {};

    cpus.forEach((cpu) => {
      const qtdCpu = Number(cpu.quantidade_prevista) || 1;
      if (!cpu.insumos) return;

      cpu.insumos.forEach((ins) => {
        const tipoNorm = (ins.tipo || '').toLowerCase();
        let categoriaRecurso: 'Mão de Obra' | 'Equipamento' | null = null;

        if (tipoNorm.includes('mão') || tipoNorm.includes('mao') || tipoNorm === 'mo') {
          categoriaRecurso = 'Mão de Obra';
        } else if (tipoNorm.includes('equip') || tipoNorm === 'eq') {
          categoriaRecurso = 'Equipamento';
        }

        if (!categoriaRecurso) return;

        const chave = `${categoriaRecurso}-${ins.id_insumo || ins.descricao}`.toLowerCase();
        const coef = Number(ins.coef) || 0;
        const prUnit = Number(ins.pr_unit) || 0;
        const qtdInsumo = coef * qtdCpu;
        const custoInsumo = qtdInsumo * prUnit;

        if (!mapaInsumosDiretos[chave]) {
          mapaInsumosDiretos[chave] = {
            codigo: ins.id_insumo || '-',
            descricao: ins.descricao,
            tipo: categoriaRecurso,
            unid: ins.unid || 'h',
            qtdAcum: 0,
            custoAcum: 0
          };
        }

        mapaInsumosDiretos[chave].qtdAcum += qtdInsumo;
        mapaInsumosDiretos[chave].custoAcum += custoInsumo;
      });
    });

    Object.values(mapaInsumosDiretos).forEach((ins, idx) => {
      const prMedio = ins.qtdAcum > 0 ? ins.custoAcum / ins.qtdAcum : 0;
      lista.push({
        id: `dir-${ins.tipo}-${idx}`,
        codigo: ins.codigo,
        nome: ins.descricao,
        categoria: ins.tipo,
        natureza: 'Direto (CPU)',
        unidade: ins.unid,
        quantidade: Math.round(ins.qtdAcum * 100) / 100,
        custoUnitario: prMedio,
        custoTotal: ins.custoAcum,
        percTotal: (ins.custoAcum / baseCustoRef) * 100
      });
    });

    // Ordenar por maior custo total decrescente
    lista.sort((a, b) => b.custoTotal - a.custoTotal);
    return lista;
  }, [itensIndiretos, cpus, custoTotalGeral]);

  // Filtragem dos recursos do Histograma
  const recursosFiltrados = useMemo(() => {
    return recursosHistograma.filter((r) => {
      if (filtroCategoria === 'MO' && r.categoria !== 'Mão de Obra') return false;
      if (filtroCategoria === 'EQ' && r.categoria !== 'Equipamento') return false;

      if (filtroNatureza === 'DIRETO' && r.natureza !== 'Direto (CPU)') return false;
      if (filtroNatureza === 'INDIRETO' && r.natureza !== 'Indireto (Apoio)') return false;

      if (buscaRecurso) {
        const b = buscaRecurso.toLowerCase();
        return (
          r.nome.toLowerCase().includes(b) ||
          (r.codigo && r.codigo.toLowerCase().includes(b)) ||
          r.unidade.toLowerCase().includes(b)
        );
      }
      return true;
    });
  }, [recursosHistograma, filtroCategoria, filtroNatureza, buscaRecurso]);

  // Totais do Histograma
  const totalCustoRecursosFiltrados = recursosFiltrados.reduce((a, b) => a + b.custoTotal, 0);
  const totalMO = recursosHistograma.filter((r) => r.categoria === 'Mão de Obra');
  const totalEQ = recursosHistograma.filter((r) => r.categoria === 'Equipamento');
  const custoTotalMO = totalMO.reduce((a, b) => a + b.custoTotal, 0);
  const custoTotalEQ = totalEQ.reduce((a, b) => a + b.custoTotal, 0);

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full space-y-6">
      {/* HEADER DA ABA */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Painel Executivo
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">
              {activeObra.codigo} - {activeObra.nome}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Relatórios Gerenciais & Cronograma</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Apresentação gerencial sem dados fictícios: Curva S físico-financeira baseada nas datas do MS Project, histograma consolidado de Mão de Obra e Equipamentos (com filtros e exportação) e EAP com ID Exclusiva.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalPadraoOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Ver o padrão de planilha e colunas necessárias para importar do MS Project sem erro"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Padrão de Planilha MS Project</span>
          </button>

          <button
            onClick={() => setIsModalProjectOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CalendarRange className="w-4 h-4" />
            <span>Importar Cronograma (MS Project)</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS EXECUTIVOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            Venda Total Contrato
          </span>
          <span className="text-lg font-black text-emerald-700 font-mono block mt-1">
            {formatMoney(vendaTotal)}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Preço de Venda das CPUs
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase block tracking-wider">
            Mão de Obra (MO Total)
          </span>
          <span className="text-lg font-black text-blue-900 font-mono block mt-1">
            {formatMoney(custoTotalMO)}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
            {totalMO.length} funções (Diretas + Indiretas)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
            Equipamentos (EQ Total)
          </span>
          <span className="text-lg font-black text-amber-950 font-mono block mt-1">
            {formatMoney(custoTotalEQ)}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
            {totalEQ.length} equipamentos (Diretos + Indiretos)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs">
          <span className="text-[10px] font-bold text-indigo-700 uppercase block tracking-wider">
            Cronograma MS Project
          </span>
          <span className="text-lg font-black text-indigo-950 font-mono block mt-1">
            {tarefasProject.length} Tarefas
          </span>
          <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
            {tarefasProject.length > 0 ? 'Cronograma Carregado' : 'Aguardando Importação'}
          </span>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUB-ABAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-3 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setSubTab('curva_s')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              subTab === 'curva_s'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Curva S, Desembolso & Fluxo de Caixa (M / M+1 / M+2)</span>
          </button>

          <button
            onClick={() => setSubTab('histograma')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              subTab === 'histograma'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Histograma de Recursos (MO & Equipamentos)</span>
          </button>
        </div>

        {/* CONTEÚDO 1: CURVA S DE DESEMBOLSO (REAL, SEM DADOS FICTÍCIOS) */}
        {subTab === 'curva_s' && (
          <div className="p-5 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Curva S & Cronograma Físico-Financeiro</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculado a partir das tarefas do cronograma com ciclo de caixa configurável (Produção em M, Faturamento em M+1 e Recebimento em M+2).
                </p>
              </div>

              {dadosCurvaS.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportarCurvaS(dadosCurvaS, activeObra)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Curva S (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>

            {/* PAINEL DE CONTROLE DO CICLO OPERACIONAL: M -> M+1 -> M+2 */}
            {parametrosCaixa && onUpdateParametrosCaixa && (
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-sm border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Ciclo Temporal de Produção, Faturamento e Recebimento
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Edite os prazos globais ou ajuste meses específicos diretamente na tabela abaixo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                    <label className="text-[11px] text-slate-300 block mb-1">
                      1. Produção Física
                    </label>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      Mês M (Execução em Campo)
                    </span>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                    <label className="text-[11px] text-slate-300 block mb-1">
                      2. Emissão de Faturamento
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">M +</span>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={parametrosCaixa.mesFaturamentoOffset !== undefined ? parametrosCaixa.mesFaturamentoOffset : 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          onUpdateParametrosCaixa({
                            ...parametrosCaixa,
                            mesFaturamentoOffset: val
                          });
                        }}
                        className="w-16 bg-white/20 border border-white/20 text-white font-mono font-bold px-2 py-1 rounded text-center"
                      />
                      <span className="text-[10px] text-slate-300">mês (Padrão: M+1)</span>
                    </div>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                    <label className="text-[11px] text-slate-300 block mb-1">
                      3. Liquidação / Recebimento em Caixa
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">M +</span>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={parametrosCaixa.mesRecebimentoOffset !== undefined ? parametrosCaixa.mesRecebimentoOffset : 2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          onUpdateParametrosCaixa({
                            ...parametrosCaixa,
                            mesRecebimentoOffset: val
                          });
                        }}
                        className="w-16 bg-white/20 border border-white/20 text-white font-mono font-bold px-2 py-1 rounded text-center"
                      />
                      <span className="text-[10px] text-slate-300">meses (Padrão: M+2)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SE NÃO HOUVER DADOS DE CRONOGRAMA */}
            {dadosCurvaS.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    Aguardando cronograma para projeção da Curva S
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Importe seu cronograma na aba <strong>Cronograma Executivo</strong> para calcular a evolução financeira e o fluxo de caixa real.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* GRÁFICO VISUAL DA CURVA S REAL */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-4 text-xs font-bold text-slate-700">
                    <span>Evolução do Desembolso Mensal e Curva Acumulada Real</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block" /> Custo Mensal
                      </span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <span className="w-3 h-1 bg-emerald-600 inline-block" /> % Acumulado
                      </span>
                    </div>
                  </div>

                  <div className="h-52 flex items-end gap-1.5 pt-6 pb-2 px-2 border-b border-slate-300">
                    {dadosCurvaS.map((d) => {
                      const maiorPerc = Math.max(...dadosCurvaS.map((x) => x.percDesembolso), 1);
                      const alturaBarra = Math.max(8, (d.percDesembolso / maiorPerc) * 100);

                      return (
                        <div key={d.sortKey} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-30 font-mono">
                            <strong className="text-indigo-400 block">{d.mes}</strong>
                            <div>Desembolso: {formatMoney(d.valorMensal)} ({d.percDesembolso.toFixed(1)}%)</div>
                            <div className="text-emerald-400 font-bold">Acumulado: {d.acumPerc.toFixed(1)}% ({formatMoney(d.acumValor)})</div>
                          </div>

                          <span className="text-[9px] font-bold text-emerald-700 mb-1 opacity-80 group-hover:opacity-100">
                            {d.acumPerc.toFixed(0)}%
                          </span>

                          <div
                            className="w-full bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t transition-all group-hover:from-indigo-600 group-hover:to-indigo-400"
                            style={{ height: `${alturaBarra}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Rótulos dos meses */}
                  <div className="flex gap-1.5 pt-2 px-2 text-[9px] text-slate-500 font-mono justify-between">
                    {dadosCurvaS.map((d, i) => (
                      <span key={d.sortKey} className="flex-1 text-center truncate">
                        {dadosCurvaS.length > 18 ? (i % 2 === 0 ? d.mes : '') : d.mes}
                      </span>
                    ))}
                  </div>
                </div>

                {/* TABELA DE DESEMBOLSO MÊS A MÊS COM AJUSTES MANUAIS */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-white uppercase tracking-wider text-[11px]">
                        <th className="p-2.5">Mês / Ano</th>
                        <th className="p-2.5 text-center">Nº Mês</th>
                        <th className="p-2.5 text-right">Custo Desembolso Mês</th>
                        <th className="p-2.5 text-right">% Desembolso</th>
                        <th className="p-2.5 text-right">Faturamento Previsto</th>
                        <th className="p-2.5 text-right">% Acumulado</th>
                        <th className="p-2.5 text-right">Custo Acumulado</th>
                        <th className="p-2.5 text-center w-20">Ajuste Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {dadosCurvaS.map((d) => {
                        const ajuste = parametrosCaixa?.ajustesMensaisManual?.[d.mes];
                        const isEditingThis = editingMes === d.mes;

                        return (
                          <tr key={d.sortKey} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800 font-sans">
                              {d.mes}
                              {ajuste && (
                                <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-sans">
                                  Editado
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center text-slate-400">{d.num}</td>
                            <td className="p-2.5 text-right text-slate-800">{formatMoney(d.valorMensal)}</td>
                            <td className="p-2.5 text-right text-indigo-700 font-bold">{d.percDesembolso.toFixed(2)}%</td>
                            <td className="p-2.5 text-right font-bold text-cyan-800">
                              {isEditingThis ? (
                                <input
                                  type="number"
                                  value={editFatVal}
                                  onChange={(e) => setEditFatVal(parseFloat(e.target.value) || 0)}
                                  className="w-28 text-right bg-white border border-indigo-500 rounded p-1 font-mono font-bold"
                                />
                              ) : (
                                formatMoney(ajuste?.faturamento !== undefined ? ajuste.faturamento : d.valorMensal * 1.25)
                              )}
                            </td>
                            <td className="p-2.5 text-right text-emerald-700 font-black">{d.acumPerc.toFixed(2)}%</td>
                            <td className="p-2.5 text-right font-black text-slate-900">{formatMoney(d.acumValor)}</td>
                            <td className="p-2.5 text-center">
                              {isEditingThis ? (
                                <button
                                  onClick={() => {
                                    if (onUpdateParametrosCaixa && parametrosCaixa) {
                                      const nextAjustes = {
                                        ...(parametrosCaixa.ajustesMensaisManual || {}),
                                        [d.mes]: {
                                          ...(parametrosCaixa.ajustesMensaisManual?.[d.mes] || {}),
                                          faturamento: editFatVal
                                        }
                                      };
                                      onUpdateParametrosCaixa({
                                        ...parametrosCaixa,
                                        ajustesMensaisManual: nextAjustes
                                      });
                                    }
                                    setEditingMes(null);
                                  }}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Salvar ajuste"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingMes(d.mes);
                                    setEditFatVal(ajuste?.faturamento !== undefined ? ajuste.faturamento : d.valorMensal * 1.25);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                  title="Editar faturamento deste mês"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={2} className="p-2.5 text-right uppercase text-xs">Total do Cronograma:</td>
                        <td className="p-2.5 text-right font-mono">{formatMoney(dadosCurvaS[dadosCurvaS.length - 1]?.acumValor || 0)}</td>
                        <td className="p-2.5 text-right text-indigo-700 font-mono">100.00%</td>
                        <td className="p-2.5 text-right font-mono">-</td>
                        <td className="p-2.5 text-right text-emerald-700 font-mono">100.00%</td>
                        <td className="p-2.5 text-right text-emerald-800 font-mono text-sm">{formatMoney(dadosCurvaS[dadosCurvaS.length - 1]?.acumValor || 0)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO 2: HISTOGRAMA DE RECURSOS (MÃO DE OBRA E EQUIPAMENTOS) COM FILTROS E EXPORTAÇÃO */}
        {subTab === 'histograma' && (
          <div className="p-5 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Histograma & Contingente de Recursos (Mão de Obra e Equipamentos)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidado 100% real a partir dos insumos das CPUs de produção e das equipes e veículos de apoio dos Custos Indiretos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportarHistogramaRecursos(recursosFiltrados, activeObra)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Histograma (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* BARRA DE FILTROS DO HISTOGRAMA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Filtro Categoria: MO vs Equipamento */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="px-2 font-bold text-slate-500">Recurso:</span>
                  <button
                    onClick={() => setFiltroCategoria('TODOS')}
                    className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                      filtroCategoria === 'TODOS'
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos ({recursosHistograma.length})
                  </button>
                  <button
                    onClick={() => setFiltroCategoria('MO')}
                    className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                      filtroCategoria === 'MO'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Mão de Obra ({totalMO.length})</span>
                  </button>
                  <button
                    onClick={() => setFiltroCategoria('EQ')}
                    className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 cursor-pointer ${
                      filtroCategoria === 'EQ'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Equipamentos ({totalEQ.length})</span>
                  </button>
                </div>

                {/* Filtro Natureza: Direto vs Indireto */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="px-2 font-bold text-slate-500">Origem:</span>
                  <button
                    onClick={() => setFiltroNatureza('TODOS')}
                    className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                      filtroNatureza === 'TODOS'
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroNatureza('DIRETO')}
                    className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                      filtroNatureza === 'DIRETO'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    Diretos (CPUs)
                  </button>
                  <button
                    onClick={() => setFiltroNatureza('INDIRETO')}
                    className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                      filtroNatureza === 'INDIRETO'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    Indiretos (Apoio)
                  </button>
                </div>
              </div>

              {/* Busca Textual */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={buscaRecurso}
                  onChange={(e) => setBuscaRecurso(e.target.value)}
                  placeholder="Pesquisar recurso..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {/* TABELA CONSOLIDADA DE RECURSOS (MO + EQUIPAMENTOS) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-24">Código</th>
                    <th className="p-3">Recurso / Função / Equipamento</th>
                    <th className="p-3 text-center w-28">Categoria</th>
                    <th className="p-3 text-center w-28">Natureza</th>
                    <th className="p-3 text-center w-20">Unidade</th>
                    <th className="p-3 text-right w-28">Qtd Total</th>
                    <th className="p-3 text-right w-32">Custo Unitário</th>
                    <th className="p-3 text-right w-36">Custo Total</th>
                    <th className="p-3 text-center w-20">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recursosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                        Nenhum recurso encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    recursosFiltrados.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-500">{item.codigo || '-'}</td>
                        <td className="p-3 font-bold text-slate-800">{item.nome}</td>
                        <td className="p-3 text-center">
                          {item.categoria === 'Mão de Obra' ? (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center justify-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>Mão de Obra</span>
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center justify-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>Equipamento</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.natureza === 'Direto (CPU)' ? (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Direto (CPU)
                            </span>
                          ) : (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              Indireto (Apoio)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-600">{item.unidade}</td>
                        <td className="p-3 text-right font-mono font-medium text-slate-700">
                          {item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">{formatMoney(item.custoUnitario)}</td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">{formatMoney(item.custoTotal)}</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-700">
                          {item.percTotal.toFixed(2)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {recursosFiltrados.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={7} className="p-3 text-right uppercase text-xs">Total dos Recursos Filtrados:</td>
                      <td className="p-3 text-right font-mono text-sm text-slate-900">{formatMoney(totalCustoRecursosFiltrados)}</td>
                      <td className="p-3 text-center font-mono text-xs text-indigo-700">
                        {recursosFiltrados.reduce((a, b) => a + b.percTotal, 0).toFixed(2)}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO 3: CRONOGRAMA MS PROJECT (ID EXCLUSIVA & ESTRUTURA DE TÓPICOS) */}
        {subTab === 'cronograma' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-indigo-600" />
                  <span>Estrutura Analítica do Projeto (WBS/EAP do MS Project)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualização hierárquica por nível de estrutura de tópicos e rastreabilidade por ID Exclusiva.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsModalPadraoOpen(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Padrão de Planilha</span>
                </button>

                {tarefasProject.length > 0 && (
                  <button
                    onClick={() => exportarCronogramaProject(tarefasProject, activeObra)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Cronograma (.xlsx)</span>
                  </button>
                )}

                <button
                  onClick={() => setIsModalProjectOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{tarefasProject.length > 0 ? 'Atualizar MS Project' : 'Importar Cronograma'}</span>
                </button>
              </div>
            </div>

            {tarefasProject.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                <CalendarRange className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Nenhum cronograma importado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Importe sua planilha do MS Project em formato Excel (<code>.xlsx</code>) ou CSV para habilitar a Curva S real e a visualização hierárquica por ID Exclusiva.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsModalPadraoOpen(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Ver Padrão de Planilha</span>
                  </button>
                  <button
                    onClick={() => setIsModalProjectOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar Cronograma</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white uppercase tracking-wider text-[11px]">
                      <th className="p-3 w-16 text-center">UID</th>
                      <th className="p-3 w-16 text-center">EDT</th>
                      <th className="p-3 w-20 text-center">Nível</th>
                      <th className="p-3">Nome da Tarefa (Estrutura de Tópicos)</th>
                      <th className="p-3 text-center w-24">Duração</th>
                      <th className="p-3 text-center w-28">Início</th>
                      <th className="p-3 text-center w-28">Término</th>
                      <th className="p-3 text-center w-24">% Concluído</th>
                      <th className="p-3 text-right w-32">Custo Previsto</th>
                      <th className="p-3 w-36">Recursos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {tarefasProject.map((t) => {
                      const paddingLeft = (t.nivelEstruturaTopicos - 1) * 20 + 8;
                      const isSummary = t.isResumo || t.nivelEstruturaTopicos === 1;

                      return (
                        <tr
                          key={t.id}
                          className={`transition ${
                            isSummary
                              ? 'bg-slate-50 font-bold text-slate-900 border-t border-slate-200'
                              : 'hover:bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          {/* ID Exclusiva */}
                          <td className="p-2.5 text-center">
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                              {t.idExclusiva || t.idLinha}
                            </span>
                          </td>

                          {/* WBS / EDT */}
                          <td className="p-2.5 text-center text-slate-500 font-bold">
                            {t.wbs || t.idLinha}
                          </td>

                          {/* Nível de Estrutura de Tópicos */}
                          <td className="p-2.5 text-center">
                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              Nvl {t.nivelEstruturaTopicos}
                            </span>
                          </td>

                          {/* Nome da Tarefa com recuo de tópicos */}
                          <td className="p-2.5" style={{ paddingLeft: `${paddingLeft}px` }}>
                            <div className="flex items-center gap-1.5">
                              {isSummary ? (
                                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 ml-1" />
                              )}
                              <span className={isSummary ? 'font-sans font-bold text-slate-900' : 'font-sans font-normal text-slate-700'}>
                                {t.nome}
                              </span>
                            </div>
                          </td>

                          {/* Duração */}
                          <td className="p-2.5 text-center text-slate-600">
                            {t.duracaoDias} dias
                          </td>

                          {/* Início e Término */}
                          <td className="p-2.5 text-center text-slate-600">{t.inicio || '-'}</td>
                          <td className="p-2.5 text-center text-slate-600">{t.termino || '-'}</td>

                          {/* % Concluído */}
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-700">{t.percentualConcluido ?? 0}%</span>
                              <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full"
                                  style={{ width: `${t.percentualConcluido ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Custo Previsto */}
                          <td className="p-2.5 text-right font-black text-slate-900">
                            {t.custoPrevisto ? formatMoney(t.custoPrevisto) : '-'}
                          </td>

                          {/* Recursos */}
                          <td className="p-2.5 text-slate-500 font-sans truncate">
                            {t.recursos || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE IMPORTAÇÃO DO MS PROJECT */}
      <ModalImportarCronogramaProject
        isOpen={isModalProjectOpen}
        obra={activeObra}
        onClose={() => setIsModalProjectOpen(false)}
        onSuccess={() => {}}
      />

      {/* MODAL DE PADRÃO DE PLANILHA MS PROJECT */}
      <ModalPadraoPlanilhaProject
        isOpen={isModalPadraoOpen}
        onClose={() => setIsModalPadraoOpen(false)}
      />
    </div>
  );
};
