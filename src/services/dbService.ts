import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Obra, CPU, InsumoBase, UserPermission, Insumo, Comentario } from '../types';
import { getPendingCPUs, savePendingCPUToCache } from '../lib/pendingCache';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Subscribe to all Obras
export function subscribeObras(callback: (obras: Obra[]) => void) {
  const colRef = collection(db, 'obras');
  return onSnapshot(colRef, (snapshot) => {
    const list: Obra[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Obra);
    });
    // Sort by code / name
    list.sort((a, b) => a.codigo.localeCompare(b.codigo));
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'obras');
  });
}

// Subscribe to CPUs for a specific Obra or all CPUs
export function subscribeCPUs(obraId: string | null, callback: (cpus: CPU[]) => void) {
  const colRef = collection(db, 'cpus');
  return onSnapshot(colRef, (snapshot) => {
    let list: CPU[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<CPU, 'id'>;
      if (!obraId || data.obraId === obraId) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    // Sort by code
    list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'cpus');
  });
}

// Subscribe to Banco de Insumos for a specific Obra
export function subscribeBancoInsumos(obraId: string | null, callback: (insumos: InsumoBase[]) => void) {
  const colRef = collection(db, 'bancoInsumos');
  return onSnapshot(colRef, (snapshot) => {
    const list: InsumoBase[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as InsumoBase;
      const itemObraId = data.obraId;
      // Filter by obraId: match explicitly, or default legacy insumos to 'obra-966'
      if (!obraId || itemObraId === obraId || (!itemObraId && obraId === 'obra-966')) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    list.sort((a, b) => (a.descricao || '').localeCompare(b.descricao || ''));
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'bancoInsumos');
  });
}

// Subscribe to User Permissions (Admin)
export function subscribeUserPermissions(callback: (perms: UserPermission[]) => void) {
  const colRef = collection(db, 'userPermissions');
  return onSnapshot(colRef, (snapshot) => {
    const list: UserPermission[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as UserPermission);
    });
    list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'userPermissions');
  });
}

