import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';
import { Obra } from '../types';

interface ModalExcluirObraProps {
  obra: Obra | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (obraId: string) => Promise<void>;
}

export const ModalExcluirObra: React.FC<ModalExcluirObraProps> = ({
  obra,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [typedName, setTypedName] = useState('');
  const [understoodCheckbox, setUnderstoodCheckbox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !obra) return null;

  const targetName = obra.nome.trim();
  const isNameMatching = typedName.trim().toLowerCase() === targetName.toLowerCase();

  const handleClose = () => {
    if (isDeleting) return;
    setStep(1);
    setTypedName('');
    setUnderstoodCheckbox(false);
    setErrorMessage(null);
    onClose();
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameMatching) return;
    setStep(2);
  };

  const handleFinalDelete = async () => {
    if (!isNameMatching || !understoodCheckbox || isDeleting) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await onConfirmDelete(obra.id);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao tentar excluir a obra no Firestore.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border-4 border-red-600 overflow-hidden my-8">
        
        {/* BANNER DE ALERTA EXTREMO */}
        <div className="bg-red-600 text-white p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-700/80 rounded-xl border border-red-400/40 shadow-inner shrink-0 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-red-800 text-red-100 px-2.5 py-0.5 rounded-full border border-red-500/50 block w-fit mb-1">
                Ação Crítica Irreversível • Super Admin
              </span>
              <h3 className="text-xl font-black tracking-tight leading-tight">
                Exclusão Definitiva de Obra
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-red-700/50 transition shrink-0"
            title="Cancelar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-6 space-y-5">
          
          {/* DETALHES DA OBRA A SER DESTRUÍDA */}
          <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                  Projeto Selecionado para Exclusão:
                </span>
                <h4 className="text-base font-extrabold text-red-950 leading-tight">
                  {obra.nome}
                </h4>
              </div>
              <span className="bg-red-200/80 text-red-900 text-xs font-mono font-bold px-2.5 py-1 rounded-md shrink-0 border border-red-300">
                Código: {obra.codigo}
              </span>
            </div>

            <p className="text-xs text-red-800 leading-relaxed font-medium pt-1 border-t border-red-200/60">
              <strong>ATENÇÃO:</strong> Esta operação removerá permanentemente do Firestore:
            </p>
            <ul className="text-xs text-red-900 space-y-1 list-disc list-inside font-medium pl-1">
              <li>O cadastro e os parâmetros financeiros/impostos do contrato da obra;</li>
              <li>Todas as CPUs (Composições de Preços Unitários) vinculadas;</li>
              <li>Todos os insumos cadastrados no Banco de Insumos desta obra.</li>
            </ul>
          </div>

          {/* INDICADOR DE ETAPAS (DUPLA CONFIRMAÇÃO) */}
          <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl border border-slate-200">
            <div
              className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                step === 1
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">1</span>
              <span>Digite o Nome</span>
              {step === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
            </div>

            <div className="px-2 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div
              className={`flex-1 text-center py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                step === 2
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">2</span>
              <span>Confirmação Final</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ETAPA 1: DIGITAÇÃO MANUAL DO NOME */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1ª Confirmação: Digite o nome exato do projeto para continuar
                </label>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 text-xs font-mono font-bold select-all flex justify-between items-center">
                  <span>{obra.nome}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">Cópia do nome</span>
                </div>

                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Cole ou digite exatamente o nome da obra aqui..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition ${
                    isNameMatching
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 focus:ring-2 focus:ring-emerald-500/20'
                      : typedName.length > 0
                      ? 'border-red-400 bg-red-50/30 text-red-950 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                  }`}
                  autoFocus
                />

                {isNameMatching ? (
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Nome verificado! Clique abaixo para ir à confirmação final.</span>
                  </div>
                ) : typedName.length > 0 ? (
                  <div className="text-[11px] font-bold text-red-600 flex items-center gap-1.5 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>O nome digitado não corresponde exatamente ao nome da obra.</span>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!isNameMatching}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center gap-2 ${
                    isNameMatching
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>Avançar para Etapa 2 de 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ETAPA 2: CONFIRMAÇÃO DUPLA DEFINITIVA */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-red-100/70 border border-red-300 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-red-950 font-extrabold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>2ª Confirmação Final: Autorização de Exclusão</span>
                </div>
                <p className="text-xs text-red-900 leading-relaxed font-medium">
                  Esta é a sua última oportunidade de cancelar. Ao clicar em confirmar, a obra <strong>"{obra.nome}"</strong> e todas as suas CPUs e insumos associados serão apagados permanentemente do Firestore.
                </p>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={understoodCheckbox}
                    onChange={(e) => setUnderstoodCheckbox(e.target.value ? e.target.checked : false)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 border-red-300 shrink-0"
                  />
                  <span className="text-xs font-extrabold text-red-950">
                    Estou ciente e confirmo que desejo excluir esta obra e todos os seus dados do banco de dados definitivamente.
                  </span>
                </label>
              </div>

              <div className="flex justify-between items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Voltar para Etapa 1
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalDelete}
                    disabled={!understoodCheckbox || isDeleting}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition flex items-center gap-2 ${
                      understoodCheckbox && !isDeleting
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/40 animate-pulse cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Excluindo Obra do Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>CONFIRMAR E EXCLUIR OBRA AGORA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
