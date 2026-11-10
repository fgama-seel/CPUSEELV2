import { PQItem, ScheduleTask, AllocationLink, WeeklyProgressItem, ParametrosFluxoCaixa } from '../types';

export const SEEL_SABESP_PQ_ITEMS: PQItem[] = [
  // GRUPO 01 - CANTEIRO E PRELIMINARES
  {
    id: '1010101',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '01 - CANTEIRO E SERVIÇOS PRELIMINARES',
    descricao: 'Instalação e Montagem do Canteiro de Obras Central',
    unidade: 'GB',
    quantidadeOrcada: 1,
    precoUnitarioVenda: 1250000.00,
    precoUnitarioCustoDireto: 920000.00,
    codigoRecursoProject: '1010101'
  },
  {
    id: '1010102',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '01 - CANTEIRO E SERVIÇOS PRELIMINARES',
    descricao: 'Manutenção, Vigilância e Operação do Canteiro',
    unidade: 'MES',
    quantidadeOrcada: 21,
    precoUnitarioVenda: 85000.00,
    precoUnitarioCustoDireto: 62000.00,
    codigoRecursoProject: '1010102'
  },

  // GRUPO 02 - GESTÃO DA QUALIDADE
  {
    id: '2010101',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '02 - QUALIDADE E MEIO AMBIENTE',
    descricao: 'Elaboração e Gestão do Plano de Qualidade (PGQ) e QSMS',
    unidade: 'GB',
    quantidadeOrcada: 1,
    precoUnitarioVenda: 180000.00,
    precoUnitarioCustoDireto: 110000.00,
    codigoRecursoProject: '2010101'
  },

  // GRUPO 03 - PERFURAÇÕES PARA INJEÇÃO (DRIVER PRINCIPAL)
  {
    id: '3010101',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Mobilização e Desmobilização de Equipamentos de Geotecnia',
    unidade: 'GB',
    quantidadeOrcada: 1,
    precoUnitarioVenda: 450000.00,
    precoUnitarioCustoDireto: 320000.00,
    codigoRecursoProject: '3010101'
  },
  {
    id: '3010102',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Deslocamento de Perfuratriz e Equipamentos entre Furos',
    unidade: 'un',
    quantidadeOrcada: 473,
    precoUnitarioVenda: 250.00,
    precoUnitarioCustoDireto: 165.00,
    codigoRecursoProject: '3010102'
  },
  {
    id: '3010103',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Perfuração em Rocha para Cortina de Injeção Ø 3" (Driver)',
    unidade: 'M',
    quantidadeOrcada: 7674.33,
    precoUnitarioVenda: 580.00,
    precoUnitarioCustoDireto: 395.00,
    codigoRecursoProject: '3010103'
  },
  {
    id: '3010104',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Ensaio de Permeabilidade tipo Lugeon / Perda d\'Água',
    unidade: 'un',
    quantidadeOrcada: 89,
    precoUnitarioVenda: 1200.00,
    precoUnitarioCustoDireto: 750.00,
    codigoRecursoProject: '3010104'
  },
  {
    id: '3010105',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Instalação e Manuseio de Obturador Simples',
    unidade: 'un',
    quantidadeOrcada: 473,
    precoUnitarioVenda: 350.00,
    precoUnitarioCustoDireto: 210.00,
    codigoRecursoProject: '3010105'
  },
  {
    id: '3010106',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Instalação e Manuseio de Obturador Duplo',
    unidade: 'un',
    quantidadeOrcada: 4586,
    precoUnitarioVenda: 420.00,
    precoUnitarioCustoDireto: 265.00,
    codigoRecursoProject: '3010106'
  },
  {
    id: '3010107',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Fornecimento e Injeção de Cimento Portland CP-II/V',
    unidade: 'KG',
    quantidadeOrcada: 550370,
    precoUnitarioVenda: 3.85,
    precoUnitarioCustoDireto: 2.65,
    codigoRecursoProject: '3010107'
  },
  {
    id: '3010108',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '03 - PERFURAÇÕES PARA INJEÇÕES',
    descricao: 'Fornecimento e Injeção de Aditivo Microssílica',
    unidade: 'KG',
    quantidadeOrcada: 44238,
    precoUnitarioVenda: 8.90,
    precoUnitarioCustoDireto: 5.80,
    codigoRecursoProject: '3010108'
  },

  // GRUPO 04 - DRENOS SUB-HORIZONTAIS
  {
    id: '4010102',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '04 - DRENOS SUB-HORIZONTAIS',
    descricao: 'Execução de Furos de Drenagem Sub-horizontal (un)',
    unidade: 'un',
    quantidadeOrcada: 109,
    precoUnitarioVenda: 650.00,
    precoUnitarioCustoDireto: 410.00,
    codigoRecursoProject: '4010102'
  },
  {
    id: '4010103',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '04 - DRENOS SUB-HORIZONTAIS',
    descricao: 'Perfuração em Solo/Rocha para Drenos Ø 4"',
    unidade: 'M',
    quantidadeOrcada: 327,
    precoUnitarioVenda: 420.00,
    precoUnitarioCustoDireto: 280.00,
    codigoRecursoProject: '4010103'
  },

  // GRUPO 05 - TUBULAÇÕES
  {
    id: '5010101',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '05 - TUBULAÇÕES E DRENOS',
    descricao: 'Fornecimento e Instalação de Tubo PVC Ranhurado Ø 2" p/ Dreno',
    unidade: 'M',
    quantidadeOrcada: 327,
    precoUnitarioVenda: 185.00,
    precoUnitarioCustoDireto: 115.00,
    codigoRecursoProject: '5010101'
  },

  // GRUPO 06 - CONCRETO, TELAS E TRATAMENTO SUPERFICIAL (ITEM SPLIT 40/60)
  {
    id: '6010102',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '06 - CONCRETO E TELAS',
    descricao: 'Armação em Tela Soldada Q-196 (Item Contratual com Split)',
    unidade: 'KG',
    quantidadeOrcada: 18500,
    precoUnitarioVenda: 18.50,
    precoUnitarioCustoDireto: 12.00,
    isSplitParent: true,
    codigoRecursoProject: '6010102'
  },
  {
    id: '60101021',
    parentId: '6010102',
    lote: 'LOTE 1',
    grupo: '06 - CONCRETO E TELAS',
    descricao: 'Armação em Tela Soldada Q-196 - FORNECIMENTO (40%)',
    unidade: 'KG',
    quantidadeOrcada: 18500,
    precoUnitarioVenda: 7.40,
    precoUnitarioCustoDireto: 4.80,
    isSplitParent: false,
    splitRatioVenda: 0.40,
    codigoRecursoProject: '60101021'
  },
  {
    id: '60101022',
    parentId: '6010102',
    lote: 'LOTE 1',
    grupo: '06 - CONCRETO E TELAS',
    descricao: 'Armação em Tela Soldada Q-196 - APLICAÇÃO E MONTAGEM (60%)',
    unidade: 'KG',
    quantidadeOrcada: 18500,
    precoUnitarioVenda: 11.10,
    precoUnitarioCustoDireto: 7.20,
    isSplitParent: false,
    splitRatioVenda: 0.60,
    codigoRecursoProject: '60101022'
  },
  {
    id: '6010103',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '06 - CONCRETO E TELAS',
    descricao: 'Chumbadores de Aço CA-50 Ø 16mm para Fixação de Telas',
    unidade: 'un',
    quantidadeOrcada: 2400,
    precoUnitarioVenda: 48.00,
    precoUnitarioCustoDireto: 28.00,
    codigoRecursoProject: '6010103'
  },
  {
    id: '6010105',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '06 - CONCRETO E TELAS',
    descricao: 'Hidrojateamento e Escarificação de Superfície (m²)',
    unidade: 'M2',
    quantidadeOrcada: 5500,
    precoUnitarioVenda: 65.00,
    precoUnitarioCustoDireto: 40.00,
    codigoRecursoProject: '6010105'
  },
  {
    id: '6010106',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '06 - CONCRETO E TELAS',
    descricao: 'Argamassa Projetada com Fibras Metálicas espessura 8cm (m³)',
    unidade: 'M3',
    quantidadeOrcada: 440,
    precoUnitarioVenda: 2850.00,
    precoUnitarioCustoDireto: 1850.00,
    codigoRecursoProject: '6010106'
  },

  // GRUPO 09 - REPAROS ESTRUTURAIS
  {
    id: '9010101',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '09 - REPAROS ESTRUTURAIS',
    descricao: 'Tratamento de Fissuras e Reparos Superficiais em Concreto',
    unidade: 'M2',
    quantidadeOrcada: 1850,
    precoUnitarioVenda: 320.00,
    precoUnitarioCustoDireto: 210.00,
    codigoRecursoProject: '9010101'
  },

  // GRUPO 10 - INSTRUMENTAÇÃO GEOTÉCNICA
  {
    id: '100101011',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '10 - INSTRUMENTAÇÃO',
    descricao: 'Piezômetros de Tubo Aberto - FORNECIMENTO (40%)',
    unidade: 'un',
    quantidadeOrcada: 12,
    precoUnitarioVenda: 4800.00,
    precoUnitarioCustoDireto: 3100.00,
    codigoRecursoProject: '100101011'
  },
  {
    id: '100101012',
    parentId: null,
    lote: 'LOTE 1',
    grupo: '10 - INSTRUMENTAÇÃO',
    descricao: 'Piezômetros de Tubo Aberto - INSTALAÇÃO E LEITURAS (60%)',
    unidade: 'un',
    quantidadeOrcada: 12,
    precoUnitarioVenda: 7200.00,
    precoUnitarioCustoDireto: 4600.00,
    codigoRecursoProject: '100101012'
  },

  // LOTE 2 - SERVIÇOS SUBAQUÁTICOS E MERGULHO
  {
    id: '14010101',
    parentId: null,
    lote: 'LOTE 2',
    grupo: '14 - MERGULHO PROFISSIONAL',
    descricao: 'Equipe de Mergulho Profissional Subaquático Satélite',
    unidade: 'MES',
    quantidadeOrcada: 5,
    precoUnitarioVenda: 145000.00,
    precoUnitarioCustoDireto: 98000.00,
    codigoRecursoProject: '14010101'
  },
  {
    id: '14010104',
    parentId: null,
    lote: 'LOTE 2',
    grupo: '14 - MERGULHO PROFISSIONAL',
    descricao: 'Dragagem e Desassoreamento do Leito com Escafandro',
    unidade: 'M3',
    quantidadeOrcada: 3600,
    precoUnitarioVenda: 120.00,
    precoUnitarioCustoDireto: 75.00,
    codigoRecursoProject: '14010104'
  },
  {
    id: '15010101',
    parentId: null,
    lote: 'LOTE 2',
    grupo: '15 - EQUIPAMENTOS SUBAQUÁTICOS',
    descricao: 'Balsa de Apoio com Compressor e Câmara Hiperbárica',
    unidade: 'MES',
    quantidadeOrcada: 5,
    precoUnitarioVenda: 95000.00,
    precoUnitarioCustoDireto: 62000.00,
    codigoRecursoProject: '15010101'
  },
  {
    id: '16010102',
    parentId: null,
    lote: 'LOTE 2',
    grupo: '16 - CONCRETO SUBAQUÁTICO',
    descricao: 'Concreto Tremie Subaquático com Aditivo Anti-lavagem',
    unidade: 'M3',
    quantidadeOrcada: 850,
    precoUnitarioVenda: 1450.00,
    precoUnitarioCustoDireto: 960.00,
    codigoRecursoProject: '16010102'
  }
];

