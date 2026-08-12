import React, { useState } from 'react';
import { Boxes, Search, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CPU, Obra, ABCInsumoItem } from '../types';
import { formatMoney, exportarABC } from '../lib/excelExport';

interface AbaABCInsumosProps {
  cpus: CPU[];
  activeObra: Obra | null;
  onOpenTraceability: (insumoId: string, insumoNome: string) => void;
}

type SortCol = 'id_insumo' | 'descricao' | 'unid' | 'tipo' | 'qtdTotal' | 'custoTotal' | 'percTotal';

export const AbaABCInsumos: React.FC<AbaABCInsumosProps> = ({
  cpus,
  activeObra,
  onOpenTraceability
}) => {
  const [filterText, setFilterText] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('custoTotal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Consolidate insumos from all CPUs of active Obra
  const insumoMap: Record<
    string,
    { id_insumo: string; descricao: string; unid: string; tipo: any; qtdTotal: number; custoTotal: number }
  > = {};

  let custoGlobalObra = 0;

  cpus.forEach((cpu) => {
    const qtdCpu = Number(cpu.quantidade_prevista) || 1;
    if (cpu.insumos) {
      cpu.insumos.forEach((ins) => {
        const key = ins.id_insumo || ins.descricao;
        const coef = Number(ins.coef) || 0;
        const prUnit = Number(ins.pr_unit) || 0;
        const qtdConsumida = coef * qtdCpu;
        const custoTotalInsumo = qtdConsumida * prUnit;

        custoGlobalObra += custoTotalInsumo;

        if (!insumoMap[key]) {
          insumoMap[key] = {
            id_insumo: ins.id_insumo || 'N/A',
            descricao: ins.descricao,
            unid: ins.unid,
            tipo: ins.tipo,
            qtdTotal: 0,
            custoTotal: 0
          };
        }
        insumoMap[key].qtdTotal += qtdConsumida;
        insumoMap[key].custoTotal += custoTotalInsumo;
      });
    }
  });

  const abcList: ABCInsumoItem[] = Object.values(insumoMap).map((item) => ({
    ...item,
    percTotal: custoGlobalObra > 0 ? (item.custoTotal / custoGlobalObra) * 100 : 0
  }));

  const filtered = abcList.filter(
    (item) =>
      item.id_insumo.toLowerCase().includes(filterText.toLowerCase()) ||
      item.descricao.toLowerCase().includes(filterText.toLowerCase()) ||
      item.unid.toLowerCase().includes(filterText.toLowerCase())
  );

  filtered.sort((a, b) => {
    let valA: any = a[sortCol];
    let valB: any = b[sortCol];

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const renderSortIcon = (col: SortCol) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 ml-1 inline" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-purple-500 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-purple-500 ml-1 inline" />
    );
  };

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-600" />
              <span>Curva ABC de Insumos - {activeObra?.nome || 'Obra'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visão consolidada do consumo global de insumos da obra. Clique em um insumo para ver onde ele é utilizado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => exportarABC(abcList, activeObra || undefined)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar ABC</span>
            </button>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Pesquisar Insumo..."
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-purple-500 bg-white font-medium text-slate-700 shadow-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800 text-white text-xs select-none uppercase tracking-wider">
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('id_insumo')}
                >
                  ID Insumo {renderSortIcon('id_insumo')}
                </th>
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('descricao')}
                >
                  Nome / Descrição {renderSortIcon('descricao')}
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('tipo')}
                >
                  Tipo {renderSortIcon('tipo')}
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('unid')}
                >
                  Unid. {renderSortIcon('unid')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('qtdTotal')}
                >
                  Qtd Total {renderSortIcon('qtdTotal')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('custoTotal')}
                >
                  Custo Total {renderSortIcon('custoTotal')}
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('percTotal')}
                >
                  % do Custo Total {renderSortIcon('percTotal')}
                </th>
              </tr>
            </thead>

            <tbody className="text-xs divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    Nenhum insumo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id_insumo}
                    onClick={() => onOpenTraceability(item.id_insumo, item.descricao)}
                    title="Clique para ver onde este insumo é utilizado"
                    className="hover:bg-purple-50/80 transition cursor-pointer group"
                  >
                    <td className="p-3 font-mono text-slate-500 font-bold group-hover:text-purple-600">
                      {item.id_insumo}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{item.descricao}</td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {item.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {item.unid}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {item.qtdTotal.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-900">
                      {formatMoney(item.custoTotal)}
                    </td>
                    <td className="p-3 text-center bg-slate-50 border-l border-slate-200 font-extrabold text-purple-700">
                      {item.percTotal.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
