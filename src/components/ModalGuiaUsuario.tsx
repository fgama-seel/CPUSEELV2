import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Building,
  Calculator,
  Boxes,
  BarChart3,
  PieChart,
  Users,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HardHat,
  Info
} from 'lucide-react';

interface ModalGuiaUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

export const ModalGuiaUsuario: React.FC<ModalGuiaUsuarioProps> = ({
  isOpen,
  onClose,
  isSuperAdmin = false
}) => {
  const [activeMenu, setActiveMenu] = useState<string>('geral');

  if (!isOpen) return null;

  const menus = [
    {
      id: 'geral',
      title: 'Visão Geral & Navegação',
      icon: Building,
      desc: 'Como selecionar obras e navegar pelo sistema'
    },
    {
      id: 'resumo',
      title: 'Resumo da Obra',
      icon: PieChart,
      desc: 'Indicadores financeiros e distribuição de custos'
    },
    {
      id: 'cpus',
      title: 'Tabela de CPUs',
      icon: Calculator,
      desc: 'Listagem, criação e filtragem de composições'
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
      title: 'Banco de Insumos da Obra',
      icon: Boxes,
      desc: 'Gestão de preços e importação por projeto'
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'acessos',
            title: 'Gestão de Acessos (Super Admin)',
            icon: Users,
            desc: 'Liberação de obras e permissões por usuário'
          }
        ]
      : [])
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
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
                  Manual Prático
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Aprenda a utilizar cada recurso e funcionalidade do aplicativo de forma simples e intuitiva.
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
              Tópicos de Ajuda
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
                    Como funciona a estrutura de obras e a navegação principal da ferramenta.
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
                      Quando você realiza alterações em composições ou preços de insumos, o botão <strong>"Salvar no Firestore"</strong> na barra superior piscará indicando pendências. Clique nele a qualquer momento para garantir a gravação na nuvem.
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

            {activeMenu === 'cpus' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Composições
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-slate-800" />
                    <span>Aba Tabela de CPUs</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Visão geral de todos os serviços e preços unitários da obra.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Search className="w-4 h-4 text-amber-600" />
                      <span>Busca e Filtros Rápidos</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Digite qualquer palavra ou código no campo de busca para filtrar instantaneamente as CPUs. Você também pode filtrar por tipo de serviço (Sondagens, Injeções, Tirantes, Solo Grampeado, etc.).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      <span>Nova CPU e Edição</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Clique no botão <strong>"+ Nova CPU"</strong> para cadastrar um novo serviço. Para ver ou alterar a memória de cálculo de uma CPU existente, clique em <strong>"Abrir Memória de Cálculo"</strong> na linha correspondente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'dashboard' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Memória de Cálculo
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-slate-800" />
                    <span>Dashboard & Memória de Cálculo Unitária</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Edição detalhada de produtividade, equipes, equipamentos e lista de insumos de uma composição.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-amber-600" />
                      <span>Ajuste de Produtividade da Equipe</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      No painel superior da CPU, edite a <strong>Produtividade (ex: m/h ou m³/h)</strong>. O sistema recalcula em tempo real o coeficiente e o custo unitário de cada profissional e equipamento vinculado à equipe.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      <span>Adicionar e Remover Insumos da CPU</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Clique no botão <strong>"+ Adicionar Insumo"</strong> para selecionar materiais, mão de obra ou serviços do banco de dados da obra e definir suas quantidades ou consumos específicos nesta CPU.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    Identifique os insumos com maior representatividade financeira no orçamento da obra.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span>Classificação A, B e C</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      A curva ordena todos os insumos do maior valor acumulado para o menor. Os itens de <strong>Classe A</strong> representam cerca de 80% do investimento e exigem maior atenção nas negociações.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-600" />
                      <span>Botão de Rastreabilidade ("Onde é Usado?")</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Na tabela da Curva ABC, clique no botão <strong>"Rastrear Uso"</strong> ao lado de qualquer insumo. Uma janela exibirá exatamente em quais CPUs e em quais quantidades aquele insumo está sendo aplicado na obra.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'insumos' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Gestão de Preços
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Boxes className="w-6 h-6 text-slate-800" />
                    <span>Aba Banco de Insumos Cadastrados</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Manutenção de preços unitários dos insumos exclusivos da obra ativa.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <span>Atualização de Preço e Efeito Cascata</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Ao editar o preço unitário de um insumo nesta aba (ex: valor do aço ou salário do operador), o sistema atualiza em tempo real <strong>todas as CPUs da obra</strong> que utilizam esse insumo.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Importação em Lote por Planilha Excel</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Utilize o botão <strong>"Importar Insumos"</strong> para carregar uma lista completa de preços a partir de um arquivo de planilha (.xlsx ou .csv), agilizando a montagem do orçamento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'acessos' && isSuperAdmin && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Administração Exclusiva
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-amber-600" />
                    <span>Aba Gestão de Acessos & Obras</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Painel reservado ao Super Administrador para controlar usuários e definir quais obras cada um pode visualizar.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>Convidar Usuário e Liberar Obras</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Clique em <strong>"+ Convidar / Liberar Acesso"</strong>, insira o e-mail do colaborador e marque individualmente as obras que ele terá permissão para visualizar no sistema.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Botão Salvar Alterações</span>
                    </h5>
                    <p className="text-xs text-slate-600">
                      Ao ajustar as obras ou o nível de acesso de qualquer usuário na tabela, a linha indicará pendência de salvamento. Clique em <strong>"Salvar Alterações"</strong> (ou "Salvar Todas") para aplicar as mudanças na nuvem instantaneamente.
                    </p>
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
            <span>Sistema SEEL Engenharia — Dúvidas sobre operacionalização e cadastros? Entre em contato com a equipe de engenharia.</span>
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
