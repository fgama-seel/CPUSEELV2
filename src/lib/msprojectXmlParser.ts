import { ScheduleTask, AllocationLink, PQItem } from '../types';

export interface ParseXmlResult {
  tasks: ScheduleTask[];
  allocationLinks: AllocationLink[];
}

/**
 * PARSER PARA O FORMATO NATIVO XML DO MICROSOFT PROJECT (*.xml)
 * Extrai a lista de tarefas, datas, durações e vincula automaticamente os Recursos/Assignments
 * cadastrados no MS Project aos itens correspondentes da PQ (Planilha de Quantidades).
 */
export function parseMsProjectXml(xmlText: string, pqItems: PQItem[] = []): ParseXmlResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const parserError = xmlDoc.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    throw new Error('Arquivo XML inválido ou corrompido: ' + parserError[0].textContent);
  }

  // 1. Extração do Catálogo de Recursos do MS Project (<Resources>)
  const resourcesMap = new Map<string, { uid: string; name: string; code: string }>();
  const resourceNodes = xmlDoc.getElementsByTagName('Resource');
  for (let r = 0; r < resourceNodes.length; r++) {
    const resNode = resourceNodes[r];
    const getResVal = (tag: string) => resNode.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
    const uid = getResVal('UID');
    const name = getResVal('Name');
    const code = getResVal('Code') || getResVal('Text1') || name;
    if (uid && (name || code)) {
      resourcesMap.set(uid, { uid, name, code });
    }
  }

  // 2. Extração das Tarefas do MS Project (<Tasks>)
  const tasksNodes = xmlDoc.getElementsByTagName('Task');
  const tasks: ScheduleTask[] = [];
  const taskResourcesMap = new Map<number, Array<{ resourceName: string; units: number }>>();

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
    const durationStr = getVal('Duration');

    // Ignora tarefa raiz vazia do Project (UID 0)
    if (!name && uidStr === '0') continue;

    const uniqueId = parseInt(uidStr || idStr, 10) || i + 1;
    const outlineLevel = parseInt(outlineLevelStr, 10) || 1;
    const isSummary = isSummaryStr === '1';

    const formatDate = (isoString: string): string => {
      if (!isoString) return '';
      return isoString.split('T')[0];
    };

    let workingDaysDuration = 1;
    if (durationStr) {
      const matchHours = durationStr.match(/PT(\d+)H/);
      if (matchHours && matchHours[1]) {
        const hours = parseInt(matchHours[1], 10);
        workingDaysDuration = Math.max(1, Math.ceil(hours / 8.8));
      }
    }

    // Leitura direta do campo <ResourceNames> da tarefa se presente
    const resourceNamesStr = getVal('ResourceNames');
    if (resourceNamesStr) {
      const names = resourceNamesStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      names.forEach((resName) => {
        const cleanName = resName.replace(/\[.*?\]/g, '').trim();
        if (!taskResourcesMap.has(uniqueId)) taskResourcesMap.set(uniqueId, []);
        taskResourcesMap.get(uniqueId)!.push({ resourceName: cleanName, units: 1 });
      });
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
      isSummary,
      msProjectResourceString: resourceNamesStr || undefined
    });
  }

  // 3. Extração dos Vínculos de Atribuição (<Assignments>)
  const assignmentNodes = xmlDoc.getElementsByTagName('Assignment');
  for (let a = 0; a < assignmentNodes.length; a++) {
    const assNode = assignmentNodes[a];
    const getAssVal = (tag: string) => assNode.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
    const taskUidStr = getAssVal('TaskUID');
    const resUidStr = getAssVal('ResourceUID');
    const unitsStr = getAssVal('Units') || '1.0';

    if (taskUidStr && resUidStr) {
      const taskUid = parseInt(taskUidStr, 10);
      const resObj = resourcesMap.get(resUidStr);
      if (resObj && taskUid) {
        const units = parseFloat(unitsStr) || 1;
        if (!taskResourcesMap.has(taskUid)) taskResourcesMap.set(taskUid, []);
        const currentList = taskResourcesMap.get(taskUid)!;
        const exists = currentList.some((x) => x.resourceName.toLowerCase() === (resObj.code || resObj.name).toLowerCase());
        if (!exists) {
          currentList.push({ resourceName: resObj.code || resObj.name, units });
        }
      }
    }
  }

  // 4. Geração Automática de AllocationLinks para a Matriz PQ vs Cronograma
  const allocationLinks: AllocationLink[] = [];
  let linkSeq = 1;

  if (pqItems.length > 0) {
    tasks.forEach((task) => {
      const resList = taskResourcesMap.get(task.uniqueId);
      if (!resList || resList.length === 0) return;

      resList.forEach(({ resourceName }) => {
        const cleanResName = resourceName.toLowerCase();

        // Procura correspondência na PQ
        const matchingPq = pqItems.find((pq) => {
          if (pq.codigoRecursoProject && cleanResName.includes(pq.codigoRecursoProject.toLowerCase())) return true;
          if (pq.seq !== undefined && (cleanResName === String(pq.seq) || cleanResName.startsWith(pq.seq + ' '))) return true;
          if (pq.id && cleanResName.includes(pq.id.toLowerCase())) return true;
          if (pq.descricao && cleanResName.includes(pq.descricao.toLowerCase())) return true;
          return false;
        });

        if (matchingPq) {
          const qty = task.physicalQuantity || matchingPq.quantidadeOrcada || 1;
          allocationLinks.push({
            seq: linkSeq++,
            pqItemId: matchingPq.id,
            taskUniqueId: task.uniqueId,
            allocationRule: 'DIRECT_1_1',
            calculatedQuantity: qty,
            totalCostAllocated: qty * (matchingPq.precoUnitarioCustoDireto || 0),
            totalRevenueAllocated: qty * (matchingPq.precoUnitarioVenda || 0),
            observacoes: `Vínculo importado do recurso "${resourceName}" do MS Project XML`
          });
        }
      });
    });
  }

  return { tasks, allocationLinks };
}

/**
 * PARSER PARA CSV / TEXTO TABULAR DE TAREFAS
 */
export function parseScheduleTasksCsv(csvText: string): ScheduleTask[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return [];

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
