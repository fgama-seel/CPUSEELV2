import React from 'react';
import { X, Printer, FileSpreadsheet, Briefcase, HardHat, DollarSign, Percent, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Obra, MochilaMOInsumo, InsumoBase, ItemMochila } from '../types';
import { formatMoney, exportarRelatorioMochilaMO } from '../lib/excelExport';

interface ModalRelatorioMochilaAbertaProps {
  isOpen: boolean;
  onClose: () => void;
  mochila: MochilaMOInsumo | null;
  activeObra: Obra | null;
  insumoBase?: InsumoBase | null;
}

export const ModalRelatorioMochilaAberta: React.FC<ModalRelatorioMochilaAbertaProps> = ({
  isOpen,
  onClose,
  mochila,
  activeObra,
  insumoBase
}) => {
  if (!isOpen || !mochila) return null;

  const horasMes = mochila.horasMes || 189.2;
  const insumoNome = mochila.insumoDescricao || insumoBase?.descricao || 'Mão de Obra';
  const insumoCod = mochila.insumoCodigo || insumoBase?.id_insumo || insumoBase?.id || '-';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  const configEnc = activeObra?.configEncargos;
  const grupoA = configEnc?.detalhesGrupos?.grupoA ?? 16.8;
  const grupoB = configEnc?.detalhesGrupos?.grupoB ?? 48.2;
  const grupoC = configEnc?.detalhesGrupos?.grupoC ?? 4.5;
  const grupoD = configEnc?.detalhesGrupos?.grupoD ?? 5.5;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportarRelatorioMochilaMO(mochila, activeObra, insumoBase);
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-60 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[96vh] overflow-hidden border border-slate-300">
        
        {/* MODAL CONTROLS (Hidden on Print) */}
        <div className="print:hidden px-6 py-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-400/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg leading-tight">
                Relatório de Composição Aberta da Mão de Obra & Mochila
              </h3>
              <p className="text-xs text-slate-400">
                Visualização formatada para apresentação ao cliente e auditoria de custos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Baixar planilha formatada em Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Imprimir ou Salvar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 text-slate-900 print:bg-white print:p-0 print:overflow-visible font-sans text-xs">
          
          {/* Printable Container / Sheet */}
          <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
            
            {/* Header / Brand */}
            <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-900 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  DEMONSTRATIVO DE CUSTO HORÁRIO
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                  Composição Aberta da Mão de Obra
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Memória de Cálculo Detalhada de Salário, Encargos Sociais e Mochila de Benefícios
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="text-[11px] font-bold text-slate-500">Emissão: <span className="text-slate-800">{dataHoje}</span></div>
                <div className="text-[11px] font-bold text-slate-500">Divisor: <span className="text-slate-800 font-mono">{horasMes} h/mês</span></div>
                <div className="text-[11px] font-bold text-slate-500">BDI Obra: <span className="text-slate-800 font-mono">{activeObra?.bdi ?? 25}%</span></div>
              </div>
            </div>

            {/* Meta Cards: Obra & Insumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Dados da Obra</span>
                <div className="font-bold text-sm text-slate-900">{activeObra?.codigo} - {activeObra?.nome}</div>
                <div className="text-xs text-slate-600 mt-0.5">Cliente: <strong className="text-slate-800">{activeObra?.cliente || 'Não informado'}</strong></div>
              </div>

              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase block mb-1">Mão de Obra Analisada</span>
                <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span className="font-mono bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-bold">{insumoCod}</span>
                  <span>{insumoNome}</span>
                </div>
                <div className="text-xs text-slate-700 mt-0.5">Unidade de Apropriação: <strong>HORA (h)</strong></div>
              </div>
            </div>

            {/* Quadro 1: Base Salarial e Adicionais */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wide text-indigo-950 flex items-center gap-1.5 pb-1 border-b border-indigo-100">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>1. Base Salarial & Adicionais Contratuais</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-600 border-y border-slate-200">
                      <th className="py-1.5 px-3">Item / Rubrica</th>
                      <th className="py-1.5 px-3">Base / Referência</th>
                      <th className="py-1.5 px-3 text-right">Alíquota / Valor</th>
                      <th className="py-1.5 px-3 text-right">Custo Horário (R$/h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-800">Salário Base Mensal / Horário</td>
                      <td className="py-1.5 px-3 text-slate-600">{horasMes} horas/mês</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium">{formatMoney(mochila.salarioMes || 0)} /mês</td>
                      <td className="py-1.5 px-3 text-right font-mono font-extrabold text-slate-900">{formatMoney(mochila.salarioHora || 0)}</td>
                    </tr>
                    {mochila.adicionais?.dissidio ? (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">Dissídio / Reajuste Convencionado</td>
                        <td className="py-1.5 px-3 text-slate-500">Sobre Salário Base</td>
                        <td className="py-1.5 px-3 text-right font-mono">{mochila.adicionais.dissidio}%</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatMoney((mochila.salarioHora || 0) * (mochila.adicionais.dissidio / 100))}
                        </td>
                      </tr>
                    ) : null}
                    {mochila.adicionais?.ajudaDeCusto ? (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">Ajuda de Custo Contratual</td>
                        <td className="py-1.5 px-3 text-slate-500">Sobre Salário Base</td>
                        <td className="py-1.5 px-3 text-right font-mono">{mochila.adicionais.ajudaDeCusto}%</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatMoney((mochila.salarioHora || 0) * (mochila.adicionais.ajudaDeCusto / 100))}
                        </td>
                      </tr>
                    ) : null}
                    {mochila.adicionais?.horaExtra ? (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">Provisão de Horas Extras</td>
                        <td className="py-1.5 px-3 text-slate-500">Sobre Salário Base</td>
                        <td className="py-1.5 px-3 text-right font-mono">{mochila.adicionais.horaExtra}%</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatMoney((mochila.salarioHora || 0) * (mochila.adicionais.horaExtra / 100))}
                        </td>
                      </tr>
                    ) : null}
                    {mochila.adicionais?.adicionalNoturno ? (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">Adicional Noturno</td>
                        <td className="py-1.5 px-3 text-slate-500">Sobre Salário Base</td>
                        <td className="py-1.5 px-3 text-right font-mono">{mochila.adicionais.adicionalNoturno}%</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatMoney((mochila.salarioHora || 0) * (mochila.adicionais.adicionalNoturno / 100))}
                        </td>
                      </tr>
                    ) : null}
                    {mochila.adicionais?.periculosidade ? (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">Adicional de Periculosidade</td>
                        <td className="py-1.5 px-3 text-slate-500">Sobre Salário Base</td>
                        <td className="py-1.5 px-3 text-right font-mono">{mochila.adicionais.periculosidade}%</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatMoney((mochila.salarioHora || 0) * (mochila.adicionais.periculosidade / 100))}
                        </td>
                      </tr>
                    ) : null}
                    {mochila.adicionais?.insalubridade ? (
                      <tr>
                        <td className="py-1.5 px-3 text-slate-700">Adicional de Insalubridade</td>
                        <td className="py-1.5 px-3 text-slate-500">Sobre Salário Base</td>
                        <td className="py-1.5 px-3 text-right font-mono">{mochila.adicionais.insalubridade}%</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatMoney((mochila.salarioHora || 0) * (mochila.adicionais.insalubridade / 100))}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="bg-indigo-50/70 font-extrabold text-indigo-950 border-t border-indigo-200">
                      <td className="py-2 px-3" colSpan={3}>SUBTOTAL SALÁRIO COM ADICIONAIS (A)</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-indigo-900">
                        {formatMoney(mochila.salarioComAdicionaisHora || mochila.salarioHora || 0)}/h
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quadro 2: Encargos Sociais */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wide text-indigo-950 flex items-center gap-1.5 pb-1 border-b border-indigo-100">
                <Percent className="w-4 h-4 text-indigo-600" />
                <span>2. Encargos Sociais e Trabalhistas</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-600 border-y border-slate-200">
                      <th className="py-1.5 px-3">Discriminação</th>
                      <th className="py-1.5 px-3">Incidência</th>
                      <th className="py-1.5 px-3 text-right">Alíquota (%)</th>
                      <th className="py-1.5 px-3 text-right">Custo Horário (R$/h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-800">
                        Encargos Sociais Totais (Grupos A, B, C e D)
                      </td>
                      <td className="py-2 px-3 text-slate-600">Sobre Salário c/ Adicionais</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-900">{mochila.encargoPerc || 75}%</td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-900">{formatMoney(mochila.custoHoraEncargo || 0)}</td>
                    </tr>
                    <tr className="bg-indigo-50/70 font-extrabold text-indigo-950 border-t border-indigo-200">
                      <td className="py-2 px-3" colSpan={3}>SUBTOTAL SALÁRIO + ENCARGOS SOCIAIS (B = A + Encargos)</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-indigo-900">
                        {formatMoney(mochila.salarioComEncargoHora || 0)}/h
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quadro 3: Mochila Aberta */}
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-1 border-b border-amber-200">
                <h2 className="text-xs font-black uppercase tracking-wide text-amber-950 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>3. Demonstrativo Aberto da Mochila (Benefícios & Custos Indiretos)</span>
                </h2>
                <span className="text-[11px] font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Total: {formatMoney(mochila.custoHoraMochila || 0)}/h ({formatMoney(mochila.custoMesMochila || 0)}/mês)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-600 border-b border-slate-200">
                      <th className="py-1.5 px-3">Item / Descrição</th>
                      <th className="py-1.5 px-2">Categoria</th>
                      <th className="py-1.5 px-2 text-center">Unid.</th>
                      <th className="py-1.5 px-2 text-right">Qtd/Mês</th>
                      <th className="py-1.5 px-2 text-right">Pr. Unit. (R$)</th>
                      <th className="py-1.5 px-3 text-right">Custo Mês (R$)</th>
                      <th className="py-1.5 px-3 text-right">Custo / Hora (R$/h)</th>
                      <th className="py-1.5 px-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {mochila.itens && mochila.itens.length > 0 ? (
                      mochila.itens.map((it: ItemMochila, idx: number) => {
                        const qtd = Number(it.quantidade) || 0;
                        const preco = Number(it.valorUnitario) || 0;
                        const custoMes = Number(it.custoMensal) || qtd * preco;
                        const custoHora = Number(it.custoHora) || custoMes / horasMes;
                        const perc = (mochila.custoMesMochila || 0) > 0 ? (custoMes / (mochila.custoMesMochila || 1)) * 100 : 0;

                        return (
                          <tr key={it.id || idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{it.descricao}</td>
                            <td className="py-1.5 px-2 text-[10px] font-bold text-slate-500 uppercase">{it.categoria}</td>
                            <td className="py-1.5 px-2 text-center text-slate-500 font-mono">{it.unidade}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-slate-700">{qtd}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-slate-700">{formatMoney(preco)}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">{formatMoney(custoMes)}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-900">{formatMoney(custoHora)}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-slate-500 text-[10px]">{perc.toFixed(1)}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-slate-400">Nenhum item adicionado na mochila</td>
                      </tr>
                    )}
                    <tr className="bg-amber-100/70 font-extrabold text-amber-950 border-t border-amber-300">
                      <td className="py-2 px-3" colSpan={5}>SUBTOTAL MOCHILA / BENEFÍCIOS (C)</td>
                      <td className="py-2 px-3 text-right font-mono text-xs">{formatMoney(mochila.custoMesMochila || 0)}</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-amber-950">{formatMoney(mochila.custoHoraMochila || 0)}/h</td>
                      <td className="py-2 px-2 text-right font-mono text-[11px]">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quadro 4: Resumo Final Consolidado */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
              <span className="text-[10px] font-mono tracking-widest text-amber-300 font-extrabold uppercase block mb-1">
                4. RESUMO CONSOLIDADO DO CUSTO HORÁRIO FINAL
              </span>
              <h3 className="text-lg font-black tracking-tight mb-4">
                Totalização do Custo da Mão de Obra por Hora
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300">1. Salário + Adicionais</div>
                  <div className="text-sm font-black font-mono mt-1 text-white">
                    {formatMoney(mochila.salarioComAdicionaisHora || mochila.salarioHora || 0)}/h
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatMoney((mochila.salarioComAdicionaisHora || mochila.salarioHora || 0) * horasMes)}/mês
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-300">2. Encargos ({mochila.encargoPerc || 75}%)</div>
                  <div className="text-sm font-black font-mono mt-1 text-white">
                    {formatMoney(mochila.custoHoraEncargo || 0)}/h
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatMoney((mochila.custoHoraEncargo || 0) * horasMes)}/mês
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-amber-300">3. Mochila / Benefícios</div>
                  <div className="text-sm font-black font-mono mt-1 text-amber-300">
                    {formatMoney(mochila.custoHoraMochila || 0)}/h
                  </div>
                  <div className="text-[10px] text-amber-200/80 mt-0.5">
                    {formatMoney(mochila.custoMesMochila || 0)}/mês
                  </div>
                </div>

                <div className="bg-amber-400 text-slate-950 p-3 rounded-xl border border-amber-300 shadow-sm flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-black tracking-wider text-slate-900">CUSTO TOTAL FINAL (1+2+3)</div>
                  <div className="text-base sm:text-lg font-black font-mono mt-0.5 text-slate-950 leading-tight">
                    {formatMoney(mochila.salarioEncargoMochilaHora || 0)} <span className="text-xs">/ h</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                    {formatMoney((mochila.salarioEncargoMochilaHora || 0) * horasMes)} / mês
                  </div>
                </div>
              </div>
            </div>

            {/* Demonstrativo de Grupos de Encargos (A, B, C, D) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Demonstrativo Analítico dos Grupos de Encargos Sociais da Obra:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block">Grupo A (Básicos)</span>
                  <span className="font-mono font-black text-indigo-900">{grupoA}%</span>
                  <span className="text-slate-500 block text-[9px]">INSS, FGTS, SESI, SENAI, SEBRAE</span>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block">Grupo B (Recebem Incidência)</span>
                  <span className="font-mono font-black text-indigo-900">{grupoB}%</span>
                  <span className="text-slate-500 block text-[9px]">Férias, 13º, DSR, Feriados</span>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block">Grupo C (Sem Incidência)</span>
                  <span className="font-mono font-black text-indigo-900">{grupoC}%</span>
                  <span className="text-slate-500 block text-[9px]">Aviso Prévio Indenizado, Rescisão</span>
                </div>
                <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block">Grupo D (Reincidência A/B)</span>
                  <span className="font-mono font-black text-indigo-900">{grupoD}%</span>
                  <span className="text-slate-500 block text-[9px]">Incidência Cumulativa de A sobre B</span>
                </div>
              </div>
            </div>

            {/* Signature / Validation Footer */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
              <div>
                <div className="border-t border-slate-300 w-3/4 mx-auto mb-1 mt-6"></div>
                <div className="font-bold text-slate-700">Responsável pelo Orçamento / Engenharia</div>
                <div>{activeObra?.nome}</div>
              </div>
              <div>
                <div className="border-t border-slate-300 w-3/4 mx-auto mb-1 mt-6"></div>
                <div className="font-bold text-slate-700">Aprovação / Cliente</div>
                <div>{activeObra?.cliente || 'Cliente'}</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
