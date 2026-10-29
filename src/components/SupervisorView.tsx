import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FichaAtividade } from '../types';
import { CheckCircle2, Plus, Minus, Send, AlertTriangle, ArrowRight, Printer, Sparkles, Building2, MapPin, Award, CheckCircle, Edit3 } from 'lucide-react';
import { MultiBairroSelector } from './MultiBairroSelector';

interface FichaFormState {
  id: string;
  numeroFicha?: number;
  diaCampanha?: number;
  comuna: string;
  bairro: string;
  casa_locais: number | string;
  casa_pessoas: number | string;
  igrejas_locais: number | string;
  igrejas_pessoas: number | string;
  pracas_locais: number | string;
  pracas_pessoas: number | string;
  paragem_locais: number | string;
  paragem_pessoas: number | string;
  creches_locais: number | string;
  creches_pessoas: number | string;
  escolas_locais: number | string;
  escolas_pessoas: number | string;
  agua_locais: number | string;
  agua_pessoas: number | string;
  outros_locais: number | string;
  outros_pessoas: number | string;
  total_sim: number;
  total_nao: number | string;
}

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SupervisorView: React.FC = () => {
  const {
    userSession,
    supervisores,
    submissoes,
    coordenacoes,
    addSubmissao,
    setActiveScreen,
    isOnline,
    offlineQueueCount,
    isSyncingOffline,
    syncOfflineSubmissoes,
  } = useApp();

  const isSupervisorSession = userSession?.tipo === 'supervisor';

  // Lista de todos os bairros registados no sistema para seleção direta
  const todosBairrosCadastrados = useMemo(() => {
    const bairrosSet = new Set<string>();

    // 1. Extrair de todas as coordenações
    (coordenacoes || []).forEach((c) => {
      (c.bairros || []).forEach((b) => {
        if (b && b.trim()) bairrosSet.add(b.trim());
      });
    });

    // 2. Bairros oficiais do município do Sumbe
    const listaOficialSumbe = [
      'Aeroporto',
      'Amboiva',
      'Baixo Cubal',
      'Bairro Novo',
      'Bela Vista',
      'Bumba',
      'Cafula',
      'Calunga',
      'Cariango',
      'Centro',
      'Chingo',
      'Comércio',
      'E15',
      'Gangula',
      'Kikombo',
      'Litoral',
      'Mercado Central',
      'Paz',
      'Pedra 1',
      'Pedreira',
      'Pescadores',
      'Plateau',
      'Pomba',
      'Porto',
      'Quicombo Rural',
      'Rocha',
      'Salinas',
      'Valódia',
      'Zona Alta',
    ];
    listaOficialSumbe.forEach((b) => bairrosSet.add(b));

    return Array.from(bairrosSet).sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [coordenacoes]);

  // Se Admin estiver a preencher, permitir selecionar o supervisor
  const [selectedAdminSupId, setSelectedAdminSupId] = useState<string>(
    userSession?.supervisor?.id || supervisores[0]?.id || ''
  );

  // Obter o supervisor sempre a partir dos dados atualizados em tempo real do sistema
  const activeSupervisor = useMemo(() => {
    if (isSupervisorSession) {
      return (
        supervisores.find((s) => s.id === userSession?.supervisor?.id || s.codigo === userSession?.codigo) ||
        userSession?.supervisor ||
        supervisores[0]
      );
    }
    return supervisores.find((s) => s.id === selectedAdminSupId) || supervisores[0];
  }, [isSupervisorSession, userSession, supervisores, selectedAdminSupId]);

  // Bairros específicos da coordenação do supervisor ativo com normalização segura
  const bairrosDaMinhaCoordenacao = useMemo(() => {
    if (!activeSupervisor) return [];

    const normalize = (str?: string) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, 'e')
        .replace(/[^a-z0-9]/g, '')
        .trim();

    const supCoordNorm = normalize(activeSupervisor.coordenacao);

    const coord = (coordenacoes || []).find((c) => {
      if (activeSupervisor.coordenacaoId && c.id === activeSupervisor.coordenacaoId) return true;
      if (c.supervisorIds && c.supervisorIds.includes(activeSupervisor.id)) return true;
      const cNomeNorm = normalize(c.nome);
      return (
        (supCoordNorm && cNomeNorm === supCoordNorm) ||
        (supCoordNorm && cNomeNorm.includes(supCoordNorm)) ||
        (cNomeNorm && supCoordNorm.includes(cNomeNorm))
      );
    });

    return (coord?.bairros || []).filter((b) => Boolean(b && b.trim()));
  }, [activeSupervisor, coordenacoes]);

  // Total de fichas que este supervisor já enviou no decorrer de toda a atividade
  const fichasEnviadasAcumuladas = useMemo(() => {
    if (!activeSupervisor?.id) return 0;
    return submissoes
      .filter((s) => s.supervisorId === activeSupervisor.id)
      .reduce((acc, s) => acc + (s.fichas ? s.fichas.length : 0), 0);
  }, [submissoes, activeSupervisor?.id]);

  // Meta real e exata com que o supervisor foi lançado
  const metaFichasSupervisor = useMemo(() => {
    if (!activeSupervisor) return 25;
    if (activeSupervisor.totalFichasPrevistas !== undefined && Number(activeSupervisor.totalFichasPrevistas) > 0) {
      return Number(activeSupervisor.totalFichasPrevistas);
    }
    const dias = Math.max(1, Number(activeSupervisor.diasTrabalhoPrevistos) || 5);
    const diarias = Number(activeSupervisor.fichasDiariasPrevistas) || 5;
    return diarias * dias;
  }, [activeSupervisor]);

  const diasCampanhaSupervisor = Math.max(1, Number(activeSupervisor?.diasTrabalhoPrevistos) || 5);
  const fichasDiariasSupervisor =
    activeSupervisor?.fichasDiariasPrevistas !== undefined && Number(activeSupervisor.fichasDiariasPrevistas) > 0
      ? Number(activeSupervisor.fichasDiariasPrevistas)
      : Math.max(1, Math.round(metaFichasSupervisor / diasCampanhaSupervisor));

  const remessasSupervisor = useMemo(() => {
    if (!activeSupervisor?.id) return 0;
    return submissoes.filter((s) => s.supervisorId === activeSupervisor.id).length;
  }, [submissoes, activeSupervisor?.id]);

  const [dataColeta, setDataColeta] = useState<string>(getTodayString);
  const [diaCampanha, setDiaCampanha] = useState<number>(1);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    dadosSupervisor: false,
    atividades: false,
  });

  const createBlankFicha = (index: number): FichaFormState => ({
    id: `temp-${Date.now()}-${index}`,
    numeroFicha: index,
    diaCampanha: diaCampanha,
    comuna: activeSupervisor?.comuna || 'Sede',
    bairro: '',
    casa_locais: '',
    casa_pessoas: '',
    igrejas_locais: '',
    igrejas_pessoas: '',
    pracas_locais: '',
    pracas_pessoas: '',
    paragem_locais: '',
    paragem_pessoas: '',
    creches_locais: '',
    creches_pessoas: '',
    escolas_locais: '',
    escolas_pessoas: '',
    agua_locais: '',
    agua_pessoas: '',
    outros_locais: '',
    outros_pessoas: '',
    total_sim: 0,
    total_nao: '',
  });

  const [fichas, setFichas] = useState<FichaFormState[]>([createBlankFicha(1)]);
  const [draftNotice, setDraftNotice] = useState<boolean>(false);
  const [draftRecoveredTime, setDraftRecoveredTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeFichaTab, setActiveFichaTab] = useState<number>(0);
  const [submittedModalData, setSubmittedModalData] = useState<{
    id: string;
    totalPessoas: number;
    totalLocais: number;
    totalFichas: number;
    bairros: string[];
  } | null>(null);

  // Chave persistente no telemóvel por supervisor (sobrevive ao fechar navegador e fim de bateria)
  const draftStorageKey = useMemo(() => {
    return `ms_sumbe_persistent_draft_${activeSupervisor?.id || 'default'}`;
  }, [activeSupervisor?.id]);

  // Recuperar dados persistentes salvos caso o telemóvel tenha desligado ou a janela tenha sido fechada
  useEffect(() => {
    try {
      let saved = localStorage.getItem(draftStorageKey);
      if (!saved) {
        // Compatibilidade com sessões anteriores
        saved = sessionStorage.getItem('ms_sumbe_ficha_draft') || localStorage.getItem('ms_sumbe_ficha_draft');
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fichas && Array.isArray(parsed.fichas) && parsed.fichas.length > 0) {
          // Verificar se tem pelo menos algum dado preenchido
          const hasData = parsed.fichas.some(
            (f: FichaFormState) =>
              (f.bairro && f.bairro.trim() !== '') ||
              Number(f.total_sim) > 0 ||
              (f.total_nao !== '' && f.total_nao !== 0 && f.total_nao !== '0')
          );

          if (hasData) {
            setFichas(parsed.fichas);
            if (parsed.dataColeta) setDataColeta(parsed.dataColeta);
            if (parsed.diaCampanha) setDiaCampanha(parsed.diaCampanha);
            if (parsed.savedAtTime) {
              setDraftRecoveredTime(parsed.savedAtTime);
            } else if (parsed.timestamp) {
              try {
                setDraftRecoveredTime(
                  new Date(parsed.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
                );
              } catch {
                setDraftRecoveredTime('');
              }
            }
            setDraftNotice(true);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar rascunho:', e);
    }
  }, [draftStorageKey]);

  // Salvar rascunho automaticamente no localStorage a cada alteração
  useEffect(() => {
    try {
      const hasContent = fichas.some((f) => f.bairro || Number(f.total_sim) > 0 || f.total_nao !== '');
      if (hasContent) {
        const now = new Date();
        const payload = {
          fichas,
          dataColeta,
          diaCampanha,
          timestamp: now.toISOString(),
          savedAtTime: now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      }
    } catch {
      // ignore
    }
  }, [fichas, dataColeta, diaCampanha, draftStorageKey]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(draftStorageKey);
      sessionStorage.removeItem('ms_sumbe_ficha_draft');
      localStorage.removeItem('ms_sumbe_ficha_draft');
    } catch {
      // ignore
    }
    setFichas([createBlankFicha(1)]);
    setDraftNotice(false);
    setDraftRecoveredTime('');
  };

  // Totais em tempo real deste lote de fichas
  const liveBatchTotals = useMemo(() => {
    let locais = 0;
    let sim = 0;
    let nao = 0;
    fichas.forEach((f) => {
      locais +=
        (Number(f.casa_locais) || 0) +
        (Number(f.igrejas_locais) || 0) +
        (Number(f.pracas_locais) || 0) +
        (Number(f.paragem_locais) || 0) +
        (Number(f.creches_locais) || 0) +
        (Number(f.escolas_locais) || 0) +
        (Number(f.agua_locais) || 0) +
        (Number(f.outros_locais) || 0);
      sim += Number(f.total_sim) || 0;
      nao += Number(f.total_nao) || 0;
    });
    return {
      locais,
      sim,
      nao,
      totalPessoas: sim + nao,
    };
  }, [fichas]);

  // Sync default comuna when active supervisor changes
  useEffect(() => {
    if (activeSupervisor) {
      setFichas((prev) =>
        prev.map((f, idx) => ({
          ...f,
          comuna: idx === 0 && (!f.comuna || f.comuna === 'Sede') ? activeSupervisor.comuna : f.comuna || activeSupervisor.comuna,
        }))
      );
    }
  }, [activeSupervisor]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const calculateTotalSim = (ficha: FichaFormState): number => {
    return (
      (Number(ficha.casa_pessoas) || 0) +
      (Number(ficha.igrejas_pessoas) || 0) +
      (Number(ficha.pracas_pessoas) || 0) +
      (Number(ficha.paragem_pessoas) || 0) +
      (Number(ficha.creches_pessoas) || 0) +
      (Number(ficha.escolas_pessoas) || 0) +
      (Number(ficha.agua_pessoas) || 0) +
      (Number(ficha.outros_pessoas) || 0)
    );
  };

  const handleInputChange = (
    index: number,
    field: keyof FichaFormState,
    value: string | number
  ) => {
    setFichas((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'bairro' || field === 'comuna') {
        target[field] = value as string;
      } else {
        const strVal = String(value ?? '').trim();
        if (strVal === '') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any)[field] = '';
        } else {
          const numVal = parseInt(strVal, 10);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any)[field] = isNaN(numVal) ? '' : Math.max(0, numVal);
        }
      }

      // Recompute total_sim automatically
      target.total_sim = calculateTotalSim(target);

      updated[index] = target;
      return updated;
    });
  };

  const addActivityBlock = () => {
    const nextFicha = createBlankFicha(fichas.length + 1);
    setFichas((prev) => [...prev, nextFicha]);
  };

  const removeActivityBlock = () => {
    if (fichas.length > 1) {
      setFichas((prev) => prev.slice(0, prev.length - 1));
    } else {
      alert('Deve haver pelo menos uma ficha preenchida.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSupervisor) {
      alert('Nenhum supervisor selecionado.');
      return;
    }

    // Validation: Check that every ficha has a Bairro
    for (let i = 0; i < fichas.length; i++) {
      if (!fichas[i].bairro.trim()) {
        alert(`Por favor, indique o Bairro/Aldeia na Ficha ${i + 1}.`);
        return;
      }
    }

    const finalFichas: FichaAtividade[] = fichas.map((f, idx) => ({
      id: `f-${Date.now()}-${idx + 1}`,
      numeroFicha: idx + 1,
      diaCampanha: diaCampanha,
      comuna: f.comuna || activeSupervisor.comuna || 'Sede',
      bairro: f.bairro.trim(),
      casa_locais: Number(f.casa_locais) || 0,
      casa_pessoas: Number(f.casa_pessoas) || 0,
      igrejas_locais: Number(f.igrejas_locais) || 0,
      igrejas_pessoas: Number(f.igrejas_pessoas) || 0,
      pracas_locais: Number(f.pracas_locais) || 0,
      pracas_pessoas: Number(f.pracas_pessoas) || 0,
      paragem_locais: Number(f.paragem_locais) || 0,
      paragem_pessoas: Number(f.paragem_pessoas) || 0,
      creches_locais: Number(f.creches_locais) || 0,
      creches_pessoas: Number(f.creches_pessoas) || 0,
      escolas_locais: Number(f.escolas_locais) || 0,
      escolas_pessoas: Number(f.escolas_pessoas) || 0,
      agua_locais: Number(f.agua_locais) || 0,
      agua_pessoas: Number(f.agua_pessoas) || 0,
      outros_locais: Number(f.outros_locais) || 0,
      outros_pessoas: Number(f.outros_pessoas) || 0,
      total_sim: Number(f.total_sim) || 0,
      total_nao: Number(f.total_nao) || 0,
    }));

    let totalPessoas = 0;
    let totalLocais = 0;
    let totalSim = 0;
    let totalNao = 0;

    finalFichas.forEach((f) => {
      totalPessoas += f.total_sim;
      totalSim += f.total_sim;
      totalNao += Number(f.total_nao) || 0;
      totalLocais +=
        Number(f.casa_locais) +
        Number(f.igrejas_locais) +
        Number(f.pracas_locais) +
        Number(f.paragem_locais) +
        Number(f.creches_locais) +
        Number(f.escolas_locais) +
        Number(f.agua_locais) +
        Number(f.outros_locais);
    });

    if (isSubmitting) return;

    // Proteção contra duplicação acidental: verificar se o supervisor já lançou ficha com dados idênticos nesta mesma data
    const existingSameDay = submissoes.filter(
      (s) => s.supervisorId === activeSupervisor.id && s.data === dataColeta
    );
    const candidateBairros = finalFichas.map((f) => f.bairro.toLowerCase().trim()).sort().join(',');
    const potentialDuplicate = existingSameDay.find((s) => {
      const existingBairros = (s.fichas || []).map((f) => f.bairro.toLowerCase().trim()).sort().join(',');
      return (
        s.totalSim === totalSim &&
        (existingBairros === candidateBairros || (s.fichas && s.fichas.length === finalFichas.length))
      );
    });

    if (potentialDuplicate) {
      const horaEnvio = potentialDuplicate.dataEnvio
        ? new Date(potentialDuplicate.dataEnvio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        : 'anteriormente';
      const confirmDuplicate = window.confirm(
        `⚠️ ATENÇÃO: DUPLICAÇÃO DETECTADA!\n\nJá existe uma ficha lançada por ${activeSupervisor.nome} para o dia ${dataColeta} (enviada ${horaEnvio}) com os mesmos dados (${totalSim} pessoas Sim e ${finalFichas.length} fichas).\n\nDeseja realmente submeter esta ficha novamente ou prefere cancelar para evitar duplicação de dados?`
      );
      if (!confirmDuplicate) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newSubmissao = await addSubmissao({
        supervisorId: activeSupervisor.id,
        supervisorNome: activeSupervisor.nome,
        provincia: activeSupervisor.provincia || 'Cuanza-Sul',
        municipio: activeSupervisor.municipio || 'Sumbe',
        data: dataColeta,
        diaCampanha: diaCampanha,
        fichas: finalFichas,
        totalPessoas,
        totalLocais,
        totalSim,
        totalNao,
        status: 'Validado',
      });

      // Limpar rascunho persistente guardado após envio com sucesso
      try {
        localStorage.removeItem(draftStorageKey);
        sessionStorage.removeItem('ms_sumbe_ficha_draft');
        localStorage.removeItem('ms_sumbe_ficha_draft');
      } catch {
        // ignore
      }
      setDraftNotice(false);
      setDraftRecoveredTime('');

      setSubmittedModalData({
        id: newSubmissao.id,
        totalPessoas,
        totalLocais,
        totalFichas: finalFichas.length,
        bairros: finalFichas.map((f) => f.bairro),
      });

      // Reset form to 1 blank ficha with current supervisor comuna
      setFichas([createBlankFicha(1)]);
      setActiveFichaTab(0);
    } catch (err) {
      console.error('Erro ao submeter fichas:', err);
      alert('Ocorreu um erro ao enviar as fichas. Por favor, verifique a ligação e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="supervisor-view" className="py-4 sm:py-6 px-3 sm:px-4 md:px-6 relative min-h-screen">
      {/* Contador Flutuante de Fichas (Posicionado sem tapar textos no telemóvel) */}
      <div id="ficha-counter" title="Número de fichas neste lote atual">
        <span>📋</span> Fichas no lote: <span id="counter-value">{fichas.length}</span>
      </div>

      {/* PAINEL SUPERIOR EM DESTAQUE: QUANTAS FICHAS JÁ ENVIOU NO DECORRER DA ATIVIDADE */}
      <div className="max-w-[900px] mx-auto mb-4">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-[#1a53db] text-white p-3.5 sm:p-5 rounded-2xl shadow-md border border-blue-400/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
            {/* Bloco de Informações do Supervisor e Fichas */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 mt-0.5 sm:mt-0">
                📋
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-blue-200 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="truncate">Fichas Enviadas na Atividade</span>
                </div>
                <div className="text-xl sm:text-3xl font-black text-white flex flex-wrap items-baseline gap-1.5 sm:gap-2 mt-0.5 leading-tight">
                  <span>{fichasEnviadasAcumuladas}</span>
                  <span className="text-xs sm:text-sm font-semibold text-blue-100">
                    {fichasEnviadasAcumuladas === 1 ? 'ficha enviada' : 'fichas enviadas'} no decorrer da atividade
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100/85 mt-1 leading-snug">
                  Supervisor: <strong className="text-white">{activeSupervisor?.nome}</strong> ({activeSupervisor?.codigo}) &bull; Comuna: <strong className="text-white">{activeSupervisor?.comuna || 'Sede'}</strong>
                  {activeSupervisor?.coordenacao && (
                    <span className="block xs:inline"> &bull; Coordenação: <strong className="text-white">{activeSupervisor.coordenacao}</strong></span>
                  )}
                </p>
              </div>
            </div>

            {/* Meta e Ações Responsivas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-3 sm:px-3.5 py-2 rounded-xl border border-white/15 flex sm:flex-col justify-between sm:justify-center items-center sm:text-center">
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-200">Meta Atribuída</div>
                  <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 sm:block">
                    <span>{metaFichasSupervisor} fichas</span>
                    <span className="text-[10px] text-blue-200/90 font-medium sm:block">
                      ({fichasDiariasSupervisor}/dia &bull; {diasCampanhaSupervisor}d)
                    </span>
                  </div>
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-300 font-extrabold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-400/30 sm:mt-0.5">
                  {metaFichasSupervisor > 0 ? ((fichasEnviadasAcumuladas / metaFichasSupervisor) * 100).toFixed(0) : 0}% da meta
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => setActiveScreen('historico')}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
                  title="Corrigir ou editar fichas lançadas anteriormente"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                  <span className="truncate">Editar Fichas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScreen('historico')}
                  className="bg-white text-[#1a53db] hover:bg-blue-50 font-bold px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
                  title="Consultar fichas já enviadas"
                >
                  <span className="truncate">Ver Histórico</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {fichasEnviadasAcumuladas > 0 && (
          <div className="mt-2.5 sm:mt-3 bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[11px] sm:text-xs leading-snug">
                <strong>Lançou dados com erro?</strong> Pode editar e retificar qualquer ficha já enviada a qualquer momento.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('historico')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs shrink-0 cursor-pointer transition shadow-2xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Corrigir Lançamento Anterior</span>
            </button>
          </div>
        )}

        {/* BANNER 1: MODO OFFLINE DETETADO */}
        {!isOnline && (
          <div className="mt-2.5 sm:mt-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm border border-amber-500">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📴</span>
              <div className="text-xs leading-snug">
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <span>Modo Offline Ativo (Sem Rede)</span>
                  <span className="bg-amber-800/80 text-[10px] uppercase tracking-wide font-black px-2 py-0.5 rounded-full">
                    Gravação Local
                  </span>
                </div>
                <div className="text-amber-100 mt-0.5">
                  Está sem ligação à internet. Não se preocupe! Pode continuar a preencher e carregar em <strong>"Enviar Ficha"</strong>. Ficará guardada em segurança no telemóvel e enviará automaticamente à coordenação assim que apanhar rede.
                </div>
              </div>
            </div>
            {offlineQueueCount > 0 && (
              <div className="bg-amber-900/60 border border-amber-400/40 text-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 text-center">
                {offlineQueueCount} {offlineQueueCount === 1 ? 'ficha pendente' : 'fichas pendentes'}
              </div>
            )}
          </div>
        )}

        {/* BANNER 2: FICHAS GUARDADAS OFFLINE PRONTAS PARA ENVIAR COM SINAL DETETADO */}
        {offlineQueueCount > 0 && isOnline && (
          <div className="mt-2.5 sm:mt-3 bg-blue-50 border border-blue-300 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📦</span>
              <div className="leading-snug">
                <div className="font-extrabold text-sm text-[#1a53db] flex items-center gap-2">
                  <span>
                    {offlineQueueCount} {offlineQueueCount === 1 ? 'remessa gravada' : 'remessas gravadas'} no telemóvel
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Sinal Disponível
                  </span>
                </div>
                <div className="text-blue-800 mt-0.5">
                  Ligação restabelecida. Pode sincronizar agora com o servidor central da coordenação.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => syncOfflineSubmissoes()}
              disabled={isSyncingOffline}
              className="bg-[#1a53db] hover:bg-[#1848c4] text-white font-extrabold px-3.5 py-2 rounded-lg text-xs shrink-0 cursor-pointer transition shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSyncingOffline ? 'A sincronizar...' : '🔄 Sincronizar Agora'}</span>
            </button>
          </div>
        )}

        {/* BANNER 3: RECUPERAÇÃO AUTOMÁTICA DE DADOS (SOBREVIVE AO FECHAR OU FIM DE BATERIA) */}
        {draftNotice && (
          <div className="mt-2.5 sm:mt-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔋</span>
              <div className="leading-snug">
                <div className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
                  <span>Recuperação Automática: Trabalho Protegido!</span>
                  {draftRecoveredTime && (
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                      Salvo às {draftRecoveredTime}
                    </span>
                  )}
                </div>
                <div className="text-emerald-800 mt-0.5">
                  Recuperámos os dados que estava a preencher antes do telemóvel desligar por falta de carga ou fechar a janela. Pode continuar a preencher sem perder nada.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDraftNotice(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-2xs"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-rose-700 hover:text-rose-900 font-bold underline text-xs cursor-pointer px-1"
                title="Descartar rascunho e começar ficha vazia"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra Superior */}
      <div className="top-bar">
        <div className="logo">
          MS<span>-sumbe</span>
        </div>
        <div className="user-profile-badge" title="Supervisor com sessão iniciada">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
          <span className="truncate">Supervisor: {activeSupervisor ? activeSupervisor.nome : 'Não identificado'}</span>
        </div>
      </div>

      {/* Formulário Principal */}
      <main className="form-container">
        <header className="form-header">
          <h1>Mobilização Social</h1>
          <div className="header-info">
            PROGRAMA DE MOBILIZAÇÃO SOCIAL DO SUMBE<br />
            COLETA DE DADOS DA MOBILIZAÇÃO
            <span className="slogan">JUNTOS SOMOS MAIS FORTES</span>
          </div>
        </header>

        <form id="mobilizacaoForm" onSubmit={handleSubmit}>
          {/* SEÇÃO 1: DADOS DO SUPERVISOR */}
          <section className="section">
            <div
              className={`section-title ${collapsedSections.dadosSupervisor ? 'collapsed' : ''}`}
              onClick={() => toggleSection('dadosSupervisor')}
            >
              Dados do Supervisor (Preenchido pelo Sistema)
            </div>
            {!collapsedSections.dadosSupervisor && (
              <div className="section-content bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Província / Município</label>
                    <input
                      type="text"
                      value={`${activeSupervisor?.provincia || 'Cuanza-Sul'} / ${activeSupervisor?.municipio || 'Sumbe'}`}
                      readOnly
                      title="Província e Município configurados no seu cadastro"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nome do Supervisor</label>
                    {isSupervisorSession ? (
                      /* Nome fixo e bloqueado baseado no cadastro do supervisor - evita reescrever */
                      <input
                        type="text"
                        name="supervisor"
                        value={activeSupervisor?.nome || 'Carregando...'}
                        readOnly
                        title="O seu nome é fixo e preenchido automaticamente pelo sistema"
                      />
                    ) : (
                      /* Administrador a preencher: pode selecionar qualquer supervisor cadastrado */
                      <select
                        value={selectedAdminSupId}
                        onChange={(e) => setSelectedAdminSupId(e.target.value)}
                        className="font-bold text-slate-800 bg-[#eff4ff] border-[#bfdbfe]"
                        title="Como administrador, selecione o supervisor atribuído à ficha"
                      >
                        {supervisores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome} ({s.comuna} - {s.codigo})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
                  <div className="form-group">
                    <label>
                      <span className="required">*</span> Data de Coleta
                    </label>
                    <input
                      type="date"
                      name="data"
                      value={dataColeta}
                      onChange={(e) => setDataColeta(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span className="required">*</span> Dia de Trabalho da Campanha
                    </label>
                    <select
                      value={diaCampanha}
                      onChange={(e) => setDiaCampanha(Number(e.target.value))}
                      className="font-bold text-[#1a53db] bg-white border border-slate-300 rounded px-3 py-2 text-sm"
                      title="Indique a qual dia de trabalho da mobilização correspondem estas fichas"
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Dia {d} de Trabalho {d === 1 ? '(Início)' : d > 5 ? '(Fase Alargada)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Comuna Base de Atuação</label>
                    <div className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-300 rounded px-3 py-2">
                      <MapPin className="w-4 h-4 text-[#2667ff] shrink-0" />
                      <span className="font-semibold text-blue-950">
                        {activeSupervisor?.comuna || 'Sede'}
                      </span>
                      <span className="text-xs text-slate-400">
                        (Sumbe)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SEÇÃO 2: ATIVIDADES NOS BAIRROS */}
          <section className="section">
            <div
              className={`section-title ${collapsedSections.atividades ? 'collapsed' : ''}`}
              onClick={() => toggleSection('atividades')}
            >
              Atividades nos Bairros
            </div>

            {!collapsedSections.atividades && (
              <div className="section-content activities-section">
                {/* Abas Rápidas de Navegação entre Fichas do Lote */}
                {fichas.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 pt-1 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Saltar para:</span>
                    {fichas.map((f, idx) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`ficha-block-${idx}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Ficha {idx + 1} {f.bairro ? `(${f.bairro})` : ''}
                      </button>
                    ))}
                  </div>
                )}

                {fichas.map((ficha, index) => (
                  <div key={ficha.id} id={`ficha-block-${index}`} className="activity-block">
                    <div className="ficha-header flex items-center justify-between">
                      <span>Ficha <span className="ficha-number">{index + 1}</span></span>
                      {fichas.length > 1 && (
                        <span className="text-xs font-normal text-slate-400">
                          {index + 1} de {fichas.length}
                        </span>
                      )}
                    </div>

                    <div className="activities-grid">
                      {/* Comuna: pré-definida pelo Admin */}
                      <div className="form-group full-width">
                        <label>
                          <span className="required">*</span> Comuna
                        </label>
                        <input
                          type="text"
                          name="comuna[]"
                          value={ficha.comuna}
                          onChange={(e) => handleInputChange(index, 'comuna', e.target.value)}
                          placeholder="Ex: Sede"
                          required
                        />
                      </div>

                      {/* Bairro / Aldeia - Multi-seleção que abre ao clicar (sem ocupar espaço na tela) */}
                      <div className="form-group full-width">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-800 text-xs sm:text-sm">
                            <span className="required">*</span> Bairro(s) / Aldeia(s) de Atuação
                          </label>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-[#1a53db] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            Pode marcar mais de 1 bairro
                          </span>
                        </div>

                        <MultiBairroSelector
                          value={ficha.bairro}
                          onChange={(newBairros) => handleInputChange(index, 'bairro', newBairros)}
                          todosBairros={todosBairrosCadastrados}
                          bairrosCoordenacao={bairrosDaMinhaCoordenacao}
                          coordenacaoNome={activeSupervisor?.coordenacao}
                          apenasCoordenacao={true}
                          required={true}
                          placeholder="Clique aqui para marcar os bairros visitados..."
                        />

                        {activeSupervisor?.coordenacao && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            <span>Coordenação do Supervisor: </span>
                            <strong className="text-slate-800">{activeSupervisor.coordenacao}</strong>
                          </div>
                        )}
                      </div>

                      {/* 1. Casa a casa */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Casa a casa - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="casa_locais[]"
                          min="0"
                          value={ficha.casa_locais === 0 || ficha.casa_locais === '0' ? '' : ficha.casa_locais}
                          onChange={(e) => handleInputChange(index, 'casa_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Casa a casa - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="casa_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.casa_pessoas === 0 || ficha.casa_pessoas === '0' ? '' : ficha.casa_pessoas}
                          onChange={(e) => handleInputChange(index, 'casa_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 2. Igrejas */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Igrejas - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="igrejas_locais[]"
                          min="0"
                          value={ficha.igrejas_locais === 0 || ficha.igrejas_locais === '0' ? '' : ficha.igrejas_locais}
                          onChange={(e) => handleInputChange(index, 'igrejas_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Igrejas - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="igrejas_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.igrejas_pessoas === 0 || ficha.igrejas_pessoas === '0' ? '' : ficha.igrejas_pessoas}
                          onChange={(e) => handleInputChange(index, 'igrejas_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 3. Praças/Mercados */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Praças/Mercados - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="pracas_locais[]"
                          min="0"
                          value={ficha.pracas_locais === 0 || ficha.pracas_locais === '0' ? '' : ficha.pracas_locais}
                          onChange={(e) => handleInputChange(index, 'pracas_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Praças/Mercados - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="pracas_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.pracas_pessoas === 0 || ficha.pracas_pessoas === '0' ? '' : ficha.pracas_pessoas}
                          onChange={(e) => handleInputChange(index, 'pracas_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 4. Paragem de taxi */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Paragem de taxi - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="paragem_locais[]"
                          min="0"
                          value={ficha.paragem_locais === 0 || ficha.paragem_locais === '0' ? '' : ficha.paragem_locais}
                          onChange={(e) => handleInputChange(index, 'paragem_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Paragem de taxi - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="paragem_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.paragem_pessoas === 0 || ficha.paragem_pessoas === '0' ? '' : ficha.paragem_pessoas}
                          onChange={(e) => handleInputChange(index, 'paragem_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 5. Creches */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Creches - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="creches_locais[]"
                          min="0"
                          value={ficha.creches_locais === 0 || ficha.creches_locais === '0' ? '' : ficha.creches_locais}
                          onChange={(e) => handleInputChange(index, 'creches_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Creches - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="creches_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.creches_pessoas === 0 || ficha.creches_pessoas === '0' ? '' : ficha.creches_pessoas}
                          onChange={(e) => handleInputChange(index, 'creches_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 6. Escolas */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Escolas - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="escolas_locais[]"
                          min="0"
                          value={ficha.escolas_locais === 0 || ficha.escolas_locais === '0' ? '' : ficha.escolas_locais}
                          onChange={(e) => handleInputChange(index, 'escolas_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Escolas - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="escolas_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.escolas_pessoas === 0 || ficha.escolas_pessoas === '0' ? '' : ficha.escolas_pessoas}
                          onChange={(e) => handleInputChange(index, 'escolas_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 7. Ponto de água */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Ponto de água - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="agua_locais[]"
                          min="0"
                          value={ficha.agua_locais === 0 || ficha.agua_locais === '0' ? '' : ficha.agua_locais}
                          onChange={(e) => handleInputChange(index, 'agua_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Ponto de água - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="agua_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.agua_pessoas === 0 || ficha.agua_pessoas === '0' ? '' : ficha.agua_pessoas}
                          onChange={(e) => handleInputChange(index, 'agua_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* 8. Outros */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Outros - locais
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="outros_locais[]"
                          min="0"
                          value={ficha.outros_locais === 0 || ficha.outros_locais === '0' ? '' : ficha.outros_locais}
                          onChange={(e) => handleInputChange(index, 'outros_locais', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Outros - pessoas
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="outros_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.outros_pessoas === 0 || ficha.outros_pessoas === '0' ? '' : ficha.outros_pessoas}
                          onChange={(e) => handleInputChange(index, 'outros_pessoas', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>

                      {/* Total de Sim e Total de Não */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Total de Sim (Calculado automaticamente)
                        </label>
                        <input
                          type="number"
                          name="total_sim[]"
                          value={ficha.total_sim}
                          readOnly
                          title="Soma automática de todas as pessoas desta ficha"
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Total de Não
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          name="total_nao[]"
                          min="0"
                          value={ficha.total_nao === 0 || ficha.total_nao === '0' ? '' : ficha.total_nao}
                          onChange={(e) => handleInputChange(index, 'total_nao', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botões de Adicionar e Remover Ficha */}
                <div className="btn-add-remove">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={removeActivityBlock}
                    title="Remover última ficha"
                    disabled={fichas.length <= 1}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={addActivityBlock}
                    title="Adicionar nova ficha de atividade"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Contabilização e Resumo em Tempo Real do Lote */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200 p-4 rounded-xl space-y-3 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-lg">
                  📋
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {fichas.length} {fichas.length === 1 ? 'Ficha neste lote a ser lançada' : 'Fichas neste lote a serem lançadas'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Fichas anteriores: <strong>{fichasEnviadasAcumuladas}</strong> &bull; Total acumulado após envio: <strong className="text-blue-900">{fichasEnviadasAcumuladas + fichas.length} fichas</strong>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-mono font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs">
                  <span>Lote Atual:</span>
                  <span className="text-sm bg-white/20 px-1.5 py-0.5 rounded">{fichas.length} {fichas.length === 1 ? 'ficha' : 'fichas'}</span>
                </span>
              </div>
            </div>

            {/* Somatório em Tempo Real dos Dados Digitados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/60 text-xs">
              <div className="bg-white p-2 rounded-lg border border-blue-100 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Locais no Lote</div>
                <div className="font-mono font-extrabold text-slate-900 text-sm">{liveBatchTotals.locais}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Mobilizados (Sim)</div>
                <div className="font-mono font-extrabold text-emerald-800 text-sm">{liveBatchTotals.sim}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-rose-100 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-rose-700">Recusas (Não)</div>
                <div className="font-mono font-extrabold text-rose-800 text-sm">{liveBatchTotals.nao}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-indigo-700">Total Abordadas</div>
                <div className="font-mono font-extrabold text-indigo-900 text-sm">{liveBatchTotals.totalPessoas}</div>
              </div>
            </div>
          </div>

          {/* Ações do Formulário com Proteção contra Duplo Clique */}
          <div className="form-actions mt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn btn-primary ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              title="Enviar para a base do Administrador"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'A Sincronizar com o Firebase...'
                  : `➡️ Lançar ${fichas.length} ${fichas.length === 1 ? 'Ficha' : 'Fichas'} para o Administrador`}
              </span>
            </button>
          </div>
        </form>
      </main>

      {/* MODAL DE SUCESSO APÓS SUBMISSÃO */}
      {submittedModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900 mb-1">
              {submittedModalData.totalFichas} {submittedModalData.totalFichas === 1 ? 'Ficha Lançada' : 'Fichas Lançadas'} com Sucesso!
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              O seu envio foi registado no Firebase e já se encontra contabilizado na base central.
            </p>

            <div className="bg-[#eff4ff] border border-[#bfdbfe] rounded-xl p-4 mb-6 space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Supervisor:</span>
                <span className="font-semibold text-slate-900">{activeSupervisor?.nome}</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Fichas Deste Lote:</span>
                <span className="font-extrabold text-[#1a53db] text-base">{submittedModalData.totalFichas} ficha(s)</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5 bg-blue-100/60 -mx-4 px-4 py-1.5">
                <span className="text-blue-900 font-bold">Total Acumulado na Atividade:</span>
                <span className="font-mono font-black text-blue-950 text-base">{fichasEnviadasAcumuladas} fichas enviadas</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Total Pessoas Alcançadas:</span>
                <span className="font-bold text-[#1b4fd8] text-base">{submittedModalData.totalPessoas.toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Locais Visitados:</span>
                <span className="font-semibold text-slate-900">{submittedModalData.totalLocais}</span>
              </div>
              <div className="flex justify-between items-start pt-1 gap-2">
                <span className="text-slate-600 shrink-0">Bairros:</span>
                <span className="font-semibold text-slate-900 text-right text-xs break-words max-w-[220px]">
                  {submittedModalData.bairros.join(', ')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setSubmittedModalData(null)}
                className="w-full py-3 px-4 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold text-sm shadow-md transition cursor-pointer"
              >
                Preencher Nova Coleta
              </button>

              {userSession?.tipo === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedModalData(null);
                    setActiveScreen('dashboard');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <span>Voltar ao Painel do Administrador</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedModalData(null);
                    setActiveScreen('historico');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <span>Ver Minhas Fichas Enviadas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
