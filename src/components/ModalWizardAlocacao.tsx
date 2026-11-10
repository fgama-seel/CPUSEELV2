import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Link2,
  Layers,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  Hash,
  ArrowRight
} from 'lucide-react';
import {
  PQItem,
  ScheduleTask,
  AllocationRuleType,
  AllocationRuleParams,
  AllocationLink
} from '../types';

interface ModalWizardAlocacaoProps {
  isOpen: boolean;
  onClose: () => void;
  pqItems: PQItem[];
  tasks: ScheduleTask[];
  existingLinks: AllocationLink[];
  onAddLink: (link: AllocationLink) => void;
  preSelectedPQItem?: PQItem | null;
  preSelectedTask?: ScheduleTask | null;
}

const REGRAS_DESCRICAO: Record<
  AllocationRuleType,
  { label: string; badge: string; desc: string; icon: string; cor: string }
> = {
  DIRECT_1_1: {
    label: '1:1 Integral Direta',
    badge: '1:1',
    desc: 'Aloca 100% da quantidade orçada da PQ diretamente para uma única tarefa executiva (ex: Canteiro, Mobilização, Licenciamento).',
    icon: '🎯',
    cor: 'border-blue-500 bg-blue-50/50 text-blue-700'
  },
  TASK_QUANTITY_LOOKUP: {
    label: 'Espelho da Quantidade da Tarefa',
    badge: 'QTD_TAREFA',
    desc: 'Puxa a quantidade física própria da atividade no cronograma executivo (ex: metros perfurados na frente específica).',
    icon: '🔍',
    cor: 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
  },
  PROPORTIONAL_TO_TASK_QTY: {
    label: 'Rateio Proporcional à Qtd Física',
    badge: 'PROPORCIONAL_QTD',
    desc: 'Distribui a quantidade total da PQ proporcionalmente entre várias tarefas executivas usando o peso físico de cada uma.',
    icon: '⚖️',
    cor: 'border-purple-500 bg-purple-50/50 text-purple-700'
  },
  PROPORTIONAL_TO_DURATION: {
    label: 'Rateio Proporcional à Duração (Dias)',
    badge: 'PROPORCIONAL_DIAS',
    desc: 'Distribui a quantidade da PQ proporcionalmente à duração em dias úteis das tarefas no cronograma (ex: Apoio técnico, supervisão).',
    icon: '⏱️',
    cor: 'border-amber-500 bg-amber-50/50 text-amber-700'
  },
  UNIFORM_SPLIT: {
    label: 'Divisão Igualitária (1 / N)',
    badge: '1 / N',
    desc: 'Divide a quantidade orçada igualmente entre N tarefas selecionadas (ex: 50% Bloco A e 50% Bloco B).',
    icon: '➗',
    cor: 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
  },
  CROSS_ITEM_FACTOR: {
    label: 'Fator Técnico Cruzado (Dependência)',
    badge: 'FATOR_CRUZADO',
    desc: 'Calcula a quantidade multiplicando a produção de outro item da mesma tarefa por um fator técnico (ex: 0.08 m³ de argamassa por m² de hidrojato).',
    icon: '🔗',
    cor: 'border-rose-500 bg-rose-50/50 text-rose-700'
  },
  MANUAL: {
    label: 'Manual (Valor Fixo)',
    badge: 'MANUAL',
    desc: 'Define uma quantidade fixa específica arbitrada pelo engenheiro de planejamento.',
    icon: '✏️',
    cor: 'border-slate-500 bg-slate-50/50 text-slate-700'
  }
};

