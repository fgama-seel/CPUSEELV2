import React, { useState } from 'react';
import { Box, X, Check, CloudUpload, PlusCircle, Database } from 'lucide-react';
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

export const ModalInsumo: React.FC<ModalInsumoProps> = ({
  isOpen,
  bancoInsumos,
  onClose,
  onAddInsumoToCpu,
  onCadastrarNovoInsumo,
  onOpenImportModal
}) => {
  const [selectedBaseId, setSelectedBaseId] = useState('');
  
  // New Insumo form state
  const [novoTipo, setNovoTipo] = useState<TipoInsumo>('Material');
  const [novoDesc, setNovoDesc] = useState('');
  const [novoUnid, setNovoUnid] = useState('');
  const [novoPreco, setNovoPreco] = useState<number>(0);
  const [isCadastrando, setIsCadastrando] = useState(false);

  if (!isOpen) return null;

  const handleInsertExistente = () => {
    if (!selectedBaseId) return;
    const base = bancoInsumos.find((i) => i.id_insumo === selectedBaseId || i.id === selectedBaseId);
    if (base) {
      const insumo: Insumo = {
        id_insumo: base.id_insumo,
        tipo: base.tipo,
        descricao: base.descricao,
        unid: base.unid,
        coef: 1.0,
        pr_unit: base.pr_unit
      };
      onAddInsumoToCpu(insumo);
      onClose();
    }
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

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Adicionar Insumo à CPU</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 custom-scroll">
          {/* Section 1: Select from Database */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 block">
                1. Selecionar Insumo da Base Cadastrada ({bancoInsumos.length} itens)
              </label>
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImportModal();
                  }}
                  className="text-purple-700 hover:text-purple-900 text-[11px] font-bold flex items-center gap-1 hover:underline"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Importar Insumos em Lote</span>
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedBaseId}
                onChange={(e) => setSelectedBaseId(e.target.value)}
                className="flex-1 border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">Selecione um insumo da base...</option>
                {bancoInsumos.map((ins) => (
                  <option key={ins.id} value={ins.id_insumo || ins.id}>
                    [{ins.tipo}] {ins.descricao} - {formatMoney(ins.pr_unit)} / {ins.unid}
                  </option>
                ))}
              </select>

              <button
                onClick={handleInsertExistente}
                disabled={!selectedBaseId}
                className="bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1 shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Inserir</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="mx-3 text-slate-400 text-xs font-bold uppercase">OU</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Section 2: Register & Insert New Insumo */}
          <form
            onSubmit={handleCadastrarENoinserir}
            className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3"
          >
            <label className="text-xs font-bold text-indigo-900 block flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>2. Cadastrar e Inserir Novo Insumo</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipo</label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as TipoInsumo)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="Material">Material</option>
                  <option value="Mão de Obra">Mão de Obra</option>
                  <option value="Equipamento">Equipamento</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Unidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: h, kg, m3, sc"
                  value={novoUnid}
                  onChange={(e) => setNovoUnid(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white uppercase font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Tinta Acrílica Premium Branca 18L"
                value={novoDesc}
                onChange={(e) => setNovoDesc(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Preço Unitário Base (R$)
              </label>
              <input
                type="number"
                step="any"
                required
                value={novoPreco}
                onChange={(e) => setNovoPreco(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 bg-white text-right font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isCadastrando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isCadastrando ? 'Cadastrando...' : 'Cadastrar e Inserir na CPU'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
