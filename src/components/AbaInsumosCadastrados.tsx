import React, { useState } from 'react';
import {
  Boxes,
  Search,
  PlusCircle,
  Database,
  Edit2,
  Trash2,
  Check,
  X,
  Filter,
  Save,
  AlertTriangle,
  Briefcase,
  Sparkles,
  Info
} from 'lucide-react';
import { InsumoBase, TipoInsumo, Obra } from '../types';
import { formatMoney } from '../lib/excelExport';
import { saveInsumoBase, deleteInsumoBase, createInsumoBase, updateInsumoCascadeToCPUs } from '../services/dbService';
import { ModalImportarInsumos } from './ModalImportarInsumos';
import { ModalConfigMochilaMO } from './ModalConfigMochilaMO';
import { HORAS_MES_PADRAO, calcularMochila } from '../lib/mochilaDefaults';

interface AbaInsumosCadastradosProps {
  bancoInsumos: InsumoBase[];
  activeObra: Obra | null;
  userPermission?: any;
  userEmail?: string;
  onRefresh?: () => void;
}

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const AbaInsumosCadastrados: React.FC<AbaInsumosCadastradosProps> = ({
  bancoInsumos,
  activeObra,
  onRefresh
}) => {
  const [filterText, setFilterText] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | TipoInsumo>('Todos');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMochilaModal, setShowMochilaModal] = useState(false);
  const [selectedMochilaInsumoId, setSelectedMochilaInsumoId] = useState<string | null>(null);
  
  // New Insumo Modal/Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoInsumo>('Material');
  const [novoDesc, setNovoDesc] = useState('');
  const [novoUnid, setNovoUnid] = useState('');
  const [novoPreco, setNovoPreco] = useState<number>(0);
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Editing Row State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InsumoBase>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deleting State
  const [deletingInsumo, setDeletingInsumo] = useState<InsumoBase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Banner State
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Mochila calculations for active obra
  const mochilaConfig = activeObra?.mochilaMO;
  const { totalMensal: mochilaTotalMensal, custoHoraMochila } = mochilaConfig?.itens
    ? calcularMochila(mochilaConfig.itens, mochilaConfig.horasMesPadrao || HORAS_MES_PADRAO)
    : { totalMensal: 0, custoHoraMochila: 0 };

  // Filter logic
  const filtered = bancoInsumos.filter((item) => {
    if (filterTipo !== 'Todos' && item.tipo !== filterTipo) {
      return false;
    }
    if (!filterText.trim()) return true;
    const normSearch = normalizeText(filterText);
    const normDesc = normalizeText(item.descricao);
    const normCod = normalizeText(item.id_insumo || item.id || '');
    const normUnid = normalizeText(item.unid);
    return (
      normDesc.includes(normSearch) ||
      normCod.includes(normSearch) ||
      normUnid.includes(normSearch)
    );
  });

  // Metrics
  const totalCount = bancoInsumos.length;
  const countMaterial = bancoInsumos.filter((i) => i.tipo === 'Material').length;
  const countMaoObra = bancoInsumos.filter((i) => i.tipo === 'Mão de Obra').length;
  const countEquipamento = bancoInsumos.filter((i) => i.tipo === 'Equipamento').length;
  const countTerceirizado = bancoInsumos.filter((i) => i.tipo === 'Terceirizado').length;

  const handleStartEdit = (insumo: InsumoBase) => {
    setEditingId(insumo.id);
    setEditForm({ ...insumo });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.descricao || !editForm.unid) return;
    setIsSavingEdit(true);
    try {
      const originalInsumo = bancoInsumos.find((i) => i.id === editingId);
      const updatedInsumo: InsumoBase = {
        id: editingId,
        id_insumo: editForm.id_insumo || editingId,
        obraId: editForm.obraId || activeObra?.id || 'obra-966',
        tipo: editForm.tipo || 'Material',
        descricao: editForm.descricao.trim(),
        unid: editForm.unid.trim().toUpperCase(),
        pr_unit: Number(editForm.pr_unit) || 0
      };

      const updatedCpusCount = await updateInsumoCascadeToCPUs(updatedInsumo, originalInsumo);

      setEditingId(null);
      setEditForm({});

      setFeedbackMsg(
        updatedCpusCount > 0
          ? `Insumo atualizado! Alterações replicadas em ${updatedCpusCount} CPU(s).`
          : 'Insumo atualizado com sucesso no banco!'
      );
      setTimeout(() => setFeedbackMsg(null), 4000);

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar insumo:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInsumo) return;
    setIsDeleting(true);
    try {
      await deleteInsumoBase(deletingInsumo.id);
      setDeletingInsumo(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao excluir insumo:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoDesc.trim() || !novoUnid.trim()) return;
    setIsSavingNew(true);
    try {
      await createInsumoBase({
        id_insumo: novoCodigo.trim() || `INS_${Date.now()}`,
        tipo: novoTipo,
        descricao: novoDesc.trim(),
        unid: novoUnid.trim().toUpperCase(),
        pr_unit: Number(novoPreco) || 0,
        obraId: activeObra?.id || 'obra-966'
      });
      setShowNewModal(false);
      setNovoCodigo('');
      setNovoDesc('');
      setNovoUnid('');
      setNovoPreco(0);
      setNovoTipo('Material');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao criar novo insumo:', err);
    } finally {
      setIsSavingNew(false);
    }
  };

  const getBadgeStyle = (tipo: TipoInsumo) => {
    switch (tipo) {
      case 'Material':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mão de Obra':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Equipamento':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Terceirizado':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Top Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Insumos</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</p>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Materiais</p>
              <p className="text-xl font-extrabold text-blue-900 mt-0.5">{countMaterial}</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Mão de Obra</p>
              <p className="text-xl font-extrabold text-amber-900 mt-0.5">{countMaoObra}</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Equipamentos</p>
              <p className="text-xl font-extrabold text-purple-900 mt-0.5">{countEquipamento}</p>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
            <div>
              <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Terceirizados</p>
              <p className="text-xl font-extrabold text-teal-900 mt-0.5">{countTerceirizado}</p>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Controls Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <span>Insumos da Obra: <strong className="text-indigo-900">{activeObra ? activeObra.nome : 'Nenhuma Obra Selecionada'}</strong></span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Exibindo exclusivamente os insumos cadastrados e isolados para este projeto.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo Insumo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Database className="w-4 h-4" />
                <span>Importar Planilha</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Tipo:
              </span>

              {(['Todos', 'Material', 'Mão de Obra', 'Equipamento', 'Terceirizado'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFilterTipo(tipo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
                    filterTipo === tipo
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Pesquisar por código, descrição..."
                className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white font-medium text-slate-700 shadow-xs w-full"
              />
              {filterText && (
                <button
                  onClick={() => setFilterText('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider select-none">
                  <th className="p-3 border-b border-slate-700 w-32">Código</th>
                  <th className="p-3 border-b border-slate-700">Descrição</th>
                  <th className="p-3 text-center border-b border-slate-700 w-36">Tipo</th>
                  <th className="p-3 text-center border-b border-slate-700 w-24">Unid</th>
                  <th className="p-3 text-right border-b border-slate-700 w-36">Preço Unit. (R$)</th>
                  <th className="p-3 text-center border-b border-slate-700 w-28">Ações</th>
                </tr>
              </thead>

              <tbody className="text-xs divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                      Nenhum insumo encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isEditing = editingId === item.id;

                    if (isEditing) {
                      return (
                        <tr key={item.id} className="bg-amber-50/70 border-l-4 border-amber-500">
                          {/* Code */}
                          <td className="p-2 font-mono">
                            <input
                              type="text"
                              value={editForm.id_insumo || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, id_insumo: e.target.value })
                              }
                              className="w-full border border-amber-300 p-1.5 rounded text-xs bg-white font-mono"
                            />
                          </td>

                          {/* Description */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={editForm.descricao || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, descricao: e.target.value })
                              }
                              className="w-full border border-amber-300 p-1.5 rounded text-xs bg-white font-bold text-slate-900"
                            />
                          </td>

                          {/* Type */}
                          <td className="p-2 text-center">
                            <select
                              value={editForm.tipo || 'Material'}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  tipo: e.target.value as TipoInsumo
                                })
                              }
                              className="w-full border border-amber-300 p-1.5 rounded text-xs bg-white font-semibold"
                            >
                              <option value="Material">Material</option>
                              <option value="Mão de Obra">Mão de Obra</option>
                              <option value="Equipamento">Equipamento</option>
                              <option value="Terceirizado">Terceirizado / Serviço</option>
                            </select>
                          </td>

                          {/* Unit */}
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={editForm.unid || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, unid: e.target.value })
                              }
                              className="w-full border border-amber-300 p-1.5 rounded text-xs bg-white uppercase text-center font-bold"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              value={editForm.pr_unit ?? 0}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  pr_unit: Number(e.target.value) || 0
                                })
                              }
                              className="w-full border border-amber-300 p-1.5 rounded text-xs bg-white text-right font-mono font-bold"
                            />
                          </td>

                          {/* Actions */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded text-xs font-bold transition flex items-center gap-1 shadow-xs"
                                title="Salvar Alterações"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded text-xs font-bold transition flex items-center gap-1"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition group">
                        <td className="p-3 font-mono text-slate-500 font-bold">
                          {item.id_insumo || item.id}
                        </td>

                        <td className="p-3 font-bold text-slate-800">
                          {item.descricao}
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(
                              item.tipo
                            )}`}
                          >
                            {item.tipo}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                            {item.unid}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <span className="font-mono font-extrabold text-slate-900 block text-xs">
                            {formatMoney(item.pr_unit)}
                          </span>
                          {item.tipo === 'Mão de Obra' && (
                            (() => {
                              const mochilaMO = activeObra?.mochilasMO?.[item.id || item.id_insumo];
                              const custoMochilaItem = mochilaMO?.custoHoraMochila !== undefined ? mochilaMO.custoHoraMochila : custoHoraMochila;
                              const totalComMochila = mochilaMO?.salarioEncargoMochilaHora !== undefined ? mochilaMO.salarioEncargoMochilaHora : item.pr_unit + custoMochilaItem;

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMochilaInsumoId(item.id);
                                    setShowMochilaModal(true);
                                  }}
                                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold mt-1 transition cursor-pointer border ${
                                    mochilaMO
                                      ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  }`}
                                  title={`Configurar Mochila & Encargos para ${item.descricao} | Mochila: +${formatMoney(custoMochilaItem)}/h | Total c/ Mochila: ${formatMoney(totalComMochila)}/h`}
                                >
                                  <Briefcase className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                                  <span>{mochilaMO ? `🎒 +${formatMoney(custoMochilaItem)}/h` : '🎒 Configurar Mochila'}</span>
                                </button>
                              );
                            })()
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            {item.tipo === 'Mão de Obra' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMochilaInsumoId(item.id);
                                  setShowMochilaModal(true);
                                }}
                                className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition"
                                title="Configurar Mochila & Encargos desta Mão de Obra"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                              title="Editar Insumo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingInsumo(item)}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                              title="Excluir Insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: NOVO INSUMO */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Cadastrar Novo Insumo no Banco</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Código do Insumo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: INS_102030"
                    value={novoCodigo}
                    onChange={(e) => setNovoCodigo(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Tipo de Insumo *
                  </label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as TipoInsumo)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="Material">Material</option>
                    <option value="Mão de Obra">Mão de Obra</option>
                    <option value="Equipamento">Equipamento</option>
                    <option value="Terceirizado">Terceirizado / Serviço</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Descrição Completa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cimento Portland CP II-Z 50kg"
                  value={novoDesc}
                  onChange={(e) => setNovoDesc(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Unidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: sc, kg, h, m3"
                    value={novoUnid}
                    onChange={(e) => setNovoUnid(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-600 uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Preço Unitário Base (R$) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(Number(e.target.value) || 0)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-600 text-right font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingNew}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingNew ? 'Salvando...' : 'Salvar Insumo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {deletingInsumo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excluir Insumo do Banco</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja excluir o insumo{' '}
              <strong className="text-slate-900">"{deletingInsumo.descricao}"</strong> (Código:{' '}
              <span className="font-mono font-bold">{deletingInsumo.id_insumo || deletingInsumo.id}</span>)?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingInsumo(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR INSUMOS (PLANILHA) */}
      <ModalImportarInsumos
        isOpen={showImportModal}
        activeObra={activeObra}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* MODAL: CONFIGURAÇÃO DA MOCHILA DE MÃO DE OBRA */}
      <ModalConfigMochilaMO
        isOpen={showMochilaModal}
        activeObra={activeObra}
        bancoInsumos={bancoInsumos}
        initialInsumoId={selectedMochilaInsumoId}
        onClose={() => {
          setShowMochilaModal(false);
          setSelectedMochilaInsumoId(null);
        }}
        onSaved={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
