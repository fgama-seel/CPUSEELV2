import React, { useState } from 'react';
import { PlusCircle, X, Layers } from 'lucide-react';
import { CPU, Obra } from '../types';

interface ModalNovaCPUProps {
  isOpen: boolean;
  activeObra: Obra | null;
  onClose: () => void;
  onCreateCPU: (cpuData: Omit<CPU, 'id'>) => Promise<void>;
}

export const ModalNovaCPU: React.FC<ModalNovaCPUProps> = ({
  isOpen,
  activeObra,
  onClose,
  onCreateCPU
}) => {
  const [code, setCode] = useState('');
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('M2');
  const [prodTeorica, setProdTeorica] = useState<number>(1);
  const [praticabilidade, setPraticabilidade] = useState<number>(1);
  const [horasDia, setHorasDia] = useState<number>(8.8);
  const [quantidade, setQuantidade] = useState<number>(100);
  const [precoVenda, setPrecoVenda] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !activeObra) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nome.trim()) return;

    setIsSubmitting(true);
    const pt = Number(prodTeorica) || 1;
    const prat = Number(praticabilidade) || 1;
    const hd = Number(horasDia) || 8.8;
    const pEfetiva = hd > 0 ? (pt * prat) / hd : 1;

    const newCpuData: Omit<CPU, 'id'> = {
      code: code.trim(),
      obraId: activeObra.id,
      nome: nome.trim(),
      unidade: unidade.trim() || 'M2',
      prod_teorica: pt,
      praticabilidade: prat,
      horas_dia: hd,
      prod_efetiva: pEfetiva,
      quantidade_prevista: Number(quantidade) || 1,
      preco_venda: Number(precoVenda) || 0,
      fator_fcd: 1.0,
      insumos: [],
      comentarios: []
    };

    await onCreateCPU(newCpuData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Criar Nova CPU - {activeObra.nome}</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ID / Código *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 05020102"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome do Serviço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: PINTURA LÁTEX PVA TRÊS DEMÃOS"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Unidade</label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="M2, M3, UN, KG"
                className="w-full border border-slate-300 p-2 rounded-lg text-xs font-bold uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Qtd Prevista</label>
              <input
                type="number"
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs text-right font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Preço Venda Unt (R$)
              </label>
              <input
                type="number"
                step="any"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs text-right font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-2">
              Produtividade Inicial (Opcional)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Teórica (PT) /dia</label>
                <input
                  type="number"
                  step="any"
                  value={prodTeorica}
                  onChange={(e) => setProdTeorica(Number(e.target.value) || 1)}
                  className="w-full border border-slate-300 p-1.5 rounded text-xs text-right"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Praticabilidade</label>
                <input
                  type="number"
                  step="any"
                  value={praticabilidade}
                  onChange={(e) => setPraticabilidade(Number(e.target.value) || 1)}
                  className="w-full border border-slate-300 p-1.5 rounded text-xs text-right"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Horas / Dia (HD)</label>
                <input
                  type="number"
                  step="any"
                  value={horasDia}
                  onChange={(e) => setHorasDia(Number(e.target.value) || 8.8)}
                  className="w-full border border-slate-300 p-1.5 rounded text-xs text-right"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Criando...' : 'Criar CPU'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
