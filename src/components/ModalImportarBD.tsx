import React, { useState } from 'react';
import {
  Upload,
  Database,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  Download,
  Server,
  Layers,
  Sparkles,
  HelpCircle,
  Code2,
  Copy,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Obra, CPU, InsumoBase } from '../types';
import { batchImportCPUsAndInsumos, createCPU, createInsumoBase } from '../services/dbService';
import {
  parseCSV,
  processBaseComposicoes,
  processListaCPUs,
  mergeBasesData,
  ParsedCPUItem,
  generateMySQLMigrationScript
} from '../lib/importerUtils';
import { generateLaravelMigration, generateGuiaMigracaoLaravel } from '../lib/laravelExport';
import { formatMoney } from '../lib/excelExport';

interface ModalImportarBDProps {
  isOpen: boolean;
  obra: Obra | null;
  onClose: () => void;
  onImportSuccess: () => void;
}

// Preset SEEL Composition Catalog (BD CPU Tradicional)
const CATALOGO_BD_CPU_SEEL: Omit<CPU, 'id' | 'obraId'>[] = [
  {
    code: '18010102',
    nome: 'TRANSPORTE ETA E MONTAGEM DE ESTRUTURA',
    unidade: 'GB',
    prod_teorica: 24,
    praticabilidade: 0.85,
    horas_dia: 8.8,
    prod_efetiva: 2.3181,
    quantidade_prevista: 5.5,
    preco_venda: 15000.0,
    fator_fcd: 1.25,
    insumos: [
      { id_insumo: 'EQ01', tipo: 'Equipamento', descricao: 'Caminhão Munck 12t (Chassi + Guindaste)', unid: 'h', coef: 8.0, pr_unit: 185.0 },
      { id_insumo: 'MO01', tipo: 'Mão de Obra', descricao: 'Motorista de Caminhão Pesado / Munck', unid: 'h', coef: 8.0, pr_unit: 38.5 },
      { id_insumo: 'MO02', tipo: 'Mão de Obra', descricao: 'Rigger / Ajudante de Movimentação de Cargas', unid: 'h', coef: 16.0, pr_unit: 22.0 }
    ],
    comentarios: [{ id: 'c1', data: '2026-08-10', autor: 'fgama@seel.com.br', texto: 'Composição de transporte e içamento padrão SEEL.' }]
  },
  {
    code: '05020101',
    nome: 'ALVENARIA DE VEDAÇÃO COM BLOCO DE CONCRETO 14X19X39CM',
    unidade: 'M2',
    prod_teorica: 1,
    praticabilidade: 1,
    horas_dia: 8,
    prod_efetiva: 1,
    quantidade_prevista: 1500,
    preco_venda: 110.0,
    fator_fcd: 1.15,
    insumos: [
      { id_insumo: 'MO03', tipo: 'Mão de Obra', descricao: 'Pedreiro de Alvenaria e Estrutura', unid: 'h', coef: 1.2, pr_unit: 36.0 },
      { id_insumo: 'MO04', tipo: 'Mão de Obra', descricao: 'Servente de Obras / Ajudante Geral', unid: 'h', coef: 1.2, pr_unit: 21.0 },
      { id_insumo: 'MAT01', tipo: 'Material', descricao: 'Bloco de Concreto Estrutural 14x19x39cm', unid: 'un', coef: 13.0, pr_unit: 4.8 },
      { id_insumo: 'MAT02', tipo: 'Material', descricao: 'Argamassa Mista de Cimento e Cal para Assentamento', unid: 'kg', coef: 15.0, pr_unit: 0.85 }
    ],
    comentarios: []
  },
  {
    code: '12020101',
    nome: 'PERFURAÇÃO E EXECUÇÃO DE ESTACA RAIZ DIAMETRO 310MM',
    unidade: 'M',
    prod_teorica: 30,
    praticabilidade: 0.8,
    horas_dia: 8.8,
    prod_efetiva: 2.7272,
    quantidade_prevista: 1200,
    preco_venda: 280.0,
    fator_fcd: 1.3,
    insumos: [
      { id_insumo: 'EQ03', tipo: 'Equipamento', descricao: 'Perfuratriz Hidráulica Geotécnica para Estaca Raiz', unid: 'h', coef: 0.366, pr_unit: 320.0 },
      { id_insumo: 'MO05', tipo: 'Mão de Obra', descricao: 'Operador de Perfuratriz Geotécnica', unid: 'h', coef: 0.366, pr_unit: 45.0 },
      { id_insumo: 'MO04', tipo: 'Mão de Obra', descricao: 'Servente de Obras / Ajudante Geral', unid: 'h', coef: 1.1, pr_unit: 21.0 },
      { id_insumo: 'MAT04', tipo: 'Material', descricao: 'Cimento Portland CP-III 40 RS (Injeção)', unid: 'sc', coef: 1.2, pr_unit: 38.0 },
      { id_insumo: 'MAT05', tipo: 'Material', descricao: 'Aço CA-50 em Barras ou Tubo de Aço Especial', unid: 'kg', coef: 18.0, pr_unit: 8.5 }
    ],
    comentarios: []
  }
];

