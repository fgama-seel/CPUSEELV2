import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Upload,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
  Sparkles,
  Info,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Filter,
  History,
  Trash2,
  Clock,
  Plus,
  Minimize2,
  Maximize2,
  FolderOpen
} from 'lucide-react';
import { ScheduleTask, AllocationLink, PQItem, VersaoCronograma, RecursoProjectConfig, Obra } from '../types';
import { generateMsProjectResourceStrings } from '../lib/allocationEngine';
import { parseMsProjectXml, parseScheduleTasksCsv } from '../lib/msprojectXmlParser';
import { SEEL_SABESP_SCHEDULE_TASKS } from '../lib/seelSabespDataset';

interface AbaCronogramaExecutivoProps {
  activeObra: Obra | null;
  tasks: ScheduleTask[];
  onUpdateTasks: (tasks: ScheduleTask[]) => void;
  allocationLinks: AllocationLink[];
  onUpdateAllocationLinks?: (links: AllocationLink[]) => void;
  pqItems: PQItem[];
  recursosConfig?: RecursoProjectConfig[];
  versoes: VersaoCronograma[];
  onUpdateVersoes: (versoes: VersaoCronograma[]) => void;
}

export const AbaCronogramaExecutivo: React.FC<AbaCronogramaExecutivoProps> = ({
  activeObra,
  tasks,
  onUpdateTasks,
  allocationLinks,
  onUpdateAllocationLinks,
  pqItems,
  recursosConfig,
  versoes,
  onUpdateVersoes
}) => {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'SERVICES_ONLY' | 'PACKAGES_ONLY'>('ALL');
  const [maxVisibleLevel, setMaxVisibleLevel] = useState<number>(8); // 1 a 8
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<number>>(new Set());

  // Modal / Feedback States
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showXmlGuide, setShowXmlGuide] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSavingNewVersion, setIsSavingNewVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enriquece tarefas com a string padronizada do MS Project (respeitando nomeRecurso e unidadeMaterial do usuário)
  const tasksWithResources = useMemo(() => {
    return generateMsProjectResourceStrings(tasks, allocationLinks, pqItems, recursosConfig);
  }, [tasks, allocationLinks, pqItems, recursosConfig]);

  // Mapa de filhos por pai para recolher em cascata
  const childrenMap = useMemo(() => {
    const map = new Map<number, number[]>();
    tasksWithResources.forEach((t) => {
      if (t.parentUniqueId !== null && t.parentUniqueId !== undefined) {
        if (!map.has(t.parentUniqueId)) {
          map.set(t.parentUniqueId, []);
        }
        map.get(t.parentUniqueId)!.push(t.uniqueId);
      }
    });
    return map;
  }, [tasksWithResources]);

  // Alterna colapso individual de uma tarefa pai
  const toggleCollapseTask = (taskId: number) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Recolher por nível estrutural
  const handleSetLevelExpansion = (level: number) => {
    setMaxVisibleLevel(level);
    if (level === 8) {
      setCollapsedParentIds(new Set()); // Expande tudo
    } else {
      // Recolhe todas as tarefas de nível >= level que são resumo
      const toCollapse = new Set<number>();
      tasksWithResources.forEach((t) => {
        if (t.outlineLevel >= level && (t.isSummary || (childrenMap.get(t.uniqueId)?.length || 0) > 0)) {
          toCollapse.add(t.uniqueId);
        }
      });
      setCollapsedParentIds(toCollapse);
    }
  };

  // Filtro de tarefas considerando busca, nível e colapso de nós pai
  const filteredTasks = useMemo(() => {
    return tasksWithResources.filter((t) => {
      // 1. Filtro por nível máximo visível
      if (maxVisibleLevel < 8 && t.outlineLevel > maxVisibleLevel) {
        return false;
      }

      // 2. Se algum pai estiver colapsado
      if (t.parentUniqueId && collapsedParentIds.has(t.parentUniqueId)) {
        return false;
      }

      // 3. Filtro textual
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.wbs.toLowerCase().includes(search.toLowerCase()) ||
        String(t.uniqueId).includes(search);

      if (!matchSearch) return false;

      // 4. Filtro por tipo
      if (filterLevel === 'SERVICES_ONLY') return t.outlineLevel >= 8 && !t.isSummary;
      if (filterLevel === 'PACKAGES_ONLY') return t.outlineLevel === 7;

      return true;
    });
  }, [tasksWithResources, search, filterLevel, maxVisibleLevel, collapsedParentIds]);

  // Cópia individual de recurso
  const handleCopyTaskResources = (taskId: number, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2500);
  };

  // Cópia em massa de todas as strings de recursos formatadas
  const handleCopyAllResources = () => {
    const lines = tasksWithResources
      .filter((t) => t.msProjectResourceString || t.rollUpResourceString)
      .map((t) => `ID ${t.uniqueId}\t${t.wbs}\t${t.name}\t${t.msProjectResourceString || t.rollUpResourceString}`);

    if (lines.length === 0) {
      alert('Nenhum recurso alocado encontrado para cópia.');
      return;
    }

    const tsvContent = `Id Exclusiva\tEDT\tNome da Tarefa\tNomes dos Recursos\n` + lines.join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  // Processa arquivo enviado (XML Nativo do Project ou CSV/TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Arquivo vazio');

        let parsedTasks: ScheduleTask[] = [];
        let xmlLinks: AllocationLink[] = [];

        if (fileName.endsWith('.xml')) {
          const result = parseMsProjectXml(text, pqItems);
          parsedTasks = result.tasks;
          xmlLinks = result.allocationLinks;
        } else {
          parsedTasks = parseScheduleTasksCsv(text);
        }

        if (parsedTasks.length === 0) {
          throw new Error('Nenhuma tarefa foi identificada. Verifique se o arquivo contém tarefas válidas.');
        }

        onUpdateTasks(parsedTasks);

        if (xmlLinks.length > 0 && onUpdateAllocationLinks) {
          // Mantém links pré-existentes que estão travados e adiciona/atualiza com os links extraídos do XML
          const lockedLinks = allocationLinks.filter((l) => l.observacoes?.includes('TRAVADO') || l.observacoes?.includes('LOCKED'));
          const finalLinks = [...lockedLinks, ...xmlLinks];
          onUpdateAllocationLinks(finalLinks);
        }

        // Cria automaticamente uma versão no histórico
        const dataHora = new Date().toLocaleString('pt-BR');
        const novaVersao: VersaoCronograma = {
          id: `ver-${Date.now()}`,
          obraId: activeObra?.id || 'obra-padrao',
          nome: `Importação ${file.name.substring(0, 30)}`,
          descricao: `Upload automático em ${dataHora} (${xmlLinks.length} recursos vinculados)`,
          nomeArquivo: file.name,
          tipoArquivo: fileName.endsWith('.xml') ? 'xml' : 'csv',
          criadoEm: dataHora,
          tarefasCount: parsedTasks.length,
          tarefas: parsedTasks
        };
        onUpdateVersoes([novaVersao, ...versoes]);

        const extraMsg = xmlLinks.length > 0 ? ` e ${xmlLinks.length} recursos pré-vinculados na Matriz PQ!` : '.';
        setUploadSuccess(
          `Sucesso! ${parsedTasks.length} tarefas importadas do arquivo "${file.name}"${extraMsg}`
        );
        setTimeout(() => setUploadSuccess(null), 5000);
      } catch (err: any) {
        setUploadError(`Erro ao ler arquivo: ${err.message || 'Formato não reconhecido'}`);
      }
    };

    reader.onerror = () => {
      setUploadError('Erro ao abrir o arquivo local.');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Salvar versão manual no histórico
  const handleSaveManualVersion = () => {
    if (!newVersionName.trim()) {
      alert('Informe um nome para a versão.');
      return;
    }
    const dataHora = new Date().toLocaleString('pt-BR');
    const novaVersao: VersaoCronograma = {
      id: `ver-${Date.now()}`,
      obraId: activeObra?.id || 'obra-padrao',
      nome: newVersionName.trim(),
      descricao: newVersionDesc.trim() || undefined,
      tipoArquivo: 'manual',
      criadoEm: dataHora,
      tarefasCount: tasks.length,
      tarefas: [...tasks]
    };

    onUpdateVersoes([novaVersao, ...versoes]);
    setIsSavingNewVersion(false);
    setNewVersionName('');
    setNewVersionDesc('');
    setUploadSuccess(`Versão "${novaVersao.nome}" gravada com sucesso no histórico.`);
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  // Restaurar uma versão do histórico
  const handleLoadVersion = (versao: VersaoCronograma) => {
    if (
      window.confirm(
        `Carregar versão "${versao.nome}" com ${versao.tarefasCount} tarefas salvas em ${versao.criadoEm}?`
      )
    ) {
      onUpdateTasks(versao.tarefas);
      setShowHistoryModal(false);
      setUploadSuccess(`Versão "${versao.nome}" restaurada com sucesso.`);
      setTimeout(() => setUploadSuccess(null), 4000);
    }
  };

  // Excluir versão do histórico
  const handleDeleteVersion = (versaoId: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta versão do histórico?')) {
      onUpdateVersoes(versoes.filter((v) => v.id !== versaoId));
    }
  };

  // Carregar dados de exemplo SEEL/SABESP (opcional)
  const handleCarregarExemplo = () => {
    if (
      window.confirm(
        'Deseja carregar as tarefas de exemplo da metodologia SEEL / SABESP nesta obra?'
      )
    ) {
      onUpdateTasks(SEEL_SABESP_SCHEDULE_TASKS);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* HEADER DA ABA CRONOGRAMA */}
      <div className="bg-slate-900 border-b border-slate-800 text-white p-4 shrink-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Cronograma Executivo (MS Project)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                  {tasks.length} Tarefas • {activeObra?.nome || 'Obra Selecionada'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Importe seu cronograma direto em XML nativo do Project ou CSV • Histórico de versões e recolhimento por níveis
              </p>
            </div>
          </div>

          {/* AÇÕES DE IMPORTAÇÃO, HISTÓRICO E CÓPIA */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xml,.csv,.txt"
              className="hidden"
            />

            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer relative"
              title="Ver histórico de versões salvas deste cronograma"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Histórico de Versões</span>
              {versoes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/30 text-amber-300 font-mono">
                  {versoes.length}
                </span>
              )}
            </button>

            {tasks.length > 0 && (
              <button
                onClick={() => setIsSavingNewVersion(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Salvar uma revisão/versão das tarefas atuais no histórico"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Salvar Revisão
              </button>
            )}

            <button
              onClick={() => setShowXmlGuide(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Instruções para salvar em XML direto no MS Project"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              Como Salvar XML
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Cronograma (.xml / .csv)
            </button>

            <button
              onClick={handleCopyAllResources}
              disabled={tasks.length === 0}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copia todas as tarefas com recursos formatados para colar no Excel/Project"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? 'Copiado!' : 'Copiar Recursos p/ Project'}
            </button>
          </div>
        </div>

        {/* FEEDBACK DE UPLOAD / SUCESSO */}
        {uploadSuccess && (
          <div className="mt-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
        {uploadError && (
          <div className="mt-3 bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* BARRA DE FILTROS E CONTROLE DE RECOLHER / EXPANDIR POR NÍVEIS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ID Exclusiva, EDT ou Nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 outline-none focus:border-indigo-500"
            />
          </div>

          {/* CONTROLE DE EXPANSÃO / RECOLHIMENTO POR NÍVEIS */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Níveis de EAP:
            </span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-bold">
              <button
                onClick={() => handleSetLevelExpansion(1)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  maxVisibleLevel === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Recolher para Nível 1 (Macro-Fases)"
              >
                Nv 1
              </button>
              <button
                onClick={() => handleSetLevelExpansion(2)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  maxVisibleLevel === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Expandir até Nível 2"
              >
                Nv 2
              </button>
              <button
                onClick={() => handleSetLevelExpansion(3)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  maxVisibleLevel === 3 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Expandir até Nível 3"
              >
                Nv 3
              </button>
              <button
                onClick={() => handleSetLevelExpansion(7)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  maxVisibleLevel === 7 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Expandir até Nível 7 (Pacotes/Blocos)"
              >
                Nv 7 (Blocos)
              </button>
              <button
                onClick={() => handleSetLevelExpansion(8)}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  maxVisibleLevel === 8 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Expandir todas as tarefas executivas"
              >
                Expandir Tudo
              </button>
            </div>

            {/* FILTRO RÁPIDO */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-bold ml-1">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  filterLevel === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterLevel('SERVICES_ONLY')}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  filterLevel === 'SERVICES_ONLY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Só Serviços
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SALVAR NOVA REVISÃO */}
      {isSavingNewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Salvar Nova Versão do Cronograma
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Versão / Revisão</label>
                <input
                  type="text"
                  placeholder="Ex: R01 - Revisão Março 2026"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Ajuste de produtividade da equipe de injeção..."
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSavingNewVersion(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveManualVersion}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Salvar Versão ({tasks.length} tarefas)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO DE VERSÕES */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Histórico de Versões do Cronograma ({activeObra?.nome})
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {versoes.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Nenhuma versão registrada no histórico desta obra. Ao fazer upload ou salvar uma
                  revisão, ela aparecerá aqui.
                </div>
              ) : (
                versoes.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-indigo-50/40 transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{ver.nome}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 uppercase">
                          {ver.tipoArquivo || 'xml'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ver.criadoEm} • {ver.tarefasCount} tarefas salvas
                        {ver.descricao && ` • ${ver.descricao}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadVersion(ver)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="Restaurar esta versão para ser a atual"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Carregar
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(ver.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Excluir esta versão do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end shrink-0 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORPO: TABELA DE TAREFAS OU TELA VAZIA LIMPA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto my-8 space-y-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                Nenhum cronograma importado para esta obra ({activeObra?.nome})
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Faça o upload do seu arquivo <strong>.xml nativo do MS Project</strong> ou planilha{' '}
                <strong>.xlsx / .csv</strong> para iniciar o planejamento com seus dados reais.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Fazer Upload do Arquivo (.xml / .csv)
              </button>
              <button
                onClick={handleCarregarExemplo}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                title="Carregar tarefas de teste apenas se desejar demonstrar"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Carregar Exemplo SEEL/SABESP
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-16 text-center">Id Excl.</th>
                    <th className="p-3 w-28">EDT (WBS)</th>
                    <th className="p-3">Nome da Tarefa / Atividade</th>
                    <th className="p-3 text-center">Início / Fim</th>
                    <th className="p-3 text-right">Qtd Física</th>
                    <th className="p-3 text-center">Duração (DU)</th>
                    <th className="p-3">String de Recursos Gerada (MS Project)</th>
                    <th className="p-3 text-center w-16">Copiar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                        Nenhuma tarefa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const indentPx = (task.outlineLevel - 1) * 14;
                      const isSummary = task.isSummary || task.outlineLevel < 8;
                      const isCollapsed = collapsedParentIds.has(task.uniqueId);
                      const hasChildren = (childrenMap.get(task.uniqueId)?.length || 0) > 0;
                      const resourceStr =
                        task.msProjectResourceString || task.rollUpResourceString || '';

                      return (
                        <tr
                          key={task.uniqueId}
                          className={`hover:bg-slate-50 transition ${
                            isSummary ? 'bg-slate-50/70 font-semibold' : ''
                          }`}
                        >
                          <td className="p-3 text-center font-mono font-bold text-slate-700">
                            {task.uniqueId}
                          </td>
                          <td className="p-3 font-mono text-slate-600">{task.wbs}</td>
                          <td className="p-3">
                            <div
                              style={{ paddingLeft: `${indentPx}px` }}
                              className="flex items-center gap-1.5"
                            >
                              {hasChildren ? (
                                <button
                                  onClick={() => toggleCollapseTask(task.uniqueId)}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                                  title={isCollapsed ? 'Expandir filhas' : 'Recolher filhas'}
                                >
                                  {isCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                                  )}
                                </button>
                              ) : task.outlineLevel === 8 ? (
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 ml-1" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0 ml-1" />
                              )}

                              <span
                                className={
                                  task.outlineLevel <= 3
                                    ? 'font-black text-slate-900 text-sm'
                                    : task.outlineLevel === 7
                                    ? 'font-bold text-indigo-950'
                                    : 'text-slate-800'
                                }
                              >
                                {task.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center text-[10px] text-slate-600 font-mono">
                            {task.startDate} até {task.finishDate}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {task.physicalQuantity > 0 ? (
                              <span className="font-bold text-slate-900">
                                {task.physicalQuantity.toLocaleString('pt-BR')} {task.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-700">
                            {task.workingDaysDuration}d
                          </td>
                          <td className="p-3">
                            {resourceStr ? (
                              <div className="flex items-center gap-1.5">
                                <code
                                  className="text-[10px] font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded max-w-[320px] truncate block border border-slate-200"
                                  title={resourceStr}
                                >
                                  {resourceStr}
                                </code>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Sem recursos alocados
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {resourceStr && (
                              <button
                                onClick={() => handleCopyTaskResources(task.uniqueId, resourceStr)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Copiar recursos formatados para colar na coluna 'Nomes dos Recursos' do MS Project"
                              >
                                {copiedTaskId === task.uniqueId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
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
        )}
      </div>

      {/* MODAL GUIA: COMO SALVAR XML NO MS PROJECT */}
      {showXmlGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Como Salvar em XML no Microsoft Project
                </h3>
              </div>
              <button
                onClick={() => setShowXmlGuide(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O Microsoft Project salva seu cronograma em XML nativo em 3 segundos. Esse formato é
              100% aberto e exporta todas as tarefas, datas, durações e EDT sem necessidade de
              formatar colunas no Excel:
            </p>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  No MS Project aberto com seu cronograma, clique em <strong>Arquivo</strong> no menu
                  superior esquerdo.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  Selecione <strong>Salvar Como</strong> $\rightarrow$ escolha a pasta desejada.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  No campo <strong>Tipo de arquivo</strong>, selecione:{' '}
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold font-mono">
                    Formato XML do Microsoft Project (*.xml)
                  </span>
                  .
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  Clique em Salvar e arraste o arquivo gerado para cá no botão{' '}
                  <strong>Upload Cronograma</strong>!
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowXmlGuide(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