export const ModalWizardAlocacao: React.FC<ModalWizardAlocacaoProps> = ({
  isOpen,
  onClose,
  pqItems,
  tasks,
  existingLinks,
  onAddLink,
  preSelectedPQItem,
  preSelectedTask
}) => {
  const [selectedPQId, setSelectedPQId] = useState<string>(preSelectedPQItem?.id || '');
  const [selectedTaskId, setSelectedTaskId] = useState<number>(preSelectedTask?.uniqueId || 0);
  const [rule, setRule] = useState<AllocationRuleType>('DIRECT_1_1');
  const [technicalFactor, setTechnicalFactor] = useState<number>(0.08);
  const [sourceItemId, setSourceItemId] = useState<string>('');
  const [groupTaskIds, setGroupTaskIds] = useState<number[]>([]);
  const [manualQty, setManualQty] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');

  // Atualiza seleções iniciais quando modal abre
  React.useEffect(() => {
    if (preSelectedPQItem) {
      setSelectedPQId(preSelectedPQItem.id);
    } else if (pqItems.length > 0 && !selectedPQId) {
      setSelectedPQId(pqItems[0].id);
    }

    if (preSelectedTask) {
      setSelectedTaskId(preSelectedTask.uniqueId);
      setGroupTaskIds([preSelectedTask.uniqueId]);
    } else if (tasks.length > 0 && !selectedTaskId) {
      const execTask = tasks.find((t) => t.outlineLevel === 8) || tasks[0];
      setSelectedTaskId(execTask.uniqueId);
      setGroupTaskIds([execTask.uniqueId]);
    }
  }, [isOpen, preSelectedPQItem, preSelectedTask, pqItems, tasks]);

  const selectedPQ = useMemo(() => {
    return pqItems.find((p) => p.id === selectedPQId);
  }, [pqItems, selectedPQId]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.uniqueId === selectedTaskId);
  }, [tasks, selectedTaskId]);

  // Calcula quanto já foi alocado deste item
  const jaAlocado = useMemo(() => {
    if (!selectedPQId) return 0;
    return existingLinks
      .filter((l) => l.pqItemId === selectedPQId)
      .reduce((sum, l) => sum + (l.calculatedQuantity || 0), 0);
  }, [existingLinks, selectedPQId]);

  const saldoPendente = useMemo(() => {
    if (!selectedPQ) return 0;
    return selectedPQ.quantidadeOrcada - jaAlocado;
  }, [selectedPQ, jaAlocado]);

  // Preview do cálculo
  const previewQuantity = useMemo(() => {
    if (!selectedPQ || !selectedTask) return 0;

    switch (rule) {
      case 'DIRECT_1_1':
        return saldoPendente > 0 ? saldoPendente : selectedPQ.quantidadeOrcada;

      case 'TASK_QUANTITY_LOOKUP':
        return selectedTask.physicalQuantity || 0;

      case 'PROPORTIONAL_TO_TASK_QTY': {
        const groupTasks = tasks.filter((t) => groupTaskIds.includes(t.uniqueId));
        const somaGrupo = groupTasks.reduce((sum, t) => sum + (t.physicalQuantity || 0), 0);
        if (somaGrupo === 0) return 0;
        return (selectedTask.physicalQuantity / somaGrupo) * selectedPQ.quantidadeOrcada;
      }

      case 'PROPORTIONAL_TO_DURATION': {
        const groupTasks = tasks.filter((t) => groupTaskIds.includes(t.uniqueId));
        const somaDias = groupTasks.reduce((sum, t) => sum + (t.workingDaysDuration || 1), 0);
        if (somaDias === 0) return 0;
        return (selectedTask.workingDaysDuration / somaDias) * selectedPQ.quantidadeOrcada;
      }

      case 'UNIFORM_SPLIT': {
        const count = groupTaskIds.length > 0 ? groupTaskIds.length : 1;
        return selectedPQ.quantidadeOrcada / count;
      }

      case 'CROSS_ITEM_FACTOR': {
        // Encontra alocação do item fonte na mesma tarefa
        const sourceLink = existingLinks.find(
          (l) => l.taskUniqueId === selectedTask.uniqueId && l.pqItemId === sourceItemId
        );
        const baseQty = sourceLink ? sourceLink.calculatedQuantity : selectedTask.physicalQuantity;
        return baseQty * (technicalFactor || 1);
      }

      case 'MANUAL':
        return manualQty;

      default:
        return 0;
    }
  }, [
    rule,
    selectedPQ,
    selectedTask,
    saldoPendente,
    groupTaskIds,
    tasks,
    sourceItemId,
    technicalFactor,
    existingLinks,
    manualQty
  ]);

  const previewCusto = useMemo(() => {
    if (!selectedPQ) return 0;
    return previewQuantity * selectedPQ.precoUnitarioCustoDireto;
  }, [previewQuantity, selectedPQ]);

  const previewReceita = useMemo(() => {
    if (!selectedPQ) return 0;
    return previewQuantity * selectedPQ.precoUnitarioVenda;
  }, [previewQuantity, selectedPQ]);

  const handleToggleGroupTask = (taskId: number) => {
    setGroupTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSalvar = () => {
    if (!selectedPQ || !selectedTask) return;

    const nextSeq =
      existingLinks.length > 0 ? Math.max(...existingLinks.map((l) => l.seq)) + 1 : 1;

    const params: AllocationRuleParams = {};
    if (['PROPORTIONAL_TO_TASK_QTY', 'PROPORTIONAL_TO_DURATION', 'UNIFORM_SPLIT'].includes(rule)) {
      params.groupTaskIds = groupTaskIds.length > 0 ? groupTaskIds : [selectedTask.uniqueId];
    }
    if (rule === 'CROSS_ITEM_FACTOR') {
      params.sourceSeqOrItemId = sourceItemId;
      params.technicalFactor = technicalFactor;
    }
    if (rule === 'MANUAL') {
      params.manualQuantity = manualQty;
    }

    const newLink: AllocationLink = {
      seq: nextSeq,
      pqItemId: selectedPQ.id,
      taskUniqueId: selectedTask.uniqueId,
      allocationRule: rule,
      ruleParams: params,
      calculatedQuantity: Number(previewQuantity.toFixed(4)),
      totalCostAllocated: Number(previewCusto.toFixed(2)),
      totalRevenueAllocated: Number(previewReceita.toFixed(2)),
      observacoes: observacoes.trim() || undefined
    };

    onAddLink(newLink);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Assistente de Alocação Matriz PQ vs. Cronograma
              </h3>
              <p className="text-xs text-slate-300">
                Vincule itens de medição comercial (BoQ) a tarefas executivas do MS Project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* PASSO 1: Selecionar Item da PQ & Tarefa do Cronograma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ITEM DA PQ */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                1. Item Comercial da PQ (BoQ)
              </label>
              <select
                value={selectedPQId}
                onChange={(e) => setSelectedPQId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {pqItems.map((p, idx) => (
                  <option key={`${p.id}-${idx}`} value={p.id}>
                    {p.id} - {p.descricao} ({p.quantidadeOrcada} {p.unidade})
                  </option>
                ))}
              </select>

              {selectedPQ && (
                <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Lote:</span>
                    <span className="font-semibold text-slate-900">{selectedPQ.lote}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Grupo:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[200px]" title={selectedPQ.grupo}>
                      {selectedPQ.grupo}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Quantidade Orçada:</span>
                    <span className="font-bold text-blue-700">
                      {selectedPQ.quantidadeOrcada.toLocaleString('pt-BR')} {selectedPQ.unidade}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Já Alocado em Tarefas:</span>
                    <span className="font-medium text-slate-700">
                      {jaAlocado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}{' '}
                      {selectedPQ.unidade}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Saldo a Alocar:</span>
                    <span
                      className={`font-black ${
                        saldoPendente === 0
                          ? 'text-emerald-600'
                          : saldoPendente < 0
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {saldoPendente.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}{' '}
                      {selectedPQ.unidade}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* TAREFA DO CRONOGRAMA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                2. Tarefa do Cronograma (MS Project)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedTaskId(val);
                  setGroupTaskIds([val]);
                }}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {tasks
                  .filter((t) => !t.isSummary && t.outlineLevel >= 7)
                  .map((t) => (
                    <option key={t.uniqueId} value={t.uniqueId}>
                      Id {t.uniqueId} | Nv.{t.outlineLevel} | {t.name}
                    </option>
                  ))}
              </select>

              {selectedTask && (
                <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>EDT (WBS):</span>
                    <span className="font-mono text-slate-800">{selectedTask.wbs}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Período Previsto:</span>
                    <span className="font-medium text-slate-800">
                      {selectedTask.startDate} até {selectedTask.finishDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Duração Calculada:</span>
                    <span className="font-bold text-slate-900">
                      {selectedTask.workingDaysDuration} dias úteis
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Qtd Física da Atividade:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedTask.physicalQuantity.toLocaleString('pt-BR')} {selectedTask.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Produtividade / Equipes:</span>
                    <span className="text-slate-700">
                      {selectedTask.dailyProductivityPerTeam} {selectedTask.unit}/dia ({selectedTask.teamsCount} eq.)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PASSO 2: Seleção da Regra de Alocação Matemática */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-600" />
              3. Escolha a Regra de Alocação Matemática
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(REGRAS_DESCRICAO) as AllocationRuleType[]).map((rKey) => {
                const info = REGRAS_DESCRICAO[rKey];
                const isSelected = rule === rKey;
                return (
                  <div
                    key={rKey}
                    onClick={() => setRule(rKey)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${info.cor} shadow-md scale-[1.01]`
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{info.icon}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isSelected ? 'bg-white/80' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {info.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs">{info.label}</div>
                    <p className="text-[11px] mt-1 leading-snug opacity-90">{info.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASSO 3: Parâmetros Específicos da Regra Selecionada */}
          {rule === 'CROSS_ITEM_FACTOR' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <Link2 className="w-4 h-4" />
                Configurar Dependência Técnica Cruzada
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Item Base de Referência (na mesma tarefa)
                  </label>
                  <select
                    value={sourceItemId}
                    onChange={(e) => setSourceItemId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="">-- Puxar da Quantidade Física da Própria Tarefa --</option>
                    {pqItems
                      .filter((p) => p.id !== selectedPQId)
                      .map((p, idx) => (
                        <option key={`${p.id}-${idx}`} value={p.id}>
                          {p.id} - {p.descricao}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fator Técnico Multiplicador (ex: 0.08 m³ / m²)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={technicalFactor}
                    onChange={(e) => setTechnicalFactor(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {['PROPORTIONAL_TO_TASK_QTY', 'PROPORTIONAL_TO_DURATION', 'UNIFORM_SPLIT'].includes(
            rule
          ) && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  Tarefas que Compõem o Grupo de Rateio ({groupTaskIds.length} selecionadas)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allExec = tasks
                      .filter((t) => !t.isSummary && t.outlineLevel >= 7)
                      .map((t) => t.uniqueId);
                    setGroupTaskIds(allExec);
                  }}
                  className="text-[11px] text-purple-700 underline font-semibold hover:text-purple-900"
                >
                  Selecionar todas as tarefas executivas
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto bg-white border border-purple-200 rounded-lg p-2 space-y-1">
                {tasks
                  .filter((t) => !t.isSummary && t.outlineLevel >= 7)
                  .map((t) => {
                    const isChecked = groupTaskIds.includes(t.uniqueId);
                    return (
                      <label
                        key={t.uniqueId}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs ${
                          isChecked ? 'bg-purple-100/60 font-semibold text-purple-950' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleGroupTask(t.uniqueId)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>
                            Id {t.uniqueId} - {t.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {t.physicalQuantity} {t.unit} | {t.workingDaysDuration}d
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {rule === 'MANUAL' && (
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade Fixa Arbitrada
              </label>
              <input
                type="number"
                step="0.01"
                value={manualQty}
                onChange={(e) => setManualQty(parseFloat(e.target.value) || 0)}
                className="w-full sm:w-64 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg p-2"
                placeholder="Informe a quantidade..."
              />
            </div>
          )}

          {/* Observações Opcionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Observações / Justificativa Técnica do Vínculo
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Alocação proporcional ao volume estimado do trecho norte..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
            />
          </div>

          {/* CARD DE PREVIEW EM TEMPO REAL */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-4 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Memória de Cálculo Gerada (Resultado da Alocação)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-[11px] text-blue-200">Quantidade Alocada</div>
                <div className="text-xl font-black text-emerald-300 mt-1">
                  {previewQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}{' '}
                  <span className="text-xs font-normal text-white">{selectedPQ?.unidade}</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-[11px] text-blue-200">Custo Direto Alocado</div>
                <div className="text-xl font-black text-white mt-1">
                  R$ {previewCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-[11px] text-blue-200">Faturamento Previsto</div>
                <div className="text-xl font-black text-amber-300 mt-1">
                  R$ {previewReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-blue-200/90 flex items-center justify-between">
              <span>
                Recurso formatado p/ MS Project:{' '}
                <strong className="text-white font-mono">
                  {selectedPQ?.id}[{previewQuantity.toFixed(2)} {selectedPQ?.unidade}]
                </strong>
              </span>
              <span>
                Novo Saldo da PQ:{' '}
                <strong
                  className={
                    saldoPendente - previewQuantity < 0 ? 'text-rose-300' : 'text-emerald-300'
                  }
                >
                  {(saldoPendente - previewQuantity).toLocaleString('pt-BR', {
                    maximumFractionDigits: 2
                  })}{' '}
                  {selectedPQ?.unidade}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={!selectedPQ || !selectedTask || previewQuantity <= 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Vincular na Matriz PQ
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
