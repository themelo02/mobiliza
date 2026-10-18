import React, { useState, useMemo } from 'react';
import { useApp, ADMIN_CODE } from '../context/AppContext';
import { Supervisor, Submissao, COMUNAS_SUMBE } from '../types';
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
} from 'lucide-react';

const COLORS_9_SUPERVISORES = [
  '#e35205', // Terracotta Sumbe
  '#0284c7', // Sky Blue
  '#16a34a', // Emerald Green
  '#d97706', // Amber Gold
  '#9333ea', // Royal Purple
  '#db2777', // Rose Pink
  '#0d9488', // Teal Cyan
  '#ea580c', // Dark Orange
  '#4f46e5', // Deep Indigo
];

export const AdminView: React.FC = () => {
  const {
    supervisores,
    submissoes,
    addSupervisor,
    updateSupervisor,
    deleteSupervisor,
    updateSubmissaoStatus,
    deleteSubmissao,
    setActiveScreen,
    quickLoginAsSupervisor,
    resetToInitialData,
    isFirebaseConnected,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'supervisores' | 'relatorios' | 'configuracoes'>('dashboard');

  // Supervisor Form State (sem senha, apenas código e coordenação)
  const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);
  const [newSupNome, setNewSupNome] = useState('');
  const [newSupCodigo, setNewSupCodigo] = useState('');
  const [newSupTelefone, setNewSupTelefone] = useState('');
  const [newSupProvincia, setNewSupProvincia] = useState('Cuanza-Sul');
  const [newSupMunicipio, setNewSupMunicipio] = useState('Sumbe');
  const [newSupComuna, setNewSupComuna] = useState('Sede');
  const [newSupCoordenacao, setNewSupCoordenacao] = useState('');

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

  // Recharts Pie Chart Data: Percentagens por Comuna
  const comunaPieData = useMemo(() => {
    const colors: Record<string, string> = {
      Sede: '#e35205',
      Gungo: '#0284c7',
      Gangula: '#16a34a',
      Amboiva: '#9333ea',
    };

    return COMUNAS_SUMBE.map((c) => {
      const cData = stats.comunaStats[c] || { pessoas: 0, fichas: 0 };
      const pct = stats.totalFichas > 0 ? (cData.fichas / stats.totalFichas) * 100 : 25;
      return {
        name: c,
        value: cData.fichas,
        pessoas: cData.pessoas,
        percentStr: `${pct.toFixed(1)}%`,
        color: colors[c] || '#64748b',
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

  // Filtered Submissions
  const filteredSubmissoes = useMemo(() => {
    return submissoes.filter((sub) => {
      const matchSup = filterSupervisor === 'todos' || sub.supervisorId === filterSupervisor;
      const matchComuna =
        filterComuna === 'todos' ||
        sub.fichas.some((f) => f.comuna.toLowerCase() === filterComuna.toLowerCase());
      const matchSearch =
        searchTerm === '' ||
        sub.supervisorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.fichas.some((f) => f.bairro.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchSup && matchComuna && matchSearch;
    });
  }, [submissoes, filterSupervisor, filterComuna, searchTerm]);

  const handleCreateSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupNome.trim()) {
      alert('Por favor insira o nome do supervisor.');
      return;
    }

    const code =
      newSupCodigo.trim() || `SUP-00${supervisores.length + 1}`;

    const created = addSupervisor({
      codigo: code,
      nome: newSupNome.trim(),
      telefone: newSupTelefone.trim() || '+244 923 000 000',
      provincia: newSupProvincia || 'Cuanza-Sul',
      municipio: newSupMunicipio || 'Sumbe',
      comuna: newSupComuna || 'Sede',
      coordenacao: newSupCoordenacao.trim() || 'Coordenação Geral Sumbe',
      ativo: true,
    });

    // Reset inputs
    setNewSupNome('');
    setNewSupCodigo('');
    setNewSupTelefone('');
    setNewSupCoordenacao('');
    setShowAddSupervisorModal(false);

    alert(
      `Supervisor "${created.nome}" gravado com sucesso no Firebase!\nCódigo de Acesso: ${created.codigo}\nComuna Base: ${created.comuna}\nCoordenação: ${created.coordenacao}`
    );
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
            <div className="text-lg font-black text-orange-500 tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-500" />
              <span>MS-Sumbe Admin</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Gestão de Mobilização Social</div>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL DE PREENCHER FICHA NA SIDEBAR */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setActiveScreen('formulario')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition"
            title="Abrir o formulário de preenchimento de fichas"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Preencher Nova Ficha</span>
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white border-l-4 border-l-orange-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Gráficos</span>
          </button>

          <button
            onClick={() => setActiveTab('supervisores')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'supervisores'
                ? 'bg-slate-800 text-white border-l-4 border-l-orange-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>9 Supervisores</span>
            </div>
            <span className="text-xs bg-slate-900 text-orange-400 px-2 py-0.5 rounded-full font-bold">
              {supervisores.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'relatorios'
                ? 'bg-slate-800 text-white border-l-4 border-l-orange-500'
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

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === 'configuracoes'
                ? 'bg-slate-800 text-white border-l-4 border-l-orange-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Definições & Firebase</span>
          </button>
        </nav>

        {/* Rodapé da Sidebar com Status do Firebase */}
        <div className="p-3 border-t border-slate-700/80 bg-slate-900/40 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-200">Município do Sumbe</div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firebase Firestore Ativo</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Admin: {ADMIN_CODE}</div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO ADMIN */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sticky top-0 z-10 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {activeTab === 'dashboard' && 'Visão Geral & Gráficos de Mobilização'}
              {activeTab === 'supervisores' && 'Os 9 Supervisores Cadastrados & Códigos de Acesso'}
              {activeTab === 'relatorios' && 'Fichas e Relatórios Recebidos no Firebase'}
              {activeTab === 'configuracoes' && 'Definições da Base de Dados Firebase & Acesso'}
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

            <button
              onClick={() => setActiveScreen('formulario')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition"
              title="Abrir o formulário de preenchimento de fichas"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Preencher Ficha</span>
            </button>

            <div className="text-right hidden sm:block pl-2 border-l border-slate-200 text-xs">
              <div className="font-bold text-slate-700">Coordenação Municipal</div>
              <div className="text-[10px] text-emerald-600 font-medium font-mono">Código: {ADMIN_CODE}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              AD
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
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-orange-500">
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

              {/* ============================================================ */}
              {/* GRÁFICOS DE PIZZA (PIE CHARTS) COM PERCENTAGENS - 9 SUPERVISORES */}
              {/* ============================================================ */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <PieIcon className="w-5 h-5 text-orange-600" />
                      <span>Gráficos de Pizza com Percentagens dos 9 Supervisores</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Distribuição percentual exata da mobilização entre os 9 coordenadores do Sumbe
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle Métrica */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setSupervisorPieMetric('atividades')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          supervisorPieMetric === 'atividades'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Fichas / Atividades
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupervisorPieMetric('pessoas')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          supervisorPieMetric === 'pessoas'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Pessoas Alcançadas
                      </button>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      9 Supervisores
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
                        Alcance territorial nas 4 comunas do Sumbe
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

                {/* QUADRO ANALÍTICO DE PERCENTAGENS DOS 9 SUPERVISORES */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                      <span>Quadro de Percentagens & Desempenho dos 9 Coordenadores</span>
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
                        {supervisorPieData.map((sup, idx) => (
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
                            <td className="py-2 px-3 font-mono text-orange-700 font-bold">
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
                                className="text-orange-600 hover:text-orange-800 font-semibold inline-flex items-center gap-1 hover:underline text-[11px]"
                              >
                                Ver Fichas
                              </button>
                            </td>
                          </tr>
                        ))}
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
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                      <span>Volume de Atividades e Locais por Supervisor</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparativo de volume das coletas efetuadas por cada um dos 9 supervisores
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
                        fill="#e35205"
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
                      className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      + Preencher Ficha
                    </button>
                    <button
                      onClick={() => setActiveTab('relatorios')}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
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
                            <td className="py-3 px-4 font-bold text-orange-600">
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
                                className="text-xs text-orange-600 hover:text-orange-800 font-semibold inline-flex items-center gap-1"
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
          {/* TAB 2: GESTÃO DOS 9 SUPERVISORES & CÓDIGOS DE ACESSO */}
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
                <button
                  onClick={() => setShowAddSupervisorModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Supervisor</span>
                </button>
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
                      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-orange-300 transition"
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
                                Comuna: <strong className="text-orange-700">{sup.comuna}</strong>
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
                            <span className="font-bold text-orange-400 text-sm">
                              {sup.codigo}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">
                            Entra sem senha
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-orange-600 shrink-0" />
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

                        {/* Estatísticas do supervisor */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                          <div className="bg-orange-50/70 p-2 rounded border border-orange-100">
                            <div className="text-[11px] text-slate-500 font-medium">Fichas Enviadas</div>
                            <div className="text-base font-bold text-orange-800">
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
                      </div>

                      {/* Ações */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleTestAsSupervisor(sup)}
                          className="flex-1 bg-white hover:bg-orange-50 hover:text-orange-700 text-slate-700 border border-slate-200 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          title="Entrar com a conta deste supervisor para ver o formulário dele"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                          <span>Entrar como {sup.nome.split(' ')[0]}</span>
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: RELATÓRIOS & FICHAS */}
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
                    <button
                      onClick={() => setActiveScreen('formulario')}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Preencher Ficha</span>
                    </button>
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
                              <td className="py-3 px-4 font-bold text-orange-600">
                                {sub.totalSim.toLocaleString('pt-PT')}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-500">
                                {sub.totalNao}
                              </td>
                              <td className="py-3 px-4">
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
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setSelectedSubmission(sub)}
                                  className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold px-2.5 py-1.5 rounded transition inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver Detalhes</span>
                                </button>
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
          {activeTab === 'configuracoes' && (
            <div className="space-y-6 max-w-3xl">
              {/* Código Master do Administrador */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Código de Acesso do Administrador
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chave para aceder a este painel administrativo
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-sans">Código do Administrador:</div>
                    <div className="text-2xl font-mono font-black text-orange-400 tracking-wider">
                      {ADMIN_CODE}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 max-w-xs">
                    Permite aceder ao painel, cadastrar novos supervisores, atribuir coordenações e visualizar relatórios consolidados.
                  </div>
                </div>
              </div>

              {/* Informações da Estrutura Municipal & Firebase */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-600" />
                    <span>Conexão Firebase Firestore</span>
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    Sincronizado
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block">Projeto Firebase:</span>
                    <strong className="text-slate-800 text-xs font-mono">gen-lang-client-0240613088</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block">Coleções Ativas:</span>
                    <strong className="text-slate-800 text-xs font-mono">supervisores, submissoes</strong>
                  </div>
                  <div className="col-span-2 p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block mb-1">Comunas do Sumbe:</span>
                    <div className="flex flex-wrap gap-2">
                      {COMUNAS_SUMBE.map((c) => (
                        <span key={c} className="bg-orange-100 text-orange-900 px-2.5 py-1 rounded font-semibold text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Restauração de Dados */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Reiniciar Dados do Sistema</h4>
                  <p className="text-xs text-slate-500">Recarrega os 9 supervisores e fichas originais no Firebase.</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Tem a certeza que deseja restaurar os dados originais dos 9 supervisores?')) {
                      resetToInitialData();
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar 9 Supervisores</span>
                </button>
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
                  Nome Completo do Supervisor <span className="text-orange-600">*</span>
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
                  Código de Acesso do Utilizador <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`SUP-00${supervisores.length + 1}`}
                  value={newSupCodigo}
                  onChange={(e) => setNewSupCodigo(e.target.value)}
                  className="w-full text-sm font-mono font-bold text-orange-800 bg-white"
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
                    Comuna Atribuída <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={newSupComuna}
                    onChange={(e) => setNewSupComuna(e.target.value)}
                    className="w-full text-sm font-bold text-orange-900 border-orange-300 bg-orange-50/50"
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
                  Coordenação de Atuação <span className="text-orange-600">*</span>
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddSupervisorModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs"
                >
                  Salvar Supervisor no Firebase
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
                  <FileText className="w-5 h-5 text-orange-600" />
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
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-5">
              {/* Resumo Rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                  <div className="text-[11px] font-semibold text-orange-800 uppercase">Total Pessoas (Sim)</div>
                  <div className="text-xl font-bold text-orange-900">{selectedSubmission.totalSim.toLocaleString('pt-PT')}</div>
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
                        <span className="bg-orange-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
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
                        <strong>{ficha.casa_locais}</strong> loc. / <strong className="text-orange-600">{ficha.casa_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Igrejas:</span>
                        <strong>{ficha.igrejas_locais}</strong> loc. / <strong className="text-orange-600">{ficha.igrejas_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Praças / Mercados:</span>
                        <strong>{ficha.pracas_locais}</strong> loc. / <strong className="text-orange-600">{ficha.pracas_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Paragens de Táxi:</span>
                        <strong>{ficha.paragem_locais}</strong> loc. / <strong className="text-orange-600">{ficha.paragem_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Creches:</span>
                        <strong>{ficha.creches_locais}</strong> loc. / <strong className="text-orange-600">{ficha.creches_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Escolas:</span>
                        <strong>{ficha.escolas_locais}</strong> loc. / <strong className="text-orange-600">{ficha.escolas_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Pontos de Água:</span>
                        <strong>{ficha.agua_locais}</strong> loc. / <strong className="text-orange-600">{ficha.agua_pessoas}</strong> pess.
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-500 block">Outros:</span>
                        <strong>{ficha.outros_locais}</strong> loc. / <strong className="text-orange-600">{ficha.outros_pessoas}</strong> pess.
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-orange-100/60 p-2.5 rounded-lg border border-orange-200 text-xs">
                      <div>
                        <span className="font-bold text-orange-950">Total Sim: </span>
                        <span className="font-extrabold text-orange-800 text-sm">{ficha.total_sim} pessoas</span>
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg"
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
