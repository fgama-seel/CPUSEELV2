import { CPU } from '../types';

const STORAGE_KEY = 'seel_pending_cpus_cache';

/**
 * Retrieves all CPUs that have unsaved changes stored in the browser's localStorage.
 */
export function getPendingCPUs(): Record<string, CPU> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CPU>;
  } catch (err) {
    console.error('Erro ao ler cache de CPUs do localStorage:', err);
    return {};
  }
}

/**
 * Saves or updates a modified CPU in the browser's localStorage cache without generating Firebase traffic.
 */
export function savePendingCPUToCache(cpu: CPU): Record<string, CPU> {
  try {
    const current = getPendingCPUs();
    current[cpu.id] = cpu;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch (err) {
    console.error('Erro ao salvar CPU no localStorage:', err);
    return getPendingCPUs();
  }
}

/**
 * Removes a specific CPU from the localStorage cache after it has been successfully saved to Firestore.
 */
export function removePendingCPUFromCache(cpuId: string): Record<string, CPU> {
  try {
    const current = getPendingCPUs();
    delete current[cpuId];
    if (Object.keys(current).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    return current;
  } catch (err) {
    console.error('Erro ao remover CPU do cache do localStorage:', err);
    return getPendingCPUs();
  }
}

/**
 * Clears all pending CPU modifications from localStorage.
 */
export function clearAllPendingCPUsFromCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Erro ao limpar cache de CPUs do localStorage:', err);
  }
}
