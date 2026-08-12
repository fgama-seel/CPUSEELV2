import React, { useState, useEffect } from 'react';
import { Settings, Save, X, Calculator, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { Obra, OrcamentoOriginal } from '../types';
import { saveObra } from '../services/dbService';

interface ModalConfigOrcamentoProps {
  isOpen: boolean;
  obra: Obra | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const ModalConfigOrcamento: React.FC<ModalConfigOrcamentoProps> = ({
  isOpen,
  obra,
  onClose,
  onSaveSuccess,
}) => {
  const [fatDiretoAtual, setFatDiretoAtual] = useState<number>(0);
  const [custoIndiretoAtual, setCustoIndiretoAtual] = useState<number>(0);

  // Orçado Original fields
  const [vendaTotal, setVendaTotal] = useState<number>(0);
  const [fatDireto, setFatDireto] = useState<number>(0);
  const [vendaSemFat, setVendaSemFat] = useState<number>(0);
  const [custoDireto, setCustoDireto] = useState<number>(0);
  const [custoIndireto, setCustoIndireto] = useState<number>(0);
  const [pis, setPis] = useState<number>(0);
  const [cofins, setCofins] = useState<number>(0);
  const [iss, setIss] = useState<number>(0);
  const [vendaLiquida, setVendaLiquida] = useState<number>(0);
  const [resultado, setResultado] = useState<number>(0);
  const [margem, setMargem] = useState<number>(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (obra) {
      setFatDiretoAtual(obra.faturamentoDiretoAtual || 0);
      setCustoIndiretoAtual(obra.custoIndiretoAtual || 0);

      const orig = obra.orcamentoOriginal || {
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
        margem: 21.87,
      };

      setVendaTotal(orig.vendaTotal);
      setFatDireto(orig.fatDireto);
      setVendaSemFat(orig.vendaSemFat);
      setCustoDireto(orig.custoDireto);
      setCustoIndireto(orig.custoIndireto);
      setPis(orig.pis);
      setCofins(orig.cofins);
      setIss(orig.iss);
      setVendaLiquida(orig.vendaLiquida);
      setResultado(orig.resultado);
      setMargem(orig.margem);
    }
  }, [obra, isOpen]);

  // Auto-calculate derived fields on edit if user changes main parameters
  const handleAutoCalculate = () => {
    const calcVendaSemFat = Math.max(0, vendaTotal - fatDireto);
    setVendaSemFat(calcVendaSemFat);

    const calcPis = calcVendaSemFat * 0.03;
    const calcCofins = calcVendaSemFat * 0.0065;
    const calcIss = calcVendaSemFat * 0.03;
    setPis(calcPis);
    setCofins(calcCofins);
    setIss(calcIss);

    const calcTotalImpostos = calcPis + calcCofins + calcIss;
    const calcVendaLiquida = calcVendaSemFat - calcTotalImpostos;
    setVendaLiquida(calcVendaLiquida);

    const calcCustoTotal = custoDireto + custoIndireto;
    const calcResultado = calcVendaLiquida - calcCustoTotal;
    setResultado(calcResultado);

    const calcMargem = calcVendaLiquida > 0 ? (calcResultado / calcVendaLiquida) * 100 : 0;
    setMargem(calcMargem);
  };

  if (!isOpen || !obra) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedOrcamento: OrcamentoOriginal = {
      vendaTotal: Number(vendaTotal) || 0,
      fatDireto: Number(fatDireto) || 0,
      vendaSemFat: Number(vendaSemFat) || 0,
      custoDireto: Number(custoDireto) || 0,
      custoIndireto: Number(custoIndireto) || 0,
      custoTotal: (Number(custoDireto) || 0) + (Number(custoIndireto) || 0),
      pis: Number(pis) || 0,
      cofins: Number(cofins) || 0,
      iss: Number(iss) || 0,
      vendaLiquida: Number(vendaLiquida) || 0,
      resultado: Number(resultado) || 0,
      margem: Number(margem) || 0,
    };

    const updatedObra: Obra = {
      ...obra,
      faturamentoDiretoAtual: Number(fatDiretoAtual) || 0,
      custoIndiretoAtual: Number(custoIndiretoAtual) || 0,
      orcamentoOriginal: updatedOrcamento,
    };

    try {
      await saveObra(updatedObra);
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar orçamentos da obra:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/40">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Configurações do Contrato & Orçado</h3>
              <p className="text-xs text-slate-400">
                Ajuste os valores atuais e metas do orçamento base para a obra{' '}
                <span className="text-blue-400 font-bold">{obra.nome}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Seção 1: Valores Atuais da Obra */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              1. Valores Atuais do Contrato
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Valor do Faturamento Direto Atual (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fatDiretoAtual}
                  onChange={(e) => setFatDiretoAtual(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="0,00"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Descontado do faturamento bruto direto para faturamento s/ faturamento.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Valor do Custo Indireto Total Atual (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={custoIndiretoAtual}
                  onChange={(e) => setCustoIndiretoAtual(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="0,00"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Custo indireto de canteiro, supervisão e apoio operacional.
                </span>
              </div>
            </div>
          </div>

          {/* Seção 2: Metas do Orçamento Original */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                2. Informações do Orçamento Original (Base de Comparação)
              </h4>

              <button
                type="button"
                onClick={handleAutoCalculate}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded border border-blue-200 flex items-center gap-1 transition"
                title="Recalcular impostos, venda líquida e resultado orçado automaticamente com base nos valores base"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Recalcular Derivados</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Venda Total Bruta Orçada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={vendaTotal}
                  onChange={(e) => setVendaTotal(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Fat. Direto Orçado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fatDireto}
                  onChange={(e) => setFatDireto(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Venda s/ Fat. Orçada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={vendaSemFat}
                  onChange={(e) => setVendaSemFat(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Custo Direto Orçado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={custoDireto}
                  onChange={(e) => setCustoDireto(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Custo Indireto Orçado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={custoIndireto}
                  onChange={(e) => setCustoIndireto(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Custo Total Orçado (R$)
                </label>
                <input
                  type="number"
                  disabled
                  value={custoDireto + custoIndireto}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Impostos e Resultado */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Detalhamento de Impostos e DRE Orçado
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">PIS Orçado (3%)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={pis}
                    onChange={(e) => setPis(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">COFINS Orçado (0.65%)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cofins}
                    onChange={(e) => setCofins(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">ISS Orçado (3%)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={iss}
                    onChange={(e) => setIss(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Venda Líquida Orçada (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={vendaLiquida}
                    onChange={(e) => setVendaLiquida(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Resultado Operacional Orçado (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={resultado}
                    onChange={(e) => setResultado(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Margem Operacional Orçada (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={margem}
                    onChange={(e) => setMargem(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
