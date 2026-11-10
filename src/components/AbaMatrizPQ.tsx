import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  Table,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Trash2,
  Split,
  ChevronDown,
  Filter,
  X,
  Sliders,
  Settings,
  Edit2,
  Save,
  Package,
  ArrowRight
} from 'lucide-react';
import { Obra, PQItem, ScheduleTask, AllocationLink, RecursoProjectConfig, CPU } from '../types';
import { calculateAllocations, auditPQSaldos, splitPQItem40_60 } from '../lib/allocationEngine';
import {
  SEEL_SABESP_PQ_ITEMS,
  SEEL_SABESP_SCHEDULE_TASKS,
  SEEL_SABESP_ALLOCATIONS
} from '../lib/seelSabespDataset';
import { ModalWizardAlocacao } from './ModalWizardAlocacao';

interface AbaMatrizPQProps {
  activeObra: Obra | null;
  cpus?: CPU[];
  tasks: ScheduleTask[];
  onUpdateTasks?: (tasks: ScheduleTask[]) => void;
  pqItems: PQItem[];
  onUpdatePqItems: (items: PQItem[]) => void;
  allocationLinks: AllocationLink[];
  onUpdateAllocationLinks: (links: AllocationLink[]) => void;
  recursosConfig: RecursoProjectConfig[];
  onUpdateRecursosConfig: (recursos: RecursoProjectConfig[]) => void;
}