export const SEEL_SABESP_SCHEDULE_TASKS: ScheduleTask[] = [
  // NÍVEL 1
  {
    uniqueId: 1,
    wbs: '1',
    outlineLevel: 1,
    parentUniqueId: null,
    name: 'OBRA GERAL - TRANSPORTE ETA E CONTENÇÕES GEOTÉCNICAS',
    startDate: '2026-01-05',
    finishDate: '2027-09-30',
    physicalQuantity: 1,
    unit: 'GB',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 50,
    workingDaysDuration: 440,
    isSummary: true
  },

  // NÍVEL 2 - LOTE 1
  {
    uniqueId: 10,
    wbs: '1.1',
    outlineLevel: 2,
    parentUniqueId: 1,
    name: 'LOTE 1 - CONTENÇÕES, INJEÇÕES E TRATAMENTO DA ESTRUTURA',
    startDate: '2026-01-05',
    finishDate: '2027-05-30',
    physicalQuantity: 1,
    unit: 'GB',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 40,
    workingDaysDuration: 350,
    isSummary: true
  },

  // NÍVEL 3 - PRELIMINARES E CANTEIRO
  {
    uniqueId: 20,
    wbs: '1.1.1',
    outlineLevel: 3,
    parentUniqueId: 10,
    name: 'SERVIÇOS PRELIMINARES, QUALIDADE E CANTEIRO',
    startDate: '2026-01-05',
    finishDate: '2027-05-30',
    physicalQuantity: 1,
    unit: 'GB',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 12,
    workingDaysDuration: 350,
    isSummary: true
  },

  // NÍVEL 8 - TAREFAS DE CANTEIRO (1:1 DIRECT)
  {
    uniqueId: 474,
    wbs: '1.1.1.1',
    outlineLevel: 8,
    parentUniqueId: 20,
    name: 'Instalação e Mobilização do Canteiro Central',
    startDate: '2026-01-05',
    finishDate: '2026-02-15',
    physicalQuantity: 1,
    unit: 'GB',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 10,
    workingDaysDuration: 30,
    isSummary: false
  },
  {
    uniqueId: 523,
    wbs: '1.1.1.2',
    outlineLevel: 8,
    parentUniqueId: 20,
    name: 'Manutenção, Vigilância e Operação Contínua do Canteiro',
    startDate: '2026-01-05',
    finishDate: '2027-05-30',
    physicalQuantity: 21,
    unit: 'MES',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 350,
    isSummary: false
  },

  // NÍVEL 7 - PACOTE INJEÇÕES BLOCO 01 (ROLL-UP)
  {
    uniqueId: 73,
    wbs: '1.1.2.1',
    outlineLevel: 7,
    parentUniqueId: 10,
    name: 'Pacote Injeções e Perfurações - Bloco 01 (Vertedouro)',
    startDate: '2026-02-16',
    finishDate: '2026-06-30',
    physicalQuantity: 2557.81,
    unit: 'M',
    dailyProductivityPerTeam: 25,
    teamsCount: 2,
    workersPerTeam: 8,
    workingDaysDuration: 95,
    isSummary: true
  },

  // NÍVEL 8 - TAREFAS EXECUTIVAS BLOCO 01
  {
    uniqueId: 159,
    wbs: '1.1.2.1.1',
    outlineLevel: 8,
    parentUniqueId: 73,
    name: 'Perfuração e Injeção Linha A - Furos 01 a 08',
    startDate: '2026-02-16',
    finishDate: '2026-03-05',
    physicalQuantity: 104.98,
    unit: 'M',
    dailyProductivityPerTeam: 15,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 7,
    isSummary: false
  },
  {
    uniqueId: 160,
    wbs: '1.1.2.1.2',
    outlineLevel: 8,
    parentUniqueId: 73,
    name: 'Perfuração e Injeção Linha A - Furos 09 a 16',
    startDate: '2026-03-06',
    finishDate: '2026-03-24',
    physicalQuantity: 104.98,
    unit: 'M',
    dailyProductivityPerTeam: 15,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 7,
    isSummary: false
  },
  {
    uniqueId: 161,
    wbs: '1.1.2.1.3',
    outlineLevel: 8,
    parentUniqueId: 73,
    name: 'Perfuração e Injeção Linha B - Furos 17 a 28',
    startDate: '2026-03-25',
    finishDate: '2026-04-20',
    physicalQuantity: 157.47,
    unit: 'M',
    dailyProductivityPerTeam: 15,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 11,
    isSummary: false
  },

  // NÍVEL 7 - PACOTE INJEÇÕES BLOCO 02
  {
    uniqueId: 74,
    wbs: '1.1.2.2',
    outlineLevel: 7,
    parentUniqueId: 10,
    name: 'Pacote Injeções e Perfurações - Bloco 02 (Ombro Esquerdo)',
    startDate: '2026-04-01',
    finishDate: '2026-08-30',
    physicalQuantity: 2557.81,
    unit: 'M',
    dailyProductivityPerTeam: 25,
    teamsCount: 2,
    workersPerTeam: 8,
    workingDaysDuration: 105,
    isSummary: true
  },
  {
    uniqueId: 162,
    wbs: '1.1.2.2.1',
    outlineLevel: 8,
    parentUniqueId: 74,
    name: 'Perfuração e Injeção Bloco 02 - Furos 01 a 12',
    startDate: '2026-04-01',
    finishDate: '2026-04-25',
    physicalQuantity: 157.47,
    unit: 'M',
    dailyProductivityPerTeam: 15,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 11,
    isSummary: false
  },
  {
    uniqueId: 163,
    wbs: '1.1.2.2.2',
    outlineLevel: 8,
    parentUniqueId: 74,
    name: 'Perfuração e Injeção Bloco 02 - Furos 13 a 25',
    startDate: '2026-04-26',
    finishDate: '2026-05-20',
    physicalQuantity: 157.47,
    unit: 'M',
    dailyProductivityPerTeam: 15,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 11,
    isSummary: false
  },

  // DRENAGEM
  {
    uniqueId: 499,
    wbs: '1.1.3.1',
    outlineLevel: 8,
    parentUniqueId: 10,
    name: 'Perfuração e Instalação de Drenos - Bloco 01',
    startDate: '2026-05-01',
    finishDate: '2026-05-20',
    physicalQuantity: 163.5,
    unit: 'M',
    dailyProductivityPerTeam: 20,
    teamsCount: 1,
    workersPerTeam: 5,
    workingDaysDuration: 9,
    isSummary: false
  },
  {
    uniqueId: 297,
    wbs: '1.1.3.2',
    outlineLevel: 8,
    parentUniqueId: 10,
    name: 'Perfuração e Instalação de Drenos - Bloco 02',
    startDate: '2026-05-21',
    finishDate: '2026-06-10',
    physicalQuantity: 163.5,
    unit: 'M',
    dailyProductivityPerTeam: 20,
    teamsCount: 1,
    workersPerTeam: 5,
    workingDaysDuration: 9,
    isSummary: false
  },

  // PARAMENTO E ARGAMASSA PROJETADA
  {
    uniqueId: 285,
    wbs: '1.1.4.1',
    outlineLevel: 8,
    parentUniqueId: 10,
    name: 'Tratamento de Superfície, Hidrojateamento e Telas Bloco 01',
    startDate: '2026-06-01',
    finishDate: '2026-06-25',
    physicalQuantity: 2750,
    unit: 'M2',
    dailyProductivityPerTeam: 150,
    teamsCount: 2,
    workersPerTeam: 8,
    workingDaysDuration: 10,
    isSummary: false
  },
  {
    uniqueId: 287,
    wbs: '1.1.4.2',
    outlineLevel: 8,
    parentUniqueId: 10,
    name: 'Tratamento de Superfície, Hidrojateamento e Telas Bloco 02',
    startDate: '2026-06-26',
    finishDate: '2026-07-20',
    physicalQuantity: 2750,
    unit: 'M2',
    dailyProductivityPerTeam: 150,
    teamsCount: 2,
    workersPerTeam: 8,
    workingDaysDuration: 10,
    isSummary: false
  },

  // INSTRUMENTAÇÃO
  {
    uniqueId: 348,
    wbs: '1.1.5.1',
    outlineLevel: 8,
    parentUniqueId: 10,
    name: 'Instalação de Instrumentação e Piezômetros',
    startDate: '2026-07-01',
    finishDate: '2026-08-15',
    physicalQuantity: 12,
    unit: 'un',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 4,
    workingDaysDuration: 12,
    isSummary: false
  },

  // NÍVEL 2 - LOTE 2 (MERGULHO)
  {
    uniqueId: 600,
    wbs: '1.2',
    outlineLevel: 2,
    parentUniqueId: 1,
    name: 'LOTE 2 - SERVIÇOS SUBAQUÁTICOS E DESASSOREAMENTO',
    startDate: '2026-08-01',
    finishDate: '2027-01-31',
    physicalQuantity: 1,
    unit: 'GB',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 15,
    workingDaysDuration: 130,
    isSummary: true
  },
  {
    uniqueId: 601,
    wbs: '1.2.1',
    outlineLevel: 8,
    parentUniqueId: 600,
    name: 'Mergulho Profissional e Inspeções Subaquáticas Módulo 1',
    startDate: '2026-08-01',
    finishDate: '2026-10-31',
    physicalQuantity: 2.5,
    unit: 'MES',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 6,
    workingDaysDuration: 65,
    isSummary: false
  },
  {
    uniqueId: 602,
    wbs: '1.2.2',
    outlineLevel: 8,
    parentUniqueId: 600,
    name: 'Dragagem do Leito e Concreto Tremie Subaquático Módulo 2',
    startDate: '2026-11-01',
    finishDate: '2027-01-31',
    physicalQuantity: 2.5,
    unit: 'MES',
    dailyProductivityPerTeam: 1,
    teamsCount: 1,
    workersPerTeam: 8,
    workingDaysDuration: 65,
    isSummary: false
  }
];

