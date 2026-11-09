import React, { useState } from 'react';
import {
  HardHat,
  PieChart,
  Table,
  Boxes,
  Users,
  PlusCircle,
  Building,
  ChevronDown,
  X,
  Package,
  Database,
  Trash2,
  Menu,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  BarChart3,
  CalendarRange,
  Layers,
  Sparkles
} from 'lucide-react';
import { Obra, CPU } from '../types';

export type TabKey =
  | 'resumo'
  | 'tabela'
  | 'indiretos'
  | 'relatorios'
  | 'abc'
  | 'insumos'
  | 'acessos'
  | 'firestore'
  | 'dashboard';

interface SidebarProps {
  obras: Obra[];
  activeObra: Obra | null;
  cpus: CPU[];
  activeCpu: CPU | null;
  activeTab: TabKey;
  userEmail: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  isOpenMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectObra: (obraId: string) => void;
  onSelectCpu: (cpuId: string) => void;
  onSelectTab: (tab: TabKey) => void;
  onOpenModalNovaObra: () => void;
  onOpenModalNovaCPU: () => void;
  onOpenModalImportarBD?: () => void;
  onCloseMobile: () => void;
  onOpenModalExcluirObra?: (obra: Obra) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  obras,
  activeObra,
  cpus,
  activeCpu,
  activeTab,
  userEmail,
  isAdmin,
  isSuperAdmin,
  isOpenMobile,
  isCollapsed,
  onToggleCollapse,
  onSelectObra,
  onSelectCpu,
  onSelectTab,
  onOpenModalNovaObra,
  onOpenModalNovaCPU,
  onOpenModalImportarBD,
  onCloseMobile,
  onOpenModalExcluirObra
}) => {
  const [showObraSelector, setShowObraSelector] = useState(false);

  const userInitials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : 'SE';

  const navItems: { key: TabKey; label: string; icon: React.ElementType; color: string; dotColor: string }[] = [
    { key: 'resumo', label: 'Resumo do Contrato', icon: PieChart, color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
    { key: 'tabela', label: 'Tabela de CPUs', icon: Table, color: 'text-blue-400', dotColor: 'bg-blue-400' },
    { key: 'indiretos', label: 'Custos Indiretos', icon: Briefcase, color: 'text-amber-400', dotColor: 'bg-amber-400' },
    { key: 'relatorios', label: 'Relatórios & Cronograma', icon: BarChart3, color: 'text-indigo-400', dotColor: 'bg-indigo-400' },
    { key: 'abc', label: 'Curva ABC Insumos', icon: Boxes, color: 'text-purple-400', dotColor: 'bg-purple-400' },
    { key: 'insumos', label: 'Banco de Insumos', icon: Package, color: 'text-teal-400', dotColor: 'bg-teal-400' }
  ];

  return (
    <aside
      className={`bg-slate-900 text-white flex-shrink-0 fixed md:relative z-30 h-full transition-all duration-300 flex flex-col border-r border-slate-800 shadow-xl select-none ${
        isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
      } ${!isOpenMobile && (isCollapsed ? 'md:w-20' : 'md:w-64')}`}
    >
      {/* Sidebar Header with Sandwich / Collapse Button */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="overflow-hidden">
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <HardHat className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="truncate">SISTEMA CPU</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold truncate">
              SEEL Engenharia
            </p>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <HardHat className="w-5 h-5 text-blue-400 shrink-0" />
          </div>
        )}

        {/* Desktop Hamburger / Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition items-center justify-center cursor-pointer"
          title={isCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* SELETOR DE OBRA */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        {!isCollapsed && (
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1 flex justify-between items-center">
            <span>Obra Ativa</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
              {obras.length} {obras.length === 1 ? 'Obra' : 'Obras'}
            </span>
          </label>
        )}

        <div className="relative">
          <button
            onClick={() => setShowObraSelector(!showObraSelector)}
            className={`w-full bg-slate-850 hover:bg-slate-800 text-white rounded-xl border border-slate-700/80 text-left flex items-center shadow-xs transition ${
              isCollapsed ? 'p-2 justify-center' : 'p-2.5 justify-between'
            }`}
            title={activeObra ? `${activeObra.codigo} - ${activeObra.nome}` : 'Selecione uma Obra'}
          >
            <div className="flex items-center gap-2 truncate">
              <Building className="w-4 h-4 text-blue-400 shrink-0" />
              {!isCollapsed && (
                <span className="text-xs font-bold truncate">
                  {activeObra ? activeObra.nome : 'Selecione uma Obra...'}
                </span>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />}
          </button>

          {/* Obra Dropdown Menu */}
          {showObraSelector && (
            <div
              className={`absolute top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto ${
                isCollapsed ? 'left-0 w-64' : 'left-0 right-0'
              }`}
            >
              <div className="p-2 border-b border-slate-700 bg-slate-850 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selecione a Obra
              </div>
              {obras.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between border-b border-slate-700/40 hover:bg-slate-700 transition"
                >
                  <button
                    onClick={() => {
                      onSelectObra(o.id);
                      setShowObraSelector(false);
                    }}
                    className={`flex-1 text-left p-2.5 text-xs font-medium flex items-center justify-between gap-2 ${
                      activeObra?.id === o.id
                        ? 'text-blue-400 font-bold bg-blue-950/30'
                        : 'text-slate-200'
                    }`}
                  >
                    <span className="truncate">{o.nome}</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-mono shrink-0">
                      {o.codigo}
                    </span>
                  </button>

                  {isSuperAdmin && onOpenModalExcluirObra && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowObraSelector(false);
                        onOpenModalExcluirObra(o);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded transition shrink-0 mr-1"
                      title={`Excluir Obra (${o.codigo})`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowObraSelector(false);
                    onOpenModalNovaObra();
                  }}
                  className="w-full text-left p-2.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 transition flex items-center gap-2 border-t border-slate-700"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>+ Cadastrar Nova Obra</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 pt-2 pb-1">
            Módulos do Sistema
          </div>
        )}

        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onSelectTab(item.key);
                onCloseMobile();
              }}
              className={`w-full text-left rounded-xl text-xs font-medium flex items-center transition relative group ${
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
              } ${
                isActive
                  ? 'bg-slate-800 text-white font-bold shadow-xs border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? item.color : 'text-slate-400 group-hover:text-white'}`} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isCollapsed && (
                <span className="absolute left-full ml-2 bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 border border-slate-700">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {isSuperAdmin && (
          <>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 pt-4 pb-1">
                Administração
              </div>
            )}

            <button
              onClick={() => {
                onSelectTab('acessos');
                onCloseMobile();
              }}
              className={`w-full text-left rounded-xl text-xs font-medium flex items-center transition relative group ${
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
              } ${
                activeTab === 'acessos'
                  ? 'bg-slate-800 text-white font-bold shadow-xs border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={isCollapsed ? 'Gestão de Acessos' : undefined}
            >
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Gestão de Acessos</span>}
              {isCollapsed && (
                <span className="absolute left-full ml-2 bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 border border-slate-700">
                  Gestão de Acessos
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectTab('firestore');
                onCloseMobile();
              }}
              className={`w-full text-left rounded-xl text-xs font-medium flex items-center transition relative group ${
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 gap-3'
              } ${
                activeTab === 'firestore'
                  ? 'bg-slate-800 text-white font-bold shadow-xs border border-slate-700/80'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={isCollapsed ? 'Painel Firestore' : undefined}
            >
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Painel Firestore</span>}
              {isCollapsed && (
                <span className="absolute left-full ml-2 bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 border border-slate-700">
                  Painel Firestore
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* AÇÕES RÁPIDAS DA OBRA */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/70 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Ações Rápidas
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {cpus.length} CPUs
            </span>
          </div>
        )}

        {onOpenModalImportarBD && (
          <button
            onClick={onOpenModalImportarBD}
            className={`w-full bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-800/60 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isCollapsed ? 'p-2.5' : 'px-3 py-2'
            }`}
            title="Importar Base de CPUs e Insumos (CSV / Excel)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {!isCollapsed && <span>Importar BD / CSV</span>}
          </button>
        )}

        <button
          onClick={onOpenModalNovaCPU}
          className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
            isCollapsed ? 'p-2.5' : 'px-3 py-2'
          }`}
          title="Cadastrar Nova CPU"
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>+ Nova CPU</span>}
        </button>
      </div>

      {/* USER FOOTER */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center gap-2.5 px-1 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs">
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userEmail}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {isAdmin ? 'Administrador' : 'Engenheiro'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
