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
  Briefcase
} from 'lucide-react';
import { Obra, ItemCustoIndireto } from '../types';
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
  cargo: string;
  qtdMax: number;
  efetivoMensal: Record<string, number>;
}

export interface FuncaoDiretaDetalhada {
  funcao: string;
  horasMensais: Record<string, number>;
}

export interface EquipamentoDetalhado {
  nome: string;
  qtdMax: number;
  efetivoMensal: Record<string, number>;
}

interface GraficoHistogramaBarrasProps {
  dados: MesHistogramaData[];
  activeObra: Obra | null;
  horasMesDivisorPadrao?: number; // Padrão: 189.2
  onExportar?: () => void;
}

export const GraficoHistogramaBarras: React.FC<GraficoHistogramaBarrasProps> = ({
  dados,
  activeObra,
  horasMesDivisorPadrao = 189.2
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
  const [expandDireta, setExpandDireta] = useState(false);
  const [expandEquipamentos, setExpandEquipamentos] = useState(false);

  // Funções de Mão de Obra Indireta (Efetivo fiel à planilha da imagem 2 anexada)
  const funcoesIndiretas: FuncaoIndiretaDetalhada[] = useMemo(() => {
    return [
      { cargo: 'Gerente de Contrato', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Engenheiro Civil', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Engenheiro de Planejamento', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Mestre de obras', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Encarregado de turma', qtdMax: 2, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 2, 'fev/27': 2, 'mar/27': 2, 'abr/27': 2, 'mai/27': 2, 'jun/27': 2, 'jul/27': 2, 'ago/27': 2, 'set/27': 2, 'out/27': 2, 'nov/27': 2, 'dez/27': 2, 'jan/28': 2, 'fev/28': 2, 'mar/28': 2, 'abr/28': 2, 'mai/28': 2, 'jun/28': 2, 'jul/28': 2, 'ago/28': 2, 'set/28': 2, 'out/28': 2, 'nov/28': 2, 'dez/28': 0 } },
      { cargo: 'Analista administrativo', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Supervisor Administrativo', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Técnico de Segurança do Trabalho', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Almoxarife', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Auxiliar de topografia (Ajudante)', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Laboratorista (indicação)', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Auxiliar de laboratório', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Eletricista', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Encarregado de serviços gerais', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Apropriador', qtdMax: 2, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 2, 'fev/27': 2, 'mar/27': 2, 'abr/27': 2, 'mai/27': 2, 'jun/27': 2, 'jul/27': 2, 'ago/27': 2, 'set/27': 2, 'out/27': 2, 'nov/27': 2, 'dez/27': 2, 'jan/28': 2, 'fev/28': 2, 'mar/28': 2, 'abr/28': 2, 'mai/28': 2, 'jun/28': 2, 'jul/28': 2, 'ago/28': 2, 'set/28': 2, 'out/28': 2, 'nov/28': 2, 'dez/28': 0 } },
      { cargo: 'Motorista', qtdMax: 1, efetivoMensal: { 'nov/26': 0, 'dez/26': 0, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } },
      { cargo: 'Auxiliar de Serviços Gerais', qtdMax: 1, efetivoMensal: { 'nov/26': 1, 'dez/26': 1, 'jan/27': 1, 'fev/27': 1, 'mar/27': 1, 'abr/27': 1, 'mai/27': 1, 'jun/27': 1, 'jul/27': 1, 'ago/27': 1, 'set/27': 1, 'out/27': 1, 'nov/27': 1, 'dez/27': 1, 'jan/28': 1, 'fev/28': 1, 'mar/28': 1, 'abr/28': 1, 'mai/28': 1, 'jun/28': 1, 'jul/28': 1, 'ago/28': 1, 'set/28': 1, 'out/28': 1, 'nov/28': 1, 'dez/28': 0 } }
    ];
  }, []);

  // Funções de Mão de Obra Direta com apuração de horas e conversão em pessoas (horas / horasDivisor)
  const funcoesDiretas: FuncaoDiretaDetalhada[] = useMemo(() => {
    return [
      {
        funcao: 'Operador de Perfuratriz / Injeção',
        horasMensais: dados.reduce((acc, d) => {
          // Aproximadamente 40% das pessoas diretas são operadores
          const pessoas = Math.max(0, Math.round(d.direta * 0.35));
          acc[d.mesAno] = pessoas * horasDivisor;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        funcao: 'Injetor de Calda / Geotécnico',
        horasMensais: dados.reduce((acc, d) => {
          const pessoas = Math.max(0, Math.round(d.direta * 0.25));
          acc[d.mesAno] = pessoas * horasDivisor;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        funcao: 'Pedreiro / Armador Especializado',
        horasMensais: dados.reduce((acc, d) => {
          const pessoas = Math.max(0, Math.round(d.direta * 0.15));
          acc[d.mesAno] = pessoas * horasDivisor;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        funcao: 'Servente / Ajudante de Geotecnia',
        horasMensais: dados.reduce((acc, d) => {
          const pessoas = Math.max(0, Math.round(d.direta * 0.25));
          acc[d.mesAno] = pessoas * horasDivisor;
          return acc;
        }, {} as Record<string, number>)
      }
    ];
  }, [dados, horasDivisor]);

  // Equipamentos detalhados (Equipamentos pesados e de apoio da obra)
  const equipamentosDetalhados: EquipamentoDetalhado[] = useMemo(() => {
    return [
      {
        nome: 'Perfuratriz Hidráulica sobre Esteiras',
        qtdMax: 8,
        efetivoMensal: dados.reduce((acc, d) => {
          acc[d.mesAno] = Math.max(0, Math.min(8, Math.round(d.equipamentos * 0.4)));
          return acc;
        }, {} as Record<string, number>)
      },
      {
        nome: 'Central de Mistura e Injeção de Calda',
        qtdMax: 4,
        efetivoMensal: dados.reduce((acc, d) => {
          acc[d.mesAno] = Math.max(0, Math.min(4, Math.round(d.equipamentos * 0.2)));
          return acc;
        }, {} as Record<string, number>)
      },
      {
        nome: 'Compressor de Ar Alta Pressão',
        qtdMax: 4,
        efetivoMensal: dados.reduce((acc, d) => {
          acc[d.mesAno] = Math.max(0, Math.min(4, Math.round(d.equipamentos * 0.2)));
          return acc;
        }, {} as Record<string, number>)
      },
      {
        nome: 'Caminhão Munck / Basculante de Apoio',
        qtdMax: 3,
        efetivoMensal: dados.reduce((acc, d) => {
          acc[d.mesAno] = Math.max(0, Math.min(3, Math.round(d.equipamentos * 0.15)));
          return acc;
        }, {} as Record<string, number>)
      },
      {
        nome: 'Bomba Injetora de Alta Pressão',
        qtdMax: 2,
        efetivoMensal: dados.reduce((acc, d) => {
          acc[d.mesAno] = Math.max(0, Math.min(2, Math.round(d.equipamentos * 0.05)));
          return acc;
        }, {} as Record<string, number>)
      }
    ];
  }, [dados]);

  if (dados.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
        Nenhum dado mensal de contingente disponível para exibir o histograma.
      </div>
    );
  }

  // Encontra o valor máximo para a escala do eixo Y (mínimo 100 como na imagem de referência)
  const maxValor = Math.max(
    100,
    ...dados.map((d) => {
      let m = 0;
      if (showTotal) m = Math.max(m, d.total);
      if (showDireta) m = Math.max(m, d.direta);
      if (showIndireta) m = Math.max(m, d.indireta);
      if (showEquipamentos) m = Math.max(m, d.equipamentos);
      return m;
    })
  );

  const maxEscalaY = Math.ceil(maxValor / 10) * 10;
  const stepsY = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

  const chartHeight = 240;
  const colWidth = 56;
  const leftPadding = 48;
  const chartWidth = leftPadding + dados.length * colWidth + 24;

  const handleExportarExcel = () => {
    const meses = dados.map((d) => d.mesAno);
    const exportDados = {
      indireta: dados.map((d) => d.indireta),
      direta: dados.map((d) => d.direta),
      equipamentos: dados.map((d) => d.equipamentos),
      total: dados.map((d) => d.total)
    };
    exportarHistogramaMensalMatriz(meses, exportDados, activeObra);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-4">
      {/* 1. BARRA SUPERIOR DE CONTROLES: CONVERSÃO DE HORAS EM PESSOAS E FILTROS */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* PARÂMETRO DA CONVERSÃO DE HORAS EM PESSOAS */}
        <div className="bg-indigo-50/80 px-3 py-2 rounded-xl border border-indigo-200 flex items-center gap-3">
          <Clock className="w-4 h-4 text-indigo-700 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-950 uppercase text-[10px] tracking-wider">
              Conversor Horas $\rightarrow$ Pessoas:
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
            (Padrão SEEL: 189,2h)
          </span>
        </div>

        {/* CONTROLE DE SÉRIES VISÍVEIS */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Séries no Gráfico:
          </span>

          <button
            onClick={() => setShowIndireta(!showIndireta)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showIndireta
                ? 'bg-sky-100 border-sky-300 text-sky-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-xs bg-[#38bdf8] border border-sky-600" />
            <span>Indireta</span>
          </button>

          <button
            onClick={() => setShowDireta(!showDireta)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showDireta
                ? 'bg-blue-100 border-blue-300 text-blue-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-xs bg-[#93c5fd] border border-blue-400" />
            <span>Direta</span>
          </button>

          <button
            onClick={() => setShowEquipamentos(!showEquipamentos)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showEquipamentos
                ? 'bg-indigo-100 border-indigo-300 text-indigo-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3 h-3 rounded-xs bg-[#1e3a8a] border border-slate-900" />
            <span>Equipamentos</span>
          </button>

          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showTotal
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-3.5 h-0.5 bg-[#15803d]" />
            <span>Total (Linha Verde)</span>
          </button>
        </div>

        {/* BOTÃO EXPORTAR EXCEL */}
        <button
          onClick={handleExportarExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Histograma (.xlsx)</span>
        </button>
      </div>

      {/* 2. ÁREA DO GRÁFICO DE BARRAS CLUSTERIZADAS + LINHA VERDE CONTÍNUA DO TOTAL */}
      <div className="overflow-x-auto px-4 pt-2 pb-0 bg-white">
        <div style={{ minWidth: `${chartWidth}px` }} className="relative select-none">
          <div className="relative" style={{ height: `${chartHeight + 40}px` }}>
            <svg width={chartWidth} height={chartHeight + 40} className="overflow-visible block">
              {/* LINHAS DE GRADE HORIZONTAIS (0 A 100) */}
              {stepsY.map((step) => {
                const y = chartHeight - (step / maxEscalaY) * chartHeight + 20;
                return (
                  <g key={step}>
                    <line
                      x1={leftPadding - 8}
                      y1={y}
                      x2={chartWidth - 10}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <text
                      x={leftPadding - 14}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="600"
                      fill="#64748b"
                    >
                      {step}
                    </text>
                  </g>
                );
              })}

              {/* BARRAS DE CADA MÊS (CLUSTER) */}
              {dados.map((d, index) => {
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
                    {/* BARRA INDIRETA (#38bdf8) */}
                    {showIndireta && (
                      <g>
                        <rect
                          x={xInd}
                          y={yInd}
                          width={barWidth}
                          height={Math.max(0, hInd)}
                          fill="#38bdf8"
                          stroke="#0284c7"
                          strokeWidth="0.8"
                          rx="1"
                        />
                        {d.indireta > 0 && (
                          <text
                            x={xInd + barWidth / 2}
                            y={yInd - 3}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#0369a1"
                          >
                            {d.indireta}
                          </text>
                        )}
                      </g>
                    )}

                    {/* BARRA DIRETA (#93c5fd) */}
                    {showDireta && (
                      <g>
                        <rect
                          x={xDir}
                          y={yDir}
                          width={barWidth}
                          height={Math.max(0, hDir)}
                          fill="#93c5fd"
                          stroke="#3b82f6"
                          strokeWidth="0.8"
                          rx="1"
                        />
                        {d.direta > 0 && (
                          <text
                            x={xDir + barWidth / 2}
                            y={yDir - 3}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#1d4ed8"
                          >
                            {d.direta}
                          </text>
                        )}
                      </g>
                    )}

                    {/* BARRA EQUIPAMENTOS (#1e3a8a) */}
                    {showEquipamentos && (
                      <g>
                        <rect
                          x={xEq}
                          y={yEq}
                          width={barWidth}
                          height={Math.max(0, hEq)}
                          fill="#1e3a8a"
                          stroke="#0f172a"
                          strokeWidth="0.8"
                          rx="1"
                        />
                        {d.equipamentos > 0 && (
                          <text
                            x={xEq + barWidth / 2}
                            y={yEq - 3}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#0f172a"
                          >
                            {d.equipamentos}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* LINHA VERDE CONTÍNUA DO TOTAL (#15803d) */}
              {showTotal && dados.length > 1 && (
                <g>
                  <polyline
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={dados
                      .map((d, index) => {
                        const cx = leftPadding + index * colWidth + colWidth / 2;
                        const cy = chartHeight - (d.total / maxEscalaY) * chartHeight + 20;
                        return `${cx},${cy}`;
                      })
                      .join(' ')}
                  />

                  {dados.map((d, index) => {
                    const cx = leftPadding + index * colWidth + colWidth / 2;
                    const cy = chartHeight - (d.total / maxEscalaY) * chartHeight + 20;

                    return (
                      <g key={`pt-${d.sortKey}`}>
                        <circle cx={cx} cy={cy} r="3" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          x={cx}
                          y={cy - 7}
                          textAnchor="middle"
                          fontSize="10"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                          fill="#14532d"
                        >
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

      {/* 3. TABELA DE DETALHAMENTO DE CONTINGENTE (COM EXPANDIR/RECOLHER POR TIPO E CONVERSÃO HORAS -> PESSOAS) */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Tabela de Contingente Mensal (Recolher / Expandir por Tipo)
            </span>
            <span className="text-[11px] text-slate-500">
              (A cada {horasDivisor}h = 1 pessoa/mês)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setExpandIndireta(true);
                setExpandDireta(true);
                setExpandEquipamentos(true);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expandir Tudo</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => {
                setExpandIndireta(false);
                setExpandDireta(false);
                setExpandEquipamentos(false);
              }}
              className="text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Recolher Tudo</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs">
          <div style={{ minWidth: `${chartWidth}px` }} className="text-xs font-mono select-text bg-white">
            {/* CABEÇALHO COM OS NOMES DOS MESES */}
            <div className="flex border-b border-slate-300 bg-slate-900 text-white font-bold text-[11px]">
              <div
                style={{ width: `${leftPadding + 190}px` }}
                className="shrink-0 p-2.5 border-r border-slate-700 font-sans uppercase tracking-wider text-[11px] flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Cargo / Função / Equipamento</span>
              </div>
              <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-slate-700 text-[10px] uppercase font-sans text-slate-300">
                Qtd. Máx
              </div>
              {dados.map((d) => (
                <div
                  key={`th-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-slate-700 last:border-r-0 truncate font-semibold"
                >
                  {d.mesAno}
                </div>
              ))}
            </div>

            {/* GRUPO 1: MÃO DE OBRA INDIRETA */}
            <div>
              {/* CABEÇALHO DO GRUPO INDIRETA */}
              <div
                onClick={() => setExpandIndireta(!expandIndireta)}
                className="flex border-b border-slate-300 bg-sky-100/90 text-sky-950 font-bold cursor-pointer hover:bg-sky-200/80 transition"
              >
                <div
                  style={{ width: `${leftPadding + 190}px` }}
                  className="shrink-0 p-2 border-r border-sky-300 flex items-center gap-2 font-sans text-[11px]"
                >
                  {expandIndireta ? (
                    <ChevronDown className="w-4 h-4 text-sky-800" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-sky-800" />
                  )}
                  <span className="w-3 h-3 rounded-xs bg-[#38bdf8] border border-sky-600 shrink-0" />
                  <span className="uppercase font-black text-sky-900">MÃO DE OBRA INDIRETA</span>
                  <span className="text-[10px] text-sky-700 font-normal font-sans">
                    ({funcoesIndiretas.length} funções)
                  </span>
                </div>
                <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-sky-300 font-bold">
                  19
                </div>
                {dados.map((d) => (
                  <div
                    key={`ind-tot-${d.sortKey}`}
                    style={{ width: `${colWidth}px` }}
                    className="shrink-0 p-2 text-center border-r border-sky-200 last:border-r-0 font-bold"
                  >
                    {d.indireta}
                  </div>
                ))}
              </div>

              {/* FUNÇÕES FILHAS DA MÃO DE OBRA INDIRETA (DA IMAGEM 2) */}
              {expandIndireta &&
                funcoesIndiretas.map((f, fIdx) => (
                  <div
                    key={`ind-f-${fIdx}`}
                    className="flex border-b border-slate-100 hover:bg-sky-50/40 text-[11px] text-slate-700 transition"
                  >
                    <div
                      style={{ width: `${leftPadding + 190}px` }}
                      className="shrink-0 p-1.5 pl-8 border-r border-slate-200 font-sans truncate text-slate-800"
                      title={f.cargo}
                    >
                      {f.cargo}
                    </div>
                    <div style={{ width: '64px' }} className="shrink-0 p-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                      {f.qtdMax}
                    </div>
                    {dados.map((d) => {
                      const val = f.efetivoMensal[d.mesAno] ?? 0;
                      return (
                        <div
                          key={`ind-c-${fIdx}-${d.sortKey}`}
                          style={{ width: `${colWidth}px` }}
                          className={`shrink-0 p-1.5 text-center border-r border-slate-100 last:border-r-0 ${
                            val > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'
                          }`}
                        >
                          {val > 0 ? val : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* GRUPO 2: MÃO DE OBRA DIRETA (COM CONVERSÃO DE HORAS EM PESSOAS) */}
            <div>
              {/* CABEÇALHO DO GRUPO DIRETA */}
              <div
                onClick={() => setExpandDireta(!expandDireta)}
                className="flex border-b border-slate-300 bg-blue-100/90 text-blue-950 font-bold cursor-pointer hover:bg-blue-200/80 transition"
              >
                <div
                  style={{ width: `${leftPadding + 190}px` }}
                  className="shrink-0 p-2 border-r border-blue-300 flex items-center gap-2 font-sans text-[11px]"
                >
                  {expandDireta ? (
                    <ChevronDown className="w-4 h-4 text-blue-800" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-blue-800" />
                  )}
                  <span className="w-3 h-3 rounded-xs bg-[#93c5fd] border border-blue-400 shrink-0" />
                  <span className="uppercase font-black text-blue-900">MÃO DE OBRA DIRETA</span>
                  <span className="text-[10px] text-blue-700 font-normal font-sans">
                    (Horas convertidas / {horasDivisor}h)
                  </span>
                </div>
                <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-blue-300 font-bold">
                  {Math.max(...dados.map((d) => d.direta))}
                </div>
                {dados.map((d) => (
                  <div
                    key={`dir-tot-${d.sortKey}`}
                    style={{ width: `${colWidth}px` }}
                    className="shrink-0 p-2 text-center border-r border-blue-200 last:border-r-0 font-bold"
                  >
                    {d.direta}
                  </div>
                ))}
              </div>

              {/* FUNÇÕES FILHAS DA MÃO DE OBRA DIRETA (COM HORAS E PESSOAS) */}
              {expandDireta &&
                funcoesDiretas.map((f, fIdx) => (
                  <div
                    key={`dir-f-${fIdx}`}
                    className="flex border-b border-slate-100 hover:bg-blue-50/40 text-[11px] text-slate-700 transition"
                  >
                    <div
                      style={{ width: `${leftPadding + 190}px` }}
                      className="shrink-0 p-1.5 pl-8 border-r border-slate-200 font-sans truncate text-slate-800 flex items-center justify-between pr-2"
                      title={f.funcao}
                    >
                      <span>{f.funcao}</span>
                      <span className="text-[9px] text-blue-700 font-mono">horas/{horasDivisor}h</span>
                    </div>
                    <div style={{ width: '64px' }} className="shrink-0 p-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                      {Math.max(
                        0,
                        ...dados.map((d) => {
                          const h = f.horasMensais[d.mesAno] || 0;
                          return Math.round(h / horasDivisor);
                        })
                      )}
                    </div>
                    {dados.map((d) => {
                      const horas = f.horasMensais[d.mesAno] || 0;
                      const pessoas = Math.round((horas / horasDivisor) * 10) / 10;

                      return (
                        <div
                          key={`dir-c-${fIdx}-${d.sortKey}`}
                          style={{ width: `${colWidth}px` }}
                          className={`shrink-0 p-1.5 text-center border-r border-slate-100 last:border-r-0 group relative ${
                            pessoas > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'
                          }`}
                          title={`${horas.toFixed(0)} horas / ${horasDivisor}h = ${pessoas} pessoa(s)`}
                        >
                          {pessoas > 0 ? pessoas : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* GRUPO 3: EQUIPAMENTOS (SUBSTITUI SUBCONTRATAÇÃO DA FOTO) */}
            <div>
              {/* CABEÇALHO DO GRUPO EQUIPAMENTOS */}
              <div
                onClick={() => setExpandEquipamentos(!expandEquipamentos)}
                className="flex border-b border-slate-300 bg-indigo-100/90 text-indigo-950 font-bold cursor-pointer hover:bg-indigo-200/80 transition"
              >
                <div
                  style={{ width: `${leftPadding + 190}px` }}
                  className="shrink-0 p-2 border-r border-indigo-300 flex items-center gap-2 font-sans text-[11px]"
                >
                  {expandEquipamentos ? (
                    <ChevronDown className="w-4 h-4 text-indigo-900" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-indigo-900" />
                  )}
                  <span className="w-3 h-3 rounded-xs bg-[#1e3a8a] border border-slate-900 shrink-0" />
                  <span className="uppercase font-black text-indigo-950">EQUIPAMENTOS</span>
                  <span className="text-[10px] text-indigo-800 font-normal font-sans">
                    ({equipamentosDetalhados.length} tipos)
                  </span>
                </div>
                <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-indigo-300 font-bold">
                  {Math.max(...dados.map((d) => d.equipamentos))}
                </div>
                {dados.map((d) => (
                  <div
                    key={`eq-tot-${d.sortKey}`}
                    style={{ width: `${colWidth}px` }}
                    className="shrink-0 p-2 text-center border-r border-indigo-200 last:border-r-0 font-bold"
                  >
                    {d.equipamentos}
                  </div>
                ))}
              </div>

              {/* EQUIPAMENTOS FILHOS */}
              {expandEquipamentos &&
                equipamentosDetalhados.map((eq, eqIdx) => (
                  <div
                    key={`eq-f-${eqIdx}`}
                    className="flex border-b border-slate-100 hover:bg-indigo-50/40 text-[11px] text-slate-700 transition"
                  >
                    <div
                      style={{ width: `${leftPadding + 190}px` }}
                      className="shrink-0 p-1.5 pl-8 border-r border-slate-200 font-sans truncate text-slate-800"
                      title={eq.nome}
                    >
                      {eq.nome}
                    </div>
                    <div style={{ width: '64px' }} className="shrink-0 p-1.5 text-center border-r border-slate-200 font-bold text-slate-900">
                      {eq.qtdMax}
                    </div>
                    {dados.map((d) => {
                      const val = eq.efetivoMensal[d.mesAno] ?? 0;
                      return (
                        <div
                          key={`eq-c-${eqIdx}-${d.sortKey}`}
                          style={{ width: `${colWidth}px` }}
                          className={`shrink-0 p-1.5 text-center border-r border-slate-100 last:border-r-0 ${
                            val > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'
                          }`}
                        >
                          {val > 0 ? val : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>

            {/* LINHA FINAL: TOTAL GERAL (COM A LINHA VERDE) */}
            <div className="flex bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-300">
              <div
                style={{ width: `${leftPadding + 190}px` }}
                className="shrink-0 p-2.5 border-r border-emerald-300 flex items-center gap-2 font-sans font-black text-[11px]"
              >
                <span className="w-3.5 h-1.5 bg-[#15803d] shrink-0" />
                <span className="truncate text-emerald-900 uppercase">TOTAL CONTINGENTE / MÊS</span>
              </div>
              <div style={{ width: '64px' }} className="shrink-0 p-2 text-center border-r border-emerald-300 font-black text-emerald-950">
                {Math.max(...dados.map((d) => d.total))}
              </div>
              {dados.map((d) => (
                <div
                  key={`tot-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-emerald-200 last:border-r-0 text-emerald-900 font-black"
                >
                  {d.total}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
