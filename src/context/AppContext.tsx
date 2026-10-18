import React, { createContext, useContext, useState, useEffect } from 'react';
import { Supervisor, Submissao, UserSession } from '../types';
import { INITIAL_SUPERVISORES, INITIAL_SUBMISSOES } from '../data/initialData';
import { db, testConnection, handleFirestoreError, OperationType } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

interface AppContextType {
  supervisores: Supervisor[];
  submissoes: Submissao[];
  userSession: UserSession | null;
  adminCode: string;
  activeScreen: 'formulario' | 'dashboard' | 'historico';
  isFirebaseConnected: boolean;
  isLoadingData: boolean;
  setActiveScreen: (screen: 'formulario' | 'dashboard' | 'historico') => void;
  login: (codigo: string, senha?: string) => { success: boolean; message?: string };
  logout: () => void;
  quickLoginAsSupervisor: (supervisorId: string) => void;
  quickLoginAsAdmin: () => void;
  updateAdminCode: (newCode: string) => Promise<{ success: boolean; message?: string }>;
  addSupervisor: (data: Omit<Supervisor, 'id' | 'dataCriacao'>) => Promise<Supervisor>;
  updateSupervisor: (id: string, data: Partial<Supervisor>) => Promise<void>;
  deleteSupervisor: (id: string) => Promise<void>;
  addSubmissao: (sub: Omit<Submissao, 'id' | 'dataEnvio'>) => Promise<Submissao>;
  updateSubmissaoStatus: (id: string, status: 'Validado' | 'Pendente' | 'Em Revisão') => Promise<void>;
  deleteSubmissao: (id: string) => Promise<void>;
  clearAllSubmissoes: () => Promise<void>;
  clearAllSupervisores: () => Promise<void>;
  clearAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  resetToInitialData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default fallback admin access code
export const ADMIN_CODE = 'ADM2026';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure Firestore-driven state: Never default to demo data unless explicit!
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [submissoes, setSubmissoes] = useState<Submissao[]>([]);
  const [adminCode, setAdminCode] = useState<string>(ADMIN_CODE);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Session state only (for maintaining login on page refresh)
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const stored = sessionStorage.getItem('ms_sumbe_session');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [activeScreen, setActiveScreen] = useState<'formulario' | 'dashboard' | 'historico'>('formulario');

  // Clean up any legacy localStorage data to comply with user instructions
  useEffect(() => {
    try {
      localStorage.removeItem('ms_sumbe_supervisores_v4');
      localStorage.removeItem('ms_sumbe_submissoes_v4');
      localStorage.removeItem('ms_sumbe_supervisores');
      localStorage.removeItem('ms_sumbe_submissoes');
      localStorage.removeItem('ms_sumbe_session_v4');
      localStorage.removeItem('ms_sumbe_screen_v4');
    } catch {
      // ignore
    }
  }, []);

  // Save session in sessionStorage only
  useEffect(() => {
    try {
      if (userSession) {
        sessionStorage.setItem('ms_sumbe_session', JSON.stringify(userSession));
      } else {
        sessionStorage.removeItem('ms_sumbe_session');
      }
    } catch {
      // ignore
    }
  }, [userSession]);

