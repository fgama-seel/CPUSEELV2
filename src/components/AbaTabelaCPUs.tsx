import React, { useState } from 'react';
import {
  Table,
  Search,
  FileSpreadsheet,
  Network,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Database,
  Hash,
  Briefcase,
  Layers,
  Sparkles,
  Check,
  Filter
} from 'lucide-react';
import { CPU, Obra } from '../types';
import { formatMoney, exportarListaCPUs, exportarComposicoes } from '../lib/excelExport';
import { ModalConfirmarExclusaoCPU } from './ModalConfirmarExclusaoCPU';

interface AbaTabelaCPUsProps {
  cpus: CPU[];
  activeObra: Obra | null;
  onSelectCpu: (cpuId: string) => void;
  onDeleteCpu?: (cpuId: string) => Promise<void>;
  onOpenImportModal?: () => void;
  onSaveCpu?: (cpu: CPU) => Promise<void>;
}

type SortCol = 'sequencia' | 'code' | 'nome' | 'unidade' | 'quantidade' | 'vendaUnt' | 'vendaTotal' | 'custoUnt' | 'custoTotal' | 'fcd';
type FilterType = 'all' | 'diretos' | 'indiretos';

export const AbaTabelaCPUs: React.FC<AbaTabelaCPUsProps> = ({
  cpus,
  activeObra,
  onSelectCpu,
  onDeleteCpu,
  onOpenImportModal,
  onSaveCpu
}) => {
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortCol, setSortCol] = useState<SortCol>('sequencia');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [cpuToDelete, setCpuToDelete] = useState<CPU | null>(null);
  const [editingSeqId, setEditingSeqId] = useState<string | null>(null);
  const [editingSeqVal, setEditingSeqVal] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const bdiObra = activeObra?.bdi ?? 25;

  // Compute values for each CPU
  const computedList = cpus.map((cpu, index) => {
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
    const seq = typeof cpu.sequencia === 'number' && !isNaN(cpu.sequencia) ? cpu.sequencia : (index + 1);

    return {
      id: cpu.id,
      sequencia: seq,
      code: cpu.code,
      nome: cpu.nome,
      unidade: cpu.unidade,
      quantidade: qtd,
      vendaUnt,
      vendaTotal,
      custoUnt,
      custoTotal,
      fcd,
      isVendaDefinida,
      isCustoIndireto: cpu.isCustoIndireto === true,
      originalCpu: cpu
    };
  });

  const filtered = computedList.filter((c) => {
    // Type Filter
    if (filterType === 'diretos' && c.isCustoIndireto) return false;
    if (filterType === 'indiretos' && !c.isCustoIndireto) return false;

    // Search text
    if (!filterText) return true;
    const text = filterText.toLowerCase();
    return (
      c.code.toLowerCase().includes(text) ||
      c.nome.toLowerCase().includes(text) ||
      c.unidade.toLowerCase().includes(text) ||
      String(c.sequencia).includes(text)
    );
  });

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

  // Toggle Custo Direto vs Custo Indireto
  const handleToggleIndireto = async (e: React.MouseEvent, cpu: CPU) => {
    e.stopPropagation();
    if (!onSaveCpu) return;
    setIsUpdating(true);
    try {
      const updated: CPU = {
        ...cpu,
        isCustoIndireto: !cpu.isCustoIndireto,
        updatedAt: new Date().toISOString()
      };
      await onSaveCpu(updated);
    } catch (err) {
      console.error('Erro ao alternar custo indireto:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Save inline sequence change
  const handleSaveSequence = async (e: React.MouseEvent | React.KeyboardEvent, cpu: CPU) => {
    e.stopPropagation();
    if (!onSaveCpu) return;
    const newSeq = parseInt(editingSeqVal, 10);
    if (isNaN(newSeq) || newSeq < 1) {
      setEditingSeqId(null);
      return;
    }
    setIsUpdating(true);
    try {
      const updated: CPU = {
        ...cpu,
        sequencia: newSeq,
        updatedAt: new Date().toISOString()
      };
      await onSaveCpu(updated);
      setEditingSeqId(null);
    } catch (err) {
      console.error('Erro ao atualizar sequencia:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-number sequences sequentially 1..N based on current list order
  const handleAutoNumerar = async () => {
    if (!onSaveCpu) return;
    if (!window.confirm('Deseja renumerar a sequência de todas as CPUs da obra de 1 até ' + cpus.length + '?')) {
      return;
    }
    setIsUpdating(true);
    try {
      for (let i = 0; i < cpus.length; i++) {
        const cpu = cpus[i];
        if (cpu.sequencia !== i + 1) {
          await onSaveCpu({
            ...cpu,
            sequencia: i + 1,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Erro ao renumerar sequencias:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Summary counts
  const totalCpus = cpus.length;
  const countIndiretas = cpus.filter((c) => c.isCustoIndireto).length;
  const countDiretas = totalCpus - countIndiretas;

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {activeObra?.codigo || 'OBRA'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {totalCpus} CPUs cadastradas ({countDiretas} Diretas | {countIndiretas} Indiretas)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>Tabela Geral de CPUs - {activeObra?.nome || 'Obra'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidado de composições com sequência natural da PQ, classificação de Custo Direto/Indireto e F/CD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {onSaveCpu && (
              <button
                onClick={handleAutoNumerar}
                disabled={isUpdating}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Renumerar sequências de 1 a N automaticamente"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Numerar 1..N</span>
              </button>
            )}

            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
                title="Importar base de dados e composições de CPUs"
              >
                <Database className="w-4 h-4" />
                <span>Importar BD / CSV</span>
              </button>
            )}

            <button
              onClick={() => exportarListaCPUs(cpus, activeObra || undefined)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Classificação:</span>
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({totalCpus})
            </button>
            <button
              onClick={() => setFilterType('diretos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                filterType === 'diretos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Diretas ({countDiretas})
            </button>
            <button
              onClick={() => setFilterType('indiretos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                filterType === 'indiretos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Indiretas ({countIndiretas})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Pesquisar por Seq, Código, Nome..."
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white font-medium text-slate-700 shadow-xs w-full"
            />
          </div>
        </div>

        {/* CPUs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-800 text-white text-xs select-none uppercase tracking-wider">
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-16 text-center"
                  onClick={() => handleSort('sequencia')}
                  title="Sequência numérica natural da Planilha de Quantidades (PQ)"
                >
                  Seq. {renderSortIcon('sequencia')}
                </th>
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-28"
                  onClick={() => handleSort('code')}
                >
                  ID CPU {renderSortIcon('code')}
                </th>
                <th
                  className="p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  onClick={() => handleSort('nome')}
                >
                  Serviço / Composição {renderSortIcon('nome')}
                </th>
                <th className="p-3 text-center border-b border-slate-700 w-32">
                  Tipo Custo
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-20"
                  onClick={() => handleSort('unidade')}
                >
                  Unid. {renderSortIcon('unidade')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-24"
                  onClick={() => handleSort('quantidade')}
                >
                  Qtd {renderSortIcon('quantidade')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-32"
                  onClick={() => handleSort('vendaUnt')}
                >
                  Venda Unt. {renderSortIcon('vendaUnt')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-36"
                  onClick={() => handleSort('vendaTotal')}
                >
                  Venda Total {renderSortIcon('vendaTotal')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-32"
                  onClick={() => handleSort('custoUnt')}
                >
                  Custo Unt. {renderSortIcon('custoUnt')}
                </th>
                <th
                  className="p-3 text-right border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-36"
                  onClick={() => handleSort('custoTotal')}
                >
                  Custo Total {renderSortIcon('custoTotal')}
                </th>
                <th
                  className="p-3 text-center border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition w-20"
                  onClick={() => handleSort('fcd')}
                >
                  F/CD {renderSortIcon('fcd')}
                </th>
                <th className="p-3 text-center border-b border-slate-700 w-16">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="text-xs divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500 italic">
                    Nenhuma CPU encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  let fcdColor = 'text-slate-700 font-bold';
                  if (item.fcd < 1) fcdColor = 'text-red-600 font-bold';
                  else if (item.fcd >= 1.2) fcdColor = 'text-emerald-600 font-bold';

                  const isEditingSeq = editingSeqId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectCpu(item.id)}
                      className={`hover:bg-blue-50/80 transition cursor-pointer group ${
                        item.isCustoIndireto ? 'bg-purple-50/20' : ''
                      }`}
                    >
                      {/* Sequência PQ com Edição Rápida */}
                      <td
                        className="p-3 text-center font-mono font-black border-r border-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isEditingSeq) {
                            setEditingSeqId(item.id);
                            setEditingSeqVal(String(item.sequencia));
                          }
                        }}
                      >
                        {isEditingSeq ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={editingSeqVal}
                              onChange={(e) => setEditingSeqVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSequence(e, item.originalCpu);
                                if (e.key === 'Escape') setEditingSeqId(null);
                              }}
                              className="w-12 text-center p-0.5 text-xs font-mono font-bold border border-blue-500 rounded bg-white shadow-inner"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleSaveSequence(e, item.originalCpu)}
                              className="p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                              title="Salvar Sequência"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-xs inline-block transition"
                            title="Clique para editar a sequência da PQ"
                          >
                            #{item.sequencia}
                          </span>
                        )}
                      </td>

                      {/* Código CPU */}
                      <td className="p-3 font-mono font-bold text-slate-500 group-hover:text-blue-600">
                        {item.code}
                      </td>

                      {/* Nome CPU */}
                      <td className="p-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{item.nome}</span>
                          {item.isCustoIndireto && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0">
                              Indireto
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Classificação Custo Direto / Custo Indireto Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => handleToggleIndireto(e, item.originalCpu)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                            item.isCustoIndireto
                              ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 shadow-2xs'
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 shadow-2xs'
                          }`}
                          title={
                            item.isCustoIndireto
                              ? 'Classificado como Custo Indireto. Clique para mudar para Custo Direto.'
                              : 'Classificado como Custo Direto. Clique para mudar para Custo Indireto.'
                          }
                        >
                          {item.isCustoIndireto ? (
                            <>
                              <Briefcase className="w-3 h-3 text-purple-700" />
                              <span>Indireto</span>
                            </>
                          ) : (
                            <>
                              <Layers className="w-3 h-3 text-blue-700" />
                              <span>Direto</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Unidade */}
                      <td className="p-3 text-center">
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                          {item.unidade}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="p-3 text-right font-mono font-medium">
                        {item.quantidade.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* Venda Unt */}
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

                      {/* Venda Total */}
                      <td className="p-3 text-right font-bold text-blue-900">
                        {formatMoney(item.vendaTotal)}
                      </td>

                      {/* Custo Unt */}
                      <td className="p-3 text-right text-amber-700 font-medium">
                        {formatMoney(item.custoUnt)}
                      </td>

                      {/* Custo Total */}
                      <td className="p-3 text-right font-bold text-amber-900">
                        {formatMoney(item.custoTotal)}
                      </td>

                      {/* F/CD */}
                      <td className={`p-3 text-center ${fcdColor} bg-slate-50 border-l border-slate-200`}>
                        {item.fcd.toFixed(2)}
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-center border-l border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCpuToDelete(item.originalCpu);
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
