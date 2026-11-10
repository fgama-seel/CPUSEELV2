import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Truck,
  Building,
  FileSpreadsheet,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Upload,
  Sparkles,
  Layers,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Obra, CPU, ItemCustoIndireto, CategoriaIndireto, TaxasCorporativasObra, InsumoBase } from '../types';
import { formatMoney } from '../lib/excelExport';
import {
  subscribeCustosIndiretos,
  subscribeBancoInsumos,
  saveItemCustoIndireto,
  deleteItemCustoIndireto,
  batchSaveCustosIndiretos,
  updateObraTaxasCorporativas,
  saveCPU
} from '../services/dbService';

interface AbaCustosIndiretosProps {
  activeObra: Obra | null;
  cpus: CPU[];
  onSelectTab?: (tab: any) => void;
  onSelectCpu?: (cpuId: string) => void;
}

// Preset SEEL baseado nos PDFs enviados (Mão de Obra Indireta, Equipamentos, Canteiro e Diversos)
const PRESET_CUSTOS_INDIRETOS: Omit<ItemCustoIndireto, 'id' | 'obraId'>[] = [
  // 1. Mão de Obra Indireta (Adm Local)
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-01', descricao: 'Gerente de Contrato', unidade: 'MÊS', quantidade: 22, precoUnitario: 46156.25, custoTotal: 1015437.5 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-02', descricao: 'Engenheiro Coordenador', unidade: 'MÊS', quantidade: 22, precoUnitario: 23879.49, custoTotal: 525348.78 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-03', descricao: 'Engenheiro de Planejamento e Controle', unidade: 'MÊS', quantidade: 21, precoUnitario: 23879.49, custoTotal: 501469.29 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-04', descricao: 'Engenheiro Civil Trainee', unidade: 'MÊS', quantidade: 20, precoUnitario: 16349.16, custoTotal: 326983.2 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-05', descricao: 'Analista de Planejamento', unidade: 'MÊS', quantidade: 21, precoUnitario: 7834.82, custoTotal: 164531.22 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-06', descricao: 'Analista de Medição e Custos', unidade: 'MÊS', quantidade: 21, precoUnitario: 4564.28, custoTotal: 95849.88 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-07', descricao: 'Mestre de Obras / Campo', unidade: 'MÊS', quantidade: 21, precoUnitario: 12075.4, custoTotal: 253583.4 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-08', descricao: 'Encarregado Geral de Obras', unidade: 'MÊS', quantidade: 21, precoUnitario: 9803.6, custoTotal: 205875.6 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-09', descricao: 'Topógrafo de Obra', unidade: 'MÊS', quantidade: 21, precoUnitario: 8712.21, custoTotal: 182956.41 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-10', descricao: 'Técnico em Segurança do Trabalho (QSMS)', unidade: 'MÊS', quantidade: 21, precoUnitario: 7796.32, custoTotal: 163722.72 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-11', descricao: 'Encarregado Administrativo', unidade: 'MÊS', quantidade: 21, precoUnitario: 10320.32, custoTotal: 216726.72 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-12', descricao: 'Comprador / Suprimentos', unidade: 'MÊS', quantidade: 21, precoUnitario: 7073.51, custoTotal: 148543.71 },
  { categoria: 'ADM_LOCAL_MO', codigo: 'MOI-13', descricao: 'Motorista de Apoio Administrativo', unidade: 'MÊS', quantidade: 21, precoUnitario: 7203.33, custoTotal: 151269.93 },

  // 2. Equipamentos Indiretos (Adm Local & Apoio)
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-01', descricao: 'Carro Básico de Apoio (Locação + Combustível)', unidade: 'MÊS', quantidade: 21, precoUnitario: 6063.7, custoTotal: 127337.7 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-02', descricao: 'Carro Utilitário (Pick-up leve)', unidade: 'MÊS', quantidade: 21, precoUnitario: 4500.0, custoTotal: 94500.0 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-03', descricao: 'Caminhonete 4x4 Cabine Dupla (Geotecnia)', unidade: 'MÊS', quantidade: 21, precoUnitario: 9863.7, custoTotal: 207137.7 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-04', descricao: 'Ônibus de Transporte Coletivo de Pessoal', unidade: 'MÊS', quantidade: 21, precoUnitario: 20000.0, custoTotal: 420000.0 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-05', descricao: 'Van de Transporte de Equipes Técnicas', unidade: 'MÊS', quantidade: 21, precoUnitario: 21700.0, custoTotal: 455700.0 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-06', descricao: 'Caminhão Munck 20t (Apoio ao Canteiro)', unidade: 'MÊS', quantidade: 21, precoUnitario: 27420.4, custoTotal: 575828.4 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-07', descricao: 'Ambulância de Emergência no Canteiro', unidade: 'MÊS', quantidade: 21, precoUnitario: 14000.0, custoTotal: 294000.0 },
  { categoria: 'EQUIPAMENTOS_INDIRETOS', codigo: 'EQI-08', descricao: 'Caminhão Pipa 10.000L (Água e Poeira)', unidade: 'MÊS', quantidade: 21, precoUnitario: 17000.0, custoTotal: 357000.0 },

  // 3. Instalação e Operação de Canteiro
  { categoria: 'CANTEIRO', codigo: 'CNT-01', descricao: 'Serviços Preliminares (Desmatamento, Terraplanagem e Brita)', unidade: 'vb', quantidade: 1, precoUnitario: 14000.0, custoTotal: 14000.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-02', descricao: 'Área de Vivência, Telhamento e Coberturas', unidade: 'vb', quantidade: 1, precoUnitario: 42485.0, custoTotal: 42485.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-03', descricao: 'Containers Escritório e Fiscalização (Locação Mensal)', unidade: 'MÊS', quantidade: 22, precoUnitario: 4000.0, custoTotal: 88000.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-04', descricao: 'Containers Vestiário e Sanitário com Caixa Coletora', unidade: 'MÊS', quantidade: 22, precoUnitario: 5600.0, custoTotal: 123200.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-05', descricao: 'Containers Refeitório e Mobiliário para 100 operários', unidade: 'MÊS', quantidade: 22, precoUnitario: 4500.0, custoTotal: 99000.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-06', descricao: 'Instalação Elétrica, Transformador, Luz e Força', unidade: 'vb', quantidade: 1, precoUnitario: 68350.0, custoTotal: 68350.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-07', descricao: 'Gerador 100 kVA com Combustível e Manutenção', unidade: 'MÊS', quantidade: 21, precoUnitario: 16000.0, custoTotal: 336000.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-08', descricao: 'Vigilância Armada 24h Canteiro Central', unidade: 'MÊS', quantidade: 21, precoUnitario: 18000.0, custoTotal: 378000.0 },
  { categoria: 'CANTEIRO', codigo: 'CNT-09', descricao: 'Banheiros Químicos e Limpeza Especializada', unidade: 'MÊS', quantidade: 22, precoUnitario: 5000.0, custoTotal: 110000.0 },

  // 4. Diversos & Consultorias
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-01', descricao: 'Projeto Executivo Geotécnico e Estrutural', unidade: 'vb', quantidade: 1, precoUnitario: 95000.0, custoTotal: 95000.0 },
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-02', descricao: 'Projetos As Built e Documentação Técnica', unidade: 'vb', quantidade: 1, precoUnitario: 60000.0, custoTotal: 60000.0 },
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-03', descricao: 'Topografia e Nivelamento com Drones / Laser', unidade: 'MÊS', quantidade: 21, precoUnitario: 18000.0, custoTotal: 378000.0 },
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-04', descricao: 'Controle Tecnológico de Concreto e Caldas de Cimento', unidade: 'vb', quantidade: 1, precoUnitario: 52472.7, custoTotal: 52472.7 },
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-05', descricao: 'Consultoria Especializada em Geotecnia e Fundações', unidade: 'MÊS', quantidade: 6, precoUnitario: 30000.0, custoTotal: 180000.0 },
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-06', descricao: 'Softwares Técnicos (AutoCAD, MS Project, Office)', unidade: 'MÊS', quantidade: 21, precoUnitario: 3570.0, custoTotal: 74970.0 },
  { categoria: 'DIVERSOS_CONSULTORIA', codigo: 'DIV-07', descricao: 'Equipamentos de Proteção Coletiva (EPC) e Linha de Vida', unidade: 'vb', quantidade: 1, precoUnitario: 20813.78, custoTotal: 20813.78 }
];

