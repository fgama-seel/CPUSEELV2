import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { HardHat, LogIn, Clock, ShieldAlert, CheckCircle, Lock } from 'lucide-react';
import { UserPermission } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (email: string, displayName: string) => void;
  userPermission: UserPermission | null;
  pendingUserEmail: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  userPermission,
  pendingUserEmail
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user.email) {
        onLoginSuccess(user.email, user.displayName || user.email.split('@')[0]);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg('Falha ao autenticar com o Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = (email: string, name: string) => {
    onLoginSuccess(email, name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-t-4 border-indigo-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>

        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
          <HardHat className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-800 mb-1">Painel de CPUs SEEL</h2>
        <p className="text-slate-500 mb-6 text-xs leading-relaxed">
          Sistema de gestão de composições de preços unitários e custos de obras. Faça login com seu e-mail corporativo.
        </p>

        {/* If user logged in but status is PENDING */}
        {pendingUserEmail && userPermission?.status === 'PENDING' ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Aguardando Aprovação de Acesso</span>
            </div>
            <p className="text-slate-600 leading-normal">
              O seu e-mail <strong className="font-mono text-slate-800">{pendingUserEmail}</strong> foi registrado com sucesso.
            </p>
            <p className="text-slate-600 leading-normal">
              Sua solicitação está aguardando revisão do administrador principal{' '}
              <strong className="text-indigo-900 font-bold">fgama@seel.com.br</strong>.
            </p>
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition"
              >
                Verificar Status Novamente
              </button>
            </div>
          </div>
        ) : pendingUserEmail && userPermission?.status === 'REVOKED' ? (
          <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-xs text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>Acesso Revogado</span>
            </div>
            <p className="text-slate-600 leading-normal">
              O e-mail <strong className="font-mono">{pendingUserEmail}</strong> teve o acesso às obras revogado pelo administrador.
            </p>
          </div>
        ) : (
          <>
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center gap-3 mb-4 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Autenticando...' : 'Entrar com Conta do Google'}</span>
            </button>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-2.5 rounded-lg text-xs mb-4">
                {errorMsg}
              </div>
            )}

            {/* Quick Demo Accounts for Development */}
            <div className="pt-4 border-t border-slate-100 text-left">
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Atalhos de Acesso Direto:</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleDevLogin('fgama@seel.com.br', 'F. Gama (Admin SEEL)')}
                  className="w-full text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between border border-indigo-200"
                >
                  <span className="font-mono">fgama@seel.com.br</span>
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-extrabold">
                    ADMIN
                  </span>
                </button>

                <button
                  onClick={() => handleDevLogin('colaborador@seel.com.br', 'Eng. Colaborador')}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between border border-slate-200"
                >
                  <span className="font-mono">colaborador@seel.com.br</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                    Engenheiro
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
