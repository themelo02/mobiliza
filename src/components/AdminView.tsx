import React, { useState, useMemo } from 'react';
import { useApp, ADMIN_CODE } from '../context/AppContext';
import { Supervisor, Submissao, COMUNAS_SUMBE, UtilizadorLeitura } from '../types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Settings,
  Plus,
  Eye,
  FileText,
  Download,
  Printer,
  Search,
  MapPin,
  TrendingUp,
  Building,
  UserCheck,
  ChevronRight,
  Trash2,
  Layers,
  Phone,
  KeyRound,
  RotateCcw,
  BarChart3,
  PieChart as PieIcon,
  Compass,
  Database,
  CloudCheck,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Copy,
  Shield,
  Lock,
  Calendar,
  CalendarDays,
  Target,
  Award,
  CheckSquare,
  Clock,
  Edit3,
} from 'lucide-react';

const COLORS_9_SUPERVISORES = [
  '#2667ff', // Sumbe Electric Blue (Nova cor primária)
  '#0284c7', // Sky Blue
  '#16a34a', // Emerald Green
  '#d97706', // Amber Gold
  '#9333ea', // Royal Purple
  '#db2777', // Rose Pink
  '#0d9488', // Teal Cyan
  '#6366f1', // Indigo Blue
  '#4f46e5', // Deep Indigo
];

