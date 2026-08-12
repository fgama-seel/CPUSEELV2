import React, { useState } from 'react';
import {
  PieChart,
  Coins,
  Wrench,
  Percent,
  Trophy,
  RefreshCw,
  Edit2,
  Check,
  Info,
  Settings,
  Database,
  Upload
} from 'lucide-react';
import { Obra, CPU } from '../types';
import { formatMoney } from '../lib/excelExport';
import { saveObra } from '../services/dbService';
import { ModalConfigOrcamento } from './ModalConfigOrcamento';
import { ModalImportarBD } from './ModalImportarBD';

interface AbaResumoProps {
  activeObra: Obra | null;
  cpus: CPU[];
  onRefresh: () => void;
}

export const AbaResumo: React.FC<AbaResumoProps> = ({ activeObra, cpus, onRefresh }) => {
  const [editingIndireto, setEditingIndireto] = useState(false);
  const [indiretoValue, setIndiretoValue] = useState<number>(activeObra?.custoIndiretoAtual || 0);

  const [editingFatDireto, setEditingFatDireto] = useState(false);
  const [fatDiretoValue, setFatDiretoValue] = useState<number>(activeObra?.faturamentoDiretoAtual || 0);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-slate-500">
        <PieChart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700">Nenhuma obra selecionada</h3>
        <p className="text-sm">Selecione uma obra no menu lateral para visualizar o resumo do contrato.</p>
      </div>
    );
  }

  // Calculate live values from active CPUs
  let custoDiretoCalculado = 0;
  let vendaTotalCalculada = 0;

  cpus.forEach((cpu) => {
    const qtd = Number(cpu.quantidade_prevista) || 1;
    const precoVenda = Number(cpu.preco_venda) || 0;
    vendaTotalCalculada += precoVenda * qtd;

    let custoUnt = 0;
    if (cpu.insumos) {
      cpu.insumos.forEach((ins) => {
        custoUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }
    custoDiretoCalculado += custoUnt * qtd;
  });

  const fatDireto = editingFatDireto ? fatDiretoValue : (activeObra.faturamentoDiretoAtual || 0);
  const vendaSemFat = Math.max(0, vendaTotalCalculada - fatDireto);

  const custoIndireto = editingIndireto ? indiretoValue : (activeObra.custoIndiretoAtual || 0);
  const custoTotal = custoDiretoCalculado + custoIndireto;

  // Taxes calculation on Venda Sem Faturamento
  const pis = vendaSemFat * 0.03; // 3%
  const cofins = vendaSemFat * 0.0065; // 0.65%
  const iss = vendaSemFat * 0.03; // 3%
  const totalImpostos = pis + cofins + iss;

  const vendaLiquida = vendaSemFat - totalImpostos;
  const resultado = vendaLiquida - custoTotal;
  const margemPercent = vendaLiquida > 0 ? (resultado / vendaLiquida) * 100 : 0;

  // Baseline values
  const orig = activeObra.orcamentoOriginal || {
    vendaTotal: 50400000.0,
    fatDireto: 2449175.32,
    vendaSemFat: 47950824.68,
    custoDireto: 21227185.06,
    custoIndireto: 13744327.94,
    custoTotal: 34971513.0,
    pis: 1438524.74,
    cofins: 311680.36,
    iss: 1438524.74,
    vendaLiquida: 44762094.84,
    resultado: 9790581.84,
    margem: 21.87
  };

  const handleSaveIndireto = async () => {
    if (!activeObra) return;
    const updatedObra: Obra = {
      ...activeObra,
      custoIndiretoAtual: Number(indiretoValue) || 0
    };
    await saveObra(updatedObra);
    setEditingIndireto(false);
  };

  const handleSaveFatDireto = async () => {
    if (!activeObra) return;
    const updatedObra: Obra = {
      ...activeObra,
      faturamentoDiretoAtual: Number(fatDiretoValue) || 0
    };
    await saveObra(updatedObra);
    setEditingFatDireto(false);
  };

  function renderDiff(atual: number, original: number, isCost: boolean = false, isPercent: boolean = false) {
    const diff = atual - original;
    if (Math.abs(diff) < 0.01) {
      return <span className="ml-1 font-bold text-slate-400">(=)</span>;
    }
    const isBad = isCost ? diff > 0 : diff < 0;
    const colorClass = isBad ? 'text-red-500' : 'text-emerald-500';
    const prefix = diff > 0 ? '+' : '';
    const formatted = isPercent ? `${prefix}${diff.toFixed(2)}%` : `${prefix}${formatMoney(diff)}`;

    return <span className={`ml-1 font-bold ${colorClass}`}>(Δ {formatted})</span>;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-indigo-600 gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Visão Geral de Custos e Desvios - {activeObra.nome}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores calculados em tempo real a partir das CPUs do Firestore comparados ao Orçamento Original do Contrato.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              title="Configurar valores orçados e faturamento direto"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Configurar Orçamento</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              title="Importar composições e banco de insumos BD CPU"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Importar BD CPU</span>
            </button>

            <button
              onClick={onRefresh}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* 4 Core Summary Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Receitas e Faturamento */}
          <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
            <h4 className="font-bold text-blue-900 border-b border-blue-100 pb-2.5 mb-4 flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-blue-600" />
              <span>Receitas e Faturamento</span>
            </h4>

            {/* Venda Total Bruta */}
            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2.5">
              <span className="text-slate-600 font-medium text-xs">Venda Total Bruta</span>
              <div className="text-right">
                <div className="font-bold text-base text-slate-800 leading-none">
                  {formatMoney(vendaTotalCalculada)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.vendaTotal)}</span>{' '}
                  {renderDiff(vendaTotalCalculada, orig.vendaTotal, false)}
                </div>
              </div>
            </div>

            {/* Faturamento Direto */}
            <div className="flex justify-between items-center mb-3 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
              <div className="flex items-center gap-1.5">
                <span className="text-blue-900 font-bold text-xs">(-) Faturamento Direto</span>
                {!editingFatDireto ? (
                  <button
                    onClick={() => {
                      setFatDiretoValue(activeObra.faturamentoDiretoAtual || 0);
                      setEditingFatDireto(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-0.5"
                    title="Editar Faturamento Direto"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveFatDireto}
                    className="bg-blue-600 text-white p-0.5 rounded"
                    title="Salvar"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="text-right">
                {editingFatDireto ? (
                  <input
                    type="number"
                    value={fatDiretoValue}
                    onChange={(e) => setFatDiretoValue(Number(e.target.value) || 0)}
                    className="w-32 text-right border p-1 rounded font-bold text-xs bg-white text-blue-900"
                  />
                ) : (
                  <div className="font-bold text-base text-blue-900 leading-none">
                    {formatMoney(fatDireto)}
                  </div>
                )}
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.fatDireto)}</span>{' '}
                  {renderDiff(fatDireto, orig.fatDireto, false)}
                </div>
              </div>
            </div>

            {/* Venda s/ Faturamento */}
            <div className="flex justify-between items-start mt-4 pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-700 text-xs">Venda s/ Faturamento</span>
              <div className="text-right">
                <div className="font-black text-lg text-blue-600 leading-none">
                  {formatMoney(vendaSemFat)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.vendaSemFat)}</span>{' '}
                  {renderDiff(vendaSemFat, orig.vendaSemFat, false)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Estrutura de Custos */}
          <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-amber-500">
            <h4 className="font-bold text-amber-900 border-b border-amber-100 pb-2.5 mb-4 flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Estrutura de Custos</span>
            </h4>

            {/* Custo Direto Total CPU */}
            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2.5">
              <span className="text-slate-600 font-medium text-xs">Custo Direto Total CPU</span>
              <div className="text-right">
                <div className="font-bold text-base text-slate-800 leading-none">
                  {formatMoney(custoDiretoCalculado)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.custoDireto)}</span>{' '}
                  {renderDiff(custoDiretoCalculado, orig.custoDireto, true)}
                </div>
              </div>
            </div>

            {/* Custo Indireto Total */}
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium text-xs">Custo Indireto Total</span>
                {!editingIndireto ? (
                  <button
                    onClick={() => {
                      setIndiretoValue(activeObra.custoIndiretoAtual || 0);
                      setEditingIndireto(true);
                    }}
                    className="text-amber-600 hover:text-amber-800 p-0.5"
                    title="Editar Custo Indireto"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveIndireto}
                    className="bg-amber-600 text-white p-0.5 rounded"
                    title="Salvar"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="text-right">
                {editingIndireto ? (
                  <input
                    type="number"
                    value={indiretoValue}
                    onChange={(e) => setIndiretoValue(Number(e.target.value) || 0)}
                    className="w-32 text-right border p-1 rounded font-bold text-xs bg-white text-amber-900"
                  />
                ) : (
                  <div className="font-bold text-base text-slate-800 leading-none">
                    {formatMoney(custoIndireto)}
                  </div>
                )}
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.custoIndireto)}</span>{' '}
                  {renderDiff(custoIndireto, orig.custoIndireto, true)}
                </div>
              </div>
            </div>

            {/* Custo Total Global */}
            <div className="flex justify-between items-start mt-4 pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-700 text-xs">Custo Total Global</span>
              <div className="text-right">
                <div className="font-black text-lg text-amber-600 leading-none">
                  {formatMoney(custoTotal)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.custoTotal)}</span>{' '}
                  {renderDiff(custoTotal, orig.custoTotal, true)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Impostos */}
          <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-red-500">
            <h4 className="font-bold text-red-900 border-b border-red-100 pb-2.5 mb-4 flex items-center gap-2 text-sm">
              <Percent className="w-4 h-4 text-red-600" />
              <span>Impostos sobre Venda s/ Faturamento</span>
            </h4>

            {/* PIS */}
            <div className="flex justify-between items-start mb-2.5 border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium text-xs">PIS (3%)</span>
              <div className="text-right">
                <div className="font-bold text-slate-800 text-xs leading-none">
                  {formatMoney(pis)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.pis)}</span> {renderDiff(pis, orig.pis, true)}
                </div>
              </div>
            </div>

            {/* COFINS */}
            <div className="flex justify-between items-start mb-2.5 border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium text-xs">COFINS (0.65%)</span>
              <div className="text-right">
                <div className="font-bold text-slate-800 text-xs leading-none">
                  {formatMoney(cofins)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.cofins)}</span> {renderDiff(cofins, orig.cofins, true)}
                </div>
              </div>
            </div>

            {/* ISS */}
            <div className="flex justify-between items-start mb-2.5 border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium text-xs">ISS (3%)</span>
              <div className="text-right">
                <div className="font-bold text-slate-800 text-xs leading-none">
                  {formatMoney(iss)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.iss)}</span> {renderDiff(iss, orig.iss, true)}
                </div>
              </div>
            </div>

            {/* Total Impostos */}
            <div className="flex justify-between items-start mt-3 pt-2.5 border-t border-slate-200">
              <span className="font-bold text-slate-700 text-xs">Total de Impostos</span>
              <div className="text-right">
                <div className="font-bold text-base text-red-600 leading-none">
                  {formatMoney(totalImpostos)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orçado: <span>{formatMoney(orig.pis + orig.cofins + orig.iss)}</span>{' '}
                  {renderDiff(totalImpostos, orig.pis + orig.cofins + orig.iss, true)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: DRE / Resultado do Contrato (Dark Theme) */}
          <div className="bg-slate-900 text-white rounded-xl shadow-lg p-5 border-t-4 border-emerald-500 relative overflow-hidden flex flex-col justify-between">
            <Trophy className="absolute -bottom-6 -right-6 text-slate-800/80 w-36 h-36 pointer-events-none" />

            <div>
              <h4 className="font-bold text-emerald-400 border-b border-slate-800 pb-2.5 mb-4 flex items-center gap-2 text-sm relative z-10">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>DRE / Resultado do Contrato</span>
              </h4>

              {/* Venda Líquida */}
              <div className="flex justify-between items-start mb-4 relative z-10 border-b border-slate-800 pb-3">
                <span className="text-slate-300 font-medium text-xs">Venda Líquida</span>
                <div className="text-right">
                  <div className="font-bold text-base text-white leading-none">
                    {formatMoney(vendaLiquida)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Orçado: <span className="text-slate-300">{formatMoney(orig.vendaLiquida)}</span>{' '}
                    {renderDiff(vendaLiquida, orig.vendaLiquida, false)}
                  </div>
                </div>
              </div>

              {/* Resultado Operacional */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="font-bold text-emerald-300 text-xs">Resultado Operacional</span>
                <div className="text-right">
                  <div
                    className={`font-black text-2xl leading-none ${
                      resultado >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(resultado)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Orçado: <span className="text-slate-300">{formatMoney(orig.resultado)}</span>{' '}
                    {renderDiff(resultado, orig.resultado, false)}
                  </div>
                </div>
              </div>

              {/* Margem Operacional */}
              <div className="flex justify-between items-center relative z-10">
                <span className="font-bold text-slate-400 text-xs">Margem Operacional</span>
                <div className="text-right flex flex-col items-end">
                  <div
                    className={`font-black text-lg px-2.5 py-1 rounded-lg border ${
                      resultado >= 0
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-red-950 text-red-300 border-red-800'
                    }`}
                  >
                    {margemPercent.toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Orçado: <span className="text-slate-300">{orig.margem.toFixed(2)}%</span>{' '}
                    {renderDiff(margemPercent, orig.margem, false, true)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-4 text-right opacity-70 relative z-10">
              *Desvios em vermelho indicam impacto negativo no resultado do contrato.
            </p>
          </div>
        </div>

        {/* Modals */}
        <ModalConfigOrcamento
          isOpen={showConfigModal}
          obra={activeObra}
          onClose={() => setShowConfigModal(false)}
          onSaveSuccess={onRefresh}
        />

        <ModalImportarBD
          isOpen={showImportModal}
          obra={activeObra}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={onRefresh}
        />
      </div>
    </div>
  );
};
