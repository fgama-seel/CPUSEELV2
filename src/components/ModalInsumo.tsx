import React, { useState, useEffect, useRef } from 'react';
import { Box, X, CloudUpload, PlusCircle, Database, Search, Filter, Plus } from 'lucide-react';
import { InsumoBase, Insumo, TipoInsumo } from '../types';
import { formatMoney } from '../lib/excelExport';

interface ModalInsumoProps {
  isOpen: boolean;
  bancoInsumos: InsumoBase[];
  onClose: () => void;
  onAddInsumoToCpu: (insumo: Insumo) => void;
  onCadastrarNovoInsumo: (novoBase: Omit<InsumoBase, 'id'>) => Promise<InsumoBase>;
  onOpenImportModal?: () => void;
}

function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const ModalInsumo: React.FC<ModalInsumoProps> = ({
  isOpen,
  bancoInsumos,
  onClose,
  onAddInsumoToCpu,
  onCadastrarNovoInsumo,
  onOpenImportModal
}) => {
  const [activeTab, setActiveTab] = useState<'buscar' | 'cadastrar'>('buscar');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoInsumo>('Todos');
  const [busca, setBusca] = useState('');
  
  // New Insumo form state
  const [novoTipo, setNovoTipo] = useState<TipoInsumo>('Material');
  const [novoDesc, setNovoDesc] = useState('');
  const [novoUnid, setNovoUnid] = useState('');
  const [novoPreco, setNovoPreco] = useState<number>(0);
  const [isCadastrando, setIsCadastrando] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBusca('');
      setFiltroTipo('Todos');
      setActiveTab('buscar');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter logic
  const insumosFiltrados = bancoInsumos.filter((item) => {
    if (filtroTipo !== 'Todos' && item.tipo !== filtroTipo) {
      return false;
    }
    if (!busca.trim()) return true;
    const termNorm = normalizeText(busca);
    const descNorm = normalizeText(item.descricao);
    const codNorm = normalizeText(item.id_insumo || item.id || '');
    return descNorm.includes(termNorm) || codNorm.includes(termNorm);
  });

  const countTodos = bancoInsumos.length;
  const countMaterial = bancoInsumos.filter((i) => i.tipo === 'Material').length;
  const countMaoObra = bancoInsumos.filter((i) => i.tipo === 'Mão de Obra').length;
  const countEquipamento = bancoInsumos.filter((i) => i.tipo === 'Equipamento').length;

  const handleSelectAndInsert = (base: InsumoBase) => {
    const insumo: Insumo = {
      id_insumo: base.id_insumo || base.id,
      tipo: base.tipo,
      descricao: base.descricao,
      unid: base.unid,
      coef: 1.0,
      pr_unit: base.pr_unit
    };
    onAddInsumoToCpu(insumo);
    onClose();
  };

  const handleCadastrarENoinserir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoDesc.trim() || !novoUnid.trim()) return;

    setIsCadastrando(true);
    const idInsumo = `INS_${Date.now()}`;
    const novoBase = await onCadastrarNovoInsumo({
      id_insumo: idInsumo,
      tipo: novoTipo,
      descricao: novoDesc.trim(),
      unid: novoUnid.trim(),
      pr_unit: Number(novoPreco) || 0
    });

    const insumo: Insumo = {
      id_insumo: novoBase.id_insumo,
      tipo: novoBase.tipo,
      descricao: novoBase.descricao,
      unid: novoBase.unid,
      coef: 1.0,
      pr_unit: novoBase.pr_unit
    };

    onAddInsumoToCpu(insumo);
    setIsCadastrando(false);
    onClose();
  };

  const handleSwitchToNovoComDesc = () => {
    setNovoDesc(busca);
    setActiveTab('cadastrar');
  };

  const getTipoBadgeStyle = (tipo: TipoInsumo) => {
    switch (tipo) {
      case 'Material':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Mão de Obra':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Equipamento':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600/30 rounded-lg border border-indigo-400/30">
              <Box className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Adicionar Insumo à CPU</h3>
              <p className="text-[11px] text-slate-400">Selecione da base cadastrada ou cadastre um novo item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Import Button */}
        <div className="bg-slate-100 px-5 pt-3 pb-0 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('buscar')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-t border-x flex items-center gap-2 ${
                activeTab === 'buscar'
                  ? 'bg-white text-indigo-900 border-slate-200 shadow-sm'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buscar na Base ({countTodos})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cadastrar')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-t border-x flex items-center gap-2 ${
                activeTab === 'cadastrar'
                  ? 'bg-white text-indigo-900 border-slate-200 shadow-sm'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cadastrar Novo Insumo</span>
            </button>
          </div>

          {onOpenImportModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenImportModal();
              }}
              className="text-purple-700 hover:text-purple-900 text-xs font-bold flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition mb-2"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Importar Lote</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scroll flex-1">
          {activeTab === 'buscar' ? (
            <div className="space-y-4">
              {/* Type Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Filtrar:
                </span>

                <button
                  type="button"
                  onClick={() => setFiltroTipo('Todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                    filtroTipo === 'Todos'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Todos</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    filtroTipo === 'Todos' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countTodos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroTipo('Material')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                    filtroTipo === 'Material'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Material</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    filtroTipo === 'Material' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countMaterial}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroTipo('Mão de Obra')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                    filtroTipo === 'Mão de Obra'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Mão de Obra</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    filtroTipo === 'Mão de Obra' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countMaoObra}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroTipo('Equipamento')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 border ${
                    filtroTipo === 'Equipamento'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>Equipamento</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    filtroTipo === 'Equipamento' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {countEquipamento}
                  </span>
                </button>
              </div>

              {/* Real-time Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome, palavra-chave ou código para pesquisar..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm placeholder:text-slate-400"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results List */}
              <div className="space-y-1.5 max-h-[55vh] min-h-[280px] overflow-y-auto custom-scroll pr-1">
                {insumosFiltrados.length > 0 ? (
                  insumosFiltrados.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAndInsert(item)}
                      className="group flex items-center justify-between p-3 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getTipoBadgeStyle(item.tipo)}`}>
                          {item.tipo}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 truncate">
                            {item.descricao}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>Cód: <strong className="text-slate-600 font-mono">{item.id_insumo || item.id}</strong></span>
                            <span>•</span>
                            <span>Unid: <strong className="text-slate-600 uppercase">{item.unid}</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-slate-900 block font-mono">
                            {formatMoney(item.pr_unit)}
                          </span>
                          <span className="text-[10px] text-slate-400">/ {item.unid}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAndInsert(item);
                          }}
                          className="bg-indigo-600 group-hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Inserir</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
                    <p className="text-xs text-slate-600 font-medium">
                      Nenhum insumo encontrado para <strong className="text-slate-800">"{busca}"</strong>
                      {filtroTipo !== 'Todos' && <span> na categoria <strong>{filtroTipo}</strong></span>}.
                    </p>
                    {busca.trim() && (
                      <button
                        type="button"
                        onClick={handleSwitchToNovoComDesc}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Cadastrar "{busca}" como novo insumo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Register New Insumo Tab */
            <form onSubmit={handleCadastrarENoinserir} className="space-y-4">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3">
                <label className="text-xs font-bold text-indigo-900 block flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Cadastrar e Inserir Novo Insumo na CPU</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipo de Insumo *</label>
                    <select
                      value={novoTipo}
                      onChange={(e) => setNovoTipo(e.target.value as TipoInsumo)}
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white font-medium"
                    >
                      <option value="Material">Material</option>
                      <option value="Mão de Obra">Mão de Obra</option>
                      <option value="Equipamento">Equipamento</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Unidade *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: h, kg, m3, sc, un"
                      value={novoUnid}
                      onChange={(e) => setNovoUnid(e.target.value)}
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white uppercase font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Descrição do Insumo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tinta Acrílica Premium Branca 18L"
                    value={novoDesc}
                    onChange={(e) => setNovoDesc(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white font-medium"
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
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white text-right font-mono font-bold"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('buscar')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition"
                  >
                    Voltar para Busca
                  </button>

                  <button
                    type="submit"
                    disabled={isCadastrando}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>{isCadastrando ? 'Cadastrando...' : 'Cadastrar e Inserir'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