  // Firestore Initialization & Realtime Listeners
  useEffect(() => {
    let unsubscribeSupervisores: (() => void) | undefined;
    let unsubscribeSubmissoes: (() => void) | undefined;
    let unsubscribeConfig: (() => void) | undefined;

    const initFirebase = async () => {
      try {
        const connected = await testConnection();
        setIsFirebaseConnected(connected);

        // Check if system config already exists
        const configDocRef = doc(db, 'config', 'app_state');
        const configSnap = await getDoc(configDocRef);

        if (!configSnap.exists()) {
          // Initialize system config with default admin code
          await setDoc(configDocRef, {
            adminCode: ADMIN_CODE,
            seedInitialized: true,
            hasClearedDemoData: false,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Config exists: Load dynamic admin code from Firestore
          const configData = configSnap.data();
          if (configData?.adminCode) {
            setAdminCode(configData.adminCode);
          }
        }

        // Attach Realtime Listener for System Config (e.g. admin code changes)
        unsubscribeConfig = onSnapshot(
          configDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data?.adminCode) {
                setAdminCode(data.adminCode);
              }
            }
          },
          (err) => handleFirestoreError(err, OperationType.GET, 'config/app_state')
        );

        // Attach Real-time listener for Supervisores
        unsubscribeSupervisores = onSnapshot(
          collection(db, 'supervisores'),
          (snapshot) => {
            const loaded: Supervisor[] = [];
            snapshot.forEach((docSnap) => {
              loaded.push(docSnap.data() as Supervisor);
            });
            // ALWAYS update state directly from Firestore snapshot (even if 0 items!)
            setSupervisores(loaded);
            setIsLoadingData(false);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'supervisores');
            setIsLoadingData(false);
          }
        );

        // Attach Real-time listener for Submissoes
        unsubscribeSubmissoes = onSnapshot(
          collection(db, 'submissoes'),
          (snapshot) => {
            const loaded: Submissao[] = [];
            snapshot.forEach((docSnap) => {
              loaded.push(docSnap.data() as Submissao);
            });
            // Sort by dataEnvio descending
            loaded.sort(
              (a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
            );
            // ALWAYS update state directly from Firestore snapshot (even if 0 items!)
            setSubmissoes(loaded);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'submissoes');
          }
        );
      } catch (err) {
        console.warn('Erro ao ligar ao Firebase:', err);
        setIsLoadingData(false);
      }
    };

    initFirebase();

