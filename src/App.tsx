import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { seedInitialDataIfNeeded, ADMIN_EMAIL } from './lib/firebaseSeed';
import {
  subscribeObras,
  subscribeCPUs,
  subscribeBancoInsumos,
  subscribeUserPermissions,
  saveCPU,
  createCPU,
  deleteCPU,
  saveObra,
  createObra,
  deleteObra,
  createInsumoBase,
  registerUserRequest
} from './services/dbService';
import { Obra, CPU, InsumoBase, UserPermission, Insumo } from './types';
import {
  getPendingCPUs,
  savePendingCPUToCache,
  removePendingCPUFromCache,
  clearAllPendingCPUsFromCache
} from './lib/pendingCache';
import { ordenarInsumosCPU } from './lib/mochilaDefaults';
import {
  SEEL_SABESP_PQ_ITEMS,
  SEEL_SABESP_SCHEDULE_TASKS,
  SEEL_SABESP_ALLOCATIONS
} from './lib/seelSabespDataset';

// Components
import { Header } from './components/Header';
import { Sidebar, TabKey } from './components/Sidebar';
import { AbaResumo } from './components/AbaResumo';
import { AbaMatrizPQ } from './components/AbaMatrizPQ';
import { AbaCronogramaExecutivo } from './components/AbaCronogramaExecutivo';
import { AbaTabelaCPUs } from './components/AbaTabelaCPUs';
import { AbaCustosIndiretos } from './components/AbaCustosIndiretos';
import { AbaRelatoriosGerenciais } from './components/AbaRelatoriosGerenciais';
import { ScheduleTask, AllocationLink, PQItem, ParametrosFluxoCaixa, VersaoCronograma, RecursoProjectConfig } from './types';
import { AbaABCInsumos } from './components/AbaABCInsumos';
import { AbaInsumosCadastrados } from './components/AbaInsumosCadastrados';
import { AbaGestaoAcessos } from './components/AbaGestaoAcessos';
import { AbaDashboardCPU } from './components/AbaDashboardCPU';
import { AbaPainelFirestore } from './components/AbaPainelFirestore';
import { ModalNovaObra } from './components/ModalNovaObra';
import { ModalNovaCPU } from './components/ModalNovaCPU';
import { ModalInsumo } from './components/ModalInsumo';
import { ModalImportarInsumos } from './components/ModalImportarInsumos';
import { ModalComposicoes } from './components/ModalComposicoes';
import { ModalGuiaUsuario } from './components/ModalGuiaUsuario';
import { ModalExcluirObra } from './components/ModalExcluirObra';
import { ModalImportarBD } from './components/ModalImportarBD';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  // Authentication State
  const [userEmail, setUserEmail] = useState<string | null>('fgama@seel.com.br'); // Default logged in for smooth dev preview
  const [userDisplayName, setUserDisplayName] = useState<string>('F. Gama (Admin SEEL)');
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

  // Firestore Data State
  const [obras, setObras] = useState<Obra[]>([]);
  const [activeObraId, setActiveObraId] = useState<string | null>('obra-966');

  const [cpus, setCpus] = useState<CPU[]>([]);
  const [activeCpuId, setActiveCpuId] = useState<string | null>(null);

  const [bancoInsumos, setBancoInsumos] = useState<InsumoBase[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');

  // Shared Planning State (Strictly Isolated per Obra - Clean by default for real testing)
  const [pqItems, setPqItems] = useState<PQItem[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [allocationLinks, setAllocationLinks] = useState<AllocationLink[]>([]);
  const [recursosConfig, setRecursosConfig] = useState<RecursoProjectConfig[]>([]);
  const [versoesCronograma, setVersoesCronograma] = useState<VersaoCronograma[]>([]);
  const [parametrosCaixa, setParametrosCaixa] = useState<ParametrosFluxoCaixa>({
    lagFaturamentoMeses: 2,
    mesProducaoOffset: 0,
    mesFaturamentoOffset: 1,
    mesRecebimentoOffset: 2,
    descontoAdiantamentoPerc: 13.0,
    retencaoContratualPerc: 5.0,
    impostosPerc: 6.65,
    productivityMultiplier: 1.0
  });

  // Reativo à troca de activeObraId: carrega estritamente os dados da obra selecionada
  useEffect(() => {
    if (!activeObraId) return;
    const oKey = activeObraId;

    const savedPq = localStorage.getItem(`seel_matriz_${oKey}_pq`);
    const savedTasks = localStorage.getItem(`seel_matriz_${oKey}_tasks`);
    const savedLinks = localStorage.getItem(`seel_matriz_${oKey}_links`);
    const savedRecursos = localStorage.getItem(`seel_matriz_${oKey}_recursos`);
    const savedVersoes = localStorage.getItem(`seel_matriz_${oKey}_versoes`);
    const savedParams = localStorage.getItem(`seel_matriz_${oKey}_params`);

    // Sanitização e deduplicação para evitar qualquer chave duplicada vinda do localStorage
    const deduplicateById = <T extends { id?: string | number }>(items: T[]): T[] => {
      const seen = new Set<string | number>();
      return (items || []).filter((item) => {
        const id = item?.id;
        if (id === undefined || id === null) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };

    const deduplicateTasks = (tasks: ScheduleTask[]): ScheduleTask[] => {
      const seen = new Set<number>();
      return (tasks || []).filter((t) => {
        if (!t || t.uniqueId === undefined) return true;
        if (seen.has(t.uniqueId)) return false;
        seen.add(t.uniqueId);
        return true;
      });
    };

    const currObra = obras.find((o) => o.id === activeObraId);

    // Leitura resiliente: 1º localStorage -> 2º activeObra (Firestore) -> 3º Dataset Padrão SEEL
    const rawPq = savedPq ? JSON.parse(savedPq) : (currObra?.pqItems && currObra.pqItems.length > 0 ? currObra.pqItems : SEEL_SABESP_PQ_ITEMS);
    const rawTasks = savedTasks ? JSON.parse(savedTasks) : (currObra?.scheduleTasks && currObra.scheduleTasks.length > 0 ? currObra.scheduleTasks : SEEL_SABESP_SCHEDULE_TASKS);
    const rawLinks = savedLinks ? JSON.parse(savedLinks) : (currObra?.allocationLinks && currObra.allocationLinks.length > 0 ? currObra.allocationLinks : SEEL_SABESP_ALLOCATIONS);
    const rawRecursos = savedRecursos ? JSON.parse(savedRecursos) : (currObra?.recursosConfig || []);
    const rawVersoes = savedVersoes ? JSON.parse(savedVersoes) : (currObra?.versoesCronograma || []);

    const finalPq = deduplicateById(rawPq);
    const finalTasks = deduplicateTasks(rawTasks);

    setPqItems(finalPq);
    setScheduleTasks(finalTasks);
    setAllocationLinks(rawLinks);
    setRecursosConfig(deduplicateById(rawRecursos));
    setVersoesCronograma(deduplicateById(rawVersoes));

    const finalParams = savedParams ? JSON.parse(savedParams) : (currObra?.parametrosCaixa || {
      lagFaturamentoMeses: 2,
      mesProducaoOffset: 0,
      mesFaturamentoOffset: 1,
      mesRecebimentoOffset: 2,
      descontoAdiantamentoPerc: 13.0,
      retencaoContratualPerc: 5.0,
      impostosPerc: 6.65,
      productivityMultiplier: 1.0
    });
    setParametrosCaixa(finalParams);

    // Salva no localStorage local para aquecimento da sessão
    localStorage.setItem(`seel_matriz_${oKey}_pq`, JSON.stringify(finalPq));
    localStorage.setItem(`seel_matriz_${oKey}_tasks`, JSON.stringify(finalTasks));
    localStorage.setItem(`seel_matriz_${oKey}_links`, JSON.stringify(rawLinks));
    localStorage.setItem(`seel_matriz_${oKey}_params`, JSON.stringify(finalParams));
  }, [activeObraId, obras]);

  // Handlers que salvam estritamente na chave da obra ativa
  const handleUpdatePqItems = (newPq: PQItem[]) => {
    const seen = new Set<string>();
    const sanitized = newPq.filter((p) => {
      if (!p?.id) return true;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    setPqItems(sanitized);
    if (activeObraId) {
      localStorage.setItem(`seel_matriz_${activeObraId}_pq`, JSON.stringify(sanitized));
    }
  };

  const handleUpdateScheduleTasks = (newTasks: ScheduleTask[]) => {
    const seen = new Set<number>();
    const sanitized = newTasks.filter((t) => {
      if (!t?.uniqueId) return true;
      if (seen.has(t.uniqueId)) return false;
      seen.add(t.uniqueId);
      return true;
    });
    setScheduleTasks(sanitized);
    if (activeObraId) {
      localStorage.setItem(`seel_matriz_${activeObraId}_tasks`, JSON.stringify(sanitized));
    }
  };

  const handleUpdateAllocationLinks = (newLinks: AllocationLink[]) => {
    setAllocationLinks(newLinks);
    if (activeObraId) {
      localStorage.setItem(`seel_matriz_${activeObraId}_links`, JSON.stringify(newLinks));
    }
  };

  const handleUpdateRecursosConfig = (newRecursos: RecursoProjectConfig[]) => {
    const seen = new Set<string>();
    const sanitized = newRecursos.filter((r) => {
      if (!r?.id) return true;
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    setRecursosConfig(sanitized);
    if (activeObraId) {
      localStorage.setItem(`seel_matriz_${activeObraId}_recursos`, JSON.stringify(sanitized));
    }
  };

  const handleUpdateVersoesCronograma = (newVersoes: VersaoCronograma[]) => {
    setVersoesCronograma(newVersoes);
    if (activeObraId) {
      localStorage.setItem(`seel_matriz_${activeObraId}_versoes`, JSON.stringify(newVersoes));
    }
  };

  const handleUpdateParametrosCaixa = (newParams: ParametrosFluxoCaixa) => {
    setParametrosCaixa(newParams);
    if (activeObraId) {
      localStorage.setItem(`seel_matriz_${activeObraId}_params`, JSON.stringify(newParams));
    }
  };

  // Pending Changes State
  const [pendingChanges, setPendingChanges] = useState<boolean>(() => Object.keys(getPendingCPUs()).length > 0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sidebar Collapse & Mobile State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  // Modals State
  const [isModalNovaObraOpen, setIsModalNovaObraOpen] = useState<boolean>(false);
  const [isModalNovaCpuOpen, setIsModalNovaCpuOpen] = useState<boolean>(false);
  const [isModalInsumoOpen, setIsModalInsumoOpen] = useState<boolean>(false);
  const [isModalImportarInsumosOpen, setIsModalImportarInsumosOpen] = useState<boolean>(false);
  const [isModalImportarBDOpen, setIsModalImportarBDOpen] = useState<boolean>(false);
  const [isGuiaUsuarioOpen, setIsGuiaUsuarioOpen] = useState<boolean>(false);
  const [obraToDelete, setObraToDelete] = useState<Obra | null>(null);

  // Traceability Modal State
  const [traceabilityInsumo, setTraceabilityInsumo] = useState<{ id: string; nome: string } | null>(null);

  // Seed data on startup
  useEffect(() => {
    seedInitialDataIfNeeded();
  }, []);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setUserDisplayName(user.displayName || user.email.split('@')[0]);
        await registerUserRequest(user.email, user.displayName || '');
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Subscriptions to Firestore
  useEffect(() => {
    const unsubObras = subscribeObras((list) => {
      setObras(list);
      if (list.length > 0 && (!activeObraId || !list.some((o) => o.id === activeObraId))) {
        setActiveObraId(list[0].id);
      }
    });

    const unsubPerms = subscribeUserPermissions((list) => {
      setUserPermissions(list);
    });

    return () => {
      unsubObras();
      unsubPerms();
    };
  }, []);

  // Real-time Subscription to Banco de Insumos for active Obra
  useEffect(() => {
    if (!activeObraId) {
      setBancoInsumos([]);
      return;
    }
    const unsubBanco = subscribeBancoInsumos(activeObraId, (list) => {
      setBancoInsumos(list);
    });
    return () => unsubBanco();
  }, [activeObraId]);

  // Real-time Subscription to CPUs for active Obra
  useEffect(() => {
    if (!activeObraId) return;
    const unsubCpus = subscribeCPUs(activeObraId, (list) => {
      const cachedPending = getPendingCPUs();
      const mergedList = list.map((item) => cachedPending[item.id] || item);
      setCpus(mergedList);
      setPendingChanges(Object.keys(cachedPending).length > 0);
      if (mergedList.length > 0 && (!activeCpuId || !mergedList.some((c) => c.id === activeCpuId))) {
        setActiveCpuId(mergedList[0].id);
      }
    });

    return () => unsubCpus();
  }, [activeObraId]);

  // Determine Current User Permission
  const normalizedEmail = (userEmail || '').toLowerCase().trim();
  const currentUserPerm = userPermissions.find((p) => p.email.toLowerCase() === normalizedEmail) || null;

  const isSuperAdmin = normalizedEmail === ADMIN_EMAIL;
  const isApproved = isSuperAdmin || currentUserPerm?.status === 'APPROVED';
  const isAdmin = isSuperAdmin || currentUserPerm?.role === 'ADMIN';

  // Filter allowed Obras for current user
  const allowedObras = obras.filter((o) => {
    if (isSuperAdmin) return true;
    if (!currentUserPerm || currentUserPerm.status !== 'APPROVED') return false;
    if (currentUserPerm.obrasPermitidas?.includes('*')) return true;
    if (currentUserPerm.obrasPermitidas?.includes(o.id)) return true;
    return false;
  });

  // Keep activeObraId synced with allowedObras list
  useEffect(() => {
    if (allowedObras.length > 0) {
      if (!activeObraId || !allowedObras.some((o) => o.id === activeObraId)) {
        setActiveObraId(allowedObras[0].id);
      }
    } else {
      setActiveObraId(null);
    }
  }, [allowedObras.map((o) => o.id).join(',')]);

  const activeObra = allowedObras.find((o) => o.id === activeObraId) || (allowedObras.length > 0 ? allowedObras[0] : null);
  const activeCpu = cpus.find((c) => c.id === activeCpuId) || (cpus.length > 0 ? cpus[0] : null);

  // Compute Total Cost for Active Obra
  let totalCustoObra = 0;
  cpus.forEach((cpu) => {
    const qtd = Number(cpu.quantidade_prevista) || 1;
    let custoUnt = 0;
    if (cpu.insumos) {
      cpu.insumos.forEach((ins) => {
        custoUnt += (Number(ins.coef) || 0) * (Number(ins.pr_unit) || 0);
      });
    }
    totalCustoObra += custoUnt * qtd;
  });

  // Handlers
  const handleLoginSuccess = async (email: string, displayName: string) => {
    setUserEmail(email);
    setUserDisplayName(displayName);
    await registerUserRequest(email, displayName);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserEmail(null);
  };

  const handleSelectObra = (obraId: string) => {
    setActiveObraId(obraId);
    setActiveCpuId(null);
  };

  const handleSelectCpu = (cpuId: string) => {
    setActiveCpuId(cpuId);
    setActiveTab('dashboard');
  };

  const handleCreateObra = async (obraData: Omit<Obra, 'id'>) => {
    const newId = await createObra(obraData);
    setActiveObraId(newId);
  };

  const handleCreateCPU = async (cpuData: Omit<CPU, 'id'>) => {
    const newId = await createCPU(cpuData);
    setActiveCpuId(newId);
    setActiveTab('dashboard');
  };

  const handleRegisterPendingCPU = (updatedCpu: CPU) => {
    const updatedCache = savePendingCPUToCache(updatedCpu);
    setPendingChanges(Object.keys(updatedCache).length > 0);
    setCpus((prevList) =>
      prevList.map((c) => (c.id === updatedCpu.id ? updatedCpu : c))
    );
  };

  const handleDeleteCPU = async (cpuId: string) => {
    await deleteCPU(cpuId);
    const updatedCache = removePendingCPUFromCache(cpuId);
    setPendingChanges(Object.keys(updatedCache).length > 0);
    if (activeCpuId === cpuId) {
      const remaining = cpus.filter((c) => c.id !== cpuId);
      setActiveCpuId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSaveCpu = async (updatedCpu: CPU) => {
    setIsSaving(true);
    try {
      await saveCPU(updatedCpu);
      const updatedCache = removePendingCPUFromCache(updatedCpu.id);
      setPendingChanges(Object.keys(updatedCache).length > 0);
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllPendingCpus = async () => {
    setIsSaving(true);
    try {
      const cache = getPendingCPUs();
      const pendingList = Object.values(cache);
      if (pendingList.length > 0) {
        for (const cpuToSave of pendingList) {
          await saveCPU(cpuToSave);
        }
        clearAllPendingCPUsFromCache();
        setPendingChanges(false);
      } else if (activeCpu) {
        await saveCPU(activeCpu);
        removePendingCPUFromCache(activeCpu.id);
        setPendingChanges(false);
      }

      // Sincroniza o estado completo da obra (cronograma, links, PQ e parâmetros) no Firestore
      if (activeObra) {
        await saveObra({
          ...activeObra,
          scheduleTasks,
          allocationLinks,
          pqItems,
          recursosConfig,
          parametrosCaixa,
          versoesCronograma
        });
      }
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInsumoToActiveCpu = (newInsumos: Insumo | Insumo[]) => {
    if (!activeCpu) return;
    const itemsToAdd = Array.isArray(newInsumos) ? newInsumos : [newInsumos];
    const updatedInsumos = ordenarInsumosCPU([...(activeCpu.insumos || []), ...itemsToAdd]);
    const updatedCpu: CPU = {
      ...activeCpu,
      insumos: updatedInsumos
    };
    handleRegisterPendingCPU(updatedCpu);
  };

  const handleConfirmDeleteObra = async (obraId: string) => {
    await deleteObra(obraId);
    setObraToDelete(null);
    const remaining = allowedObras.filter((o) => o.id !== obraId);
    if (activeObraId === obraId) {
      setActiveObraId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* If not logged in or not approved */}
      {!userEmail || (!isApproved && normalizedEmail !== ADMIN_EMAIL) ? (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          userPermission={currentUserPerm}
          pendingUserEmail={userEmail}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <Header
            activeObra={activeObra}
            totalCustoObra={totalCustoObra}
            userEmail={userEmail}
            userPermission={currentUserPerm}
            pendingChanges={pendingChanges}
            isSaving={isSaving}
            onSavePendingChanges={handleSaveAllPendingCpus}
            onOpenGuiaUsuario={() => setIsGuiaUsuarioOpen(true)}
            onLogout={handleLogout}
            onToggleSidebarMobile={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
          />

          {/* Body Container */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar */}
            <Sidebar
              obras={allowedObras}
              activeObra={activeObra}
              cpus={cpus}
              activeCpu={activeCpu}
              activeTab={activeTab}
              userEmail={userEmail}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              isOpenMobile={isOpenMobileSidebar}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onSelectObra={handleSelectObra}
              onSelectCpu={handleSelectCpu}
              onSelectTab={setActiveTab}
              onOpenModalNovaObra={() => setIsModalNovaObraOpen(true)}
              onOpenModalNovaCPU={() => setIsModalNovaCpuOpen(true)}
              onOpenModalImportarBD={() => setIsModalImportarBDOpen(true)}
              onCloseMobile={() => setIsOpenMobileSidebar(false)}
              onOpenModalExcluirObra={(obra) => setObraToDelete(obra)}
            />

            {/* Mobile Overlay */}
            {isOpenMobileSidebar && (
              <div
                onClick={() => setIsOpenMobileSidebar(false)}
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
              />
            )}

            {/* Main Tab View */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100">
              {!activeObra && activeTab !== 'acessos' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center max-w-lg mx-auto">
                  <Building className="w-12 h-12 text-slate-400 mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Nenhuma Obra Liberada para Seu Perfil
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Você está autenticado no sistema, mas o Administrador ainda não liberou o seu acesso a nenhuma obra específica da SEEL Engenharia.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-xl font-bold">
                    Solicite ao Administrador (fgama@seel.com.br) para vincular seu e-mail às obras desejadas.
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'resumo' && (
                    <AbaResumo
                      activeObra={activeObra}
                      cpus={cpus}
                      isSuperAdmin={isSuperAdmin}
                      onOpenModalExcluirObra={(obra) => setObraToDelete(obra)}
                      onSelectTab={setActiveTab}
                      onRefresh={() => {
                        // Triggers re-render
                        setActiveObraId(activeObraId);
                      }}
                    />
                  )}

                  {activeTab === 'tabela' && (
                    <AbaTabelaCPUs
                      cpus={cpus}
                      activeObra={activeObra}
                      onSelectCpu={handleSelectCpu}
                      onDeleteCpu={handleDeleteCPU}
                      onSaveCpu={handleSaveCpu}
                      onOpenImportModal={() => setIsModalImportarBDOpen(true)}
                    />
                  )}

                  {activeTab === 'matriz-pq' && (
                    <AbaMatrizPQ
                      activeObra={activeObra}
                      cpus={cpus}
                      tasks={scheduleTasks}
                      onUpdateTasks={handleUpdateScheduleTasks}
                      pqItems={pqItems}
                      onUpdatePqItems={handleUpdatePqItems}
                      allocationLinks={allocationLinks}
                      onUpdateAllocationLinks={handleUpdateAllocationLinks}
                      recursosConfig={recursosConfig}
                      onUpdateRecursosConfig={handleUpdateRecursosConfig}
                    />
                  )}

                  {activeTab === 'cronograma' && (
                    <AbaCronogramaExecutivo
                      activeObra={activeObra}
                      tasks={scheduleTasks}
                      onUpdateTasks={handleUpdateScheduleTasks}
                      allocationLinks={allocationLinks}
                      onUpdateAllocationLinks={handleUpdateAllocationLinks}
                      pqItems={pqItems}
                      recursosConfig={recursosConfig}
                      versoes={versoesCronograma}
                      onUpdateVersoes={handleUpdateVersoesCronograma}
                    />
                  )}

                  {activeTab === 'relatorios' && (
                    <AbaRelatoriosGerenciais
                      activeObra={activeObra}
                      cpus={cpus}
                      onSelectTab={setActiveTab}
                      scheduleTasks={scheduleTasks}
                      allocationLinks={allocationLinks}
                      pqItems={pqItems}
                      recursosConfig={recursosConfig}
                      parametrosCaixa={parametrosCaixa}
                      onUpdateParametrosCaixa={handleUpdateParametrosCaixa}
                    />
                  )}

                  {activeTab === 'indiretos' && (
                    <AbaCustosIndiretos
                      activeObra={activeObra}
                      cpus={cpus}
                      onSelectTab={setActiveTab}
                      onSelectCpu={handleSelectCpu}
                    />
                  )}

                  {activeTab === 'abc' && (
                    <AbaABCInsumos
                      cpus={cpus}
                      activeObra={activeObra}
                      onOpenTraceability={(insumoId, insumoNome) => {
                        setTraceabilityInsumo({ id: insumoId, nome: insumoNome });
                      }}
                    />
                  )}

                  {activeTab === 'insumos' && (
                    <AbaInsumosCadastrados
                      bancoInsumos={bancoInsumos}
                      activeObra={activeObra}
                      userPermission={currentUserPerm}
                      userEmail={userEmail}
                    />
                  )}

                  {activeTab === 'acessos' && isSuperAdmin && (
                    <AbaGestaoAcessos
                      userPermissions={userPermissions}
                      obras={obras}
                      currentUserEmail={userEmail}
                    />
                  )}

                  {activeTab === 'firestore' && isSuperAdmin && (
                    <AbaPainelFirestore userEmail={userEmail || ''} />
                  )}

                  {activeTab === 'dashboard' && activeCpu ? (
                    <AbaDashboardCPU
                      cpu={activeCpu}
                      activeObra={activeObra}
                      userEmail={userEmail}
                      onSaveCpu={handleSaveCpu}
                      onDeleteCpu={handleDeleteCPU}
                      onOpenModalInsumo={() => setIsModalInsumoOpen(true)}
                      onRegisterPendingChange={handleRegisterPendingCPU}
                    />
                  ) : activeTab === 'dashboard' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                      <h3 className="text-xl font-bold text-slate-600 mb-1">
                        Selecione uma CPU no menu lateral
                      </h3>
                      <p className="text-xs">
                        Para visualizar a memória de cálculo unitária e editar parâmetros de produtividade.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalNovaObra
        isOpen={isModalNovaObraOpen}
        onClose={() => setIsModalNovaObraOpen(false)}
        onCreateObra={handleCreateObra}
      />

      <ModalNovaCPU
        isOpen={isModalNovaCpuOpen}
        activeObra={activeObra}
        onClose={() => setIsModalNovaCpuOpen(false)}
        onCreateCPU={handleCreateCPU}
      />

      <ModalInsumo
        isOpen={isModalInsumoOpen}
        bancoInsumos={bancoInsumos}
        activeObra={activeObra}
        onClose={() => setIsModalInsumoOpen(false)}
        onAddInsumoToCpu={handleAddInsumoToActiveCpu}
        onCadastrarNovoInsumo={(novoBase) =>
          createInsumoBase({
            ...novoBase,
            obraId: activeObra?.id || 'obra-966'
          })
        }
        onOpenImportModal={() => setIsModalImportarInsumosOpen(true)}
      />

      <ModalImportarInsumos
        isOpen={isModalImportarInsumosOpen}
        activeObra={activeObra}
        onClose={() => setIsModalImportarInsumosOpen(false)}
      />

      <ModalComposicoes
        isOpen={!!traceabilityInsumo}
        insumoId={traceabilityInsumo?.id || ''}
        insumoNome={traceabilityInsumo?.nome || ''}
        cpus={cpus}
        onClose={() => setTraceabilityInsumo(null)}
        onNavigateToCpu={handleSelectCpu}
      />

      <ModalGuiaUsuario
        isOpen={isGuiaUsuarioOpen}
        onClose={() => setIsGuiaUsuarioOpen(false)}
        isSuperAdmin={isSuperAdmin}
      />

      <ModalExcluirObra
        obra={obraToDelete}
        isOpen={!!obraToDelete}
        onClose={() => setObraToDelete(null)}
        onConfirmDelete={handleConfirmDeleteObra}
      />

      <ModalImportarBD
        isOpen={isModalImportarBDOpen}
        obra={activeObra}
        onClose={() => setIsModalImportarBDOpen(false)}
        onImportSuccess={() => {
          if (activeObraId) {
            setActiveObraId(activeObraId);
          }
        }}
      />
    </div>
  );
}
