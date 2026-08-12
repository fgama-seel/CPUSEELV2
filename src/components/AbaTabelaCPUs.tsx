import React, { useState } from 'react';
import { Table, Search, FileSpreadsheet, Network, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { CPU, Obra } from '../types';
import { formatMoney, exportarListaCPUs, exportarComposicoes } from '../lib/excelExport';
import { ModalConfirmarExclusaoCPU } from './ModalConfirmarExclusaoCPU';

interface AbaTabelaCPUsProps {
  cpus: CPU[];
  activeObra: Obra | null;
  onSelectCpu: (cpuId: string) => void;
  onDeleteCpu?: (cpuId: string) => Promise<void>;
}

type SortCol = 'code' | 'nome' | 'unidade' | 'quantidade' | 'vendaUnt' | 'vendaTotal' | 'custoUnt' | 'custoTotal' | 'fcd';

export const AbaTabelaCPUs: React.FC<AbaTabelaCPUsProps> = ({ cpus, activeObra, onSelectCpu, onDeleteCpu }) => {
  const [filterText, setFilterText] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [cpuToDelete, setCpuToDelete] = useState<CPU | null>(null);

  const bdiObra = activeObra?.bdi ?? 25;

  // Compute values for each CPU
  const computedList = cpus.map((cpu) => {
    const qtd = cpu.quantidade_prevista || 1;
    let custoUnt = 0;

    if (cpu.insumos) {
      cpu.insumos.forEach((ins) => {
        custoUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }

    const isVendaDefinida = cpu.vendaDefinida === true;
    const vendaUnt = isVendaDefinida
      ? (cpu.preco_venda || 0)
      : custoUnt * (1 + bdiObra / 100);

    const custoTotal = custoUnt * qtd;
    const vendaTotal = vendaUnt * qtd;
    const fcd = custoTotal > 0 ? vendaTotal / custoTotal : 0;

    return {
      id: cpu.id,
      code: cpu.code,
      nome: cpu.nome,
      unidade: cpu.unidade,
      quantidade: qtd,
      vendaUnt,
      vendaTotal,
      custoUnt,
      custoTotal,
      fcd,
      isVendaDefinida
    };
  });

  const filtered = computedList.filter(
    (c) =>
      c.code.toLowerCase().includes(filterText.toLowerCase()) ||
      c.nome.toLowerCase().includes(filterText.toLowerCase()) ||
      c.unidade.toLowerCase().includes(filterText.toLowerCase())
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
      setSortDir('asc');
    }
  };

  const renderSortIcon = (col: SortCol) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 ml-1 inline" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-400 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 ml-1 inline" />
    );
  };

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>Relatório Geral de CPUs - {activeObra?.nome || 'Obra'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidado de CPUs cadastradas na obra com cálculos automáticos de custo, venda e F/CD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => exportarListaCPUs(cpus, activeObra || undefined)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Lista</span>
            </button>

            <button
              onClick={() => exportarComposicoes(cpus, activeObra || undefined)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Network className="w-4 h-4" />
              <span>Exportar Composições</span>
            </button>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Pesquisar CPU..."
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white font-medium text-slate-700 shadow-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* CPUs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-800 text-white text-xs select-none uppercase tracking-wider">
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('code')}
                >
                  ID CPU {renderSortIcon('code')}
                </th>
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('nome')}
                >
                  Serviço {renderSortIcon('nome')}
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('unidade')}
                >
                  Unid. {renderSortIcon('unidade')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('quantidade')}
                >
                  Quantidade {renderSortIcon('quantidade')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('vendaUnt')}
                >
                  Venda Unt. {renderSortIcon('vendaUnt')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('vendaTotal')}
                >
                  Venda Total {renderSortIcon('vendaTotal')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('custoUnt')}
                >
                  Custo Unt. {renderSortIcon('custoUnt')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('custoTotal')}
                >
                  Custo Total {renderSortIcon('custoTotal')}
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('fcd')}
                >
                  F/CD {renderSortIcon('fcd')}
                </th>
                <th className="p-3 text-center border-b border-slate-700 w-12">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="text-xs divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                    Nenhuma CPU encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  let fcdColor = 'text-slate-700 font-bold';
                  if (item.fcd < 1) fcdColor = 'text-red-600 font-bold';
                  else if (item.fcd >= 1.2) fcdColor = 'text-emerald-600 font-bold';

                  const originalCpu = cpus.find((c) => c.id === item.id) || null;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectCpu(item.id)}
                      className="hover:bg-blue-50/80 transition cursor-pointer group"
                    >
                      <td className="p-3 font-mono font-bold text-slate-500 group-hover:text-blue-600">
                        {item.code}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{item.nome}</td>
                      <td className="p-3 text-center">
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                          {item.unidade}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {item.quantidade.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td className="p-3 text-right text-blue-700 font-medium">
                        <div>{formatMoney(item.vendaUnt)}</div>
                        {item.isVendaDefinida ? (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold inline-block">
                            Manual
                          </span>
                        ) : (
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold inline-block">
                            BDI {bdiObra}%
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-900">
                        {formatMoney(item.vendaTotal)}
                      </td>
                      <td className="p-3 text-right text-amber-700 font-medium">
                        {formatMoney(item.custoUnt)}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-900">
                        {formatMoney(item.custoTotal)}
                      </td>
                      <td className={`p-3 text-center ${fcdColor} bg-slate-50 border-l border-slate-200`}>
                        {item.fcd.toFixed(2)}
                      </td>
                      <td className="p-3 text-center border-l border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (originalCpu) setCpuToDelete(originalCpu);
                          }}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                          title="Excluir esta CPU"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalConfirmarExclusaoCPU
        isOpen={!!cpuToDelete}
        cpu={cpuToDelete}
        onClose={() => setCpuToDelete(null)}
        onConfirmDelete={async (id) => {
          if (onDeleteCpu) await onDeleteCpu(id);
          setCpuToDelete(null);
        }}
      />
    </div>
  );
};
