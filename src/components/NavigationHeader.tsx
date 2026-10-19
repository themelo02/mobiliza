import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, LogOut, User, ShieldCheck, History, Eye } from 'lucide-react';

export const NavigationHeader: React.FC = () => {
  const { userSession, activeScreen, setActiveScreen, logout } = useApp();

  if (!userSession) return null;

  const isAdmin = userSession.tipo === 'admin';
  const isLeitor = userSession.tipo === 'leitor';
  const isSupervisor = userSession.tipo === 'supervisor';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-3">
        {/* LOGO INSTITUCIONAL COMPACTO */}
        <div className="flex items-center gap-2">
          <div
            className="cursor-pointer flex items-center gap-1.5"
            onClick={() => setActiveScreen(isAdmin || isLeitor ? 'dashboard' : 'formulario')}
          >
            <span className="text-lg font-black text-[#2667ff] tracking-tight">
              MS<span className="text-slate-700">-sumbe</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 pl-2 border-l border-slate-200">
              Mobilização Social
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE CONTEXTO */}
        <div className="flex items-center gap-2">
          {/* Se for Admin e estiver no formulário, atalho rápido para voltar ao painel */}
          {isAdmin && (
            <button
              onClick={() => setActiveScreen('dashboard')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Aceder ao Painel Geral do Administrador"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Painel Admin</span>
            </button>
          )}

          {/* Se for Utilizador de Leitura, indicador claro de apenas consulta */}
          {isLeitor && (
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#1a53db] px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <Eye className="w-3.5 h-3.5 text-[#2667ff]" />
              <span>Modo Só de Leitura</span>
            </div>
          )}

          {/* Se for supervisor, botão de histórico das suas fichas */}
          {isSupervisor && (
            <button
              onClick={() => setActiveScreen(activeScreen === 'historico' ? 'formulario' : 'historico')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === 'historico'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={activeScreen === 'historico' ? 'Voltar ao Formulário' : 'Ver fichas enviadas'}
            >
              <History className="w-3.5 h-3.5" />
              <span>{activeScreen === 'historico' ? 'Formulário' : 'Minhas Fichas'}</span>
            </button>
          )}

          {/* Identificação compacta do utilizador */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-full text-xs">
            {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-[#2667ff] shrink-0" />}
            {isLeitor && <Eye className="w-3.5 h-3.5 text-[#2667ff] shrink-0" />}
            {isSupervisor && <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}

            <span className="font-bold text-slate-800 text-[11px] max-w-[130px] truncate">
              {userSession.nome}
            </span>

            {isSupervisor && userSession.supervisor?.comuna && (
              <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                ({userSession.supervisor.comuna})
              </span>
            )}
            {isLeitor && (
              <span className="text-[10px] bg-blue-100 text-[#1a53db] px-1.5 py-0.2 rounded font-bold">
                Leitor
              </span>
            )}
          </div>

          {/* Sair / Terminar Sessão */}
          <button
            onClick={logout}
            className="p-1 px-2 text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition flex items-center gap-1 cursor-pointer"
            title="Terminar sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
