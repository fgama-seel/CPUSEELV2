import React, { useState } from 'react';
import { Building, X, PlusCircle } from 'lucide-react';
import { Obra } from '../types';

interface ModalNovaObraProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateObra: (obraData: Omit<Obra, 'id'>) => Promise<void>;
}

export const ModalNovaObra: React.FC<ModalNovaObraProps> = ({
  isOpen,
  onClose,
  onCreateObra
}) => {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [cliente, setCliente] = useState('SEEL Engenharia');
  const [vendaTotal, setVendaTotal] = useState<number>(10000000);
  const [custoIndireto, setCustoIndireto] = useState<number>(1000000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nome.trim()) return;

    setIsSubmitting(true);
    const orcVenda = Number(vendaTotal) || 0;
    const orcCustoIndireto = Number(custoIndireto) || 0;
    const orcCustoDireto = orcVenda * 0.5; // default 50%
    const orcCustoTotal = orcCustoDireto + orcCustoIndireto;
    const pis = orcVenda * 0.03;
    const cofins = orcVenda * 0.0065;
    const iss = orcVenda * 0.03;
    const totalImpostos = pis + cofins + iss;
    const vendaLiquida = orcVenda - totalImpostos;
    const resultado = vendaLiquida - orcCustoTotal;
    const margem = vendaLiquida > 0 ? (resultado / vendaLiquida) * 100 : 0;

    const newObraData: Omit<Obra, 'id'> = {
      codigo: codigo.trim(),
      nome: `Obra ${codigo.trim()} - ${nome.trim()}`,
      cliente: cliente.trim() || 'SEEL Engenharia',
      custoIndiretoAtual: orcCustoIndireto,
      faturamentoDiretoAtual: 0,
      aliquotasImpostos: {
        pisPerc: 3.0,
        cofinsPerc: 0.65,
        issPerc: 3.0
      },
      orcamentoOriginal: {
        vendaTotal: orcVenda,
        fatDireto: 0,
        vendaSemFat: orcVenda,
        custoDireto: orcCustoDireto,
        custoIndireto: orcCustoIndireto,
        custoTotal: orcCustoTotal,
        pis,
        cofins,
        iss,
        pisPerc: 3.0,
        cofinsPerc: 0.65,
        issPerc: 3.0,
        vendaLiquida,
        resultado,
        margem
      }
    };

    await onCreateObra(newObraData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Cadastrar Nova Obra</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Código da Obra *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 968"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cliente / Órgão</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="SEEL / DER"
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nome do Projeto / Serviço *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: BARRAGEM SEEL / PONTE RIO GRANDE"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Venda Orçada Total (R$)
              </label>
              <input
                type="number"
                step="any"
                value={vendaTotal}
                onChange={(e) => setVendaTotal(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-right font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Custo Indireto Previsto (R$)
              </label>
              <input
                type="number"
                step="any"
                value={custoIndireto}
                onChange={(e) => setCustoIndireto(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-right font-bold"
              />
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
              <span>{isSubmitting ? 'Salvando...' : 'Criar Obra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
