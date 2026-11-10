import { ScheduleTask } from '../types';

/**
 * PARSER PARA O FORMATO NATIVO XML DO MICROSOFT PROJECT (*.xml)
 * O MS Project salva projetos completos em XML com a seguinte estrutura:
 * <Project xmlns="http://schemas.microsoft.com/project">
 *   <Tasks>
 *     <Task>
 *       <UID>159</UID>
 *       <ID>80</ID>
 *       <Name>Perfuração em Rocha</Name>
 *       <WBS>1.1.1.2.2.2.16.1</WBS>
 *       <OutlineLevel>8</OutlineLevel>
 *       <Start>2026-03-02T07:00:00</Start>
 *       <Finish>2026-03-12T17:00:00</Finish>
 *       <Duration>PT70H0M0S</Duration>
 *       <Summary>0</Summary>
 *     </Task>
 *   </Tasks>
 * </Project>
 */
export function parseMsProjectXml(xmlText: string): ScheduleTask[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const parserError = xmlDoc.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    throw new Error('Arquivo XML inválido ou corrompido: ' + parserError[0].textContent);
  }

  const tasksNodes = xmlDoc.getElementsByTagName('Task');
  const tasks: ScheduleTask[] = [];

  for (let i = 0; i < tasksNodes.length; i++) {
    const taskNode = tasksNodes[i];

    const getVal = (tag: string): string => {
      const el = taskNode.getElementsByTagName(tag)[0];
      return el && el.textContent ? el.textContent.trim() : '';
    };

    const uidStr = getVal('UID');
    const idStr = getVal('ID');
    const name = getVal('Name');
    const wbs = getVal('WBS') || getVal('OutlineNumber') || idStr;
    const outlineLevelStr = getVal('OutlineLevel') || '1';
    const isSummaryStr = getVal('Summary') || '0';
    const startStr = getVal('Start');
    const finishStr = getVal('Finish');
    const durationStr = getVal('Duration'); // ex: PT70H0M0S ou PT8H0M0S

    // Ignora tarefa raiz vazia do Project (UID 0)
    if (!name && uidStr === '0') continue;

    const uniqueId = parseInt(uidStr || idStr, 10) || i + 1;
    const outlineLevel = parseInt(outlineLevelStr, 10) || 1;
    const isSummary = isSummaryStr === '1';

    // Converte datas para YYYY-MM-DD
    const formatDate = (isoString: string): string => {
      if (!isoString) return '';
      return isoString.split('T')[0];
    };

    // Extrai duração aproximada em dias úteis a partir de PT...H...
    let workingDaysDuration = 1;
    if (durationStr) {
      const matchHours = durationStr.match(/PT(\d+)H/);
      if (matchHours && matchHours[1]) {
        const hours = parseInt(matchHours[1], 10);
        workingDaysDuration = Math.max(1, Math.ceil(hours / 8.8)); // 8.8h por dia útil
      }
    }

    tasks.push({
      uniqueId,
      wbs,
      outlineLevel,
      parentUniqueId: null,
      name: name || `Tarefa ${uniqueId}`,
      startDate: formatDate(startStr) || '2026-03-01',
      finishDate: formatDate(finishStr) || '2026-03-15',
      physicalQuantity: 0,
      unit: 'm',
      dailyProductivityPerTeam: 0,
      teamsCount: 1,
      workersPerTeam: 4,
      workingDaysDuration,
      isSummary
    });
  }

  return tasks;
}

/**
 * PARSER PARA CSV / TEXTO TABULAR DE TAREFAS
 * Compatível com exportações rápidas de colunas do Excel / MS Project
 */
export function parseScheduleTasksCsv(csvText: string): ScheduleTask[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  // Detecta separador (, ou ;)
  const headerLine = lines[0];
  const sep = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(sep).map((h) => h.trim().toLowerCase());

  const colIdx = {
    uid: headers.findIndex((h) => h.includes('id exclusiva') || h.includes('uid') || h === 'id'),
    wbs: headers.findIndex((h) => h.includes('edt') || h.includes('wbs') || h.includes('estrutura')),
    outlineLevel: headers.findIndex((h) => h.includes('nivel') || h.includes('outline') || h.includes('tópico')),
    name: headers.findIndex((h) => h.includes('nome') || h.includes('tarefa') || h.includes('descricao')),
    start: headers.findIndex((h) => h.includes('início') || h.includes('inicio') || h.includes('start')),
    finish: headers.findIndex((h) => h.includes('término') || h.includes('termino') || h.includes('fim') || h.includes('finish')),
    qty: headers.findIndex((h) => h.includes('quantidade') || h.includes('quant') || h.includes('qtd')),
    unit: headers.findIndex((h) => h.includes('unidade') || h.includes('unid')),
    prod: headers.findIndex((h) => h.includes('prod') || h.includes('produtividade')),
    teams: headers.findIndex((h) => h.includes('equipe') || h.includes('equipes')),
    duration: headers.findIndex((h) => h.includes('duracao') || h.includes('duração') || h.includes('dias'))
  };

  const tasks: ScheduleTask[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const uniqueId = colIdx.uid >= 0 ? parseInt(cols[colIdx.uid], 10) || i : i;
    const name = colIdx.name >= 0 ? cols[colIdx.name] : `Tarefa ${i}`;
    const wbs = colIdx.wbs >= 0 ? cols[colIdx.wbs] : `1.${i}`;
    const outlineLevel = colIdx.outlineLevel >= 0 ? parseInt(cols[colIdx.outlineLevel], 10) || 8 : 8;
    const startDate = colIdx.start >= 0 ? cols[colIdx.start] : '2026-03-01';
    const finishDate = colIdx.finish >= 0 ? cols[colIdx.finish] : '2026-03-15';
    const physicalQuantity = colIdx.qty >= 0 ? parseFloat(cols[colIdx.qty].replace(',', '.')) || 0 : 0;
    const unit = colIdx.unit >= 0 ? cols[colIdx.unit] : 'm';
    const dailyProductivityPerTeam = colIdx.prod >= 0 ? parseFloat(cols[colIdx.prod].replace(',', '.')) || 0 : 0;
    const teamsCount = colIdx.teams >= 0 ? parseInt(cols[colIdx.teams], 10) || 1 : 1;
    const workingDaysDuration = colIdx.duration >= 0 ? parseInt(cols[colIdx.duration], 10) || 1 : 1;

    tasks.push({
      uniqueId,
      wbs,
      outlineLevel,
      parentUniqueId: null,
      name,
      startDate,
      finishDate,
      physicalQuantity,
      unit,
      dailyProductivityPerTeam,
      teamsCount,
      workersPerTeam: 4,
      workingDaysDuration,
      isSummary: outlineLevel < 8
    });
  }

  return tasks;
}
