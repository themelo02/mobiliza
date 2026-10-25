import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, LogOut, User, ShieldCheck, History, Eye, WifiOff, RefreshCw } from 'lucide-react';

export const NavigationHeader: React.FC = () => {
  const {
    userSession,
    activeScreen,
    setActiveScreen,
    logout,
    isOnline,
    offlineQueueCount,
    syncOfflineSubmissoes,
    isSyncingOffline,
  } = useApp();

  if (!userSession) return null;

  const isAdmin = userSession.tipo === 'admin';
  const isLeitor = userSession.tipo === 'leitor';
  const isSupervisor = userSession.tipo === 'supervisor';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[44px] py-1 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* LOGO INSTITUCIONAL COMPACTO E STATUS DE REDE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className="cursor-pointer flex items-center gap-1"
            onClick={() => setActiveScreen(isAdmin || isLeitor ? 'dashboard' : 'formulario')}
          >
            <span className="text-base sm:text-lg font-black text-[#2667ff] tracking-tight">
              MS<span className="text-slate-700">-sumbe</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 pl-2 border-l border-slate-200">
              Mobilização Social
            </span>
          </div>

          {/* Indicador de Estado de Conexão */}
          {!isOnline && (
            <span
              className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs"
              title="Sem ligação à internet no momento. Todos os dados são guardados no telemóvel."
            >
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </span>
          )}

          {/* Botão de Sincronização rápida se houver itens guardados no aparelho */}
          {offlineQueueCount > 0 && (
            <button
              onClick={() => isOnline && syncOfflineSubmissoes()}
              disabled={!isOnline || isSyncingOffline}
              className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full border transition cursor-pointer shadow-2xs ${
                isOnline
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 animate-pulse'
                  : 'bg-amber-100 text-amber-900 border-amber-300 opacity-90'
              }`}
              title={
                isOnline
                  ? 'Clique para sincronizar os dados guardados no telemóvel com o servidor'
                  : 'Aguardando ligação de internet para enviar fichas guardadas no telemóvel'
              }
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
              <span>
                {offlineQueueCount} {offlineQueueCount === 1 ? 'pendente' : 'pendentes'}
              </span>
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO DE CONTEXTO */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Se for Admin e estiver no formulário, atalho rápido para voltar ao painel */}
          {isAdmin && (
            <button
              onClick={() => setActiveScreen('dashboard')}
              className={`px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition cursor-pointer shrink-0 ${
                activeScreen === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Aceder ao Painel Geral do Administrador"
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Painel Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          {/* Se for Utilizador de Leitura, indicador claro de apenas consulta */}
          {isLeitor && (
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#1a53db] px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0">
              <Eye className="w-3.5 h-3.5 text-[#2667ff]" />
              <span>Modo Só de Leitura</span>
            </div>
          )}

          {/* Se for supervisor, botão de histórico das suas fichas */}
          {isSupervisor && (
            <button
              onClick={() => setActiveScreen(activeScreen === 'historico' ? 'formulario' : 'historico')}
              className={`px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition cursor-pointer shrink-0 ${
                activeScreen === 'historico'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={activeScreen === 'historico' ? 'Voltar ao Formulário' : 'Ver fichas enviadas'}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{activeScreen === 'historico' ? 'Formulário' : 'Minhas Fichas'}</span>
              <span className="sm:hidden">{activeScreen === 'historico' ? 'Form' : 'Fichas'}</span>
            </button>
          )}

          {/* Identificação compacta do utilizador com truncate seguro */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-200 py-1 px-2 sm:px-2.5 rounded-full text-xs shrink-0 max-w-[100px] xs:max-w-[130px] sm:max-w-[180px]">
            {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-[#2667ff] shrink-0" />}
            {isLeitor && <Eye className="w-3.5 h-3.5 text-[#2667ff] shrink-0" />}
            {isSupervisor && <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}

            <span className="font-bold text-slate-800 text-[11px] truncate">
              {userSession.nome}
            </span>

            {isSupervisor && userSession.supervisor?.comuna && (
              <span className="text-[10px] text-slate-400 font-medium hidden md:inline shrink-0">
                ({userSession.supervisor.comuna})
              </span>
            )}
            {isLeitor && (
              <span className="text-[10px] bg-blue-100 text-[#1a53db] px-1.5 py-0.2 rounded font-bold shrink-0">
                Leitor
              </span>
            )}
          </div>

          {/* Sair / Terminar Sessão */}
          <button
            onClick={logout}
            className="p-1 sm:px-2 text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition flex items-center gap-1 cursor-pointer shrink-0"
            title="Terminar sessão"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px]">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