// Save or Update CPU in Firestore
export async function saveCPU(cpu: CPU): Promise<void> {
  const path = `cpus/${cpu.id}`;
  try {
    const docRef = doc(db, 'cpus', cpu.id);
    const dataToSave = {
      ...cpu,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Create a new CPU
export async function createCPU(cpuData: Omit<CPU, 'id'>): Promise<string> {
  const sanitizedCode = cpuData.code.replace(/[^a-zA-Z0-9_-]/g, '') || `${Date.now()}`;
  const customId = `cpu-${cpuData.obraId}-${sanitizedCode}`;
  const path = `cpus/${customId}`;
  try {
    const colRef = collection(db, 'cpus');
    const docRef = doc(colRef, customId);
    await setDoc(docRef, {
      ...cpuData,
      id: customId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return customId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

// Delete CPU
export async function deleteCPU(cpuId: string): Promise<void> {
  const path = `cpus/${cpuId}`;
  try {
    await deleteDoc(doc(db, 'cpus', cpuId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Create or Update Obra
export async function saveObra(obra: Obra): Promise<void> {
  const path = `obras/${obra.id}`;
  try {
    const docRef = doc(db, 'obras', obra.id);
    await setDoc(docRef, obra, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Create new Obra
export async function createObra(obraData: Omit<Obra, 'id'>): Promise<string> {
  const customId = `obra-${obraData.codigo.trim() || Date.now()}`;
  const path = `obras/${customId}`;
  try {
    const docRef = doc(db, 'obras', customId);
    const newObra: Obra = {
      ...obraData,
      id: customId,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newObra);
    return customId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

// Add Insumo to BancoInsumos
export async function createInsumoBase(insumo: Omit<InsumoBase, 'id'>): Promise<InsumoBase> {
  const customId = `INS_${Date.now()}`;
  const path = `bancoInsumos/${customId}`;
  try {
    const newInsumo: InsumoBase = {
      ...insumo,
      id: customId,
      id_insumo: insumo.id_insumo || customId
    };
    await setDoc(doc(db, 'bancoInsumos', customId), newInsumo);
    return newInsumo;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

// Update Insumo in BancoInsumos and cascade changes to all CPUs
export async function saveInsumoBase(insumo: InsumoBase): Promise<void> {
  const path = `bancoInsumos/${insumo.id}`;
  try {
    const docRef = doc(db, 'bancoInsumos', insumo.id);
    await setDoc(docRef, insumo, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Updates an Insumo in BancoInsumos and cascades all changes (price, description, unit, type)
 * to all CPUs across Firestore that reference this insumo.
 */
export async function updateInsumoCascadeToCPUs(
  insumo: InsumoBase,
  previousInsumo?: Partial<InsumoBase>
): Promise<number> {
  // 1. Save insumo in BancoInsumos
  await saveInsumoBase(insumo);

  // 2. Query all CPUs from Firestore and update matching insumos
  let updatedCpusCount = 0;
  try {
    const cpusSnap = await getDocs(collection(db, 'cpus'));
    const targetCodes = new Set<string>();
    if (insumo.id) targetCodes.add(insumo.id.toLowerCase());
    if (insumo.id_insumo) targetCodes.add(insumo.id_insumo.toLowerCase());
    if (previousInsumo?.id) targetCodes.add(previousInsumo.id.toLowerCase());
    if (previousInsumo?.id_insumo) targetCodes.add(previousInsumo.id_insumo.toLowerCase());

    const prevDescNorm = previousInsumo?.descricao?.trim().toLowerCase();

    for (const docSnap of cpusSnap.docs) {
      const cpu = { id: docSnap.id, ...docSnap.data() } as CPU;
      if (insumo.obraId && cpu.obraId && cpu.obraId !== insumo.obraId) continue;
      if (!cpu.insumos || !Array.isArray(cpu.insumos)) continue;

      let cpuModified = false;
      const updatedInsumos = cpu.insumos.map((item) => {
        const itemCode = (item.id_insumo || '').toLowerCase();
        const itemDescNorm = (item.descricao || '').trim().toLowerCase();

        const isMatchByCode = itemCode && targetCodes.has(itemCode);
        const isMatchByDesc = prevDescNorm && itemDescNorm === prevDescNorm;

        if (isMatchByCode || isMatchByDesc) {
          cpuModified = true;
          return {
            ...item,
            id_insumo: insumo.id_insumo || insumo.id,
            descricao: insumo.descricao,
            unid: insumo.unid,
            pr_unit: insumo.pr_unit,
            tipo: insumo.tipo
          };
        }
        return item;
      });

      if (cpuModified) {
        updatedCpusCount++;
        const updatedCpu: CPU = {
          ...cpu,
          insumos: updatedInsumos,
          updatedAt: new Date().toISOString()
        };
        await saveCPU(updatedCpu);

        // Keep local cache consistent if present
        const cached = getPendingCPUs();
        if (cached[cpu.id]) {
          savePendingCPUToCache(updatedCpu);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao cascatear alterações do insumo nas CPUs:', err);
  }

  return updatedCpusCount;
}

// Delete Insumo from BancoInsumos
export async function deleteInsumoBase(id: string): Promise<void> {
  const path = `bancoInsumos/${id}`;
  try {
    await deleteDoc(doc(db, 'bancoInsumos', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// Update User Permission
export async function updateUserPermission(perm: UserPermission): Promise<void> {
  const docId = perm.email.toLowerCase().trim();
  const path = `userPermissions/${docId}`;
  try {
    const docRef = doc(db, 'userPermissions', docId);
    await setDoc(docRef, { ...perm, id: docId }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Register pending user request
export async function registerUserRequest(email: string, displayName: string): Promise<UserPermission> {
  const normalizedEmail = email.toLowerCase().trim();
  const path = `userPermissions/${normalizedEmail}`;
  try {
    const docRef = doc(db, 'userPermissions', normalizedEmail);
    const isSuperAdmin = normalizedEmail === 'fgama@seel.com.br';
    
    const perm: UserPermission = {
      id: normalizedEmail,
      email: normalizedEmail,
      nome: displayName || normalizedEmail.split('@')[0],
      status: isSuperAdmin ? 'APPROVED' : 'PENDING',
      role: isSuperAdmin ? 'ADMIN' : 'VIEWER',
      obrasPermitidas: isSuperAdmin ? ['*'] : [],
      solicitadoEm: new Date().toISOString(),
      aprovadoPor: isSuperAdmin ? 'SYSTEM' : undefined
    };

    await setDoc(docRef, perm, { merge: true });
    return perm;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

