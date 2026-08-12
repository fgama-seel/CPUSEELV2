import React, { useState } from 'react';
import { Upload, Database, FileSpreadsheet, Check, AlertCircle, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Obra, CPU, InsumoBase, TipoInsumo, Insumo } from '../types';
import { createCPU, createInsumoBase, saveCPU } from '../services/dbService';

interface ModalImportarBDProps {
  isOpen: boolean;
  obra: Obra | null;
  onClose: () => void;
  onImportSuccess: () => void;
}

// Preset SEEL Composition Catalog (Complete BD CPU Dataset)
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
    code: '03010105',
    nome: 'CONCRETAGEM E ESTRUTURA DE CONCRETO ARMADO FCK 30 MPA',
    unidade: 'M3',
    prod_teorica: 1,
    praticabilidade: 1,
    horas_dia: 8,
    prod_efetiva: 1,
    quantidade_prevista: 350,
    preco_venda: 680.0,
    fator_fcd: 1.22,
    insumos: [
      { id_insumo: 'MAT03', tipo: 'Material', descricao: 'Concreto Usinado Fck 30 MPa Brita 1 Sump 12', unid: 'm3', coef: 1.05, pr_unit: 420.0 },
      { id_insumo: 'EQ02', tipo: 'Equipamento', descricao: 'Bomba de Concreto Lança 32m', unid: 'h', coef: 0.15, pr_unit: 250.0 },
      { id_insumo: 'MO03', tipo: 'Mão de Obra', descricao: 'Pedreiro de Alvenaria e Estrutura', unid: 'h', coef: 2.0, pr_unit: 36.0 },
      { id_insumo: 'MO04', tipo: 'Mão de Obra', descricao: 'Servente de Obras / Ajudante Geral', unid: 'h', coef: 4.0, pr_unit: 21.0 }
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
  },
  {
    code: '12030201',
    nome: 'EXECUÇÃO DE TIRANTE EM SOLO COM CAPACIDADE 40 TONELADAS',
    unidade: 'M',
    prod_teorica: 25,
    praticabilidade: 0.85,
    horas_dia: 8.8,
    prod_efetiva: 2.4147,
    quantidade_prevista: 850,
    preco_venda: 340.0,
    fator_fcd: 1.28,
    insumos: [
      { id_insumo: 'EQ04', tipo: 'Equipamento', descricao: 'Conjunto Perfuratriz Rotopercursiva + Compressor de Ar 750 PCM', unid: 'h', coef: 0.414, pr_unit: 380.0 },
      { id_insumo: 'MAT06', tipo: 'Material', descricao: 'Cordoalha de Aço de Protensão 15.2mm / Cordoalhas de 7 Fios', unid: 'm', coef: 4.2, pr_unit: 14.5 },
      { id_insumo: 'MAT04', tipo: 'Material', descricao: 'Cimento Portland CP-III 40 RS (Injeção)', unid: 'sc', coef: 1.5, pr_unit: 38.0 },
      { id_insumo: 'MO05', tipo: 'Mão de Obra', descricao: 'Operador de Perfuratriz Geotécnica', unid: 'h', coef: 0.414, pr_unit: 45.0 },
      { id_insumo: 'MO04', tipo: 'Mão de Obra', descricao: 'Servente de Obras / Ajudante Geral', unid: 'h', coef: 1.25, pr_unit: 21.0 }
    ],
    comentarios: []
  },
  {
    code: '12040101',
    nome: 'SOLO GRAMPEADO COM CONCRETO PROJETADO ESPESSURA 10CM',
    unidade: 'M2',
    prod_teorica: 40,
    praticabilidade: 0.8,
    horas_dia: 8.8,
    prod_efetiva: 3.636,
    quantidade_prevista: 2200,
    preco_venda: 195.0,
    fator_fcd: 1.2,
    insumos: [
      { id_insumo: 'EQ05', tipo: 'Equipamento', descricao: 'Conjunto Projetor de Concreto (Magriça) + Compressor de Ar', unid: 'h', coef: 0.275, pr_unit: 240.0 },
      { id_insumo: 'MAT07', tipo: 'Material', descricao: 'Argamassa / Concreto Projetado Fck 25 MPa via Úmida', unid: 'm3', coef: 0.12, pr_unit: 490.0 },
      { id_insumo: 'MAT08', tipo: 'Material', descricao: 'Tela de Aço Electrosoldada Q-138 (10x10cm 4.2mm)', unid: 'm2', coef: 1.15, pr_unit: 22.0 },
      { id_insumo: 'MO06', tipo: 'Mão de Obra', descricao: 'Mangoteiro / Mangueireiro de Concreto Projetado', unid: 'h', coef: 0.275, pr_unit: 42.0 },
      { id_insumo: 'MO04', tipo: 'Mão de Obra', descricao: 'Servente de Obras / Ajudante Geral', unid: 'h', coef: 0.8, pr_unit: 21.0 }
    ],
    comentarios: []
  },
  {
    code: '09010202',
    nome: 'ESCAVAÇÃO MECANIZADA DE VALA COM ESCAVADEIRA HIDRÁULICA',
    unidade: 'M3',
    prod_teorica: 40,
    praticabilidade: 0.8,
    horas_dia: 8.8,
    prod_efetiva: 3.636,
    quantidade_prevista: 4500,
    preco_venda: 85.0,
    fator_fcd: 1.18,
    insumos: [
      { id_insumo: 'EQ06', tipo: 'Equipamento', descricao: 'Escavadeira Hidráulica 20t Esteira', unid: 'h', coef: 0.275, pr_unit: 280.0 },
      { id_insumo: 'MO07', tipo: 'Mão de Obra', descricao: 'Operador de Escavadeira Hidráulica', unid: 'h', coef: 0.275, pr_unit: 42.0 }
    ],
    comentarios: []
  }
];