export const SEEL_SABESP_ALLOCATIONS: AllocationLink[] = [
  // 1. DIRECT_1_1: Canteiro e Gestão
  {
    seq: 1,
    pqItemId: '1010101',
    taskUniqueId: 474,
    allocationRule: 'DIRECT_1_1',
    calculatedQuantity: 1,
    totalCostAllocated: 920000,
    totalRevenueAllocated: 1250000,
    observacoes: 'Instalação de Canteiro 100% alocada na tarefa UID 474'
  },
  {
    seq: 2,
    pqItemId: '1010102',
    taskUniqueId: 523,
    allocationRule: 'DIRECT_1_1',
    calculatedQuantity: 21,
    totalCostAllocated: 1302000,
    totalRevenueAllocated: 1785000,
    observacoes: 'Manutenção 21 meses contínua na tarefa UID 523'
  },
  {
    seq: 3,
    pqItemId: '2010101',
    taskUniqueId: 474,
    allocationRule: 'DIRECT_1_1',
    calculatedQuantity: 1,
    totalCostAllocated: 110000,
    totalRevenueAllocated: 180000,
    observacoes: 'Plano de Qualidade alocado na implantação inicial'
  },

  // 2. TASK_QUANTITY_LOOKUP: Perfurações que são o driver direto da tarefa
  {
    seq: 4,
    pqItemId: '3010103',
    taskUniqueId: 159,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 104.98,
    totalCostAllocated: 41467.10,
    totalRevenueAllocated: 60888.40,
    observacoes: 'Herança direta dos 104,98 m da tarefa UID 159'
  },
  {
    seq: 5,
    pqItemId: '3010103',
    taskUniqueId: 160,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 104.98,
    totalCostAllocated: 41467.10,
    totalRevenueAllocated: 60888.40,
    observacoes: 'Herança direta dos 104,98 m da tarefa UID 160'
  },
  {
    seq: 6,
    pqItemId: '3010103',
    taskUniqueId: 161,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 157.47,
    totalCostAllocated: 62200.65,
    totalRevenueAllocated: 91332.60,
    observacoes: 'Herança direta dos 157,47 m da tarefa UID 161'
  },
  {
    seq: 7,
    pqItemId: '3010103',
    taskUniqueId: 162,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 157.47,
    totalCostAllocated: 62200.65,
    totalRevenueAllocated: 91332.60,
    observacoes: 'Herança direta dos 157,47 m da tarefa UID 162'
  },
  {
    seq: 8,
    pqItemId: '3010103',
    taskUniqueId: 163,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 157.47,
    totalCostAllocated: 62200.65,
    totalRevenueAllocated: 91332.60,
    observacoes: 'Herança direta dos 157,47 m da tarefa UID 163'
  },

  // 3. PROPORTIONAL_TO_TASK_QTY: Cimento e Microssílica rateados proporcionalmente aos metros perfurados
  {
    seq: 9,
    pqItemId: '3010107',
    taskUniqueId: 159,
    allocationRule: 'PROPORTIONAL_TO_TASK_QTY',
    ruleParams: { groupTaskIds: [159, 160, 161, 162, 163] },
    calculatedQuantity: 84672.31,
    totalCostAllocated: 224381.62,
    totalRevenueAllocated: 325988.40,
    observacoes: 'Rateio proporcional ao driver físico de perfuração'
  },
  {
    seq: 10,
    pqItemId: '3010107',
    taskUniqueId: 160,
    allocationRule: 'PROPORTIONAL_TO_TASK_QTY',
    ruleParams: { groupTaskIds: [159, 160, 161, 162, 163] },
    calculatedQuantity: 84672.31,
    totalCostAllocated: 224381.62,
    totalRevenueAllocated: 325988.40,
    observacoes: 'Rateio proporcional ao driver físico de perfuração'
  },
  {
    seq: 11,
    pqItemId: '3010108',
    taskUniqueId: 159,
    allocationRule: 'PROPORTIONAL_TO_TASK_QTY',
    ruleParams: { groupTaskIds: [159, 160, 161, 162, 163] },
    calculatedQuantity: 6805.85,
    totalCostAllocated: 39473.93,
    totalRevenueAllocated: 60572.06,
    observacoes: 'Rateio proporcional da microssílica'
  },
  {
    seq: 12,
    pqItemId: '3010102',
    taskUniqueId: 159,
    allocationRule: 'PROPORTIONAL_TO_TASK_QTY',
    ruleParams: { groupTaskIds: [159, 160, 161, 162, 163] },
    calculatedQuantity: 72.77,
    totalCostAllocated: 12007.05,
    totalRevenueAllocated: 18192.50,
    observacoes: 'Deslocamento entre furos rateado'
  },

  // 4. DRENAGEM LOOKUP (4010103)
  {
    seq: 13,
    pqItemId: '4010103',
    taskUniqueId: 499,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 163.5,
    totalCostAllocated: 45780,
    totalRevenueAllocated: 68670,
    observacoes: 'Perfuração de Dreno Bloco 01'
  },
  {
    seq: 14,
    pqItemId: '4010103',
    taskUniqueId: 297,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 163.5,
    totalCostAllocated: 45780,
    totalRevenueAllocated: 68670,
    observacoes: 'Perfuração de Dreno Bloco 02'
  },

  // 5. DEPENDÊNCIA CRUZADA (CROSS_ITEM_FACTOR):
  // Argamassa projetada 6010106 = Hidrojateamento 6010105 * 0.08m de espessura
  {
    seq: 15,
    pqItemId: '6010105',
    taskUniqueId: 285,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 2750,
    totalCostAllocated: 110000,
    totalRevenueAllocated: 178750,
    observacoes: 'Área de hidrojateamento Bloco 01 (2.750 m²)'
  },
  {
    seq: 16,
    pqItemId: '6010106',
    taskUniqueId: 285,
    allocationRule: 'CROSS_ITEM_FACTOR',
    ruleParams: { sourceSeqOrItemId: '6010105', technicalFactor: 0.08 },
    calculatedQuantity: 220,
    totalCostAllocated: 407000,
    totalRevenueAllocated: 627000,
    observacoes: 'Argamassa projetada = 2.750 m² * 0.08m = 220 m³'
  },
  {
    seq: 17,
    pqItemId: '6010105',
    taskUniqueId: 287,
    allocationRule: 'TASK_QUANTITY_LOOKUP',
    calculatedQuantity: 2750,
    totalCostAllocated: 110000,
    totalRevenueAllocated: 178750,
    observacoes: 'Área de hidrojateamento Bloco 02 (2.750 m²)'
  },
  {
    seq: 18,
    pqItemId: '6010106',
    taskUniqueId: 287,
    allocationRule: 'CROSS_ITEM_FACTOR',
    ruleParams: { sourceSeqOrItemId: '6010105', technicalFactor: 0.08 },
    calculatedQuantity: 220,
    totalCostAllocated: 407000,
    totalRevenueAllocated: 627000,
    observacoes: 'Argamassa projetada = 2.750 m² * 0.08m = 220 m³'
  },

  // SPLIT 40/60 TELAS
  {
    seq: 19,
    pqItemId: '60101021',
    taskUniqueId: 285,
    allocationRule: 'UNIFORM_SPLIT',
    ruleParams: { groupTaskIds: [285, 287] },
    calculatedQuantity: 9250,
    totalCostAllocated: 44400,
    totalRevenueAllocated: 68450,
    observacoes: 'Telas Soldadas - Fornecimento Bloco 01 (40%)'
  },
  {
    seq: 20,
    pqItemId: '60101022',
    taskUniqueId: 285,
    allocationRule: 'UNIFORM_SPLIT',
    ruleParams: { groupTaskIds: [285, 287] },
    calculatedQuantity: 9250,
    totalCostAllocated: 66600,
    totalRevenueAllocated: 102675,
    observacoes: 'Telas Soldadas - Aplicação Bloco 01 (60%)'
  },

  // 6. PROPORTIONAL_TO_DURATION: Reparos estruturais rateados por duração
  {
    seq: 21,
    pqItemId: '9010101',
    taskUniqueId: 285,
    allocationRule: 'PROPORTIONAL_TO_DURATION',
    ruleParams: { groupTaskIds: [285, 287] },
    calculatedQuantity: 925,
    totalCostAllocated: 194250,
    totalRevenueAllocated: 296000,
    observacoes: 'Reparos rateados pela duração dos blocos'
  },
  {
    seq: 22,
    pqItemId: '9010101',
    taskUniqueId: 287,
    allocationRule: 'PROPORTIONAL_TO_DURATION',
    ruleParams: { groupTaskIds: [285, 287] },
    calculatedQuantity: 925,
    totalCostAllocated: 194250,
    totalRevenueAllocated: 296000,
    observacoes: 'Reparos rateados pela duração dos blocos'
  },

  // 7. UNIFORM_SPLIT: Mergulho Lote 2
  {
    seq: 23,
    pqItemId: '14010101',
    taskUniqueId: 601,
    allocationRule: 'UNIFORM_SPLIT',
    ruleParams: { groupTaskIds: [601, 602] },
    calculatedQuantity: 2.5,
    totalCostAllocated: 245000,
    totalRevenueAllocated: 362500,
    observacoes: 'Mergulho profissional 50% no Módulo 1'
  },
  {
    seq: 24,
    pqItemId: '14010101',
    taskUniqueId: 602,
    allocationRule: 'UNIFORM_SPLIT',
    ruleParams: { groupTaskIds: [601, 602] },
    calculatedQuantity: 2.5,
    totalCostAllocated: 245000,
    totalRevenueAllocated: 362500,
    observacoes: 'Mergulho profissional 50% no Módulo 2'
  }
];