    return () => {
      if (unsubscribeSupervisores) unsubscribeSupervisores();
      if (unsubscribeSubmissoes) unsubscribeSubmissoes();
      if (unsubscribeConfig) unsubscribeConfig();
    };
  }, []);

  // Update Administrator Access Code in Firestore
  const updateAdminCode = async (newCode: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = newCode.trim();
    if (!trimmed || trimmed.length < 4) {
      return { success: false, message: 'O código deve ter pelo menos 4 caracteres.' };
    }

    try {
      const configDocRef = doc(db, 'config', 'app_state');
      await setDoc(
        configDocRef,
        {
          adminCode: trimmed,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setAdminCode(trimmed);

      // If admin is currently logged in, update session code as well
      if (userSession?.tipo === 'admin') {
        setUserSession((prev) => (prev ? { ...prev, codigo: trimmed } : null));
      }

      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/app_state');
      return { success: false, message: 'Erro ao salvar novo código no Firebase.' };
    }
  };

  const login = (codigoInput: string, senhaInput?: string): { success: boolean; message?: string } => {
    const trimmedCode = codigoInput.trim();
    const trimmedPass = (senhaInput || '').trim();

    const currentAdminCode = adminCode || ADMIN_CODE;

    // Admin Access: Check against dynamic adminCode from Firebase
    if (
      trimmedCode.toUpperCase() === currentAdminCode.toUpperCase() ||
      trimmedPass.toUpperCase() === currentAdminCode.toUpperCase() ||
      (trimmedCode.toLowerCase() === 'admin' && trimmedPass.toUpperCase() === currentAdminCode.toUpperCase())
    ) {
      const adminSession: UserSession = {
        tipo: 'admin',
        nome: 'Coordenação Geral / Administrador',
        codigo: currentAdminCode,
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
        message: `Código de utilizador não encontrado. Introduza o código fornecido pelo administrador ou use o código de administração (${currentAdminCode}).`,
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
      codigo: adminCode || ADMIN_CODE,
    });
    setActiveScreen('dashboard');
  };

  // Supervisor CRUD with Firestore Persistence
  const addSupervisor = async (data: Omit<Supervisor, 'id' | 'dataCriacao'>): Promise<Supervisor> => {
    const newId = `sup-${Date.now()}`;
    const newSup: Supervisor = {
      ...data,
      id: newId,
      dataCriacao: new Date().toISOString().split('T')[0],
    };

    // Optimistic local update
    setSupervisores((prev) => [newSup, ...prev]);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'supervisores', newId), newSup);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `supervisores/${newId}`);
    }

    return newSup;
  };

  const updateSupervisor = async (id: string, data: Partial<Supervisor>): Promise<void> => {
    setSupervisores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );

    try {
      await updateDoc(doc(db, 'supervisores', id), data);
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

  const deleteSupervisor = async (id: string): Promise<void> => {
    // Delete immediately from local state
    setSupervisores((prev) => prev.filter((s) => s.id !== id));

    // Permanently delete from Firestore
    try {
      await deleteDoc(doc(db, 'supervisores', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `supervisores/${id}`);
    }

    if (userSession?.supervisor?.id === id) {
      logout();
    }
  };

  // Submissao CRUD with Firestore Persistence
  const addSubmissao = async (subData: Omit<Submissao, 'id' | 'dataEnvio'>): Promise<Submissao> => {
    const newId = `sub-${Date.now()}`;
    const newSub: Submissao = {
      ...subData,
      id: newId,
      dataEnvio: new Date().toISOString(),
    };

    setSubmissoes((prev) => [newSub, ...prev]);

    try {
      await setDoc(doc(db, 'submissoes', newId), newSub);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `submissoes/${newId}`);
    }

    return newSub;
  };

  const updateSubmissaoStatus = async (
    id: string,
    status: 'Validado' | 'Pendente' | 'Em Revisão'
  ): Promise<void> => {
    setSubmissoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );

    try {
      await updateDoc(doc(db, 'submissoes', id), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `submissoes/${id}`);
    }
  };

  const deleteSubmissao = async (id: string): Promise<void> => {
    setSubmissoes((prev) => prev.filter((s) => s.id !== id));

    try {
      await deleteDoc(doc(db, 'submissoes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `submissoes/${id}`);
    }
  };

  // CLEAR ALL SUBMISSIONS (TOTAL AUTHORITY)
  const clearAllSubmissoes = async (): Promise<void> => {
    setSubmissoes([]);
    try {
      const snap = await getDocs(collection(db, 'submissoes'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      batch.set(
        doc(db, 'config', 'app_state'),
        { hasClearedDemoData: true, submissoesClearedAt: new Date().toISOString() },
        { merge: true }
      );
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'submissoes');
    }
  };

  // CLEAR ALL SUPERVISORS (TOTAL AUTHORITY)
  const clearAllSupervisores = async (): Promise<void> => {
    setSupervisores([]);
    try {
      const snap = await getDocs(collection(db, 'supervisores'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      batch.set(
        doc(db, 'config', 'app_state'),
        { hasClearedDemoData: true, supervisoresClearedAt: new Date().toISOString() },
        { merge: true }
      );
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'supervisores');
    }
  };

  // CLEAR ALL DATA (SUBMISSIONS + SUPERVISORS - ZERAR SISTEMA)
  const clearAllData = async (): Promise<void> => {
    setSubmissoes([]);
    setSupervisores([]);
    try {
      const [snapSub, snapSup] = await Promise.all([
        getDocs(collection(db, 'submissoes')),
        getDocs(collection(db, 'supervisores')),
      ]);
      const batch = writeBatch(db);
      snapSub.forEach((d) => batch.delete(d.ref));
      snapSup.forEach((d) => batch.delete(d.ref));
      batch.set(
        doc(db, 'config', 'app_state'),
        { hasClearedDemoData: true, allClearedAt: new Date().toISOString() },
        { merge: true }
      );
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'all');
    }
  };

  // Explicitly Load Demo Data (only when user clicks button)
  const loadDemoData = async (): Promise<void> => {
    try {
      const batch = writeBatch(db);
      for (const sup of INITIAL_SUPERVISORES) {
        batch.set(doc(db, 'supervisores', sup.id), sup);
      }
      for (const sub of INITIAL_SUBMISSOES) {
        batch.set(doc(db, 'submissoes', sub.id), sub);
      }
      batch.set(
        doc(db, 'config', 'app_state'),
        { hasClearedDemoData: false, demoLoadedAt: new Date().toISOString() },
        { merge: true }
      );
      await batch.commit();
      setSupervisores(INITIAL_SUPERVISORES);
      setSubmissoes(INITIAL_SUBMISSOES);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'demo_data');
    }
  };

  const resetToInitialData = async (): Promise<void> => {
    await loadDemoData();
  };

  return (
    <AppContext.Provider
      value={{
        supervisores,
        submissoes,
        userSession,
        adminCode,
        activeScreen,
        isFirebaseConnected,
        isLoadingData,
        setActiveScreen,
        login,
        logout,
        quickLoginAsSupervisor,
        quickLoginAsAdmin,
        updateAdminCode,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        addSubmissao,
        updateSubmissaoStatus,
        deleteSubmissao,
        clearAllSubmissoes,
        clearAllSupervisores,
        clearAllData,
        loadDemoData,
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
