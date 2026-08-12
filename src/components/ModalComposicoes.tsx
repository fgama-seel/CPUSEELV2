import React from 'react';
import { Network, X, ArrowRight } from 'lucide-react';
import { CPU } from '../types';
import { formatMoney } from '../lib/excelExport';

interface ModalComposicoesProps {
  isOpen: boolean;
  insumoId: string;
  insumoNome: string;
  cpus: CPU[];
  onClose: () => void;
  onNavigateToCpu: (cpuId: string) => void;
}

export const ModalComposicoes: React.FC<ModalComposicoesProps> = ({
  isOpen,
  insumoId,
  insumoNome,
  cpus,
  onClose,
  onNavigateToCpu
}) => {
  if (!isOpen) return null;

  // Find all CPUs containing this insumo
  const usageList: {
    cpuId: string;
    cpuCode: string;
    cpuNome: string;
    cpuUnid: string;
    coef: number;
    insUnid: string;
    prUnit: number;
    custoNaCpu: number;
  }[] = [];

  cpus.forEach((cpu) => {
    if (cpu.insumos) {
      const match = cpu.insumos.find(
        (i) => i.id_insumo === insumoId || i.descricao.toLowerCase() === insumoNome.toLowerCase()
      );
      if (match) {
        const coef = Number(match.coef) || 0;
        const prUnit = Number(match.pr_unit) || 0;
        usageList.push({
          cpuId: cpu.id,
          cpuCode: cpu.code,
          cpuNome: cpu.nome,
          cpuUnid: cpu.unidade,
          coef,
          insUnid: match.unid,
          prUnit,
          custoNaCpu: coef * prUnit
        });
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-purple-200 bg-purple-950 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-purple-200">
              <Network className="w-5 h-5 text-purple-400" />
              <span>Rastreabilidade de Insumo em Composições</span>
            </h3>
            <p className="text-xs text-purple-300 font-medium mt-0.5">
              Insumo: [{insumoId}] {insumoNome}
            </p>
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 custom-scroll">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase sticky top-0 shadow-sm border-b border-slate-200">
              <tr>
                <th className="p-3">ID CPU</th>
                <th className="p-3">Nome da CPU / Serviço</th>
                <th className="p-3 text-center">Unid. CPU</th>
                <th className="p-3 text-right">Coeficiente</th>
                <th className="p-3 text-center">Unid. Ins.</th>
                <th className="p-3 text-right">Custo na CPU (R$)</th>
                <th className="p-3 text-center">Ação</th>
              </tr>
            </thead>

            <tbody className="text-xs divide-y divide-slate-100">
              {usageList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Este insumo não está associado a nenhuma composição ativa.
                  </td>
                </tr>
              ) : (
                usageList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-500">{item.cpuCode}</td>
                    <td className="p-3 font-bold text-slate-800">{item.cpuNome}</td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {item.cpuUnid}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {item.coef.toLocaleString('pt-BR', {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4
                      })}
                    </td>
                    <td className="p-3 text-center text-slate-500">{item.insUnid}</td>
                    <td className="p-3 text-right font-bold text-amber-900">
                      {formatMoney(item.custoNaCpu)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToCpu(item.cpuId);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded text-[11px] font-bold transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>Ver CPU</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-xs font-bold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
