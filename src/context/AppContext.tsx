import React, { createContext, useContext, useState, useEffect } from 'react';
import { Supervisor, Submissao, UserSession, UtilizadorLeitura, Coordenacao } from '../types';
import { INITIAL_SUPERVISORES, INITIAL_SUBMISSOES, INITIAL_COORDENACOES } from '../data/initialData';
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
  leitores: UtilizadorLeitura[];
  coordenacoes: Coordenacao[];
  userSession: UserSession | null;
  adminCode: string;
  activeScreen: 'formulario' | 'dashboard' | 'historico';
  isFirebaseConnected: boolean;
  isLoadingData: boolean;
  isOnline: boolean;
  offlineQueueCount: number;
  isSyncingOffline: boolean;
  offlineSyncToast: string;
  syncOfflineSubmissoes: () => Promise<{ synced: number; failed: number }>;
  setActiveScreen: (screen: 'formulario' | 'dashboard' | 'historico') => void;
  login: (codigo: string, senha?: string) => { success: boolean; message?: string };
  logout: () => void;
  quickLoginAsSupervisor: (supervisorId: string) => void;
  quickLoginAsAdmin: () => void;
  updateAdminCode: (newCode: string) => Promise<{ success: boolean; message?: string }>;
  addSupervisor: (data: Omit<Supervisor, 'id' | 'dataCriacao'>) => Promise<Supervisor>;
  updateSupervisor: (id: string, data: Partial<Supervisor>) => Promise<void>;
  deleteSupervisor: (id: string) => Promise<void>;
  batchUpdateSupervisoresDias: (novosDias: number, defaultFichasDiarias?: number) => Promise<{ success: boolean; count: number; totalFichasCampanha: number }>;
  addCoordenacao: (data: Omit<Coordenacao, 'id' | 'dataCriacao'>) => Promise<Coordenacao>;
  updateCoordenacao: (id: string, data: Partial<Coordenacao>) => Promise<void>;
  deleteCoordenacao: (id: string) => Promise<void>;
  assignSupervisorToCoordenacao: (coordenacaoId: string, supervisorId: string) => Promise<{ success: boolean; message?: string }>;
  removeSupervisorFromCoordenacao: (coordenacaoId: string, supervisorId: string) => Promise<void>;
  addLeitor: (data: Omit<UtilizadorLeitura, 'id' | 'dataCriacao'>) => Promise<UtilizadorLeitura>;
  updateLeitor: (id: string, data: Partial<UtilizadorLeitura>) => Promise<void>;
  toggleLeitorStatus: (id: string) => Promise<void>;
  deleteLeitor: (id: string) => Promise<void>;
  addSubmissao: (sub: Omit<Submissao, 'id' | 'dataEnvio'>) => Promise<Submissao>;
  updateSubmissao: (id: string, updatedData: Partial<Submissao>) => Promise<void>;
  updateSubmissaoStatus: (id: string, status: 'Validado' | 'Pendente' | 'Em Revisão') => Promise<void>;
  deleteSubmissao: (id: string) => Promise<void>;
  deleteMultipleSubmissoes: (ids: string[]) => Promise<{ deleted: number }>;
  clearAllSubmissoes: () => Promise<void>;
  clearAllSupervisores: () => Promise<void>;
  clearAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  resetToInitialData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default fallback admin access code
export const ADMIN_CODE = 'ADM2026';

// Chave para fila de submissões pendentes realizadas offline
const OFFLINE_QUEUE_KEY = 'ms_sumbe_offline_queue_v1';

