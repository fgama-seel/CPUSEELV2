import React, { useState, useEffect } from 'react';
import {
  Database,
  Eye,
  Edit3,
  Trash2,
  Radio,
  RefreshCw,
  Download,
  AlertTriangle,
  Server,
  Activity,
  Filter,
  CheckCircle2,
  Play
} from 'lucide-react';
import { firestoreTracker, FirestoreStats, FirestoreMetricLog } from '../services/firestoreTracker';

interface AbaPainelFirestoreProps {
  userEmail: string;
}

export const AbaPainelFirestore: React.FC<AbaPainelFirestoreProps> = ({ userEmail }) => {
  const [stats, setStats] = useState<FirestoreStats>(firestoreTracker.getStats());
  const [logFilter, setLogFilter] = useState<'ALL' | 'READ' | 'WRITE' | 'DELETE' | 'SNAPSHOT'>('ALL');
  const [collectionFilter, setCollectionFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = firestoreTracker.subscribe((newStats) => {
      setStats(newStats);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReset = () => {
    if (window.confirm('Deseja realmente zerar o contador de requisições do painel?')) {
      firestoreTracker.resetStats();
      showToast('Métricas do Firestore zeradas com sucesso!');
    }
  };

  const handleSimulateRequest = () => {
    firestoreTracker.logOperation(
      'READ',
      'cpus',
      1,
      'Teste manual de requisição disparado pelo Super Admin',
      userEmail
    );
    showToast('Requisição de teste registrada com sucesso!');
  };

  const handleExportCSV = () => {
    if (stats.logs.length === 0) {
      alert('Nenhum log gravado para exportar.');
      return;
    }

    const headers = ['ID', 'Horário', 'Tipo', 'Coleção', 'Quantidade', 'Detalhes', 'Usuário'];
    const rows = stats.logs.map((l) => [
      l.id,
      l.timestamp,
      l.type,
      l.collection,
      l.count,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.userEmail || userEmail
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `firestore_requisicoes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quotas Limits (Firestore Free Tier)
  const FREE_READS_LIMIT = 50000;
  const FREE_WRITES_LIMIT = 20000;
  const FREE_DELETES_LIMIT = 20000;

  const readsPercent = Math.min(100, (stats.totalReads / FREE_READS_LIMIT) * 100);
  const writesPercent = Math.min(100, (stats.totalWrites / FREE_WRITES_LIMIT) * 100);
  const deletesPercent = Math.min(100, (stats.totalDeletes / FREE_DELETES_LIMIT) * 100);

  // Filter logs
  const filteredLogs = stats.logs.filter((log) => {
    if (logFilter !== 'ALL' && log.type !== logFilter) return false;
    if (collectionFilter !== 'ALL' && log.collection !== collectionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDetails = (log.details || '').toLowerCase().includes(term);
      const matchCol = log.collection.toLowerCase().includes(term);
      const matchType = log.type.toLowerCase().includes(term);
      if (!matchDetails && !matchCol && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER DO PAINEL */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Server className="w-3 h-3" />
              <span>Acesso Restrito: Super Admin</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Monitoramento Ativo</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            <span>Painel de Controle de Requisições Firestore</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Telemetria e controle em tempo real de leituras, escritas e sincronizações do banco de dados do projeto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSimulateRequest}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg border border-blue-400/40 flex items-center gap-1.5 shadow-sm transition"
            title="Registrar requisição de teste"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Testar Requisição</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            title="Exportar logs para CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleReset}
            className="bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-bold px-3 py-2 rounded-lg border border-red-800/60 flex items-center gap-1.5 transition"
            title="Zerar dados de telemetria"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-400" />
            <span>Zerar Contadores</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leituras */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total de Leituras (Reads)
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {stats.totalReads.toLocaleString('pt-BR')}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
              <span>Cota Diária Grátis</span>
              <span>{readsPercent.toFixed(1)}% ({FREE_READS_LIMIT.toLocaleString('pt-BR')})</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${readsPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Escritas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total de Escritas (Writes)
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {stats.totalWrites.toLocaleString('pt-BR')}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Edit3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
              <span>Cota Diária Grátis</span>
              <span>{writesPercent.toFixed(1)}% ({FREE_WRITES_LIMIT.toLocaleString('pt-BR')})</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${writesPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Exclusões */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total de Exclusões (Deletes)
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {stats.totalDeletes.toLocaleString('pt-BR')}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
              <span>Cota Diária Grátis</span>
              <span>{deletesPercent.toFixed(1)}% ({FREE_DELETES_LIMIT.toLocaleString('pt-BR')})</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${deletesPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Listeners Ativos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Listenning em Tempo Real
              </span>
              <h3 className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5 flex items-center gap-1.5">
                <span>{stats.activeListeners}</span>
                <span className="text-xs font-normal text-slate-400">canais</span>
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-medium">
            Conexões websockets ativas para snapshot instantâneo.
          </p>
        </div>
      </div>

      {/* DETALHAMENTO POR COLEÇÃO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Detalhamento das Operações por Coleção Firestore</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Sessão iniciada em: {new Date(stats.sessionStartTime).toLocaleTimeString('pt-BR')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <th className="p-3">Coleção Firestore</th>
                <th className="p-3 text-center">Leituras (Reads)</th>
                <th className="p-3 text-center">Escritas (Writes)</th>
                <th className="p-3 text-center">Exclusões (Deletes)</th>
                <th className="p-3 text-right">Total Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[
                { key: 'cpus', name: 'cpus (Composições de Preço Unidades)' },
                { key: 'obras', name: 'obras (Cadastro de Contratos)' },
                { key: 'bancoInsumos', name: 'bancoInsumos (Insumos do Projeto)' },
                { key: 'userPermissions', name: 'userPermissions (Acessos e Permissões)' }
              ].map((item) => {
                const r = stats.readsByCollection[item.key] || 0;
                const w = stats.writesByCollection[item.key] || 0;
                const d = stats.deletesByCollection[item.key] || 0;
                const totalCol = r + w + d;

                return (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <code className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {item.key}
                      </code>
                      <span className="text-slate-500 text-[11px]">({item.name.split(' ')[1]})</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-blue-700">{r}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">{w}</td>
                    <td className="p-3 text-center font-mono font-bold text-rose-700">{d}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {totalCol}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRO DE LOGS EM TEMPO REAL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" />
              <span>Log de Atividades e Disparos de Requisições</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Exibindo os últimos 100 eventos registrados no cliente durante a sessão.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Filtrar por detalhe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400"
            />

            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="READ">Leituras (READ)</option>
              <option value="WRITE">Escritas (WRITE)</option>
              <option value="DELETE">Exclusões (DELETE)</option>
              <option value="SNAPSHOT">Sincronizações (SNAPSHOT)</option>
            </select>

            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas as Coleções</option>
              <option value="cpus">cpus</option>
              <option value="obras">obras</option>
              <option value="bancoInsumos">bancoInsumos</option>
              <option value="userPermissions">userPermissions</option>
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 custom-scroll font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">
              Nenhum evento registrado com os filtros selecionados.
            </div>
          ) : (
            filteredLogs.map((log) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (log.type === 'READ') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              if (log.type === 'WRITE') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (log.type === 'DELETE') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              if (log.type === 'SNAPSHOT') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

              return (
                <div key={log.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-[10px] text-slate-400 shrink-0 font-sans">{log.timestamp}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                      {log.type}
                    </span>
                    <code className="text-[11px] font-bold text-slate-800 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.collection}
                    </code>
                    <span className="text-slate-600 font-sans text-xs truncate">
                      {log.details || 'Operação realizada com sucesso'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold font-sans">
                      {log.count} {log.count === 1 ? 'doc' : 'docs'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AVISO E INFORMAÇÃO DE REGRAS FIRESTORE */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold block">Informaçao sobre Cotas e Otimizações no Firestore:</strong>
          <p className="text-amber-800 leading-relaxed">
            O Firebase Firestore fornece gratuitamente até <strong>50.000 leituras</strong>, <strong>20.000 escritas</strong> e <strong>20.000 exclusões diárias</strong>. O Sistema CPU SEEL utiliza escuta em tempo real (`onSnapshot`) e cache otimizado para reaproveitar os dados locais e evitar leituras redundantes do banco de dados.
          </p>
        </div>
      </div>
    </div>
  );
};
