import React, { useState, useEffect } from 'react';
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
  createObra,
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

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AbaResumo } from './components/AbaResumo';
import { AbaTabelaCPUs } from './components/AbaTabelaCPUs';
import { AbaABCInsumos } from './components/AbaABCInsumos';
import { AbaInsumosCadastrados } from './components/AbaInsumosCadastrados';
import { AbaGestaoAcessos } from './components/AbaGestaoAcessos';
import { AbaDashboardCPU } from './components/AbaDashboardCPU';
import { ModalNovaObra } from './components/ModalNovaObra';
import { ModalNovaCPU } from './components/ModalNovaCPU';
import { ModalInsumo } from './components/ModalInsumo';
import { ModalImportarInsumos } from './components/ModalImportarInsumos';
import { ModalComposicoes } from './components/ModalComposicoes';
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
  const [activeTab, setActiveTab] = useState<'resumo' | 'tabela' | 'abc' | 'insumos' | 'acessos' | 'dashboard'>('resumo');

  // Pending Changes State
  const [pendingChanges, setPendingChanges] = useState<boolean>(() => Object.keys(getPendingCPUs()).length > 0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Mobile Sidebar
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  // Modals State
  const [isModalNovaObraOpen, setIsModalNovaObraOpen] = useState<boolean>(false);
  const [isModalNovaCpuOpen, setIsModalNovaCpuOpen] = useState<boolean>(false);
  const [isModalInsumoOpen, setIsModalInsumoOpen] = useState<boolean>(false);
  const [isModalImportarInsumosOpen, setIsModalImportarInsumosOpen] = useState<boolean>(false);

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

    const unsubBanco = subscribeBancoInsumos((list) => {
      setBancoInsumos(list);
    });

    const unsubPerms = subscribeUserPermissions((list) => {
      setUserPermissions(list);
    });

    return () => {
      unsubObras();
      unsubBanco();
      unsubPerms();
    };
  }, []);

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

  // Filter allowed Obras for guest user
  const allowedObras = obras.filter((o) => {
    if (isSuperAdmin || currentUserPerm?.obrasPermitidas.includes('*')) return true;
    if (o.emailsAcesso && o.emailsAcesso.some((e) => e.toLowerCase() === normalizedEmail)) return true;
    return currentUserPerm?.obrasPermitidas.includes(o.id);
  });

  const activeObra = obras.find((o) => o.id === activeObraId) || (allowedObras.length > 0 ? allowedObras[0] : null);
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
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInsumoToActiveCpu = (newInsumo: Insumo) => {
    if (!activeCpu) return;
    const updatedInsumos = [...(activeCpu.insumos || []), newInsumo];
    const updatedCpu: CPU = {
      ...activeCpu,
      insumos: updatedInsumos
    };
    handleRegisterPendingCPU(updatedCpu);
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
              isOpenMobile={isOpenMobileSidebar}
              onSelectObra={handleSelectObra}
              onSelectCpu={handleSelectCpu}
              onSelectTab={setActiveTab}
              onOpenModalNovaObra={() => setIsModalNovaObraOpen(true)}
              onOpenModalNovaCPU={() => setIsModalNovaCpuOpen(true)}
              onCloseMobile={() => setIsOpenMobileSidebar(false)}
            />

            {/* Mobile Overlay */}
            {isOpenMobileSidebar && (
              <div
                onClick={() => setIsOpenMobileSidebar(false)}
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
              />
            )}

            {/* Main Tab View */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
              {activeTab === 'resumo' && (
                <AbaResumo
                  activeObra={activeObra}
                  cpus={cpus}
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

              {activeTab === 'acessos' && isAdmin && (
                <AbaGestaoAcessos
                  userPermissions={userPermissions}
                  obras={obras}
                  currentUserEmail={userEmail}
                />
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
        onClose={() => setIsModalInsumoOpen(false)}
        onAddInsumoToCpu={handleAddInsumoToActiveCpu}
        onCadastrarNovoInsumo={createInsumoBase}
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
    </div>
  );
}
