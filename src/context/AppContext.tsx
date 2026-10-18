import React, { createContext, useContext, useState, useEffect } from 'react';
import { Supervisor, Submissao, UserSession } from '../types';
import { INITIAL_SUPERVISORES, INITIAL_SUBMISSOES } from '../data/initialData';
import { db, testConnection, handleFirestoreError, OperationType } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

interface AppContextType {
  supervisores: Supervisor[];
  submissoes: Submissao[];
  userSession: UserSession | null;
  activeScreen: 'formulario' | 'dashboard' | 'historico';
  isFirebaseConnected: boolean;
  setActiveScreen: (screen: 'formulario' | 'dashboard' | 'historico') => void;
  login: (codigo: string, senha?: string) => { success: boolean; message?: string };
  logout: () => void;
  quickLoginAsSupervisor: (supervisorId: string) => void;
  quickLoginAsAdmin: () => void;
  addSupervisor: (data: Omit<Supervisor, 'id' | 'dataCriacao'>) => Supervisor;
  updateSupervisor: (id: string, data: Partial<Supervisor>) => void;
  deleteSupervisor: (id: string) => void;
  addSubmissao: (sub: Omit<Submissao, 'id' | 'dataEnvio'>) => Submissao;
  updateSubmissaoStatus: (id: string, status: 'Validado' | 'Pendente' | 'Em Revisão') => void;
  deleteSubmissao: (id: string) => void;
  resetToInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SUPERVISORES: 'ms_sumbe_supervisores_v4',
  SUBMISSOES: 'ms_sumbe_submissoes_v4',
  SESSION: 'ms_sumbe_session_v4',
  SCREEN: 'ms_sumbe_screen_v4',
};

