import React, { useState } from 'react';
import { Upload, Boxes, FileSpreadsheet, Check, AlertCircle, X, Download, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Obra, InsumoBase, TipoInsumo } from '../types';
import { createInsumoBase } from '../services/dbService';

interface ModalImportarInsumosProps {
  isOpen: boolean;
  activeObra: Obra | null;
  onClose: () => void;
  onImportSuccess: () => void;
}

// Catálogo Padrão de Insumos Geotécnicos e Construção Civil SEEL
const CATALOGO_INSUMOS_PADRAO_SEEL: Omit<InsumoBase, 'id'>[] = [
  { id_insumo: 'EQ01', tipo: 'Equipamento', descricao: 'Caminhão Munck 12t (Chassi + Guindaste)', unid: 'h', pr_unit: 185.0 },
  { id_insumo: 'EQ02', tipo: 'Equipamento', descricao: 'Bomba de Concreto Lança 32m', unid: 'h', pr_unit: 250.0 },
  { id_insumo: 'EQ03', tipo: 'Equipamento', descricao: 'Perfuratriz Hidráulica Geotécnica para Estaca Raiz', unid: 'h', pr_unit: 320.0 },
  { id_insumo: 'EQ04', tipo: 'Equipamento', descricao: 'Conjunto Perfuratriz Rotopercursiva + Compressor de Ar 750 PCM', unid: 'h', pr_unit: 380.0 },
  { id_insumo: 'EQ05', tipo: 'Equipamento', descricao: 'Conjunto Projetor de Concreto (Magriça) + Compressor de Ar', unid: 'h', pr_unit: 240.0 },
  { id_insumo: 'EQ06', tipo: 'Equipamento', descricao: 'Escavadeira Hidráulica 20t Esteira', unid: 'h', pr_unit: 280.0 },
  { id_insumo: 'EQ07', tipo: 'Equipamento', descricao: 'Gerador Silenciado 150 kVA Trifásico', unid: 'h', pr_unit: 95.0 },
  { id_insumo: 'EQ08', tipo: 'Equipamento', descricao: 'Retroescavadeira 4x4 Cabinada', unid: 'h', pr_unit: 175.0 },

  { id_insumo: 'MO01', tipo: 'Mão de Obra', descricao: 'Motorista de Caminhão Pesado / Munck', unid: 'h', pr_unit: 38.5 },
  { id_insumo: 'MO02', tipo: 'Mão de Obra', descricao: 'Rigger / Ajudante de Movimentação de Cargas', unid: 'h', pr_unit: 22.0 },
  { id_insumo: 'MO03', tipo: 'Mão de Obra', descricao: 'Pedreiro de Alvenaria e Estrutura', unid: 'h', pr_unit: 36.0 },
  { id_insumo: 'MO04', tipo: 'Mão de Obra', descricao: 'Servente de Obras / Ajudante Geral', unid: 'h', pr_unit: 21.0 },
  { id_insumo: 'MO05', tipo: 'Mão de Obra', descricao: 'Operador de Perfuratriz Geotécnica', unid: 'h', pr_unit: 45.0 },
  { id_insumo: 'MO06', tipo: 'Mão de Obra', descricao: 'Mangoteiro / Mangueireiro de Concreto Projetado', unid: 'h', pr_unit: 42.0 },
  { id_insumo: 'MO07', tipo: 'Mão de Obra', descricao: 'Operador de Escavadeira Hidráulica', unid: 'h', pr_unit: 42.0 },
  { id_insumo: 'MO08', tipo: 'Mão de Obra', descricao: 'Encarregado Geral de Obras e Sondagem', unid: 'h', pr_unit: 58.0 },
  { id_insumo: 'MO09', tipo: 'Mão de Obra', descricao: 'Sondador Geotécnico / Perfurador', unid: 'h', pr_unit: 40.0 },

  { id_insumo: 'MAT01', tipo: 'Material', descricao: 'Bloco de Concreto Estrutural 14x19x39cm', unid: 'un', pr_unit: 4.8 },
  { id_insumo: 'MAT02', tipo: 'Material', descricao: 'Argamassa Mista de Cimento e Cal para Assentamento', unid: 'kg', pr_unit: 0.85 },
  { id_insumo: 'MAT03', tipo: 'Material', descricao: 'Concreto Usinado Fck 30 MPa Brita 1 Slump 12', unid: 'm3', pr_unit: 420.0 },
  { id_insumo: 'MAT04', tipo: 'Material', descricao: 'Cimento Portland CP-III 40 RS (Injeção Geotécnica)', unid: 'sc', pr_unit: 38.0 },
  { id_insumo: 'MAT05', tipo: 'Material', descricao: 'Aço CA-50 em Barras ou Tubo de Aço Especial', unid: 'kg', pr_unit: 8.5 },
  { id_insumo: 'MAT06', tipo: 'Material', descricao: 'Cordoalha de Aço de Protensão 15.2mm / 7 Fios', unid: 'm', pr_unit: 14.5 },
  { id_insumo: 'MAT07', tipo: 'Material', descricao: 'Argamassa / Concreto Projetado Fck 25 MPa via Úmida', unid: 'm3', pr_unit: 490.0 },
  { id_insumo: 'MAT08', tipo: 'Material', descricao: 'Tela de Aço Electrosoldada Q-138 (10x10cm 4.2mm)', unid: 'm2', pr_unit: 22.0 },
  { id_insumo: 'MAT09', tipo: 'Material', descricao: 'Bentonita Sódica em Pó para Lama de Perfuração', unid: 'kg', pr_unit: 2.4 },
  { id_insumo: 'MAT10', tipo: 'Material', descricao: 'Aditivo Acelerador de Pega sem Cloreto para Projetado', unid: 'kg', pr_unit: 12.0 },
  { id_insumo: 'MAT11', tipo: 'Material', descricao: 'Tubo de Injeção de PVC de Alta Pressão Manchete 1"', unid: 'm', pr_unit: 9.8 }
];

