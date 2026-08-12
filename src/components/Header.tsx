import React from 'react';
import { HardHat, LogOut, ShieldCheck, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Obra, UserPermission } from '../types';
import { formatMoney } from '../lib/excelExport';

interface HeaderProps {
  activeObra: Obra | null;
  totalCustoObra: number;
  userEmail: string;
  userPermission: UserPermission | null;
  pendingChanges: boolean;
  isSaving: boolean;
  onSavePendingChanges: () => void;
  onLogout: () => void;
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeObra,
  totalCustoObra,
  userEmail,
  userPermission,
  pendingChanges,
  isSaving,
  onSavePendingChanges,
  onLogout,
  onToggleSidebarMobile
}) => {
  const isAdmin = userEmail.toLowerCase() === 'fgama@seel.com.br' || userPermission?.role === 'ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm px-4 md:px-8 flex items-center justify-between z-10 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="md:hidden text-slate-700 hover:bg-slate-100 p-2 rounded-lg"
          title="Menu Lateral"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-xs shadow-sm">
            <HardHat className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeObra ? `Obra ${activeObra.codigo}` : 'Seleção de Obra'}
            </div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 leading-none truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {activeObra ? activeObra.nome : 'Selecione uma Obra'}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {activeObra && (
          <div className="hidden sm:block text-right border-r border-slate-200 pr-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Custo Total CPUs</div>
            <div className="text-base md:text-xl font-black text-blue-600 font-mono leading-none">
              {formatMoney(totalCustoObra)}
            </div>
          </div>
        )}

        {/* Sync / Firebase Persistence Status Indicator */}
        <div className="flex items-center gap-2">
          {pendingChanges ? (
            <button
              onClick={onSavePendingChanges}
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded text-xs font-bold shadow-sm transition flex items-center gap-1.5 animate-pulse"
              title="Salvar alterações pendentes no Firestore"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Salvar no Firestore</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSavePendingChanges}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              title="Sincronizado no Firestore"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Salvar no Firestore</span>
            </button>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
              <span>{userEmail}</span>
              {isAdmin && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Firestore Conectado
            </div>
          </div>

          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
