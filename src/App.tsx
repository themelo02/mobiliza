import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { NavigationHeader } from './components/NavigationHeader';
import { SupervisorView } from './components/SupervisorView';
import { AdminView } from './components/AdminView';
import { SupervisorHistoryView } from './components/SupervisorHistoryView';

const MainLayout: React.FC = () => {
  const { userSession, activeScreen, offlineSyncToast } = useApp();

  // Se não houver sessão iniciada, apresenta o ecrã de acesso seguro
  if (!userSession) {
    return <LoginScreen />;
  }

  const isLeitor = userSession.tipo === 'leitor';

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#333333] flex flex-col relative">
      {/* Barra de Navegação Institucional */}
      <NavigationHeader />

      <main className="flex-1">
        {/* Utilizador de Apenas Leitura acede exclusivamente às vistas de análise e relatórios */}
        {isLeitor ? (
          <AdminView />
        ) : (
          <>
            {activeScreen === 'formulario' && <SupervisorView />}
            {activeScreen === 'dashboard' && <AdminView />}
            {activeScreen === 'historico' && <SupervisorHistoryView />}
          </>
        )}
      </main>

      {/* Notificação Flutuante de Sincronização Automática Offline */}
      {offlineSyncToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-bounce">
          <span className="text-xl shrink-0">✅</span>
          <span className="text-xs font-semibold leading-snug">{offlineSyncToast}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
