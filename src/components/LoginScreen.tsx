import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowRight, Building, KeyRound, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [codigo, setCodigo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!codigo.trim()) {
      setErrorMessage('Por favor, introduza o seu código de acesso.');
      return;
    }

    setIsSubmitting(true);
    const result = login(codigo);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Código de acesso inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Logótipo e Cabeçalho Institucional */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2667ff] text-white shadow-md mb-2.5">
            <Building className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2667ff] tracking-tight">
            MS<span className="text-slate-700">-sumbe</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mt-0.5">
            Sistema de Mobilização Social do Sumbe
          </p>
          <p className="text-[11px] text-slate-500">
            Província do Cuanza-Sul &bull; República de Angola
          </p>
        </div>

        {/* Cartão de Acesso Protegido */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Acesso Seguro ao Sistema
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Autenticação</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Introduza o código de acesso atribuído à sua função pela administração municipal.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Código de Acesso Confidencial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Introduza o seu código..."
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full pl-9 pr-10 py-2.5 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] focus:border-[#2667ff] outline-none tracking-wide"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ocultar código' : 'Mostrar código'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 px-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2667ff] shrink-0" />
                <span>Compatível com contas de Administrador, Supervisor e Consulta (Leitura).</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Caso não possua código de acesso, solicite à Coordenação Municipal de Mobilização Social.
            </span>
          </div>
        </div>

        {/* Rodapé Institucional */}
        <div className="text-center text-[11px] text-slate-400 mt-6">
          Coordenação Municipal de Mobilização Social &bull; Sumbe 2026
        </div>
      </div>
    </div>
  );
};
