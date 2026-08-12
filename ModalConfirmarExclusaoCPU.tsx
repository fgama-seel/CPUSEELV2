import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Save,
  Check,
  Building,
  Key
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
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;

    const normalizedEmail = newEmail.toLowerCase().trim();
    const perm: UserPermission = {
      id: normalizedEmail,
      email: normalizedEmail,
      nome: newName.trim() || normalizedEmail.split('@')[0],
      status: 'APPROVED',
      role: 'EDITOR',
      obrasPermitidas: ['*'],
      solicitadoEm: new Date().toISOString(),
      aprovadoPor: currentUserEmail
    };

    await updateUserPermission(perm);
    setNewEmail('');
    setNewName('');
    setIsAdding(false);
    setSuccessMsg(`Usuário ${normalizedEmail} adicionado com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleStatusChange = async (perm: UserPermission, newStatus: StatusAcesso) => {
    const updated: UserPermission = {
      ...perm,
      status: newStatus,
      aprovadoPor: currentUserEmail
    };
    await updateUserPermission(updated);
  };

  const handleRoleChange = async (perm: UserPermission, newRole: UserRole) => {
    const updated: UserPermission = {
      ...perm,
      role: newRole,
      aprovadoPor: currentUserEmail
    };
    await updateUserPermission(updated);
  };

  const handleToggleObra = async (perm: UserPermission, obraId: string) => {
    let currentObras = [...perm.obrasPermitidas];

    if (currentObras.includes('*')) {
      // Replace '*' with specific list without this obra
      currentObras = obras.map((o) => o.id).filter((id) => id !== obraId);
    } else if (currentObras.includes(obraId)) {
      currentObras = currentObras.filter((id) => id !== obraId);
    } else {
      currentObras.push(obraId);
    }

    const updated: UserPermission = {
      ...perm,
      obrasPermitidas: currentObras,
      aprovadoPor: currentUserEmail
    };
    await updateUserPermission(updated);
  };

  const handleSetAllObras = async (perm: UserPermission) => {
    const updated: UserPermission = {
      ...perm,
      obrasPermitidas: ['*'],
      aprovadoPor: currentUserEmail
    };
    await updateUserPermission(updated);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-100 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-amber-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Painel de Administração de Acessos - Conta do Administrador (fgama@seel.com.br)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Revise, aprove ou revogue os e-mails com acesso ao sistema e defina permissões por obra individual.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Convidar Novo E-mail</span>
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add Guest Form */}
        {isAdding && (
          <form
            onSubmit={handleAddGuest}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4"
          >
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Convidar / Adicionar Permissão de E-mail</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nome do Usuário</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full border border-slate-300 p-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
              >
                Salvar E-mail
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Usuários e Solicitações de Acesso ({userPermissions.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider select-none">
                  <th className="p-3 border-b border-slate-700">Usuário / E-mail</th>
                  <th className="p-3 border-b border-slate-700 text-center">Status</th>
                  <th className="p-3 border-b border-slate-700 text-center">Função (Role)</th>
                  <th className="p-3 border-b border-slate-700">Obras Permitidas</th>
                  <th className="p-3 border-b border-slate-700 text-center">Ações de Aprovação</th>
                </tr>
              </thead>

              <tbody className="text-xs divide-y divide-slate-200">
                {userPermissions.map((perm) => {
                  const isSuperAdmin = perm.email.toLowerCase() === 'fgama@seel.com.br';
                  const hasAllObras = perm.obrasPermitidas.includes('*');

                  return (
                    <tr key={perm.id} className="hover:bg-slate-50 transition">
                      {/* Email & Name */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{perm.email}</span>
                          {isSuperAdmin && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{perm.nome}</div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {perm.status === 'APPROVED' && (
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Aprovado
                          </span>
                        )}
                        {perm.status === 'PENDING' && (
                          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendente
                          </span>
                        )}
                        {perm.status === 'REVOKED' && (
                          <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Revogado
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="p-3 text-center">
                        {isSuperAdmin ? (
                          <span className="font-bold text-amber-800">Administrador</span>
                        ) : (
                          <select
                            value={perm.role}
                            onChange={(e) => handleRoleChange(perm, e.target.value as UserRole)}
                            className="border border-slate-300 rounded p-1 text-xs font-semibold bg-white"
                          >
                            <option value="VIEWER">Visualizador</option>
                            <option value="EDITOR">Editor</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                        )}
                      </td>

                      {/* Obras Permitidas */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => handleSetAllObras(perm)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                hasAllObras
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              Todas as Obras (*)
                            </button>
                          </div>

                          {!hasAllObras && (
                            <div className="flex flex-wrap gap-1">
                              {obras.map((o) => {
                                const isPermitted = perm.obrasPermitidas.includes(o.id);
                                return (
                                  <button
                                    key={o.id}
                                    onClick={() => handleToggleObra(perm, o.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                      isPermitted
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    {o.codigo}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        {!isSuperAdmin && (
                          <div className="flex justify-center gap-1.5">
                            {perm.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleStatusChange(perm, 'APPROVED')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                title="Aprovar Acesso"
                              >
                                <Check className="w-3 h-3" />
                                <span>Aprovar</span>
                              </button>
                            )}

                            {perm.status !== 'REVOKED' && (
                              <button
                                onClick={() => handleStatusChange(perm, 'REVOKED')}
                                className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                title="Revogar Acesso"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Revogar</span>
                              </button>
                            )}
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
