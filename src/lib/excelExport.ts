import * as XLSX from 'xlsx';
import { CPU, Obra, ABCInsumoItem, MochilaMOInsumo, InsumoBase, ItemMochila } from '../types';

export function formatMoney(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
}

export function exportarRelatorioMochilaMO(
  mochila: MochilaMOInsumo,
  obra?: Obra | null,
  insumoBase?: InsumoBase | null
) {
  const horasMes = mochila.horasMes || 189.2;
  const insumoNome = mochila.insumoDescricao || insumoBase?.descricao || 'Mão de Obra';
  const insumoCod = mochila.insumoCodigo || insumoBase?.id_insumo || insumoBase?.id || '-';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  // Worksheet 1: Composição Aberta da Mochila
  const wsData: any[][] = [
    ['RELATÓRIO DE COMPOSIÇÃO ABERTA DE MÃO DE OBRA E BENEFÍCIOS (MOCHILA)'],
    ['DOCUMENTO GERADO PARA FINS DE PROPOSTA E DETALHAMENTO DE CUSTOS DE MÃO DE OBRA'],
    [],
    ['OBRA', obra ? `${obra.codigo} - ${obra.nome}` : 'Não vinculada', 'DATA DE EMISSÃO', dataHoje],
    ['CLIENTE', obra?.cliente || 'Não Informado', 'JORNADA MENSAL DIVISORA', `${horasMes} h/mês`],
    ['CÓDIGO INSUMO', insumoCod, 'UNIDADE BASE', 'HORA (h)'],
    ['CARGO / FUNÇÃO', insumoNome, 'BDI DA OBRA', obra?.bdi ? `${obra.bdi}%` : '25.0%'],
    [],
    ['1. BASE SALARIAL E ADICIONAIS CONTRATUAIS'],
    ['COMPONENTE', 'BASE DE CÁLCULO', 'VALOR / ALÍQUOTA', 'CUSTO HORÁRIO (R$/h)'],
    ['Salário Base Mensal', `${horasMes} h/mês`, formatMoney(mochila.salarioMes || 0), formatMoney(mochila.salarioHora || 0)],
    ['Dissídio / Acordo Coletivo', 'Sobre Salário Base', `${mochila.adicionais?.dissidio || 0}%`, formatMoney((mochila.salarioHora || 0) * ((mochila.adicionais?.dissidio || 0) / 100))],
    ['Ajuda de Custo', 'Sobre Salário Base', `${mochila.adicionais?.ajudaDeCusto || 0}%`, formatMoney((mochila.salarioHora || 0) * ((mochila.adicionais?.ajudaDeCusto || 0) / 100))],
    ['Hora Extra Prevista', 'Sobre Salário Base', `${mochila.adicionais?.horaExtra || 0}%`, formatMoney((mochila.salarioHora || 0) * ((mochila.adicionais?.horaExtra || 0) / 100))],
    ['Adicional Noturno', 'Sobre Salário Base', `${mochila.adicionais?.adicionalNoturno || 0}%`, formatMoney((mochila.salarioHora || 0) * ((mochila.adicionais?.adicionalNoturno || 0) / 100))],
    ['Periculosidade', 'Sobre Salário Base', `${mochila.adicionais?.periculosidade || 0}%`, formatMoney((mochila.salarioHora || 0) * ((mochila.adicionais?.periculosidade || 0) / 100))],
    ['Insalubridade', 'Sobre Salário Base', `${mochila.adicionais?.insalubridade || 0}%`, formatMoney((mochila.salarioHora || 0) * ((mochila.adicionais?.insalubridade || 0) / 100))],
    ['SUBTOTAL SALÁRIO COM ADICIONAIS (A)', '', '', formatMoney(mochila.salarioComAdicionaisHora || mochila.salarioHora || 0)],
    [],
    ['2. ENCARGOS SOCIAIS E TRABALHISTAS'],
    ['DESCRIÇÃO', 'BASE DE INCIDÊNCIA', 'ALÍQUOTA APLICADA (%)', 'CUSTO HORÁRIO (R$/h)'],
    ['Encargos Sociais (Grupos A, B, C e D)', 'Sobre Salário c/ Adicionais', `${mochila.encargoPerc || 75}%`, formatMoney(mochila.custoHoraEncargo || 0)],
    ['SUBTOTAL SALÁRIO + ENCARGOS SOCIAIS (B = A + Encargos)', '', '', formatMoney(mochila.salarioComEncargoHora || 0)],
    [],
    ['3. DEMONSTRATIVO ABERTO DOS ITENS DA MOCHILA (BENEFÍCIOS, EPIS, ALIMENTAÇÃO, TRANSPORTE)'],
    ['ITEM / DESCRIÇÃO', 'CATEGORIA', 'UNID.', 'QTD/MÊS', 'PREÇO UNIT. (R$)', 'CUSTO MENSAL (R$)', 'CUSTO / HORA (R$/h)', 'PARTICIPAÇÃO (%)']
  ];

  const totalMochilaMes = mochila.custoMesMochila || 0;

  if (mochila.itens && mochila.itens.length > 0) {
    mochila.itens.forEach((it: ItemMochila) => {
      const qtd = Number(it.quantidade) || 0;
      const precoUnt = Number(it.valorUnitario) || 0;
      const custoMes = Number(it.custoMensal) || qtd * precoUnt;
      const custoHora = Number(it.custoHora) || custoMes / horasMes;
      const perc = totalMochilaMes > 0 ? (custoMes / totalMochilaMes) * 100 : 0;

      wsData.push([
        it.descricao,
        it.categoria,
        it.unidade,
        qtd,
        precoUnt,
        custoMes,
        custoHora,
        Number(perc.toFixed(2))
      ]);
    });
  } else {
    wsData.push(['Nenhum item adicionado', '-', '-', 0, 0, 0, 0, 0]);
  }

  wsData.push(
    ['SUBTOTAL MOCHILA / BENEFÍCIOS (C)', '', '', '', '', mochila.custoMesMochila || 0, mochila.custoHoraMochila || 0, 100],
    [],
    ['4. RESUMO CONSOLIDADO DO CUSTO HORÁRIO FINAL DA MÃO DE OBRA'],
    ['COMPOSIÇÃO DO CUSTO', 'VALOR POR HORA (R$/h)', 'VALOR ESTIMADO MENSAL (R$/mês)', 'PARTICIPAÇÃO NO CUSTO TOTAL (%)'],
    [
      '1. Salário Base c/ Adicionais',
      mochila.salarioComAdicionaisHora || mochila.salarioHora || 0,
      (mochila.salarioComAdicionaisHora || mochila.salarioHora || 0) * horasMes,
      mochila.salarioEncargoMochilaHora ? Number((((mochila.salarioComAdicionaisHora || mochila.salarioHora || 0) / mochila.salarioEncargoMochilaHora) * 100).toFixed(2)) : 0
    ],
    [
      `2. Encargos Sociais (${mochila.encargoPerc || 75}%)`,
      mochila.custoHoraEncargo || 0,
      (mochila.custoHoraEncargo || 0) * horasMes,
      mochila.salarioEncargoMochilaHora ? Number((((mochila.custoHoraEncargo || 0) / mochila.salarioEncargoMochilaHora) * 100).toFixed(2)) : 0
    ],
    [
      '3. Mochila / Benefícios e Insumos Indiretos',
      mochila.custoHoraMochila || 0,
      mochila.custoMesMochila || 0,
      mochila.salarioEncargoMochilaHora ? Number((((mochila.custoHoraMochila || 0) / mochila.salarioEncargoMochilaHora) * 100).toFixed(2)) : 0
    ],
    [
      'CUSTO TOTAL DA MÃO DE OBRA (1 + 2 + 3)',
      mochila.salarioEncargoMochilaHora || 0,
      (mochila.salarioEncargoMochilaHora || 0) * horasMes,
      100
    ]
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 38 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Mochila Aberta');

  // Worksheet 2: Demonstrativo de Encargos Sociais (Grupos)
  const configEnc = obra?.configEncargos;
  const grupoA = configEnc?.detalhesGrupos?.grupoA ?? 16.8;
  const grupoB = configEnc?.detalhesGrupos?.grupoB ?? 48.2;
  const grupoC = configEnc?.detalhesGrupos?.grupoC ?? 4.5;
  const grupoD = configEnc?.detalhesGrupos?.grupoD ?? 5.5;

  const wsEncData: any[][] = [
    ['DEMONSTRATIVO DE ENCARGOS SOCIAIS E TRABALHISTAS'],
    ['OBRA', obra ? `${obra.codigo} - ${obra.nome}` : '-', 'DATA', dataHoje],
    [],
    ['GRUPO', 'DISCRIMINAÇÃO DOS ENCARGOS', 'PERCENTUAL (%)'],
    ['GRUPO A', 'Encargos Básicos (INSS, SESI, SENAI, INCRA, SEBRAE, Salário Educação, Seguro Acidente, FGTS)', grupoA],
    ['GRUPO B', 'Encargos que recebem incidência de A (Férias, 13º Salário, Repouso Semanal, Feriados, Licenças)', grupoB],
    ['GRUPO C', 'Encargos que não recebem incidência de A (Aviso Prévio Indenizado, FGTS Rescisório, etc.)', grupoC],
    ['GRUPO D', 'Taxas de Incidência Cumulativa (Reincidência de A sobre B)', grupoD],
    ['TOTAL GERAL', 'TOTAL DE ENCARGOS SOCIAIS APLICADOS', Number((grupoA + grupoB + grupoC + grupoD).toFixed(2))],
    [],
    ['APLICAÇÃO NA MÃO DE OBRA', insumoNome, ''],
    ['Salário Base c/ Adicionais', formatMoney(mochila.salarioComAdicionaisHora || mochila.salarioHora || 0) + '/h', ''],
    ['Valor dos Encargos Sociais', formatMoney(mochila.custoHoraEncargo || 0) + '/h', ''],
    ['Salário + Encargos', formatMoney(mochila.salarioComEncargoHora || 0) + '/h', '']
  ];

  const wsEnc = XLSX.utils.aoa_to_sheet(wsEncData);
  wsEnc['!cols'] = [{ wch: 14 }, { wch: 80 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsEnc, 'Encargos Sociais');

  const safeInsumoName = insumoNome.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const safeObraCode = obra?.codigo ? `${obra.codigo}_` : '';
  const filename = `Mochila_Aberta_${safeObraCode}${safeInsumoName}_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, filename);
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