export const ADMIN_CODE = 'ADM2026';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supervisores, setSupervisores] = useState<Supervisor[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUPERVISORES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_SUPERVISORES;
  });

  const [submissoes, setSubmissoes] = useState<Submissao[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSOES);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_SUBMISSOES;
  });

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    const defaultSup = INITIAL_SUPERVISORES[0];
    return {
      tipo: 'supervisor',
      nome: defaultSup.nome,
      codigo: defaultSup.codigo,
      supervisor: defaultSup,
    };
  });

  const [activeScreen, setActiveScreen] = useState<'formulario' | 'dashboard' | 'historico'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SCREEN);
      if (stored === 'formulario' || stored === 'dashboard' || stored === 'historico') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'formulario';
  });

  // Test Firebase connection & initialize real-time Firestore listeners
  useEffect(() => {
    let unsubscribeSupervisores: (() => void) | undefined;
    let unsubscribeSubmissoes: (() => void) | undefined;

    const initFirebase = async () => {
      try {
        const connected = await testConnection();
        setIsFirebaseConnected(connected);

        // Check and seed initial 9 supervisors in Firestore if empty
        const supSnapshot = await getDocs(collection(db, 'supervisores'));
        if (supSnapshot.empty) {
          for (const sup of INITIAL_SUPERVISORES) {
            await setDoc(doc(db, 'supervisores', sup.id), sup);
          }
        }

        // Check and seed initial submissions if empty
        const subSnapshot = await getDocs(collection(db, 'submissoes'));
        if (subSnapshot.empty) {
          for (const sub of INITIAL_SUBMISSOES) {
            await setDoc(doc(db, 'submissoes', sub.id), sub);
          }
        }

        // Attach Real-time listener for Supervisores
        unsubscribeSupervisores = onSnapshot(
          collection(db, 'supervisores'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Supervisor[] = [];
              snapshot.forEach((docSnap) => {
                loaded.push(docSnap.data() as Supervisor);
              });
              setSupervisores(loaded);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'supervisores');
          }
        );

        // Attach Real-time listener for Submissoes
        unsubscribeSubmissoes = onSnapshot(
          collection(db, 'submissoes'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Submissao[] = [];
              snapshot.forEach((docSnap) => {
                loaded.push(docSnap.data() as Submissao);
              });
              // Sort by dataEnvio descending
              loaded.sort(
                (a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
              );
              setSubmissoes(loaded);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'submissoes');
          }
        );
      } catch (err) {
        console.warn('Iniciando em modo local persistente:', err);
      }
    };

    initFirebase();

    return () => {
      if (unsubscribeSupervisores) unsubscribeSupervisores();
      if (unsubscribeSubmissoes) unsubscribeSubmissoes();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPERVISORES, JSON.stringify(supervisores));
    } catch {
      // ignore
    }
  }, [supervisores]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSOES, JSON.stringify(submissoes));
    } catch {
      // ignore
    }
  }, [submissoes]);

  useEffect(() => {
    try {
      if (userSession) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch {
      // ignore
    }
  }, [userSession]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCREEN, activeScreen);
    } catch {
      // ignore
    }
  }, [activeScreen]);

  const login = (codigoInput: string, senhaInput?: string): { success: boolean; message?: string } => {
    const trimmedCode = codigoInput.trim();
    const trimmedPass = (senhaInput || '').trim();

    // Admin Access: Code is ADM2026 or password is ADM2026
    if (
      trimmedCode.toUpperCase() === ADMIN_CODE ||
      trimmedPass.toUpperCase() === ADMIN_CODE ||
      (trimmedCode.toLowerCase() === 'admin' && trimmedPass.toUpperCase() === ADMIN_CODE)
    ) {
      const adminSession: UserSession = {
        tipo: 'admin',
        nome: 'Coordenação Geral / Administrador',
        codigo: ADMIN_CODE,
      };
      setUserSession(adminSession);
      setActiveScreen('dashboard');
      return { success: true };
    }

    // Supervisor Login by code only
    const foundSup = supervisores.find(
      (s) =>
        s.codigo.toLowerCase() === trimmedCode.toLowerCase() ||
        s.nome.toLowerCase() === trimmedCode.toLowerCase()
    );

    if (!foundSup) {
      return {
        success: false,
        message: 'Código de utilizador não encontrado. Introduza o código fornecido pelo administrador ou use ADM2026 para o painel.',
      };
    }

    if (!foundSup.ativo) {
      return {
        success: false,
        message: 'Este utilizador de supervisor encontra-se desativado pela administração.',
      };
    }

    const supSession: UserSession = {
      tipo: 'supervisor',
      nome: foundSup.nome,
      codigo: foundSup.codigo,
      supervisor: foundSup,
    };
    setUserSession(supSession);
    setActiveScreen('formulario');
    return { success: true };
  };

  const logout = () => {
    setUserSession(null);
    setActiveScreen('formulario');
  };

  const quickLoginAsSupervisor = (supervisorId: string) => {
    const sup = supervisores.find((s) => s.id === supervisorId);
    if (sup) {
      setUserSession({
        tipo: 'supervisor',
        nome: sup.nome,
        codigo: sup.codigo,
        supervisor: sup,
      });
      setActiveScreen('formulario');
    }
  };

  const quickLoginAsAdmin = () => {
    setUserSession({
      tipo: 'admin',
      nome: 'Coordenação Geral / Administrador',
      codigo: ADMIN_CODE,
    });
    setActiveScreen('dashboard');
  };

  const addSupervisor = (data: Omit<Supervisor, 'id' | 'dataCriacao'>): Supervisor => {
    const newId = `sup-${Date.now()}`;
    const newSup: Supervisor = {
      ...data,
      id: newId,
      dataCriacao: new Date().toISOString().split('T')[0],
    };

    setSupervisores((prev) => [newSup, ...prev]);

    // Persist to Firestore
    try {
      setDoc(doc(db, 'supervisores', newId), newSup).catch((e) =>
        handleFirestoreError(e, OperationType.CREATE, `supervisores/${newId}`)
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `supervisores/${newId}`);
    }

    return newSup;
  };

  const updateSupervisor = (id: string, data: Partial<Supervisor>) => {
    setSupervisores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );

    // Persist to Firestore
    try {
      updateDoc(doc(db, 'supervisores', id), data).catch((e) =>
        handleFirestoreError(e, OperationType.UPDATE, `supervisores/${id}`)
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `supervisores/${id}`);
    }

    if (userSession?.supervisor?.id === id) {
      setUserSession((prev) =>
        prev
          ? {
              ...prev,
              nome: data.nome || prev.nome,
              codigo: data.codigo || prev.codigo,
              supervisor: prev.supervisor ? { ...prev.supervisor, ...data } : undefined,
            }
          : null
      );
    }
  };

  const deleteSupervisor = (id: string) => {
    setSupervisores((prev) => prev.filter((s) => s.id !== id));

    // Persist to Firestore
    try {
      deleteDoc(doc(db, 'supervisores', id)).catch((e) =>
        handleFirestoreError(e, OperationType.DELETE, `supervisores/${id}`)
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `supervisores/${id}`);
    }

    if (userSession?.supervisor?.id === id) {
      logout();
    }
  };

  const addSubmissao = (subData: Omit<Submissao, 'id' | 'dataEnvio'>): Submissao => {
    const newId = `sub-${Date.now()}`;
    const newSub: Submissao = {
      ...subData,
      id: newId,
      dataEnvio: new Date().toISOString(),
    };

    setSubmissoes((prev) => [newSub, ...prev]);

    // Persist to Firestore
    try {
      setDoc(doc(db, 'submissoes', newId), newSub).catch((e) =>
        handleFirestoreError(e, OperationType.CREATE, `submissoes/${newId}`)
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `submissoes/${newId}`);
    }

    return newSub;
  };

  const updateSubmissaoStatus = (id: string, status: 'Validado' | 'Pendente' | 'Em Revisão') => {
    setSubmissoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );

    // Persist to Firestore
    try {
      updateDoc(doc(db, 'submissoes', id), { status }).catch((e) =>
        handleFirestoreError(e, OperationType.UPDATE, `submissoes/${id}`)
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `submissoes/${id}`);
    }
  };

  const deleteSubmissao = (id: string) => {
    setSubmissoes((prev) => prev.filter((s) => s.id !== id));

    // Persist to Firestore
    try {
      deleteDoc(doc(db, 'submissoes', id)).catch((e) =>
        handleFirestoreError(e, OperationType.DELETE, `submissoes/${id}`)
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `submissoes/${id}`);
    }
  };

  const resetToInitialData = async () => {
    setSupervisores(INITIAL_SUPERVISORES);
    setSubmissoes(INITIAL_SUBMISSOES);

    // Reseed Firestore
    try {
      for (const sup of INITIAL_SUPERVISORES) {
        await setDoc(doc(db, 'supervisores', sup.id), sup);
      }
      for (const sub of INITIAL_SUBMISSOES) {
        await setDoc(doc(db, 'submissoes', sub.id), sub);
      }
    } catch {
      // ignore
    }

    const defaultSup = INITIAL_SUPERVISORES[0];
    setUserSession({
      tipo: 'supervisor',
      nome: defaultSup.nome,
      codigo: defaultSup.codigo,
      supervisor: defaultSup,
    });
    setActiveScreen('formulario');
  };

  return (
    <AppContext.Provider
      value={{
        supervisores,
        submissoes,
        userSession,
        activeScreen,
        isFirebaseConnected,
        setActiveScreen,
        login,
        logout,
        quickLoginAsSupervisor,
        quickLoginAsAdmin,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        addSubmissao,
        updateSubmissaoStatus,
        deleteSubmissao,
        resetToInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
