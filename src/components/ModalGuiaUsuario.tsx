import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  BookOpen,
  X,
  Building,
  Calculator,
  Boxes,
  BarChart3,
  PieChart,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  ChevronRight,
  RefreshCw,
  HardHat,
  Info,
  Download,
  PlusCircle,
  Upload,
  Settings,
  ShieldCheck,
  Receipt,
  Percent,
  Sliders,
  Database,
  Server,
  Radio,
  Trash2
} from 'lucide-react';

interface ModalGuiaUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

export const ModalGuiaUsuario: React.FC<ModalGuiaUsuarioProps> = ({
  isOpen,
  onClose
}) => {
  const [activeMenu, setActiveMenu] = useState<string>('geral');

  if (!isOpen) return null;

  const baixarModeloInsumos = () => {
    const dados = [
      {
        'ID Insumo': 'MAT-001',
        Tipo: 'Material',
        Descrição: 'Cimento Portland CP-II (saco 50kg)',
        Unidade: 'sc',
        'Preço Unitário (R$)': 42.50
      },
      {
        'ID Insumo': 'MO-001',
        Tipo: 'Mão de Obra',
        Descrição: 'Pedreiro de Obra',
        Unidade: 'h',
        'Preço Unitário (R$)': 28.00
      },
      {
        'ID Insumo': 'EQP-001',
        Tipo: 'Equipamento',
        Descrição: 'Caminhão Munck 12t',
        Unidade: 'h',
        'Preço Unitário (R$)': 180.00
      },
      {
        'ID Insumo': 'TERC-001',
        Tipo: 'Terceirizado',
        Descrição: 'Ensaio de Carga Dinâmica em Estaca',
        Unidade: 'un',
        'Preço Unitário (R$)': 3500.00
      }
    ];
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Insumos');
    XLSX.writeFile(wb, 'Modelo_Importacao_Insumos_SEEL.xlsx');
  };

  const baixarModeloCPUs = () => {
    const dados = [
      {
        'ID CPU': 'CPU-01',
        'Nome CPU': 'Perfuração em rocha D=75mm',
        'Unid. CPU': 'm',
        'Tipo Serviço': 'Sondagens',
        'Produtividade Teórica/Dia': 25,
        'Fator Praticabilidade': 0.85,
        'Horas/Dia': 8.8,
        'Quantidade Prevista': 1500
      },
      {
        'ID CPU': 'CPU-02',
        'Nome CPU': 'Injeção de calda de cimento',
        'Unid. CPU': 'sc',
        'Tipo Serviço': 'Injeções',
        'Produtividade Teórica/Dia': 80,
        'Fator Praticabilidade': 0.90,
        'Horas/Dia': 8.8,
        'Quantidade Prevista': 3000
      }
    ];
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo CPUs');
    XLSX.writeFile(wb, 'Modelo_Importacao_CPUs_SEEL.xlsx');
  };

  const menus = [
    {
      id: 'geral',
      title: 'Visão Geral & Navegação',
      icon: Building,
      desc: 'Como selecionar obras e navegar pelo sistema'
    },
    {
      id: 'config_orcamento',
      title: 'Configuração do Orçamento',
      icon: Settings,
      desc: 'Detalhamento dos campos, alíquotas de impostos e metas'
    },
    {
      id: 'resumo',
      title: 'Resumo da Obra',
      icon: PieChart,
      desc: 'Indicadores financeiros e distribuição de custos'
    },
    {
      id: 'cpus',
      title: 'Tabela de CPUs (Como Criar & Importar)',
      icon: Calculator,
      desc: 'Criação manual e modelo Excel de composições'
    },
    {
      id: 'dashboard',
      title: 'Memória de Cálculo Unitária',
      icon: BarChart3,
      desc: 'Ajuste de produtividade e insumos da CPU'
    },
    {
      id: 'abc',
      title: 'Curva ABC & Rastreabilidade',
      icon: Search,
      desc: 'Análise de insumos críticos e onde são usados'
    },
    {
      id: 'insumos',
      title: 'Banco de Insumos (Upload Excel)',
      icon: Boxes,
      desc: 'Cadastro, upload Excel e modelo de planilha'
    },
    {
      id: 'painel_firestore',
      title: 'Painel Firestore (Super Admin)',
      icon: Database,
      desc: 'Monitoramento de cota, leituras, escritas e logs em tempo real'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-bold shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Guia de Utilização do Sistema — SEEL Engenharia</span>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  Manual Operacional
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Aprenda a utilizar cada recurso do sistema com instruções passo a passo e modelos de planilhas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition"
            title="Fechar Guia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Area: Sidebar Navigation + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* Left Menu Sidebar */}
          <div className="w-full md:w-72 bg-white border-r border-slate-200 p-3 flex flex-col gap-1 overflow-y-auto shrink-0 border-b md:border-b-0">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1.5">
              Menu de Instruções
            </div>

            {menus.map((m) => {
              const Icon = m.icon;
              const isActive = activeMenu === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMenu(m.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between group ${
                    isActive
                      ? 'bg-amber-50 text-amber-950 border border-amber-300 shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{m.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{m.desc}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-amber-600 translate-x-0.5' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Main Help Body */}
          <div className="flex-1 p-6 overflow-y-auto bg-white space-y-6">
            {/* 1. VISÃO GERAL */}
            {activeMenu === 'geral' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Passo a Passo
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Building className="w-6 h-6 text-slate-800" />
                    <span>Visão Geral & Seleção de Obras</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Entenda como funciona a estrutura de obras e a navegação principal da ferramenta.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xs">
                        1
                      </div>
                      <span>Seletor de Obras (Barra Lateral)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      No menu esquerdo, você encontra o seletor com as obras liberadas para o seu usuário (ex: <strong>Obra 966</strong>). Ao trocar de obra, todas as CPUs, custos e banco de insumos mudam automaticamente para o projeto selecionado.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xs">
                        2
                      </div>
                      <span>Abas de Funcionalidades</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Utilize os botões do menu lateral (<strong>Resumo da Obra</strong>, <strong>Tabela de CPUs</strong>, <strong>Curva ABC</strong> e <strong>Insumos Cadastrados</strong>) para alternar rapidamente entre as telas de trabalho.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xs">
                        3
                      </div>
                      <span>Salvar no Firestore (Sincronização)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Quando você realiza alterações em composições ou preços de insumos, o botão <strong>"Salvar no Firestore"</strong> na barra superior piscará indicando pendências. Clique nele a qualquer momento para aplicar na nuvem.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xs">
                        4
                      </div>
                      <span>Isolamento Total por Obra</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cada obra possui seu próprio orçamento e seu próprio banco de insumos. Nenhuma alteração feita na Obra 966 afeta os valores ou insumos de outros projetos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIGURAÇÃO DO ORÇAMENTO */}
            {activeMenu === 'config_orcamento' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Parâmetros do Projeto & Impostos
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-slate-800" />
                    <span>Configuração do Orçamento (Detalhamento dos Campos)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Acesse esta janela através do ícone de engrenagem no cabeçalho ou menu para configurar parâmetros financeiros, impostos e metas orçamentárias de cada obra.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Bloco 1 */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-700" />
                      <span>1. Identificação & Permissões do Projeto</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Nome da Obra</strong>
                        Nome descritivo e código do contrato (ex: Obra 966 - Reforço de Fundação).
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Cliente</strong>
                        Empresa contratante responsável pelo projeto (ex: SEEL Engenharia).
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 md:col-span-2">
                        <strong className="text-slate-800 block mb-0.5">E-mails com Acesso à Obra</strong>
                        Lista de e-mails dos engenheiros e orçamentistas autorizados a visualizar e modificar esta obra.
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2 */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span>2. Parâmetros Financeiros Atuais da Obra</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Faturamento Direto Atual (R$)</strong>
                        Valor faturado diretamente por fornecedores ou parceiros, sem incidência na receita e impostos diretos da SEEL.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Custo Indireto Atual (R$)</strong>
                        Custos com equipe administrativa, canteiro de obras, supervisão e apoios indiretos da obra.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">BDI Padrão (%)</strong>
                        Percentual de Benefício e Despesas Indiretas (BDI) aplicado por padrão nas composições do projeto (ex: 25,00%).
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3 */}
                  <div className="p-4 bg-red-50/60 rounded-xl border border-red-200 space-y-3">
                    <h5 className="font-bold text-xs text-red-950 uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-red-600" />
                      <span>3. Alíquotas de Impostos do Projeto (Recálculo Dinâmico Atual)</span>
                    </h5>
                    <p className="text-xs text-red-800 leading-relaxed">
                      Defina os percentuais de impostos incidentes sobre a Venda sem Faturamento para este contrato especificamente:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                      <div className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs">
                        <strong className="text-red-900 block mb-0.5">Alíquota PIS Atual (%)</strong>
                        Percentual de PIS para o projeto (padrão 3,00%).
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs">
                        <strong className="text-red-900 block mb-0.5">Alíquota COFINS Atual (%)</strong>
                        Percentual de COFINS para o projeto (padrão 0,65%).
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs">
                        <strong className="text-red-900 block mb-0.5">Alíquota ISS Atual (%)</strong>
                        Percentual de ISS específico do município da obra (padrão 3,00%).
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-red-200 text-xs text-red-900 flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Recálculo Automático da Receita Líquida:</strong> Sempre que novas CPUs forem adicionadas, alteradas ou tiverem suas quantidades ajustadas, o sistema reaplica automaticamente essas alíquotas para recalcular a <strong>Receita Líquida Atual</strong>, o <strong>Resultado Operacional (R$)</strong> e a <strong>Margem Operacional (%)</strong> da obra em tempo real!
                      </span>
                    </div>
                  </div>

                  {/* Bloco 4 */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span>4. Informações do Orçamento Original (Base de Comparação)</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Campos de referência histórica para comparar o desempenho atual contra o planejado na proposta comercial:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Venda Total Orçada (R$) & Fat. Direto Orçado (R$)</strong>
                        Valor total de venda e faturamento direto contratado originalmente.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Custos Orçados (Direto e Indireto em R$)</strong>
                        Custos diretos e indiretos previstos na fase de licitação/proposta.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Impostos Orçados (PIS, COFINS e ISS)</strong>
                        Valores em Reais (R$) e percentuais (%) de impostos orçados prefixados.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Receita Líquida, Resultado e Margem Orçados</strong>
                        Metas financeiras e de rentabilidade pré-fixadas do orçamento base.
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Use o botão <strong>"Recalcular Derivados Orçados"</strong> na janela de configurações para atualizar automaticamente todos os impostos, receita líquida e resultado orçados com base nos valores principais inseridos.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RESUMO DA OBRA */}
            {activeMenu === 'resumo' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Indicadores Gerais
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-6 h-6 text-slate-800" />
                    <span>Aba Resumo da Obra</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Painel gerencial para acompanhar o custo total, totais de CPUs e distribuição financeira do projeto.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Cards de Totais Financeiros</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Na parte superior da tela de resumo, você tem acesso imediato ao <strong>Custo Total da Obra (R$)</strong>, à quantidade de CPUs cadastradas e ao número de insumos em uso.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Gráficos de Distribuição de Custo</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      O sistema gera automaticamente o percentual e valor investido em cada categoria (<strong>Mão de Obra</strong>, <strong>Materiais</strong>, <strong>Equipamentos</strong> e <strong>Terceirizados</strong>), permitindo identificar visualmente onde está concentrado o orçamento.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Configuração de Impostos (PIS, COFINS e ISS) e Receita Líquida</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Pelo botão de configurações da obra (ícone de engrenagem), você pode definir os valores orçados e as <strong>alíquotas de impostos atuais</strong> (PIS, COFINS e ISS). Ao cadastrar ou alterar CPUs, o sistema recalcula automaticamente a Receita Líquida, o Resultado Operacional e a Margem do projeto em tempo real.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>Exportação de Relatórios em Excel</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Utilize o botão de exportação na aba Resumo para baixar uma planilha formatada contendo todo o resumo executivo, lista completa de CPUs e a Curva ABC da obra.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TABELA DE CPUS & MODELO EXCEL */}
            {activeMenu === 'cpus' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                      Composições de Preço Unitário
                    </span>
                    <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Calculator className="w-6 h-6 text-slate-800" />
                      <span>Como Criar e Gerenciar CPUs</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Instruções detalhadas para criação manual de serviços e modelo de planilha de importação.
                    </p>
                  </div>

                  <button
                    onClick={baixarModeloCPUs}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Modelo Planilha CPUs (.xlsx)</span>
                  </button>
                </div>

                {/* Passo a Passo: Criar CPU Manualmente */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3">
                  <h5 className="font-extrabold text-xs text-amber-950 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-amber-600" />
                    <span>Passo a Passo: Como Criar uma Nova CPU Manualmente</span>
                  </h5>
                  <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Acesse a aba <strong>Tabela de CPUs</strong> no menu lateral esquerdo.
                    </li>
                    <li>
                      Clique no botão verde <strong>"+ Nova CPU"</strong> localizado no canto superior direito.
                    </li>
                    <li>
                      No formulário que abrir, preencha os dados básicos do serviço:
                      <ul className="list-disc list-inside pl-4 mt-1 text-slate-600 space-y-1">
                        <li><strong>Código da CPU</strong>: Ex: <code className="bg-white px-1 rounded border">CPU-001</code></li>
                        <li><strong>Nome / Descrição do Serviço</strong>: Ex: <code className="bg-white px-1 rounded border">Perfuração em Rocha D=75mm</code></li>
                        <li><strong>Unidade de Medida</strong>: Ex: <code className="bg-white px-1 rounded border">m</code>, <code className="bg-white px-1 rounded border">m³</code>, <code className="bg-white px-1 rounded border">sc</code>, <code className="bg-white px-1 rounded border">un</code></li>
                        <li><strong>Tipo de Serviço / Grupo</strong>: Selecione Sondagens, Injeções, Tirantes, etc.</li>
                        <li><strong>Quantidade Prevista na Obra</strong>: Quantidade total estimada a ser executada.</li>
                        <li><strong>Produtividade Teórica / Dia</strong> e <strong>Fator de Praticabilidade</strong>: Produtividade calculada da equipe.</li>
                      </ul>
                    </li>
                    <li>
                      Clique em <strong>"Salvar CPU"</strong>.
                    </li>
                    <li>
                      Na linha da CPU recém-criada, clique em <strong>"Abrir Memória de Cálculo"</strong> para incluir os insumos necessários (materiais, profissionais e equipamentos).
                    </li>
                  </ol>
                </div>

                {/* Modelo de Planilha de CPUs */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Estrutura do Modelo de Planilha de CPUs (Excel / CSV)</span>
                    </h5>
                    <button
                      onClick={baixarModeloCPUs}
                      className="text-emerald-700 hover:text-emerald-800 text-xs font-bold underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Planilha</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Se deseja carregar uma lista de CPUs via planilha Excel, organize o arquivo com o cabeçalho idêntico ao modelo abaixo:
                  </p>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-800 text-white font-mono">
                        <tr>
                          <th className="p-2 border-r border-slate-700">ID CPU</th>
                          <th className="p-2 border-r border-slate-700">Nome CPU</th>
                          <th className="p-2 border-r border-slate-700">Unid. CPU</th>
                          <th className="p-2 border-r border-slate-700">Tipo Serviço</th>
                          <th className="p-2 border-r border-slate-700">Produtividade Teórica/Dia</th>
                          <th className="p-2">Quantidade Prevista</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                        <tr>
                          <td className="p-2 border-r font-mono font-bold text-indigo-700">CPU-01</td>
                          <td className="p-2 border-r">Perfuração em rocha D=75mm</td>
                          <td className="p-2 border-r text-center">m</td>
                          <td className="p-2 border-r">Sondagens</td>
                          <td className="p-2 border-r text-right">25.00</td>
                          <td className="p-2 text-right">1500</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r font-mono font-bold text-indigo-700">CPU-02</td>
                          <td className="p-2 border-r">Injeção de calda de cimento</td>
                          <td className="p-2 border-r text-center">sc</td>
                          <td className="p-2 border-r">Injeções</td>
                          <td className="p-2 border-r text-right">80.00</td>
                          <td className="p-2 text-right">3000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MEMÓRIA DE CÁLCULO */}
            {activeMenu === 'dashboard' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Composição Unitária
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-slate-800" />
                    <span>Memória de Cálculo Unitária da CPU</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ajuste fino de equipe, coeficientes e insumos de cada composição.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-amber-600" />
                      <span>Produtividade Efetiva e Coeficiente de Mão de Obra</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      O sistema calcula o coeficiente horário de mão de obra e equipamentos dividindo a equipe pela produtividade efetiva por hora:
                      <br />
                      <code className="bg-white p-1 rounded border block my-1 font-mono text-[11px] text-slate-800">
                        Produtividade Efetiva (un/h) = (Prod. Teórica / Dia × Fator Praticabilidade) / Horas por Dia
                      </code>
                      Se a equipe necessitar de 2 ajudantes e a produtividade for de 5m/h, o coeficiente de cada ajudante será automaticamente <code className="bg-white px-1 rounded border">0,40 h/m</code>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      <span>Adicionar Insumos e Consumo de Materiais</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Na tabela de insumos da CPU, clique em <strong>"+ Adicionar Insumo"</strong>. Selecione o insumo desejado do banco de dados e digite seu consumo unitário por unidade de CPU (ex: <code className="bg-white px-1 rounded border">1,05 kg de aço</code> por metro de solo grampeado).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CURVA ABC */}
            {activeMenu === 'abc' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Análise Financeira
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Search className="w-6 h-6 text-slate-800" />
                    <span>Curva ABC de Insumos & Rastreabilidade</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Identifique os insumos com maior impacto financeiro na obra.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span>Classificação A, B e C</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      A curva ordena todos os insumos do maior valor acumulado para o menor. Os itens de <strong>Classe A</strong> representam cerca de 80% do custo e exigem maior controle e negociação.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-600" />
                      <span>Botão de Rastreabilidade ("Rastrear Uso")</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Na tabela da Curva ABC, clique no botão <strong>"Rastrear Uso"</strong> ao lado de qualquer insumo. Uma janela exibirá exatamente em quais CPUs e em quais quantidades aquele insumo está sendo aplicado na obra.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BANCO DE INSUMOS & MODELO EXCEL */}
            {activeMenu === 'insumos' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                      Gestão de Preços & Planilhas
                    </span>
                    <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Boxes className="w-6 h-6 text-slate-800" />
                      <span>Como Fazer Upload de Insumos com Excel</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Instruções para importação de tabelas de preços e download da planilha modelo.
                    </p>
                  </div>

                  <button
                    onClick={baixarModeloInsumos}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Modelo Planilha Insumos (.xlsx)</span>
                  </button>
                </div>

                {/* Passo a Passo: Upload de Insumos Excel */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-3">
                  <h5 className="font-extrabold text-xs text-emerald-950 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Passo a Passo: Como Fazer Upload da Planilha de Insumos</span>
                  </h5>
                  <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Acesse a aba <strong>Insumos Cadastrados</strong> no menu lateral.
                    </li>
                    <li>
                      Clique no botão <strong>"Importar Insumos"</strong> no topo da página.
                    </li>
                    <li>
                      Para garantir a leitura correta das colunas, baixe a planilha modelo clicando no botão verde <strong>"Baixar Modelo Planilha Insumos (.xlsx)"</strong> acima.
                    </li>
                    <li>
                      Preencha suas cotações e preços na planilha mantendo as colunas do cabeçalho.
                    </li>
                    <li>
                      Arraste ou selecione o arquivo gerado (formato <code className="bg-white px-1 rounded border">.xlsx</code> ou <code className="bg-white px-1 rounded border">.csv</code>) na caixa de upload.
                    </li>
                    <li>
                      Confira a prévia dos insumos lidos e clique em <strong>"Confirmar Importação de X Insumos"</strong>.
                    </li>
                  </ol>
                </div>

                {/* Modelo de Planilha de Insumos */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Estrutura do Modelo de Planilha de Insumos (Excel / CSV)</span>
                    </h5>
                    <button
                      onClick={baixarModeloInsumos}
                      className="text-emerald-700 hover:text-emerald-800 text-xs font-bold underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Planilha</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Sua planilha Excel de insumos deve possuir as seguintes colunas obrigatórias:
                  </p>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-800 text-white font-mono">
                        <tr>
                          <th className="p-2 border-r border-slate-700">ID Insumo</th>
                          <th className="p-2 border-r border-slate-700">Tipo</th>
                          <th className="p-2 border-r border-slate-700">Descrição</th>
                          <th className="p-2 border-r border-slate-700">Unidade</th>
                          <th className="p-2">Preço Unitário (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                        <tr>
                          <td className="p-2 border-r font-mono font-bold text-indigo-700">MAT-001</td>
                          <td className="p-2 border-r">Material</td>
                          <td className="p-2 border-r">Cimento Portland CP-II (saco 50kg)</td>
                          <td className="p-2 border-r text-center">sc</td>
                          <td className="p-2 text-right">42,50</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r font-mono font-bold text-indigo-700">MO-001</td>
                          <td className="p-2 border-r">Mão de Obra</td>
                          <td className="p-2 border-r">Pedreiro de Obra</td>
                          <td className="p-2 border-r text-center">h</td>
                          <td className="p-2 text-right">28,00</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r font-mono font-bold text-indigo-700">EQP-001</td>
                          <td className="p-2 border-r">Equipamento</td>
                          <td className="p-2 border-r">Caminhão Munck 12t</td>
                          <td className="p-2 border-r text-center">h</td>
                          <td className="p-2 text-right">180,00</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r font-mono font-bold text-indigo-700">TERC-001</td>
                          <td className="p-2 border-r">Terceirizado</td>
                          <td className="p-2 border-r">Ensaio de Carga Dinâmica em Estaca</td>
                          <td className="p-2 border-r text-center">un</td>
                          <td className="p-2 text-right">3500,00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Efeito Cascata:</strong> Sempre que você importa ou altera o preço de um insumo, o sistema atualiza automaticamente o valor final de todas as CPUs da obra que usam aquele insumo!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PAINEL FIRESTORE (SUPER ADMIN) */}
            {activeMenu === 'painel_firestore' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Recurso Exclusivo Super Admin
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600" />
                    <span>Painel de Controle de Requisições Firestore</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Acompanhe em tempo real a utilização do banco de dados na nuvem, telemetria de requisições e consumo contra os limites do plano.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-600" />
                      <span>1. Indicadores Principais de Desempenho (KPIs)</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Total de Leituras (Reads)</strong>
                        Número de documentos lidos do banco. Acompanha barra de progresso em relação à cota diária gratuita (50.000 leituras/dia).
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Total de Escritas (Writes)</strong>
                        Operações de salvamento de CPUs, obras e insumos (cota de 20.000 escritas/dia).
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Exclusões & Conexões Ativas</strong>
                        Monitoramento de deleções de documentos e contagem de ouvintes em tempo real (`onSnapshot`).
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-600" />
                      <span>2. Detalhamento por Coleção & Logs de Atividade</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Visualize a distribuição de leituras e escritas separadas pelas coleções principais do sistema: <code>cpus</code>, <code>obras</code>, <code>bancoInsumos</code> e <code>userPermissions</code>.
                    </p>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                      <strong>Log do Histórico:</strong> Registra os últimos 100 eventos disparados no cliente com data/hora, tipo de operação, coleção alvo e quantidade de documentos afetados.
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>3. Ferramentas de Teste e Exportação</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Testar Requisição</strong>
                        Dispara uma requisição de teste para validar a gravação nos logs.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Exportar CSV</strong>
                        Gera um relatório baixável com todo o histórico de logs da sessão.
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-800 block mb-0.5">Zerar Contadores</strong>
                        Reinicia os contadores do painel para iniciar um novo período de testes.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                    <h5 className="font-bold text-xs text-red-950 uppercase tracking-wider flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>4. Exclusão de Obras (Segurança com Dupla Confirmação)</span>
                    </h5>
                    <p className="text-xs text-red-900 leading-relaxed">
                      Como Super Admin, você pode excluir qualquer obra no menu lateral ou na aba "Resumo da Obra". Para evitar exclusões acidentais, a janela de checagem exige:
                    </p>
                    <ul className="text-xs text-red-950 space-y-1 list-disc list-inside font-semibold">
                      <li>Digitação manual exata do nome do projeto na Etapa 1;</li>
                      <li>Marcação da caixa de ciência dos riscos e confirmação dupla na Etapa 2.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sistema SEEL Engenharia — Utilização operacional de orçamentos e cadastros de obras.</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Entendi / Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