export const SEEL_SABESP_WEEKLY_PROGRESS: WeeklyProgressItem[] = [
  { seq: 1, semana: 'Sem 01 (Jan/26)', semanaNumero: 1, quantidadeRealizadaSemana: 0.35, dataApontamento: '2026-01-10' },
  { seq: 1, semana: 'Sem 02 (Jan/26)', semanaNumero: 2, quantidadeRealizadaSemana: 0.45, dataApontamento: '2026-01-17' },
  { seq: 1, semana: 'Sem 03 (Jan/26)', semanaNumero: 3, quantidadeRealizadaSemana: 0.20, dataApontamento: '2026-01-24' },
  { seq: 4, semana: 'Sem 07 (Fev/26)', semanaNumero: 7, quantidadeRealizadaSemana: 52.49, dataApontamento: '2026-02-21' },
  { seq: 4, semana: 'Sem 08 (Fev/26)', semanaNumero: 8, quantidadeRealizadaSemana: 52.49, dataApontamento: '2026-02-28' },
  { seq: 9, semana: 'Sem 07 (Fev/26)', semanaNumero: 7, quantidadeRealizadaSemana: 42336.15, dataApontamento: '2026-02-21' }
];

export const SEEL_SABESP_PARAMETROS_FLUXO_CAIXA: ParametrosFluxoCaixa = {
  lagFaturamentoMeses: 2, // 60 dias
  descontoAdiantamentoPerc: 13.0,
  retencaoContratualPerc: 5.0,
  impostosPerc: 6.65,
  adiantamentoInicialValor: 2500000.00,
  devolucaoRetencaoMesFinal: true,
  productivityMultiplier: 1.0
};
