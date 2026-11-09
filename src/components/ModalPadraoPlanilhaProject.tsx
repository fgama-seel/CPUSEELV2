import React from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  HelpCircle,
  ListTree,
  Table,
  Hash,
  Calendar,
  DollarSign,
  Users,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ModalPadraoPlanilhaProjectProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalPadraoPlanilhaProject: React.FC<ModalPadraoPlanilhaProjectProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const colunasRequeridas = [
    {
      nome: 'ID Exclusiva',
      obrigatorio: true,
      sinonimos: ['Unique ID', 'UID', 'ID Única', 'id_exclusiva'],
      tipo: 'Número Inteiro',
      exemplo: '101, 102, 201',
      descricao: 'Identificador imutável gerado automaticamente pelo MS Project. Garante rastreabilidade mesmo se tarefas forem reordenadas.'
    },
    {
      nome: 'Nível da Estrutura de Tópicos',
      obrigatorio: true,
      sinonimos: ['Outline Level', 'Nível de Tópicos', 'Nivel', 'outline_level'],
      tipo: 'Número Inteiro (1, 2, 3...)',
      exemplo: '1, 2, 3',
      descricao: 'Define a hierarquia da EAP/WBS. Nível 1 são as fases/resumos principais; níveis 2 e 3 são as atividades filhas.'
    },
    {
      nome: 'EDT / WBS',
      obrigatorio: false,
      sinonimos: ['EDT', 'WBS', 'Código EDT'],
      tipo: 'Texto estruturado',
      exemplo: '1, 1.1, 1.1.1, 2, 2.1',
      descricao: 'Código da Estrutura de Decomposição do Trabalho (numeração decimal).'
    },
    {
      nome: 'Nome da Tarefa',
      obrigatorio: true,
      sinonimos: ['Nome', 'Task Name', 'Tarefa', 'Descrição'],
      tipo: 'Texto',
      exemplo: 'Execução de Estaca Raiz Ø 310mm',
      descricao: 'Título ou descrição do serviço, fase ou marco da obra.'
    },
    {
      nome: 'Duração',
      obrigatorio: false,
      sinonimos: ['Duration', 'Duração Prevista', 'Dias'],
      tipo: 'Texto ou Número (dias)',
      exemplo: '20 dias, 45, 60 d',
      descricao: 'Tempo previsto em dias úteis para realização da atividade.'
    },
    {
      nome: 'Início',
      obrigatorio: true,
      sinonimos: ['Start', 'Data de Início', 'Data Inicial'],
      tipo: 'Data (DD/MM/AAAA ou AAAA-MM-DD)',
      exemplo: '05/01/2026',
      descricao: 'Data prevista para o início da tarefa. Essencial para o cálculo da Curva S físico-financeira.'
    },
    {
      nome: 'Término',
      obrigatorio: true,
      sinonimos: ['Finish', 'Data de Término', 'Data Final', 'Fim'],
      tipo: 'Data (DD/MM/AAAA ou AAAA-MM-DD)',
      exemplo: '30/03/2026',
      descricao: 'Data prevista para o término da tarefa. Essencial para distribuir o desembolso mensal.'
    },
    {
      nome: 'Custo',
      obrigatorio: false,
      sinonimos: ['Cost', 'Custo Previsto', 'Orçamento', 'Valor'],
      tipo: 'Monetário / Número',
      exemplo: '150000 ou R$ 150.000,00',
      descricao: 'Custo orçado total da atividade. Utilizado para gerar os desembolsos mês a mês.'
    },
    {
      nome: '% Concluído',
      obrigatorio: false,
      sinonimos: ['% Concluída', '% Complete', 'Progresso'],
      tipo: 'Percentual (0 a 100)',
      exemplo: '50% ou 0.5',
      descricao: 'Avanço físico executado da tarefa para acompanhamento previsto vs. realizado.'
    },
    {
      nome: 'Nomes dos Recursos',
      obrigatorio: false,
      sinonimos: ['Resource Names', 'Recursos', 'Equipe'],
      tipo: 'Texto (separado por vírgula)',
      exemplo: 'Perfuratriz 01, Mestre, Engenheiro',
      descricao: 'Mão de obra ou equipamentos alocados à tarefa no MS Project.'
    }
  ];

  const handleDownloadTemplate = () => {
    const wsData = [
      ['ID Exclusiva', 'ID', 'EDT', 'Nível da Estrutura de Tópicos', 'Nome da Tarefa', 'Duração', 'Início', 'Término', '% Concluída', 'Custo', 'Nomes dos Recursos'],
      ['101', '1', '1', '1', '01. SERVIÇOS PRELIMINARES E INSTALAÇÃO DE CANTEIRO', '60 dias', '05/01/2026', '05/03/2026', '100%', '140000', 'Engenheiro, Mestre'],
      ['102', '2', '1.1', '2', 'Mobilização e terraplanagem do canteiro', '20 dias', '05/01/2026', '25/01/2026', '100%', '45000', 'Caminhão Basculante, Trator'],
      ['103', '3', '1.2', '2', 'Instalação de containers de escritório e vivência', '25 dias', '20/01/2026', '15/02/2026', '100%', '55000', 'Caminhão Munck, Eletricista'],
      ['104', '4', '1.3', '2', 'Rede de luz, força, gerador e água potável', '20 dias', '10/02/2026', '05/03/2026', '100%', '40000', 'Eletricista, Encanador'],
      ['201', '5', '2', '1', '02. CONTENÇÕES GEOTÉCNICAS E FUNDAÇÕES', '120 dias', '01/02/2026', '01/06/2026', '45%', '1850000', 'Equipe Geotecnia'],
      ['202', '6', '2.1', '2', 'Perfuração de Estaca Raiz Ø 310mm', '80 dias', '01/02/2026', '20/04/2026', '60%', '980000', 'Perfuratriz Raiz, Operador'],
      ['203', '7', '2.2', '2', 'Injeção de Tirantes e Ancoragens', '60 dias', '15/03/2026', '15/05/2026', '35%', '520000', 'Bomba Injeção, Sondador'],
      ['204', '8', '2.3', '2', 'Concreto Projetado com Fibras e Drenos', '45 dias', '15/04/2026', '01/06/2026', '15%', '350000', 'Bomba Projeção, Pedreiro'],
      ['301', '9', '3', '1', '03. ESTRUTURA E MONTAGEM DA ETA', '90 dias', '01/05/2026', '01/08/2026', '0%', '1200000', 'Equipe Montagem'],
      ['302', '10', '3.1', '2', 'Montagem eletromecânica dos tanques', '60 dias', '01/05/2026', '01/07/2026', '0%', '750000', 'Guindaste 50t, Mecânico'],
      ['303', '11', '3.2', '2', 'Tubulações, válvulas e testes de estanqueidade', '45 dias', '15/06/2026', '01/08/2026', '0%', '450000', 'Soldador, Encanador']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Definir larguras de colunas adequadas
    ws['!cols'] = [
      { wch: 14 },
      { wch: 8 },
      { wch: 10 },
      { wch: 28 },
      { wch: 50 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 32 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma_MS_Project');
    XLSX.writeFile(wb, 'Padrao_Importacao_MS_Project_SEEL.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Guia de Integração Oficial
            </span>
            <h3 className="text-base font-black flex items-center gap-2 mt-1">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              <span>Padrão de Planilha para Importação do Microsoft Project</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulte as colunas necessárias e formatos aceitos para garantir 100% de precisão sem erros de importação.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Banner de Download do Template */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Baixe o Modelo Oficial Pré-Formatado (.xlsx)</span>
              </h4>
              <p className="text-xs text-indigo-800 mt-0.5">
                Arquivo Excel pronto com todas as colunas corretas, fórmulas e tarefas de exemplo da SEEL.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Planilha Modelo (.xlsx)</span>
            </button>
          </div>

          {/* Passo a Passo no MS Project */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Como Exportar Diretamente do Microsoft Project (Sem Erros)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-blue-600 text-xs">Passo 1: Inserir Colunas</span>
                <p className="text-[11px] leading-relaxed">
                  No MS Project, clique com botão direito no cabeçalho de qualquer coluna e escolha <strong>Inserir Coluna</strong>. Adicione <strong>ID Exclusiva</strong> e <strong>Nível da estrutura de tópicos</strong>.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-blue-600 text-xs">Passo 2: Salvar Como Excel</span>
                <p className="text-[11px] leading-relaxed">
                  Vá em <strong>Arquivo</strong> ➔ <strong>Salvar Como</strong> ➔ Selecione o formato <strong>Pasta de Trabalho do Excel (*.xlsx)</strong>.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-blue-600 text-xs">Passo 3: Mapear Dados</span>
                <p className="text-[11px] leading-relaxed">
                  No Assistente de Exportação, escolha <strong>Dados Selecionados</strong> e marque a caixa <strong>Tarefas</strong>. O sistema reconhecerá automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Colunas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-700" />
                <span>Colunas Reconhecidas pelo Sistema ({colunasRequeridas.length} campos)</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                *O leitor é inteligente e reconhece variações em maiúsculas/minúsculas e acentos.
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white select-none uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-44">Nome da Coluna</th>
                    <th className="p-3 w-28 text-center">Status</th>
                    <th className="p-3 w-40">Nomes Alternativos Aceitos</th>
                    <th className="p-3 w-36">Tipo de Dado</th>
                    <th className="p-3 w-36">Exemplo</th>
                    <th className="p-3">Finalidade no Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {colunasRequeridas.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900 font-mono">
                        {col.nome}
                      </td>
                      <td className="p-3 text-center">
                        {col.obrigatorio ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Requerido
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                            Opcional
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {col.sinonimos.join(', ')}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {col.tipo}
                      </td>
                      <td className="p-3 text-indigo-700 font-mono text-[11px]">
                        {col.exemplo}
                      </td>
                      <td className="p-3 text-slate-700 leading-relaxed text-[11px]">
                        {col.descricao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Planilha Modelo (.xlsx)</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
