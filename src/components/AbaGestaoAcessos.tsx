import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Check,
  Building,
  CheckSquare,
  Square,
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { UserPermission, Obra, StatusAcesso, UserRole } from '../types';
import { updateUserPermission } from '../services/dbService';

interface AbaGestaoAcessosProps {
  userPermissions: UserPermission[];
  obras: Obra[];
  currentUserEmail: string;
}

export const AbaGestaoAcessos: React.FC<AbaGestaoAcessosProps> = ({
  userPermissions,
  obras,
  currentUserEmail
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('EDITOR');
  const [newAllObras, setNewAllObras] = useState(false);
  const [selectedObraIds, setSelectedObraIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Local draft state for pending user edits
  const [drafts, setDrafts] = useState<Record<string, UserPermission>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const getEffectivePerm = (perm: UserPermission): UserPermission => {
    return drafts[perm.id] || perm;
  };

  const hasUnsavedChanges = (permId: string): boolean => {
    return Boolean(drafts[permId]);
  };

  const updateDraft = (perm: UserPermission, updates: Partial<UserPermission>) => {
    const current = getEffectivePerm(perm);
    const updated: UserPermission = {
      ...current,
      ...updates,
      aprovadoPor: currentUserEmail
    };
    setDrafts((prev) => ({
      ...prev,
      [perm.id]: updated
    }));
  };

  const handleDraftToggleObra = (perm: UserPermission, obraId: string) => {
    const current = getEffectivePerm(perm);
    let currentObras = [...(current.obrasPermitidas || [])];

    if (currentObras.includes('*')) {
      // Convert '*' into array of all obra IDs except this one
      currentObras = obras.map((o) => o.id).filter((id) => id !== obraId);
    } else if (currentObras.includes(obraId)) {
      currentObras = currentObras.filter((id) => id !== obraId);
    } else {
      currentObras.push(obraId);
    }

    updateDraft(perm, { obrasPermitidas: currentObras });
  };

  const handleDraftSetAllObras = (perm: UserPermission, enableAll: boolean) => {
    updateDraft(perm, { obrasPermitidas: enableAll ? ['*'] : [] });
  };

  const handleDraftStatusChange = (perm: UserPermission, newStatus: StatusAcesso) => {
    updateDraft(perm, { status: newStatus });
  };

  const handleDraftRoleChange = (perm: UserPermission, role: UserRole) => {
    updateDraft(perm, { role });
  };

  const handleCancelUserDraft = (permId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[permId];
      return next;
    });
  };

  const handleSaveUser = async (permId: string) => {
    const draft = drafts[permId];
    if (!draft) return;

    setSavingId(permId);
    try {
      await updateUserPermission(draft);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[permId];
        return next;
      });
      setSuccessMsg(`Permissões salvas com sucesso para ${draft.email}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllDrafts = async () => {
    const permIds = Object.keys(drafts);
    if (permIds.length === 0) return;

    setIsSavingAll(true);
    try {
      for (const id of permIds) {
        await updateUserPermission(drafts[id]);
      }
      setDrafts({});
      setSuccessMsg(`Todas as alterações de acessos (${permIds.length}) foram salvas com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setIsSavingAll(false);
    }
  };

  const toggleSelectedObra = (id: string) => {
    if (selectedObraIds.includes(id)) {
      setSelectedObraIds(selectedObraIds.filter((item) => item !== id));
    } else {
      setSelectedObraIds([...selectedObraIds, id]);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;

    const normalizedEmail = newEmail.toLowerCase().trim();
    const finalObras = newAllObras ? ['*'] : selectedObraIds;

    const perm: UserPermission = {
      id: normalizedEmail,
      email: normalizedEmail,
      nome: newName.trim() || normalizedEmail.split('@')[0],
      status: 'APPROVED',
      role: newRole,
      obrasPermitidas: finalObras,
      solicitadoEm: new Date().toISOString(),
      aprovadoPor: currentUserEmail
    };

    await updateUserPermission(perm);
    setNewEmail('');
    setNewName('');
    setNewRole('EDITOR');
    setNewAllObras(false);
    setSelectedObraIds([]);
    setIsAdding(false);
    setSuccessMsg(`Acesso para ${normalizedEmail} configurado com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const pendingCount = Object.keys(drafts).length;

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-base">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Painel do Super Administrador — Gestão de Acessos & Obras</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Selecione as obras permitidas para cada colaborador e clique em <strong>Salvar Alterações</strong> para aplicar imediatamente as permissões.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllDrafts}
                disabled={isSavingAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-extrabold shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todas ({pendingCount})</span>
              </button>
            )}

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Convidar / Liberar Acesso</span>
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add Guest / Configure User Form */}
        {isAdding && (
          <form
            onSubmit={handleAddGuest}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-600" />
                <span>Convidar e Configurar Permissões de Usuário</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  E-mail do Colaborador *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@seel.com.br"
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nome do Usuário</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nível de Permissão (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="VIEWER">Visualizador (Apenas Leitura)</option>
                  <option value="EDITOR">Editor (Pode alterar composições)</option>
                  <option value="ADMIN">Administrador (Acesso total + Gestão)</option>
                </select>
              </div>
            </div>

            {/* Obras Liberadas Selection */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Obras com Acesso Liberado para este Usuário:</span>
                </label>

                <button
                  type="button"
                  onClick={() => setNewAllObras(!newAllObras)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 ${
                    newAllObras
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {newAllObras ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  <span>Acesso a TODAS as Obras (*)</span>
                </button>
              </div>

              {!newAllObras && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {obras.map((o) => {
                    const isChecked = selectedObraIds.includes(o.id);
                    return (
                      <button
                        type="button"
                        key={o.id}
                        onClick={() => toggleSelectedObra(o.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs font-bold flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block text-[10px] font-mono text-slate-400 uppercase">
                            Código {o.codigo}
                          </span>
                          <span className="truncate">{o.nome}</span>
                        </div>
                        {isChecked ? (
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
              >
                Salvar Permissões de Usuário
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Usuários Cadastrados no Sistema ({userPermissions.length})</span>
            </h3>

            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3 py-1 rounded-lg border border-amber-200 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{pendingCount} {pendingCount === 1 ? 'usuário com alterações pendentes' : 'usuários com alterações pendentes'}</span>
                <button
                  type="button"
                  onClick={handleSaveAllDrafts}
                  disabled={isSavingAll}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded text-[11px] font-extrabold shadow-xs transition ml-1"
                >
                  Salvar Tudo
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider select-none">
                  <th className="p-3.5 border-b border-slate-700">Usuário / E-mail</th>
                  <th className="p-3.5 border-b border-slate-700 text-center">Status</th>
                  <th className="p-3.5 border-b border-slate-700 text-center">Nível (Role)</th>
                  <th className="p-3.5 border-b border-slate-700">Obras com Acesso Liberado</th>
                  <th className="p-3.5 border-b border-slate-700 text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="text-xs divide-y divide-slate-200">
                {userPermissions.map((rawPerm) => {
                  const perm = getEffectivePerm(rawPerm);
                  const isDirty = hasUnsavedChanges(rawPerm.id);
                  const isSuperAdmin = rawPerm.email.toLowerCase() === 'fgama@seel.com.br';
                  const userObras = perm.obrasPermitidas || [];
                  const hasAllObras = userObras.includes('*');

                  return (
                    <tr
                      key={rawPerm.id}
                      className={`transition ${
                        isDirty
                          ? 'bg-amber-50/60 hover:bg-amber-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Email & Name */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{perm.email}</span>
                          {isSuperAdmin && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
                              SUPER ADMIN
                            </span>
                          )}
                          {isDirty && (
                            <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-400">
                              Não Salvo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">{perm.nome}</div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isSuperAdmin ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Aprovado
                          </span>
                        ) : (
                          <select
                            value={perm.status}
                            onChange={(e) => handleDraftStatusChange(rawPerm, e.target.value as StatusAcesso)}
                            className={`border rounded-lg p-1 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 ${
                              perm.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : perm.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-red-50 text-red-900 border-red-300'
                            }`}
                          >
                            <option value="APPROVED">Aprovado</option>
                            <option value="PENDING">Pendente</option>
                            <option value="REVOKED">Revogado</option>
                          </select>
                        )}
                      </td>

                      {/* Role */}
                      <td className="p-3.5 text-center">
                        {isSuperAdmin ? (
                          <span className="font-extrabold text-amber-800">Administrador</span>
                        ) : (
                          <select
                            value={perm.role}
                            onChange={(e) => handleDraftRoleChange(rawPerm, e.target.value as UserRole)}
                            className="border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="VIEWER">Visualizador</option>
                            <option value="EDITOR">Editor</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                        )}
                      </td>

                      {/* Obras Permitidas */}
                      <td className="p-3.5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDraftSetAllObras(rawPerm, !hasAllObras)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 ${
                                hasAllObras
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>Acesso a Todas as Obras (*)</span>
                            </button>

                            {!hasAllObras && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                ({userObras.length} de {obras.length} obras selecionadas)
                              </span>
                            )}
                          </div>

                          {!hasAllObras && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {obras.length === 0 ? (
                                <span className="text-slate-400 text-xs italic">Nenhuma obra cadastrada.</span>
                              ) : (
                                obras.map((o) => {
                                  const isPermitted = userObras.includes(o.id);
                                  return (
                                    <button
                                      type="button"
                                      key={o.id}
                                      onClick={() => handleDraftToggleObra(rawPerm, o.id)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                                        isPermitted
                                          ? 'bg-blue-100 text-blue-900 border-blue-300 shadow-2xs'
                                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300'
                                      }`}
                                      title={isPermitted ? `Clique para desmarcar ${o.nome}` : `Clique para marcar ${o.nome}`}
                                    >
                                      <Building className={`w-3 h-3 ${isPermitted ? 'text-blue-600' : 'text-slate-400'}`} />
                                      <span>{o.codigo} - {o.nome}</span>
                                      {isPermitted && <Check className="w-3 h-3 text-blue-600 ml-0.5" />}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        {isDirty ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveUser(rawPerm.id)}
                              disabled={savingId === rawPerm.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
                              title="Salvar e aplicar alterações no banco de dados"
                            >
                              {savingId === rawPerm.id ? (
                                <span className="animate-spin text-xs">⌛</span>
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>Salvar Alterações</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancelUserDraft(rawPerm.id)}
                              disabled={savingId === rawPerm.id}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="Desfazer alterações não salvas"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Desfazer</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs italic flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-slate-500 font-medium">Salvo</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
