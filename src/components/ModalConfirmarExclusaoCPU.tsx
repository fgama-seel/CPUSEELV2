import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { CPU } from '../types';

interface ModalConfirmarExclusaoCPUProps {
  isOpen: boolean;
  cpu: CPU | null;
  onClose: () => void;
  onConfirmDelete: (cpuId: string) => Promise<void>;
}

export const ModalConfirmarExclusaoCPU: React.FC<ModalConfirmarExclusaoCPUProps> = ({
  isOpen,
  cpu,
  onClose,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !cpu) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(cpu.id);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir CPU:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-700/60 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Confirmar Exclusão de CPU</h3>
              <p className="text-xs text-red-100">Ação permanente e irreversível</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Tem certeza de que deseja excluir permanentemente a composição abaixo do orçamento?
          </p>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded text-xs">
                {cpu.code}
              </span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                Unid: {cpu.unidade}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mt-1">{cpu.nome}</h4>
            <p className="text-[11px] text-slate-500">
              Possui {cpu.insumos?.length || 0} insumos atrelados.
            </p>
          </div>

          <p className="text-[11px] text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
            ⚠️ Atenção: Ao confirmar, esta composição e seus dados serão removidos do banco de dados e dos relatórios da obra.
          </p>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir CPU'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
