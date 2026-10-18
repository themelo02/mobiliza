import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowRight, Building, KeyRound } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, adminCode } = useApp();
  const [codigo, setCodigo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!codigo.trim()) {
      setErrorMessage('Por favor, introduza o seu código de acesso.');
      return;
    }

    const result = login(codigo);
    if (!result.success) {
      setErrorMessage(result.message || 'Código inválido.');
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

        {/* Cartão de Acesso */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Acesso ao Sistema
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Introduza o código atribuído ao seu utilizador pela administração municipal para aceder.
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
                Código de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ex: SUP-001 ou código do administrador"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] focus:border-[#2667ff] outline-none"
                  autoFocus
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 px-0.5">
                <span>Supervisor: use o seu código</span>
                <span>Admin: <strong className="text-slate-600 font-mono">{adminCode}</strong></span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Rodapé Institucional */}
        <div className="text-center text-[11px] text-slate-400 mt-6">
          Coordenação Municipal de Mobilização Social &bull; Sumbe 2026
        </div>
      </div>
    </div>
  );
};