export const AbaMatrizPQ: React.FC<AbaMatrizPQProps> = ({
  activeObra,
  cpus = [],
  tasks,
  pqItems,
  onUpdatePqItems,
  allocationLinks,
  onUpdateAllocationLinks,
  recursosConfig,
  onUpdateRecursosConfig
}) => {
  const [subAbaAtiva, setSubAbaAtiva] = useState<'servicos' | 'recursos_project'>('servicos');
  const [searchService, setSearchService] = useState('');
  const [searchRecurso, setSearchRecurso] = useState('');
  const [selectedPQFilter, setSelectedPQFilter] = useState<string>('TODOS');
  const [showPqAuditoria, setShowPqAuditoria] = useState(false);

  // Edição inline de Recurso Project
  const [editingRecursoId, setEditingRecursoId] = useState<string | null>(null);
  const [editNomeRecurso, setEditNomeRecurso] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editUnidade, setEditUnidade] = useState('');
  const [editCustoCpu, setEditCustoCpu] = useState<number>(0);
  const [editVendaCpu, setEditVendaCpu] = useState<number>(0);

  // Modal Novo Recurso
  const [isNovoRecursoOpen, setIsNovoRecursoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoUnidade, setNovoUnidade] = useState('M');
  const [novoCusto, setNovoCusto] = useState<number>(0);
  const [novoVenda, setNovoVenda] = useState<number>(0);

  // Modal Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardPreTask, setWizardPreTask] = useState<ScheduleTask | null>(null);
  const [wizardPrePQ, setWizardPrePQ] = useState<PQItem | null>(null);

  // Filtra APENAS linhas de serviço (tarefas executivas, sem cabeçalhos/resumo)
  const serviceTasks = useMemo(() => {
    return tasks.filter((t) => !t.isSummary && t.outlineLevel >= 8);
  }, [tasks]);

  // Recálculo dinâmico dos vínculos e auditoria
  const calculatedLinks = useMemo(() => {
    return calculateAllocations(pqItems, tasks, allocationLinks, recursosConfig);
  }, [pqItems, tasks, allocationLinks, recursosConfig]);

  const auditSaldos = useMemo(() => {
    return auditPQSaldos(pqItems, calculatedLinks);
  }, [pqItems, calculatedLinks]);

  // Indexa alocações por tarefa para acesso instantâneo no grid
  const linksByTaskMap = useMemo(() => {
    const map = new Map<number, AllocationLink[]>();
    calculatedLinks.forEach((l) => {
      if (!map.has(l.taskUniqueId)) {
        map.set(l.taskUniqueId, []);
      }
      map.get(l.taskUniqueId)!.push(l);
    });
    return map;
  }, [calculatedLinks]);

  // Filtra as linhas de serviços de acordo com a busca e item da PQ
  const filteredServiceTasks = useMemo(() => {
    return serviceTasks.filter((task) => {
      const matchSearch =
        task.name.toLowerCase().includes(searchService.toLowerCase()) ||
        task.wbs.toLowerCase().includes(searchService.toLowerCase()) ||
        String(task.uniqueId).includes(searchService);

      if (!matchSearch) return false;

      if (selectedPQFilter !== 'TODOS') {
        const taskLinks = linksByTaskMap.get(task.uniqueId) || [];
        return taskLinks.some((l) => l.pqItemId === selectedPQFilter);
      }

      return true;
    });
  }, [serviceTasks, searchService, selectedPQFilter, linksByTaskMap]);

  // Recursos filtrados na aba de configuração
  const filteredRecursos = useMemo(() => {
    return recursosConfig.filter((r) => {
      return (
        r.nomeRecurso.toLowerCase().includes(searchRecurso.toLowerCase()) ||
        r.descricaoRecurso.toLowerCase().includes(searchRecurso.toLowerCase()) ||
        r.unidadeMaterial.toLowerCase().includes(searchRecurso.toLowerCase())
      );
    });
  }, [recursosConfig, searchRecurso]);

  // Métricas de topo
  const totalOrcadoVenda = useMemo(() => {
    return pqItems.reduce((acc, item) => acc + item.quantidadeOrcada * item.precoUnitarioVenda, 0);
  }, [pqItems]);

  const totalAlocadoVenda = useMemo(() => {
    return calculatedLinks.reduce((acc, l) => acc + (l.totalRevenueAllocated || 0), 0);
  }, [calculatedLinks]);

  const percentualAlocado = totalOrcadoVenda > 0 ? (totalAlocadoVenda / totalOrcadoVenda) * 100 : 0;

  // Restaurar dados originais da engenharia reversa SEEL (opcional)
  const handleRestaurarPadrao = () => {
    if (
      window.confirm(
        'Deseja carregar a base de exemplo da metodologia SEEL / SABESP nesta obra (27 itens PQ, vínculos e alocações)?'
      )
    ) {
      onUpdatePqItems(SEEL_SABESP_PQ_ITEMS);
      onUpdateAllocationLinks(SEEL_SABESP_ALLOCATIONS);

      // Gera os recursos padrão correspondentes
      const recursosIniciais: RecursoProjectConfig[] = SEEL_SABESP_PQ_ITEMS.map((item) => ({
        id: item.id,
        obraId: activeObra?.id || '',
        nomeRecurso: item.codigoRecursoProject || item.id,
        descricaoRecurso: item.descricao,
        unidadeMaterial: item.unidade,
        tipo: 'Material',
        custoCpu: item.precoUnitarioCustoDireto,
        vendaCpu: item.precoUnitarioVenda,
        pqItemId: item.id
      }));
      onUpdateRecursosConfig(recursosIniciais);
    }
  };

  // Limpar todos os dados para teste real do zero
  const handleLimparDados = () => {
    if (
      window.confirm(
        `Tem certeza de que deseja zerar todos os dados desta obra (${activeObra?.nome}) para iniciar com dados 100% reais?`
      )
    ) {
      onUpdatePqItems([]);
      onUpdateAllocationLinks([]);
      onUpdateRecursosConfig([]);
    }
  };

  // Sincronizar Recursos com as CPUs cadastradas na Obra
  const handleSincronizarComCpus = () => {
    if (cpus.length === 0 && pqItems.length === 0) {
      alert('Nenhuma CPU ou item da PQ cadastrado nesta obra para sincronizar.');
      return;
    }

    // Mapa unificado indexado pelo ID do recurso para garantir 100% de unicidade
    const mapa = new Map<string, RecursoProjectConfig>();
    recursosConfig.forEach((r) => {
      if (r && r.id) {
        mapa.set(r.id, { ...r });
      }
    });

    // 1. Sincroniza a partir das CPUs
    cpus.forEach((cpu) => {
      const idKey = String(cpu.code || cpu.id || '').trim();
      if (!idKey) return;

      let custoUnit = 0;
      if (cpu.insumos) {
        cpu.insumos.forEach((ins) => {
          custoUnit += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
        });
      }
      const bdi = activeObra?.bdi ?? 25;
      const vendaUnit = cpu.vendaDefinida ? Number(cpu.preco_venda) || 0 : custoUnit * (1 + bdi / 100);

      const existing = mapa.get(idKey);
      if (existing) {
        // Atualiza valores mantendo personalizações do usuário
        mapa.set(idKey, {
          ...existing,
          descricaoRecurso: cpu.nome || existing.descricaoRecurso,
          unidadeMaterial: cpu.unidade || existing.unidadeMaterial || 'un',
          custoCpu: Math.round(custoUnit * 100) / 100,
          vendaCpu: Math.round(vendaUnit * 100) / 100,
          cpuId: cpu.id
        });
      } else {
        mapa.set(idKey, {
          id: idKey,
          obraId: activeObra?.id || '',
          nomeRecurso: cpu.code || idKey,
          descricaoRecurso: cpu.nome,
          unidadeMaterial: cpu.unidade || 'un',
          tipo: 'Material',
          custoCpu: Math.round(custoUnit * 100) / 100,
          vendaCpu: Math.round(vendaUnit * 100) / 100,
          cpuId: cpu.id
        });
      }
    });

    // 2. Sincroniza a partir dos itens da PQ (sem duplicar se já foi inserido pela CPU)
    pqItems.forEach((pq) => {
      const idKey = String(pq.id || '').trim();
      if (!idKey) return;

      if (!mapa.has(idKey)) {
        mapa.set(idKey, {
          id: idKey,
          obraId: activeObra?.id || '',
          nomeRecurso: pq.codigoRecursoProject || pq.id,
          descricaoRecurso: pq.descricao,
          unidadeMaterial: pq.unidade,
          tipo: 'Material',
          custoCpu: pq.precoUnitarioCustoDireto,
          vendaCpu: pq.precoUnitarioVenda,
          pqItemId: pq.id
        });
      }
    });

    const novos = Array.from(mapa.values());
    onUpdateRecursosConfig(novos);
    alert(`Sincronização concluída! ${novos.length} recursos disponíveis para o Project.`);
  };

  // Salvar edição de um recurso
  const handleSaveRecursoEdit = (recursoId: string) => {
    const updated = recursosConfig.map((r) => {
      if (r.id === recursoId) {
        return {
          ...r,
          nomeRecurso: editNomeRecurso.trim() || r.nomeRecurso,
          descricaoRecurso: editDescricao.trim() || r.descricaoRecurso,
          unidadeMaterial: editUnidade.trim() || r.unidadeMaterial,
          custoCpu: editCustoCpu,
          vendaCpu: editVendaCpu
        };
      }
      return r;
    });

    onUpdateRecursosConfig(updated);
    setEditingRecursoId(null);
  };

  // Criar novo recurso manualmente
  const handleCreateNovoRecurso = () => {
    if (!novoNome.trim() || !novoDescricao.trim()) {
      alert('Preencha ao menos o Nome e a Descrição do recurso.');
      return;
    }

    const novo: RecursoProjectConfig = {
      id: `rec-${Date.now()}`,
      obraId: activeObra?.id || '',
      nomeRecurso: novoNome.trim(),
      descricaoRecurso: novoDescricao.trim(),
      unidadeMaterial: novoUnidade.trim() || 'un',
      tipo: 'Material',
      custoCpu: novoCusto,
      vendaCpu: novoVenda
    };

    onUpdateRecursosConfig([...recursosConfig, novo]);
    setIsNovoRecursoOpen(false);
    setNovoNome('');
    setNovoDescricao('');
    setNovoUnidade('M');
    setNovoCusto(0);
    setNovoVenda(0);
  };

  // Excluir recurso
  const handleDeleteRecurso = (recursoId: string) => {
    if (window.confirm('Excluir este recurso da configuração do Project?')) {
      onUpdateRecursosConfig(recursosConfig.filter((r) => r.id !== recursoId));
    }
  };

  // Desmembrar 40/60
  const handleSplitItem = (pqId: string) => {
    const parent = pqItems.find((p) => p.id === pqId);
    if (!parent) return;

    if (
      window.confirm(
        `Desmembrar item "${parent.id} - ${parent.descricao}" em Fornecimento (40%) e Aplicação (60%)?`
      )
    ) {
      const splitResult = splitPQItem40_60(parent, 0.4, 0.6);
      const nextPq = [...pqItems];
      const idx = nextPq.findIndex((p) => p.id === pqId);
      nextPq.splice(idx, 1, splitResult.parent, splitResult.subItem1, splitResult.subItem2);
      onUpdatePqItems(nextPq);
    }
  };

  // Excluir vínculo específico
  const handleDeleteLink = (seq: number) => {
    if (window.confirm(`Excluir alocação SEQ #${seq}?`)) {
      onUpdateAllocationLinks(allocationLinks.filter((l) => l.seq !== seq));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* HEADER PRINCIPAL */}
      <div className="bg-slate-900 border-b border-slate-800 text-white p-4 shrink-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Matriz de Alocação & Recursos Project
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  {activeObra?.nome || 'Obra Selecionada'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Distribuição das quantidades da PQ em linhas de serviço e configuração da tabela de recursos do MS Project
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPqAuditoria(!showPqAuditoria)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                showPqAuditoria
                  ? 'bg-blue-600 text-white border-blue-500 shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              {showPqAuditoria ? 'Ocultar Saldos PQ' : 'Ver Saldos da PQ'}
            </button>

            <button
              onClick={handleSincronizarComCpus}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Sincroniza descrição, custo e venda das CPUs desta obra com a tabela de Recursos"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Sincronizar c/ CPUs da Obra
            </button>

            <button
              onClick={handleLimparDados}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-100 rounded-lg text-xs font-semibold border border-slate-700 hover:border-rose-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Limpa dados para iniciar teste 100% real"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Zerar Dados (Teste Real)
            </button>

            {pqItems.length === 0 && (
              <button
                onClick={handleRestaurarPadrao}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Carregar exemplo SEEL apenas para demonstração"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Carregar Exemplo SEEL
              </button>
            )}

            {subAbaAtiva === 'servicos' && (
              <button
                onClick={() => {
                  setWizardPreTask(null);
                  setWizardPrePQ(null);
                  setIsWizardOpen(true);
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Alocação
              </button>
            )}

            {subAbaAtiva === 'recursos_project' && (
              <button
                onClick={() => setIsNovoRecursoOpen(true)}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Recurso Project
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE AS DUAS SUB-ABAS */}
        <div className="flex border-b border-slate-800 mt-4 -mb-4 overflow-x-auto space-x-1">
          <button
            onClick={() => setSubAbaAtiva('servicos')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              subAbaAtiva === 'servicos'
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            1. Alocação: Linhas de Serviço vs. Recursos ({serviceTasks.length} Serviços)
          </button>

          <button
            onClick={() => setSubAbaAtiva('recursos_project')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              subAbaAtiva === 'recursos_project'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            2. Configuração dos Recursos Project ({recursosConfig.length} Recursos Cadastrados)
          </button>
        </div>
      </div>

      {/* PAINEL COLAPSÁVEL DE SALDOS DA PQ */}
      {showPqAuditoria && (
        <div className="bg-white border-b border-slate-200 p-4 shadow-inner max-h-72 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-600" />
              Inventário Comercial da PQ (Controle de Saldos Orçados vs Alocados)
            </h4>
            <span className="text-[11px] text-slate-500">
              Itens desmembrados (Split 40/60) mantêm 100% da quantidade física em cada subitem
            </span>
          </div>

          {pqItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Nenhum item da PQ cadastrado para esta obra.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {pqItems.map((item, idx) => {
                const audit = auditSaldos.get(item.id);
                const saldo = audit?.saldoQuantidade || 0;
                const isSplit = item.isSplitParent;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`p-2.5 rounded-lg border ${
                      isSplit ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-700">{item.id}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{item.lote}</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] truncate mt-0.5" title={item.descricao}>
                      {item.descricao}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="text-slate-600">
                        Orçado: <strong>{item.quantidadeOrcada} {item.unidade}</strong>
                      </span>
                      <span className="text-slate-600">
                        Alocado: <strong>{audit?.quantidadeAlocada.toFixed(2) || '0'} {item.unidade}</strong>
                      </span>
                      <span
                        className={`font-bold ${
                          saldo === 0 ? 'text-emerald-600' : saldo < 0 ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      >
                        Saldo: {saldo.toFixed(2)}
                      </span>
                    </div>
                    {!isSplit && (
                      <div className="mt-2 pt-1 flex justify-end">
                        <button
                          onClick={() => handleSplitItem(item.id)}
                          className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Split className="w-3 h-3" />
                          Desmembrar 40/60
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO SUB-ABA 1: ALOCAÇÃO EM LINHAS DE SERVIÇO */}
      {subAbaAtiva === 'servicos' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* BARRA DE FILTRO */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar serviço por nome, EDT ou ID Exclusiva..."
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Filtrar por Recurso:</span>
              <select
                value={selectedPQFilter}
                onChange={(e) => setSelectedPQFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 outline-none max-w-[260px] truncate"
              >
                <option value="TODOS">Todos os Serviços</option>
                {recursosConfig.map((r, idx) => (
                  <option key={`${r.id}-${idx}`} value={r.id}>
                    {r.nomeRecurso} - {r.descricaoRecurso}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GRID DE SERVIÇOS OU ESTADO VAZIO */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {serviceTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto my-8 space-y-3">
                <GitMerge className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Nenhuma linha de serviço carregada para esta obra ({activeObra?.nome})
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Acesse a aba <strong>Cronograma Executivo</strong> e faça o upload do seu cronograma
                  em <strong>.xml</strong> ou <strong>.csv</strong> para que todas as linhas de serviço
                  apareçam aqui prontas para distribuição.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-16 text-center">Id Excl.</th>
                        <th className="p-3 w-28">EDT (WBS)</th>
                        <th className="p-3">Linha de Serviço do Cronograma</th>
                        <th className="p-3 text-right">Qtd da Atividade</th>
                        <th className="p-3 text-center">Duração (DU)</th>
                        <th className="p-3">Recursos Alocados nesta Tarefa</th>
                        <th className="p-3 text-right">Custo Direto Total</th>
                        <th className="p-3 text-right">Faturamento Total</th>
                        <th className="p-3 text-center w-28">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredServiceTasks.map((task) => {
                        const taskLinks = linksByTaskMap.get(task.uniqueId) || [];
                        const custoTotalTarefa = taskLinks.reduce((acc, l) => acc + (l.totalCostAllocated || 0), 0);
                        const vendaTotalTarefa = taskLinks.reduce((acc, l) => acc + (l.totalRevenueAllocated || 0), 0);

                        return (
                          <tr key={task.uniqueId} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-center font-mono font-bold text-slate-700">
                              {task.uniqueId}
                            </td>
                            <td className="p-3 font-mono text-slate-600">{task.wbs}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{task.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {task.startDate} a {task.finishDate} ({task.dailyProductivityPerTeam} {task.unit}/dia)
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-800">
                              {task.physicalQuantity.toLocaleString('pt-BR')} {task.unit}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-700">
                              {task.workingDaysDuration}d
                            </td>
                            <td className="p-3">
                              {taskLinks.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">
                                  Sem recursos alocados
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-w-md">
                                  {taskLinks.map((link) => {
                                    const rec = recursosConfig.find((r) => r.id === link.pqItemId || r.pqItemId === link.pqItemId);
                                    const nomeBadge = rec?.nomeRecurso || link.pqItemId;
                                    const unidBadge = rec?.unidadeMaterial || 'un';

                                    return (
                                      <div
                                        key={link.seq}
                                        className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-50 border border-cyan-200 text-cyan-900 shadow-xs"
                                      >
                                        <span className="font-bold">{nomeBadge}:</span>
                                        <span>
                                          {link.calculatedQuantity.toFixed(2)} {unidBadge}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteLink(link.seq)}
                                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition ml-0.5"
                                          title="Remover alocação deste recurso"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-800">
                              R$ {custoTotalTarefa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-cyan-900">
                              R$ {vendaTotalTarefa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setWizardPreTask(task);
                                  setWizardPrePQ(null);
                                  setIsWizardOpen(true);
                                }}
                                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs flex items-center gap-1 mx-auto cursor-pointer"
                                title="Distribuir recurso nesta linha de serviço"
                              >
                                <Plus className="w-3 h-3" />
                                Alocar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO SUB-ABA 2: CONFIGURAÇÃO DOS RECURSOS PROJECT */}
      {subAbaAtiva === 'recursos_project' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* BARRA DE FILTRO E INFORMAÇÃO */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por Nome do Recurso ou Descrição..."
                value={searchRecurso}
                onChange={(e) => setSearchRecurso(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-[11px] text-slate-500">
              Estes campos alimentam o formato <strong>Nome_do_Recurso[Qtd Unidade]</strong> para o Project e baseiam as projeções de Custo e Faturamento.
            </div>
          </div>

          {/* TABELA DE RECURSOS DO PROJECT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3 w-40">Nome do Recurso</th>
                      <th className="p-3">Descrição do Recurso</th>
                      <th className="p-3 w-28 text-center">Unidade do Material</th>
                      <th className="p-3 w-24 text-center">Tipo</th>
                      <th className="p-3 w-36 text-right">Custo CPU (Taxa Padrão)</th>
                      <th className="p-3 w-36 text-right">Venda CPU (Custo)</th>
                      <th className="p-3 w-24 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredRecursos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                          Nenhum recurso configurado para o Project nesta obra. Clique em{' '}
                          <strong>"Sincronizar c/ CPUs da Obra"</strong> no topo para puxar as composições existentes, ou em{' '}
                          <strong>"Novo Recurso Project"</strong> para criar manualmente.
                        </td>
                      </tr>
                    ) : (
                      filteredRecursos.map((rec, idx) => {
                        const isEditing = editingRecursoId === rec.id;

                        return (
                          <tr key={`${rec.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                            {/* NOME DO RECURSO (Definido pelo usuário) */}
                            <td className="p-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editNomeRecurso}
                                  onChange={(e) => setEditNomeRecurso(e.target.value)}
                                  className="w-full bg-white border border-emerald-500 rounded p-1 font-bold text-slate-900"
                                />
                              ) : (
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block text-center truncate">
                                  {rec.nomeRecurso}
                                </span>
                              )}
                            </td>

                            {/* DESCRIÇÃO DO RECURSO (Nome completo da PQ / CPU) */}
                            <td className="p-3 font-sans">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editDescricao}
                                  onChange={(e) => setEditDescricao(e.target.value)}
                                  className="w-full bg-white border border-emerald-500 rounded p-1 font-medium text-slate-800"
                                />
                              ) : (
                                <div className="font-semibold text-slate-800">{rec.descricaoRecurso}</div>
                              )}
                            </td>

                            {/* UNIDADE DO MATERIAL */}
                            <td className="p-3 text-center">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editUnidade}
                                  onChange={(e) => setEditUnidade(e.target.value)}
                                  className="w-20 text-center bg-white border border-emerald-500 rounded p-1 font-bold"
                                />
                              ) : (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                  {rec.unidadeMaterial}
                                </span>
                              )}
                            </td>

                            {/* TIPO (Fixo Material) */}
                            <td className="p-3 text-center font-sans font-semibold text-slate-500">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">
                                Material
                              </span>
                            </td>

                            {/* CUSTO CPU (Taxa Padrão) */}
                            <td className="p-3 text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editCustoCpu}
                                  onChange={(e) => setEditCustoCpu(parseFloat(e.target.value) || 0)}
                                  className="w-28 text-right bg-white border border-emerald-500 rounded p-1 font-bold"
                                />
                              ) : (
                                <span className="text-slate-800 font-bold">
                                  R$ {rec.custoCpu.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </td>

                            {/* VENDA CPU (Custo) */}
                            <td className="p-3 text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editVendaCpu}
                                  onChange={(e) => setEditVendaCpu(parseFloat(e.target.value) || 0)}
                                  className="w-28 text-right bg-white border border-emerald-500 rounded p-1 font-bold text-emerald-800"
                                />
                              ) : (
                                <span className="text-emerald-800 font-black">
                                  R$ {rec.vendaCpu.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </td>

                            {/* AÇÕES */}
                            <td className="p-3 text-center">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveRecursoEdit(rec.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Salvar alterações"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRecursoId(rec.id);
                                      setEditNomeRecurso(rec.nomeRecurso);
                                      setEditDescricao(rec.descricaoRecurso);
                                      setEditUnidade(rec.unidadeMaterial);
                                      setEditCustoCpu(rec.custoCpu);
                                      setEditVendaCpu(rec.vendaCpu);
                                    }}
                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Editar recurso"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecurso(rec.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title="Excluir recurso"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO RECURSO PROJECT */}
      {isNovoRecursoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                Cadastrar Novo Recurso Project
              </h3>
              <button
                onClick={() => setIsNovoRecursoOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Recurso (Código ou número na string do MS Project)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 3010103"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição Completa do Recurso (Item da PQ / CPU)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Perfuração em Rocha para Injeção"
                  value={novoDescricao}
                  onChange={(e) => setNovoDescricao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade do Material</label>
                  <input
                    type="text"
                    placeholder="M, KG, M3, un, MES"
                    value={novoUnidade}
                    onChange={(e) => setNovoUnidade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo</label>
                  <input
                    type="text"
                    disabled
                    value="Material"
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Custo CPU (Taxa Padrão)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={novoCusto}
                    onChange={(e) => setNovoCusto(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Venda CPU (Custo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={novoVenda}
                    onChange={(e) => setNovoVenda(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNovoRecursoOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNovoRecurso}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
              >
                Salvar Recurso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO WIZARD RÁPIDO */}
      <ModalWizardAlocacao
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setWizardPreTask(null);
          setWizardPrePQ(null);
        }}
        pqItems={pqItems}
        tasks={tasks}
        existingLinks={calculatedLinks}
        preSelectedPQItem={wizardPrePQ}
        preSelectedTask={wizardPreTask}
        onAddLink={(newLink) => {
          onUpdateAllocationLinks([...allocationLinks, newLink]);
        }}
      />
    </div>
  );
};
