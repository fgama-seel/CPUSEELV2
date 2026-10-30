import { CPU, Insumo, InsumoBase, TipoInsumo } from '../types';

/**
 * Converte qualquer valor em formato numérico brasileiro ("1.795.464,28" ou "110,99" ou 110.99)
 * para um float numérico seguro em JavaScript.
 */
export function parseBrazilianNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str || str === '-' || str === 'Sem Insumos') return 0;

  // Se tiver ponto de milhar e vírgula decimal ex: "1.795.464,28"
  if (str.includes(',') && str.includes('.')) {
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  // Se contiver apenas vírgula ex: "110,99"
  if (str.includes(',')) {
    const cleaned = str.replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  // Se for número normal com ponto decimal
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Normaliza o Tipo de Insumo para os padrões do sistema:
 * 'Mão de Obra' | 'Equipamento' | 'Material' | 'Terceirizado'
 */
export function normalizeTipoInsumo(rawTipo: any): TipoInsumo {
  if (!rawTipo) return 'Material';
  const str = String(rawTipo).trim().toLowerCase();
  if (str.includes('mão') || str.includes('mao') || str.includes('mo') || str.includes('labor')) {
    return 'Mão de Obra';
  }
  if (str.includes('equip') || str.includes('máquina') || str.includes('maquina') || str.includes('eq')) {
    return 'Equipamento';
  }
  if (str.includes('serviço') || str.includes('servico') || str.includes('terceir') || str.includes('subcontrat')) {
    return 'Terceirizado';
  }
  return 'Material';
}

/**
 * Parser de CSV compatível com padrão brasileiro (delimitador ';' ou ',')
 * com suporte completo a quebras de linha e campos com aspas duplas.
 */
export function parseCSV(text: string): Record<string, string>[] {
  if (!text) return [];

  // Remove BOM se presente
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.substring(1);
  }

  // Detecta o delimitador na primeira linha
  const firstLine = cleanText.split('\n')[0] || '';
  const countSemicolon = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  let delimiter = ';';
  if (countTab > countSemicolon && countTab > countComma) {
    delimiter = '\t';
  } else if (countComma > countSemicolon) {
    delimiter = ',';
  }

  // Divide linhas respeitando campos com aspas que contenham quebras de linha
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // pula a aspa dupla escapada
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // consome \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const result: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item: Record<string, string> = {};
    headers.forEach((h, idx) => {
      item[h] = row[idx] !== undefined ? row[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    result.push(item);
  }

  return result;
}

export interface ParsedCPUItem {
  code: string;
  nome: string;
  unidade: string;
  prod_teorica: number;
  praticabilidade: number;
  horas_dia: number;
  prod_efetiva: number;
  quantidade_prevista: number;
  preco_venda: number;
  vendaDefinida?: boolean;
  fator_fcd: number;
  insumos: Insumo[];
  comentarios: any[];
}

/**
 * Processa a Base de Composições (Base_Composicoes_*.csv)
 * Identifica CPUs e seus insumos filhos.
 */
export function processBaseComposicoes(records: Record<string, string>[]): Map<string, ParsedCPUItem> {
  const cpusMap = new Map<string, ParsedCPUItem>();

  for (const row of records) {
    // Identifica o código da CPU
    const code = String(
      row['ID CPU'] || row['ID_CPU'] || row['Código CPU'] || row['Codigo CPU'] || row['code'] || row['ID'] || ''
    ).trim();

    if (!code) continue;

    const nome = String(
      row['Nome CPU'] || row['Nome_CPU'] || row['Serviço'] || row['Servico'] || row['nome'] || row['Descrição'] || 'CPU ' + code
    ).trim();

    const unidade = String(
      row['Unid. CPU'] || row['Unid_CPU'] || row['Unidade'] || row['Unid.'] || row['unidade'] || 'UN'
    ).trim();

    if (!cpusMap.has(code)) {
      cpusMap.set(code, {
        code,
        nome,
        unidade,
        prod_teorica: 1,
        praticabilidade: 1,
        horas_dia: 8.8,
        prod_efetiva: 1,
        quantidade_prevista: 1,
        preco_venda: 0,
        vendaDefinida: false,
        fator_fcd: 1,
        insumos: [],
        comentarios: []
      });
    }

    const cpu = cpusMap.get(code)!;

    // Se o nome ou unidade estavam vazios e esta linha tem, atualiza
    if ((!cpu.nome || cpu.nome === 'CPU ' + code) && nome) cpu.nome = nome;
    if ((!cpu.unidade || cpu.unidade === 'UN') && unidade) cpu.unidade = unidade;

    // Insumo
    const id_insumo = String(row['ID Insumo'] || row['ID_Insumo'] || row['ID Insumos'] || '').trim();
    const descricao = String(
      row['Descrição Insumo'] || row['Descricao Insumo'] || row['Descricao_Insumo'] || row['Insumo'] || ''
    ).trim();

    // Se a linha tiver insumo válido (não for '-' nem 'Sem Insumos')
    if (
      id_insumo &&
      id_insumo !== '-' &&
      descricao &&
      descricao.toLowerCase() !== 'sem insumos' &&
      descricao !== '-'
    ) {
      const rawTipo = row['Tipo Insumo'] || row['Tipo_Insumo'] || row['Tipo'] || 'Material';
      const tipo = normalizeTipoInsumo(rawTipo);
      const unid = String(row['Unid. Insumo'] || row['Unid_Insumo'] || row['Unid'] || 'un').trim();
      const coef = parseBrazilianNumber(row['Coeficiente'] || row['coef'] || 1);
      const pr_unit = parseBrazilianNumber(
        row['Preço Unit. (R$)'] || row['Preco Unit. (R$)'] || row['Preco Unitario'] || row['pr_unit'] || 0
      );

      // Adiciona o insumo à CPU
      cpu.insumos.push({
        id_insumo,
        tipo,
        descricao,
        unid,
        coef: coef > 0 ? coef : 1,
        pr_unit
      });
    }
  }

  return cpusMap;
}

/**
 * Processa a Lista de CPUs (Lista_CPUs_*.csv)
 * Identifica Quantidade, Preço de Venda, Fator F/CD.
 */
export function processListaCPUs(records: Record<string, string>[]): Map<string, {
  code: string;
  nome: string;
  unidade: string;
  quantidade: number;
  precoVenda: number;
  fatorFcd: number;
}> {
  const listaMap = new Map<string, {
    code: string;
    nome: string;
    unidade: string;
    quantidade: number;
    precoVenda: number;
    fatorFcd: number;
  }>();

  for (const row of records) {
    const code = String(
      row['ID CPU'] || row['ID_CPU'] || row['Código CPU'] || row['Codigo CPU'] || row['code'] || row['ID'] || ''
    ).trim();

    if (!code) continue;

    const nome = String(
      row['Serviço'] || row['Servico'] || row['Nome CPU'] || row['Nome_CPU'] || row['nome'] || ''
    ).trim();

    const unidade = String(
      row['Unid.'] || row['Unid'] || row['Unidade'] || row['Unid. CPU'] || ''
    ).trim();

    const quantidade = parseBrazilianNumber(row['Quantidade'] || row['Qtd'] || 1);
    const precoVenda = parseBrazilianNumber(
      row['Venda Unit. (R$)'] || row['Venda Unit'] || row['Preço Venda'] || row['preco_venda'] || 0
    );
    const fatorFcd = parseBrazilianNumber(row['F/CD'] || row['FCD'] || row['fator_fcd'] || 1);

    listaMap.set(code, {
      code,
      nome,
      unidade,
      quantidade: quantidade > 0 ? quantidade : 1,
      precoVenda,
      fatorFcd: fatorFcd > 0 ? fatorFcd : 1
    });
  }

  return listaMap;
}

/**
 * Realiza a mesclagem (merge) inteligente entre a Base de Composições e a Lista de CPUs
 */
export function mergeBasesData(
  composicoesMap: Map<string, ParsedCPUItem>,
  listaMap: Map<string, { code: string; nome: string; unidade: string; quantidade: number; precoVenda: number; fatorFcd: number }>
): {
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
} {
  const finalMap = new Map<string, ParsedCPUItem>();

  // 1. Primeiro insere as composições
  composicoesMap.forEach((cpu, code) => {
    finalMap.set(code, { ...cpu });
  });

  // 2. Mescla os dados da Lista de CPUs (quantidades contratuais, preços de venda, F/CD)
  listaMap.forEach((item, code) => {
    if (finalMap.has(code)) {
      const existing = finalMap.get(code)!;
      if (item.nome && (!existing.nome || existing.nome.startsWith('CPU '))) {
        existing.nome = item.nome;
      }
      if (item.unidade && (!existing.unidade || existing.unidade === 'UN')) {
        existing.unidade = item.unidade;
      }
      existing.quantidade_prevista = item.quantidade;
      existing.preco_venda = item.precoVenda;
      existing.vendaDefinida = item.precoVenda > 0;
      existing.fator_fcd = item.fatorFcd;
    } else {
      // CPU estava apenas na Lista de CPUs
      finalMap.set(code, {
        code,
        nome: item.nome || `CPU ${code}`,
        unidade: item.unidade || 'UN',
        prod_teorica: 1,
        praticabilidade: 1,
        horas_dia: 8.8,
        prod_efetiva: 1,
        quantidade_prevista: item.quantidade,
        preco_venda: item.precoVenda,
        vendaDefinida: item.precoVenda > 0,
        fator_fcd: item.fatorFcd,
        insumos: [],
        comentarios: []
      });
    }
  });

  const cpus = Array.from(finalMap.values()).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  // Extrai insumos base únicos para o catálogo da obra
  const insumosMap = new Map<string, InsumoBase>();
  let cpusComInsumos = 0;
  let cpusSemInsumos = 0;
  let totalCustoDireto = 0;
  let totalVenda = 0;

  cpus.forEach((cpu) => {
    let custoUnitCPU = 0;

    if (cpu.insumos && cpu.insumos.length > 0) {
      cpusComInsumos++;
      cpu.insumos.forEach((ins) => {
        custoUnitCPU += (ins.coef || 0) * (ins.pr_unit || 0);

        if (!insumosMap.has(ins.id_insumo)) {
          insumosMap.set(ins.id_insumo, {
            id: ins.id_insumo,
            id_insumo: ins.id_insumo,
            tipo: ins.tipo,
            descricao: ins.descricao,
            unid: ins.unid,
            pr_unit: ins.pr_unit
          });
        }
      });
    } else {
      cpusSemInsumos++;
    }

    const qtd = cpu.quantidade_prevista || 1;
    totalCustoDireto += custoUnitCPU * qtd;
    totalVenda += (cpu.preco_venda || 0) * qtd;
  });

  const insumosBase = Array.from(insumosMap.values()).sort((a, b) => a.descricao.localeCompare(b.descricao));

  return {
    cpus,
    insumosBase,
    summary: {
      totalCPUs: cpus.length,
      totalInsumos: insumosBase.length,
      cpusComInsumos,
      cpusSemInsumos,
      totalCustoDireto,
      totalVenda
    }
  };
}

/**
 * Gera o script SQL e arquivo de migration/seeder para MySQL e Laravel
 * Totalmente formatado e documentado para quem tem pouca experiência com banco de dados.
 */
export function generateMySQLMigrationScript(
  obraNome: string,
  obraCodigo: string,
  cpus: ParsedCPUItem[],
  insumos: InsumoBase[]
): string {
  const sanitize = (str: string) => (str ? str.replace(/'/g, "''").replace(/\\/g, '\\\\').trim() : '');

  let sql = `-- ==============================================================================
-- SCRIPT DE CRIAÇÃO E CARGA DE DADOS PARA MYSQL (SEEL ENGENHARIA)
-- Obra: ${sanitize(obraNome)} (${sanitize(obraCodigo)})
-- Gerado em: ${new Date().toLocaleString('pt-BR')}
-- 
-- INSTRUÇÕES DE USO (O QUE FAZER COM ESTE ARQUIVO):
-- 1. Abra o phpMyAdmin ou terminal MySQL da sua empresa (ex: HeidiSQL, DBeaver, Workbench).
-- 2. Crie ou selecione o banco de dados (ex: USE banco_seel;).
-- 3. Clique na aba "SQL" (ou Importar) e cole todo este texto.
-- 4. Clique em "Executar" / "Run". As tabelas e dados serão criados automaticamente!
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabela de Obras
CREATE TABLE IF NOT EXISTS \`obras\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`codigo\` VARCHAR(50) NOT NULL,
  \`nome\` VARCHAR(255) NOT NULL,
  \`cliente\` VARCHAR(255) DEFAULT NULL,
  \`bdi\` DECIMAL(8,4) DEFAULT 25.0000,
  \`custo_indireto_atual\` DECIMAL(15,2) DEFAULT 0.00,
  \`faturamento_direto_atual\` DECIMAL(15,2) DEFAULT 0.00,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Insumos Base
CREATE TABLE IF NOT EXISTS \`insumos\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`obra_id\` VARCHAR(64) NOT NULL,
  \`id_insumo\` VARCHAR(64) NOT NULL,
  \`tipo\` ENUM('Material', 'Mão de Obra', 'Equipamento', 'Terceirizado') NOT NULL,
  \`descricao\` VARCHAR(255) NOT NULL,
  \`unid\` VARCHAR(20) NOT NULL,
  \`pr_unit\` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_insumos_obra\` (\`obra_id\`),
  KEY \`idx_insumos_codigo\` (\`id_insumo\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de CPUs (Composições de Preço Unitário)
CREATE TABLE IF NOT EXISTS \`cpus\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`obra_id\` VARCHAR(64) NOT NULL,
  \`code\` VARCHAR(64) NOT NULL,
  \`nome\` VARCHAR(255) NOT NULL,
  \`unidade\` VARCHAR(20) NOT NULL,
  \`prod_teorica\` DECIMAL(12,4) DEFAULT 1.0000,
  \`praticabilidade\` DECIMAL(8,4) DEFAULT 1.0000,
  \`horas_dia\` DECIMAL(8,4) DEFAULT 8.8000,
  \`prod_efetiva\` DECIMAL(12,4) DEFAULT 1.0000,
  \`quantidade_prevista\` DECIMAL(15,4) DEFAULT 1.0000,
  \`preco_venda\` DECIMAL(15,4) DEFAULT 0.0000,
  \`venda_definida\` TINYINT(1) DEFAULT 0,
  \`fator_fcd\` DECIMAL(10,4) DEFAULT 1.0000,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY \`idx_cpus_obra\` (\`obra_id\`),
  KEY \`idx_cpus_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Relacionamento (Itens de Insumo por CPU)
CREATE TABLE IF NOT EXISTS \`cpu_insumos\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`cpu_id\` VARCHAR(64) NOT NULL,
  \`id_insumo\` VARCHAR(64) NOT NULL,
  \`tipo\` VARCHAR(50) NOT NULL,
  \`descricao\` VARCHAR(255) NOT NULL,
  \`unid\` VARCHAR(20) NOT NULL,
  \`coef\` DECIMAL(15,6) NOT NULL DEFAULT 0.000000,
  \`pr_unit\` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  KEY \`idx_cpu_insumos_cpu\` (\`cpu_id\`),
  KEY \`idx_cpu_insumos_insumo\` (\`id_insumo\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- CARGA DOS DADOS: OBRA
-- ==============================================================================
INSERT INTO \`obras\` (\`id\`, \`codigo\`, \`nome\`, \`cliente\`, \`bdi\`, \`created_at\`, \`updated_at\`)
VALUES ('obra-${sanitize(obraCodigo)}', '${sanitize(obraCodigo)}', '${sanitize(obraNome)}', 'SEEL Engenharia', 25.0000, NOW(), NOW())
ON DUPLICATE KEY UPDATE \`nome\` = VALUES(\`nome\`);

-- ==============================================================================
-- CARGA DOS INSUMOS (${insumos.length} itens)
-- ==============================================================================
`;

  // Insere insumos
  if (insumos.length > 0) {
    sql += `INSERT INTO \`insumos\` (\`id\`, \`obra_id\`, \`id_insumo\`, \`tipo\`, \`descricao\`, \`unid\`, \`pr_unit\`, \`created_at\`, \`updated_at\`) VALUES\n`;
    const insumoValues = insumos.map((ins, idx) => {
      const insId = `ins-${sanitize(obraCodigo)}-${idx + 1}`;
      return `  ('${insId}', 'obra-${sanitize(obraCodigo)}', '${sanitize(ins.id_insumo)}', '${sanitize(ins.tipo)}', '${sanitize(ins.descricao)}', '${sanitize(ins.unid)}', ${ins.pr_unit.toFixed(4)}, NOW(), NOW())`;
    });
    sql += insumoValues.join(',\n') + `\nON DUPLICATE KEY UPDATE \`descricao\` = VALUES(\`descricao\`), \`pr_unit\` = VALUES(\`pr_unit\`);\n\n`;
  }

  // Insere CPUs
  sql += `-- ==============================================================================
-- CARGA DAS CPUS (${cpus.length} itens)
-- ==============================================================================
`;
  if (cpus.length > 0) {
    sql += `INSERT INTO \`cpus\` (\`id\`, \`obra_id\`, \`code\`, \`nome\`, \`unidade\`, \`prod_teorica\`, \`praticabilidade\`, \`horas_dia\`, \`prod_efetiva\`, \`quantidade_prevista\`, \`preco_venda\`, \`venda_definida\`, \`fator_fcd\`, \`created_at\`, \`updated_at\`) VALUES\n`;
    const cpuValues = cpus.map((cpu) => {
      const cpuId = `cpu-obra-${sanitize(obraCodigo)}-${sanitize(cpu.code)}`;
      const vendaDef = cpu.vendaDefinida ? 1 : 0;
      return `  ('${cpuId}', 'obra-${sanitize(obraCodigo)}', '${sanitize(cpu.code)}', '${sanitize(cpu.nome)}', '${sanitize(cpu.unidade)}', 1.0000, 1.0000, 8.8000, 1.0000, ${cpu.quantidade_prevista.toFixed(4)}, ${cpu.preco_venda.toFixed(4)}, ${vendaDef}, ${cpu.fator_fcd.toFixed(4)}, NOW(), NOW())`;
    });
    sql += cpuValues.join(',\n') + `\nON DUPLICATE KEY UPDATE \`nome\` = VALUES(\`nome\`), \`preco_venda\` = VALUES(\`preco_venda\`), \`quantidade_prevista\` = VALUES(\`quantidade_prevista\`);\n\n`;
  }

  // Insere CPU_Insumos
  sql += `-- ==============================================================================
-- CARGA DA COMPOSIÇÃO DE INSUMOS POR CPU
-- ==============================================================================
`;
  const cpuInsumoRows: string[] = [];
  cpus.forEach((cpu) => {
    const cpuId = `cpu-obra-${sanitize(obraCodigo)}-${sanitize(cpu.code)}`;
    cpu.insumos.forEach((ins) => {
      cpuInsumoRows.push(
        `  ('${cpuId}', '${sanitize(ins.id_insumo)}', '${sanitize(ins.tipo)}', '${sanitize(ins.descricao)}', '${sanitize(ins.unid)}', ${ins.coef.toFixed(6)}, ${ins.pr_unit.toFixed(4)})`
      );
    });
  });

  if (cpuInsumoRows.length > 0) {
    sql += `INSERT INTO \`cpu_insumos\` (\`cpu_id\`, \`id_insumo\`, \`tipo\`, \`descricao\`, \`unid\`, \`coef\`, \`pr_unit\`) VALUES\n`;
    sql += cpuInsumoRows.join(',\n') + ';\n\n';
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;
-- Fim do script de migração MySQL.
`;

  return sql;
}
