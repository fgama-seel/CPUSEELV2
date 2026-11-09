import React, { useState } from 'react';
import {
  Upload,
  CalendarRange,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  Sparkles,
  Download,
  Layers,
  ChevronRight,
  ChevronDown,
  Hash,
  ListTree,
  Loader2,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Obra, TarefaCronograma } from '../types';
import { updateObraCronogramaTarefas } from '../services/dbService';
import { ModalPadraoPlanilhaProject } from './ModalPadraoPlanilhaProject';

interface ModalImportarCronogramaProjectProps {
  isOpen: boolean;
  obra: Obra | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Preset demonstrativo SEEL com ID Exclusiva e Nível de Estrutura de Tópicos do MS Project
const CRONOGRAMA_PADRAO_SEEL: TarefaCronograma[] = [
  { id: 't1', idLinha: 1, idExclusiva: 101, wbs: '1', nivelEstruturaTopicos: 1, nome: '01. SERVIÇOS PRELIMINARES E INSTALAÇÃO DE CANTEIRO', inicio: '2026-01-05', termino: '2026-03-31', duracaoDias: 85, isResumo: true, percentualConcluido: 100, custoPrevisto: 140000 },
  { id: 't2', idLinha: 2, idExclusiva: 102, wbs: '1.1', nivelEstruturaTopicos: 2, nome: 'Terraplanagem, desmatamento e caminhos de acesso', inicio: '2026-01-05', termino: '2026-01-25', duracaoDias: 20, isResumo: false, percentualConcluido: 100, custoPrevisto: 35000, recursos: 'Equipe Terraplanagem' },
  { id: 't3', idLinha: 3, idExclusiva: 103, wbs: '1.2', nivelEstruturaTopicos: 2, nome: 'Mobilização de containers de escritório e vivência', inicio: '2026-01-20', termino: '2026-02-15', duracaoDias: 26, isResumo: false, percentualConcluido: 100, custoPrevisto: 65000, recursos: 'Logística / Munck' },
  { id: 't4', idLinha: 4, idExclusiva: 104, wbs: '1.3', nivelEstruturaTopicos: 2, nome: 'Rede elétrica provisória, gerador e água potável', inicio: '2026-02-01', termino: '2026-03-31', duracaoDias: 58, isResumo: false, percentualConcluido: 80, custoPrevisto: 40000, recursos: 'Eletricista / Encanador' },
  { id: 't5', idLinha: 5, idExclusiva: 201, wbs: '2', nivelEstruturaTopicos: 1, nome: '02. CONTENÇÕES GEOTÉCNICAS E FUNDAÇÕES', inicio: '2026-02-15', termino: '2026-10-30', duracaoDias: 257, isResumo: true, percentualConcluido: 45, custoPrevisto: 3850000 },
  { id: 't6', idLinha: 6, idExclusiva: 202, wbs: '2.1', nivelEstruturaTopicos: 2, nome: 'Perfuração e Execução de Estaca Raiz Ø 310mm', inicio: '2026-02-15', termino: '2026-06-30', duracaoDias: 135, isResumo: false, percentualConcluido: 60, custoPrevisto: 1650000, recursos: 'Perfuratriz Raiz 01' },
  { id: 't7', idLinha: 7, idExclusiva: 203, wbs: '2.2', nivelEstruturaTopicos: 2, nome: 'Injeção de Calda de Cimento e Ancoragens (Tirantes)', inicio: '2026-04-01', termino: '2026-08-30', duracaoDias: 151, isResumo: false, percentualConcluido: 35, custoPrevisto: 1200000, recursos: 'Central Injeção' },
  { id: 't8', idLinha: 8, idExclusiva: 204, wbs: '2.3', nivelEstruturaTopicos: 2, nome: 'Concreto Projetado com Fibras Metálicas e Drenos', inicio: '2026-05-15', termino: '2026-10-30', duracaoDias: 168, isResumo: false, percentualConcluido: 20, custoPrevisto: 1000000, recursos: 'Equipe Projeção' },
  { id: 't9', idLinha: 9, idExclusiva: 301, wbs: '3', nivelEstruturaTopicos: 1, nome: '03. ESTRUTURA E ACABAMENTOS DA ETA', inicio: '2026-07-01', termino: '2026-12-20', duracaoDias: 172, isResumo: true, percentualConcluido: 10, custoPrevisto: 2150000 },
  { id: 't10', idLinha: 10, idExclusiva: 302, wbs: '3.1', nivelEstruturaTopicos: 2, nome: 'Montagem de Estruturas Metálicas e Tanques', inicio: '2026-07-01', termino: '2026-10-15', duracaoDias: 106, isResumo: false, percentualConcluido: 15, custoPrevisto: 1450000, recursos: 'Guindaste 50t' },
  { id: 't11', idLinha: 11, idExclusiva: 303, wbs: '3.2', nivelEstruturaTopicos: 2, nome: 'Alvenaria de vedação, revestimentos e pintura epóxi', inicio: '2026-09-01', termino: '2026-12-15', duracaoDias: 105, isResumo: false, percentualConcluido: 0, custoPrevisto: 700000, recursos: 'Equipe Civil' },
  { id: 't12', idLinha: 12, idExclusiva: 401, wbs: '4', nivelEstruturaTopicos: 1, nome: '04. TESTES, COMISSIONAMENTO E DESMOBILIZAÇÃO', inicio: '2026-11-01', termino: '2027-01-30', duracaoDias: 90, isResumo: true, percentualConcluido: 0, custoPrevisto: 450000 },
  { id: 't13', idLinha: 13, idExclusiva: 402, wbs: '4.1', nivelEstruturaTopicos: 2, nome: 'Testes hidrostáticos e controle de qualidade', inicio: '2026-11-01', termino: '2026-12-20', duracaoDias: 49, isResumo: false, percentualConcluido: 0, custoPrevisto: 250000, recursos: 'Engenharia Qualidade' },
  { id: 't14', idLinha: 14, idExclusiva: 403, wbs: '4.2', nivelEstruturaTopicos: 2, nome: 'Desmobilização de canteiro e limpeza final', inicio: '2026-12-15', termino: '2027-01-30', duracaoDias: 46, isResumo: false, percentualConcluido: 0, custoPrevisto: 200000, recursos: 'Apoio Geral' }
];

export const ModalImportarCronogramaProject: React.FC<ModalImportarCronogramaProjectProps> = ({
  isOpen,
  obra,
  onClose,
  onSuccess
}) => {
  const [tarefasParsed, setTarefasParsed] = useState<TarefaCronograma[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPadrao, setShowPadrao] = useState(false);

  if (!isOpen || !obra) return null;

  // Normalização e busca de colunas
  const findValue = (row: any, candidates: string[]): any => {
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const match = keys.find((k) => k.trim().toLowerCase() === cand.toLowerCase());
      if (match && row[match] !== undefined && row[match] !== '') {
        return row[match];
      }
    }
    return '';
  };