export const ModalImportarBD: React.FC<ModalImportarBDProps> = ({
  isOpen,
  obra,
  onClose,
  onImportSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewCount, setPreviewCount] = useState<{ cpus: number; insumos: number } | null>(null);
  const [parsedCPUs, setParsedCPUs] = useState<Omit<CPU, 'id' | 'obraId'>[] | null>(null);

  if (!isOpen || !obra) return null;

  // 1-Click SEEL Standard Catalog Import
  const handleImportSeelCatalog = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let importedCount = 0;
      for (const cpuData of CATALOGO_BD_CPU_SEEL) {
        // Create or update CPUs for active Obra
        await createCPU({
          ...cpuData,
          obraId: obra.id,
        });

        // Also save insumos into Banco de Insumos
        for (const ins of cpuData.insumos) {
          await createInsumoBase({
            id_insumo: ins.id_insumo,
            tipo: ins.tipo,
            descricao: ins.descricao,
            unid: ins.unid,
            pr_unit: ins.pr_unit,
            obraId: obra.id,
          });
        }
        importedCount++;
      }

      setSuccessMsg(`Sucesso! ${importedCount} composições do BD CPU SEEL foram importadas para a obra ${obra.nome}.`);
      onImportSuccess();
    } catch (err) {
      console.error('Erro ao importar BD CPU SEEL:', err);
      setErrorMsg('Falha ao importar o BD CPU. Verifique a conexão com o Firestore.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel File Upload & Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Iterate sheets or first sheet
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || rows.length === 0) {
          setErrorMsg('O arquivo enviado está vazio ou possui formato inválido.');
          setLoading(false);
          return;
        }

        // Group rows into CPUs by Code or ID
        const cpusMap = new Map<string, Omit<CPU, 'id' | 'obraId'>>();
        const insumosList: InsumoBase[] = [];

        rows.forEach((row, idx) => {
          const code = String(
            row['code'] || row['ID CPU'] || row['Código CPU'] || row['Codigo'] || row['ID'] || `CPU_${idx + 1}`
          ).trim();

          const nome = String(
            row['nome'] || row['Nome CPU'] || row['Serviço'] || row['Descricao CPU'] || row['Descrição'] || 'Serviço Sem Nome'
          ).trim();

          const unidade = String(row['unidade'] || row['Unid. CPU'] || row['Unid'] || row['Unidade'] || 'UN').trim();
          const preco_venda = Number(row['preco_venda'] || row['Preço Venda'] || row['Venda Unit. (R$)'] || row['Venda'] || 0);
          const quantidade_prevista = Number(row['quantidade_prevista'] || row['Quantidade'] || row['Qtd'] || 1);

          if (!cpusMap.has(code)) {
            cpusMap.set(code, {
              code,
              nome,
              unidade,
              prod_teorica: 1,
              praticabilidade: 1,
              horas_dia: 8.8,
              prod_efetiva: 1,
              quantidade_prevista,
              preco_venda,
              fator_fcd: 1,
              insumos: [],
              comentarios: [],
            });
          }

          const targetCpu = cpusMap.get(code)!;

          // Check if row contains an Insumo
          const insumoDesc = String(
            row['insumo'] || row['Descrição Insumo'] || row['Insumo'] || row['Descricao Insumo'] || ''
          ).trim();

          if (insumoDesc && insumoDesc !== '-') {
            const id_insumo = String(row['id_insumo'] || row['ID Insumo'] || `INS_${idx}`).trim();
            const tipo = (row['tipo'] || row['Tipo Insumo'] || row['Tipo'] || 'Material') as TipoInsumo;
            const unid = String(row['unid_insumo'] || row['Unid. Insumo'] || row['Unid'] || 'un').trim();
            const coef = Number(row['coef'] || row['Coeficiente'] || 1);
            const pr_unit = Number(row['pr_unit'] || row['Preço Unit. (R$)'] || row['Preco Unitario'] || 0);

            targetCpu.insumos.push({
              id_insumo,
              tipo: ['Material', 'Mão de Obra', 'Equipamento'].includes(tipo) ? tipo : 'Material',
              descricao: insumoDesc,
              unid,
              coef,
              pr_unit,
            });

            insumosList.push({
              id: id_insumo,
              id_insumo,
              tipo: ['Material', 'Mão de Obra', 'Equipamento'].includes(tipo) ? tipo : 'Material',
              descricao: insumoDesc,
              unid,
              pr_unit,
              obraId: obra.id,
            });
          }
        });

        const cpusArray = Array.from(cpusMap.values());
        setParsedCPUs(cpusArray);
        setPreviewCount({ cpus: cpusArray.length, insumos: insumosList.length });
        setSuccessMsg(`Planilha lida com sucesso: ${cpusArray.length} CPUs e ${insumosList.length} itens de insumo identificados.`);
      } catch (err) {
        console.error('Erro ao ler planilha:', err);
        setErrorMsg('Erro ao processar arquivo Excel. Certifique-se de que é um arquivo .xlsx ou .csv válido.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Commit Parsed CPUs to Firestore
  const handleConfirmParsedImport = async () => {
    if (!parsedCPUs || parsedCPUs.length === 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      let count = 0;
      for (const cpuData of parsedCPUs) {
        await createCPU({
          ...cpuData,
          obraId: obra.id,
        });

        for (const ins of cpuData.insumos) {
          await createInsumoBase({
            id_insumo: ins.id_insumo,
            tipo: ins.tipo,
            descricao: ins.descricao,
            unid: ins.unid,
            pr_unit: ins.pr_unit,
            obraId: obra.id,
          });
        }
        count++;
      }

      setSuccessMsg(`Importação concluída! ${count} CPUs foram adicionadas à obra ${obra.nome}.`);
      setParsedCPUs(null);
      setPreviewCount(null);
      onImportSuccess();
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      setErrorMsg('Ocorreu um erro ao gravar os dados no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Importar Banco de Dados CPU / Composições</h3>
              <p className="text-xs text-slate-400">
                Obra Alvo: <span className="text-emerald-400 font-bold">{obra.nome}</span>
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

        <div className="p-6 space-y-6">
          {/* Option 1: Preset SEEL Standard Catalog (1-Click) */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Opção 1: BD CPU Padrão SEEL Engenharia</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Carrega instantaneamente o catálogo completo de composições típicas de Geotecnia, Infraestrutura e Estruturas (Alvenaria, Concretagem, Estaca Raiz, Tirantes, Solo Grampeado, Escavação).
                </p>
              </div>
            </div>

            <button
              onClick={handleImportSeelCatalog}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-xs"
            >
              <Database className="w-4 h-4" />
              <span>{loading ? 'Carregando no Firestore...' : 'Importar Catálogo Padrão SEEL (BD CPU)'}</span>
            </button>
          </div>

          {/* Option 2: Upload Excel File */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Opção 2: Importar de Arquivo Excel (.xlsx, .xls, .csv)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Selecione sua planilha de BD CPU. O sistema fará a leitura e importação automática dos serviços e preços de insumos.
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                Clique para selecionar o arquivo Excel
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                Suporta formatos .xlsx, .xls e .csv
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {previewCount && parsedCPUs && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-blue-900 block">Prévia da Planilha:</span>
                  <span className="text-blue-700">
                    {previewCount.cpus} CPUs e {previewCount.insumos} insumos prontos para importação.
                  </span>
                </div>
                <button
                  onClick={handleConfirmParsedImport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-xs shadow transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Importação</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
