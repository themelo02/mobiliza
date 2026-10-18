import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { NavigationHeader } from './components/NavigationHeader';
import { SupervisorView } from './components/SupervisorView';
import { AdminView } from './components/AdminView';
import { SupervisorHistoryView } from './components/SupervisorHistoryView';

const MainLayout: React.FC = () => {
  const { userSession, activeScreen } = useApp();

  // Se não houver sessão iniciada, apresenta o ecrã de acesso (Login com Código e Senha)
  if (!userSession) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#333333] flex flex-col">
      {/* Barra de Navegação Limpa e Oficial */}
      <NavigationHeader />

      <main className="flex-1">
        {activeScreen === 'formulario' && <SupervisorView />}
        {activeScreen === 'dashboard' && <AdminView />}
        {activeScreen === 'historico' && <SupervisorHistoryView />}
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