export const AdminView: React.FC = () => {
  const {
    supervisores,
    submissoes,
    leitores,
    userSession,
    adminCode,
    updateAdminCode,
    addSupervisor,
    updateSupervisor,
    deleteSupervisor,
    addLeitor,
    updateLeitor,
    toggleLeitorStatus,
    deleteLeitor,
    updateSubmissaoStatus,
    deleteSubmissao,
    clearAllSubmissoes,
    clearAllSupervisores,
    clearAllData,
    loadDemoData,
    setActiveScreen,
    quickLoginAsSupervisor,
    isFirebaseConnected,
  } = useApp();

  const isReadOnly = userSession?.tipo === 'leitor';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'diario' | 'supervisores' | 'leitores' | 'relatorios' | 'configuracoes'>('dashboard');

  // Supervisor Form State (com metas de fichas e dias de trabalho)
  const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);
  const [newSupNome, setNewSupNome] = useState('');
  const [newSupCodigo, setNewSupCodigo] = useState('');
  const [newSupTelefone, setNewSupTelefone] = useState('');
  const [newSupProvincia, setNewSupProvincia] = useState('Cuanza-Sul');
  const [newSupMunicipio, setNewSupMunicipio] = useState('Sumbe');
  const [newSupComuna, setNewSupComuna] = useState('Sede');
  const [newSupCoordenacao, setNewSupCoordenacao] = useState('');
  const [newSupTotalFichas, setNewSupTotalFichas] = useState<number>(25);
  const [newSupDiasTrabalho, setNewSupDiasTrabalho] = useState<number>(5);

  // Edit Supervisor Target Modal State
  const [editingSupTarget, setEditingSupTarget] = useState<Supervisor | null>(null);
  const [editTotalFichas, setEditTotalFichas] = useState<number>(25);
  const [editDiasTrabalho, setEditDiasTrabalho] = useState<number>(5);
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false);

  // Filter by Day / Date
  const [filterDia, setFilterDia] = useState<string>('todos');

  // Leitor Form State (Utilizador Só de Leitura)
  const [showAddLeitorModal, setShowAddLeitorModal] = useState(false);
  const [newLeitorNome, setNewLeitorNome] = useState('');
  const [newLeitorCodigo, setNewLeitorCodigo] = useState('');
  const [newLeitorCargo, setNewLeitorCargo] = useState('');
  const [leitorSuccessMsg, setLeitorSuccessMsg] = useState('');
  const [isCreatingLeitor, setIsCreatingLeitor] = useState(false);

  // Acceptance vs Rejection View Mode
  const [acceptanceViewMode, setAcceptanceViewMode] = useState<'supervisores' | 'bairros'>('supervisores');

  // Admin Code Update State
  const [newAdminCodeInput, setNewAdminCodeInput] = useState('');
  const [adminCodeSuccessMsg, setAdminCodeSuccessMsg] = useState('');
  const [adminCodeErrorMsg, setAdminCodeErrorMsg] = useState('');
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);

  // Submission Detail Modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submissao | null>(null);

  // Filters for reports
  const [filterSupervisor, setFilterSupervisor] = useState<string>('todos');
  const [filterComuna, setFilterComuna] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Recharts Chart Data: Atividades e Locais por Supervisor
  const supervisorChartData = useMemo(() => {
    return supervisores.map((sup) => {
      const supSubmissions = submissoes.filter((s) => s.supervisorId === sup.id);
      let totalAtividades = 0;
      let totalPessoas = 0;
      let totalLocais = 0;

      supSubmissions.forEach((sub) => {
        totalAtividades += sub.fichas.length;
        totalPessoas += sub.totalSim;
        totalLocais += sub.totalLocais;
      });

      return {
        nome: sup.nome.split(' ')[0] + ' ' + (sup.nome.split(' ')[1] || ''),
        nomeCompleto: sup.nome,
        codigo: sup.codigo,
        comuna: sup.comuna,
        atividades: totalAtividades,
        pessoas: totalPessoas,
        locais: totalLocais,
      };
    });
  }, [supervisores, submissoes]);

  const [supervisorPieMetric, setSupervisorPieMetric] = useState<'atividades' | 'pessoas'>('atividades');

  // Recharts Pie Chart Data: Percentagens por Supervisor (9 Supervisores)
  const supervisorPieData = useMemo(() => {
    const isPessoas = supervisorPieMetric === 'pessoas';
    const totalGeral = supervisorChartData.reduce(
      (acc, curr) => acc + (isPessoas ? curr.pessoas : curr.atividades),
      0
    );

    return supervisorChartData.map((sup, idx) => {
      const val = isPessoas ? sup.pessoas : sup.atividades;
      const pct = totalGeral > 0 ? (val / totalGeral) * 100 : 100 / (supervisorChartData.length || 1);
      return {
        name: sup.nomeCompleto,
        shortName: sup.nome,
        codigo: sup.codigo,
        comuna: sup.comuna,
        value: val,
        atividades: sup.atividades,
        pessoas: sup.pessoas,
        percentNum: Number(pct.toFixed(1)),
        percentStr: `${pct.toFixed(1)}%`,
        color: COLORS_9_SUPERVISORES[idx % COLORS_9_SUPERVISORES.length],
      };
    });
  }, [supervisorChartData, supervisorPieMetric]);

  // Statistics Calculation
  const stats = useMemo(() => {
    let totalPessoas = 0;
    let totalLocais = 0;
    let totalFichas = 0;
    let totalSim = 0;
    let totalNao = 0;

    const categoryBreakdown = {
      casa: { locais: 0, pessoas: 0 },
      igrejas: { locais: 0, pessoas: 0 },
      pracas: { locais: 0, pessoas: 0 },
      paragem: { locais: 0, pessoas: 0 },
      creches: { locais: 0, pessoas: 0 },
      escolas: { locais: 0, pessoas: 0 },
      agua: { locais: 0, pessoas: 0 },
      outros: { locais: 0, pessoas: 0 },
    };

    const comunaStats: Record<string, { pessoas: number; fichas: number }> = {};
    COMUNAS_SUMBE.forEach((c) => {
      comunaStats[c] = { pessoas: 0, fichas: 0 };
    });

    submissoes.forEach((sub) => {
      totalPessoas += sub.totalPessoas;
      totalLocais += sub.totalLocais;
      totalSim += sub.totalSim;
      totalNao += sub.totalNao;
      totalFichas += sub.fichas.length;

      sub.fichas.forEach((f) => {
        categoryBreakdown.casa.locais += Number(f.casa_locais) || 0;
        categoryBreakdown.casa.pessoas += Number(f.casa_pessoas) || 0;

        categoryBreakdown.igrejas.locais += Number(f.igrejas_locais) || 0;
        categoryBreakdown.igrejas.pessoas += Number(f.igrejas_pessoas) || 0;

        categoryBreakdown.pracas.locais += Number(f.pracas_locais) || 0;
        categoryBreakdown.pracas.pessoas += Number(f.pracas_pessoas) || 0;

        categoryBreakdown.paragem.locais += Number(f.paragem_locais) || 0;
        categoryBreakdown.paragem.pessoas += Number(f.paragem_pessoas) || 0;

        categoryBreakdown.creches.locais += Number(f.creches_locais) || 0;
        categoryBreakdown.creches.pessoas += Number(f.creches_pessoas) || 0;

        categoryBreakdown.escolas.locais += Number(f.escolas_locais) || 0;
        categoryBreakdown.escolas.pessoas += Number(f.escolas_pessoas) || 0;

        categoryBreakdown.agua.locais += Number(f.agua_locais) || 0;
        categoryBreakdown.agua.pessoas += Number(f.agua_pessoas) || 0;

        categoryBreakdown.outros.locais += Number(f.outros_locais) || 0;
        categoryBreakdown.outros.pessoas += Number(f.outros_pessoas) || 0;

        const com = f.comuna || 'Sede';
        if (!comunaStats[com]) {
          comunaStats[com] = { pessoas: 0, fichas: 0 };
        }
        comunaStats[com].pessoas += f.total_sim;
        comunaStats[com].fichas += 1;
      });
    });

    const taxaAdesao =
      totalSim + totalNao > 0
        ? Math.round((totalSim / (totalSim + totalNao)) * 100)
        : 100;

    return {
      totalPessoas,
      totalLocais,
      totalFichas,
      totalSim,
      totalNao,
      taxaAdesao,
      categoryBreakdown,
      comunaStats,
    };
  }, [submissoes]);

  // Recharts Pie Chart Data: Percentagens por Comuna (Apenas Sede)
  const comunaPieData = useMemo(() => {
    const colors: Record<string, string> = {
      Sede: '#2667ff',
    };

    return COMUNAS_SUMBE.map((c) => {
      const cData = stats.comunaStats[c] || { pessoas: 0, fichas: 0 };
      const pct = stats.totalFichas > 0 ? (cData.fichas / stats.totalFichas) * 100 : 100;
      return {
        name: c,
        value: cData.fichas,
        pessoas: cData.pessoas,
        percentStr: `${pct.toFixed(1)}%`,
        color: colors[c] || '#2667ff',
      };
    });
  }, [stats]);

  // Recharts Pie Chart Data: Sim vs Não (Adesão)
  const adesaoPieData = useMemo(() => {
    const total = stats.totalSim + stats.totalNao;
    const simPct = total > 0 ? ((stats.totalSim / total) * 100).toFixed(1) : '100';
    const naoPct = total > 0 ? ((stats.totalNao / total) * 100).toFixed(1) : '0';

    return [
      { name: 'Sim (Adesão)', value: stats.totalSim, percentStr: `${simPct}%`, color: '#16a34a' },
      { name: 'Não (Recusas)', value: stats.totalNao, percentStr: `${naoPct}%`, color: '#ef4444' },
    ];
  }, [stats]);

  // Acceptance vs Rejection Rate Metrics (Taxa de Aceitação e Rejeição)
  const acceptanceMetrics = useMemo(() => {
    const totalSim = stats.totalSim;
    const totalNao = stats.totalNao;
    const totalRespostas = totalSim + totalNao;
    const taxaAceitacao = totalRespostas > 0 ? (totalSim / totalRespostas) * 100 : 0;
    const taxaRejeicao = totalRespostas > 0 ? (totalNao / totalRespostas) * 100 : 0;
    const margemLiquida = taxaAceitacao - taxaRejeicao;
    const ratio = totalNao > 0 ? (totalSim / totalNao).toFixed(1) : totalSim > 0 ? '100+' : '0';

    return {
      totalSim,
      totalNao,
      totalRespostas,
      taxaAceitacao: Number(taxaAceitacao.toFixed(1)),
      taxaRejeicao: Number(taxaRejeicao.toFixed(1)),
      margemLiquida: Number(margemLiquida.toFixed(1)),
      ratio,
      donutData: [
        { name: 'Aceitação (Sim)', value: totalSim, percentStr: `${taxaAceitacao.toFixed(1)}%`, color: '#2667ff' },
        { name: 'Rejeição (Não)', value: totalNao, percentStr: `${taxaRejeicao.toFixed(1)}%`, color: '#ef4444' },
      ],
    };
  }, [stats]);

  // Acceptance vs Rejection by Supervisor
  const supervisorAcceptanceData = useMemo(() => {
    return supervisores.map((sup) => {
      const supSubs = submissoes.filter((s) => s.supervisorId === sup.id);
      let sim = 0;
      let nao = 0;
      supSubs.forEach((s) => {
        sim += Number(s.totalSim) || 0;
        nao += Number(s.totalNao) || 0;
      });
      const total = sim + nao;
      const taxaSim = total > 0 ? (sim / total) * 100 : 0;
      const taxaNao = total > 0 ? (nao / total) * 100 : 0;
      return {
        name: sup.nome.split(' ')[0] + ' ' + (sup.nome.split(' ')[1] || ''),
        nomeCompleto: sup.nome,
        codigo: sup.codigo,
        comuna: sup.comuna,
        sim,
        nao,
        total,
        taxaSim: Number(taxaSim.toFixed(1)),
        taxaNao: Number(taxaNao.toFixed(1)),
        taxaSimStr: `${taxaSim.toFixed(1)}%`,
        taxaNaoStr: `${taxaNao.toFixed(1)}%`,
      };
    });
  }, [supervisores, submissoes]);

  // Acceptance vs Rejection by Bairro
  const bairroAcceptanceData = useMemo(() => {
    const bMap: Record<string, { sim: number; nao: number }> = {};
    submissoes.forEach((sub) => {
      sub.fichas.forEach((f) => {
        const b = f.bairro?.trim() || 'Outro';
        if (!bMap[b]) bMap[b] = { sim: 0, nao: 0 };
        bMap[b].sim += Number(f.total_sim) || 0;
        bMap[b].nao += Number(f.total_nao) || 0;
      });
    });
    return Object.entries(bMap)
      .map(([bairro, d]) => {
        const total = d.sim + d.nao;
        const taxaSim = total > 0 ? (d.sim / total) * 100 : 0;
        const taxaNao = total > 0 ? (d.nao / total) * 100 : 0;
        return {
          name: bairro,
          nomeCompleto: `Bairro ${bairro}`,
          codigo: 'Sumbe',
          comuna: 'Sede',
          sim: d.sim,
          nao: d.nao,
          total,
          taxaSim: Number(taxaSim.toFixed(1)),
          taxaNao: Number(taxaNao.toFixed(1)),
          taxaSimStr: `${taxaSim.toFixed(1)}%`,
          taxaNaoStr: `${taxaNao.toFixed(1)}%`,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [submissoes]);

  // Daily Tracking and Analytics (Separação de Fichas por Dia & Cumprimento de Metas)
  const dailyAnalytics = useMemo(() => {
    // 1. Extrair todas as datas únicas ordenadas cronologicamente
    const datesSet = new Set<string>();
    submissoes.forEach((sub) => {
      if (sub.data) datesSet.add(sub.data);
    });
    // Se não houver submissões, manter datas de exemplo
    if (datesSet.size === 0) {
      datesSet.add(new Date().toISOString().split('T')[0]);
    }
    const sortedDates = Array.from(datesSet).sort();

    // Mapeamento de data -> "Dia 1", "Dia 2", etc.
    const dateLabels: Record<string, { diaNum: number; label: string; shortDate: string }> = {};
    sortedDates.forEach((d, idx) => {
      const parts = d.split('-');
      const short = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
      dateLabels[d] = {
        diaNum: idx + 1,
        label: `Dia ${idx + 1} (${short})`,
        shortDate: short,
      };
    });

    // 2. Matriz de desempenho por supervisor
    const supervisorMatrix = supervisores.map((sup) => {
      const supSubs = submissoes.filter((s) => s.supervisorId === sup.id);
      const totalPrevisto = sup.totalFichasPrevistas || 25;
      const diasPrevistos = sup.diasTrabalhoPrevistos || 5;
      const metaDiaria = Math.ceil(totalPrevisto / (diasPrevistos || 1));

      const fichasPorData: Record<string, number> = {};
      const pessoasPorData: Record<string, number> = {};
      let totalFichasLancadas = 0;
      let totalPessoasLancadas = 0;
      let diasTrabalhados = 0;

      sortedDates.forEach((d) => {
        const subsDoDia = supSubs.filter((s) => s.data === d);
        let fichasNoDia = 0;
        let pessoasNoDia = 0;
        subsDoDia.forEach((s) => {
          fichasNoDia += s.fichas.length;
          pessoasNoDia += s.totalSim;
        });
        fichasPorData[d] = fichasNoDia;
        pessoasPorData[d] = pessoasNoDia;
        totalFichasLancadas += fichasNoDia;
        totalPessoasLancadas += pessoasNoDia;
        if (fichasNoDia > 0) diasTrabalhados += 1;
      });

      const percentualCumprido = totalPrevisto > 0 ? (totalFichasLancadas / totalPrevisto) * 100 : 0;
      const mediaDiaria = diasTrabalhados > 0 ? totalFichasLancadas / diasTrabalhados : 0;

      return {
        supervisor: sup,
        totalPrevisto,
        diasPrevistos,
        metaDiaria,
        fichasPorData,
        pessoasPorData,
        totalFichasLancadas,
        totalPessoasLancadas,
        diasTrabalhados,
        percentualCumprido: Number(percentualCumprido.toFixed(1)),
        percentualStr: `${percentualCumprido.toFixed(1)}%`,
        mediaDiaria: Number(mediaDiaria.toFixed(1)),
      };
    });

    // 3. Totais por dia de trabalho
    const totalsByDate: Record<string, { totalFichas: number; totalPessoas: number; supervisoresAtivos: number }> = {};
    sortedDates.forEach((d) => {
      let fCount = 0;
      let pCount = 0;
      let activeSupCount = 0;
      supervisorMatrix.forEach((m) => {
        const f = m.fichasPorData[d] || 0;
        const p = m.pessoasPorData[d] || 0;
        if (f > 0) {
          fCount += f;
          pCount += p;
          activeSupCount += 1;
        }
      });
      totalsByDate[d] = { totalFichas: fCount, totalPessoas: pCount, supervisoresAtivos: activeSupCount };
    });

    // 4. Chart Data para Recharts
    const chartData = sortedDates.map((d) => {
      const info = dateLabels[d];
      const tot = totalsByDate[d] || { totalFichas: 0, totalPessoas: 0, supervisoresAtivos: 0 };
      return {
        date: d,
        diaLabel: info ? info.label : d,
        shortDate: info ? info.shortDate : d,
        fichas: tot.totalFichas,
        pessoas: tot.totalPessoas,
        supervisoresAtivos: tot.supervisoresAtivos,
      };
    });

    // 5. Total de fichas previstas somando todos os supervisores
    const totalGeralPrevisto = supervisorMatrix.reduce((acc, m) => acc + m.totalPrevisto, 0);
    const totalGeralLancado = supervisorMatrix.reduce((acc, m) => acc + m.totalFichasLancadas, 0);
    const taxaGlobalCumprimento = totalGeralPrevisto > 0 ? (totalGeralLancado / totalGeralPrevisto) * 100 : 0;

    return {
      sortedDates,
      dateLabels,
      supervisorMatrix,
      totalsByDate,
      chartData,
      totalGeralPrevisto,
      totalGeralLancado,
      taxaGlobalCumprimento: Number(taxaGlobalCumprimento.toFixed(1)),
    };
  }, [supervisores, submissoes]);

  const handleCreateLeitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeitorNome.trim()) {
      alert('Por favor insira o nome do utilizador de leitura.');
      return;
    }
    const code = newLeitorCodigo.trim() || `LEITOR-00${leitores.length + 1}`;
    setIsCreatingLeitor(true);
    try {
      await addLeitor({
        codigo: code.toUpperCase(),
        nome: newLeitorNome.trim(),
        cargo: newLeitorCargo.trim() || 'Consulta & Estatística',
        ativo: true,
      });
      setNewLeitorNome('');
      setNewLeitorCodigo('');
      setNewLeitorCargo('');
      setShowAddLeitorModal(false);
      setLeitorSuccessMsg(`Utilizador de Leitura "${newLeitorNome}" criado com sucesso! Código: ${code.toUpperCase()}`);
      setTimeout(() => setLeitorSuccessMsg(''), 6000);
    } catch {
      alert('Erro ao criar utilizador no Firebase.');
    } finally {
      setIsCreatingLeitor(false);
    }
  };

  // Filtered Submissions
  // Filtered Submissions (com suporte a filtro por dia)
  const filteredSubmissoes = useMemo(() => {
    return submissoes.filter((sub) => {
      const matchSup = filterSupervisor === 'todos' || sub.supervisorId === filterSupervisor;
      const matchComuna =
        filterComuna === 'todos' ||
        sub.fichas.some((f) => f.comuna.toLowerCase() === filterComuna.toLowerCase());
      const matchDia = filterDia === 'todos' || sub.data === filterDia;
      const matchSearch =
        searchTerm === '' ||
        sub.supervisorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.fichas.some((f) => f.bairro.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSup && matchComuna && matchDia && matchSearch;
    });
  }, [submissoes, filterSupervisor, filterComuna, filterDia, searchTerm]);

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupNome.trim()) {
      alert('Por favor insira o nome do supervisor.');
      return;
    }

    const code =
      newSupCodigo.trim() || `SUP-00${supervisores.length + 1}`;

    const totalFichas = Math.max(1, Number(newSupTotalFichas) || 25);
    const diasTrab = Math.max(1, Number(newSupDiasTrabalho) || 5);

    const created = await addSupervisor({
      codigo: code,
      nome: newSupNome.trim(),
      telefone: newSupTelefone.trim() || '+244 923 000 000',
      provincia: newSupProvincia || 'Cuanza-Sul',
      municipio: newSupMunicipio || 'Sumbe',
      comuna: newSupComuna || 'Sede',
      coordenacao: newSupCoordenacao.trim() || 'Coordenação Geral Sumbe',
      totalFichasPrevistas: totalFichas,
      diasTrabalhoPrevistos: diasTrab,
      ativo: true,
    });

    // Reset inputs
    setNewSupNome('');
    setNewSupCodigo('');
    setNewSupTelefone('');
    setNewSupCoordenacao('');
    setNewSupTotalFichas(25);
    setNewSupDiasTrabalho(5);
    setShowAddSupervisorModal(false);

    alert(
      `Supervisor "${created.nome}" gravado com sucesso no Firebase!\nCódigo de Acesso: ${created.codigo}\nComuna Base: ${created.comuna}\nMeta: ${totalFichas} fichas em ${diasTrab} dias de trabalho (~${Math.ceil(totalFichas / diasTrab)} fichas/dia)`
    );
  };

  const handleOpenEditTarget = (sup: Supervisor) => {
    setEditingSupTarget(sup);
    setEditTotalFichas(sup.totalFichasPrevistas || 25);
    setEditDiasTrabalho(sup.diasTrabalhoPrevistos || 5);
  };

  const handleSaveSupTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupTarget) return;
    setIsSavingTarget(true);
    try {
      const totalFichas = Math.max(1, Number(editTotalFichas) || 25);
      const diasTrab = Math.max(1, Number(editDiasTrabalho) || 5);
      await updateSupervisor(editingSupTarget.id, {
        totalFichasPrevistas: totalFichas,
        diasTrabalhoPrevistos: diasTrab,
      });
      alert(`Metas do supervisor "${editingSupTarget.nome}" atualizadas com sucesso: ${totalFichas} fichas em ${diasTrab} dias!`);
      setEditingSupTarget(null);
    } catch {
      alert('Erro ao atualizar metas no Firebase.');
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleUpdateAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCodeSuccessMsg('');
    setAdminCodeErrorMsg('');
    if (!newAdminCodeInput.trim() || newAdminCodeInput.trim().length < 4) {
      setAdminCodeErrorMsg('O novo código de acesso deve ter pelo menos 4 caracteres.');
      return;
    }

    setIsUpdatingCode(true);
    const res = await updateAdminCode(newAdminCodeInput.trim());
    setIsUpdatingCode(false);

    if (res.success) {
      setAdminCodeSuccessMsg(`Código de acesso do administrador alterado com sucesso para "${newAdminCodeInput.trim()}" no Firebase!`);
      setNewAdminCodeInput('');
    } else {
      setAdminCodeErrorMsg(res.message || 'Erro ao alterar código no Firebase.');
    }
  };

  const handleTestAsSupervisor = (sup: Supervisor) => {
    quickLoginAsSupervisor(sup.id);
  };

  const exportToCSV = () => {
    let csv =
      'Data,Supervisor,Provincia,Municipio,Comuna,Bairro,Casa_Locais,Casa_Pessoas,Igrejas_Locais,Igrejas_Pessoas,Pracas_Locais,Pracas_Pessoas,Paragens_Locais,Paragens_Pessoas,Creches_Locais,Creches_Pessoas,Escolas_Locais,Escolas_Pessoas,Agua_Locais,Agua_Pessoas,Outros_Locais,Outros_Pessoas,Total_Sim,Total_Nao,Status\n';

    submissoes.forEach((sub) => {
      sub.fichas.forEach((f) => {
        csv += `"${sub.data}","${sub.supervisorNome}","${sub.provincia}","${sub.municipio}","${f.comuna}","${f.bairro}",${f.casa_locais},${f.casa_pessoas},${f.igrejas_locais},${f.igrejas_pessoas},${f.pracas_locais},${f.pracas_pessoas},${f.paragem_locais},${f.paragem_pessoas},${f.creches_locais},${f.creches_pessoas},${f.escolas_locais},${f.escolas_pessoas},${f.agua_locais},${f.agua_pessoas},${f.outros_locais},${f.outros_pessoas},${f.total_sim},${f.total_nao},"${sub.status}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mobilizacao_sumbe_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-view" className="flex flex-col md:flex-row h-screen bg-[#f1f5f9] overflow-hidden">
      {/* SIDEBAR ADMINISTRATIVA */}
      <aside className="w-full md:w-64 bg-[#1e293b] text-white flex flex-col shrink-0 border-r border-slate-700">
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-[#2667ff] tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-[#2667ff]" />
              <span>MS-Sumbe Admin</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Gestão de Mobilização Social</div>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL DE PREENCHER FICHA NA SIDEBAR (Apenas Admin) */}
        {!isReadOnly && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => setActiveScreen('formulario')}
              className="w-full bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              title="Abrir o formulário de preenchimento de fichas"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Preencher Nova Ficha</span>
            </button>
          </div>
        )}

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Gráficos</span>
          </button>

          {/* NOVO SEPARADOR: FICHAS POR DIA & METAS */}
          <button
            onClick={() => setActiveTab('diario')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'diario'
                ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Fichas por Dia & Metas</span>
            </div>
            <span className="text-xs bg-slate-900 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              {dailyAnalytics.sortedDates.length}d
            </span>
          </button>

          <button
            onClick={() => setActiveTab('supervisores')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'supervisores'
                ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Supervisores Cadastrados</span>
            </div>
            <span className="text-xs bg-slate-900 text-[#2667ff] px-2 py-0.5 rounded-full font-bold">
              {supervisores.length}
            </span>
          </button>

          {/* NOVO SEPARADOR: UTILIZADORES SÓ DE LEITURA */}
          <button
            onClick={() => setActiveTab('leitores')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'leitores'
                ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Utilizadores de Leitura</span>
            </div>
            <span className="text-xs bg-slate-900 text-sky-400 px-2 py-0.5 rounded-full font-bold">
              {leitores.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'relatorios'
                ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Relatórios Enviados</span>
            </div>
            <span className="text-xs bg-slate-900 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              {submissoes.length}
            </span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'configuracoes'
                  ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Definições & Firebase</span>
            </button>
          )}
        </nav>

        {/* Rodapé da Sidebar com Status do Firebase */}
        <div className="p-3 border-t border-slate-700/80 bg-slate-900/40 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-200">Município do Sumbe</div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firebase Firestore Ativo</span>
          </div>
          {isReadOnly ? (
            <div className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Modo Só de Leitura</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-mono">Admin: {adminCode}</div>
          )}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO ADMIN */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sticky top-0 z-10 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {activeTab === 'dashboard' && 'Visão Geral & Gráficos de Mobilização'}
              {activeTab === 'diario' && 'Controlo Diário de Fichas Lançadas & Cumprimento de Metas'}
              {activeTab === 'supervisores' && 'Supervisores Cadastrados, Códigos & Metas'}
              {activeTab === 'leitores' && 'Utilizadores Só de Leitura (Consulta & Auditoria)'}
              {activeTab === 'relatorios' && 'Fichas e Relatórios Recebidos no Firebase'}
              {activeTab === 'configuracoes' && 'Definições da Base de Dados Firebase & Código de Acesso'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Município do Sumbe, Província do Cuanza-Sul &bull; Sincronização em tempo real
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Indicador Firebase */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Base de Dados Firebase</span>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => setActiveScreen('formulario')}
                className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Abrir o formulário de preenchimento de fichas"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Preencher Ficha</span>
              </button>
            )}

            {isReadOnly ? (
              <div className="text-right hidden sm:block pl-2 border-l border-slate-200 text-xs">
                <div className="font-bold text-slate-700">{userSession?.nome}</div>
                <div className="text-[10px] text-sky-600 font-semibold flex items-center justify-end gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Acesso de Consulta</span>
                </div>
              </div>
            ) : (
              <div className="text-right hidden sm:block pl-2 border-l border-slate-200 text-xs">
                <div className="font-bold text-slate-700">Coordenação Municipal</div>
                <div className="text-[10px] text-emerald-600 font-medium font-mono">Código: {adminCode}</div>
              </div>
            )}

            <div className={`w-8 h-8 rounded-full ${isReadOnly ? 'bg-sky-600' : 'bg-[#2667ff]'} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
              {isReadOnly ? 'LT' : 'AD'}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: DASHBOARD */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* CARTÕES DE ESTATÍSTICAS (KPIs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-[#2667ff]">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Total Pessoas Alcançadas
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalPessoas.toLocaleString('pt-PT')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Mobilizadas no terreno</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Fichas Recebidas
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalFichas}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Em {submissoes.length} remessa(s) no Firebase
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-indigo-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Supervisores Ativos
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {supervisores.filter((s) => s.ativo).length} de {supervisores.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    9 coordenadores de campo
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Taxa de Adesão
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {stats.taxaAdesao}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    {stats.totalSim.toLocaleString('pt-PT')} Sim vs {stats.totalNao.toLocaleString('pt-PT')} Não
                  </div>
                </div>
              </div>

              {/* BANNER DE DESTAQUE: CONTROLO DE LANÇAMENTOS DIÁRIOS POR SUPERVISOR (+5 DIAS) */}
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-blue-950 rounded-xl p-4 sm:p-5 text-white shadow-xs border border-emerald-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        Controlo Diário de Lançamentos por Supervisor (Campanha +5 Dias)
                      </h4>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                        {dailyAnalytics.sortedDates.length} Dias Registados
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Acompanhe dia a dia o cumprimento das metas: total de <strong>{dailyAnalytics.totalGeralLancado} de {dailyAnalytics.totalGeralPrevisto} fichas</strong> lançadas ({dailyAnalytics.taxaGlobalCumprimento}% da meta global). Veja a matriz detalhada de quantas fichas cada supervisor lançou em cada dia.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('diario')}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ver Fichas por Dia & Metas</span>
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* GRÁFICOS DE PIZZA (PIE CHARTS) COM PERCENTAGENS - 9 SUPERVISORES */}
              {/* ============================================================ */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <PieIcon className="w-5 h-5 text-[#2667ff]" />
                      <span>Gráficos de Pizza com Percentagens dos Supervisores</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Distribuição percentual exata da mobilização entre os coordenadores do Sumbe
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle Métrica */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setSupervisorPieMetric('atividades')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                          supervisorPieMetric === 'atividades'
                            ? 'bg-[#2667ff] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Fichas / Atividades
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupervisorPieMetric('pessoas')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                          supervisorPieMetric === 'pessoas'
                            ? 'bg-[#2667ff] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Pessoas Alcançadas
                      </button>
                    </div>
                    <span className="text-xs bg-[#eff4ff] text-[#1a53db] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      {supervisores.length} Supervisores
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* PIZZA 1: 9 SUPERVISORES COM PERCENTAGENS */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 text-center">
                        % {supervisorPieMetric === 'pessoas' ? 'Pessoas Mobilizadas' : 'Atividades'} por Supervisor
                      </h4>
                      <p className="text-[11px] text-slate-500 text-center mb-2">
                        Participação individual dos 9 coordenadores no total
                      </p>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={supervisorPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {supervisorPieData.map((entry, index) => (
                                <Cell key={`cell-sup-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any, item: any) => [
                                `${Number(value).toLocaleString('pt-PT')} ${
                                  supervisorPieMetric === 'pessoas' ? 'pessoas' : 'fichas'
                                } (${item?.payload?.percentStr})`,
                                item?.payload?.name,
                              ]}
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Legenda compacta com percentagens dos 9 supervisores */}
                    <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-200 text-[10px]">
                      {supervisorPieData.map((sup) => (
                        <div key={sup.codigo} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200">
                          <div className="flex items-center gap-1.5 truncate mr-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: sup.color }}
                            ></span>
                            <span className="truncate font-medium text-slate-700" title={sup.name}>
                              {sup.shortName}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 font-mono">
                            {sup.percentStr}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PIZZA 2: DISTRIBUIÇÃO POR COMUNA */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 text-center">
                        % Distribuição por Comuna
                      </h4>
                      <p className="text-[11px] text-slate-500 text-center mb-2">
                        Comuna Sede do Município do Sumbe
                      </p>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={comunaPieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={(entry: any) => `${entry.name || ''} ${(entry.percent !== undefined ? (entry.percent * 100).toFixed(0) : 0)}%`}
                              labelLine={false}
                            >
                              {comunaPieData.map((entry, index) => (
                                <Cell key={`cell-com-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any, item: any) => [
                                `${value} fichas (${item?.payload?.percentStr})`,
                                `Comuna: ${name}`,
                              ]}
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-200 text-[11px]">
                      {comunaPieData.map((c) => (
                        <div key={c.name} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: c.color }}
                            ></span>
                            <span className="font-bold text-slate-800">{c.name}</span>
                          </div>
                          <div className="font-mono text-slate-600 text-xs">
                            <strong className="text-slate-900">{c.percentStr}</strong> ({c.value} fichas)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PIZZA 3: TAXA DE ADESÃO (SIM VS NÃO) */}
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 text-center">
                        % Taxa de Adesão da População
                      </h4>
                      <p className="text-[11px] text-slate-500 text-center mb-2">
                        Rácio de Aceitação (Sim) versus Recusas (Não)
                      </p>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={adesaoPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {adesaoPieData.map((entry, index) => (
                                <Cell key={`cell-ade-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any, item: any) => [
                                `${Number(value).toLocaleString('pt-PT')} pessoas (${item?.payload?.percentStr})`,
                                name,
                              ]}
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                      <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-900 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                          <span>Total de Sim (Adesão)</span>
                        </div>
                        <span className="font-bold font-mono text-sm">{adesaoPieData[0].percentStr}</span>
                      </div>

                      <div className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg border border-red-200 text-red-900 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-600"></span>
                          <span>Total de Não (Recusa)</span>
                        </div>
                        <span className="font-bold font-mono text-sm">{adesaoPieData[1].percentStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QUADRO ANALÍTICO DE PERCENTAGENS DOS SUPERVISORES */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2667ff]"></span>
                      <span>Quadro de Percentagens & Desempenho dos Coordenadores</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Calculado com base em {stats.totalFichas} fichas e {stats.totalSim.toLocaleString('pt-PT')} pessoas no Firebase
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Supervisor</th>
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Comuna</th>
                          <th className="py-2.5 px-3">Fichas</th>
                          <th className="py-2.5 px-3">Pessoas (Sim)</th>
                          <th className="py-2.5 px-3 w-52">% Participação Municipal</th>
                          <th className="py-2.5 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {supervisorPieData.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-slate-400">
                              Nenhum supervisor cadastrado. Clique em "+ Cadastrar Novo Supervisor" para adicionar.
                            </td>
                          </tr>
                        ) : (
                          supervisorPieData.map((sup, idx) => (
                            <tr key={sup.codigo} className="hover:bg-slate-50 transition">
                              <td className="py-2 px-3 font-mono font-bold text-slate-400">
                                #{idx + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: sup.color }}
                                ></span>
                                <span>{sup.name}</span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[#2667ff] font-bold">
                                {sup.codigo}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {sup.comuna}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-800">
                                {sup.atividades}
                              </td>
                              <td className="py-2 px-3 font-bold text-emerald-700">
                                {sup.pessoas.toLocaleString('pt-PT')}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(100, sup.percentNum)}%`,
                                        backgroundColor: sup.color,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="font-mono font-bold text-slate-800 w-12 text-right">
                                    {sup.percentStr}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetSup = supervisores.find((s) => s.codigo === sup.codigo);
                                    if (targetSup) {
                                      setFilterSupervisor(targetSup.id);
                                      setActiveTab('relatorios');
                                    }
                                  }}
                                  className="text-[#2667ff] hover:text-[#1a53db] font-semibold inline-flex items-center gap-1 hover:underline text-[11px] cursor-pointer"
                                >
                                  Ver Fichas
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* GRÁFICO DE BARRAS RECHARTS: ATIVIDADES POR SUPERVISOR */}
              {/* ============================================================ */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#2667ff]" />
                      <span>Volume de Atividades e Locais por Supervisor</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparativo de volume das coletas efetuadas por cada supervisor no Sumbe
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                    Total: <strong className="text-slate-800">{supervisores.length}</strong> supervisores
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={supervisorChartData}
                      margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="nome"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: any) => [
                          value,
                          name === 'atividades' ? 'Atividades / Fichas' : 'Locais Visitados',
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item ? `${item.nomeCompleto} (${item.comuna})` : label;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                      />
                      <Bar
                        dataKey="atividades"
                        name="Atividades / Fichas Realizadas"
                        fill="#2667ff"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        dataKey="locais"
                        name="Locais Visitados"
                        fill="#0284c7"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ============================================================ */}
              {/* PAINEL E GRÁFICOS: TAXA DE ACEITAÇÃO E DE REJEIÇÃO (SIM VS NÃO) */}
              {/* ============================================================ */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-emerald-600" />
                      <span>Gráficos da Taxa de Aceitação e de Rejeição</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rácio entre pessoas que acolheram favoravelmente a mensagem (Sim) e recusas (Não) no Município do Sumbe
                    </p>
                  </div>

                  {/* Toggle para alternar visualização por Supervisor ou por Bairro */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Visualizar barras por:</span>
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setAcceptanceViewMode('supervisores')}
                        className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                          acceptanceViewMode === 'supervisores'
                            ? 'bg-[#2667ff] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Por Supervisor
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcceptanceViewMode('bairros')}
                        className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                          acceptanceViewMode === 'bairros'
                            ? 'bg-[#2667ff] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Por Bairro
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Mini Cartões de Destaque da Taxa de Aceitação e Rejeição */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Taxa de Aceitação</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                      {acceptanceMetrics.taxaAceitacao}%
                    </div>
                    <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                      {acceptanceMetrics.totalSim.toLocaleString('pt-PT')} respostas afirmativas
                    </div>
                  </div>

                  <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-xl">
                    <div className="text-[11px] font-bold text-red-800 uppercase flex items-center gap-1.5">
                      <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                      <span>Taxa de Rejeição</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1">
                      {acceptanceMetrics.taxaRejeicao}%
                    </div>
                    <div className="text-[11px] text-red-700 font-medium mt-0.5">
                      {acceptanceMetrics.totalNao.toLocaleString('pt-PT')} recusas / não aceitou
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl">
                    <div className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#2667ff]" />
                      <span>Margem Líquida</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1a53db] mt-1">
                      {acceptanceMetrics.margemLiquida > 0 ? `+${acceptanceMetrics.margemLiquida}%` : `${acceptanceMetrics.margemLiquida}%`}
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                      Diferencial Aceitação vs Rejeição
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Rácio de Concordância</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
                      {acceptanceMetrics.ratio} : 1
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Sim para cada 1 Não registado
                    </div>
                  </div>
                </div>

                {/* DOIS GRÁFICOS: DONUT GLOBAL E BARRAS COMPARATIVAS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
                  {/* GRÁFICO 1: DONUT CONSOLIDADO ACEITAÇÃO VS REJEIÇÃO (4 colunas) */}
                  <div className="lg:col-span-4 bg-slate-50/90 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-center mb-0.5">
                        Proporção Global (Sim vs Não)
                      </h4>
                      <p className="text-[11px] text-slate-500 text-center mb-2">
                        Total consolidado: {acceptanceMetrics.totalRespostas.toLocaleString('pt-PT')} respostas
                      </p>

                      <div className="h-56 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={acceptanceMetrics.donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={62}
                              outerRadius={88}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              <Cell fill="#16a34a" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any, item: any) => [
                                `${Number(value).toLocaleString('pt-PT')} (${item?.payload?.percentStr})`,
                                name,
                              ]}
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Indicador Central no Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-black text-emerald-700">
                            {acceptanceMetrics.taxaAceitacao}%
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            Aceitação
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                      <div className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                          <span className="font-semibold text-emerald-950">Aceitação (Sim)</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800">
                          {acceptanceMetrics.taxaAceitacao}% ({acceptanceMetrics.totalSim.toLocaleString('pt-PT')})
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-600"></span>
                          <span className="font-semibold text-red-950">Rejeição (Não)</span>
                        </div>
                        <span className="font-mono font-bold text-red-700">
                          {acceptanceMetrics.taxaRejeicao}% ({acceptanceMetrics.totalNao.toLocaleString('pt-PT')})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GRÁFICO 2: BARRAS COMPARATIVAS POR SUPERVISOR / BAIRRO (8 colunas) */}
                  <div className="lg:col-span-8 bg-slate-50/90 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {acceptanceViewMode === 'supervisores'
                            ? 'Taxa % de Aceitação e Rejeição por Supervisor'
                            : 'Taxa % de Aceitação e Rejeição nos Bairros do Sumbe'}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Valores em percentagem (%)
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={
                              acceptanceViewMode === 'supervisores'
                                ? supervisorAcceptanceData
                                : bairroAcceptanceData.slice(0, 8)
                            }
                            margin={{ top: 10, right: 15, left: -15, bottom: 25 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                              interval={0}
                              angle={-15}
                              textAnchor="end"
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              domain={[0, 100]}
                              unit="%"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                              }}
                              formatter={(value: any, name: any) => [
                                `${value}%`,
                                name,
                              ]}
                              labelFormatter={(label, payload) => {
                                const item = payload?.[0]?.payload;
                                if (!item) return label;
                                return `${item.nomeCompleto || item.name} • Total: ${item.total} respostas (${item.sim} Sim / ${item.nao} Não)`;
                              }}
                            />
                            <Legend
                              verticalAlign="top"
                              align="right"
                              iconType="circle"
                              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                            />
                            <Bar
                              dataKey="taxaSim"
                              name="Taxa de Aceitação (Sim %)"
                              fill="#16a34a"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={30}
                            />
                            <Bar
                              dataKey="taxaNao"
                              name="Taxa de Rejeição (Não %)"
                              fill="#ef4444"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={30}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Resumo em mini-tabela rápida das taxas */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
                        {(acceptanceViewMode === 'supervisores'
                          ? supervisorAcceptanceData
                          : bairroAcceptanceData.slice(0, 8)
                        ).slice(0, 4).map((item) => (
                          <div key={item.name} className="bg-white p-2 rounded border border-slate-200">
                            <div className="font-semibold text-slate-800 truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px]">
                              <span className="text-emerald-700 font-bold font-mono">
                                Sim: {item.taxaSimStr}
                              </span>
                              <span className="text-red-600 font-bold font-mono">
                                Não: {item.taxaNaoStr}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ÚLTIMAS FICHAS ENVIADAS */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Últimas Fichas Sincronizadas no Firebase</h3>
                    <p className="text-xs text-slate-500">Dados coletados pelos supervisores em campo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveScreen('formulario')}
                      className="text-xs bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      + Preencher Ficha
                    </button>
                    <button
                      onClick={() => setActiveTab('relatorios')}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Ver Todas ({submissoes.length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Supervisor</th>
                        <th className="py-3 px-4">Município / Comuna</th>
                        <th className="py-3 px-4">Bairros</th>
                        <th className="py-3 px-4">Total Pessoas</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissoes.slice(0, 5).map((sub) => {
                        const bairrosText = sub.fichas.map((f) => f.bairro).join(', ');
                        const comunasText = Array.from(new Set(sub.fichas.map((f) => f.comuna))).join(', ');
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-medium text-slate-800 text-xs whitespace-nowrap">
                              {sub.data}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {sub.supervisorNome}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">
                              {sub.municipio} / <span className="font-medium text-slate-800">{comunasText || 'Sede'}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs max-w-[200px] truncate" title={bairrosText}>
                              {bairrosText}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#2667ff]">
                              {sub.totalPessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`badge ${
                                  sub.status === 'Validado'
                                    ? 'badge-success'
                                    : sub.status === 'Pendente'
                                    ? 'badge-warning'
                                    : 'badge-info'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedSubmission(sub)}
                                className="text-xs text-[#2667ff] hover:text-[#1a53db] font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Detalhes</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CONTROLO DIÁRIO DE FICHAS LANÇADAS & METAS (POR DIA) */}
          {/* ============================================================== */}
          {activeTab === 'diario' && (
            <div className="space-y-6">
              {/* Cabeçalho da Aba */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                      Controlo Diário de Fichas Lançadas & Cumprimento de Metas
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Separação dia a dia da mobilização. Saiba exatamente <strong>quantas fichas cada supervisor lançou em cada dia de trabalho</strong> e acompanhe o ritmo em relação à meta total estabelecida para os vários dias da campanha no Sumbe.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dailyAnalytics.sortedDates.length} dias registados</span>
                  </span>
                  {!isReadOnly && (
                    <button
                      onClick={() => setShowAddSupervisorModal(true)}
                      className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Supervisor com Meta</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 KPIs de Progresso Diário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Dias de Trabalho Ativos
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {dailyAnalytics.sortedDates.length} dias
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Campanha ativa (+5 dias previstos)</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-[#2667ff]">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Total Fichas Lançadas
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1a53db]">
                    {dailyAnalytics.totalGeralLancado} <span className="text-sm font-normal text-slate-400">/ {dailyAnalytics.totalGeralPrevisto}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    {dailyAnalytics.taxaGlobalCumprimento}% da meta total atingida
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Média de Lançamento Diário
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {(dailyAnalytics.totalGeralLancado / (dailyAnalytics.sortedDates.length || 1)).toFixed(1)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Fichas por dia no município do Sumbe
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-indigo-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Supervisores com Lançamentos
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {dailyAnalytics.supervisorMatrix.filter((m) => m.totalFichasLancadas > 0).length} de {supervisores.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Coordenadores a enviar fichas diárias
                  </div>
                </div>
              </div>

              {/* MATRIZ DIÁRIA: TABELA COMPLETA DE SUPERVISORES POR DIA DE TRABALHO */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#2667ff]" />
                      <span>Matriz de Desempenho Diário dos Supervisores</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualização individual: quantas fichas cada coordenador lançou em cada dia específico de trabalho
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Verde: meta diária atingida</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2667ff] ml-2"></span>
                    <span>Azul: com lançamentos</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3 min-w-[170px]">Supervisor</th>
                        <th className="py-3 px-3 text-center min-w-[100px]">Meta Campanha</th>
                        <th className="py-3 px-3 text-center min-w-[85px]">Meta/Dia</th>

                        {/* Colunas Dinâmicas para Cada Data / Dia Registado */}
                        {dailyAnalytics.sortedDates.map((d) => {
                          const info = dailyAnalytics.dateLabels[d];
                          return (
                            <th key={d} className="py-3 px-3 text-center bg-blue-50/40 border-l border-slate-200 min-w-[95px]">
                              <div className="font-bold text-[#1a53db]">{info?.label || d}</div>
                              <div className="text-[10px] text-slate-400 font-normal lowercase">{d}</div>
                            </th>
                          );
                        })}

                        <th className="py-3 px-3 text-center bg-slate-100 border-l border-slate-200 font-bold min-w-[100px]">
                          Total Lançado
                        </th>
                        <th className="py-3 px-3 text-center min-w-[140px]">% Meta</th>
                        {!isReadOnly && <th className="py-3 px-3 text-right min-w-[90px]">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyAnalytics.supervisorMatrix.map((item, idx) => {
                        const sup = item.supervisor;
                        return (
                          <tr key={sup.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                              #{idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{sup.nome}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                <span className="text-[#2667ff] font-bold">{sup.codigo}</span>
                                <span>&bull; {sup.comuna}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                              <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold">
                                {item.totalPrevisto} fichas
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                em {item.diasPrevistos} dias
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                              <span className="font-mono text-slate-800">
                                ~{item.metaDiaria}/dia
                              </span>
                            </td>

                            {/* Fichas Lançadas em Cada Dia de Trabalho */}
                            {dailyAnalytics.sortedDates.map((d) => {
                              const fichasNoDia = item.fichasPorData[d] || 0;
                              const pessoasNoDia = item.pessoasPorData[d] || 0;
                              const atingiuMeta = fichasNoDia >= item.metaDiaria && item.metaDiaria > 0;

                              return (
                                <td key={d} className="py-2.5 px-3 text-center border-l border-slate-100">
                                  {fichasNoDia > 0 ? (
                                    <div
                                      className={`inline-flex flex-col items-center justify-center px-2 py-1 rounded-lg border font-mono font-bold text-xs ${
                                        atingiuMeta
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : 'bg-blue-50 text-[#1a53db] border-blue-200'
                                      }`}
                                      title={`${fichasNoDia} ficha(s) lançada(s) & ${pessoasNoDia.toLocaleString('pt-PT')} pessoas mobilizadas`}
                                    >
                                      <span>{fichasNoDia} {fichasNoDia === 1 ? 'ficha' : 'fichas'}</span>
                                      <span className="text-[9px] font-normal text-slate-500">
                                        {pessoasNoDia} pess.
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-mono text-xs">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Total Acumulado */}
                            <td className="py-2.5 px-3 text-center bg-slate-50 border-l border-slate-200">
                              <span className="font-mono font-black text-sm text-[#1a53db]">
                                {item.totalFichasLancadas}
                              </span>
                              <div className="text-[10px] text-slate-500">
                                {item.totalPessoasLancadas.toLocaleString('pt-PT')} pess.
                              </div>
                            </td>

                            {/* Progresso vs Meta */}
                            <td className="py-2.5 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold font-mono text-slate-800">
                                    {item.percentualStr}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    {item.totalFichasLancadas}/{item.totalPrevisto}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      item.percentualCumprido >= 100
                                        ? 'bg-emerald-500'
                                        : item.percentualCumprido >= 50
                                        ? 'bg-[#2667ff]'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, item.percentualCumprido)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            {/* Ação Editar Meta */}
                            {!isReadOnly && (
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTarget(sup)}
                                  className="text-[#2667ff] hover:text-[#1a53db] hover:bg-blue-50 p-1.5 rounded transition cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                                  title="Ajustar total de fichas ou dias previstos"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Metas</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Linha de Totais Gerais por Dia */}
                    <tfoot className="bg-slate-100 text-slate-800 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 uppercase tracking-wider text-xs font-black text-slate-700">
                          Total Geral de Fichas por Dia (Sumbe):
                        </td>

                        {/* Soma de cada dia */}
                        {dailyAnalytics.sortedDates.map((d) => {
                          const tot = dailyAnalytics.totalsByDate[d] || { totalFichas: 0, totalPessoas: 0, supervisoresAtivos: 0 };
                          return (
                            <td key={d} className="py-3 px-3 text-center border-l border-slate-200 bg-blue-100/60">
                              <div className="font-mono font-black text-sm text-[#1a53db]">
                                {tot.totalFichas} fichas
                              </div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                {tot.totalPessoas.toLocaleString('pt-PT')} pess. ({tot.supervisoresAtivos} sup.)
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 text-center bg-slate-200/80 border-l border-slate-300">
                          <div className="font-mono font-black text-base text-[#1b4fd8]">
                            {dailyAnalytics.totalGeralLancado}
                          </div>
                          <div className="text-[10px] text-slate-600 font-semibold uppercase">Total Fichas</div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {dailyAnalytics.taxaGlobalCumprimento}% global
                        </td>

                        {!isReadOnly && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* GRÁFICO DE EVOLUÇÃO DIÁRIA (RECHARTS BAR CHART) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      <span>Ritmo Diário de Lançamento de Fichas no Sumbe</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparativo de volume de fichas recolhidas ao longo dos dias de trabalho da campanha
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded">
                    Média: <strong className="text-slate-800">{(dailyAnalytics.totalGeralLancado / (dailyAnalytics.sortedDates.length || 1)).toFixed(1)}</strong> fichas/dia
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyAnalytics.chartData}
                      margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="diaLabel"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: any) => [
                          `${value} ${name === 'fichas' ? 'fichas lançadas' : 'pessoas mobilizadas'}`,
                          name === 'fichas' ? 'Volume de Fichas' : 'Pessoas Mobilizadas',
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item ? `${item.diaLabel} • ${item.date} (${item.supervisoresAtivos} supervisores ativos)` : label;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                      />
                      <Bar
                        dataKey="fichas"
                        name="Fichas Lançadas no Dia"
                        fill="#16a34a"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: GESTÃO DOS 9 SUPERVISORES & CÓDIGOS DE ACESSO */}
          {/* ============================================================== */}
          {activeTab === 'supervisores' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Os 9 Supervisores Cadastrados no Município do Sumbe
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cada supervisor acede <strong>apenas com o seu código de utilizador</strong> (sem senha). Ao entrar, o seu Nome, Município e Comuna ficam logo fixados na ficha.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => setShowAddSupervisorModal(true)}
                    className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Novo Supervisor</span>
                  </button>
                )}
              </div>

              {/* Grid dos 9 Supervisores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {supervisores.map((sup, index) => {
                  const supSubmissions = submissoes.filter((s) => s.supervisorId === sup.id);
                  const totalSupPessoas = supSubmissions.reduce((acc, s) => acc + s.totalPessoas, 0);
                  const color = COLORS_9_SUPERVISORES[index % COLORS_9_SUPERVISORES.length];

                  return (
                    <div
                      key={sup.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-[#2667ff] transition"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs"
                              style={{ backgroundColor: color }}
                            >
                              {sup.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{sup.nome}</h4>
                              <div className="text-xs text-slate-500">
                                Comuna: <strong className="text-[#2667ff]">{sup.comuna}</strong>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`badge ${
                              sup.ativo ? 'badge-success' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {sup.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        {/* Código de Acesso Único */}
                        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs mb-3 font-mono flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">
                              Código de Acesso
                            </span>
                            <span className="font-bold text-[#2667ff] text-sm">
                              {sup.codigo}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">
                            Entra sem senha
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-[#2667ff] shrink-0" />
                            <span>
                              <strong>Coordenação:</strong> {sup.coordenacao || 'Coordenação Geral'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              <strong>Município:</strong> {sup.municipio || 'Sumbe'} ({sup.provincia || 'Cuanza-Sul'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{sup.telefone || 'Sem contacto'}</span>
                          </div>
                        </div>

                        {/* Estatísticas do supervisor e Metas Diárias */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                          <div className="bg-[#eff4ff] p-2 rounded border border-[#bfdbfe]">
                            <div className="text-[11px] text-slate-500 font-medium">Fichas Lançadas</div>
                            <div className="text-base font-bold text-[#1a53db]">
                              {supSubmissions.length}
                            </div>
                          </div>
                          <div className="bg-emerald-50/70 p-2 rounded border border-emerald-100">
                            <div className="text-[11px] text-slate-500 font-medium">Pessoas</div>
                            <div className="text-base font-bold text-emerald-800">
                              {totalSupPessoas.toLocaleString('pt-PT')}
                            </div>
                          </div>
                        </div>

                        {/* Detalhe do Plano de Trabalho (+5 Dias) */}
                        <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block">Total Previsto:</span>
                            <strong className="text-slate-800">{sup.totalFichasPrevistas || 25} fichas</strong> em <strong>{sup.diasTrabalhoPrevistos || 5} dias</strong>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block">Meta Diária:</span>
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ~{Math.ceil((sup.totalFichasPrevistas || 25) / (sup.diasTrabalhoPrevistos || 5))}/dia
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      {!isReadOnly ? (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleTestAsSupervisor(sup)}
                            className="flex-1 bg-white hover:bg-[#eff4ff] hover:text-[#1a53db] text-slate-700 border border-slate-200 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title="Entrar com a conta deste supervisor para ver o formulário dele"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-[#2667ff]" />
                            <span>Entrar como {sup.nome.split(' ')[0]}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditTarget(sup)}
                            className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                            title="Ajustar total de fichas da campanha e dias de trabalho"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Metas</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja remover o supervisor ${sup.nome}?`)) {
                                deleteSupervisor(sup.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-white transition"
                            title="Remover supervisor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
                          Consulta de Perfil Ativo
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: GESTÃO DE UTILIZADORES SÓ DE LEITURA (CONSULTA / AUDITORIA) */}
          {/* ============================================================== */}
          {activeTab === 'leitores' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[#2667ff]" />
                    <h3 className="text-lg font-bold text-slate-800">
                      Utilizadores Só de Leitura de Dados (Consulta & Auditoria)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Crie contas com permissão estrita de <strong>apenas leitura</strong>. Estes utilizadores podem consultar todos os gráficos, dashboards e relatórios de campo, <strong>sem poder alterar, preencher ou eliminar dados</strong>.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => setShowAddLeitorModal(true)}
                    className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Utilizador de Leitura</span>
                  </button>
                )}
              </div>

              {leitorSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{leitorSuccessMsg}</span>
                  </div>
                  <button onClick={() => setLeitorSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold">&times;</button>
                </div>
              )}

              {/* Informações sobre o Perfil de Leitura */}
              <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sky-900">
                    <Shield className="w-4 h-4 text-[#2667ff]" />
                    <span>Regras do Utilizador Só de Leitura:</span>
                  </div>
                  <ul className="list-disc list-inside text-sky-800 space-y-0.5 text-[11px]">
                    <li>Acesso completo aos gráficos, KPIs municipais, mapas e relatórios enviados;</li>
                    <li>Bloqueio total contra eliminação de dados ou alteração de fichas;</li>
                    <li>Bloqueio ao formulário de envio de novas fichas;</li>
                    <li>Autenticação simplificada e segura com código confidencial (ex: <code>LEITOR-001</code>).</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded-lg border border-sky-200 text-center shrink-0">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total de Leitores</div>
                  <div className="text-2xl font-black text-[#2667ff]">{leitores.length}</div>
                </div>
              </div>

              {/* Lista de Utilizadores de Leitura */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {leitores.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-sky-50 text-[#2667ff] rounded-full mx-auto flex items-center justify-center">
                      <Eye className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">Nenhum Utilizador de Leitura Cadastrado</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Permita que auditores, diretores municipais ou técnicos consultem os dados de mobilização sem risco de alterar os registos.
                    </p>
                    {!isReadOnly && (
                      <button
                        onClick={() => setShowAddLeitorModal(true)}
                        className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Criar Primeiro Utilizador de Leitura</span>
                      </button>
                    )}
                  </div>
                ) : (
                  leitores.map((leitor) => (
                    <div
                      key={leitor.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-[#2667ff] transition"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-sky-100 text-[#1a53db] font-bold flex items-center justify-center text-sm shadow-xs">
                              <Eye className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{leitor.nome}</h4>
                              <div className="text-xs text-slate-500">
                                Cargo: <strong className="text-slate-700">{leitor.cargo || 'Consulta & Auditoria'}</strong>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`badge ${
                              leitor.ativo ? 'badge-success' : 'badge-warning'
                            }`}
                          >
                            {leitor.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        {/* Código de Acesso com Cópia */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 my-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                              Código de Acesso
                            </span>
                            <span className="font-mono font-bold text-sm text-[#1a53db]">
                              {leitor.codigo}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(leitor.codigo);
                              alert(`Código "${leitor.codigo}" copiado com sucesso!`);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#2667ff] hover:bg-white rounded transition cursor-pointer"
                            title="Copiar código de acesso"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Tipo de Acesso:</span>
                            <strong className="text-sky-700">Só de Leitura (Sem Escrita)</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Data de Registo:</span>
                            <span>{leitor.dataCriacao || 'Recente'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações do Administrador */}
                      {!isReadOnly && (
                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => toggleLeitorStatus(leitor.id)}
                            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                          >
                            {leitor.ativo ? 'Desativar Acesso' : 'Ativar Acesso'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Deseja eliminar o utilizador de leitura "${leitor.nome}"?`)) {
                                await deleteLeitor(leitor.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-white transition cursor-pointer"
                            title="Eliminar utilizador de leitura"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: RELATÓRIOS & FICHAS */}
          {/* ============================================================== */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6">
              {/* Filtros e Ações */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Base Central de Fichas de Mobilização (Firebase Firestore)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Consulte, filtre e exporte os dados enviados pelos 9 supervisores do Sumbe
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isReadOnly && (
                      <button
                        onClick={() => setActiveScreen('formulario')}
                        className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Preencher Ficha</span>
                      </button>
                    )}
                    <button
                      onClick={exportToCSV}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
                      title="Descarregar ficheiro CSV com todas as fichas e categorias"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Pesquisar por Bairro ou Supervisor
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Ex: Kikombo, João Silva..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Filtrar por Comuna
                    </label>
                    <select
                      value={filterComuna}
                      onChange={(e) => setFilterComuna(e.target.value)}
                      className="w-full py-2 px-3 text-xs border rounded-lg"
                    >
                      <option value="todos">Todas as Comunas</option>
                      {COMUNAS_SUMBE.map((c) => (
                        <option key={c} value={c}>
                          Comuna: {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Filtrar por Supervisor
                    </label>
                    <select
                      value={filterSupervisor}
                      onChange={(e) => setFilterSupervisor(e.target.value)}
                      className="w-full py-2 px-3 text-xs border rounded-lg"
                    >
                      <option value="todos">Todos os Supervisores</option>
                      {supervisores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} ({s.comuna})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabela de Relatórios */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Supervisor</th>
                        <th className="py-3 px-4">Comuna(s)</th>
                        <th className="py-3 px-4">Bairros Visitados</th>
                        <th className="py-3 px-4">Fichas</th>
                        <th className="py-3 px-4">Pessoas (Sim)</th>
                        <th className="py-3 px-4">Total Não</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissoes.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                            Nenhum relatório encontrado com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissoes.map((sub) => {
                          const comunas = Array.from(new Set(sub.fichas.map((f) => f.comuna))).join(', ');
                          const bairros = sub.fichas.map((f) => f.bairro).join(', ');

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                                {sub.data}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {sub.supervisorNome}
                              </td>
                              <td className="py-3 px-4 text-xs font-medium text-slate-700">
                                {comunas || 'Sede'}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate" title={bairros}>
                                {bairros}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                                {sub.fichas.length}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#2667ff]">
                                {sub.totalSim.toLocaleString('pt-PT')}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-500">
                                {sub.totalNao}
                              </td>
                              <td className="py-3 px-4">
                                {!isReadOnly ? (
                                  <select
                                    value={sub.status}
                                    onChange={(e) =>
                                      updateSubmissaoStatus(
                                        sub.id,
                                        e.target.value as 'Validado' | 'Pendente' | 'Em Revisão'
                                      )
                                    }
                                    className={`text-xs font-bold py-1 px-2 rounded border ${
                                      sub.status === 'Validado'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : sub.status === 'Pendente'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                    }`}
                                  >
                                    <option value="Validado">Validado</option>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Em Revisão">Em Revisão</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`badge ${
                                      sub.status === 'Validado'
                                        ? 'badge-success'
                                        : sub.status === 'Pendente'
                                        ? 'badge-warning'
                                        : 'badge-info'
                                    }`}
                                  >
                                    {sub.status}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setSelectedSubmission(sub)}
                                  className="text-xs bg-[#eff4ff] hover:bg-[#dbeafe] text-[#1a53db] font-semibold px-2.5 py-1.5 rounded transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Detalhes</span>
                                </button>
                                {!isReadOnly && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Deseja eliminar esta submissão?')) {
                                        deleteSubmissao(sub.id);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-600 p-1 rounded"
                                    title="Eliminar submissão"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: CONFIGURAÇÕES & SEGURANÇA */}
          {/* ============================================================== */}
          {/* ============================================================== */}
          {/* TAB 4: CONFIGURAÇÕES, CÓDIGO DE ACESSO & BASE DE DADOS */}
          {/* ============================================================== */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6 max-w-4xl">
              {/* 1. ALTERAÇÃO DO CÓDIGO DE ACESSO DO ADMINISTRADOR */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#2667ff] flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Alterar Código de Acesso do Administrador
                    </h3>
                    <p className="text-xs text-slate-500">
                      Modifique o código de acesso para entrar neste painel. Gravado e sincronizado diretamente no Firebase Firestore.
                    </p>
                  </div>
                </div>

                {/* Exibição do Código Atual */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400 font-sans">Código Ativo no Firebase:</div>
                    <div className="text-2xl font-mono font-black text-[#2667ff] tracking-wider mt-0.5">
                      {adminCode}
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 max-w-sm">
                    Este código é utilizado no ecrã de acesso inicial para autenticar a Coordenação Geral e aceder a todas as opções.
                  </div>
                </div>

                {/* Formulário para Alterar o Código */}
                <form onSubmit={handleUpdateAdminCode} className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Novo Código de Acesso do Administrador
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Ex: NOVOCODIGO2026"
                      value={newAdminCodeInput}
                      onChange={(e) => {
                        setNewAdminCodeInput(e.target.value);
                        setAdminCodeSuccessMsg('');
                        setAdminCodeErrorMsg('');
                      }}
                      className="flex-1 py-2.5 px-3 text-sm font-mono uppercase font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] focus:border-[#2667ff] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingCode || !newAdminCodeInput.trim()}
                      className="bg-[#2667ff] hover:bg-[#1a53db] disabled:opacity-50 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{isUpdatingCode ? 'A Gravar no Firebase...' : 'Guardar Novo Código'}</span>
                    </button>
                  </div>

                  {adminCodeSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                      <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{adminCodeSuccessMsg}</span>
                    </div>
                  )}

                  {adminCodeErrorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                      {adminCodeErrorMsg}
                    </div>
                  )}
                </form>
              </div>

              {/* 2. AUTORIDADE TOTAL SOBRE OS DADOS (ELIMINAÇÃO NO FIREBASE) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Autoridade Total sobre os Dados (Firebase Firestore)
                    </h3>
                    <p className="text-xs text-slate-500">
                      O administrador tem total autoridade para eliminar ficheiros e registos. Uma vez apagados, os dados de demonstração <strong>NÃO voltam a aparecer</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Aviso de Autoridade de Dados:</span>
                  </div>
                  <p>
                    As alterações e exclusões são executadas permanentemente na base de dados Firebase. Quando criar novos supervisores ou preencher novas fichas, esses novos dados ficarão guardados e serão os únicos do sistema.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase">Fichas / Relatórios</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Atualmente {submissoes.length} ficha(s) gravadas no Firebase.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Tem a certeza que deseja ELIMINAR TODAS as fichas/relatórios da base de dados Firebase? Os dados apagados não voltam a aparecer.')) {
                          await clearAllSubmissoes();
                          alert('Todas as fichas foram permanentemente eliminadas do Firebase.');
                        }
                      }}
                      className="mt-3 w-full py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Todas as Fichas</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase">Supervisores</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Atualmente {supervisores.length} supervisor(es) cadastrado(s) no Firebase.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Tem a certeza que deseja ELIMINAR TODOS os supervisores da base de dados Firebase? Os dados apagados não voltam a aparecer.')) {
                          await clearAllSupervisores();
                          alert('Todos os supervisores foram permanentemente eliminados do Firebase.');
                        }
                      }}
                      className="mt-3 w-full py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Supervisores</span>
                    </button>
                  </div>

                  <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-red-900 text-xs uppercase">Zerar Sistema Completo</h4>
                      <p className="text-[11px] text-red-700 mt-1">
                        Apaga todas as fichas e supervisores, deixando a base vazia e limpa para registos reais.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('ATENÇÃO: Deseja ZERAR TODO O SISTEMA? Todas as fichas e supervisores serão permanentemente apagados do Firebase e NÃO voltarão a aparecer.')) {
                          await clearAllData();
                          alert('O sistema foi completamente zerado no Firebase. Pode agora criar supervisores e submeter dados limpos.');
                        }
                      }}
                      className="mt-3 w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Zerar Tudo no Firebase</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Necessita recarregar dados de exemplo para demonstração?
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Deseja recarregar os dados de demonstração dos 9 supervisores e fichas no Firebase?')) {
                        await loadDemoData();
                        alert('Dados de exemplo carregados no Firebase com sucesso!');
                      }
                    }}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Carregar Dados de Exemplo (Opcional)</span>
                  </button>
                </div>
              </div>

              {/* 3. INFORMAÇÕES DA ESTRUTURA MUNICIPAL & FIREBASE */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#2667ff]" />
                    <span>Estado da Base de Dados Firebase Firestore</span>
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Sincronizado em Tempo Real</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Projeto Firebase:</span>
                    <strong className="text-slate-800 font-mono text-xs">gen-lang-client-0240613088</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Coleções Ativas no Firestore:</span>
                    <strong className="text-slate-800 font-mono text-xs">/supervisores, /submissoes, /config</strong>
                  </div>
                  <div className="sm:col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Comuna Ativa no Município do Sumbe:</span>
                    <div className="flex flex-wrap gap-2">
                      {COMUNAS_SUMBE.map((c) => (
                        <span key={c} className="bg-[#eff4ff] text-[#1a53db] border border-[#bfdbfe] px-2.5 py-1 rounded-md font-semibold text-xs">
                          {c} (Sede do Sumbe)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL: CADASTRAR NOVO SUPERVISOR (SEM SENHA, APENAS CÓDIGO) */}
      {/* ============================================================== */}
      {showAddSupervisorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Cadastrar Novo Supervisor
                </h3>
              </div>
              <button
                onClick={() => setShowAddSupervisorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Crie o utilizador com o respetivo código. O supervisor acede diretamente com o seu código (sem necessidade de senha).
            </p>

            <form onSubmit={handleCreateSupervisor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo do Supervisor <span className="text-[#2667ff]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: António Silva Manuel"
                  value={newSupNome}
                  onChange={(e) => setNewSupNome(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              {/* CÓDIGO DE ACESSO */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Acesso do Utilizador <span className="text-[#2667ff]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`SUP-00${supervisores.length + 1}`}
                  value={newSupCodigo}
                  onChange={(e) => setNewSupCodigo(e.target.value)}
                  className="w-full text-sm font-mono font-bold text-[#1a53db] bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  O supervisor utilizará apenas este código para aceder ao sistema.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Província / Município (Fixo)
                  </label>
                  <input
                    type="text"
                    value="Cuanza-Sul / Sumbe"
                    readOnly
                    className="w-full text-sm font-semibold bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comuna Atribuída <span className="text-[#2667ff]">*</span>
                  </label>
                  <select
                    value={newSupComuna}
                    onChange={(e) => setNewSupComuna(e.target.value)}
                    className="w-full text-sm font-bold text-slate-800 border-slate-300 bg-white"
                  >
                    {COMUNAS_SUMBE.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COORDENAÇÃO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordenação de Atuação <span className="text-[#2667ff]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coordenação Sumbe Sede / Setor Litoral"
                  value={newSupCoordenacao}
                  onChange={(e) => setNewSupCoordenacao(e.target.value)}
                  className="w-full text-sm"
                />
                <span className="text-[10px] text-slate-400">
                  Área ou setor de coordenação atribuída a este supervisor
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contacto Telefónico
                </label>
                <input
                  type="tel"
                  placeholder="+244 923 000 000"
                  value={newSupTelefone}
                  onChange={(e) => setNewSupTelefone(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              {/* PLANEAMENTO DE FICHAS E DIAS DE TRABALHO (+5 DIAS) */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Total de Fichas e Dias de Trabalho da Campanha
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 leading-relaxed">
                  Adicione o total de fichas atribuídas durante os vários dias de trabalho (serão mais de 5 dias). Isto permitirá ao sistema saber exatamente quantas fichas este supervisor lança por dia e apurar o ritmo de trabalho.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total de Fichas Previstas <span className="text-[#2667ff]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={newSupTotalFichas}
                      onChange={(e) => setNewSupTotalFichas(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-sm font-bold text-slate-900 bg-white"
                      placeholder="Ex: 30"
                    />
                    <span className="text-[10px] text-slate-500">Fichas ao longo da campanha</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dias de Trabalho Previstos <span className="text-[#2667ff]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={newSupDiasTrabalho}
                      onChange={(e) => setNewSupDiasTrabalho(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-sm font-bold text-slate-900 bg-white"
                      placeholder="Ex: 6 (mais de 5 dias)"
                    />
                    <span className="text-[10px] text-slate-500">Duração estimada (+5 dias)</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Meta Diária Calculada:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ~{Math.ceil(newSupTotalFichas / (newSupDiasTrabalho || 1))} fichas / dia
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddSupervisorModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] text-white text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  Salvar Supervisor no Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CADASTRAR NOVO UTILIZADOR SÓ DE LEITURA */}
      {/* ============================================================== */}
      {showAddLeitorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#1a53db] flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Cadastrar Utilizador Só de Leitura
                </h3>
              </div>
              <button
                onClick={() => setShowAddLeitorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Crie uma conta para consulta de dados. Este utilizador acederá ao painel e a todos os relatórios, mas <strong>não poderá fazer alterações ou submeter dados</strong>.
            </p>

            <form onSubmit={handleCreateLeitor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Utilizador <span className="text-[#2667ff]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Fernando Costa"
                  value={newLeitorNome}
                  onChange={(e) => setNewLeitorNome(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo / Função de Auditoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auditor Externo, Estatística Municipal, Consulta"
                  value={newLeitorCargo}
                  onChange={(e) => setNewLeitorCargo(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none"
                />
              </div>

              {/* CÓDIGO DE ACESSO */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Acesso Exclusivo <span className="text-[#2667ff]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`LEITOR-00${leitores.length + 1}`}
                  value={newLeitorCodigo}
                  onChange={(e) => setNewLeitorCodigo(e.target.value)}
                  className="w-full text-sm font-mono font-bold text-[#1a53db] bg-white py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none uppercase"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  O utilizador introduzirá este código no ecrã inicial para aceder em modo de leitura.
                </span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-[#1a53db] flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  O utilizador terá acesso aos gráficos, relatórios e fichas recebidas do Sumbe, sem permissão para apagar ou editar qualquer ficheiro.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddLeitorModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLeitor || !newLeitorNome.trim()}
                  className="px-5 py-2 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] disabled:opacity-50 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  {isCreatingLeitor ? 'A Gravar...' : 'Salvar Utilizador de Leitura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AJUSTAR METAS DE FICHAS E DIAS DE TRABALHO (+5 DIAS) */}
      {/* ============================================================== */}
      {editingSupTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Ajustar Total de Fichas e Dias
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {editingSupTarget.nome} ({editingSupTarget.codigo})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingSupTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Defina o total de fichas da campanha e a duração estimada em dias de trabalho (serão mais de 5 dias). O sistema atualizará automaticamente a meta diária e o controlo de lançamentos diários.
            </p>

            <form onSubmit={handleSaveSupTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total de Fichas Previstas na Campanha
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={editTotalFichas}
                  onChange={(e) => setEditTotalFichas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-sm font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Total atribuído ao supervisor durante os vários dias de trabalho.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade de Dias de Trabalho (Mais de 5 Dias)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={editDiasTrabalho}
                  onChange={(e) => setEditDiasTrabalho(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-sm font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ex: 6, 7, 8, 10, 15 dias previstos para a mobilização no Sumbe.
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Nova Meta Diária Calculada:</span>
                <span className="font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-300">
                  ~{Math.ceil(editTotalFichas / (editDiasTrabalho || 1))} fichas / dia
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingSupTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTarget}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSavingTarget ? 'A Guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VER DETALHES COMPLETOS DA SUBMISSÃO / FICHA */}
      {/* ============================================================== */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 text-slate-800 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2667ff]" />
                  <h3 className="font-bold text-slate-900 text-lg">
                    Ficha de Mobilização &bull; {selectedSubmission.supervisorNome}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Data de Coleta: {selectedSubmission.data} &bull; Enviado em: {new Date(selectedSubmission.dataEnvio).toLocaleString('pt-PT')}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-5">
              {/* Resumo Rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#eff4ff] p-3 rounded-lg border border-[#bfdbfe] text-center">
                  <div className="text-[11px] font-semibold text-[#1a53db] uppercase">Total Pessoas (Sim)</div>
                  <div className="text-xl font-bold text-[#1b4fd8]">{selectedSubmission.totalSim.toLocaleString('pt-PT')}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase">Total Não</div>
                  <div className="text-xl font-bold text-slate-800">{selectedSubmission.totalNao}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase">Locais Visitados</div>
                  <div className="text-xl font-bold text-slate-800">{selectedSubmission.totalLocais}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase">Fichas / Bairros</div>
                  <div className="text-xl font-bold text-slate-800">{selectedSubmission.fichas.length}</div>
                </div>
              </div>

              {/* Fichas Individuais */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Desdobramento das Fichas ({selectedSubmission.fichas.length}):
                </h4>

                {selectedSubmission.fichas.map((ficha, idx) => (
                  <div key={ficha.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#2667ff] text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                          Ficha {ficha.numeroFicha || idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          Bairro: {ficha.bairro}
                        </span>
                      </div>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        Comuna: {ficha.comuna}
                      </span>
                    </div>

                    {/* Categorias */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Casa a Casa:</span>
                        <strong>{ficha.casa_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.casa_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Igrejas:</span>
                        <strong>{ficha.igrejas_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.igrejas_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Praças / Mercados:</span>
                        <strong>{ficha.pracas_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.pracas_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Paragens de Táxi:</span>
                        <strong>{ficha.paragem_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.paragem_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Creches:</span>
                        <strong>{ficha.creches_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.creches_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Escolas:</span>
                        <strong>{ficha.escolas_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.escolas_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Pontos de Água:</span>
                        <strong>{ficha.agua_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.agua_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Outros:</span>
                        <strong>{ficha.outros_locais}</strong> loc. / <strong className="text-[#2667ff]">{ficha.outros_pessoas}</strong> pess.
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-[#eff4ff] p-2.5 rounded-lg border border-[#bfdbfe] text-xs">
                      <div>
                        <span className="font-bold text-slate-800">Total Sim: </span>
                        <span className="font-extrabold text-[#1a53db] text-sm">{ficha.total_sim} pessoas</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Total Não: </span>
                        <span className="font-bold text-slate-800">{ficha.total_nao}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-4 shrink-0">
              <span className="text-xs text-slate-500">
                ID da Submissão: <span className="font-mono">{selectedSubmission.id}</span>
              </span>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
