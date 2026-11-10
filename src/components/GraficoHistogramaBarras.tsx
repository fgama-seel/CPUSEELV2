import React, { useState, useMemo } from 'react';
import {
  Download,
  Filter,
  Eye,
  EyeOff,
  Layers,
  Users,
  Truck,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Clock,
  HelpCircle,
  Briefcase,
  Lock,
  Unlock,
  AlertTriangle,
  Edit3,
  Save,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  Obra,
  ItemCustoIndireto,
  CPU,
  PQItem,
  AllocationLink,
  ScheduleTask,
  ParametrosFluxoCaixa
} from '../types';
import { exportarHistogramaMensalMatriz } from '../lib/excelExport';

export interface MesHistogramaData {
  mesAno: string; // ex: "nov/26"
  sortKey: string; // ex: "2026-11"
  indireta: number;
  direta: number;
  equipamentos: number;
  total: number;
}

export interface FuncaoIndiretaDetalhada {
  id: string;
  cargo: string;
  qtdMax: number;
  isVerbaMensal?: boolean;
  temSobraFinal?: boolean;
  efetivoMensal: Record<string, number>;
}

export interface FuncaoDiretaDetalhada {
  id: string;
  funcao: string;
  cpuCodigo?: string;
  cpuNome?: string;
  horasMensais: Record<string, number>;
  temDesvio?: boolean;
  desvioMsg?: string;
}

export interface EquipamentoDetalhado {
  id: string;
  nome: string;
  qtdMax: number;
  isVerbaMensal?: boolean;
  temSobraFinal?: boolean;
  efetivoMensal: Record<string, number>;
}

interface GraficoHistogramaBarrasProps {
  dados: MesHistogramaData[];
  activeObra: Obra | null;
  horasMesDivisorPadrao?: number; // Padrão: 189.2
  onExportar?: () => void;
  cpus?: CPU[];
  pqItems?: PQItem[];
  allocationLinks?: AllocationLink[];
  scheduleTasks?: ScheduleTask[];
  itensIndiretos?: ItemCustoIndireto[];
  parametrosCaixa?: ParametrosFluxoCaixa;
  onUpdateParametrosCaixa?: (params: ParametrosFluxoCaixa) => void;
}

