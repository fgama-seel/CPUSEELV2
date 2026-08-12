import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  Plus,
  Trash2,
  Truck,
  HardHat,
  Box,
  Briefcase,
  MessageSquare,
  Zap,
  Save,
  Check,
  RefreshCw,
  Info,
  Edit3,
  X
} from 'lucide-react';
import { CPU, Insumo, Obra, Comentario } from '../types';
import { formatMoney, exportarFichaCPU } from '../lib/excelExport';
import { ModalConfirmarExclusaoCPU } from './ModalConfirmarExclusaoCPU';

interface AbaDashboardCPUProps {
  cpu: CPU;
  activeObra: Obra | null;
  userEmail: string;
  onSaveCpu: (updatedCpu: CPU) => Promise<void>;
  onDeleteCpu: (cpuId: string) => Promise<void>;
  onOpenModalInsumo: () => void;
  onRegisterPendingChange: (updatedCpu: CPU) => void;
}

export const AbaDashboardCPU: React.FC<AbaDashboardCPUProps> = ({
  cpu,
  activeObra,
  userEmail,
  onSaveCpu,
  onDeleteCpu,
  onOpenModalInsumo,
  onRegisterPendingChange
}) => {
  const [localCpu, setLocalCpu] = useState<CPU>(cpu);
  const [novoComentario, setNovoComentario] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editHeaderForm, setEditHeaderForm] = useState({
    code: cpu.code,
    nome: cpu.nome,
    unidade: cpu.unidade
  });

  const prevPRef = useRef<number>(cpu.prod_efetiva || 1);

  // Sync state when cpu prop changes
  useEffect(() => {
    setLocalCpu(cpu);
    setEditHeaderForm({
      code: cpu.code,
      nome: cpu.nome,
      unidade: cpu.unidade
    });
  }, [cpu]);

  const handleSaveHeaderEdit = () => {
    const updatedCpu: CPU = {
      ...localCpu,
      code: editHeaderForm.code.trim() || localCpu.code,
      nome: editHeaderForm.nome.trim() || localCpu.nome,
      unidade: editHeaderForm.unidade.trim().toUpperCase() || localCpu.unidade
    };
    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
    setIsEditingHeader(false);
  };

  useEffect(() => {
    const pt = cpu.prod_teorica || 1;
    const prat = cpu.praticabilidade || 1;
    const hd = cpu.horas_dia || 8.8;
    const p = hd > 0 ? (pt * prat) / hd : 1;
    prevPRef.current = p;
  }, [cpu.id]);

  // Recalculate productivity P
  const pt = Number(localCpu.prod_teorica) || 1;
  const prat = Number(localCpu.praticabilidade) || 1;
  const hd = Number(localCpu.horas_dia) || 8.8;
  const pEfetiva = hd > 0 ? (pt * prat) / hd : 1;

  const handleProductivityChange = (
    field: 'prod_teorica' | 'praticabilidade' | 'horas_dia',
    value: number
  ) => {
    const val = Number(value) || 0;

    let newPt = field === 'prod_teorica' ? val : pt;
    let newPrat = field === 'praticabilidade' ? val : prat;
    let newHd = field === 'horas_dia' ? val : hd;

    const pNovo = newHd > 0 ? (newPt * newPrat) / newHd : 1;
    const pAnterior = prevPRef.current;

    let updatedInsumos = [...localCpu.insumos];

    if (pAnterior > 0 && pNovo > 0 && Math.abs(pAnterior - pNovo) > 0.0001) {
      const fatorAjuste = pAnterior / pNovo;
      updatedInsumos = updatedInsumos.map((ins) => {
        if (ins.tipo === 'Equipamento' || ins.tipo === 'Mão de Obra') {
          return {
            ...ins,
            coef: Number((ins.coef * fatorAjuste).toFixed(6))
          };
        }
        return ins;
      });
    }

    prevPRef.current = pNovo;

    const updatedCpu: CPU = {
      ...localCpu,
      [field]: val,
      prod_efetiva: pNovo,
      insumos: updatedInsumos
    };

    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
  };

  const handleToggleVendaDefinida = (checked: boolean) => {
    const bdiObra = activeObra?.bdi ?? 25;
    const newPrecoVenda = checked
      ? (Number(localCpu.preco_venda) || custoTotalUnitario * (1 + bdiObra / 100))
      : custoTotalUnitario * (1 + bdiObra / 100);

    const updatedCpu: CPU = {
      ...localCpu,
      vendaDefinida: checked,
      preco_venda: newPrecoVenda
    };
    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
  };

  const handlePrecoVendaInputChange = (value: number) => {
    const updatedCpu: CPU = {
      ...localCpu,
      vendaDefinida: true,
      preco_venda: Number(value) || 0
    };
    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
  };

  const handleValueChange = (
    field: 'quantidade_prevista' | 'preco_venda',
    value: number
  ) => {
    if (field === 'preco_venda') {
      handlePrecoVendaInputChange(value);
      return;
    }
    const updatedCpu: CPU = {
      ...localCpu,
      [field]: Number(value) || 0
    };
    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
  };

  const handleUpdateInsumo = (
    index: number,
    field: keyof Insumo,
    value: string | number
  ) => {
    const updatedInsumos = [...localCpu.insumos];
    updatedInsumos[index] = {
      ...updatedInsumos[index],
      [field]: field === 'descricao' || field === 'unid' ? value : Number(value) || 0
    };

    const updatedCpu: CPU = {
      ...localCpu,
      insumos: updatedInsumos
    };

    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
  };

  const handleRemoveInsumo = (index: number) => {
    const updatedInsumos = localCpu.insumos.filter((_, i) => i !== index);
    const updatedCpu: CPU = {
      ...localCpu,
      insumos: updatedInsumos
    };
    setLocalCpu(updatedCpu);
    onRegisterPendingChange(updatedCpu);
  };

  const handleAddComentario = () => {
    if (!novoComentario.trim()) return;
    const autorNome = userEmail ? userEmail.split('@')[0] : 'Usuário SEEL';
    const comentarioObj: Comentario = {
      id: `c_${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      autor: autorNome,
      texto: novoComentario.trim()
    };

    const updatedCpu: CPU = {
      ...localCpu,
      comentarios: [comentarioObj, ...(localCpu.comentarios || [])]
    };

    setLocalCpu(updatedCpu);
    setNovoComentario('');
    onRegisterPendingChange(updatedCpu);
  };

  const handleSaveToFirebase = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const bdiObra = activeObra?.bdi ?? 25;
    const qtd = Number(localCpu.quantidade_prevista) || 1;
    let custoUnit = 0;
    localCpu.insumos.forEach((ins) => {
      custoUnit += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
    });

    const isDefinida = localCpu.vendaDefinida === true;
    const finalPrecoVenda = isDefinida
      ? (Number(localCpu.preco_venda) || 0)
      : custoUnit * (1 + bdiObra / 100);

    const custoTotalServico = custoUnit * qtd;
    const vendaTotalServico = finalPrecoVenda * qtd;
    const fcd = custoTotalServico > 0 ? vendaTotalServico / custoTotalServico : 0;

    const finalCpu: CPU = {
      ...localCpu,
      preco_venda: finalPrecoVenda,
      vendaDefinida: isDefinida,
      fator_fcd: fcd
    };

    await onSaveCpu(finalCpu);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const bdiObra = activeObra?.bdi ?? 25;

  // Unit costs subtotals
  let subEqp = 0;
  let subMO = 0;
  let subMat = 0;
  let subTerc = 0;
  let custoTotalUnitario = 0;

  localCpu.insumos.forEach((ins) => {
    const linhaCusto = (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
    custoTotalUnitario += linhaCusto;
    if (ins.tipo === 'Equipamento') subEqp += linhaCusto;
    else if (ins.tipo === 'Mão de Obra') subMO += linhaCusto;
    else if (ins.tipo === 'Terceirizado') subTerc += linhaCusto;
    else subMat += linhaCusto;
  });

  const isVendaDefinida = localCpu.vendaDefinida === true;
  const precoVendaUnit = isVendaDefinida
    ? (Number(localCpu.preco_venda) || 0)
    : custoTotalUnitario * (1 + bdiObra / 100);

  const qtdServico = Number(localCpu.quantidade_prevista) || 1;
  const custoTotalServico = custoTotalUnitario * qtdServico;
  const vendaTotalServico = precoVendaUnit * qtdServico;
  const fatorFcd = custoTotalServico > 0 ? vendaTotalServico / custoTotalServico : 0;

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-3">
          {isEditingHeader ? (
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 w-full sm:max-w-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Editar Dados Principais da CPU</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveHeaderEdit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Código</label>
                  <input
                    type="text"
                    value={editHeaderForm.code}
                    onChange={(e) => setEditHeaderForm({ ...editHeaderForm, code: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unidade</label>
                  <input
                    type="text"
                    value={editHeaderForm.unidade}
                    onChange={(e) => setEditHeaderForm({ ...editHeaderForm, unidade: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold uppercase bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nome / Descrição do Serviço</label>
                  <input
                    type="text"
                    value={editHeaderForm.nome}
                    onChange={(e) => setEditHeaderForm({ ...editHeaderForm, nome: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 group">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-indigo-900 text-amber-300 font-bold px-2 py-0.5 rounded text-xs shadow-xs">
                    {localCpu.code}
                  </span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                    Unid: {localCpu.unidade}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-800 mt-1 flex items-center gap-2">
                  <span>{localCpu.nome}</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditHeaderForm({
                    code: localCpu.code,
                    nome: localCpu.nome,
                    unidade: localCpu.unidade
                  });
                  setIsEditingHeader(true);
                }}
                className="mt-0.5 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-transparent hover:border-indigo-200"
                title="Editar Nome, Código e Unidade da CPU"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              title="Excluir esta CPU da obra com confirmação"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Excluir CPU</span>
            </button>

            <button
              onClick={() => handleToggleVendaDefinida(!isVendaDefinida)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isVendaDefinida
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Alterna entre Preço Fixado Manualmente e Cálculo Automático via BDI"
            >
              <input
                type="checkbox"
                checked={isVendaDefinida}
                onChange={() => {}}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none"
              />
              <span>{isVendaDefinida ? 'Venda Definida (Manual)' : 'Venda Automática (BDI)'}</span>
            </button>

            <button
              onClick={() => exportarFichaCPU(localCpu, activeObra || undefined)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Ficha CPU</span>
            </button>

            <button
              onClick={handleSaveToFirebase}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveSuccess ? 'Salvo no Firebase!' : 'Salvar no Firebase'}</span>
            </button>
          </div>
        </div>

        {/* 1. PARAMETERS AND PRODUCTIVITY CALCULATOR */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Parâmetros de Produtividade e Cálculo</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* PT */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-blue-500">
              <label
                className="text-[11px] font-semibold text-slate-500 block mb-1"
                title="Produtividade Teórica Diária"
              >
                Teórica (PT) / dia
              </label>
              <input
                type="number"
                step="any"
                value={localCpu.prod_teorica}
                onChange={(e) => handleProductivityChange('prod_teorica', Number(e.target.value))}
                className="w-full text-base font-bold border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none bg-transparent"
              />
            </div>

            {/* Praticabilidade */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-purple-500">
              <label
                className="text-[11px] font-semibold text-slate-500 block mb-1"
                title="Fator de Praticabilidade"
              >
                Praticabilidade
              </label>
              <input
                type="number"
                step="any"
                value={localCpu.praticabilidade}
                onChange={(e) => handleProductivityChange('praticabilidade', Number(e.target.value))}
                className="w-full text-base font-bold border-b-2 border-slate-200 focus:border-purple-500 focus:outline-none bg-transparent"
              />
            </div>

            {/* HD */}
            <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-amber-500">
              <label
                className="text-[11px] font-semibold text-slate-500 block mb-1"
                title="Horas Trabalhadas por Dia"
              >
                Horas / Dia (HD)
              </label>
              <input
                type="number"
                step="any"
                value={localCpu.horas_dia}
                onChange={(e) => handleProductivityChange('horas_dia', Number(e.target.value))}
                className="w-full text-base font-bold border-b-2 border-slate-200 focus:border-amber-500 focus:outline-none bg-transparent"
              />
            </div>

            {/* P Efetiva */}
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-sm border-l-4 border-emerald-500 relative flex flex-col justify-between">
              <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                Efetiva (P) / h
              </label>
              <div className="text-xl font-extrabold text-emerald-300">
                {pEfetiva.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4
                })}
              </div>
              <Zap className="w-5 h-5 text-emerald-500/30 absolute top-3 right-3" />
            </div>
          </div>
        </div>

        {/* 2. SUMMARY VALUES BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-200/80 p-3 rounded-xl border border-slate-300 shadow-inner">
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <label className="text-[11px] font-bold text-amber-800 mb-0.5 block">Qtd Prevista</label>
            <input
              type="number"
              step="any"
              value={localCpu.quantidade_prevista}
              onChange={(e) => handleValueChange('quantidade_prevista', Number(e.target.value))}
              className="w-full text-base font-bold text-amber-950 border-b-2 border-amber-300 focus:border-amber-600 focus:outline-none bg-transparent"
            />
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Custo Unitário</label>
            <div className="text-base font-bold text-slate-800">{formatMoney(custoTotalUnitario)}</div>
          </div>

          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[11px] font-bold text-blue-900">Preço Venda Unit.</label>
              {isVendaDefinida ? (
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  Manual
                </span>
              ) : (
                <span className="text-[9px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded">
                  BDI {bdiObra.toFixed(1)}%
                </span>
              )}
            </div>

            {isVendaDefinida ? (
              <div>
                <input
                  type="number"
                  step="any"
                  value={localCpu.preco_venda}
                  onChange={(e) => handlePrecoVendaInputChange(Number(e.target.value))}
                  className="w-full text-base font-bold text-blue-950 border-b-2 border-blue-400 focus:border-blue-600 focus:outline-none bg-transparent"
                />
              </div>
            ) : (
              <div className="text-base font-bold text-blue-900">
                {formatMoney(precoVendaUnit)}
              </div>
            )}
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Custo Total</label>
            <div className="text-base font-bold text-slate-800">{formatMoney(custoTotalServico)}</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <label className="text-[11px] font-medium text-slate-500 mb-0.5 block">Venda Total</label>
            <div className="text-base font-bold text-blue-700">{formatMoney(vendaTotalServico)}</div>
          </div>

          <div className="bg-indigo-950 text-white p-2.5 rounded-lg flex flex-col justify-center border border-indigo-800">
            <label className="text-[10px] text-indigo-300 font-bold uppercase">Fator F/CD</label>
            <div
              className={`text-xl font-black ${
                fatorFcd < 1 ? 'text-red-400' : fatorFcd >= 1.2 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {fatorFcd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 3. MEMÓRIA DE CÁLCULO UNITÁRIA (INSUMOS TABLE) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Memória de Cálculo Unitária ({localCpu.insumos.length} Insumos)</span>
            </h3>

            <button
              onClick={onOpenModalInsumo}
              className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-1.5 rounded-lg font-bold shadow-sm border border-indigo-200 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inserir Insumo</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descrição do Insumo</th>
                  <th className="p-3 w-16 text-center">Unid.</th>
                  <th className="p-3 w-32 text-right">Coeficiente</th>
                  <th className="p-3 w-36 text-right">Preço Unit. (R$)</th>
                  <th className="p-3 w-36 text-right">Custo CPU (R$)</th>
                  <th className="p-3 w-10 text-center"></th>
                </tr>
              </thead>

              <tbody className="text-xs divide-y divide-slate-200">
                {localCpu.insumos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      Nenhum insumo inserido nesta CPU. Clique em "+ Inserir Insumo" para adicionar.
                    </td>
                  </tr>
                ) : (
                  localCpu.insumos.map((ins, index) => {
                    const isDynamic = ins.tipo === 'Equipamento' || ins.tipo === 'Mão de Obra';
                    const custoLinha = (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);

                    return (
                      <tr key={index} className="hover:bg-slate-50 transition">
                        {/* Tipo */}
                        <td className="p-3 whitespace-nowrap font-medium text-slate-600 flex items-center gap-1.5">
                          {ins.tipo === 'Equipamento' && <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {ins.tipo === 'Mão de Obra' && <HardHat className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                          {ins.tipo === 'Material' && <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          {ins.tipo === 'Terceirizado' && <Briefcase className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                          <span>{ins.tipo}</span>
                        </td>

                        {/* Descrição */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={ins.descricao}
                            onChange={(e) => handleUpdateInsumo(index, 'descricao', e.target.value)}
                            className="w-full bg-transparent focus:border-b border-indigo-500 outline-none text-slate-800 font-medium"
                          />
                        </td>

                        {/* Unidade */}
                        <td className="p-3 text-center">
                          <input
                            type="text"
                            value={ins.unid}
                            onChange={(e) => handleUpdateInsumo(index, 'unid', e.target.value)}
                            className="w-12 text-center bg-slate-100 p-1 rounded font-bold text-slate-700"
                          />
                        </td>

                        {/* Coeficiente */}
                        <td className="p-3">
                          <input
                            type="number"
                            step="any"
                            value={ins.coef}
                            onChange={(e) => handleUpdateInsumo(index, 'coef', e.target.value)}
                            className={`w-full px-2 py-1 rounded text-right font-mono font-bold ${
                              isDynamic
                                ? 'bg-amber-50 text-amber-950 border border-amber-200'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          />
                        </td>

                        {/* Preço Unitário */}
                        <td className="p-3">
                          <input
                            type="number"
                            step="any"
                            value={ins.pr_unit}
                            onChange={(e) => handleUpdateInsumo(index, 'pr_unit', e.target.value)}
                            className="w-full bg-slate-100 px-2 py-1 rounded text-right font-mono font-bold text-slate-800"
                          />
                        </td>

                        {/* Custo na CPU */}
                        <td className="p-3 text-right font-bold text-slate-800">
                          {formatMoney(custoLinha)}
                        </td>

                        {/* Delete */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveInsumo(index)}
                            className="text-slate-400 hover:text-red-600 p-1 transition"
                            title="Remover Insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-wrap justify-end gap-4 md:gap-6 text-xs text-slate-600 font-medium">
            <div>
              Equipamentos:{' '}
              <span className="font-bold text-slate-900">{formatMoney(subEqp)}</span>
            </div>
            <div>
              Mão de Obra:{' '}
              <span className="font-bold text-slate-900">{formatMoney(subMO)}</span>
            </div>
            <div>
              Materiais:{' '}
              <span className="font-bold text-slate-900">{formatMoney(subMat)}</span>
            </div>
            {subTerc > 0 && (
              <div>
                Terceirizados:{' '}
                <span className="font-bold text-teal-700">{formatMoney(subTerc)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. COMMENTS SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Comentários e Histórico da CPU ({localCpu.comentarios?.length || 0})</span>
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Adicione uma nota técnica ou observação sobre esta CPU..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComentario();
                  }
                }}
              />
              <button
                onClick={handleAddComentario}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
              >
                Enviar
              </button>
            </div>

            <div className="space-y-2.5">
              {localCpu.comentarios && localCpu.comentarios.length > 0 ? (
                localCpu.comentarios.map((c, i) => (
                  <div key={i} className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs">
                    <div className="flex justify-between font-bold text-indigo-900 mb-1">
                      <span>{c.autor}</span>
                      <span className="font-normal text-[10px] text-indigo-400">{c.data}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.texto}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Nenhum comentário adicionado ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalConfirmarExclusaoCPU
        isOpen={showDeleteModal}
        cpu={localCpu}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={onDeleteCpu}
      />
    </div>
  );
};
