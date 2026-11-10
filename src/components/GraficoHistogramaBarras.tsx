import React, { useState } from 'react';
import { Download, Filter, Eye, EyeOff, Layers, Users, Truck, CheckSquare, Square } from 'lucide-react';
import { Obra } from '../types';
import { exportarHistogramaMensalMatriz } from '../lib/excelExport';

export interface MesHistogramaData {
  mesAno: string; // ex: "nov/26"
  sortKey: string; // ex: "2026-11"
  indireta: number;
  direta: number;
  equipamentos: number;
  total: number;
}

interface GraficoHistogramaBarrasProps {
  dados: MesHistogramaData[];
  activeObra: Obra | null;
  onExportar?: () => void;
}

export const GraficoHistogramaBarras: React.FC<GraficoHistogramaBarrasProps> = ({
  dados,
  activeObra
}) => {
  // Filtros de visibilidade das séries
  const [showIndireta, setShowIndireta] = useState(true);
  const [showDireta, setShowDireta] = useState(true);
  const [showEquipamentos, setShowEquipamentos] = useState(true);
  const [showTotal, setShowTotal] = useState(true);

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

  // Arredonda para múltiplo de 10 superior
  const maxEscalaY = Math.ceil(maxValor / 10) * 10;
  const stepsY = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

  // Dimensões do SVG
  const chartHeight = 240; // Altura útil da área gráfica
  const colWidth = 56; // Largura de cada mês em pixels
  const leftPadding = 48; // Espaço do eixo Y à esquerda
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* CABEÇALHO DO HISTOGRAMA COM FILTROS DE SÉRIES E EXPORTAÇÃO */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Controle de Séries Visíveis:
          </span>

          <div className="flex flex-wrap items-center gap-2">
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
        </div>

        <button
          onClick={handleExportarExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Histograma (.xlsx)</span>
        </button>
      </div>

      {/* ÁREA GRÁFICA COM SCROLL HORIZONTAL COMPLETO (26 MESES ALINHADOS) */}
      <div className="overflow-x-auto p-4 bg-white">
        <div style={{ minWidth: `${chartWidth}px` }} className="relative select-none">
          {/* 1. GRÁFICO SVG COM LINHAS DE GRADE, BARRAS CLUSTERIZADAS E LINHA VERDE */}
          <div className="relative" style={{ height: `${chartHeight + 40}px` }}>
            <svg
              width={chartWidth}
              height={chartHeight + 40}
              className="overflow-visible block"
            >
              {/* LINHAS DE GRADE HORIZONTAIS DO EIXO Y (0 a 100) */}
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

              {/* BARRAS DE CADA MÊS (CLUSTER: INDIRETA, DIRETA, EQUIPAMENTOS) */}
              {dados.map((d, index) => {
                const colCenterX = leftPadding + index * colWidth + colWidth / 2;
                const barWidth = 9; // Largura de cada uma das 3 barras
                const spacing = 1.5;

                // Coordenadas X das 3 barras
                const xInd = colCenterX - (barWidth * 1.5 + spacing);
                const xDir = colCenterX - barWidth / 2;
                const xEq = colCenterX + (barWidth / 2 + spacing);

                // Alturas em pixels
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

              {/* LINHA VERDE CONTÍNUA DO TOTAL (#15803d) COM OS PONTOS E VALORES */}
              {showTotal && dados.length > 1 && (
                <g>
                  {/* Linha conectora */}
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

                  {/* Marcadores e rótulos de pico de cada mês */}
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

          {/* 2. TABELA DE DADOS INTEGRADA EXATAMENTE COMO NA IMAGEM DE REFERÊNCIA */}
          <div className="border border-slate-300 text-xs font-mono select-text bg-white mt-2">
            {/* LINHA CABEÇALHO COM OS NOMES DOS MESES */}
            <div className="flex border-b border-slate-300 bg-slate-50 font-bold text-[11px] text-slate-700">
              <div
                style={{ width: `${leftPadding + 110}px` }}
                className="shrink-0 p-2 border-r border-slate-300 font-sans uppercase tracking-wider text-[10px] text-slate-500 flex items-center"
              >
                Mês / Competência
              </div>
              {dados.map((d) => (
                <div
                  key={`th-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-slate-200 last:border-r-0 truncate font-semibold"
                >
                  {d.mesAno}
                </div>
              ))}
            </div>

            {/* LINHA 1: INDIRETA */}
            <div
              className={`flex border-b border-slate-200 transition ${
                showIndireta ? 'bg-sky-50/40 text-slate-900' : 'text-slate-400 opacity-50'
              }`}
            >
              <div
                style={{ width: `${leftPadding + 110}px` }}
                className="shrink-0 p-2 border-r border-slate-300 flex items-center gap-2 font-sans font-bold text-[11px]"
              >
                <span className="w-3 h-3 rounded-xs bg-[#38bdf8] border border-sky-600 shrink-0" />
                <span className="truncate">INDIRETA</span>
              </div>
              {dados.map((d) => (
                <div
                  key={`ind-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-slate-200 last:border-r-0 font-medium"
                >
                  {d.indireta}
                </div>
              ))}
            </div>

            {/* LINHA 2: DIRETA */}
            <div
              className={`flex border-b border-slate-200 transition ${
                showDireta ? 'bg-blue-50/40 text-slate-900' : 'text-slate-400 opacity-50'
              }`}
            >
              <div
                style={{ width: `${leftPadding + 110}px` }}
                className="shrink-0 p-2 border-r border-slate-300 flex items-center gap-2 font-sans font-bold text-[11px]"
              >
                <span className="w-3 h-3 rounded-xs bg-[#93c5fd] border border-blue-400 shrink-0" />
                <span className="truncate">DIRETA</span>
              </div>
              {dados.map((d) => (
                <div
                  key={`dir-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-slate-200 last:border-r-0 font-medium"
                >
                  {d.direta}
                </div>
              ))}
            </div>

            {/* LINHA 3: EQUIPAMENTOS (Substitui subcontratação da foto) */}
            <div
              className={`flex border-b border-slate-200 transition ${
                showEquipamentos ? 'bg-indigo-50/40 text-slate-900' : 'text-slate-400 opacity-50'
              }`}
            >
              <div
                style={{ width: `${leftPadding + 110}px` }}
                className="shrink-0 p-2 border-r border-slate-300 flex items-center gap-2 font-sans font-bold text-[11px]"
              >
                <span className="w-3 h-3 rounded-xs bg-[#1e3a8a] border border-slate-900 shrink-0" />
                <span className="truncate">EQUIPAMENTOS</span>
              </div>
              {dados.map((d) => (
                <div
                  key={`eq-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-slate-200 last:border-r-0 font-medium"
                >
                  {d.equipamentos}
                </div>
              ))}
            </div>

            {/* LINHA 4: TOTAL (COM A LINHA VERDE) */}
            <div
              className={`flex bg-emerald-50/70 text-emerald-950 font-bold border-t border-slate-300 ${
                showTotal ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div
                style={{ width: `${leftPadding + 110}px` }}
                className="shrink-0 p-2 border-r border-slate-300 flex items-center gap-2 font-sans font-black text-[11px]"
              >
                <span className="w-3.5 h-1 bg-[#15803d] shrink-0" />
                <span className="truncate text-emerald-900">TOTAL</span>
              </div>
              {dados.map((d) => (
                <div
                  key={`tot-${d.sortKey}`}
                  style={{ width: `${colWidth}px` }}
                  className="shrink-0 p-2 text-center border-r border-slate-200 last:border-r-0 text-emerald-900 font-black"
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