export const ModalImportarInsumos: React.FC<ModalImportarInsumosProps> = ({
  isOpen,
  activeObra,
  onClose,
  onImportSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewInsumos, setPreviewInsumos] = useState<Omit<InsumoBase, 'id'>[] | null>(null);

  if (!isOpen) return null;

  // 1-Click SEEL Preset Insumos Import
  const handleImportSeelPresetInsumos = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let count = 0;
      for (const insData of CATALOGO_INSUMOS_PADRAO_SEEL) {
        await createInsumoBase({
          ...insData,
          obraId: activeObra?.id || 'obra-966'
        });
        count++;
      }

      setSuccessMsg(`Sucesso! ${count} insumos padrão do Banco SEEL foram cadastrados.`);
      onImportSuccess();
    } catch (err) {
      console.error('Erro ao importar catálogo de insumos:', err);
      setErrorMsg('Falha ao gravar insumos no Banco de Dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Excel / CSV File Upload Parser
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

        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || rows.length === 0) {
          setErrorMsg('A planilha enviada está vazia ou em formato incorreto.');
          setLoading(false);
          return;
        }

        const parsedList: Omit<InsumoBase, 'id'>[] = [];

        rows.forEach((row, idx) => {
          const id_insumo = String(
            row['id_insumo'] ||
              row['ID do Insumo'] ||
              row['ID Insumo'] ||
              row['ID'] ||
              row['Código'] ||
              row['Codigo'] ||
              `INS_${idx + 1}`
          ).trim();

          const descricao = String(
            row['nome'] ||
              row['Nome'] ||
              row['descricao'] ||
              row['Descrição'] ||
              row['Descrição Insumo'] ||
              row['Nome Insumo'] ||
              'Insumo Sem Descrição'
          ).trim();

          const rawTipo = String(
            row['tipo'] || row['Tipo'] || row['Tipo Insumo'] || row['Categoria'] || 'Material'
          ).trim();

          let tipo: TipoInsumo = 'Material';
          if (/m[ãa]o|mo|labor/i.test(rawTipo)) tipo = 'Mão de Obra';
          else if (/equip|eqp|eq|maquina/i.test(rawTipo)) tipo = 'Equipamento';
          else if (/terceiriz|terceiro|servi[çc]|subcontrat/i.test(rawTipo)) tipo = 'Terceirizado';

          const unid = String(
            row['unidade'] || row['unid'] || row['Unidade'] || row['Unid.'] || row['Unid'] || 'un'
          ).trim();

          const pr_unit = Number(
            row['preco_unitario'] ||
              row['pr_unit'] ||
              row['Preço Unitário'] ||
              row['Preço Unitario'] ||
              row['Preço'] ||
              row['Preco'] ||
              row['Valor'] ||
              row['Preço Unit. (R$)'] ||
              0
          );

          if (descricao && descricao !== '-') {
            parsedList.push({
              id_insumo,
              tipo,
              descricao,
              unid,
              pr_unit,
              obraId: activeObra?.id || 'obra-966'
            });
          }
        });

        if (parsedList.length === 0) {
          setErrorMsg('Nenhum insumo válido foi encontrado nas colunas da planilha.');
        } else {
          setPreviewInsumos(parsedList);
          setSuccessMsg(`Planilha lida com sucesso: ${parsedList.length} insumos identificados.`);
        }
      } catch (err) {
        console.error('Erro ao ler arquivo de insumos:', err);
        setErrorMsg('Falha ao processar a planilha. Certifique-se de usar .xlsx, .xls ou .csv.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Commit Parsed Insumos to Firestore
  const handleConfirmParsedImport = async () => {
    if (!previewInsumos || previewInsumos.length === 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      let count = 0;
      for (const insData of previewInsumos) {
        await createInsumoBase({
          ...insData,
          obraId: activeObra?.id || 'obra-966'
        });
        count++;
      }

      setSuccessMsg(`Concluído! ${count} insumos foram adicionados à Base de Insumos.`);
      setPreviewInsumos(null);
      onImportSuccess();
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      setErrorMsg('Erro ao gravar insumos no Banco de Dados Firestore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-purple-900 text-white p-5 flex justify-between items-center border-b border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/40 text-purple-200 rounded-lg border border-purple-400/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Importar Banco de Insumos</h3>
              <p className="text-xs text-purple-200">
                Cadastre insumos com ID, Tipo, Nome, Unidade e Preço Unitário para usar nas CPUs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Option 1: Preset SEEL Insumos */}
          <div className="bg-purple-50/60 p-5 rounded-xl border border-purple-100 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-700" />
                <span>Opção 1: Carga Rápida do Banco de Insumos Padrão SEEL</span>
              </h4>
              <p className="text-xs text-purple-800 mt-1">
                Carrega instantaneamente 26 insumos essenciais de Engenharia Geotécnica (Equipamentos de perfuração, Mão de obra qualificada e Materiais de injeção/estrutura).
              </p>
            </div>

            <button
              onClick={handleImportSeelPresetInsumos}
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-xs"
            >
              <Boxes className="w-4 h-4" />
              <span>{loading ? 'Carregando Insumos no Banco...' : 'Importar 26 Insumos Padrão SEEL'}</span>
            </button>
          </div>

          {/* Option 2: Upload Excel File */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Opção 2: Importar de Planilha Excel (.xlsx, .xls, .csv)</span>
            </h4>
            <p className="text-xs text-slate-500">
              A planilha deve conter as colunas: <strong className="text-slate-700">ID do Insumo, Tipo, Nome/Descrição, Unidade e Preço Unitário</strong>.
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-600 mb-2 transition" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-purple-700">
                Clique para selecionar a planilha de insumos
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                Colunas aceitas: ID, Tipo (Material/Mão de Obra/Equipamento), Nome, Unidade, Preço Unitário
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {previewInsumos && previewInsumos.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-purple-900 block">Prévia da Importação:</span>
                  <span className="text-purple-700">
                    {previewInsumos.length} insumos identificados e prontos para inserção na base.
                  </span>
                </div>
                <button
                  onClick={handleConfirmParsedImport}
                  disabled={loading}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3 py-1.5 rounded text-xs shadow transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Inserção</span>
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
