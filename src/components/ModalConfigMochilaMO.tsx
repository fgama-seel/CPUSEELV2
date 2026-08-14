import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  X,
  Plus,
  Trash2,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Calculator,
  HardHat,
  Copy,
  ChevronRight,
  Info,
  ShieldAlert,
  Percent,
  Sliders,
  DollarSign,
  ArrowRight,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react';
import {
  Obra,
  ItemMochila,
  MochilaMOInsumo,
  InsumoBase,
  AdicionaisMO,
  ConfigEncargosObra
} from '../types';
import { formatMoney, exportarRelatorioMochilaMO } from '../lib/excelExport';
import { ModalRelatorioMochilaAberta } from './ModalRelatorioMochilaAberta';
import {
  HORAS_MES_PADRAO,
  ENCARGO_PADRAO_PERC,
  ITENS_MOCHILA_PADRAO,
  gerarItensMochilaPadrao,
  gerarMochilaPadrao,
  calcularMochilaInsumo,
  clonarMochilaParaInsumo
} from '../lib/mochilaDefaults';
import { saveObra, saveInsumoBase } from '../services/dbService';

interface ModalConfigMochilaMOProps {
  isOpen: boolean;
  activeObra: Obra | null;
  bancoInsumos: InsumoBase[];
  initialInsumoId?: string | null;
  onClose: () => void;
  onSaved?: (updatedObra: Obra) => void;
}

const CATEGORIAS_PADRAO = [
  'ALIMENTAÇÃO',
  'TRANSPORTE',
  'UNIFORMES / EPI',
  'ASSISTÊNCIA',
  'ALOJAMENTO',
  'OUTROS'
];

