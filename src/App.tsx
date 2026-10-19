import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { NavigationHeader } from './components/NavigationHeader';
import { SupervisorView } from './components/SupervisorView';
import { AdminView } from './components/AdminView';
import { SupervisorHistoryView } from './components/SupervisorHistoryView';

const MainLayout: React.FC = () => {
  const { userSession, activeScreen } = useApp();

  // Se não houver sessão iniciada, apresenta o ecrã de acesso seguro
  if (!userSession) {
    return <LoginScreen />;
  }

  const isLeitor = userSession.tipo === 'leitor';

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#333333] flex flex-col">
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