export const getOfflineQueue = (): Submissao[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

export const saveOfflineQueue = (queue: Submissao[]) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure Firestore-driven state: Never default to demo data unless explicit!
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [submissoes, setSubmissoes] = useState<Submissao[]>(() => {
    // Inicialização segura com as fichas offline salvas para nunca perder dados ao reiniciar
    return getOfflineQueue();
  });
  const [leitores, setLeitores] = useState<UtilizadorLeitura[]>([]);
  const [coordenacoes, setCoordenacoes] = useState<Coordenacao[]>([]);
  const [adminCode, setAdminCode] = useState<string>(ADMIN_CODE);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Estados de Rede e Trabalho Offline
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [offlineSyncToast, setOfflineSyncToast] = useState<string>('');

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

  const [activeScreen, setActiveScreen] = useState<'formulario' | 'dashboard' | 'historico'>(() => {
    try {
      const storedSession = sessionStorage.getItem('ms_sumbe_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        // Para administradores e leitores, a página inicial no acesso e ao atualizar/refresh deve ser sempre o DASHBOARD
        if (parsed?.tipo === 'admin' || parsed?.tipo === 'leitor') {
          return 'dashboard';
        }
      }
      const storedScreen = sessionStorage.getItem('ms_sumbe_screen');
      if (storedScreen === 'formulario' || storedScreen === 'dashboard' || storedScreen === 'historico') {
        return storedScreen;
      }
    } catch {
      // ignore
    }
    return 'formulario';
  });

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

  // Save session in sessionStorage and synchronize default screen
  useEffect(() => {
    try {
      if (userSession) {
        sessionStorage.setItem('ms_sumbe_session', JSON.stringify(userSession));
        if (userSession.tipo === 'admin' || userSession.tipo === 'leitor') {
          sessionStorage.setItem('ms_sumbe_screen', 'dashboard');
        }
      } else {
        sessionStorage.removeItem('ms_sumbe_session');
        sessionStorage.removeItem('ms_sumbe_screen');
      }
    } catch {
      // ignore
    }
  }, [userSession]);

  // Persist current active screen in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('ms_sumbe_screen', activeScreen);
    } catch {
      // ignore
    }
  }, [activeScreen]);

  // Sincronização automática de fichas pendentes guardadas offline
  const syncOfflineSubmissoes = async (): Promise<{ synced: number; failed: number }> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const queue = getOfflineQueue();
    if (queue.length === 0) {
      setOfflineQueueCount(0);
      return { synced: 0, failed: 0 };
    }

    setIsSyncingOffline(true);
    let synced = 0;
    let failed = 0;
    const remaining: Submissao[] = [];

    for (const item of queue) {
      try {
        const itemSynced: Submissao = {
          ...item,
          status: 'Validado',
          offlinePending: false,
        };
        await setDoc(doc(db, 'submissoes', item.id), itemSynced);
        synced++;
        // Atualiza a ficha na lista local para refletir que agora está validada no servidor
        setSubmissoes((prev) =>
          prev.map((s) => (s.id === item.id ? itemSynced : s))
        );
      } catch (err) {
        console.warn('Falha ao sincronizar ficha offline:', item.id, err);
        remaining.push(item);
        failed++;
      }
    }

    saveOfflineQueue(remaining);
    setOfflineQueueCount(remaining.length);
    setIsSyncingOffline(false);

    if (synced > 0) {
      setOfflineSyncToast(
        `${synced} ${synced === 1 ? 'ficha offline enviada' : 'fichas offline enviadas'} com sucesso para a base central!`
      );
      setTimeout(() => setOfflineSyncToast(''), 6000);
    }

    return { synced, failed };
  };

  // Monitor de estado de rede Online/Offline do navegador e telemóvel
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Quando apanha rede, dispara a sincronização automática das fichas pendentes
      syncOfflineSubmissoes();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Tentativa inicial se tiver rede e fichas pendentes no telemóvel
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncOfflineSubmissoes();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firestore Initialization & Realtime Listeners
  useEffect(() => {
    let unsubscribeSupervisores: (() => void) | undefined;
    let unsubscribeSubmissoes: (() => void) | undefined;
    let unsubscribeConfig: (() => void) | undefined;
    let unsubscribeLeitores: (() => void) | undefined;
    let unsubscribeCoordenacoes: (() => void) | undefined;

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
          async (snapshot) => {
            if (snapshot.empty) {
              // Se a coleção de supervisores no Firestore estiver vazia, inicializa com os 9 supervisores reais do Sumbe
              try {
                const batch = writeBatch(db);
                for (const s of INITIAL_SUPERVISORES) {
                  batch.set(doc(db, 'supervisores', s.id), s);
                }
                await batch.commit();
              } catch (e) {
                console.warn('Erro ao inicializar supervisores reais no Firebase:', e);
              }
              setSupervisores(INITIAL_SUPERVISORES);
              setIsLoadingData(false);
              return;
            }

            const loaded: Supervisor[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Supervisor;
              // Reconhecer e preservar as informações reais com que o supervisor foi lançado
              const dias = Math.max(1, Number(data.diasTrabalhoPrevistos) || 5);
              const totalFichas =
                data.totalFichasPrevistas !== undefined && Number(data.totalFichasPrevistas) > 0
                  ? Number(data.totalFichasPrevistas)
                  : (data.fichasDiariasPrevistas
                      ? Number(data.fichasDiariasPrevistas) * dias
                      : 25);
              const diarias =
                data.fichasDiariasPrevistas !== undefined && Number(data.fichasDiariasPrevistas) > 0
                  ? Number(data.fichasDiariasPrevistas)
                  : Math.max(1, Math.round(totalFichas / dias));

              loaded.push({
                ...data,
                diasTrabalhoPrevistos: dias,
                fichasDiariasPrevistas: diarias,
                totalFichasPrevistas: totalFichas,
              });
            });

            // Atualiza estado diretamente do Firestore
            setSupervisores(loaded);
            setIsLoadingData(false);

            // Sincroniza em tempo real a sessão ativa do supervisor para refletir alterações instantaneamente
            setUserSession((prev) => {
              if (prev && prev.tipo === 'supervisor' && prev.supervisor) {
                const live = loaded.find(
                  (s) => s.id === prev.supervisor?.id || s.codigo === prev.codigo
                );
                if (live) {
                  return {
                    ...prev,
                    nome: live.nome,
                    codigo: live.codigo,
                    supervisor: live,
                  };
                }
              }
              return prev;
            });
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
            // Preservar fichas que foram preenchidas offline e aguardam rede para sincronizar
            const queue = getOfflineQueue();
            const pendingOffline = queue.filter(
              (q) => !loaded.some((item) => item.id === q.id)
            );
            const allSubmissoes = [...pendingOffline, ...loaded];
            // Sort by dataEnvio descending
            allSubmissoes.sort(
              (a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
            );
            // ALWAYS update state directly from Firestore snapshot (even if 0 items!)
            setSubmissoes(allSubmissoes);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'submissoes');
          }
        );

        // Attach Real-time listener for Leitores (Utilizadores Só de Leitura)
        unsubscribeLeitores = onSnapshot(
          collection(db, 'leitores'),
          (snapshot) => {
            const loaded: UtilizadorLeitura[] = [];
            snapshot.forEach((docSnap) => {
              loaded.push(docSnap.data() as UtilizadorLeitura);
            });
            setLeitores(loaded);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'leitores');
          }
        );

        // Attach Real-time listener for Coordenacoes (1 a 2 supervisores por coordenação)
        unsubscribeCoordenacoes = onSnapshot(
          collection(db, 'coordenacoes'),
          async (snapshot) => {
            if (snapshot.empty) {
              // Se vazio na primeira execução, carrega as coordenações iniciais do Sumbe
              try {
                const batch = writeBatch(db);
                for (const c of INITIAL_COORDENACOES) {
                  batch.set(doc(db, 'coordenacoes', c.id), c);
                }
                await batch.commit();
              } catch (e) {
                console.warn('Erro ao inicializar coordenações:', e);
              }
              setCoordenacoes(INITIAL_COORDENACOES);
            } else {
              const loaded: Coordenacao[] = [];
              snapshot.forEach((docSnap) => {
                loaded.push(docSnap.data() as Coordenacao);
              });
              setCoordenacoes(loaded);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'coordenacoes');
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
      if (unsubscribeLeitores) unsubscribeLeitores();
      if (unsubscribeCoordenacoes) unsubscribeCoordenacoes();
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

    // 2. Utilizador Só de Leitura (Consulta / Auditoria de Dados)
    const foundLeitor = leitores.find(
      (l) =>
        l.codigo.toLowerCase() === trimmedCode.toLowerCase() ||
        l.nome.toLowerCase() === trimmedCode.toLowerCase()
    );

    if (foundLeitor) {
      if (!foundLeitor.ativo) {
        return {
          success: false,
          message: 'Esta conta de utilizador de leitura encontra-se desativada pela administração.',
        };
      }

      const leitorSession: UserSession = {
        tipo: 'leitor',
        nome: foundLeitor.nome,
        codigo: foundLeitor.codigo,
        leitor: foundLeitor,
      };
      setUserSession(leitorSession);
      setActiveScreen('dashboard');
      return { success: true };
    }

    // 3. Supervisor Login by code only
    const foundSup = supervisores.find(
      (s) =>
        s.codigo.toLowerCase() === trimmedCode.toLowerCase() ||
        s.nome.toLowerCase() === trimmedCode.toLowerCase()
    );

    if (!foundSup) {
      return {
        success: false,
        message: 'Código de utilizador não encontrado. Por favor, verifique o código fornecido pela administração.',
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

  const batchUpdateSupervisoresDias = async (
    novosDias: number,
    defaultFichasDiarias?: number
  ): Promise<{ success: boolean; count: number; totalFichasCampanha: number }> => {
    const validDias = Math.max(1, Number(novosDias) || 5);
    let totalCampanha = 0;

    const updatedList = supervisores.map((s) => {
      // Determina a meta de fichas diárias: se passado defaultFichasDiarias usa ele, senão mantém a do supervisor ou calcula
      const fichasDiarias =
        defaultFichasDiarias !== undefined && defaultFichasDiarias > 0
          ? defaultFichasDiarias
          : (s.fichasDiariasPrevistas || Math.max(1, Math.round((s.totalFichasPrevistas || 25) / (s.diasTrabalhoPrevistos || 5))));

      const totalFichasCalculado = fichasDiarias * validDias;
      totalCampanha += totalFichasCalculado;

      return {
        ...s,
        diasTrabalhoPrevistos: validDias,
        fichasDiariasPrevistas: fichasDiarias,
        totalFichasPrevistas: totalFichasCalculado,
      };
    });

    // Atualização otimista local
    setSupervisores(updatedList);

    // Gravação em lote no Firestore
    try {
      const promises = updatedList.map((sup) =>
        updateDoc(doc(db, 'supervisores', sup.id), {
          diasTrabalhoPrevistos: sup.diasTrabalhoPrevistos,
          fichasDiariasPrevistas: sup.fichasDiariasPrevistas,
          totalFichasPrevistas: sup.totalFichasPrevistas,
        })
      );
      await Promise.all(promises);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'supervisores');
    }

    return {
      success: true,
      count: updatedList.length,
      totalFichasCampanha: totalCampanha,
    };
  };

  // Leitor (Utilizador Só de Leitura) CRUD with Firestore Persistence
  const addLeitor = async (data: Omit<UtilizadorLeitura, 'id' | 'dataCriacao'>): Promise<UtilizadorLeitura> => {
    const newId = `leitor-${Date.now()}`;
    const newLeitor: UtilizadorLeitura = {
      ...data,
      id: newId,
      dataCriacao: new Date().toISOString().split('T')[0],
    };

    setLeitores((prev) => [newLeitor, ...prev]);

    try {
      await setDoc(doc(db, 'leitores', newId), newLeitor);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `leitores/${newId}`);
    }

    return newLeitor;
  };

  const updateLeitor = async (id: string, data: Partial<UtilizadorLeitura>): Promise<void> => {
    setLeitores((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));

    try {
      await updateDoc(doc(db, 'leitores', id), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `leitores/${id}`);
    }
  };

  const toggleLeitorStatus = async (id: string): Promise<void> => {
    const leitor = leitores.find((l) => l.id === id);
    if (!leitor) return;
    await updateLeitor(id, { ativo: !leitor.ativo });
  };

  const deleteLeitor = async (id: string): Promise<void> => {
    setLeitores((prev) => prev.filter((l) => l.id !== id));

    try {
      await deleteDoc(doc(db, 'leitores', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `leitores/${id}`);
    }

    if (userSession?.tipo === 'leitor' && userSession?.leitor?.id === id) {
      logout();
    }
  };

  // Coordenacao CRUD with Firestore Persistence (Cada coordenação tem 1 a 2 supervisores)
  const addCoordenacao = async (data: Omit<Coordenacao, 'id' | 'dataCriacao'>): Promise<Coordenacao> => {
    const newId = `coord-${Date.now()}`;
    const dias = Math.max(1, Number(data.diasTrabalho) || 5);
    const mobilizadores = Math.max(1, Number(data.totalMobilizadores) || 10);
    const fichasPorMob = Math.max(1, Number(data.fichasDiariasPorMobilizador) || 5);
    const totalFichasDiarias = mobilizadores * fichasPorMob;
    const metaFichasTotal = data.metaFichasTotal !== undefined && data.metaFichasTotal > 0
      ? data.metaFichasTotal
      : totalFichasDiarias * dias;
    
    const supIds = (data.supervisorIds || []).slice(0, 2);
    const numSups = Math.max(1, supIds.length);
    const fichasPorSupervisor = Math.round(metaFichasTotal / numSups);
    const fichasDiariasPorSupervisor = Math.max(1, Math.round(totalFichasDiarias / numSups));

    const newCoord: Coordenacao = {
      ...data,
      id: newId,
      limiteSupervisores: 2,
      supervisorIds: supIds,
      diasTrabalho: dias,
      totalMobilizadores: mobilizadores,
      fichasDiariasPorMobilizador: fichasPorMob,
      totalFichasDiarias: totalFichasDiarias,
      metaFichasTotal: metaFichasTotal,
      fichasPorSupervisor: fichasPorSupervisor,
      fichasDiariasPorSupervisor: fichasDiariasPorSupervisor,
      dataCriacao: new Date().toISOString().split('T')[0],
    };

    setCoordenacoes((prev) => [newCoord, ...prev]);

    try {
      await setDoc(doc(db, 'coordenacoes', newId), newCoord);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `coordenacoes/${newId}`);
    }

    // Estruturar e sincronizar imediatamente os supervisores vinculados
    for (const supId of supIds) {
      await updateSupervisor(supId, {
        coordenacao: newCoord.nome,
        coordenacaoId: newId,
        totalFichasPrevistas: fichasPorSupervisor,
        fichasDiariasPrevistas: fichasDiariasPorSupervisor,
        diasTrabalhoPrevistos: dias,
      });
    }

    return newCoord;
  };

  const updateCoordenacao = async (id: string, data: Partial<Coordenacao>): Promise<void> => {
    const existing = coordenacoes.find((c) => c.id === id);
    const dias = Math.max(1, Number(data.diasTrabalho ?? existing?.diasTrabalho ?? 5));
    const mobilizadores = Math.max(1, Number(data.totalMobilizadores ?? existing?.totalMobilizadores ?? 10));
    const fichasPorMob = Math.max(1, Number(data.fichasDiariasPorMobilizador ?? existing?.fichasDiariasPorMobilizador ?? 5));
    const totalFichasDiarias = mobilizadores * fichasPorMob;
    const metaFichasTotal = data.metaFichasTotal !== undefined && data.metaFichasTotal > 0
      ? data.metaFichasTotal
      : totalFichasDiarias * dias;

    const supIds = (data.supervisorIds ?? existing?.supervisorIds ?? []).slice(0, 2);
    const numSups = Math.max(1, supIds.length);
    const fichasPorSupervisor = Math.round(metaFichasTotal / numSups);
    const fichasDiariasPorSupervisor = Math.max(1, Math.round(totalFichasDiarias / numSups));

    const enrichedData: Partial<Coordenacao> = {
      ...data,
      diasTrabalho: dias,
      totalMobilizadores: mobilizadores,
      fichasDiariasPorMobilizador: fichasPorMob,
      totalFichasDiarias: totalFichasDiarias,
      metaFichasTotal: metaFichasTotal,
      fichasPorSupervisor: fichasPorSupervisor,
      fichasDiariasPorSupervisor: fichasDiariasPorSupervisor,
    };

    setCoordenacoes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...enrichedData } : c))
    );

    try {
      await updateDoc(doc(db, 'coordenacoes', id), enrichedData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `coordenacoes/${id}`);
    }

    // Sincronizar estruturação de metas e dias nos supervisores da coordenação
    const coordNome = enrichedData.nome || existing?.nome || 'Coordenação';
    for (const supId of supIds) {
      await updateSupervisor(supId, {
        coordenacao: coordNome,
        coordenacaoId: id,
        totalFichasPrevistas: fichasPorSupervisor,
        fichasDiariasPrevistas: fichasDiariasPorSupervisor,
        diasTrabalhoPrevistos: dias,
      });
    }
  };

  const deleteCoordenacao = async (id: string): Promise<void> => {
    setCoordenacoes((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteDoc(doc(db, 'coordenacoes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `coordenacoes/${id}`);
    }
  };

  const assignSupervisorToCoordenacao = async (
    coordenacaoId: string,
    supervisorId: string
  ): Promise<{ success: boolean; message?: string }> => {
    const targetCoord = coordenacoes.find((c) => c.id === coordenacaoId);
    if (!targetCoord) {
      return { success: false, message: 'Coordenação não encontrada.' };
    }

    if (targetCoord.supervisorIds.includes(supervisorId)) {
      return { success: true, message: 'Supervisor já se encontra atribuído a esta coordenação.' };
    }

    if (targetCoord.supervisorIds.length >= (targetCoord.limiteSupervisores || 2)) {
      return {
        success: false,
        message: `Esta coordenação já tem a lotação completa de ${targetCoord.limiteSupervisores || 2} supervisores (máximo permitido).`,
      };
    }

    const updatedIds = [...targetCoord.supervisorIds, supervisorId];
    await updateCoordenacao(coordenacaoId, { supervisorIds: updatedIds });

    return { success: true };
  };

  const removeSupervisorFromCoordenacao = async (
    coordenacaoId: string,
    supervisorId: string
  ): Promise<void> => {
    const targetCoord = coordenacoes.find((c) => c.id === coordenacaoId);
    if (!targetCoord) return;

    const updatedIds = targetCoord.supervisorIds.filter((id) => id !== supervisorId);
    await updateCoordenacao(coordenacaoId, { supervisorIds: updatedIds });

    const sup = supervisores.find((s) => s.id === supervisorId);
    if (sup && sup.coordenacaoId === coordenacaoId) {
      await updateSupervisor(supervisorId, {
        coordenacao: 'Coordenação Geral Sumbe',
        coordenacaoId: undefined,
      });
    }
  };

  // Submissao CRUD com suporte total a Trabalho Offline e Persistência no Firestore
  const addSubmissao = async (subData: Omit<Submissao, 'id' | 'dataEnvio'>): Promise<Submissao> => {
    const newId = `sub-${Date.now()}`;
    const isCurrentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const newSub: Submissao = {
      ...subData,
      id: newId,
      dataEnvio: new Date().toISOString(),
      offlinePending: !isCurrentlyOnline,
      status: isCurrentlyOnline ? 'Validado' : 'Pendente',
    };

    // Atualização otimista imediata na lista de submissões em memória
    setSubmissoes((prev) => [newSub, ...prev]);

    // Se estiver sem rede (offline), armazena imediatamente na fila segura do telemóvel
    if (!isCurrentlyOnline) {
      const queue = getOfflineQueue();
      queue.push(newSub);
      saveOfflineQueue(queue);
      setOfflineQueueCount(queue.length);
      return newSub;
    }

    // Se estiver online, tenta enviar diretamente para o Firestore
    try {
      await setDoc(doc(db, 'submissoes', newId), newSub);
    } catch (e) {
      // Se a conexão falhar ou cair durante o envio no terreno, guarda na fila offline para não perder nada
      console.warn('Conexão instável durante envio. Guardando ficha com segurança no telemóvel:', e);
      const queue = getOfflineQueue();
      const offlineSub: Submissao = { ...newSub, offlinePending: true, status: 'Pendente' };
      queue.push(offlineSub);
      saveOfflineQueue(queue);
      setOfflineQueueCount(queue.length);
      setSubmissoes((prev) => prev.map((s) => (s.id === newId ? offlineSub : s)));
    }

    return newSub;
  };

  const updateSubmissao = async (
    id: string,
    updatedData: Partial<Submissao>
  ): Promise<void> => {
    // Recalcular métricas consolidadas se as fichas foram alteradas
    let calculatedTotals: Partial<Submissao> = {};
    if (updatedData.fichas) {
      let totalPessoas = 0;
      let totalLocais = 0;
      let totalSim = 0;
      let totalNao = 0;

      const sanitizedFichas = updatedData.fichas.map((f, idx) => {
        const c_casa_l = Number(f.casa_locais) || 0;
        const c_casa_p = Number(f.casa_pessoas) || 0;
        const c_igrejas_l = Number(f.igrejas_locais) || 0;
        const c_igrejas_p = Number(f.igrejas_pessoas) || 0;
        const c_pracas_l = Number(f.pracas_locais) || 0;
        const c_pracas_p = Number(f.pracas_pessoas) || 0;
        const c_paragem_l = Number(f.paragem_locais) || 0;
        const c_paragem_p = Number(f.paragem_pessoas) || 0;
        const c_creches_l = Number(f.creches_locais) || 0;
        const c_creches_p = Number(f.creches_pessoas) || 0;
        const c_escolas_l = Number(f.escolas_locais) || 0;
        const c_escolas_p = Number(f.escolas_pessoas) || 0;
        const c_agua_l = Number(f.agua_locais) || 0;
        const c_agua_p = Number(f.agua_pessoas) || 0;
        const c_outros_l = Number(f.outros_locais) || 0;
        const c_outros_p = Number(f.outros_pessoas) || 0;

        const totalSimFicha =
          c_casa_p +
          c_igrejas_p +
          c_pracas_p +
          c_paragem_p +
          c_creches_p +
          c_escolas_p +
          c_agua_p +
          c_outros_p;

        const totalNaoFicha = Number(f.total_nao) || 0;

        totalPessoas += totalSimFicha;
        totalSim += totalSimFicha;
        totalNao += totalNaoFicha;
        totalLocais +=
          c_casa_l +
          c_igrejas_l +
          c_pracas_l +
          c_paragem_l +
          c_creches_l +
          c_escolas_l +
          c_agua_l +
          c_outros_l;

        return {
          ...f,
          numeroFicha: f.numeroFicha || idx + 1,
          casa_locais: c_casa_l,
          casa_pessoas: c_casa_p,
          igrejas_locais: c_igrejas_l,
          igrejas_pessoas: c_igrejas_p,
          pracas_locais: c_pracas_l,
          pracas_pessoas: c_pracas_p,
          paragem_locais: c_paragem_l,
          paragem_pessoas: c_paragem_p,
          creches_locais: c_creches_l,
          creches_pessoas: c_creches_p,
          escolas_locais: c_escolas_l,
          escolas_pessoas: c_escolas_p,
          agua_locais: c_agua_l,
          agua_pessoas: c_agua_p,
          outros_locais: c_outros_l,
          outros_pessoas: c_outros_p,
          total_sim: totalSimFicha,
          total_nao: totalNaoFicha,
        };
      });

      calculatedTotals = {
        fichas: sanitizedFichas,
        totalPessoas,
        totalLocais,
        totalSim,
        totalNao,
      };
    }

    const payload = {
      ...updatedData,
      ...calculatedTotals,
    };

    // Atualização otimista imediata no estado local
    setSubmissoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...payload } : s))
    );

    // Persistência no Firestore
    try {
      await updateDoc(doc(db, 'submissoes', id), payload);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `submissoes/${id}`);
    }
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

    // Remover também da fila offline persistente caso conste nela
    const currentQueue = getOfflineQueue();
    if (currentQueue.some((s) => s.id === id)) {
      const updatedQueue = currentQueue.filter((s) => s.id !== id);
      saveOfflineQueue(updatedQueue);
      setOfflineQueueCount(updatedQueue.length);
    }

    try {
      await deleteDoc(doc(db, 'submissoes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `submissoes/${id}`);
    }
  };

  const deleteMultipleSubmissoes = async (ids: string[]): Promise<{ deleted: number }> => {
    if (!ids || ids.length === 0) return { deleted: 0 };
    const idSet = new Set(ids);
    setSubmissoes((prev) => prev.filter((s) => !idSet.has(s.id)));

    // Remover também da fila offline
    const currentQueue = getOfflineQueue();
    const updatedQueue = currentQueue.filter((s) => !idSet.has(s.id));
    if (updatedQueue.length !== currentQueue.length) {
      saveOfflineQueue(updatedQueue);
      setOfflineQueueCount(updatedQueue.length);
    }

    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.delete(doc(db, 'submissoes', id));
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'submissoes_batch');
    }
    return { deleted: ids.length };
  };

  // CLEAR ALL SUBMISSIONS (TOTAL AUTHORITY)
  const clearAllSubmissoes = async (): Promise<void> => {
    setSubmissoes([]);
    saveOfflineQueue([]);
    setOfflineQueueCount(0);
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
        leitores,
        coordenacoes,
        userSession,
        adminCode,
        activeScreen,
        isFirebaseConnected,
        isLoadingData,
        isOnline,
        offlineQueueCount,
        isSyncingOffline,
        offlineSyncToast,
        syncOfflineSubmissoes,
        setActiveScreen,
        login,
        logout,
        quickLoginAsSupervisor,
        quickLoginAsAdmin,
        updateAdminCode,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
        batchUpdateSupervisoresDias,
        addCoordenacao,
        updateCoordenacao,
        deleteCoordenacao,
        assignSupervisorToCoordenacao,
        removeSupervisorFromCoordenacao,
        addLeitor,
        updateLeitor,
        toggleLeitorStatus,
        deleteLeitor,
        addSubmissao,
        updateSubmissao,
        updateSubmissaoStatus,
        deleteSubmissao,
        deleteMultipleSubmissoes,
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
