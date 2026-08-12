import React, { useState } from 'react';
import {
  HardHat,
  PieChart,
  Table,
  Boxes,
  Users,
  PlusCircle,
  Search,
  Building,
  ChevronDown,
  Layers,
  X
} from 'lucide-react';
import { Obra, CPU } from '../types';

interface SidebarProps {
  obras: Obra[];
  activeObra: Obra | null;
  cpus: CPU[];
  activeCpu: CPU | null;
  activeTab: 'resumo' | 'tabela' | 'abc' | 'acessos' | 'dashboard';
  userEmail: string;
  isAdmin: boolean;
  isOpenMobile: boolean;
  onSelectObra: (obraId: string) => void;
  onSelectCpu: (cpuId: string) => void;
  onSelectTab: (tab: 'resumo' | 'tabela' | 'abc' | 'acessos' | 'dashboard') => void;
  onOpenModalNovaObra: () => void;
  onOpenModalNovaCPU: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  obras,
  activeObra,
  cpus,
  activeCpu,
  activeTab,
  userEmail,
  isAdmin,
  isOpenMobile,
  onSelectObra,
  onSelectCpu,
  onSelectTab,
  onOpenModalNovaObra,
  onOpenModalNovaCPU,
  onCloseMobile
}) => {
  const [cpuSearch, setCpuSearch] = useState('');
  const [showObraSelector, setShowObraSelector] = useState(false);

  const filteredCpus = cpus.filter(
    (c) =>
      c.code.toLowerCase().includes(cpuSearch.toLowerCase()) ||
      c.nome.toLowerCase().includes(cpuSearch.toLowerCase()) ||
      c.unidade.toLowerCase().includes(cpuSearch.toLowerCase())
  );

  const userInitials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : 'SE';

  return (
    <aside
      className={`bg-slate-900 text-white w-72 flex-shrink-0 fixed md:relative z-30 h-full transition-transform duration-300 flex flex-col border-r border-slate-800 shadow-xl ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardHat className="w-5 h-5 text-blue-400" />
            <span>SISTEMA CPU</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            SEEL Engenharia
          </p>
        </div>
        <button
          onClick={onCloseMobile}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* SELETOR DE OBRA */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1 flex justify-between items-center">
          <span>Obra Selecionada</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
            {obras.length} {obras.length === 1 ? 'Obra' : 'Obras'}
          </span>
        </label>

        <div className="relative">
          <button
            onClick={() => setShowObraSelector(!showObraSelector)}
            className="w-full bg-slate-800 hover:bg-slate-750 text-white p-2.5 rounded-lg border border-slate-700/80 text-left flex justify-between items-center shadow-sm transition"
          >
            <div className="flex items-center gap-2 truncate">
              <Building className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-bold truncate">
                {activeObra ? activeObra.nome : 'Selecione uma Obra...'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
          </button>

          {/* Obra Dropdown Menu */}
          {showObraSelector && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
              {obras.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onSelectObra(o.id);
                    setShowObraSelector(false);
                  }}
                  className={`w-full text-left p-2.5 text-xs font-medium border-b border-slate-700/50 hover:bg-slate-700 transition flex items-center justify-between gap-2 ${
                    activeObra?.id === o.id
                      ? 'bg-slate-700 text-blue-400 font-bold'
                      : 'text-slate-200'
                  }`}
                >
                  <span className="truncate">{o.nome}</span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                    {o.codigo}
                  </span>
                </button>
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
      <div className="p-4 border-b border-slate-800 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Navegação
        </div>

        <button
          onClick={() => {
            onSelectTab('resumo');
            onCloseMobile();
          }}
          className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-3 transition ${
            activeTab === 'resumo'
              ? 'bg-slate-800 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <PieChart className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Resumo do Contrato</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('tabela');
            onCloseMobile();
          }}
          className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-3 transition ${
            activeTab === 'tabela'
              ? 'bg-slate-800 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
          <Table className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Tabela de CPUs</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('abc');
            onCloseMobile();
          }}
          className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-3 transition ${
            activeTab === 'abc'
              ? 'bg-slate-800 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
          <Boxes className="w-4 h-4 text-purple-400 shrink-0" />
          <span>ABC de Insumos</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => {
              onSelectTab('acessos');
              onCloseMobile();
            }}
            className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-3 transition ${
              activeTab === 'acessos'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Gestão de Acessos</span>
          </button>
        )}
      </div>

      {/* COMPOSIÇÕES (CPUs) DA OBRA */}
      <div className="p-3 pb-2 flex justify-between items-center">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>CPUs da Obra ({filteredCpus.length})</span>
        </div>

        <button
          onClick={onOpenModalNovaCPU}
          className="text-blue-400 hover:text-blue-300 text-xs font-bold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 transition flex items-center gap-1 border border-slate-700"
          title="Cadastrar Nova CPU nesta Obra"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Novo</span>
        </button>
      </div>

      {/* CPU Search Filter */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={cpuSearch}
            onChange={(e) => setCpuSearch(e.target.value)}
            placeholder="Buscar CPU..."
            className="w-full bg-slate-800/80 text-white pl-8 pr-3 py-1.5 rounded text-xs border border-slate-700 focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* CPU ITEMS LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
        {filteredCpus.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-xs italic px-4">
            {cpuSearch ? 'Nenhuma CPU encontrada.' : 'Nenhuma CPU cadastrada.'}
          </div>
        ) : (
          filteredCpus.map((cpu) => {
            const isSelected = activeTab === 'dashboard' && activeCpu?.id === cpu.id;
            return (
              <button
                key={cpu.id}
                onClick={() => {
                  onSelectCpu(cpu.id);
                  onCloseMobile();
                }}
                className={`w-full text-left p-2.5 rounded text-xs transition border ${
                  isSelected
                    ? 'bg-blue-900/40 border-blue-500/60 text-white font-bold'
                    : 'bg-transparent border-transparent hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div
                  className={`text-[10px] font-mono mb-0.5 ${
                    isSelected ? 'text-blue-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  {cpu.code}
                </div>
                <div className="text-xs leading-snug line-clamp-2">{cpu.nome}</div>
              </button>
            );
          })
        )}
      </div>

      {/* USER FOOTER */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{userEmail}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {isAdmin ? 'Administrador' : 'Engenheiro'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
