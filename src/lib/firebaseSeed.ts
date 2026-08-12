import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Obra, InsumoBase, UserPermission } from '../types';
import { handleFirestoreError, OperationType } from '../services/dbService';

export const ADMIN_EMAIL = 'fgama@seel.com.br';

export async function seedInitialDataIfNeeded() {
  try {
    // Delete any existing sample CPUs from Firestore if present
    const sampleCpuIds = ['cpu-18010102', 'cpu-05020101', 'cpu-03010105', 'cpu-09010202'];
    for (const sampleId of sampleCpuIds) {
      try {
        await deleteDoc(doc(db, 'cpus', sampleId));
      } catch {
        // ignore if not found
      }
    }

    const obrasSnap = await getDocs(collection(db, 'obras'));
    if (!obrasSnap.empty) {
      // Data already exists, check admin permission
      await ensureAdminExists();
      return;
    }

    console.log('Seeding initial Firebase data...');
    const batch = writeBatch(db);

    // 1. Seed Obra 966
    const obra966Ref = doc(db, 'obras', 'obra-966');
    const obra966: Obra = {
      id: 'obra-966',
      codigo: '966',
      nome: 'Obra 966 - TRANSPORTE ETA',
      cliente: 'SEEL Engenharia',
      custoIndiretoAtual: 1000000.0,
      faturamentoDiretoAtual: 5000000.0,
      orcamentoOriginal: {
        vendaTotal: 50400000.0,
        fatDireto: 2449175.32,
        vendaSemFat: 47950824.68,
        custoDireto: 21227185.06,
        custoIndireto: 13744327.94,
        custoTotal: 34971513.0,
        pis: 1438524.74,
        cofins: 311680.36,
        iss: 1438524.74,
        vendaLiquida: 44762094.84,
        resultado: 9790581.84,
        margem: 21.87
      },
      createdAt: new Date().toISOString()
    };
    batch.set(obra966Ref, obra966);

    // 2. Seed Obra 967
    const obra967Ref = doc(db, 'obras', 'obra-967');
    const obra967: Obra = {
      id: 'obra-967',
      codigo: '967',
      nome: 'Obra 967 - PONTE RIO GRANDE',
      cliente: 'DER / SEEL',
      custoIndiretoAtual: 850000.0,
      faturamentoDiretoAtual: 3200000.0,
      orcamentoOriginal: {
        vendaTotal: 32000000.0,
        fatDireto: 1800000.0,
        vendaSemFat: 30200000.0,
        custoDireto: 14500000.0,
        custoIndireto: 8200000.0,
        custoTotal: 22700000.0,
        pis: 912000.0,
        cofins: 198000.0,
        iss: 912000.0,
        vendaLiquida: 28416000.0,
        resultado: 5716000.0,
        margem: 20.11
      },
      createdAt: new Date().toISOString()
    };
    batch.set(obra967Ref, obra967);

    // 3. Seed Insumos Base
    const insumosBaseList: InsumoBase[] = [
      {
        id: 'INS_E1',
        id_insumo: 'E1',
        tipo: 'Equipamento',
        descricao: 'Caminhão Munck 12t',
        unid: 'h',
        pr_unit: 120.5
      },
      {
        id: 'INS_M1',
        id_insumo: 'M1',
        tipo: 'Mão de Obra',
        descricao: 'Pedreiro de Obra',
        unid: 'h',
        pr_unit: 35.0
      },
      {
        id: 'INS_M2',
        id_insumo: 'M2',
        tipo: 'Mão de Obra',
        descricao: 'Ajudante de Prático',
        unid: 'h',
        pr_unit: 20.0
      },
      {
        id: 'INS_MAT1',
        id_insumo: 'MAT1',
        tipo: 'Material',
        descricao: 'Cimento Portland CP-II (saco 50kg)',
        unid: 'sc',
        pr_unit: 32.5
      },
      {
        id: 'INS_E2',
        id_insumo: 'E2',
        tipo: 'Equipamento',
        descricao: 'Escavadeira Hidráulica 20t',
        unid: 'h',
        pr_unit: 280.0
      },
      {
        id: 'INS_MAT2',
        id_insumo: 'MAT2',
        tipo: 'Material',
        descricao: 'Aço CA-50 D=10.0mm',
        unid: 'kg',
        pr_unit: 12.8
      }
    ];

    insumosBaseList.forEach((ins) => {
      const ref = doc(db, 'bancoInsumos', ins.id);
      batch.set(ref, ins);
    });

    // Commit batch
    await batch.commit();
    await ensureAdminExists();
    console.log('Firebase seeding finished successfully!');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seeding');
  }
}


export async function ensureAdminExists() {
  try {
    const adminDocId = ADMIN_EMAIL.toLowerCase();
    const adminRef = doc(db, 'userPermissions', adminDocId);
    const adminData: UserPermission = {
      id: adminDocId,
      email: ADMIN_EMAIL,
      nome: 'F. Gama (Admin SEEL)',
      status: 'APPROVED',
      role: 'ADMIN',
      obrasPermitidas: ['*'],
      solicitadoEm: new Date().toISOString(),
      aprovadoPor: 'SISTEMA'
    };
    await setDoc(adminRef, adminData, { merge: true });
  } catch (e) {
    console.error('Error ensuring admin doc:', e);
  }
}