export const AbaCustosIndiretos: React.FC<AbaCustosIndiretosProps> = ({
  activeObra,
  cpus,
  onSelectTab,
  onSelectCpu
}) => {
  const [itensIndiretos, setItensIndiretos] = useState<ItemCustoIndireto[]>([]);
  const [bancoInsumos, setBancoInsumos] = useState<InsumoBase[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaIndireto | 'CPUS_INDIRETAS' | 'TAXAS'>('ADM_LOCAL_MO');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal de Novo/Editar Item
  const [modalItemOpen, setModalItemOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemCustoIndireto | null>(null);

  // Form State
  const [formIdInsumoBase, setFormIdInsumoBase] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formUnidade, setFormUnidade] = useState('MÊS');
  const [formQuantidade, setFormQuantidade] = useState<number>(1);
  const [formPrecoUnitario, setFormPrecoUnitario] = useState<number>(0);
  const [formCategoria, setFormCategoria] = useState<CategoriaIndireto>('ADM_LOCAL_MO');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');

  // Taxas Corporativas
  const [taxas, setTaxas] = useState<TaxasCorporativasObra>({
    custoComercialPerc: activeObra?.taxasCorporativas?.custoComercialPerc ?? 0.35,
    seguroRiscoEngenhariaPerc: activeObra?.taxasCorporativas?.seguroRiscoEngenhariaPerc ?? 0.75,
    custoAdmUNsPerc: activeObra?.taxasCorporativas?.custoAdmUNsPerc ?? 0.30,
    taxaPortalPerc: activeObra?.taxasCorporativas?.taxaPortalPerc ?? 0.00,
    riscoInflacionarioPerc: activeObra?.taxasCorporativas?.riscoInflacionarioPerc ?? 1.59,
    riscoContingenciasPerc: activeObra?.taxasCorporativas?.riscoContingenciasPerc ?? 1.21,
    bdiReferenciaPerc: activeObra?.taxasCorporativas?.bdiReferenciaPerc ?? 26.42,
    admCentralPerc: activeObra?.taxasCorporativas?.admCentralPerc ?? 11.98,
    custoFinanceiroEmpresaPerc: activeObra?.taxasCorporativas?.custoFinanceiroEmpresaPerc ?? 2.17,
    custoFinanceiroNegocioPerc: activeObra?.taxasCorporativas?.custoFinanceiroNegocioPerc ?? 0.02,
    lucroPerc: activeObra?.taxasCorporativas?.lucroPerc ?? 12.25,
    impostosPerc: activeObra?.taxasCorporativas?.impostosPerc ?? 9.20
  });

  const [savingTaxas, setSavingTaxas] = useState(false);
  const [taxasSalvasSucesso, setTaxasSalvasSucesso] = useState(false);

  // Subscribe aos itens de custos indiretos e banco de insumos da obra
  useEffect(() => {
    if (!activeObra) return;
    const unsub1 = subscribeCustosIndiretos(activeObra.id, (list) => {
      setItensIndiretos(list);
    });
    const unsub2 = subscribeBancoInsumos(activeObra.id, (list) => {
      setBancoInsumos(list);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [activeObra?.id]);

  if (!activeObra) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-700">Nenhuma obra selecionada</h3>
        <p className="text-sm">Selecione uma obra no menu lateral para visualizar e gerenciar os Custos Indiretos.</p>
      </div>
    );
  }

  // CPUs marcadas como Indiretas
  const cpusIndiretas = cpus.filter((c) => c.isCustoIndireto === true);
  const totalCustoCpusIndiretas = cpusIndiretas.reduce((acc, c) => {
    const qtd = Number(c.quantidade_prevista) || 1;
    let custoUnt = 0;
    if (c.insumos) {
      c.insumos.forEach((ins) => {
        custoUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }
    return acc + custoUnt * qtd;
  }, 0);

  // Totais por categoria de custos indiretos
  const totalAdmLocal = itensIndiretos
    .filter((i) => i.categoria === 'ADM_LOCAL_MO')
    .reduce((acc, i) => acc + (Number(i.custoTotal) || 0), 0);

  const totalEquipamentos = itensIndiretos
    .filter((i) => i.categoria === 'EQUIPAMENTOS_INDIRETOS')
    .reduce((acc, i) => acc + (Number(i.custoTotal) || 0), 0);

  const totalCanteiro = itensIndiretos
    .filter((i) => i.categoria === 'CANTEIRO')
    .reduce((acc, i) => acc + (Number(i.custoTotal) || 0), 0);

  const totalDiversos = itensIndiretos
    .filter((i) => i.categoria === 'DIVERSOS_CONSULTORIA')
    .reduce((acc, i) => acc + (Number(i.custoTotal) || 0), 0);

  // Venda Total Contratual para aplicação das taxas corporativas
  const vendaTotalContrato = cpus.reduce((acc, c) => {
    const qtd = Number(c.quantidade_prevista) || 1;
    let custoUnt = 0;
    if (c.insumos) {
      c.insumos.forEach((ins) => {
        custoUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }
    const bdi = activeObra.bdi ?? 25;
    const vUnt = c.vendaDefinida ? (Number(c.preco_venda) || 0) : custoUnt * (1 + bdi / 100);
    return acc + vUnt * qtd;
  }, 0);

  // Custo Direto Total
  const custoDiretoTotal = cpus
    .filter((c) => !c.isCustoIndireto)
    .reduce((acc, c) => {
      const qtd = Number(c.quantidade_prevista) || 1;
      let cUnt = 0;
      if (c.insumos) {
        c.insumos.forEach((ins) => {
          cUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
        });
      }
      return acc + cUnt * qtd;
    }, 0);

  // Cálculo das Taxas Corporativas
  const totalTaxasCorporativas =
    (vendaTotalContrato * (taxas.custoComercialPerc / 100)) +
    (vendaTotalContrato * (taxas.seguroRiscoEngenhariaPerc / 100)) +
    (vendaTotalContrato * (taxas.custoAdmUNsPerc / 100)) +
    (vendaTotalContrato * (taxas.taxaPortalPerc / 100)) +
    (custoDiretoTotal * (taxas.riscoInflacionarioPerc / 100)) +
    (custoDiretoTotal * (taxas.riscoContingenciasPerc / 100));

  // Custo Indireto Global Consolidado
  const custoIndiretoGlobal =
    totalCustoCpusIndiretas +
    totalAdmLocal +
    totalEquipamentos +
    totalCanteiro +
    totalDiversos +
    totalTaxasCorporativas;

  // Filtragem dos itens exibidos
  const itensFiltrados = itensIndiretos.filter((i) => {
    if (categoriaAtiva !== 'CPUS_INDIRETAS' && categoriaAtiva !== 'TAXAS') {
      if (i.categoria !== categoriaAtiva) return false;
    }
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      i.descricao.toLowerCase().includes(b) ||
      (i.codigo && i.codigo.toLowerCase().includes(b)) ||
      i.unidade.toLowerCase().includes(b)
    );
  });

  // Abertura do modal para novo item
  const handleNovoItem = (cat?: CategoriaIndireto) => {
    setItemEmEdicao(null);
    setFormIdInsumoBase('');
    setFormCodigo('');
    setFormDescricao('');
    setFormUnidade('MÊS');
    setFormQuantidade(1);
    setFormPrecoUnitario(0);
    setFormDataInicio('');
    setFormDataFim('');
    setFormCategoria(cat || (categoriaAtiva !== 'CPUS_INDIRETAS' && categoriaAtiva !== 'TAXAS' ? categoriaAtiva : 'ADM_LOCAL_MO'));
    setModalItemOpen(true);
  };

  // Edição de item existente
  const handleEditarItem = (item: ItemCustoIndireto) => {
    setItemEmEdicao(item);
    setFormIdInsumoBase(item.idInsumoBase || '');
    setFormCodigo(item.codigo || '');
    setFormDescricao(item.descricao);
    setFormUnidade(item.unidade);
    setFormQuantidade(item.quantidade);
    setFormPrecoUnitario(item.precoUnitario);
    setFormDataInicio(item.dataInicio || '');
    setFormDataFim(item.dataFim || '');
    setFormCategoria(item.categoria);
    setModalItemOpen(true);
  };

  // Ao selecionar um insumo do Banco de Insumos
  const handleSelectInsumoBase = (insumoId: string) => {
    setFormIdInsumoBase(insumoId);
    const found = bancoInsumos.find((i) => i.id === insumoId || i.id_insumo === insumoId);
    if (found) {
      setFormCodigo(found.id_insumo || '');
      setFormDescricao(found.descricao);
      setFormUnidade(found.unid || 'MÊS');
      setFormPrecoUnitario(found.pr_unit || 0);

      // Sugere categoria com base no tipo do insumo
      const tNorm = (found.tipo || '').toLowerCase();
      if (tNorm.includes('mão') || tNorm.includes('mo')) {
        setFormCategoria('ADM_LOCAL_MO');
      } else if (tNorm.includes('equip') || tNorm === 'eq') {
        setFormCategoria('EQUIPAMENTOS_INDIRETOS');
      } else if (tNorm.includes('mat')) {
        setFormCategoria('CANTEIRO');
      } else if (tNorm.includes('serv')) {
        setFormCategoria('DIVERSOS_CONSULTORIA');
      }
    }
  };

  // Atualização de quantidade automática ao mudar datas de início/fim
  const handleCalculateDateMonths = (dtIni: string, dtFim: string) => {
    if (!dtIni || !dtFim) return;
    const d1 = new Date(dtIni);
    const d2 = new Date(dtFim);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return;

    // Calcula quantidade de meses de vigência do recurso
    const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
    if (months > 0) {
      setFormQuantidade(months);
    }
  };

  // Salvar item
  const handleSalvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescricao.trim()) {
      alert('Selecione ou informe a descrição do recurso.');
      return;
    }

    const qtd = Number(formQuantidade) || 0;
    const prUn = Number(formPrecoUnitario) || 0;
    const itemData: ItemCustoIndireto = {
      id: itemEmEdicao?.id || `ind-${activeObra.id}-${Date.now()}`,
      obraId: activeObra.id,
      categoria: formCategoria,
      idInsumoBase: formIdInsumoBase || undefined,
      codigo: formCodigo.trim(),
      descricao: formDescricao.trim(),
      unidade: formUnidade.trim() || 'MÊS',
      quantidade: qtd,
      precoUnitario: prUn,
      custoTotal: qtd * prUn,
      dataInicio: formDataInicio || undefined,
      dataFim: formDataFim || undefined
    };

    setLoading(true);
    try {
      await saveItemCustoIndireto(itemData);
      setModalItemOpen(false);
    } catch (err) {
      console.error('Erro ao salvar custo indireto:', err);
    } finally {
      setLoading(false);
    }
  };

  // Excluir item
  const handleExcluirItem = async (id: string) => {
    if (!window.confirm('Deseja excluir este item de custo indireto?')) return;
    try {
      await deleteItemCustoIndireto(id);
    } catch (err) {
      console.error('Erro ao excluir custo indireto:', err);
    }
  };

  // Carregar Catálogo Padrão SEEL
  const handleCarregarPresetSEEL = async () => {
    if (
      itensIndiretos.length > 0 &&
      !window.confirm(
        'Esta obra já possui itens de custos indiretos cadastrados. Deseja carregar o catálogo padrão SEEL e complementar com os novos itens?'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const novosItens: ItemCustoIndireto[] = PRESET_CUSTOS_INDIRETOS.map((p, index) => ({
        ...p,
        id: `ind-${activeObra.id}-${p.categoria}-${index + 1}`,
        obraId: activeObra.id
      }));
      await batchSaveCustosIndiretos(activeObra.id, novosItens);
    } catch (err) {
      console.error('Erro ao carregar catálogo de indiretos SEEL:', err);
    } finally {
      setLoading(false);
    }
  };

  // Salvar Taxas Corporativas
  const handleSalvarTaxas = async () => {
    setSavingTaxas(true);
    setTaxasSalvasSucesso(false);
    try {
      await updateObraTaxasCorporativas(activeObra.id, taxas);
      setTaxasSalvasSucesso(true);
      setTimeout(() => setTaxasSalvasSucesso(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar taxas:', err);
    } finally {
      setSavingTaxas(false);
    }
  };

  // Alternar CPU para Custo Direto
  const handleAlternarParaDireto = async (cpu: CPU) => {
    const updated: CPU = {
      ...cpu,
      isCustoIndireto: false,
      updatedAt: new Date().toISOString()
    };
    await saveCPU(updated);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Orçamento de Apoio & Canteiro
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">
              {activeObra.codigo} - {activeObra.nome}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-600" />
            <span>Custos Indiretos da Obra</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
            Gerenciamento consolidado de todos os custos de apoio, supervisão, canteiro, logística, consultorias e taxas corporativas não inseridos diretamente nas CPUs unitárias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCarregarPresetSEEL}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Carrega os 35+ itens padrões dos PDFs de Canteiro, Adm Local e Diversos"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Carregar Modelo Padrão SEEL</span>
          </button>

          {categoriaAtiva !== 'CPUS_INDIRETAS' && categoriaAtiva !== 'TAXAS' && (
            <button
              onClick={() => handleNovoItem()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Item</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS CONSOLIDADOS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
            Total Indiretos
          </span>
          <span className="text-base font-black text-amber-950 font-mono block mt-1">
            {formatMoney(custoIndiretoGlobal)}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
            Reflete no Resumo
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            1. Adm Local (MO)
          </span>
          <span className="text-sm font-black text-slate-800 font-mono block mt-1">
            {formatMoney(totalAdmLocal)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {itensIndiretos.filter((i) => i.categoria === 'ADM_LOCAL_MO').length} itens cadastrados
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            2. Equipamentos
          </span>
          <span className="text-sm font-black text-slate-800 font-mono block mt-1">
            {formatMoney(totalEquipamentos)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {itensIndiretos.filter((i) => i.categoria === 'EQUIPAMENTOS_INDIRETOS').length} itens cadastrados
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            3. Canteiro
          </span>
          <span className="text-sm font-black text-slate-800 font-mono block mt-1">
            {formatMoney(totalCanteiro)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {itensIndiretos.filter((i) => i.categoria === 'CANTEIRO').length} itens cadastrados
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
            4. Diversos & Consult.
          </span>
          <span className="text-sm font-black text-slate-800 font-mono block mt-1">
            {formatMoney(totalDiversos)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {itensIndiretos.filter((i) => i.categoria === 'DIVERSOS_CONSULTORIA').length} itens cadastrados
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase block tracking-wider">
            5. CPUs Indiretas
          </span>
          <span className="text-sm font-black text-purple-950 font-mono block mt-1">
            {formatMoney(totalCustoCpusIndiretas)}
          </span>
          <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
            {cpusIndiretas.length} CPUs classificadas
          </span>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUB-ABAS DOS CUSTOS INDIRETOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/80 px-2 pt-2 gap-1">
          <button
            onClick={() => setCategoriaAtiva('ADM_LOCAL_MO')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'ADM_LOCAL_MO'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Mão de Obra Indireta ({itensIndiretos.filter((i) => i.categoria === 'ADM_LOCAL_MO').length})</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('EQUIPAMENTOS_INDIRETOS')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'EQUIPAMENTOS_INDIRETOS'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Equipamentos Indiretos ({itensIndiretos.filter((i) => i.categoria === 'EQUIPAMENTOS_INDIRETOS').length})</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('CANTEIRO')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'CANTEIRO'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" />
            <span>Canteiro de Obras ({itensIndiretos.filter((i) => i.categoria === 'CANTEIRO').length})</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('DIVERSOS_CONSULTORIA')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'DIVERSOS_CONSULTORIA'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Diversos & Consultorias ({itensIndiretos.filter((i) => i.categoria === 'DIVERSOS_CONSULTORIA').length})</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('TAXAS')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'TAXAS'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Percent className="w-4 h-4 text-rose-600" />
            <span>Taxas Comerciais & Corporativas</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('CPUS_INDIRETAS')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'CPUS_INDIRETAS'
                ? 'bg-white text-purple-700 border-t-2 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>CPUs Marcadas como Indiretas ({cpusIndiretas.length})</span>
          </button>
        </div>

        {/* CONTEÚDO DA SUB-ABA ATIVA */}
        <div className="p-4">
          {/* VISUALIZAÇÃO: ITENS DAS TABELAS (ADM LOCAL, EQUIPAMENTOS, CANTEIRO, DIVERSOS) */}
          {categoriaAtiva !== 'CPUS_INDIRETAS' && categoriaAtiva !== 'TAXAS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Filtrar por código ou descrição..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="text-xs font-bold text-slate-700 flex items-center gap-3">
                  <span>Subtotal Categoria:</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    {formatMoney(itensFiltrados.reduce((a, b) => a + (Number(b.custoTotal) || 0), 0))}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white select-none uppercase tracking-wider text-[11px]">
                      <th className="p-3 w-24">Código</th>
                      <th className="p-3">Descrição do Item Indireto</th>
                      <th className="p-3 text-center w-20">Unidade</th>
                      <th className="p-3 text-right w-24">Qtd / Meses</th>
                      <th className="p-3 text-right w-32">Preço Unitário</th>
                      <th className="p-3 text-right w-36">Custo Total</th>
                      <th className="p-3 text-center w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itensFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          Nenhum item cadastrado nesta categoria. Clique em "+ Adicionar Item" ou use "Carregar Modelo Padrão SEEL" acima.
                        </td>
                      </tr>
                    ) : (
                      itensFiltrados.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-slate-500">{item.codigo || '-'}</td>
                          <td className="p-3 font-medium text-slate-800">{item.descricao}</td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {item.unidade}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">{item.quantidade}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{formatMoney(item.precoUnitario)}</td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            {formatMoney(item.custoTotal)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditarItem(item)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                title="Editar Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleExcluirItem(item.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Excluir Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO: TAXAS CORPORATIVAS (% SOBRE CONTRATO) */}
          {categoriaAtiva === 'TAXAS' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-rose-950 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <strong className="text-sm">Taxas Corporativas & Outros Custos Indiretos da Empresa</strong>
                </div>
                <p className="leading-relaxed">
                  Conforme a planilha orçamentária SEEL, estes custos representam percentuais aplicados sobre a Venda Total (ou sobre o Custo Direto) para cobrir riscos, comercialização, seguros de engenharia e contingências.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                    Percentuais sobre a Venda Contratual ({formatMoney(vendaTotalContrato)})
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Custo Comercial:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={taxas.custoComercialPerc}
                          onChange={(e) => setTaxas({ ...taxas, custoComercialPerc: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <span className="font-mono text-slate-800 font-bold w-28 text-right">
                          {formatMoney(vendaTotalContrato * (taxas.custoComercialPerc / 100))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Seguro de Risco de Engenharia:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={taxas.seguroRiscoEngenhariaPerc}
                          onChange={(e) => setTaxas({ ...taxas, seguroRiscoEngenhariaPerc: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <span className="font-mono text-slate-800 font-bold w-28 text-right">
                          {formatMoney(vendaTotalContrato * (taxas.seguroRiscoEngenhariaPerc / 100))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Custo Administrativo das UNs:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={taxas.custoAdmUNsPerc}
                          onChange={(e) => setTaxas({ ...taxas, custoAdmUNsPerc: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <span className="font-mono text-slate-800 font-bold w-28 text-right">
                          {formatMoney(vendaTotalContrato * (taxas.custoAdmUNsPerc / 100))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Taxa de Portal p/ Faturamento:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={taxas.taxaPortalPerc}
                          onChange={(e) => setTaxas({ ...taxas, taxaPortalPerc: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <span className="font-mono text-slate-800 font-bold w-28 text-right">
                          {formatMoney(vendaTotalContrato * (taxas.taxaPortalPerc / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                    Riscos & Contingências sobre Custo Direto ({formatMoney(custoDiretoTotal)})
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Risco Inflacionário:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={taxas.riscoInflacionarioPerc}
                          onChange={(e) => setTaxas({ ...taxas, riscoInflacionarioPerc: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <span className="font-mono text-slate-800 font-bold w-28 text-right">
                          {formatMoney(custoDiretoTotal * (taxas.riscoInflacionarioPerc / 100))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Risco / Contingência / Mitigação:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={taxas.riscoContingenciasPerc}
                          onChange={(e) => setTaxas({ ...taxas, riscoContingenciasPerc: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="font-bold text-slate-500">%</span>
                        <span className="font-mono text-slate-800 font-bold w-28 text-right">
                          {formatMoney(custoDiretoTotal * (taxas.riscoContingenciasPerc / 100))}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <strong className="text-slate-800">Total Outros Custos Indiretos:</strong>
                      <span className="font-mono text-base font-black text-rose-700">
                        {formatMoney(totalTaxasCorporativas)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {taxasSalvasSucesso && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Taxas salvas com sucesso!
                  </span>
                )}
                <button
                  onClick={handleSalvarTaxas}
                  disabled={savingTaxas}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingTaxas ? 'Salvando...' : 'Salvar Taxas na Obra'}</span>
                </button>
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO: CPUS MARCADAS COMO INDIRETAS */}
          {categoriaAtiva === 'CPUS_INDIRETAS' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-purple-950 text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>CPUs Unitárias Classificadas como Custo Indireto</span>
                  </h4>
                  <p className="mt-0.5 text-purple-800">
                    O custo destas composições é somado integralmente ao Custo Indireto da Obra, aliviando o Custo Direto da produção.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-purple-600 uppercase font-bold block">Soma CPUs Indiretas</span>
                  <span className="font-mono text-lg font-black text-purple-950">{formatMoney(totalCustoCpusIndiretas)}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white select-none uppercase tracking-wider text-[11px]">
                      <th className="p-3 w-16">Seq.</th>
                      <th className="p-3 w-28">Código</th>
                      <th className="p-3">Serviço / Composição</th>
                      <th className="p-3 text-center w-20">Unidade</th>
                      <th className="p-3 text-right w-24">Quantidade</th>
                      <th className="p-3 text-right w-36">Custo Total</th>
                      <th className="p-3 text-center w-36">Apropriação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cpusIndiretas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          Nenhuma CPU classificada como indireta no momento. Você pode classificar uma CPU como indireta na "Tabela de CPUs".
                        </td>
                      </tr>
                    ) : (
                      cpusIndiretas.map((cpu) => {
                        const qtd = Number(cpu.quantidade_prevista) || 1;
                        let cUnt = 0;
                        if (cpu.insumos) {
                          cpu.insumos.forEach((ins) => {
                            cUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
                          });
                        }
                        const cTotal = cUnt * qtd;

                        return (
                          <tr key={cpu.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono text-slate-400">{cpu.sequencia || '-'}</td>
                            <td className="p-3 font-mono font-bold text-blue-700">{cpu.code}</td>
                            <td className="p-3 font-bold text-slate-800">{cpu.nome}</td>
                            <td className="p-3 text-center">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {cpu.unidade}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">{qtd}</td>
                            <td className="p-3 text-right font-mono font-black text-purple-900">
                              {formatMoney(cTotal)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleAlternarParaDireto(cpu)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-md transition cursor-pointer"
                                title="Clique para voltar esta CPU para Custo Direto"
                              >
                                Reverter p/ Direto
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ADICIONAR / EDITAR ITEM INDIRETO */}
      {modalItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>{itemEmEdicao ? 'Editar Item Indireto' : 'Novo Item de Custo Indireto'}</span>
              </h3>
              <button
                onClick={() => setModalItemOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarItem} className="p-5 space-y-4 text-xs">
              {/* Seleção do Insumo no Banco de Insumos */}
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-2">
                <label className="block font-bold text-indigo-950 flex items-center justify-between">
                  <span>Insumo Base (Banco de Insumos):</span>
                  <span className="text-[10px] text-indigo-700 font-normal">
                    {bancoInsumos.length} insumos disponíveis
                  </span>
                </label>
                <select
                  value={formIdInsumoBase}
                  onChange={(e) => handleSelectInsumoBase(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-lg bg-white font-medium text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">-- Selecione um insumo do Banco de Insumos --</option>
                  {bancoInsumos.map((ins) => (
                    <option key={ins.id || ins.id_insumo} value={ins.id || ins.id_insumo}>
                      [{ins.id_insumo}] {ins.descricao} ({ins.unid}) - R$ {ins.pr_unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                {bancoInsumos.length === 0 && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    ⚠️ Nenhum insumo cadastrado no Banco de Insumos desta obra. Acesse a aba <strong>Banco de Insumos</strong> para importar o catálogo.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria:</label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value as CategoriaIndireto)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="ADM_LOCAL_MO">Mão de Obra Indireta (Adm Local)</option>
                  <option value="EQUIPAMENTOS_INDIRETOS">Equipamentos Indiretos & Apoio</option>
                  <option value="CANTEIRO">Instalação & Operação de Canteiro</option>
                  <option value="DIVERSOS_CONSULTORIA">Itens Diversos & Consultorias</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Código:</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ex: MOI-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 bg-slate-50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Unidade:</label>
                  <input
                    type="text"
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    placeholder="MÊS, vb, un, h..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição do Recurso / Função:</label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Selecione um insumo acima..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium"
                  required
                />
              </div>

              {/* Período de Atuação do Recurso Indireto (Data Início / Fim) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Vigência do Recurso Indireto (Cálculo Automático de Meses)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Data de Início:</label>
                    <input
                      type="date"
                      value={formDataInicio}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormDataInicio(val);
                        handleCalculateDateMonths(val, formDataFim);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Data de Término:</label>
                    <input
                      type="date"
                      value={formDataFim}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormDataFim(val);
                        handleCalculateDateMonths(formDataInicio, val);
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantidade / Meses:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formQuantidade}
                    onChange={(e) => setFormQuantidade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Unitário (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrecoUnitario}
                    onChange={(e) => setFormPrecoUnitario(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Custo Total Previsto:</span>
                <span className="font-mono text-base font-black text-slate-900">
                  {formatMoney((Number(formQuantidade) || 0) * (Number(formPrecoUnitario) || 0))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalItemOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
