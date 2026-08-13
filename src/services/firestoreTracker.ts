export interface FirestoreMetricLog {
  id: string;
  timestamp: string;
  type: 'READ' | 'WRITE' | 'DELETE' | 'SNAPSHOT';
  collection: string;
  count: number;
  details?: string;
  userEmail?: string;
}

export interface FirestoreStats {
  totalReads: number;
  totalWrites: number;
  totalDeletes: number;
  activeListeners: number;
  sessionStartTime: string;
  readsByCollection: Record<string, number>;
  writesByCollection: Record<string, number>;
  deletesByCollection: Record<string, number>;
  logs: FirestoreMetricLog[];
}

const STORAGE_KEY = 'seel_firestore_metrics_v1';

class FirestoreTrackerService {
  private stats: FirestoreStats = {
    totalReads: 0,
    totalWrites: 0,
    totalDeletes: 0,
    activeListeners: 0,
    sessionStartTime: new Date().toISOString(),
    readsByCollection: {
      obras: 0,
      cpus: 0,
      bancoInsumos: 0,
      userPermissions: 0,
      metrics: 0
    },
    writesByCollection: {
      obras: 0,
      cpus: 0,
      bancoInsumos: 0,
      userPermissions: 0,
      metrics: 0
    },
    deletesByCollection: {
      obras: 0,
      cpus: 0,
      bancoInsumos: 0,
      userPermissions: 0,
      metrics: 0
    },
    logs: []
  };

  private listeners: Set<(stats: FirestoreStats) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.stats = {
          ...this.stats,
          ...parsed,
          logs: parsed.logs || []
        };
      }
    } catch (e) {
      console.warn('Unable to load firestore stats from storage', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Unable to save firestore stats to storage', e);
    }
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((fn) => fn({ ...this.stats }));
  }

  public subscribe(fn: (stats: FirestoreStats) => void): () => void {
    this.listeners.add(fn);
    fn({ ...this.stats });
    return () => {
      this.listeners.delete(fn);
    };
  }

  public getStats(): FirestoreStats {
    return { ...this.stats };
  }

  public logOperation(
    type: 'READ' | 'WRITE' | 'DELETE' | 'SNAPSHOT',
    collectionName: string,
    count: number = 1,
    details?: string,
    userEmail?: string
  ) {
    if (type === 'READ' || type === 'SNAPSHOT') {
      this.stats.totalReads += count;
      this.stats.readsByCollection[collectionName] =
        (this.stats.readsByCollection[collectionName] || 0) + count;
    } else if (type === 'WRITE') {
      this.stats.totalWrites += count;
      this.stats.writesByCollection[collectionName] =
        (this.stats.writesByCollection[collectionName] || 0) + count;
    } else if (type === 'DELETE') {
      this.stats.totalDeletes += count;
      this.stats.deletesByCollection[collectionName] =
        (this.stats.deletesByCollection[collectionName] || 0) + count;
    }

    const newLog: FirestoreMetricLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      type,
      collection: collectionName,
      count,
      details,
      userEmail
    };

    // Keep last 100 logs
    this.stats.logs = [newLog, ...this.stats.logs.slice(0, 99)];
    this.notify();
  }

  public updateActiveListeners(delta: number) {
    this.stats.activeListeners = Math.max(0, this.stats.activeListeners + delta);
    this.notify();
  }

  public resetStats() {
    this.stats = {
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      activeListeners: 0,
      sessionStartTime: new Date().toISOString(),
      readsByCollection: {
        obras: 0,
        cpus: 0,
        bancoInsumos: 0,
        userPermissions: 0,
        metrics: 0
      },
      writesByCollection: {
        obras: 0,
        cpus: 0,
        bancoInsumos: 0,
        userPermissions: 0,
        metrics: 0
      },
      deletesByCollection: {
        obras: 0,
        cpus: 0,
        bancoInsumos: 0,
        userPermissions: 0,
        metrics: 0
      },
      logs: []
    };
    this.notify();
  }
}

export const firestoreTracker = new FirestoreTrackerService();