export const GraficoHistogramaBarras: React.FC<GraficoHistogramaBarrasProps> = ({
  dados,
  activeObra,
  horasMesDivisorPadrao = 189.2,
  cpus = [],
  pqItems = [],
  allocationLinks = [],
  scheduleTasks = [],
  itensIndiretos = [],
  parametrosCaixa,
  onUpdateParametrosCaixa
}) => {
  // Divisor de horas/mês para conversão de horas em pessoas (Padrão: 189,2 h = 1 pessoa/mês)
  const [horasDivisor, setHorasDivisor] = useState<number>(horasMesDivisorPadrao);

  // Filtros de visibilidade das séries do gráfico
  const [showIndireta, setShowIndireta] = useState(true);
  const [showDireta, setShowDireta] = useState(true);
  const [showEquipamentos, setShowEquipamentos] = useState(true);
  const [showTotal, setShowTotal] = useState(true);

  // Estado de expansão/recolhimento dos 3 tipos
  const [expandIndireta, setExpandIndireta] = useState(true);
  const [expandDireta, setExpandDireta] = useState(true);
  const [expandEquipamentos, setExpandEquipamentos] = useState(true);

  // Trava de linhas por cadeado
  const locks = useMemo<Record<string, boolean>>(() => {
    return parametrosCaixa?.recursosHistogramaTravados || {};
  }, [parametrosCaixa?.recursosHistogramaTravados]);

  // Alterna o estado do cadeado em uma linha do histograma
  const toggleLockRow = (resourceId: string) => {
    if (!onUpdateParametrosCaixa || !parametrosCaixa) return;
    const currentLocks = parametrosCaixa.recursosHistogramaTravados || {};
    const nextLocks = {
      ...currentLocks,
      [resourceId]: !currentLocks[resourceId]
    };
    onUpdateParametrosCaixa({
      ...parametrosCaixa,
      recursosHistogramaTravados: nextLocks
    });
  };

  // 1. PROCESSAMENTO DE MÃO DE OBRA INDIRETA (100% REAL)
  const funcoesIndiretas: FuncaoIndiretaDetalhada[] = useMemo(() => {
    const moIndiretaItens = itensIndiretos.filter((i) => i.categoria === 'ADM_LOCAL_MO');
    const resultado: FuncaoIndiretaDetalhada[] = [];

    // A. Dos itens de Custos Indiretos da Obra
    moIndiretaItens.forEach((item) => {
      const id = `ind-${item.id}`;
      const isVerba = (item.unidade || '').toUpperCase().includes('MES') || (item.unidade || '').toUpperCase().includes('GB');
      const totalQtd = Number(item.quantidade) || 1;
      const numMeses = Math.max(1, dados.length);

      const basePerMes = isVerba ? Math.floor(totalQtd / numMeses) || 1 : Math.round(totalQtd);
      const sobra = isVerba ? totalQtd - (basePerMes * numMeses) : 0;

      const dtIni = item.dataInicio ? new Date(item.dataInicio + 'T00:00:00') : null;
      const dtFim = item.dataFim ? new Date(item.dataFim + 'T23:59:59') : null;

      const mapa: Record<string, number> = {};
      dados.forEach((d, idx) => {
        let isActive = true;
        if (dtIni && dtFim) {
          const [ano, mes] = d.sortKey.split('-').map(Number);
          const monthStart = new Date(ano, mes - 1, 1);
          const monthEnd = new Date(ano, mes, 0);
          isActive = monthEnd >= dtIni && monthStart <= dtFim;
        }

        let val = 0;
        if (isActive) {
          val = basePerMes;
          if (isVerba && idx === dados.length - 1 && sobra > 0) {
            val += sobra;
          }
        }
        mapa[d.mesAno] = val;
      });

      resultado.push({
        id,
        cargo: item.descricao,
        qtdMax: Math.max(0, ...Object.values(mapa)),
        isVerbaMensal: isVerba,
        temSobraFinal: sobra > 0,
        efetivoMensal: mapa
      });
    });

    // B. Das CPUs marcadas como Custo Indireto (isCustoIndireto === true)
    const cpusIndiretasMO: CPU[] = cpus.filter(
      (c) => c.isCustoIndireto && c.insumos && c.insumos.some((ins) => (ins.tipo || '').toLowerCase().includes('mão') || (ins.tipo || '').toLowerCase().includes('mo'))
    );

    const taskMap = new Map<number, ScheduleTask>(scheduleTasks.map((t) => [t.uniqueId, t]));
    const pqMap = new Map<string, PQItem>(pqItems.map((p) => [p.id, p]));

    cpusIndiretasMO.forEach((cpu) => {
      // Procura tarefas vinculadas a esta CPU indireta
      const taskLinks = allocationLinks
        .map((link) => ({ task: taskMap.get(link.taskUniqueId), pqItem: pqMap.get(link.pqItemId) }))
        .filter((l) => l.task && l.pqItem)
        .filter((l) => (
          (cpu.sequencia !== undefined && cpu.sequencia === l.pqItem!.seq) ||
          cpu.code === l.pqItem!.codigoRecursoProject ||
          cpu.id === l.pqItem!.id ||
          cpu.nome === l.pqItem!.descricao
        ));

      cpu.insumos.forEach((ins) => {
        const tNorm = (ins.tipo || '').toLowerCase();
        if (!tNorm.includes('mão') && !tNorm.includes('mo')) return;

        const id = `cpu-ind-${cpu.id}-${ins.id_insumo || ins.descricao}`;
        const isVerba = (ins.unid || '').toUpperCase().includes('MES') || (ins.unid || '').toUpperCase().includes('GB');
        const coef = Number(ins.coef) || 1;
        const mapa: Record<string, number> = {};

        if (taskLinks.length > 0) {
          taskLinks.forEach(({ task }) => {
            if (!task || !task.startDate || !task.finishDate) return;
            const dtIni = new Date(task.startDate + 'T00:00:00');
            const dtFim = new Date(task.finishDate + 'T23:59:59');
            if (isNaN(dtIni.getTime()) || isNaN(dtFim.getTime())) return;

            dados.forEach((d) => {
              const [ano, mes] = d.sortKey.split('-').map(Number);
              const monthStart = new Date(ano, mes - 1, 1);
              const monthEnd = new Date(ano, mes, 0);
              if (monthEnd >= dtIni && monthStart <= dtFim) {
                mapa[d.mesAno] = (mapa[d.mesAno] || 0) + Math.max(1, Math.round(coef));
              }
            });
          });
        } else {
          dados.forEach((d) => {
            mapa[d.mesAno] = Math.max(1, Math.round(coef));
          });
        }

        resultado.push({
          id,
          cargo: `${ins.descricao} (CPU Indireta: ${cpu.code || cpu.nome})`,
          qtdMax: Math.max(0, ...Object.values(mapa)),
          isVerbaMensal: isVerba,
          efetivoMensal: mapa
        });
      });
    });

    return resultado;
  }, [itensIndiretos, cpus, dados, scheduleTasks, pqItems, allocationLinks]);

  // 2. PROCESSAMENTO DINÂMICO DE MÃO DE OBRA DIRETA E EQUIPAMENTOS (100% REAL)
  const { funcoesDiretas, equipamentosDetalhados } = useMemo(() => {
    const taskMap = new Map<number, ScheduleTask>(scheduleTasks.map((t) => [t.uniqueId, t]));
    const pqMap = new Map<string, PQItem>(pqItems.map((p) => [p.id, p]));

    // Mapeamento de links efetivos (manuais ou automatizados por correspondência de cronograma XML + PQ)
    const linksEfetivos: Array<{ task: ScheduleTask; pqItem: PQItem; qty: number }> = [];

    if (allocationLinks.length > 0) {
      allocationLinks.forEach((link) => {
        const task = taskMap.get(link.taskUniqueId);
        const pqItem = pqMap.get(link.pqItemId);
        if (task && pqItem) {
          linksEfetivos.push({
            task,
            pqItem,
            qty: Number(link.calculatedQuantity) || Number(pqItem.quantidadeOrcada) || 1
          });
        }
      });
    }

    // Fallback: Se não houver alocações manuais explícitas, mapeia automaticamente as tarefas do XML aos itens da PQ
    if (linksEfetivos.length === 0 && scheduleTasks.length > 0 && pqItems.length > 0) {
      scheduleTasks.forEach((task) => {
        if (!task.startDate || !task.finishDate) return;
        const pqMatch = pqItems.find(
          (p) =>
            (p.seq !== undefined && task.uniqueId === p.seq) ||
            (p.codigoRecursoProject && (task.wbs === p.codigoRecursoProject || task.outlineNumber === p.codigoRecursoProject)) ||
            (p.descricao && task.name && task.name.toLowerCase().includes(p.descricao.toLowerCase()))
        );
        if (pqMatch) {
          linksEfetivos.push({
            task,
            pqItem: pqMatch,
            qty: Number(pqMatch.quantidadeOrcada) || 1
          });
        }
      });
    }

    // Mapas de horas agrupados por Cargo Normalizado e Equipamento Normalizado
    const moCargoHorasMap: Record<string, { id: string; cargo: string; horas: Record<string, number>; cpusRelacionadas: Set<string>; temDesvio?: boolean; desvioMsg?: string }> = {};
    const eqNomeHorasMap: Record<string, { id: string; nome: string; isVerba?: boolean; horas: Record<string, number> }> = {};

    const nomesMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    if (linksEfetivos.length > 0 && cpus.length > 0) {
      linksEfetivos.forEach(({ task, pqItem, qty }) => {
        if (!task.startDate || !task.finishDate) return;

        const cpu = cpus.find(
          (c) =>
            (c.sequencia !== undefined && c.sequencia === pqItem.seq) ||
            c.code === pqItem.codigoRecursoProject ||
            c.id === pqItem.id ||
            c.nome === pqItem.descricao
        );
        if (!cpu || !cpu.insumos || cpu.isCustoIndireto) return; // EXCLUI CPUS INDIRETA DO GRUPO DIRETO!

        // Checagem de Produtividade: CPU vs MS Project
        const prodEfetiva = (Number(cpu.prod_teorica) || 1) * (Number(cpu.praticabilidade) || 1);
        let temDesvio = false;
        let desvioMsg = '';

        if (prodEfetiva > 0 && qty > 0 && task.workingDaysDuration > 0) {
          const diasTeoricosCpu = Math.ceil(qty / prodEfetiva);
          const diasProject = task.workingDaysDuration;
          const diffRatio = Math.abs(diasTeoricosCpu - diasProject) / diasProject;

          if (diffRatio > 0.15) {
            temDesvio = true;
            desvioMsg = `Prod. CPU prevê ${diasTeoricosCpu} dias úteis, mas MS Project agendou ${diasProject} dias.`;
          }
        }

        const dtIni = new Date(task.startDate);
        const dtFim = new Date(task.finishDate);
        if (isNaN(dtIni.getTime()) || isNaN(dtFim.getTime()) || dtFim < dtIni) return;

        const monthKeys: string[] = [];
        let curAno = dtIni.getFullYear();
        let curMes = dtIni.getMonth();
        const anoFim = dtFim.getFullYear();
        const mesFim = dtFim.getMonth();

        while (curAno < anoFim || (curAno === anoFim && curMes <= mesFim)) {
          const rotulo = `${nomesMeses[curMes]}/${String(curAno).substring(2)}`;
          monthKeys.push(rotulo);
          curMes++;
          if (curMes > 11) {
            curMes = 0;
            curAno++;
          }
        }

        const totalMeses = Math.max(1, monthKeys.length);

        cpu.insumos.forEach((ins) => {
          const tipoNorm = (ins.tipo || '').toLowerCase();
          const isMO = tipoNorm.includes('mão') || tipoNorm.includes('mao') || tipoNorm === 'mo';
          const isEQ = tipoNorm.includes('equip') || tipoNorm === 'eq';

          if (!isMO && !isEQ) return;

          const coef = Number(ins.coef) || 0;
          const unid = (ins.unid || '').toLowerCase();
          const totalInsumoQty = qty * coef;

          let totalHoras = totalInsumoQty;
          if (unid.includes('mes') || unid.includes('mês')) {
            totalHoras = totalInsumoQty * horasDivisor;
          }

          const horasPorMes = totalHoras / totalMeses;
          const nomeClean = ins.descricao.trim();

          if (isMO) {
            const cargoKey = `cargo-mo-${nomeClean.toLowerCase()}`;
            if (!moCargoHorasMap[cargoKey]) {
              moCargoHorasMap[cargoKey] = {
                id: cargoKey,
                cargo: nomeClean,
                horas: {},
                cpusRelacionadas: new Set(),
                temDesvio,
                desvioMsg
              };
            }
            if (cpu.code) moCargoHorasMap[cargoKey].cpusRelacionadas.add(cpu.code);
            if (temDesvio) {
              moCargoHorasMap[cargoKey].temDesvio = true;
              moCargoHorasMap[cargoKey].desvioMsg = desvioMsg;
            }

            monthKeys.forEach((mKey) => {
              moCargoHorasMap[cargoKey].horas[mKey] = (moCargoHorasMap[cargoKey].horas[mKey] || 0) + horasPorMes;
            });
          } else {
            const eqKey = `eq-${nomeClean.toLowerCase()}`;
            if (!eqNomeHorasMap[eqKey]) {
              eqNomeHorasMap[eqKey] = {
                id: eqKey,
                nome: nomeClean,
                isVerba: unid.includes('mes') || unid.includes('mês') || unid.includes('gb'),
                horas: {}
              };
            }
            monthKeys.forEach((mKey) => {
              eqNomeHorasMap[eqKey].horas[mKey] = (eqNomeHorasMap[eqKey].horas[mKey] || 0) + horasPorMes;
            });
          }
        });
      });
    } else if (cpus.length > 0 && pqItems.length > 0 && dados.length > 0) {
      // Fallback 2: Se ainda não houver cronograma XML ou alocações, projeta os insumos das CPUs sobre os meses do contrato
      const numMeses = Math.max(1, dados.length);

      pqItems.forEach((pq) => {
        const qty = Number(pq.quantidadeOrcada) || 0;
        if (qty <= 0) return;
        const cpu = cpus.find(
          (c) =>
            (c.sequencia !== undefined && c.sequencia === pq.seq) ||
            c.code === pq.codigoRecursoProject ||
            c.id === pq.id ||
            c.nome === pq.descricao
        );
        if (!cpu || !cpu.insumos || cpu.isCustoIndireto) return;

        cpu.insumos.forEach((ins) => {
          const tipoNorm = (ins.tipo || '').toLowerCase();
          const isMO = tipoNorm.includes('mão') || tipoNorm.includes('mao') || tipoNorm === 'mo';
          const isEQ = tipoNorm.includes('equip') || tipoNorm === 'eq';
          if (!isMO && !isEQ) return;

          const coef = Number(ins.coef) || 0;
          const unid = (ins.unid || '').toLowerCase();
          const totalInsumoQty = qty * coef;

          let totalHoras = totalInsumoQty;
          if (unid.includes('mes') || unid.includes('mês')) {
            totalHoras = totalInsumoQty * horasDivisor;
          }

          const horasPorMes = totalHoras / numMeses;
          const nomeClean = ins.descricao.trim();

          if (isMO) {
            const cargoKey = `cargo-mo-${nomeClean.toLowerCase()}`;
            if (!moCargoHorasMap[cargoKey]) {
              moCargoHorasMap[cargoKey] = {
                id: cargoKey,
                cargo: nomeClean,
                horas: {},
                cpusRelacionadas: new Set()
              };
            }
            if (cpu.code) moCargoHorasMap[cargoKey].cpusRelacionadas.add(cpu.code);
            dados.forEach((d) => {
              moCargoHorasMap[cargoKey].horas[d.mesAno] = (moCargoHorasMap[cargoKey].horas[d.mesAno] || 0) + horasPorMes;
            });
          } else {
            const eqKey = `eq-${nomeClean.toLowerCase()}`;
            if (!eqNomeHorasMap[eqKey]) {
              eqNomeHorasMap[eqKey] = {
                id: eqKey,
                nome: nomeClean,
                isVerba: unid.includes('mes') || unid.includes('mês') || unid.includes('gb'),
                horas: {}
              };
            }
            dados.forEach((d) => {
              eqNomeHorasMap[eqKey].horas[d.mesAno] = (eqNomeHorasMap[eqKey].horas[d.mesAno] || 0) + horasPorMes;
            });
          }
        });
      });
    }

    // Processa Mão de Obra Direta Consolidada por Cargo
    const listaMO: FuncaoDiretaDetalhada[] = [];
    Object.values(moCargoHorasMap).forEach((item) => {
      const cods = Array.from(item.cpusRelacionadas).join(', ');
      listaMO.push({
        id: item.id,
        funcao: item.cargo,
        cpuCodigo: cods || undefined,
        horasMensais: item.horas,
        temDesvio: item.temDesvio,
        desvioMsg: item.desvioMsg
      });
    });

    // Processa Equipamentos das CPUs + Equipamentos Indiretos
    const listaEQ: EquipamentoDetalhado[] = [];
    const eqIndiretos = itensIndiretos.filter((i) => i.categoria === 'EQUIPAMENTOS_INDIRETOS');

    eqIndiretos.forEach((item) => {
      const id = `eq-ind-${item.id}`;
      const totalQtd = Number(item.quantidade) || 1;
      const numMeses = Math.max(1, dados.length);
      const isVerba = (item.unidade || '').toUpperCase().includes('MES') || (item.unidade || '').toUpperCase().includes('GB');

      const basePerMes = isVerba ? Math.floor(totalQtd / numMeses) || 1 : Math.round(totalQtd);
      const sobra = isVerba ? totalQtd - (basePerMes * numMeses) : 0;

      const dtIni = item.dataInicio ? new Date(item.dataInicio + 'T00:00:00') : null;
      const dtFim = item.dataFim ? new Date(item.dataFim + 'T23:59:59') : null;

      const mapa: Record<string, number> = {};
      dados.forEach((d, idx) => {
        let isActive = true;
        if (dtIni && dtFim) {
          const [ano, mes] = d.sortKey.split('-').map(Number);
          const monthStart = new Date(ano, mes - 1, 1);
          const monthEnd = new Date(ano, mes, 0);
          isActive = monthEnd >= dtIni && monthStart <= dtFim;
        }

        let val = 0;
        if (isActive) {
          val = basePerMes;
          if (isVerba && idx === dados.length - 1 && sobra > 0) val += sobra;
        }
        mapa[d.mesAno] = val;
      });

      listaEQ.push({
        id,
        nome: item.descricao,
        qtdMax: Math.max(0, ...Object.values(mapa)),
        isVerbaMensal: isVerba,
        temSobraFinal: sobra > 0,
        efetivoMensal: mapa
      });
    });

    Object.values(eqNomeHorasMap).forEach((item) => {
      const efMensal: Record<string, number> = {};
      dados.forEach((d) => {
        const h = item.horas[d.mesAno] || 0;
        let headcount = 0;
        if (h > 0) {
          const raw = h / horasDivisor;
          // Regra Sem Meia Pessoa/Máquina (> 0 e < 1 -> 1)
          if (raw > 0 && raw < 1) headcount = 1;
          else headcount = Math.round(raw);
        }
        efMensal[d.mesAno] = headcount;
      });
      listaEQ.push({
        id: item.id,
        nome: item.nome,
        qtdMax: Math.max(0, ...Object.values(efMensal)),
        isVerbaMensal: item.isVerba,
        efetivoMensal: efMensal
      });
    });

    return {
      funcoesDiretas: listaMO,
      equipamentosDetalhados: listaEQ
    };
  }, [scheduleTasks, pqItems, allocationLinks, cpus, itensIndiretos, dados, horasDivisor]);

  // 3. MATRIZ DE DADOS MENSAIS DEDUTIVOS E SOMATÓRIOS 100% DINÂMICOS
  const dadosEfetivosHistograma = useMemo<MesHistogramaData[]>(() => {
    return dados.map((d) => {
      // Soma Mão de Obra Indireta
      let sumInd = 0;
      funcoesIndiretas.forEach((f) => {
        sumInd += f.efetivoMensal[d.mesAno] || 0;
      });

      // Soma Mão de Obra Direta (horas convertidas em pessoas com regra sem meia pessoa)
      let sumDir = 0;
      funcoesDiretas.forEach((f) => {
        const h = f.horasMensais[d.mesAno] || 0;
        if (h > 0) {
          const raw = h / horasDivisor;
          if (raw > 0 && raw < 1) sumDir += 1;
          else sumDir += Math.round(raw);
        }
      });

      // Soma Equipamentos
      let sumEq = 0;
      equipamentosDetalhados.forEach((eq) => {
        sumEq += eq.efetivoMensal[d.mesAno] || 0;
      });

      const total = sumInd + sumDir + sumEq;

      return {
        mesAno: d.mesAno,
        sortKey: d.sortKey,
        indireta: sumInd,
        direta: sumDir,
        equipamentos: sumEq,
        total
      };
    });
  }, [dados, funcoesIndiretas, funcoesDiretas, equipamentosDetalhados, horasDivisor]);

  if (dadosEfetivosHistograma.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
        Nenhum dado mensal de contingente disponível para exibir o histograma.
      </div>
    );
  }

  // Encontra o valor máximo para a escala do eixo Y (mínimo 50)
  const maxValor = Math.max(
    50,
    ...dadosEfetivosHistograma.map((d) => {
      let m = 0;
      if (showTotal) m = Math.max(m, d.total);
      if (showDireta) m = Math.max(m, d.direta);
      if (showIndireta) m = Math.max(m, d.indireta);
      if (showEquipamentos) m = Math.max(m, d.equipamentos);
      return m;
    })
  );

  const maxEscalaY = Math.ceil(maxValor / 10) * 10;
  const stepsY = [maxEscalaY, Math.round(maxEscalaY * 0.8), Math.round(maxEscalaY * 0.6), Math.round(maxEscalaY * 0.4), Math.round(maxEscalaY * 0.2), 0];

  const chartHeight = 240;
  const colWidth = 56;
  const leftPadding = 48;
  const chartWidth = leftPadding + dadosEfetivosHistograma.length * colWidth + 24;

  const handleExportarExcel = () => {
    const meses = dadosEfetivosHistograma.map((d) => d.mesAno);
    const exportDados = {
      indireta: dadosEfetivosHistograma.map((d) => d.indireta),
      direta: dadosEfetivosHistograma.map((d) => d.direta),
      equipamentos: dadosEfetivosHistograma.map((d) => d.equipamentos),
      total: dadosEfetivosHistograma.map((d) => d.total)
    };
    exportarHistogramaMensalMatriz(meses, exportDados, activeObra);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-4">
      {/* CONTROLES SUPERIORES */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="bg-indigo-50/80 px-3 py-2 rounded-xl border border-indigo-200 flex items-center gap-3">
          <Clock className="w-4 h-4 text-indigo-700 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider">
              Divisor Horas &rarr; Pessoas:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-600">1 pessoa =</span>
              <input
                type="number"
                step="0.1"
                min="100"
                max="250"
                value={horasDivisor}
                onChange={(e) => setHorasDivisor(parseFloat(e.target.value) || 189.2)}
                className="w-16 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-center font-mono font-bold text-indigo-900 text-xs outline-none"
              />
              <span className="font-bold text-indigo-900 text-[11px]">h/mês</span>
            </div>
          </div>
          <span className="text-[10px] text-indigo-700 bg-white/70 px-2 py-0.5 rounded font-mono font-semibold">
            (Regra: Sem meia pessoa &gt;0 e &lt;1 &rArr; 1)
          </span>
        </div>

        {/* CONTROLE DE SÉRIES DO GRÁFICO */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowIndireta(!showIndireta)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showIndireta ? 'bg-sky-100 border-sky-300 text-sky-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-xs bg-[#38bdf8] border border-sky-600" />
            <span>Indireta ({funcoesIndiretas.length})</span>
          </button>

          <button
            onClick={() => setShowDireta(!showDireta)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showDireta ? 'bg-blue-100 border-blue-300 text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-xs bg-[#93c5fd] border border-blue-400" />
            <span>Direta ({funcoesDiretas.length})</span>
          </button>

          <button
            onClick={() => setShowEquipamentos(!showEquipamentos)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showEquipamentos ? 'bg-indigo-100 border-indigo-300 text-indigo-950 shadow-2xs' : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-xs bg-[#1e3a8a] border border-slate-900" />
            <span>Equipamentos ({equipamentosDetalhados.length})</span>
          </button>

          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showTotal ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3.5 h-0.5 bg-[#15803d]" />
            <span>Total (Curva Verde)</span>
          </button>
        </div>

        <button
          onClick={handleExportarExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Histograma (.xlsx)</span>
        </button>
      </div>

      {/* ÁREA DO GRÁFICO SVG */}
      <div className="overflow-x-auto px-4 pt-2 pb-0 bg-white">
        <div style={{ minWidth: `${chartWidth}px` }} className="relative select-none">
          <div className="relative" style={{ height: `${chartHeight + 40}px` }}>
            <svg width={chartWidth} height={chartHeight + 40} className="overflow-visible block">
              {stepsY.map((step) => {
                const y = chartHeight - (step / maxEscalaY) * chartHeight + 20;
                return (
                  <g key={step}>
                    <line x1={leftPadding - 8} y1={y} x2={chartWidth - 10} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={leftPadding - 14} y={y + 3.5} textAnchor="end" fontSize="10" fontFamily="monospace" fontWeight="600" fill="#64748b">
                      {step}
                    </text>
                  </g>
                );
              })}

              {dadosEfetivosHistograma.map((d, index) => {
                const colCenterX = leftPadding + index * colWidth + colWidth / 2;
                const barWidth = 9;
                const spacing = 1.5;

                const xInd = colCenterX - (barWidth * 1.5 + spacing);
                const xDir = colCenterX - barWidth / 2;
                const xEq = colCenterX + (barWidth / 2 + spacing);

                const hInd = (d.indireta / maxEscalaY) * chartHeight;
                const yInd = chartHeight - hInd + 20;

                const hDir = (d.direta / maxEscalaY) * chartHeight;
                const yDir = chartHeight - hDir + 20;

                const hEq = (d.equipamentos / maxEscalaY) * chartHeight;
                const yEq = chartHeight - hEq + 20;

                return (
                  <g key={`bars-${d.sortKey}`}>
                    {showIndireta && (
                      <g>
                        <rect x={xInd} y={yInd} width={barWidth} height={Math.max(0, hInd)} fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" rx="1" />
                        {d.indireta > 0 && (
                          <text x={xInd + barWidth / 2} y={yInd - 3} textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#0369a1">
                            {d.indireta}
                          </text>
                        )}
                      </g>
                    )}

                    {showDireta && (
                      <g>
                        <rect x={xDir} y={yDir} width={barWidth} height={Math.max(0, hDir)} fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.8" rx="1" />
                        {d.direta > 0 && (
                          <text x={xDir + barWidth / 2} y={yDir - 3} textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#1d4ed8">
                            {d.direta}
                          </text>
                        )}
                      </g>
                    )}

                    {showEquipamentos && (
                      <g>
                        <rect x={xEq} y={yEq} width={barWidth} height={Math.max(0, hEq)} fill="#1e3a8a" stroke="#0f172a" strokeWidth="0.8" rx="1" />
                        {d.equipamentos > 0 && (
                          <text x={xEq + barWidth / 2} y={yEq - 3} textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#0f172a">
                            {d.equipamentos}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {showTotal && dadosEfetivosHistograma.length > 1 && (
                <g>
                  <polyline
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={dadosEfetivosHistograma
                      .map((d, index) => {
                        const cx = leftPadding + index * colWidth + colWidth / 2;
                        const cy = chartHeight - (d.total / maxEscalaY) * chartHeight + 20;
                        return `${cx},${cy}`;
                      })
                      .join(' ')}
                  />

                  {dadosEfetivosHistograma.map((d, index) => {
                    const cx = leftPadding + index * colWidth + colWidth / 2;
                    const cy = chartHeight - (d.total / maxEscalaY) * chartHeight + 20;

                    return (
                      <g key={`pt-${d.sortKey}`}>
                        <circle cx={cx} cy={cy} r="3" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" />
                        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="10" fontFamily="sans-serif" fontWeight="bold" fill="#14532d">
                          {d.total}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* 3. TABELA ANÁLITICA DE CONTINGENTE (COM CADEADOS E ALERTAS DE DESVIO DE PRODUTIVIDADE) */}
      <div className="overflow-x-auto border-t border-slate-200">
        <div style={{ minWidth: `${chartWidth + 190}px` }} className="text-xs">
          {/* CABEÇALHO DOS MESES */}
          <div className="flex bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
            <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-2.5 border-r border-slate-700 flex items-center gap-2">
              <span>MÃO DE OBRA & EQUIPAMENTOS</span>
              <span className="text-[9px] text-slate-400 font-normal">(Trava com Cadeado)</span>
            </div>
            <div style={{ width: '64px' }} className="shrink-0 p-2.5 text-center border-r border-slate-700">
              QTD. MÁX
            </div>
            {dadosEfetivosHistograma.map((d) => (
              <div key={`th-m-${d.sortKey}`} style={{ width: `${colWidth}px` }} className="shrink-0 p-2.5 text-center border-r border-slate-700 last:border-r-0">
                {d.mesAno}
              </div>
            ))}
          </div>

          {/* GRUPO 1: MÃO DE OBRA INDIRETA */}
          <div>
            <div
              onClick={() => setExpandIndireta(!expandIndireta)}
              className="flex border-b border-sky-200 bg-sky-100/90 text-sky-950 font-bold cursor-pointer hover:bg-sky-200/80 transition"
            >
              <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-2 border-r border-sky-300 flex items-center gap-2 font-sans text-[11px]">
                {expandIndireta ? <ChevronDown className="w-4 h-4 text-sky-800" /> : <ChevronRight className="w-4 h-4 text-sky-800" />}
                <span className="w-3 h-3 rounded-xs bg-[#38bdf8] border border-sky-600 shrink-0" />
                <span className="uppercase font-black text-sky-900">MÃO DE OBRA INDIRETA</span>
                <span className="text-[10px] text-sky-700 font-normal">({funcoesIndiretas.length} funções)</span>
              </div>
              <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-sky-300 font-bold">
                {Math.max(0, ...dadosEfetivosHistograma.map((d) => d.indireta))}
              </div>
              {dadosEfetivosHistograma.map((d) => (
                <div key={`ind-tot-${d.sortKey}`} style={{ width: `${colWidth}px` }} className="shrink-0 p-2 text-center border-r border-sky-200 last:border-r-0 font-black text-sky-950">
                  {d.indireta}
                </div>
              ))}
            </div>

            {expandIndireta &&
              funcoesIndiretas.map((f) => {
                const isLocked = !!locks[f.id];

                return (
                  <div key={f.id} className={`flex border-b border-slate-100 hover:bg-sky-50/40 text-[11px] text-slate-700 transition ${isLocked ? 'bg-amber-50/40' : ''}`}>
                    <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-1.5 pl-6 border-r border-slate-200 font-sans flex items-center justify-between pr-2">
                      <div className="flex items-center gap-1.5 truncate" title={f.cargo}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockRow(f.id);
                          }}
                          className={`p-0.5 rounded transition ${isLocked ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-slate-300 hover:text-slate-600'}`}
                          title={isLocked ? 'Linha travada: protegida contra novos uploads do MS Project' : 'Clique para travar esta linha contra atualizações de novos cronogramas'}
                        >
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <span className="truncate">{f.cargo}</span>
                      </div>
                      {f.isVerbaMensal && <span className="text-[9px] bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-mono shrink-0">Verba</span>}
                    </div>
                    <div style={{ width: '64px' }} className="shrink-0 p-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                      {f.qtdMax}
                    </div>
                    {dadosEfetivosHistograma.map((d, idx) => {
                      const val = f.efetivoMensal[d.mesAno] ?? 0;
                      const isLastMonth = idx === dadosEfetivosHistograma.length - 1;

                      return (
                        <div
                          key={`ind-c-${f.id}-${d.sortKey}`}
                          style={{ width: `${colWidth}px` }}
                          className={`shrink-0 p-1.5 text-center border-r border-slate-100 last:border-r-0 relative ${
                            val > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'
                          }`}
                        >
                          <span>{val > 0 ? val : ''}</span>
                          {f.temSobraFinal && isLastMonth && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" title="Possui saldo/sobra de verba mensal acumulado no último mês" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* GRUPO 2: MÃO DE OBRA DIRETA */}
          <div>
            <div
              onClick={() => setExpandDireta(!expandDireta)}
              className="flex border-b border-blue-200 bg-blue-100/90 text-blue-950 font-bold cursor-pointer hover:bg-blue-200/80 transition"
            >
              <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-2 border-r border-blue-300 flex items-center gap-2 font-sans text-[11px]">
                {expandDireta ? <ChevronDown className="w-4 h-4 text-blue-800" /> : <ChevronRight className="w-4 h-4 text-blue-800" />}
                <span className="w-3 h-3 rounded-xs bg-[#93c5fd] border border-blue-400 shrink-0" />
                <span className="uppercase font-black text-blue-900">MÃO DE OBRA DIRETA</span>
                <span className="text-[10px] text-blue-700 font-normal">({funcoesDiretas.length} insumos de CPU)</span>
              </div>
              <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-blue-300 font-bold">
                {Math.max(0, ...dadosEfetivosHistograma.map((d) => d.direta))}
              </div>
              {dadosEfetivosHistograma.map((d) => (
                <div key={`dir-tot-${d.sortKey}`} style={{ width: `${colWidth}px` }} className="shrink-0 p-2 text-center border-r border-blue-200 last:border-r-0 font-black text-blue-950">
                  {d.direta}
                </div>
              ))}
            </div>

            {expandDireta &&
              funcoesDiretas.map((f) => {
                const isLocked = !!locks[f.id];

                return (
                  <div key={f.id} className={`flex border-b border-slate-100 hover:bg-blue-50/40 text-[11px] text-slate-700 transition ${isLocked ? 'bg-amber-50/40' : ''}`}>
                    <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-1.5 pl-6 border-r border-slate-200 font-sans flex items-center justify-between pr-2">
                      <div className="flex items-center gap-1.5 truncate" title={f.funcao}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockRow(f.id);
                          }}
                          className={`p-0.5 rounded transition ${isLocked ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-slate-300 hover:text-slate-600'}`}
                          title={isLocked ? 'Linha travada: protegida contra novos uploads do MS Project' : 'Clique para travar esta linha contra atualizações de novos cronogramas'}
                        >
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <span className="truncate">{f.funcao}</span>
                      </div>
                      {f.temDesvio && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5 shrink-0" title={f.desvioMsg}>
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                          <span>Desvio</span>
                        </span>
                      )}
                    </div>
                    <div style={{ width: '64px' }} className="shrink-0 p-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                      {Math.max(
                        0,
                        ...dadosEfetivosHistograma.map((d) => {
                          const h = f.horasMensais[d.mesAno] || 0;
                          if (h <= 0) return 0;
                          const raw = h / horasDivisor;
                          return raw > 0 && raw < 1 ? 1 : Math.round(raw);
                        })
                      )}
                    </div>
                    {dadosEfetivosHistograma.map((d) => {
                      const h = f.horasMensais[d.mesAno] || 0;
                      let val = 0;
                      if (h > 0) {
                        const raw = h / horasDivisor;
                        val = raw > 0 && raw < 1 ? 1 : Math.round(raw);
                      }

                      return (
                        <div key={`dir-c-${f.id}-${d.sortKey}`} style={{ width: `${colWidth}px` }} className={`shrink-0 p-1.5 text-center border-r border-slate-100 last:border-r-0 ${val > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'}`}>
                          {val > 0 ? val : ''}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* GRUPO 3: EQUIPAMENTOS */}
          <div>
            <div
              onClick={() => setExpandEquipamentos(!expandEquipamentos)}
              className="flex border-b border-indigo-200 bg-indigo-100/90 text-indigo-950 font-bold cursor-pointer hover:bg-indigo-200/80 transition"
            >
              <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-2 border-r border-indigo-300 flex items-center gap-2 font-sans text-[11px]">
                {expandEquipamentos ? <ChevronDown className="w-4 h-4 text-indigo-800" /> : <ChevronRight className="w-4 h-4 text-indigo-800" />}
                <span className="w-3 h-3 rounded-xs bg-[#1e3a8a] border border-slate-900 shrink-0" />
                <span className="uppercase font-black text-indigo-950">EQUIPAMENTOS</span>
                <span className="text-[10px] text-indigo-800 font-normal">({equipamentosDetalhados.length} tipos)</span>
              </div>
              <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-indigo-300 font-bold">
                {Math.max(0, ...dadosEfetivosHistograma.map((d) => d.equipamentos))}
              </div>
              {dadosEfetivosHistograma.map((d) => (
                <div key={`eq-tot-${d.sortKey}`} style={{ width: `${colWidth}px` }} className="shrink-0 p-2 text-center border-r border-indigo-200 last:border-r-0 font-black text-indigo-950">
                  {d.equipamentos}
                </div>
              ))}
            </div>

            {expandEquipamentos &&
              equipamentosDetalhados.map((eq) => {
                const isLocked = !!locks[eq.id];

                return (
                  <div key={eq.id} className={`flex border-b border-slate-100 hover:bg-indigo-50/40 text-[11px] text-slate-700 transition ${isLocked ? 'bg-amber-50/40' : ''}`}>
                    <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-1.5 pl-6 border-r border-slate-200 font-sans flex items-center justify-between pr-2">
                      <div className="flex items-center gap-1.5 truncate" title={eq.nome}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockRow(eq.id);
                          }}
                          className={`p-0.5 rounded transition ${isLocked ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-slate-300 hover:text-slate-600'}`}
                          title={isLocked ? 'Linha travada: protegida contra novos uploads do MS Project' : 'Clique para travar esta linha contra atualizações de novos cronogramas'}
                        >
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <span className="truncate">{eq.nome}</span>
                      </div>
                      {eq.isVerbaMensal && <span className="text-[9px] bg-indigo-100 text-indigo-900 px-1 py-0.2 rounded font-mono shrink-0">Verba</span>}
                    </div>
                    <div style={{ width: '64px' }} className="shrink-0 p-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                      {eq.qtdMax}
                    </div>
                    {dadosEfetivosHistograma.map((d, idx) => {
                      const val = eq.efetivoMensal[d.mesAno] ?? 0;
                      const isLastMonth = idx === dadosEfetivosHistograma.length - 1;

                      return (
                        <div
                          key={`eq-c-${eq.id}-${d.sortKey}`}
                          style={{ width: `${colWidth}px` }}
                          className={`shrink-0 p-1.5 text-center border-r border-slate-100 last:border-r-0 relative ${
                            val > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'
                          }`}
                        >
                          <span>{val > 0 ? val : ''}</span>
                          {eq.temSobraFinal && isLastMonth && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" title="Possui saldo/sobra de verba mensal acumulado no último mês" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* LINHA DE TOTAL CONTINGENTE / MÊS */}
          <div className="flex bg-emerald-700 text-white font-black text-[11px] border-t-2 border-emerald-900">
            <div style={{ width: `${leftPadding + 190}px` }} className="shrink-0 p-2.5 border-r border-emerald-800 uppercase flex items-center justify-between">
              <span>TOTAL CONTINGENTE / MÊS</span>
              <span className="text-[9px] font-normal text-emerald-200 font-mono">(Soma Real 100% Dinâmica)</span>
            </div>
            <div style={{ width: '64px' }} className="shrink-0 p-2.5 text-center border-r border-emerald-800 font-mono font-black text-amber-300">
              {Math.max(0, ...dadosEfetivosHistograma.map((d) => d.total))}
            </div>
            {dadosEfetivosHistograma.map((d) => (
              <div key={`tot-ft-${d.sortKey}`} style={{ width: `${colWidth}px` }} className="shrink-0 p-2.5 text-center border-r border-emerald-800 last:border-r-0 font-mono text-xs">
                {d.total}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