export const ModalConfigMochilaMO: React.FC<ModalConfigMochilaMOProps> = ({
  isOpen,
  activeObra,
  bancoInsumos,
  initialInsumoId,
  onClose,
  onSaved
}) => {
  // Filter all Labor inputs (Mão de Obra) for this obra
  const insumosMO = useMemo(() => {
    return bancoInsumos.filter((i) => i.tipo === 'Mão de Obra');
  }, [bancoInsumos]);

  // Selected MO Insumo
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');

  // Active Tab: 'itens' (Composição da Mochila) | 'adicionais' (Salário, Adicionais e Encargos) | 'encargos_obra' (Configuração Global de Encargos)
  const [activeTab, setActiveTab] = useState<'itens' | 'adicionais' | 'encargos_obra'>('itens');

  // Form State for the currently selected MO
  const [unidadeBase, setUnidadeBase] = useState<'h' | '/mês'>('h');
  const [salarioMes, setSalarioMes] = useState<number>(0);
  const [salarioHora, setSalarioHora] = useState<number>(0);
  const [horasMes, setHorasMes] = useState<number>(HORAS_MES_PADRAO);
  const [encargoPerc, setEncargoPerc] = useState<number>(ENCARGO_PADRAO_PERC);
  const [adicionais, setAdicionais] = useState<AdicionaisMO>({
    dissidio: 0,
    ajudaDeCusto: 0,
    horaExtra: 0,
    adicionalNoturno: 0,
    periculosidade: 0,
    insalubridade: 0
  });
  const [itens, setItens] = useState<ItemMochila[]>([]);
  const [atualizarPrecoBanco, setAtualizarPrecoBanco] = useState<boolean>(true);

  // Global Encargos Config State (Obra-wide)
  const [globalHorasMes, setGlobalHorasMes] = useState<number>(HORAS_MES_PADRAO);
  const [globalEncargoPerc, setGlobalEncargoPerc] = useState<number>(ENCARGO_PADRAO_PERC);
  const [grupoA, setGrupoA] = useState<number>(16.8);
  const [grupoB, setGrupoB] = useState<number>(48.2);
  const [grupoC, setGrupoC] = useState<number>(4.5);
  const [grupoD, setGrupoD] = useState<number>(5.5);

  // Clone Modal / Selector State
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const [cloneSourceId, setCloneSourceId] = useState<string>('');

  // Report Modal State
  const [showRelatorioModal, setShowRelatorioModal] = useState<boolean>(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Initial load when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Load global encargos config
    const configEnc = activeObra?.configEncargos;
    if (configEnc) {
      setGlobalHorasMes(configEnc.horasMesPadrao || HORAS_MES_PADRAO);
      setGlobalEncargoPerc(configEnc.percentualEncargoPadrao || ENCARGO_PADRAO_PERC);
      if (configEnc.detalhesGrupos) {
        setGrupoA(configEnc.detalhesGrupos.grupoA ?? 16.8);
        setGrupoB(configEnc.detalhesGrupos.grupoB ?? 48.2);
        setGrupoC(configEnc.detalhesGrupos.grupoC ?? 4.5);
        setGrupoD(configEnc.detalhesGrupos.grupoD ?? 5.5);
      }
    } else {
      setGlobalHorasMes(HORAS_MES_PADRAO);
      setGlobalEncargoPerc(ENCARGO_PADRAO_PERC);
    }

    // Determine initial MO to select
    let targetId = initialInsumoId;
    if (!targetId || !insumosMO.some((i) => (i.id === targetId || i.id_insumo === targetId))) {
      targetId = insumosMO.length > 0 ? (insumosMO[0].id || insumosMO[0].id_insumo) : '';
    }
    setSelectedInsumoId(targetId || '');
  }, [isOpen, initialInsumoId, insumosMO, activeObra]);

  // When selectedInsumoId changes, populate form with that MO's saved config or default
  useEffect(() => {
    if (!selectedInsumoId || !isOpen) return;

    const currentInsumo = insumosMO.find(
      (i) => i.id === selectedInsumoId || i.id_insumo === selectedInsumoId
    );
    const existingMochila = activeObra?.mochilasMO?.[selectedInsumoId];

    if (existingMochila) {
      setUnidadeBase((existingMochila.unidadeBase as '/mês' | 'h') || (currentInsumo?.unid === '/mês' || currentInsumo?.unid === 'MÊS' ? '/mês' : 'h'));
      setSalarioMes(Number(existingMochila.salarioMes) || 0);
      setSalarioHora(Number(existingMochila.salarioHora) || Number(currentInsumo?.pr_unit) || 0);
      setHorasMes(Number(existingMochila.horasMes) || activeObra?.configEncargos?.horasMesPadrao || HORAS_MES_PADRAO);
      setEncargoPerc(
        existingMochila.encargoPerc !== undefined
          ? Number(existingMochila.encargoPerc)
          : (activeObra?.configEncargos?.percentualEncargoPadrao ?? ENCARGO_PADRAO_PERC)
      );
      setAdicionais({
        dissidio: Number(existingMochila.adicionais?.dissidio) || 0,
        ajudaDeCusto: Number(existingMochila.adicionais?.ajudaDeCusto) || 0,
        horaExtra: Number(existingMochila.adicionais?.horaExtra) || 0,
        adicionalNoturno: Number(existingMochila.adicionais?.adicionalNoturno) || 0,
        periculosidade: Number(existingMochila.adicionais?.periculosidade) || 0,
        insalubridade: Number(existingMochila.adicionais?.insalubridade) || 0
      });
      setItens(
        existingMochila.itens && existingMochila.itens.length > 0
          ? existingMochila.itens
          : gerarItensMochilaPadrao()
      );
    } else {
      // Default initialization from InsumoBase & standard template from image
      const isMensal = currentInsumo?.unid === '/mês' || currentInsumo?.unid === 'MÊS';
      const prUnit = Number(currentInsumo?.pr_unit) || 0;
      const hMes = activeObra?.configEncargos?.horasMesPadrao || HORAS_MES_PADRAO;
      const encPerc = activeObra?.configEncargos?.percentualEncargoPadrao ?? ENCARGO_PADRAO_PERC;

      setUnidadeBase(isMensal ? '/mês' : 'h');
      if (isMensal) {
        setSalarioMes(prUnit);
        setSalarioHora(hMes > 0 ? Number((prUnit / hMes).toFixed(4)) : 0);
      } else {
        setSalarioHora(prUnit);
        setSalarioMes(Number((prUnit * hMes).toFixed(2)));
      }
      setHorasMes(hMes);
      setEncargoPerc(encPerc);
      setAdicionais({
        dissidio: 0,
        ajudaDeCusto: 0,
        horaExtra: 0,
        adicionalNoturno: 0,
        periculosidade: 0,
        insalubridade: 0
      });
      setItens(
        activeObra?.mochilaMO?.itens && activeObra.mochilaMO.itens.length > 0
          ? activeObra.mochilaMO.itens
          : gerarItensMochilaPadrao()
      );
    }
  }, [selectedInsumoId, activeObra, insumosMO, isOpen]);

  const currentInsumo = insumosMO.find(
    (i) => i.id === selectedInsumoId || i.id_insumo === selectedInsumoId
  );

  // Real-time calculated object for the current MO
  const calculoAtual = calcularMochilaInsumo({
    insumoId: selectedInsumoId,
    insumoCodigo: currentInsumo?.id_insumo || selectedInsumoId,
    insumoDescricao: currentInsumo?.descricao || '',
    unidadeBase,
    salarioMes,
    salarioHora,
    adicionais,
    encargoPerc,
    horasMes,
    itens
  });

  // Handlers for Items
  const handleAddItem = (categoria: string = 'OUTROS') => {
    const nextSeq = itens.length > 0 ? Math.max(...itens.map((i) => i.seq || 0)) + 1 : 1;
    const newItem: ItemMochila = {
      id: `item_mochila_${Date.now()}`,
      seq: nextSeq,
      categoria,
      descricao: '',
      custo_unit: 0,
      unid: 'mês',
      quantidade: 1,
      total: 0
    };
    setItens([...itens, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof ItemMochila, value: string | number) => {
    const updated = [...itens];
    const item = { ...updated[index] };

    if (field === 'descricao' || field === 'unid' || field === 'categoria') {
      item[field] = String(value) as any;
    } else {
      const numVal = Number(value) || 0;
      (item as any)[field] = numVal;

      if (field === 'custo_unit' || field === 'quantidade') {
        const qtd = field === 'quantidade' ? numVal : Number(item.quantidade) || 1;
        const unt = field === 'custo_unit' ? numVal : Number(item.custo_unit) || 0;
        item.total = Number((qtd * unt).toFixed(2));
      } else if (field === 'total') {
        item.total = numVal;
      }
    }

    updated[index] = item;
    setItens(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = itens.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      seq: idx + 1
    }));
    setItens(updated);
  };

  const handleResetToStandardImage = () => {
    setItens(gerarItensMochilaPadrao());
    setFeedback('Mochila restaurada com os 13 itens e valores padrão da planilha SEEL!');
    setTimeout(() => setFeedback(null), 3500);
  };

  // Clone from another MO
  const handleExecuteClone = () => {
    if (!cloneSourceId || cloneSourceId === selectedInsumoId) return;

    const sourceMochila = activeObra?.mochilasMO?.[cloneSourceId];
    const sourceInsumo = insumosMO.find(
      (i) => i.id === cloneSourceId || i.id_insumo === cloneSourceId
    );

    if (sourceMochila) {
      setItens(
        sourceMochila.itens.map((it, idx) => ({
          ...it,
          id: `item_mochila_${Date.now()}_${idx + 1}`
        }))
      );
      setEncargoPerc(sourceMochila.encargoPerc ?? ENCARGO_PADRAO_PERC);
      setHorasMes(sourceMochila.horasMes ?? HORAS_MES_PADRAO);
      if (sourceMochila.adicionais) {
        setAdicionais({ ...sourceMochila.adicionais });
      }
      setFeedback(`Mochila e percentuais de adicionais clonados a partir de "${sourceInsumo?.descricao || cloneSourceId}"! Os adicionais foram recalculados para o salário deste cargo.`);
    } else {
      // If source hasn't customized yet, clone default template
      setItens(gerarItensMochilaPadrao());
      setFeedback(`Mochila padrão SEEL copiada para este insumo.`);
    }

    setShowCloneModal(false);
    setCloneSourceId('');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Apply global Encargos to all MOs
  const handleApplyGlobalEncargosToAll = async () => {
    if (!activeObra) return;
    setIsSaving(true);
    try {
      const somaGrupos = Number((grupoA + grupoB + grupoC + grupoD).toFixed(2));
      const finalPerc = globalEncargoPerc > 0 ? globalEncargoPerc : somaGrupos;

      const newConfigEncargos: ConfigEncargosObra = {
        horasMesPadrao: Number(globalHorasMes) || HORAS_MES_PADRAO,
        percentualEncargoPadrao: finalPerc,
        detalhesGrupos: {
          grupoA,
          grupoB,
          grupoC,
          grupoD
        }
      };

      // Update all existing mochilas in Obra with this encargo
      const updatedMochilas: Record<string, MochilaMOInsumo> = { ...(activeObra.mochilasMO || {}) };

      Object.keys(updatedMochilas).forEach((key) => {
        const m = updatedMochilas[key];
        updatedMochilas[key] = calcularMochilaInsumo(
          {
            ...m,
            encargoPerc: finalPerc,
            horasMes: Number(globalHorasMes) || HORAS_MES_PADRAO
          },
          newConfigEncargos
        );
      });

      const updatedObra: Obra = {
        ...activeObra,
        configEncargos: newConfigEncargos,
        mochilasMO: updatedMochilas
      };

      await saveObra(updatedObra);

      setEncargoPerc(finalPerc);
      setHorasMes(Number(globalHorasMes) || HORAS_MES_PADRAO);

      if (onSaved) onSaved(updatedObra);

      setFeedback(`Encargo de ${finalPerc}% e ${globalHorasMes}h/mês aplicados globalmente na obra com sucesso!`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Erro ao salvar encargos globais:', err);
      setFeedback('Erro ao salvar encargos globais.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Save current MO's Mochila & Encargos
  const handleSaveCurrentMochila = async () => {
    if (!activeObra || !selectedInsumoId) return;
    setIsSaving(true);

    try {
      const mochilaFinal = calcularMochilaInsumo({
        insumoId: selectedInsumoId,
        insumoCodigo: currentInsumo?.id_insumo || selectedInsumoId,
        insumoDescricao: currentInsumo?.descricao || '',
        unidadeBase,
        salarioMes,
        salarioHora,
        adicionais,
        encargoPerc,
        horasMes,
        itens
      });

      const updatedMochilas: Record<string, MochilaMOInsumo> = {
        ...(activeObra.mochilasMO || {}),
        [selectedInsumoId]: mochilaFinal
      };

      const updatedObra: Obra = {
        ...activeObra,
        mochilasMO: updatedMochilas,
        // Also keep fallback mochilaMO updated
        mochilaMO: {
          horasMesPadrao: horasMes,
          percentualEncargoPadrao: encargoPerc,
          itens,
          totalMensal: mochilaFinal.totalMensalMochila || 0,
          custoHoraMochila: mochilaFinal.custoHoraMochila || 0,
          atualizadoEm: new Date().toISOString()
        }
      };

      await saveObra(updatedObra);

      // Optionally sync price to InsumoBase in Banco de Insumos
      if (atualizarPrecoBanco && currentInsumo) {
        // We set the pr_unit to the calculated Salário + Encargo + Mochila (ou Salário + Encargo dependendo da preferência)
        const novoPrecoUnitario = mochilaFinal.salarioEncargoMochilaHora || mochilaFinal.salarioComEncargoHora || salarioHora;
        const updatedInsumoBase: InsumoBase = {
          ...currentInsumo,
          pr_unit: Number(novoPrecoUnitario.toFixed(2))
        };
        await saveInsumoBase(updatedInsumoBase);
      }

      if (onSaved) {
        onSaved(updatedObra);
      }

      setFeedback(`Mochila e Encargos de "${currentInsumo?.descricao || selectedInsumoId}" salvos com sucesso!`);
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } catch (err) {
      console.error('Erro ao salvar mochila da mão de obra:', err);
      setFeedback('Erro ao salvar configuração da mochila.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Group items by category for cleaner display
  const itensPorCategoria = useMemo(() => {
    const map: Record<string, { item: ItemMochila; index: number }[]> = {};
    CATEGORIAS_PADRAO.forEach((cat) => (map[cat] = []));
    map['OUTROS'] = map['OUTROS'] || [];

    itens.forEach((item, index) => {
      const cat = item.categoria?.toUpperCase() || 'OUTROS';
      if (!map[cat]) map[cat] = [];
      map[cat].push({ item, index });
    });
    return map;
  }, [itens]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden border border-slate-300">
        
        {/* TOP HEADER */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg leading-snug flex items-center gap-2">
                <span>Gestão da Mochila & Encargos de Mão de Obra</span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-mono font-extrabold">
                  {formatMoney(calculoAtual.salarioEncargoMochilaHora || 0)} / hora
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Obra: <strong className="text-slate-200">{activeObra?.codigo} - {activeObra?.nome}</strong></span>
                <span>•</span>
                <span>Divisor Padrão: <strong className="text-amber-300">{horasMes}h/mês</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRelatorioModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-xs"
              title="Visualizar e Imprimir o Relatório de Mochila Aberta da Mão de Obra selecionada"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Visualizar / Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => exportarRelatorioMochilaMO(calculoAtual, activeObra, currentInsumo)}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/40 shadow-xs"
              title="Baixar planilha aberta em Excel (.xlsx) com a memória de cálculo completa"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCloneModal(true)}
              className="bg-indigo-600/90 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-indigo-400/40 shadow-xs"
              title="Copiar a configuração completa de outra Mão de Obra para a selecionada"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clonar Mochila</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST BANNER */}
        {feedback && (
          <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-bold flex items-center justify-between shadow-inner animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SELECTOR OF MÃO DE OBRA & NAVIGATION TABS */}
        <div className="px-6 py-3 bg-slate-100/90 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
          
          {/* Selector Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-extrabold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-amber-600" />
              <span>Mão de Obra Ativa:</span>
            </label>
            <select
              value={selectedInsumoId}
              onChange={(e) => setSelectedInsumoId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-xs max-w-xs md:max-w-md w-full"
            >
              {insumosMO.length === 0 ? (
                <option value="">Nenhum insumo de Mão de Obra cadastrado nesta obra</option>
              ) : (
                insumosMO.map((item) => {
                  const hasCustom = !!activeObra?.mochilasMO?.[item.id || item.id_insumo];
                  return (
                    <option key={item.id} value={item.id}>
                      {item.id_insumo ? `[${item.id_insumo}] ` : ''}{item.descricao} {hasCustom ? '⭐ (Mochila Configurada)' : ''}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-stretch md:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('itens')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'itens'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>1. Composição da Mochila ({itens.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('adicionais')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'adicionais'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>2. Salário, Adicionais & Encargos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('encargos_obra')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'encargos_obra'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Encargos da Obra (Global)</span>
            </button>
          </div>
        </div>

        {/* COMPARATIVE DEMONSTRATIVE FORMULA RIBBON (EXATAMENTE COMO NA PLANILHA) */}
        <div className="bg-slate-900 text-white px-6 py-2.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono border-b border-slate-800 shrink-0">
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">1. Salário/h</span>
            <strong className="text-slate-100 text-xs">{formatMoney(calculoAtual.salarioHora || 0)}</strong>
          </div>

          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">+ Adicionais/h</span>
            <strong className="text-amber-300 text-xs">
              +{formatMoney(
                (calculoAtual.prUnBaseSalarioHora || 0) - (calculoAtual.salarioHora || 0)
              )}
            </strong>
          </div>

          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">= PrUn. Base</span>
            <strong className="text-slate-100 text-xs">{formatMoney(calculoAtual.prUnBaseSalarioHora || 0)}</strong>
          </div>

          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Encargo ({encargoPerc}%)</span>
            <strong className="text-emerald-300 text-xs">
              +{formatMoney((calculoAtual.salarioComEncargoHora || 0) - (calculoAtual.prUnBaseSalarioHora || 0))}
            </strong>
          </div>

          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Salário + Encargo</span>
            <strong className="text-blue-300 text-xs">{formatMoney(calculoAtual.salarioComEncargoHora || 0)}</strong>
          </div>

          <div className="bg-amber-950/60 p-1.5 rounded-lg border border-amber-500/40">
            <span className="text-[10px] text-amber-300 block font-sans uppercase">+ Mochila/h ({horasMes}h)</span>
            <strong className="text-amber-300 text-xs">+{formatMoney(calculoAtual.custoHoraMochila || 0)}</strong>
          </div>

          <div className="bg-emerald-950/80 p-1.5 rounded-lg border border-emerald-500/50 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-300 block font-sans font-bold uppercase">Total Final / Hora</span>
            <strong className="text-emerald-300 text-xs font-extrabold">{formatMoney(calculoAtual.salarioEncargoMochilaHora || 0)}</strong>
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT */}
        <div className="p-5 md:p-6 overflow-y-auto custom-scroll flex-1 bg-slate-50/50 space-y-5">
          
          {/* TAB 1: COMPOSIÇÃO DA MOCHILA (ITENS POR CATEGORIA) */}
          {activeTab === 'itens' && (
            <div className="space-y-4">
              {/* Header and Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Itens que Compõem a Mochila Desta Mão de Obra</span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {itens.length} itens cadastrados
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Soma Mensal da Mochila: <strong className="text-slate-900 font-mono font-bold">{formatMoney(calculoAtual.totalMensalMochila || 0)}/mês</strong> | Custo Horário ({horasMes}h): <strong className="text-amber-700 font-mono font-bold">+{formatMoney(calculoAtual.custoHoraMochila || 0)}/h</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToStandardImage}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                    title="Restaurar os 13 itens da planilha base de referência"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restaurar Padrão SEEL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddItem('OUTROS')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>
              </div>

              {/* Table of Mochila Items */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[11px] uppercase tracking-wider select-none">
                      <th className="p-2.5 w-12 text-center">SEQ</th>
                      <th className="p-2.5 w-36">Categoria</th>
                      <th className="p-2.5">Descrição do Custo</th>
                      <th className="p-2.5 w-20 text-center">UND</th>
                      <th className="p-2.5 w-20 text-center">QTD</th>
                      <th className="p-2.5 w-28 text-right">Custo Unit (R$)</th>
                      <th className="p-2.5 w-32 text-right">Total Mensal (R$)</th>
                      <th className="p-2.5 w-14 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-200">
                    {itens.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                          Nenhum item adicionado à mochila. Clique em "Restaurar Padrão SEEL" ou "Adicionar Item".
                        </td>
                      </tr>
                    ) : (
                      itens.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                          {/* SEQ */}
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px] font-bold">
                            {idx + 1}
                          </td>

                          {/* Categoria */}
                          <td className="p-2">
                            <select
                              value={item.categoria || 'OUTROS'}
                              onChange={(e) => handleUpdateItem(idx, 'categoria', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                            >
                              {CATEGORIAS_PADRAO.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Descrição */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => handleUpdateItem(idx, 'descricao', e.target.value)}
                              placeholder="Ex: Alimentação, Vale Transporte..."
                              className="w-full border border-slate-200 focus:border-indigo-600 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                            />
                          </td>

                          {/* Unidade */}
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={item.unid}
                              onChange={(e) => handleUpdateItem(idx, 'unid', e.target.value)}
                              className="w-full border border-slate-200 focus:border-indigo-600 rounded px-1 py-1 text-[11px] font-bold uppercase text-center text-slate-700"
                            />
                          </td>

                          {/* Quantidade */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={item.quantidade ?? 1}
                              onChange={(e) => handleUpdateItem(idx, 'quantidade', e.target.value)}
                              className="w-full border border-slate-200 focus:border-indigo-600 rounded px-1 py-1 text-xs text-center font-mono font-bold text-slate-800"
                            />
                          </td>

                          {/* Custo Unitário */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              value={item.custo_unit ?? 0}
                              onChange={(e) => handleUpdateItem(idx, 'custo_unit', e.target.value)}
                              className="w-full border border-slate-200 focus:border-indigo-600 rounded px-1.5 py-1 text-xs text-right font-mono font-bold text-slate-900"
                            />
                          </td>

                          {/* Total Mensal */}
                          <td className="p-2 text-right font-mono font-extrabold text-slate-900 text-xs">
                            {formatMoney(item.total || (Number(item.quantidade) || 1) * (Number(item.custo_unit) || 0))}
                          </td>

                          {/* Ações */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                    <tr>
                      <td colSpan={6} className="p-3 text-right text-slate-700 uppercase tracking-wide">
                        Custo Mensal Total da Mochila:
                      </td>
                      <td className="p-3 text-right font-mono text-sm font-extrabold text-slate-900">
                        {formatMoney(calculoAtual.totalMensalMochila || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SALÁRIO, ADICIONAIS & ENCARGOS */}
          {activeTab === 'adicionais' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span>Base Salarial & Jornada Orçamentária</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Salário / Mês (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={salarioMes}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSalarioMes(v);
                        if (horasMes > 0) {
                          setSalarioHora(Number((v / horasMes).toFixed(4)));
                        }
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-600 text-right"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 25.000,00</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Salário / Hora (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={salarioHora}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setSalarioHora(v);
                        setSalarioMes(Number((v * horasMes).toFixed(2)));
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-600 text-right"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Calculado: Salário/mês ÷ {horasMes}h</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Divisor de Horas/Mês (h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={horasMes}
                      onChange={(e) => {
                        const v = Number(e.target.value) || HORAS_MES_PADRAO;
                        setHorasMes(v);
                        if (salarioMes > 0) {
                          setSalarioHora(Number((salarioMes / v).toFixed(4)));
                        }
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-600 text-center"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Padrão da engenharia: 189,2h</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Adicionais de Mão de Obra */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-1">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-600" />
                      <span>Adicionais de Mão de Obra (% sobre Salário Base)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Percentuais aplicados sobre o salário base. Ao clonar a mochila para outros cargos, os adicionais acompanham o novo salário automaticamente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Dissídio (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={adicionais.dissidio ?? 0}
                        onChange={(e) =>
                          setAdicionais({ ...adicionais, dissidio: Number(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 text-right pr-6 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block text-right font-medium">
                      +{formatMoney((salarioHora * ((adicionais.dissidio || 0) / 100)))}/h
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Ajuda de Custo (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={adicionais.ajudaDeCusto ?? 0}
                        onChange={(e) =>
                          setAdicionais({ ...adicionais, ajudaDeCusto: Number(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 text-right pr-6 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block text-right font-medium">
                      +{formatMoney((salarioHora * ((adicionais.ajudaDeCusto || 0) / 100)))}/h
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Hora Extra (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={adicionais.horaExtra ?? 0}
                        onChange={(e) =>
                          setAdicionais({ ...adicionais, horaExtra: Number(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 text-right pr-6 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block text-right font-medium">
                      +{formatMoney((salarioHora * ((adicionais.horaExtra || 0) / 100)))}/h
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Adic. Noturno (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={adicionais.adicionalNoturno ?? 0}
                        onChange={(e) =>
                          setAdicionais({ ...adicionais, adicionalNoturno: Number(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 text-right pr-6 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block text-right font-medium">
                      +{formatMoney((salarioHora * ((adicionais.adicionalNoturno || 0) / 100)))}/h
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Periculosidade (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={adicionais.periculosidade ?? 0}
                        onChange={(e) =>
                          setAdicionais({ ...adicionais, periculosidade: Number(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 text-right pr-6 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block text-right font-medium">
                      +{formatMoney((salarioHora * ((adicionais.periculosidade || 0) / 100)))}/h
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Insalubridade (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={adicionais.insalubridade ?? 0}
                        onChange={(e) =>
                          setAdicionais({ ...adicionais, insalubridade: Number(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 text-right pr-6 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block text-right font-medium">
                      +{formatMoney((salarioHora * ((adicionais.insalubridade || 0) / 100)))}/h
                    </span>
                  </div>
                </div>

                {/* Resumo da Soma dos Adicionais */}
                {(() => {
                  const somaPerc =
                    (Number(adicionais.dissidio) || 0) +
                    (Number(adicionais.ajudaDeCusto) || 0) +
                    (Number(adicionais.horaExtra) || 0) +
                    (Number(adicionais.adicionalNoturno) || 0) +
                    (Number(adicionais.periculosidade) || 0) +
                    (Number(adicionais.insalubridade) || 0);
                  const valorAdicHora = (calculoAtual.prUnBaseSalarioHora || 0) - (calculoAtual.salarioHora || 0);
                  const valorAdicMes = valorAdicHora * horasMes;

                  return (
                    <div className="bg-amber-50/90 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-bold text-amber-950 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-extrabold text-xs">
                          {somaPerc.toFixed(2)}% Total
                        </span>
                        <span>Soma dos Adicionais Contratuais:</span>
                      </div>
                      <div className="font-mono text-sm flex items-center gap-3">
                        <span>+{formatMoney(valorAdicHora)} / h</span>
                        <span className="text-xs font-normal text-amber-800">
                          (+{formatMoney(valorAdicMes)} / mês)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Encargo Social % */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span>Encargos Sociais Aplicados (%)</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-64">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Alíquota de Encargos Sociais (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={encargoPerc}
                        onChange={(e) => setEncargoPerc(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-600 text-right pr-7"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex-1">
                    <p className="font-bold text-slate-800 mb-0.5">
                      Fórmula: Salário + Encargo = PrUn. Base × (1 + {encargoPerc}%)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      R$ {formatMoney(calculoAtual.prUnBaseSalarioHora || 0)} × (1 + {encargoPerc}%) = <strong className="text-indigo-900">R$ {formatMoney(calculoAtual.salarioComEncargoHora || 0)} / h</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURAÇÃO GLOBAL DE ENCARGOS DA OBRA */}
          {activeTab === 'encargos_obra' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-800" />
                      <span>Configurações Globais de Encargos da Obra</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Defina os percentuais e parâmetros padrões de encargos sociais que regem esta obra.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyGlobalEncargosToAll}
                    disabled={isSaving}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{isSaving ? 'Aplicando...' : 'Aplicar a Todas as Mãos de Obra'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Divisor Padrão de Horas/Mês (h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={globalHorasMes}
                      onChange={(e) => setGlobalHorasMes(Number(e.target.value) || HORAS_MES_PADRAO)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Padrão de 44h semanais na construção civil: <strong>189,2h</strong>
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Percentual de Encargos Sociais Padrão (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={globalEncargoPerc}
                        onChange={(e) => setGlobalEncargoPerc(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 bg-white pr-8 text-right"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Taxa usual de encargos sociais: <strong>75,00%</strong> a <strong>83,85%</strong>
                    </span>
                  </div>
                </div>

                {/* Detalhamento de Grupos A, B, C, D */}
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Detalhamento por Grupos de Encargos (Referência Orçamentária)</span>
                  </h5>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Grupo A (Obrigações)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={grupoA}
                        onChange={(e) => setGrupoA(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-right"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">INSS, FGTS, SESI, SENAI</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Grupo B (Descansos)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={grupoB}
                        onChange={(e) => setGrupoB(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-right"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Férias, 13º, DSR</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Grupo C (Rescisões)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={grupoC}
                        onChange={(e) => setGrupoC(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-right"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Aviso Prévio, Multa FGTS</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Grupo D (Cumulativos)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={grupoD}
                        onChange={(e) => setGrupoD(Number(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-bold text-right"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Reincidências A sobre B</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs">
                    <span className="font-bold text-indigo-900">Soma dos Grupos (A + B + C + D):</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sum = Number((grupoA + grupoB + grupoC + grupoD).toFixed(2));
                        setGlobalEncargoPerc(sum);
                        setEncargoPerc(sum);
                      }}
                      className="font-mono font-extrabold text-indigo-900 bg-white hover:bg-indigo-100 border border-indigo-300 px-2 py-1 rounded text-xs transition"
                      title="Clique para utilizar a soma dos grupos como o encargo padrão"
                    >
                      {(grupoA + grupoB + grupoC + grupoD).toFixed(2)}% (Usar este Total)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS BAR */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chkAtualizarPrecoBanco"
              checked={atualizarPrecoBanco}
              onChange={(e) => setAtualizarPrecoBanco(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="chkAtualizarPrecoBanco" className="text-xs font-bold text-slate-700 cursor-pointer">
              Sincronizar preço unitário deste insumo no banco com o valor final ({formatMoney(calculoAtual.salarioEncargoMochilaHora || 0)}/h)
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowRelatorioModal(true)}
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Visualizar e Imprimir o Relatório de Mochila Aberta desta Mão de Obra"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Relatório Aberto</span>
            </button>

            <button
              type="button"
              onClick={() => exportarRelatorioMochilaMO(calculoAtual, activeObra, currentInsumo)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Exportar Planilha Excel da Mochila Aberta (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleSaveCurrentMochila}
              disabled={isSaving || !selectedInsumoId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Mochila desta MO'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* CLONE MOCHILA SUB-MODAL */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="px-5 py-4 bg-indigo-900 text-white flex justify-between items-center">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-300" />
                <span>Clonar Mochila de Outra Mão de Obra</span>
              </h4>
              <button onClick={() => setShowCloneModal(false)} className="text-indigo-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Selecione a Mão de Obra de origem para copiar <strong>na íntegra</strong> todos os itens da mochila, valores, alíquotas de encargos e os <strong>percentuais de adicionais (%)</strong> para <strong className="text-indigo-900">{currentInsumo?.descricao || selectedInsumoId}</strong>. Os adicionais serão recalculados com base no salário deste cargo.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mão de Obra de Origem (Doadora):
                </label>
                <select
                  value={cloneSourceId}
                  onChange={(e) => setCloneSourceId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 shadow-xs"
                >
                  <option value="">-- Selecione a Mão de Obra de Origem --</option>
                  {insumosMO
                    .filter((i) => i.id !== selectedInsumoId)
                    .map((item) => {
                      const hasMochila = !!activeObra?.mochilasMO?.[item.id || item.id_insumo];
                      return (
                        <option key={item.id} value={item.id}>
                          {item.descricao} {hasMochila ? '(Mochila Personalizada)' : '(Padrão)'}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteClone}
                  disabled={!cloneSourceId}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Confirmar Clonagem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RELATÓRIO / VISUALIZAÇÃO ABERTA MODAL */}
      <ModalRelatorioMochilaAberta
        isOpen={showRelatorioModal}
        onClose={() => setShowRelatorioModal(false)}
        mochila={calculoAtual}
        activeObra={activeObra}
        insumoBase={currentInsumo}
      />

    </div>
  );
};
