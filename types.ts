import * as XLSX from 'xlsx';
import { CPU, Obra, ABCInsumoItem } from '../types';

export function formatMoney(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
}

export function exportarFichaCPU(cpu: CPU, obra?: Obra) {
  const bdi = obra?.bdi ?? 25;
  const pt = cpu.prod_teorica || 1;
  const prat = cpu.praticabilidade || 1;
  const hd = cpu.horas_dia || 8.8;
  const p = hd > 0 ? (pt * prat) / hd : 1;
  const qtd = cpu.quantidade_prevista || 1;

  let custoUnit = 0;
  const dadosInsumos: any[] = [];

  if (cpu.insumos) {
    cpu.insumos.forEach((ins) => {
      const coef = Number(ins.coef) || 0;
      const pr_unit = Number(ins.pr_unit) || 0;
      const total = coef * pr_unit;
      custoUnit += total;
      dadosInsumos.push({
        Tipo: ins.tipo,
        Insumo: ins.descricao,
        'Unid.': ins.unid,
        Coeficiente: coef,
        'Preço Unit. (R$)': pr_unit,
        'Custo na CPU (R$)': total
      });
    });
  }

  const vendaUnit = cpu.vendaDefinida ? (cpu.preco_venda || 0) : custoUnit * (1 + bdi / 100);
  const custoTotal = custoUnit * qtd;
  const vendaTotal = vendaUnit * qtd;
  const fcd = custoTotal > 0 ? vendaTotal / custoTotal : 0;

  const ws_data = [
    ['OBRA', obra ? obra.nome : cpu.obraId, 'CÓDIGO OBRA', obra ? obra.codigo : ''],
    ['ID CPU', cpu.code, 'NOME CPU', cpu.nome],
    ['UNIDADE', cpu.unidade, 'QTD PREVISTA', qtd],
    ['PROD. TEÓRICA/DIA', pt, 'FATOR PRATIC.', prat],
    ['HORAS/DIA', hd, 'PROD. EFETIVA/H', Number(p.toFixed(4))],
    ['CUSTO UNIT. (R$)', custoUnit, 'CUSTO TOTAL (R$)', custoTotal],
    ['VENDA UNIT. (R$)', vendaUnit, 'VENDA TOTAL (R$)', vendaTotal],
    ['FATOR F/CD', Number(fcd.toFixed(2)), '', ''],
    [],
    ['TIPO', 'DESCRIÇÃO DO INSUMO', 'UNID.', 'COEFICIENTE', 'PREÇO UNIT. (R$)', 'CUSTO NA CPU (R$)']
  ];

  dadosInsumos.forEach((ins) => {
    ws_data.push([
      ins.Tipo,
      ins.Insumo,
      ins['Unid.'],
      ins.Coeficiente,
      ins['Preço Unit. (R$)'],
      ins['Custo na CPU (R$)']
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ficha CPU');
  XLSX.writeFile(wb, `Ficha_CPU_${cpu.code}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportarListaCPUs(cpus: CPU[], obra?: Obra) {
  const bdi = obra?.bdi ?? 25;
  const dadosExcel = cpus.map((cpu) => {
    const qtd = cpu.quantidade_prevista || 1;
    let custoUnt = 0;
    if (cpu.insumos) {
      cpu.insumos.forEach((ins) => {
        custoUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }

    const vendaUnt = cpu.vendaDefinida ? (cpu.preco_venda || 0) : custoUnt * (1 + bdi / 100);

    return {
      'ID CPU': cpu.code,
      Serviço: cpu.nome,
      'Unid.': cpu.unidade,
      Quantidade: qtd,
      'Venda Definida': cpu.vendaDefinida ? 'Sim (Manual)' : `Não (BDI ${bdi}%)`,
      'Venda Unit. (R$)': vendaUnt,
      'Venda Total (R$)': vendaUnt * qtd,
      'Custo Unit. (R$)': custoUnt,
      'Custo Total (R$)': custoUnt * qtd,
      'F/CD': custoUnt > 0 ? (vendaUnt * qtd) / (custoUnt * qtd) : 0
    };
  });

  const ws = XLSX.utils.json_to_sheet(dadosExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lista CPUs');
  const filename = obra
    ? `Lista_CPUs_${obra.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `Lista_CPUs_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportarComposicoes(cpus: CPU[], obra?: Obra) {
  const dadosExcel: any[] = [];
  cpus.forEach((cpu) => {
    if (cpu.insumos && cpu.insumos.length > 0) {
      cpu.insumos.forEach((ins) => {
        dadosExcel.push({
          'ID CPU': cpu.code,
          'Nome CPU': cpu.nome,
          'Unid. CPU': cpu.unidade,
          'ID Insumo': ins.id_insumo,
          'Tipo Insumo': ins.tipo,
          'Descrição Insumo': ins.descricao,
          'Unid. Insumo': ins.unid,
          Coeficiente: Number(ins.coef) || 0,
          'Preço Unit. (R$)': Number(ins.pr_unit) || 0,
          'Custo na CPU (R$)': (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0)
        });
      });
    } else {
      dadosExcel.push({
        'ID CPU': cpu.code,
        'Nome CPU': cpu.nome,
        'Unid. CPU': cpu.unidade,
        'ID Insumo': '-',
        'Tipo Insumo': '-',
        'Descrição Insumo': 'Sem Insumos',
        'Unid. Insumo': '-',
        Coeficiente: 0,
        'Preço Unit. (R$)': 0,
        'Custo na CPU (R$)': 0
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(dadosExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Composições');
  const filename = obra
    ? `Base_Composicoes_${obra.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `Base_Composicoes_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportarABC(abcInsumos: ABCInsumoItem[], obra?: Obra) {
  const sorted = [...abcInsumos].sort((a, b) => b.custoTotal - a.custoTotal);
  const dadosExcel = sorted.map((item) => ({
    'ID Insumo': item.id_insumo,
    Nome: item.descricao,
    Unidade: item.unid,
    Tipo: item.tipo,
    'Qtd Total': item.qtdTotal,
    'Custo Total (R$)': item.custoTotal,
    '% do Custo Total': Number(item.percTotal.toFixed(2))
  }));

  const ws = XLSX.utils.json_to_sheet(dadosExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Curva ABC Insumos');
  const filename = obra
    ? `ABC_Insumos_${obra.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `ABC_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