export const ModalImportarBD: React.FC<ModalImportarBDProps> = ({
  isOpen,
  obra,
  onClose,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'importar' | 'padrao' | 'migracao'>('importar');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados dos arquivos carregados
  const [composicoesMap, setComposicoesMap] = useState<Map<string, ParsedCPUItem>>(new Map());
  const [listaCPUsMap, setListaCPUsMap] = useState<Map<string, any>>(new Map());
  const [fileNameComposicoes, setFileNameComposicoes] = useState<string>('');
  const [fileNameLista, setFileNameLista] = useState<string>('');

  // Resultado compilado pronto para gravar
  const [parsedData, setParsedData] = useState<{
    cpus: ParsedCPUItem[];
    insumosBase: InsumoBase[];
    summary: {
      totalCPUs: number;
      totalInsumos: number;
      cpusComInsumos: number;
      cpusSemInsumos: number;
      totalCustoDireto: number;
      totalVenda: number;
    };
  } | null>(null);

  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedGuia, setCopiedGuia] = useState(false);

  if (!isOpen || !obra) return null;

  // 1-Clique: Carregar a Base de Dados Anexada (arquivos locais do projeto)
  const handleLoadAttachedFiles = async () => {
    setLoading(true);
    setLoadingMessage('Lendo os arquivos CSV anexados do projeto...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Ler Base de Composições
      const resComp = await fetch('/assets/aistudio/Base_Composicoes_2026-10-30_392e2e25.csv');
      if (!resComp.ok) throw new Error('Não foi possível ler o arquivo Base_Composicoes.');
      const textComp = await resComp.text();
      const recordsComp = parseCSV(textComp);
      const compMap = processBaseComposicoes(recordsComp);

      // 2. Ler Lista de CPUs
      const resLista = await fetch('/assets/aistudio/Lista_CPUs_2026-10-30__1__fb716be3.csv');
      if (!resLista.ok) throw new Error('Não foi possível ler o arquivo Lista_CPUs.');
      const textLista = await resLista.text();
      const recordsLista = parseCSV(textLista);
      const listMap = processListaCPUs(recordsLista);

      setComposicoesMap(compMap);
      setListaCPUsMap(listMap);
      setFileNameComposicoes('Base_Composicoes_2026-10-30_392e2e25.csv');
      setFileNameLista('Lista_CPUs_2026-10-30__1__fb716be3.csv');

      // 3. Mesclar bases
      const merged = mergeBasesData(compMap, listMap);
      setParsedData(merged);

      setSuccessMsg(
        `Base de dados carregada com sucesso! ${merged.summary.totalCPUs} CPUs e ${merged.summary.totalInsumos} insumos prontos para importação.`
      );
    } catch (err: any) {
      console.error('Erro ao ler arquivos anexados:', err);
      setErrorMsg(err.message || 'Erro ao carregar a base de dados anexada.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Upload manual de arquivos (CSV ou Excel)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setLoadingMessage('Processando arquivos enviados...');
    setErrorMsg('');
    setSuccessMsg('');

    let currentCompMap = new Map(composicoesMap);
    let currentListMap = new Map(listaCPUsMap);
    let newFileNameComp = fileNameComposicoes;
    let newFileNameList = fileNameLista;

    const processSingleFile = (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const isCsv = file.name.toLowerCase().endsWith('.csv');

        if (isCsv) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const text = evt.target?.result as string;
              const records = parseCSV(text);
              if (records.length === 0) {
                resolve();
                return;
              }

              // Verifica colunas para detectar o tipo de arquivo
              const firstRowKeys = Object.keys(records[0]).join(' ').toLowerCase();
              if (firstRowKeys.includes('insumo') || firstRowKeys.includes('coeficiente')) {
                currentCompMap = processBaseComposicoes(records);
                newFileNameComp = file.name;
              } else if (firstRowKeys.includes('quantidade') || firstRowKeys.includes('venda unit') || firstRowKeys.includes('f/cd')) {
                currentListMap = processListaCPUs(records);
                newFileNameList = file.name;
              } else {
                // Tenta como composições por padrão
                currentCompMap = processBaseComposicoes(records);
                newFileNameComp = file.name;
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsText(file, 'utf-8');
        } else {
          // Arquivo Excel (.xlsx, .xls)
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const sheetName = wb.SheetNames[0];
              const ws = wb.Sheets[sheetName];
              const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

              if (rows.length === 0) {
                resolve();
                return;
              }

              const stringRecords: Record<string, string>[] = rows.map((r) => {
                const item: Record<string, string> = {};
                Object.keys(r).forEach((k) => {
                  item[k] = String(r[k]);
                });
                return item;
              });

              const firstRowKeys = Object.keys(stringRecords[0]).join(' ').toLowerCase();
              if (firstRowKeys.includes('insumo') || firstRowKeys.includes('coeficiente')) {
                currentCompMap = processBaseComposicoes(stringRecords);
                newFileNameComp = file.name;
              } else {
                currentListMap = processListaCPUs(stringRecords);
                newFileNameList = file.name;
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsBinaryString(file);
        }
      });
    };

    // Processa todos os arquivos selecionados
    const promises: Promise<void>[] = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(processSingleFile(files[i]));
    }

    Promise.all(promises)
      .then(() => {
        setComposicoesMap(currentCompMap);
        setListaCPUsMap(currentListMap);
        setFileNameComposicoes(newFileNameComp);
        setFileNameLista(newFileNameList);

        const merged = mergeBasesData(currentCompMap, currentListMap);
        setParsedData(merged);
        setSuccessMsg(
          `Arquivos lidos com sucesso! ${merged.summary.totalCPUs} CPUs e ${merged.summary.totalInsumos} insumos identificados.`
        );
      })
      .catch((err) => {
        console.error('Erro ao ler arquivos:', err);
        setErrorMsg('Erro ao ler os arquivos selecionados. Verifique se estão no formato CSV ou Excel correto.');
      })
      .finally(() => {
        setLoading(false);
        setLoadingMessage('');
      });
  };

  // Gravar os dados compilados no Firestore da Obra selecionada
  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.cpus.length === 0) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setProgress({ current: 0, total: parsedData.cpus.length + parsedData.insumosBase.length });

    try {
      const res = await batchImportCPUsAndInsumos(
        obra.id,
        parsedData.cpus,
        parsedData.insumosBase,
        (current, total) => {
          setProgress({ current, total });
          setLoadingMessage(`Gravando no Firestore: ${current} de ${total} registros...`);
        }
      );

      setSuccessMsg(
        `🎉 Importação concluída com sucesso! Foram gravadas ${res.cpusImportadas} CPUs e ${res.insumosImportados} Insumos na obra "${obra.nome}".`
      );
      setParsedData(null);
      setProgress(null);
      onImportSuccess();
    } catch (err: any) {
      console.error('Erro ao salvar no Firestore:', err);
      setErrorMsg('Ocorreu um erro ao gravar os dados no Firestore. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Catálogo Padrão SEEL (1-Clique)
  const handleImportSeelPreset = async () => {
    setLoading(true);
    setLoadingMessage('Importando Catálogo Padrão SEEL...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let count = 0;
      for (const cpuData of CATALOGO_BD_CPU_SEEL) {
        await createCPU({
          ...cpuData,
          obraId: obra.id
        });
        for (const ins of cpuData.insumos) {
          await createInsumoBase({
            id_insumo: ins.id_insumo,
            tipo: ins.tipo,
            descricao: ins.descricao,
            unid: ins.unid,
            pr_unit: ins.pr_unit,
            obraId: obra.id
          });
        }
        count++;
      }
      setSuccessMsg(`Sucesso! ${count} composições padrão SEEL foram adicionadas à obra ${obra.nome}.`);
      onImportSuccess();
    } catch (err) {
      console.error('Erro:', err);
      setErrorMsg('Falha ao importar catálogo padrão.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Download do Script SQL para MySQL
  const handleDownloadMySQL = () => {
    const cpusToUse = parsedData ? parsedData.cpus : [];
    const insumosToUse = parsedData ? parsedData.insumosBase : [];

    const sql = generateMySQLMigrationScript(obra.nome, obra.codigo, cpusToUse, insumosToUse);
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `importar_${obra.codigo || 'obra'}_mysql.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download da Migration Laravel
  const handleDownloadMigrationLaravel = () => {
    const migration = generateLaravelMigration();
    const blob = new Blob([migration], { type: 'text/php;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '2026_10_30_000001_create_obras_and_cpus_tables.php');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download do Guia de Migração Markdown
  const handleDownloadGuia = () => {
    const guia = generateGuiaMigracaoLaravel();
    const blob = new Blob([guia], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GUIA_MIGRACAO_LARAVEL_MYSQL.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/40">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Importador de Base de Dados & Composições</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                  SEEL Engenharia
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Obra Alvo: <span className="text-emerald-400 font-bold">{obra.nome}</span> ({obra.codigo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('importar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'importar'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>1. Importar Base (CSVs / Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('migracao')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'migracao'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Server className="w-4 h-4 text-blue-500" />
            <span>2. Subir no MySQL / Laravel (Servidor Empresa)</span>
          </button>

          <button
            onClick={() => setActiveTab('padrao')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'padrao'
                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>3. Catálogo Padrão (Exemplo Rápido)</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: IMPORTAÇÃO DE CSVS / EXCEL */}
          {activeTab === 'importar' && (
            <div className="space-y-5">
              {/* Opção Rápida de 1-Clique com a Base Anexada */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                        Recomendado • 1-Clique
                      </span>
                      <h4 className="text-sm font-bold text-white">Carregar Base de Dados Anexada</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Carrega automaticamente os dois arquivos enviados pelo usuário contendo toda a estrutura de{' '}
                      <strong className="text-emerald-400">89 CPUs</strong> e{' '}
                      <strong className="text-emerald-400">400+ itens de insumos</strong>, com quantidades contratuais, coeficientes e preços.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-slate-400">
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700/80 font-mono text-[10px] text-slate-300">
                        📄 Base_Composicoes_2026-10-30_392e2e25.csv
                      </span>
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700/80 font-mono text-[10px] text-slate-300">
                        📄 Lista_CPUs_2026-10-30__1__fb716be3.csv
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLoadAttachedFiles}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-slate-950" />
                    )}
                    <span>{loading ? 'Carregando...' : 'Carregar Base Anexada'}</span>
                  </button>
                </div>
              </div>

              {/* Opção de Envio Manual de Novos Arquivos */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Ou selecione seus próprios arquivos (.csv, .xlsx, .xls)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Suporta padrão brasileiro (delimitador <code className="bg-slate-200 px-1 rounded">;</code> e vírgula decimal)
                  </span>
                </div>

                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                    Clique aqui para selecionar os arquivos CSV ou Excel
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Você pode selecionar um ou ambos os arquivos (Base de Composições e Lista de CPUs)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Status dos Arquivos Carregados */}
                {(fileNameComposicoes || fileNameLista) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Composições:</span>
                        <span className="text-xs font-bold text-slate-700 truncate block">
                          {fileNameComposicoes || 'Não carregado'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lista Contratual (Qtd/Preço):</span>
                        <span className="text-xs font-bold text-slate-700 truncate block">
                          {fileNameLista || 'Não carregado (opcional)'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prévia dos Dados Prontos para Gravação */}
              {parsedData && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-200 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Base Compilada com Sucesso!</span>
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Confira os totais antes de confirmar a gravação no banco de dados da obra.
                      </p>
                    </div>

                    <button
                      onClick={handleConfirmImport}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Gravando no Firestore...' : 'Confirmar e Gravar na Obra'}</span>
                    </button>
                  </div>

                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Total de CPUs</span>
                      <span className="text-lg font-black text-slate-800">{parsedData.summary.totalCPUs}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                        {parsedData.summary.cpusComInsumos} com insumos
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Insumos Únicos</span>
                      <span className="text-lg font-black text-slate-800">{parsedData.summary.totalInsumos}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Catálogo da obra</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Custo Direto Total</span>
                      <span className="text-sm font-black text-slate-800 truncate block">
                        {formatMoney(parsedData.summary.totalCustoDireto)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Soma insumos × qtd</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Venda Total Contrato</span>
                      <span className="text-sm font-black text-emerald-700 truncate block">
                        {formatMoney(parsedData.summary.totalVenda)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Preço unit × qtd</span>
                    </div>
                  </div>

                  {/* Amostra das primeiras CPUs */}
                  <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden text-xs">
                    <div className="bg-emerald-100/60 px-3 py-2 font-bold text-emerald-950 flex justify-between items-center text-[11px]">
                      <span>Exemplo das CPUs a serem gravadas (primeiras 5 de {parsedData.cpus.length}):</span>
                      <span className="text-emerald-700">Todas serão salvas ou atualizadas</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                      {parsedData.cpus.slice(0, 5).map((cpu) => (
                        <div key={cpu.code} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-mono font-bold text-blue-700 mr-2">{cpu.code}</span>
                            <span className="font-medium text-slate-800">{cpu.nome}</span>
                            <span className="text-slate-400 ml-2">({cpu.unidade})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 mr-3">
                              Qtd: <strong className="text-slate-700">{cpu.quantidade_prevista}</strong>
                            </span>
                            <span className="text-emerald-700 font-bold">
                              {cpu.insumos.length} insumos
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MIGRAÇÃO PARA LARAVEL & MYSQL (SERVIDOR DA EMPRESA) */}
          {activeTab === 'migracao' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-950 space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-bold text-blue-950">
                    Migração Descomplicada: Firebase → MySQL & Laravel
                  </h4>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Como você quer subir este sistema no <strong>servidor da sua empresa</strong> com <strong>Laravel e MySQL</strong>,
                  nós geramos todos os arquivos necessários para você não precisar programar nada do zero no banco de dados.
                </p>
              </div>

              {/* Botões de Download */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg w-fit mb-2">
                      <Database className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">1. Script SQL do MySQL</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Cria as tabelas <code>obras</code>, <code>cpus</code>, <code>insumos</code> e <code>cpu_insumos</code> e já insere todos os dados com 1 clique no phpMyAdmin!
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMySQL}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Script .SQL</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg w-fit mb-2">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">2. Migration do Laravel</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Arquivo de migration PHP pronto para a pasta <code>database/migrations/</code> para quem prefere rodar <code>php artisan migrate</code>.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMigrationLaravel}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Migration .PHP</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="p-2 bg-blue-100 text-blue-800 rounded-lg w-fit mb-2">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">3. Guia Passo a Passo</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Manual em português claro dizendo exatamente onde clicar no phpMyAdmin, o que digitar no arquivo <code>.env</code> do Laravel e como testar.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadGuia}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Manual Passo a Passo</span>
                  </button>
                </div>
              </div>

              {/* Guia Didático Rápido na Tela */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>O que fazer com esses arquivos no servidor da empresa? (Resumo)</span>
                </h5>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-800 block">Importar o Banco no MySQL</strong>
                      <span>
                        Abra o <strong>phpMyAdmin</strong> ou o gerenciador MySQL do servidor da empresa. Crie um banco (ex: <code>seel_obras</code>), clique na aba <strong>Importar</strong> (ou SQL) e selecione o arquivo <code>.sql</code> baixado acima. Clique em <strong>Executar</strong>. As 4 tabelas e todos os dados serão criados automaticamente!
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-800 block">Configurar o Laravel (.env)</strong>
                      <span>
                        No seu projeto Laravel, abra o arquivo <code>.env</code> e coloque o nome do banco, usuário e senha do MySQL:
                        <code className="block bg-slate-900 text-emerald-400 p-2 rounded mt-1 font-mono text-[11px]">
                          DB_CONNECTION=mysql<br />
                          DB_HOST=127.0.0.1<br />
                          DB_PORT=3306<br />
                          DB_DATABASE=seel_obras<br />
                          DB_USERNAME=root<br />
                          DB_PASSWORD=sua_senha
                        </code>
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-800 block">Pronto para Usar!</strong>
                      <span>
                        Seus dados já estão no formato relacional com chave primária e estrangeira padrão SQL.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATÁLOGO PADRÃO SEEL (PRESET) */}
          {activeTab === 'padrao' && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Catálogo Padrão SEEL Engenharia (Exemplo)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Carrega um conjunto de composições típicas de Geotecnia e Infraestrutura (Estaca Raiz, Tirantes, Alvenaria, Concretagem, Escavação) para testes rápidos caso não queira importar os arquivos CSV completos.
                </p>
              </div>

              <button
                onClick={handleImportSeelPreset}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{loading ? 'Carregando...' : 'Importar Catálogo Padrão SEEL na Obra'}</span>
              </button>
            </div>
          )}

          {/* Feedback & Progress */}
          {progress && (
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{loadingMessage}</span>
                <span className="text-emerald-400">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-3">
              <Check className="w-5 h-5 shrink-0 text-emerald-600" />
              <div className="font-bold leading-relaxed">{successMsg}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