  // Processar arquivo Excel ou CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (jsonRows.length === 0) {
          throw new Error('O arquivo selecionado está vazio.');
        }

        const tarefas: TarefaCronograma[] = [];

        jsonRows.forEach((row, index) => {
          // 1. ID Exclusiva (Unique ID do MS Project)
          const idExclusivaVal = findValue(row, [
            'id exclusiva',
            'id_exclusiva',
            'unique id',
            'uid',
            'id única',
            'id_unica',
            'id unico'
          ]);

          // 2. ID Sequencial de Linha
          const idLinhaVal = findValue(row, ['id', 'identificação', 'linha', 'item']);

          // 3. Nível da Estrutura de Tópicos (Outline Level)
          const nivelVal = findValue(row, [
            'nível da estrutura de tópicos',
            'nivel da estrutura de topicos',
            'nível de tópicos',
            'nivel de topicos',
            'outline level',
            'outline_level',
            'nivel',
            'nível'
          ]);

          // 4. EDT / WBS
          const wbsVal = findValue(row, ['edt', 'wbs', 'código edt', 'codigo edt', 'estrutura']);

          // 5. Nome da Tarefa
          const nomeVal = findValue(row, [
            'nome da tarefa',
            'nome_da_tarefa',
            'task name',
            'nome',
            'tarefa',
            'descrição',
            'descricao'
          ]);

          // 6. Datas e Durações
          const inicioVal = findValue(row, ['início', 'inicio', 'start', 'data inicial', 'data de início']);
          const terminoVal = findValue(row, ['término', 'termino', 'finish', 'fim', 'data final', 'data de término']);
          const duracaoVal = findValue(row, ['duração', 'duracao', 'duration', 'dias']);
          const avancoVal = findValue(row, ['% concluída', '% concluida', '% completo', '% percent', 'progresso']);
          const custoVal = findValue(row, ['custo', 'cost', 'custo previsto', 'orçamento']);
          const recursosVal = findValue(row, ['nomes dos recursos', 'recursos', 'resource names', 'equipe']);

          if (!nomeVal && !idLinhaVal && !idExclusivaVal) return;

          // Conversão de nível de tópicos (Padrão 1 se ausente)
          let nivel = Number(nivelVal) || 1;
          if (wbsVal && (!nivelVal || nivel === 1)) {
            // Se WBS = "1.2.3", deduz nível 3
            const parts = String(wbsVal).split('.').filter(Boolean);
            if (parts.length > 1) nivel = parts.length;
          }

          // Formatação de datas
          const formatarData = (val: any): string => {
            if (!val) return '';
            if (val instanceof Date) {
              return val.toISOString().split('T')[0];
            }
            const s = String(val).trim();
            if (s.includes('/')) {
              const parts = s.split('/');
              if (parts.length === 3) {
                // dd/mm/aaaa
                const d = parts[0].padStart(2, '0');
                const m = parts[1].padStart(2, '0');
                const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                return `${y}-${m}-${d}`;
              }
            }
            return s;
          };

          tarefas.push({
            id: `proj-${index + 1}`,
            idLinha: Number(idLinhaVal) || index + 1,
            idExclusiva: idExclusivaVal !== '' ? String(idExclusivaVal) : `${index + 100}`,
            wbs: String(wbsVal || `${index + 1}`),
            nivelEstruturaTopicos: nivel,
            nome: String(nomeVal || `Tarefa ${index + 1}`),
            inicio: formatarData(inicioVal),
            termino: formatarData(terminoVal),
            duracaoDias: Number(String(duracaoVal).replace(/[^0-9.-]/g, '')) || 0,
            percentualConcluido: Number(String(avancoVal).replace(/[^0-9.-]/g, '')) || 0,
            custoPrevisto: Number(String(custoVal).replace(/[^0-9.-]/g, '')) || 0,
            recursos: String(recursosVal || ''),
            isResumo: nivel === 1
          });
        });

        // Marca tarefas que são resumo (se o próximo item tem nível superior)
        for (let i = 0; i < tarefas.length - 1; i++) {
          if (tarefas[i + 1].nivelEstruturaTopicos > tarefas[i].nivelEstruturaTopicos) {
            tarefas[i].isResumo = true;
          }
        }

        setTarefasParsed(tarefas);
        setSuccessMsg(`Planilha lida com sucesso! ${tarefas.length} tarefas identificadas.`);
      } catch (err: any) {
        console.error('Erro ao ler cronograma:', err);
        setErrorMsg(err.message || 'Erro ao processar arquivo do MS Project.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Carregar Modelo SEEL
  const handleCarregarModeloPadrao = () => {
    setTarefasParsed(CRONOGRAMA_PADRAO_SEEL);
    setFileName('Modelo_Padrao_SEEL_MSProject.xlsx');
    setSuccessMsg('Modelo padrão SEEL carregado com ID Exclusiva e Níveis de Tópicos!');
  };

  // Confirmar e salvar tarefas na obra
  const handleConfirmarSalvar = async () => {
    if (tarefasParsed.length === 0) return;
    setLoading(true);
    try {
      await updateObraCronogramaTarefas(obra.id, tarefasParsed);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar cronograma:', err);
      setErrorMsg('Erro ao salvar tarefas no banco de dados da obra.');
    } finally {
      setLoading(false);
    }
  };

  // Download de template modelo Excel para o usuário preencher no Project
  const handleDownloadTemplate = () => {
    const wsData = [
      ['ID Exclusiva', 'ID', 'EDT', 'Nível da Estrutura de Tópicos', 'Nome da Tarefa', 'Duração', 'Início', 'Término', '% Concluída', 'Custo', 'Nomes dos Recursos'],
      ['101', '1', '1', '1', 'SERVIÇOS PRELIMINARES E CANTEIRO', '30 dias', '05/01/2026', '04/02/2026', '100%', '85000', 'Engenharia'],
      ['102', '2', '1.1', '2', 'Cercamento, tapumes e portão', '10 dias', '05/01/2026', '15/01/2026', '100%', '25000', 'Apoio'],
      ['103', '3', '1.2', '2', 'Instalações de containers de escritório', '20 dias', '16/01/2026', '04/02/2026', '100%', '60000', 'Logística'],
      ['201', '4', '2', '1', 'EXECUÇÃO DE CONTENÇÕES E ESTACAS', '90 dias', '05/02/2026', '05/05/2026', '45%', '1500000', 'Produção'],
      ['202', '5', '2.1', '2', 'Perfuração de Estaca Raiz Ø 310mm', '60 dias', '05/02/2026', '05/04/2026', '60%', '900000', 'Perfuratriz 01'],
      ['203', '6', '2.2', '2', 'Injeção de Tirantes e Ancoragens', '45 dias', '20/03/2026', '05/05/2026', '30%', '600000', 'Injeção']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma_MS_Project');
    XLSX.writeFile(wb, 'Template_MS_Project_SEEL.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <span className="bg-indigo-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              MS Project • Integração WBS / EAP
            </span>
            <h3 className="text-base font-black flex items-center gap-2 mt-1">
              <CalendarRange className="w-5 h-5 text-indigo-400" />
              <span>Importar Cronograma do Microsoft Project</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Obra: <strong>{obra.nome}</strong> (Suporta ID Exclusiva, Nível de Tópicos, Datas e Recursos)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Seletor de Arquivo ou Modelo 1-Clique */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Opção 1</span>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Enviar Arquivo Excel ou CSV do MS Project</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Exporte sua tabela do MS Project como <code>.xlsx</code> ou <code>.csv</code> incluindo as colunas <strong>ID Exclusiva</strong> e <strong>Nível da estrutura de tópicos</strong>.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="w-full bg-white hover:bg-indigo-50/50 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Clique para selecionar arquivo</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{fileName || 'Nenhum arquivo selecionado'}</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center justify-center gap-1 mx-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Planilha Modelo (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPadrao(true)}
                    className="text-slate-600 hover:text-slate-900 font-bold text-[11px] flex items-center justify-center gap-1 mx-auto"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ver Colunas e Regras de Importação</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Opção 2 • 1-Clique</span>
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Carregar Cronograma Padrão SEEL</span>
                </h4>
                <p className="text-[11px] text-indigo-900 mt-1 leading-relaxed">
                  Carrega instantaneamente 14 tarefas típicas com toda a estrutura analítica montada (Canteiro, Estaca Raiz, Tirantes, Estrutura da ETA e Comissionamento).
                </p>
              </div>

              <button
                type="button"
                onClick={handleCarregarModeloPadrao}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Carregar Modelo Padrão SEEL</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Pré-visualização da Árvore Hierárquica */}
          {tarefasParsed.length > 0 && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-indigo-600" />
                  <strong className="text-xs text-slate-800 uppercase tracking-wide">
                    Estrutura de Tópicos Reconhecida ({tarefasParsed.length} tarefas)
                  </strong>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {tarefasParsed.filter((t) => t.isResumo).length} tarefas-resumo • {tarefasParsed.filter((t) => !t.isResumo).length} atividades
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 font-mono text-[11px]">
                {tarefasParsed.map((t) => (
                  <div
                    key={t.id}
                    className={`py-1.5 px-2 flex items-center justify-between hover:bg-slate-50 transition ${
                      t.isResumo ? 'bg-slate-50/80 font-bold text-slate-900' : 'text-slate-700'
                    }`}
                    style={{ paddingLeft: `${(t.nivelEstruturaTopicos - 1) * 20 + 8}px` }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {t.isResumo ? (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0 ml-1" />
                      )}
                      <span className="text-slate-400 font-normal shrink-0">[{t.wbs || t.idLinha}]</span>
                      <span className="truncate">{t.nome}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold" title="ID Exclusiva do Project">
                        UID: {t.idExclusiva}
                      </span>
                      <span className="text-slate-400">Nível {t.nivelEstruturaTopicos}</span>
                      <span className="text-slate-500">{t.inicio} ➔ {t.termino}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmarSalvar}
            disabled={tarefasParsed.length === 0 || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Gravar Cronograma na Obra ({tarefasParsed.length} tarefas)</span>
          </button>
        </div>
      </div>

      <ModalPadraoPlanilhaProject
        isOpen={showPadrao}
        onClose={() => setShowPadrao(false)}
      />
    </div>
  );
};
