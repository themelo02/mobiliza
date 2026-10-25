import React, { useState, useMemo } from 'react';
import { useApp, ADMIN_CODE } from '../context/AppContext';
import { Supervisor, Submissao, COMUNAS_SUMBE, UtilizadorLeitura, Coordenacao } from '../types';
import { exportarFichasParaExcel, formatarDataPt, formatarHoraPt } from '../utils/excelExport';
import { exportarRelatorioParaPDF, calcularTotaisCategorias } from '../utils/pdfExport';
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
  Menu,
  X,
  Network,
  UserPlus,
  Zap,
  Calculator,
  Table,
  Sliders,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Home,
  Church,
  ShoppingBag,
  Car,
  Baby,
  GraduationCap,
  Droplets,
  MoreHorizontal,
  FileDown,
  Sparkles,
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
    coordenacoes,
    userSession,
    adminCode,
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
    updateSubmissao,
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'diario' | 'coordenacoes' | 'supervisores' | 'leitores' | 'relatorios' | 'configuracoes'>('dashboard');

  // Supervisor Form State (com metas de fichas e dias de trabalho)
  const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);
  const [newSupNome, setNewSupNome] = useState('');
  const [newSupCodigo, setNewSupCodigo] = useState('');
  const [newSupTelefone, setNewSupTelefone] = useState('');
  const [newSupProvincia, setNewSupProvincia] = useState('Cuanza-Sul');
  const [newSupMunicipio, setNewSupMunicipio] = useState('Sumbe');
  const [newSupComuna, setNewSupComuna] = useState('Sede');
  const [newSupCoordenacao, setNewSupCoordenacao] = useState('');
  const [newSupFichasDiarias, setNewSupFichasDiarias] = useState<number>(5);
  const [newSupDiasTrabalho, setNewSupDiasTrabalho] = useState<number>(5);
  const [newSupTotalFichas, setNewSupTotalFichas] = useState<number>(25);

  // Modal de Edição Completa do Supervisor (Nome, Código, Telefone, Comuna, Coordenação, Fichas Diárias, Dias)
  const [editingSupervisorFull, setEditingSupervisorFull] = useState<Supervisor | null>(null);
  const [editSupNome, setEditSupNome] = useState('');
  const [editSupCodigo, setEditSupCodigo] = useState('');
  const [editSupTelefone, setEditSupTelefone] = useState('');
  const [editSupProvincia, setEditSupProvincia] = useState('Cuanza-Sul');
  const [editSupMunicipio, setEditSupMunicipio] = useState('Sumbe');
  const [editSupComuna, setEditSupComuna] = useState('Sede');
  const [editSupCoordenacao, setEditSupCoordenacao] = useState('');
  const [editSupFichasDiarias, setEditSupFichasDiarias] = useState<number>(5);
  const [editSupDias, setEditSupDias] = useState<number>(5);
  const [editSupTotalFichasCalculado, setEditSupTotalFichasCalculado] = useState<number>(25);
  const [editSupAtivo, setEditSupAtivo] = useState<boolean>(true);
  const [isSavingSupervisorFull, setIsSavingSupervisorFull] = useState<boolean>(false);
  const [supSuccessMsg, setSupSuccessMsg] = useState('');

  // Modal de Configuração Global de Dias da Campanha (Para Todos os Supervisores de Uma Só Vez)
  const [showBatchDiasModal, setShowBatchDiasModal] = useState<boolean>(false);
  const [batchDias, setBatchDias] = useState<number>(5);
  const [batchModoFichas, setBatchModoFichas] = useState<'manter' | 'padrao'>('manter');
  const [batchFichasPadrao, setBatchFichasPadrao] = useState<number>(5);
  const [isSavingBatchDias, setIsSavingBatchDias] = useState<boolean>(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string>('');

  // Modo de Visualização da Aba de Supervisores (Cartões ou Tabela)
  const [supervisoresViewMode, setSupervisoresViewMode] = useState<'cards' | 'tabela'>('cards');

  // Edit Supervisor Target Modal State (legado para compatibilidade)
  const [editingSupTarget, setEditingSupTarget] = useState<Supervisor | null>(null);
  const [editTotalFichas, setEditTotalFichas] = useState<number>(25);
  const [editDiasTrabalho, setEditDiasTrabalho] = useState<number>(5);
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false);

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Coordenação Form State (Cada coordenação tem 1 a 2 supervisores com cálculo estruturado de mobilizadores × fichas)
  const [showAddCoordenacaoModal, setShowAddCoordenacaoModal] = useState(false);
  const [editingCoordenacao, setEditingCoordenacao] = useState<Coordenacao | null>(null);
  const [newCoordNome, setNewCoordNome] = useState('');
  const [newCoordDescricao, setNewCoordDescricao] = useState('');
  const [newCoordBairros, setNewCoordBairros] = useState('');
  const [newCoordSupervisorIds, setNewCoordSupervisorIds] = useState<string[]>([]);
  const [newCoordDiasTrabalho, setNewCoordDiasTrabalho] = useState<number>(5);
  const [newCoordTotalMobilizadores, setNewCoordTotalMobilizadores] = useState<number>(10);
  const [newCoordFichasDiariasPorMob, setNewCoordFichasDiariasPorMob] = useState<number>(5);
  const [newCoordMetaFichas, setNewCoordMetaFichas] = useState<number>(250);
  const [isCreatingCoord, setIsCreatingCoord] = useState(false);
  const [coordSuccessMsg, setCoordSuccessMsg] = useState('');

  // Edit Coordenação State
  const [editCoordNome, setEditCoordNome] = useState('');
  const [editCoordDescricao, setEditCoordDescricao] = useState('');
  const [editCoordBairros, setEditCoordBairros] = useState('');
  const [editCoordSupervisorIds, setEditCoordSupervisorIds] = useState<string[]>([]);
  const [editCoordDiasTrabalho, setEditCoordDiasTrabalho] = useState<number>(5);
  const [editCoordTotalMobilizadores, setEditCoordTotalMobilizadores] = useState<number>(10);
  const [editCoordFichasDiariasPorMob, setEditCoordFichasDiariasPorMob] = useState<number>(5);
  const [editCoordMetaFichas, setEditCoordMetaFichas] = useState<number>(250);
  const [isSavingCoord, setIsSavingCoord] = useState(false);

  // Assign Supervisor to Coordenação Quick Modal
  const [assignModalCoord, setAssignModalCoord] = useState<Coordenacao | null>(null);
  const [selectedSupervisorToAssign, setSelectedSupervisorToAssign] = useState<string>('');

  // Filter by Day / Date
  const [filterDia, setFilterDia] = useState<string>('todos');

  // Controlo Diário: Sub-vistas (Supervisores, Coordenações, ou Explorador de Fichas por Dia)
  const [diarioSubView, setDiarioSubView] = useState<'supervisores' | 'coordenacoes' | 'explorador'>('supervisores');
  const [diarioFiltroData, setDiarioFiltroData] = useState<string>('todas');
  const [diarioFiltroSupervisor, setDiarioFiltroSupervisor] = useState<string>('todos');
  const [diarioFiltroCoordenacao, setDiarioFiltroCoordenacao] = useState<string>('todas');

  const handleVerFichasDoDia = (data?: string, supervisorId?: string, coordenacaoId?: string) => {
    if (data) setDiarioFiltroData(data);
    if (supervisorId) setDiarioFiltroSupervisor(supervisorId);
    if (coordenacaoId) setDiarioFiltroCoordenacao(coordenacaoId);
    setDiarioSubView('explorador');
  };

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

  // Submission Detail Modal & Edit Modal by Admin
  const [selectedSubmission, setSelectedSubmission] = useState<Submissao | null>(null);
  const [editingSubByAdmin, setEditingSubByAdmin] = useState<Submissao | null>(null);
  const [editAdminData, setEditAdminData] = useState<string>('');
  const [editAdminDia, setEditAdminDia] = useState<number>(1);
  const [editAdminFichas, setEditAdminFichas] = useState<any[]>([]);
  const [isSavingAdminEdit, setIsSavingAdminEdit] = useState<boolean>(false);
  const [adminEditSuccessMsg, setAdminEditSuccessMsg] = useState<string>('');
  const [adminEditErrorMsg, setAdminEditErrorMsg] = useState<string>('');

  const handleStartAdminEditSub = (sub: Submissao) => {
    setEditingSubByAdmin(sub);
    setEditAdminData(sub.data || new Date().toISOString().split('T')[0]);
    setEditAdminDia(sub.diaCampanha || 1);
    setAdminEditSuccessMsg('');
    setAdminEditErrorMsg('');
    setEditAdminFichas(
      (sub.fichas || []).map((f, idx) => ({
        ...f,
        numeroFicha: f.numeroFicha || idx + 1,
        bairro: f.bairro || '',
        comuna: f.comuna || 'Sede',
      }))
    );
  };

  const handleAdminFichaFieldChange = (idx: number, field: string, val: string) => {
    setEditAdminFichas((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      if (field === 'bairro' || field === 'comuna') {
        item[field] = val;
      } else {
        item[field] = val === '' ? '' : Math.max(0, parseInt(val) || 0);
        // live recalculation of total_sim
        const c_casa_p = Number(field === 'casa_pessoas' ? val : item.casa_pessoas) || 0;
        const c_igrejas_p = Number(field === 'igrejas_pessoas' ? val : item.igrejas_pessoas) || 0;
        const c_pracas_p = Number(field === 'pracas_pessoas' ? val : item.pracas_pessoas) || 0;
        const c_paragem_p = Number(field === 'paragem_pessoas' ? val : item.paragem_pessoas) || 0;
        const c_creches_p = Number(field === 'creches_pessoas' ? val : item.creches_pessoas) || 0;
        const c_escolas_p = Number(field === 'escolas_pessoas' ? val : item.escolas_pessoas) || 0;
        const c_agua_p = Number(field === 'agua_pessoas' ? val : item.agua_pessoas) || 0;
        const c_outros_p = Number(field === 'outros_pessoas' ? val : item.outros_pessoas) || 0;
        item.total_sim = c_casa_p + c_igrejas_p + c_pracas_p + c_paragem_p + c_creches_p + c_escolas_p + c_agua_p + c_outros_p;
      }
      copy[idx] = item;
      return copy;
    });
  };

  const handleSaveAdminSubEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubByAdmin) return;
    setIsSavingAdminEdit(true);
    setAdminEditErrorMsg('');
    try {
      const sanitized = editAdminFichas.map((f, idx) => ({
        ...f,
        numeroFicha: idx + 1,
        bairro: (f.bairro || '').trim(),
        comuna: f.comuna || 'Sede',
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

      await updateSubmissao(editingSubByAdmin.id, {
        data: editAdminData,
        diaCampanha: editAdminDia,
        fichas: sanitized,
      });

      setAdminEditSuccessMsg('Submissão atualizada com sucesso!');
      if (selectedSubmission?.id === editingSubByAdmin.id) {
        setSelectedSubmission(null);
      }
      setTimeout(() => {
        setEditingSubByAdmin(null);
        setAdminEditSuccessMsg('');
      }, 1000);
    } catch (err) {
      setAdminEditErrorMsg('Erro ao guardar as alterações.');
    } finally {
      setIsSavingAdminEdit(false);
    }
  };

  // Filters for reports
  const [filterSupervisor, setFilterSupervisor] = useState<string>('todos');
  const [filterComuna, setFilterComuna] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados da Estrutura de Relatórios: 'executivo' | 'geral' | 'supervisor' | 'data_lancamento' | 'coordenacao'
  const [relatorioSubView, setRelatorioSubView] = useState<'executivo' | 'geral' | 'supervisor' | 'data_lancamento' | 'coordenacao'>('executivo');
  const [relatorioSupervisorId, setRelatorioSupervisorId] = useState<string>('todos');
  const [relatorioCoordenacaoId, setRelatorioCoordenacaoId] = useState<string>('todas');
  const [relatorioDataFilter, setRelatorioDataFilter] = useState<string>('todas');
  const [relatorioDataLancamentoFilter, setRelatorioDataLancamentoFilter] = useState<string>('todas');
  const [relatorioExecutivoSearch, setRelatorioExecutivoSearch] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportToast, setPdfExportToast] = useState<string>('');

  // Submissões filtradas para o Relatório Executivo Especializado (Azul Torrado com as 8 categorias)
  const submissoesExecutivoFiltradas = useMemo(() => {
    return submissoes.filter((sub) => {
      // 1. Filtro por Supervisor
      if (relatorioSupervisorId !== 'todos' && sub.supervisorId !== relatorioSupervisorId) {
        return false;
      }

      // 2. Filtro por Coordenação
      if (relatorioCoordenacaoId !== 'todas') {
        const sup = supervisores.find((s) => s.id === sub.supervisorId);
        const coord = coordenacoes.find((c) => c.id === relatorioCoordenacaoId);
        if (!sup || !coord) return false;
        const matchesCoord =
          (coord.supervisorIds && coord.supervisorIds.includes(sup.id)) ||
          sup.coordenacaoId === coord.id ||
          (coord.nome && sup.coordenacao && sup.coordenacao.toLowerCase().trim() === coord.nome.toLowerCase().trim());
        if (!matchesCoord) return false;
      }

      // 3. Filtro por Data (data da atividade ou data do envio)
      if (relatorioDataFilter !== 'todas') {
        const dataEnvioKey = (sub.dataEnvio || '').slice(0, 10);
        if (sub.data !== relatorioDataFilter && dataEnvioKey !== relatorioDataFilter) {
          return false;
        }
      }

      // 4. Pesquisa textual livre (Supervisor, Bairro, Comuna)
      if (relatorioExecutivoSearch.trim()) {
        const term = relatorioExecutivoSearch.toLowerCase().trim();
        const supNome = (sub.supervisorNome || '').toLowerCase();
        const mun = (sub.municipio || '').toLowerCase();
        const prov = (sub.provincia || '').toLowerCase();
        const bairroMatch = (sub.fichas || []).some((f) => (f.bairro || '').toLowerCase().includes(term));
        if (!supNome.includes(term) && !mun.includes(term) && !prov.includes(term) && !bairroMatch) {
          return false;
        }
      }

      return true;
    });
  }, [submissoes, supervisores, coordenacoes, relatorioSupervisorId, relatorioCoordenacaoId, relatorioDataFilter, relatorioExecutivoSearch]);

  // Totais das 8 categorias específicas calculados a partir das submissões filtradas
  const totais8Pontos = useMemo(() => {
    return calcularTotaisCategorias(submissoesExecutivoFiltradas);
  }, [submissoesExecutivoFiltradas]);

  // Resumo de contadores do Relatório Executivo
  const resumoExecutivo = useMemo(() => {
    const t = totais8Pontos;
    const totalLocais =
      t.casa.locais +
      t.igrejas.locais +
      t.pracas.locais +
      t.paragem.locais +
      t.creches.locais +
      t.escolas.locais +
      t.agua.locais +
      t.outros.locais;

    const totalPessoas =
      t.casa.pessoas +
      t.igrejas.pessoas +
      t.pracas.pessoas +
      t.paragem.pessoas +
      t.creches.pessoas +
      t.escolas.pessoas +
      t.agua.pessoas +
      t.outros.pessoas;

    let totalSim = 0;
    let totalNao = 0;
    let totalFichas = 0;

    submissoesExecutivoFiltradas.forEach((s) => {
      totalFichas += s.fichas?.length || 0;
      (s.fichas || []).forEach((f) => {
        totalSim += Number(f.total_sim) || 0;
        totalNao += Number(f.total_nao) || 0;
      });
    });

    const totalAbordadas = totalSim + totalNao > 0 ? totalSim + totalNao : totalPessoas;
    const taxaAdesao = totalAbordadas > 0 ? ((totalSim / totalAbordadas) * 100).toFixed(1) : '100.0';

    return {
      totalLocais,
      totalPessoas,
      totalSim,
      totalNao,
      totalFichas,
      totalAbordadas,
      taxaAdesao,
    };
  }, [totais8Pontos, submissoesExecutivoFiltradas]);

  // Agrupamento de submissões por data de lançamento no sistema (dataEnvio / carimbo de submissão)
  const datasLancamentoAgrupadas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        dataKey: string; // YYYY-MM-DD
        dataFormatada: string;
        dataCompleta: string;
        submissoes: Submissao[];
        totalFichas: number;
        supervisoresNomes: string[];
        totalLocais: number;
        totalSim: number;
        totalNao: number;
        totalPessoas: number;
      }
    >();

    submissoes.forEach((sub) => {
      // Data de lançamento no sistema: obtida a partir do dataEnvio (se não existir, usa sub.data)
      const dataKey = (sub.dataEnvio || '').slice(0, 10) || sub.data || 'Sem Data';
      if (!mapa.has(dataKey)) {
        let dataFormatada = dataKey;
        let dataCompleta = dataKey;
        try {
          if (dataKey !== 'Sem Data' && dataKey.includes('-')) {
            const [ano, mes, dia] = dataKey.split('-').map(Number);
            const dataObj = new Date(ano, mes - 1, dia);
            dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
            dataCompleta = dataObj.toLocaleDateString('pt-PT', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
            dataCompleta = dataCompleta.charAt(0).toUpperCase() + dataCompleta.slice(1);
          }
        } catch {
          dataFormatada = dataKey;
          dataCompleta = dataKey;
        }

        mapa.set(dataKey, {
          dataKey,
          dataFormatada,
          dataCompleta,
          submissoes: [],
          totalFichas: 0,
          supervisoresNomes: [],
          totalLocais: 0,
          totalSim: 0,
          totalNao: 0,
          totalPessoas: 0,
        });
      }

      const item = mapa.get(dataKey)!;
      item.submissoes.push(sub);
      item.totalFichas += sub.fichas?.length || 0;
      if (!item.supervisoresNomes.includes(sub.supervisorNome)) {
        item.supervisoresNomes.push(sub.supervisorNome);
      }

      (sub.fichas || []).forEach((f) => {
        const locaisFicha =
          (f.casa_locais || 0) +
          (f.igrejas_locais || 0) +
          (f.pracas_locais || 0) +
          (f.paragem_locais || 0) +
          (f.creches_locais || 0) +
          (f.escolas_locais || 0) +
          (f.agua_locais || 0) +
          (f.outros_locais || 0);
        item.totalLocais += locaisFicha;
        item.totalSim += Number(f.total_sim) || 0;
        item.totalNao += Number(f.total_nao) || 0;
      });

      item.totalPessoas = item.totalSim + item.totalNao;
    });

    return Array.from(mapa.values()).sort((a, b) => b.dataKey.localeCompare(a.dataKey));
  }, [submissoes]);

  // ==============================================================
  // CAMADA LÓGICA AUTOMATIZADA (AUTOMATED FICHA PLANNING LOGIC LAYER)
  // Calcula o total requerido de fichas por supervisor com base nos dias
  // de trabalho escolhidos e na meta diária de cada supervisor, gerando
  // resumos consolidados para o painel de administração e relatórios.
  // ==============================================================
  const automatedFichaPlanning = useMemo(() => {
    let totalRequeridoGeral = 0;
    let totalLancadoGeral = 0;
    let totalRestanteGeral = 0;
    let totalPessoasGeral = 0;
    let totalLocaisGeral = 0;
    let totalSimGeral = 0;
    let totalNaoGeral = 0;

    const categoriasTotaisGeral = {
      casa: { locais: 0, pessoas: 0 },
      igrejas: { locais: 0, pessoas: 0 },
      pracas: { locais: 0, pessoas: 0 },
      paragem: { locais: 0, pessoas: 0 },
      creches: { locais: 0, pessoas: 0 },
      escolas: { locais: 0, pessoas: 0 },
      agua: { locais: 0, pessoas: 0 },
      outros: { locais: 0, pessoas: 0 },
    };

    const supervisoresCalculados = supervisores.map((sup) => {
      const supSubs = submissoes.filter((s) => s.supervisorId === sup.id);
      const diasTrabalho = Math.max(1, Number(sup.diasTrabalhoPrevistos) || 5);

      // Reconhecer e honrar com precisão as informações reais com que o supervisor foi lançado
      const totalFichasRequeridas =
        sup.totalFichasPrevistas !== undefined && Number(sup.totalFichasPrevistas) > 0
          ? Number(sup.totalFichasPrevistas)
          : (sup.fichasDiariasPrevistas
              ? Number(sup.fichasDiariasPrevistas) * diasTrabalho
              : 25);

      const fichasDiarias =
        sup.fichasDiariasPrevistas !== undefined && Number(sup.fichasDiariasPrevistas) > 0
          ? Number(sup.fichasDiariasPrevistas)
          : Math.max(1, Math.round(totalFichasRequeridas / diasTrabalho));

      let fichasLancadas = 0;
      let pessoasMobilizadas = 0;
      let locaisVisitados = 0;
      let totalSim = 0;
      let totalNao = 0;

      const categoriasSupervisor = {
        casa: { locais: 0, pessoas: 0 },
        igrejas: { locais: 0, pessoas: 0 },
        pracas: { locais: 0, pessoas: 0 },
        paragem: { locais: 0, pessoas: 0 },
        creches: { locais: 0, pessoas: 0 },
        escolas: { locais: 0, pessoas: 0 },
        agua: { locais: 0, pessoas: 0 },
        outros: { locais: 0, pessoas: 0 },
      };

      // Fichas individuais exatamente como inseridas no formulário
      const fichasIndividuais: Array<{
        submissaoId: string;
        data: string;
        diaCampanha: number;
        status: string;
        numeroFicha: number;
        bairro: string;
        comuna: string;
        casa_locais: number;
        casa_pessoas: number;
        igrejas_locais: number;
        igrejas_pessoas: number;
        pracas_locais: number;
        pracas_pessoas: number;
        paragem_locais: number;
        paragem_pessoas: number;
        creches_locais: number;
        creches_pessoas: number;
        escolas_locais: number;
        escolas_pessoas: number;
        agua_locais: number;
        agua_pessoas: number;
        outros_locais: number;
        outros_pessoas: number;
        total_sim: number;
        total_nao: number;
        totalLocaisFicha: number;
        totalPessoasFicha: number;
      }> = [];

      supSubs.forEach((sub) => {
        fichasLancadas += sub.fichas ? sub.fichas.length : 0;
        pessoasMobilizadas += Number(sub.totalSim) || 0;
        locaisVisitados += Number(sub.totalLocais) || 0;
        totalSim += Number(sub.totalSim) || 0;
        totalNao += Number(sub.totalNao) || 0;

        (sub.fichas || []).forEach((f, idx) => {
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

          categoriasSupervisor.casa.locais += c_casa_l;
          categoriasSupervisor.casa.pessoas += c_casa_p;
          categoriasSupervisor.igrejas.locais += c_igrejas_l;
          categoriasSupervisor.igrejas.pessoas += c_igrejas_p;
          categoriasSupervisor.pracas.locais += c_pracas_l;
          categoriasSupervisor.pracas.pessoas += c_pracas_p;
          categoriasSupervisor.paragem.locais += c_paragem_l;
          categoriasSupervisor.paragem.pessoas += c_paragem_p;
          categoriasSupervisor.creches.locais += c_creches_l;
          categoriasSupervisor.creches.pessoas += c_creches_p;
          categoriasSupervisor.escolas.locais += c_escolas_l;
          categoriasSupervisor.escolas.pessoas += c_escolas_p;
          categoriasSupervisor.agua.locais += c_agua_l;
          categoriasSupervisor.agua.pessoas += c_agua_p;
          categoriasSupervisor.outros.locais += c_outros_l;
          categoriasSupervisor.outros.pessoas += c_outros_p;

          categoriasTotaisGeral.casa.locais += c_casa_l;
          categoriasTotaisGeral.casa.pessoas += c_casa_p;
          categoriasTotaisGeral.igrejas.locais += c_igrejas_l;
          categoriasTotaisGeral.igrejas.pessoas += c_igrejas_p;
          categoriasTotaisGeral.pracas.locais += c_pracas_l;
          categoriasTotaisGeral.pracas.pessoas += c_pracas_p;
          categoriasTotaisGeral.paragem.locais += c_paragem_l;
          categoriasTotaisGeral.paragem.pessoas += c_paragem_p;
          categoriasTotaisGeral.creches.locais += c_creches_l;
          categoriasTotaisGeral.creches.pessoas += c_creches_p;
          categoriasTotaisGeral.escolas.locais += c_escolas_l;
          categoriasTotaisGeral.escolas.pessoas += c_escolas_p;
          categoriasTotaisGeral.agua.locais += c_agua_l;
          categoriasTotaisGeral.agua.pessoas += c_agua_p;
          categoriasTotaisGeral.outros.locais += c_outros_l;
          categoriasTotaisGeral.outros.pessoas += c_outros_p;

          const totLocaisFicha =
            c_casa_l + c_igrejas_l + c_pracas_l + c_paragem_l + c_creches_l + c_escolas_l + c_agua_l + c_outros_l;
          const fSim = Number(f.total_sim) || 0;
          const fNao = Number(f.total_nao) || 0;

          fichasIndividuais.push({
            submissaoId: sub.id,
            data: sub.data,
            diaCampanha: f.diaCampanha || sub.diaCampanha || 1,
            status: sub.status,
            numeroFicha: f.numeroFicha || idx + 1,
            bairro: f.bairro || 'Sem Bairro',
            comuna: f.comuna || sup.comuna || 'Sede',
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
            total_sim: fSim,
            total_nao: fNao,
            totalLocaisFicha: totLocaisFicha,
            totalPessoasFicha: fSim,
          });
        });
      });

      const fichasRestantes = Math.max(0, totalFichasRequeridas - fichasLancadas);
      const percentualCumprimento =
        totalFichasRequeridas > 0 ? (fichasLancadas / totalFichasRequeridas) * 100 : 0;
      const mediaDiariaAtual = diasTrabalho > 0 ? fichasLancadas / diasTrabalho : 0;

      totalRequeridoGeral += totalFichasRequeridas;
      totalLancadoGeral += fichasLancadas;
      totalRestanteGeral += fichasRestantes;
      totalPessoasGeral += pessoasMobilizadas;
      totalLocaisGeral += locaisVisitados;
      totalSimGeral += totalSim;
      totalNaoGeral += totalNao;

      return {
        supervisor: sup,
        diasTrabalho,
        fichasDiarias,
        totalFichasRequeridas,
        fichasLancadas,
        fichasRestantes,
        pessoasMobilizadas,
        locaisVisitados,
        totalSim,
        totalNao,
        percentualCumprimento: Number(percentualCumprimento.toFixed(1)),
        percentualStr: `${percentualCumprimento.toFixed(1)}%`,
        mediaDiariaAtual: Number(mediaDiariaAtual.toFixed(1)),
        categorias: categoriasSupervisor,
        fichasIndividuais,
      };
    });

    // Agrupamento por Coordenação
    const coordenacoesCalculadas = coordenacoes.map((coord) => {
      const assignedSups = supervisoresCalculados.filter(
        (sc) =>
          (coord.supervisorIds && coord.supervisorIds.includes(sc.supervisor.id)) ||
          sc.supervisor.coordenacaoId === coord.id ||
          (coord.nome &&
            sc.supervisor.coordenacao &&
            sc.supervisor.coordenacao.toLowerCase().trim() === coord.nome.toLowerCase().trim())
      );

      const totalRequeridoCoord = assignedSups.reduce((acc, s) => acc + s.totalFichasRequeridas, 0);
      const totalLancadoCoord = assignedSups.reduce((acc, s) => acc + s.fichasLancadas, 0);
      const totalRestanteCoord = Math.max(0, totalRequeridoCoord - totalLancadoCoord);
      const totalPessoasCoord = assignedSups.reduce((acc, s) => acc + s.pessoasMobilizadas, 0);
      const totalLocaisCoord = assignedSups.reduce((acc, s) => acc + s.locaisVisitados, 0);
      const totalSimCoord = assignedSups.reduce((acc, s) => acc + s.totalSim, 0);
      const totalNaoCoord = assignedSups.reduce((acc, s) => acc + s.totalNao, 0);
      const percentualCoord =
        totalRequeridoCoord > 0 ? (totalLancadoCoord / totalRequeridoCoord) * 100 : 0;

      const categoriasCoord = {
        casa: { locais: 0, pessoas: 0 },
        igrejas: { locais: 0, pessoas: 0 },
        pracas: { locais: 0, pessoas: 0 },
        paragem: { locais: 0, pessoas: 0 },
        creches: { locais: 0, pessoas: 0 },
        escolas: { locais: 0, pessoas: 0 },
        agua: { locais: 0, pessoas: 0 },
        outros: { locais: 0, pessoas: 0 },
      };

      const todasFichasCoord: Array<{
        submissaoId: string;
        data: string;
        diaCampanha: number;
        status: string;
        numeroFicha: number;
        bairro: string;
        comuna: string;
        supervisorNome: string;
        supervisorCodigo: string;
        casa_locais: number;
        casa_pessoas: number;
        igrejas_locais: number;
        igrejas_pessoas: number;
        pracas_locais: number;
        pracas_pessoas: number;
        paragem_locais: number;
        paragem_pessoas: number;
        creches_locais: number;
        creches_pessoas: number;
        escolas_locais: number;
        escolas_pessoas: number;
        agua_locais: number;
        agua_pessoas: number;
        outros_locais: number;
        outros_pessoas: number;
        total_sim: number;
        total_nao: number;
        totalLocaisFicha: number;
        totalPessoasFicha: number;
      }> = [];

      assignedSups.forEach((sc) => {
        categoriasCoord.casa.locais += sc.categorias.casa.locais;
        categoriasCoord.casa.pessoas += sc.categorias.casa.pessoas;
        categoriasCoord.igrejas.locais += sc.categorias.igrejas.locais;
        categoriasCoord.igrejas.pessoas += sc.categorias.igrejas.pessoas;
        categoriasCoord.pracas.locais += sc.categorias.pracas.locais;
        categoriasCoord.pracas.pessoas += sc.categorias.pracas.pessoas;
        categoriasCoord.paragem.locais += sc.categorias.paragem.locais;
        categoriasCoord.paragem.pessoas += sc.categorias.paragem.pessoas;
        categoriasCoord.creches.locais += sc.categorias.creches.locais;
        categoriasCoord.creches.pessoas += sc.categorias.creches.pessoas;
        categoriasCoord.escolas.locais += sc.categorias.escolas.locais;
        categoriasCoord.escolas.pessoas += sc.categorias.escolas.pessoas;
        categoriasCoord.agua.locais += sc.categorias.agua.locais;
        categoriasCoord.agua.pessoas += sc.categorias.agua.pessoas;
        categoriasCoord.outros.locais += sc.categorias.outros.locais;
        categoriasCoord.outros.pessoas += sc.categorias.outros.pessoas;

        sc.fichasIndividuais.forEach((f) => {
          todasFichasCoord.push({
            ...f,
            supervisorNome: sc.supervisor.nome,
            supervisorCodigo: sc.supervisor.codigo,
          });
        });
      });

      return {
        coordenacao: coord,
        supervisoresVinculados: assignedSups,
        totalRequeridoCoord,
        totalLancadoCoord,
        totalRestanteCoord,
        totalPessoasCoord,
        totalLocaisCoord,
        totalSimCoord,
        totalNaoCoord,
        percentualCoord: Number(percentualCoord.toFixed(1)),
        percentualCoordStr: `${percentualCoord.toFixed(1)}%`,
        categoriasCoord,
        todasFichasCoord,
      };
    });

    const progressoGeralPct =
      totalRequeridoGeral > 0 ? (totalLancadoGeral / totalRequeridoGeral) * 100 : 0;

    const mediaDiasCampanha =
      supervisores.length > 0
        ? Math.round(
            supervisores.reduce((acc, s) => acc + (s.diasTrabalhoPrevistos || 5), 0) / supervisores.length
          )
        : 5;

    return {
      supervisoresCalculados,
      coordenacoesCalculadas,
      totalRequeridoGeral,
      totalLancadoGeral,
      totalRestanteGeral,
      totalPessoasGeral,
      totalLocaisGeral,
      totalSimGeral,
      totalNaoGeral,
      categoriasTotaisGeral,
      progressoGeralPct: Number(progressoGeralPct.toFixed(1)),
      progressoGeralStr: `${progressoGeralPct.toFixed(1)}%`,
      mediaDiasCampanha,
    };
  }, [supervisores, submissoes, coordenacoes]);

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
      const diasPrevistos = Math.max(1, Number(sup.diasTrabalhoPrevistos) || 5);
      const totalPrevisto =
        sup.totalFichasPrevistas !== undefined && Number(sup.totalFichasPrevistas) > 0
          ? Number(sup.totalFichasPrevistas)
          : (sup.fichasDiariasPrevistas ? Number(sup.fichasDiariasPrevistas) * diasPrevistos : 25);
      const metaDiaria =
        sup.fichasDiariasPrevistas !== undefined && Number(sup.fichasDiariasPrevistas) > 0
          ? Number(sup.fichasDiariasPrevistas)
          : Math.max(1, Math.round(totalPrevisto / diasPrevistos));

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

    // 3. Matriz de desempenho por Coordenação (cada coordenação tem 1 a 2 supervisores)
    const coordenacaoMatrix = coordenacoes.map((coord) => {
      // Obter supervisores atribuídos a esta coordenação
      const assignedSups = supervisores.filter(
        (s) =>
          (coord.supervisorIds && coord.supervisorIds.includes(s.id)) ||
          s.coordenacaoId === coord.id ||
          (coord.nome && s.coordenacao && s.coordenacao.toLowerCase().trim() === coord.nome.toLowerCase().trim())
      );
      const supIds = assignedSups.map((s) => s.id);

      // Submissões pertencentes a esses supervisores
      const coordSubs = submissoes.filter((s) => supIds.includes(s.supervisorId));

      const totalPrevisto =
        assignedSups.length > 0
          ? assignedSups.reduce((acc, s) => {
              const supReal =
                s.totalFichasPrevistas !== undefined && Number(s.totalFichasPrevistas) > 0
                  ? Number(s.totalFichasPrevistas)
                  : (s.fichasDiariasPrevistas && s.diasTrabalhoPrevistos
                      ? Number(s.fichasDiariasPrevistas) * Number(s.diasTrabalhoPrevistos)
                      : 25);
              return acc + supReal;
            }, 0)
          : (coord.metaFichasTotal || 50);

      const fichasPorData: Record<string, number> = {};
      const pessoasPorData: Record<string, number> = {};
      let totalFichasLancadas = 0;
      let totalPessoasLancadas = 0;
      let diasTrabalhados = 0;

      sortedDates.forEach((d) => {
        const subsDoDia = coordSubs.filter((s) => s.data === d);
        let fichasNoDia = 0;
        let pessoasNoDia = 0;
        subsDoDia.forEach((s) => {
          fichasNoDia += s.fichas ? s.fichas.length : 0;
          pessoasNoDia += s.totalSim;
        });
        fichasPorData[d] = fichasNoDia;
        pessoasPorData[d] = pessoasNoDia;
        totalFichasLancadas += fichasNoDia;
        totalPessoasLancadas += pessoasNoDia;
        if (fichasNoDia > 0) diasTrabalhados += 1;
      });

      const percentualCumprido = totalPrevisto > 0 ? (totalFichasLancadas / totalPrevisto) * 100 : 0;

      return {
        coordenacao: coord,
        supervisores: assignedSups,
        totalPrevisto,
        fichasPorData,
        pessoasPorData,
        totalFichasLancadas,
        totalPessoasLancadas,
        diasTrabalhados,
        percentualCumprido: Number(percentualCumprido.toFixed(1)),
        percentualStr: `${percentualCumprido.toFixed(1)}%`,
      };
    });

    // 4. Totais por dia de trabalho
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

    // 5. Chart Data para Recharts
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

    // 6. Total de fichas previstas somando todos os supervisores
    const totalGeralPrevisto = supervisorMatrix.reduce((acc, m) => acc + m.totalPrevisto, 0);
    const totalGeralLancado = supervisorMatrix.reduce((acc, m) => acc + m.totalFichasLancadas, 0);
    const taxaGlobalCumprimento = totalGeralPrevisto > 0 ? (totalGeralLancado / totalGeralPrevisto) * 100 : 0;

    return {
      sortedDates,
      dateLabels,
      supervisorMatrix,
      coordenacaoMatrix,
      totalsByDate,
      chartData,
      totalGeralPrevisto,
      totalGeralLancado,
      taxaGlobalCumprimento: Number(taxaGlobalCumprimento.toFixed(1)),
    };
  }, [supervisores, submissoes, coordenacoes]);

  // Submissões filtradas para o Explorador de Fichas por Dia (Supervisores & Coordenações)
  const filteredSubmissoesDiario = useMemo(() => {
    return submissoes.filter((sub) => {
      // Filtro de Data
      if (diarioFiltroData !== 'todas' && sub.data !== diarioFiltroData) {
        return false;
      }
      // Filtro de Supervisor
      if (diarioFiltroSupervisor !== 'todos' && sub.supervisorId !== diarioFiltroSupervisor) {
        return false;
      }
      // Filtro de Coordenação
      if (diarioFiltroCoordenacao !== 'todas') {
        const sup = supervisores.find((s) => s.id === sub.supervisorId);
        const coord = coordenacoes.find((c) => c.id === diarioFiltroCoordenacao);
        if (!sup || !coord) return false;
        const matchesCoord =
          (coord.supervisorIds && coord.supervisorIds.includes(sup.id)) ||
          sup.coordenacaoId === coord.id ||
          (coord.nome && sup.coordenacao && sup.coordenacao.toLowerCase().trim() === coord.nome.toLowerCase().trim());
        if (!matchesCoord) return false;
      }
      return true;
    });
  }, [submissoes, supervisores, coordenacoes, diarioFiltroData, diarioFiltroSupervisor, diarioFiltroCoordenacao]);

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

  // Coordenacao Handlers (Cada coordenação tem 1 a 2 supervisores)
  const handleCreateCoordenacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoordNome.trim()) {
      alert('Por favor insira o nome da coordenação.');
      return;
    }

    if (newCoordSupervisorIds.length > 2) {
      alert('Regra do Sistema: Cada coordenação pode ter no máximo 2 supervisores.');
      return;
    }

    setIsCreatingCoord(true);
    try {
      const bairrosArray = newCoordBairros
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const dias = Math.max(1, Number(newCoordDiasTrabalho) || 5);
      const mobilizadores = Math.max(1, Number(newCoordTotalMobilizadores) || 10);
      const porMob = Math.max(1, Number(newCoordFichasDiariasPorMob) || 5);
      const totalDiarias = mobilizadores * porMob;
      const metaTotal = Math.max(1, Number(newCoordMetaFichas) || totalDiarias * dias);

      const created = await addCoordenacao({
        nome: newCoordNome.trim(),
        descricao: newCoordDescricao.trim() || 'Setor de mobilização comunitária no Sumbe',
        bairros: bairrosArray.length > 0 ? bairrosArray : ['Sede'],
        municipio: 'Sumbe',
        comuna: 'Sede',
        supervisorIds: newCoordSupervisorIds.slice(0, 2),
        limiteSupervisores: 2,
        diasTrabalho: dias,
        totalMobilizadores: mobilizadores,
        fichasDiariasPorMobilizador: porMob,
        totalFichasDiarias: totalDiarias,
        metaFichasTotal: metaTotal,
      });

      setNewCoordNome('');
      setNewCoordDescricao('');
      setNewCoordBairros('');
      setNewCoordSupervisorIds([]);
      setNewCoordDiasTrabalho(5);
      setNewCoordTotalMobilizadores(10);
      setNewCoordFichasDiariasPorMob(5);
      setNewCoordMetaFichas(250);
      setShowAddCoordenacaoModal(false);
      setCoordSuccessMsg(
        `Coordenação "${created.nome}" cadastrada com sucesso!\n${mobilizadores} mobilizadores × ${porMob} fichas/dia = ${totalDiarias} fichas/dia (${metaTotal} fichas em ${dias} dias).`
      );
      setTimeout(() => setCoordSuccessMsg(''), 7000);
    } catch {
      alert('Erro ao gravar coordenação no Firebase.');
    } finally {
      setIsCreatingCoord(false);
    }
  };

  const handleOpenAssignModal = (coord: Coordenacao) => {
    setAssignModalCoord(coord);
    const available = supervisores.filter((s) => !coord.supervisorIds.includes(s.id));
    setSelectedSupervisorToAssign(available[0]?.id || '');
  };

  const handleConfirmAssign = async () => {
    if (!assignModalCoord || !selectedSupervisorToAssign) return;
    const res = await assignSupervisorToCoordenacao(assignModalCoord.id, selectedSupervisorToAssign);
    if (!res.success) {
      alert(res.message);
    } else {
      setAssignModalCoord(null);
      setSelectedSupervisorToAssign('');
    }
  };

  const handleRemoveSupervisorFromCoord = async (coordId: string, supId: string) => {
    if (window.confirm('Deseja desvincular este supervisor desta coordenação?')) {
      await removeSupervisorFromCoordenacao(coordId, supId);
    }
  };

  const handleOpenEditCoordenacao = (coord: Coordenacao) => {
    const dias = coord.diasTrabalho || 5;
    const mob = coord.totalMobilizadores || 10;
    const porMob = coord.fichasDiariasPorMobilizador || 5;
    const totalDiario = mob * porMob;
    const totalGeral = coord.metaFichasTotal || totalDiario * dias;

    setEditingCoordenacao(coord);
    setEditCoordNome(coord.nome);
    setEditCoordDescricao(coord.descricao || '');
    setEditCoordBairros((coord.bairros || []).join(', '));
    setEditCoordSupervisorIds(coord.supervisorIds || []);
    setEditCoordDiasTrabalho(dias);
    setEditCoordTotalMobilizadores(mob);
    setEditCoordFichasDiariasPorMob(porMob);
    setEditCoordMetaFichas(totalGeral);
  };

  const handleSaveEditCoordenacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoordenacao) return;
    if (!editCoordNome.trim()) {
      alert('Por favor insira o nome da coordenação.');
      return;
    }
    if (editCoordSupervisorIds.length > 2) {
      alert('Regra do Sistema: Cada coordenação pode ter no máximo 2 supervisores.');
      return;
    }

    setIsSavingCoord(true);
    try {
      const bairrosArray = editCoordBairros
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const dias = Math.max(1, Number(editCoordDiasTrabalho) || 5);
      const mob = Math.max(1, Number(editCoordTotalMobilizadores) || 10);
      const porMob = Math.max(1, Number(editCoordFichasDiariasPorMob) || 5);
      const totalDiarias = mob * porMob;
      const metaTotal = Math.max(1, Number(editCoordMetaFichas) || totalDiarias * dias);

      await updateCoordenacao(editingCoordenacao.id, {
        nome: editCoordNome.trim(),
        descricao: editCoordDescricao.trim(),
        bairros: bairrosArray.length > 0 ? bairrosArray : ['Sede'],
        supervisorIds: editCoordSupervisorIds.slice(0, 2),
        diasTrabalho: dias,
        totalMobilizadores: mob,
        fichasDiariasPorMobilizador: porMob,
        totalFichasDiarias: totalDiarias,
        metaFichasTotal: metaTotal,
      });

      setEditingCoordenacao(null);
      setCoordSuccessMsg(
        `Coordenação "${editCoordNome.trim()}" atualizada com sucesso!\n${mob} mobilizadores × ${porMob} fichas/dia = ${totalDiarias} fichas/dia (${metaTotal} fichas em ${dias} dias).`
      );
      setTimeout(() => setCoordSuccessMsg(''), 7000);
    } catch {
      alert('Erro ao atualizar coordenação no Firebase.');
    } finally {
      setIsSavingCoord(false);
    }
  };

  const handleDeleteCoordenacao = async (coord: Coordenacao) => {
    if (window.confirm(`Deseja realmente eliminar a "${coord.nome}"?\nOs supervisores associados continuarão registados no sistema.`)) {
      for (const supId of coord.supervisorIds) {
        await updateSupervisor(supId, {
          coordenacao: 'Coordenação Geral Sumbe',
          coordenacaoId: undefined,
        });
      }
      await deleteCoordenacao(coord.id);
      setCoordSuccessMsg(`Coordenação "${coord.nome}" eliminada com sucesso.`);
      setTimeout(() => setCoordSuccessMsg(''), 6000);
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

    const diasTrab = Math.max(1, Number(newSupDiasTrabalho) || 5);
    const totalFichas = Math.max(1, Number(newSupTotalFichas) || (Number(newSupFichasDiarias) * diasTrab) || 25);
    const fichasDiarias = Math.max(1, Number(newSupFichasDiarias) || Math.round(totalFichas / diasTrab) || 1);

    const matchedCoord = coordenacoes.find(
      (c) => c.nome.toLowerCase() === newSupCoordenacao.trim().toLowerCase()
    );

    const created = await addSupervisor({
      codigo: code,
      nome: newSupNome.trim(),
      telefone: newSupTelefone.trim() || '+244 923 000 000',
      provincia: newSupProvincia || 'Cuanza-Sul',
      municipio: newSupMunicipio || 'Sumbe',
      comuna: newSupComuna || 'Sede',
      coordenacao: newSupCoordenacao.trim() || (coordenacoes[0]?.nome || 'Coordenação Sumbe Centro & Litoral'),
      coordenacaoId: matchedCoord?.id,
      fichasDiariasPrevistas: fichasDiarias,
      totalFichasPrevistas: totalFichas,
      diasTrabalhoPrevistos: diasTrab,
      ativo: true,
    });

    if (matchedCoord && matchedCoord.supervisorIds.length < 2) {
      await assignSupervisorToCoordenacao(matchedCoord.id, created.id);
    }

    // Reset inputs
    setNewSupNome('');
    setNewSupCodigo('');
    setNewSupTelefone('');
    setNewSupCoordenacao('');
    setNewSupFichasDiarias(5);
    setNewSupDiasTrabalho(5);
    setNewSupTotalFichas(25);
    setShowAddSupervisorModal(false);

    setSupSuccessMsg(
      `Supervisor "${created.nome}" gravado com sucesso no Firebase!\nCódigo: ${created.codigo} • ${totalFichas} fichas atribuídas (${fichasDiarias} fichas/dia × ${diasTrab} dias).`
    );
    setTimeout(() => setSupSuccessMsg(''), 7000);
  };

  // Abrir Modal de Edição Completa do Supervisor
  const handleOpenEditSupervisorFull = (sup: Supervisor) => {
    setEditingSupervisorFull(sup);
    setEditSupNome(sup.nome);
    setEditSupCodigo(sup.codigo);
    setEditSupTelefone(sup.telefone || '');
    setEditSupProvincia(sup.provincia || 'Cuanza-Sul');
    setEditSupMunicipio(sup.municipio || 'Sumbe');
    setEditSupComuna(sup.comuna || 'Sede');
    setEditSupCoordenacao(sup.coordenacao || '');
    const dias = Math.max(1, Number(sup.diasTrabalhoPrevistos) || 5);
    const totalExato = sup.totalFichasPrevistas !== undefined && Number(sup.totalFichasPrevistas) > 0
      ? Number(sup.totalFichasPrevistas)
      : 25;
    const fichasDiarias = sup.fichasDiariasPrevistas !== undefined && Number(sup.fichasDiariasPrevistas) > 0
      ? Number(sup.fichasDiariasPrevistas)
      : Math.max(1, Math.round(totalExato / dias));
    setEditSupDias(dias);
    setEditSupFichasDiarias(fichasDiarias);
    setEditSupTotalFichasCalculado(totalExato);
    setEditSupAtivo(sup.ativo);
  };

  // Salvar Edição Completa do Supervisor com Recálculo Automático
  const handleSaveSupervisorFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupervisorFull) return;
    if (!editSupNome.trim()) {
      alert('Por favor insira o nome do supervisor.');
      return;
    }

    setIsSavingSupervisorFull(true);
    try {
      const dias = Math.max(1, Number(editSupDias) || 5);
      const totalFichas = Math.max(1, Number(editSupTotalFichasCalculado) || (Number(editSupFichasDiarias) * dias) || 25);
      const fichasDiarias = Math.max(1, Number(editSupFichasDiarias) || Math.round(totalFichas / dias) || 1);

      const matchedCoord = coordenacoes.find(
        (c) => c.nome.toLowerCase() === editSupCoordenacao.trim().toLowerCase()
      );

      await updateSupervisor(editingSupervisorFull.id, {
        nome: editSupNome.trim(),
        codigo: editSupCodigo.trim() || editingSupervisorFull.codigo,
        telefone: editSupTelefone.trim() || '+244 923 000 000',
        provincia: editSupProvincia || 'Cuanza-Sul',
        municipio: editSupMunicipio || 'Sumbe',
        comuna: editSupComuna || 'Sede',
        coordenacao: editSupCoordenacao.trim() || editingSupervisorFull.coordenacao,
        coordenacaoId: matchedCoord?.id || editingSupervisorFull.coordenacaoId,
        fichasDiariasPrevistas: fichasDiarias,
        diasTrabalhoPrevistos: dias,
        totalFichasPrevistas: totalFichas,
        ativo: editSupAtivo,
      });

      // Se a coordenação mudou e tem vaga, vincular
      if (matchedCoord && !matchedCoord.supervisorIds.includes(editingSupervisorFull.id) && matchedCoord.supervisorIds.length < 2) {
        await assignSupervisorToCoordenacao(matchedCoord.id, editingSupervisorFull.id);
      }

      setSupSuccessMsg(
        `Dados do supervisor "${editSupNome.trim()}" atualizados com sucesso no Firebase! Meta: ${totalFichas} fichas (${fichasDiarias} fichas/dia × ${dias} dias de trabalho).`
      );
      setTimeout(() => setSupSuccessMsg(''), 7000);
      setEditingSupervisorFull(null);
    } catch {
      alert('Erro ao atualizar supervisor no Firebase.');
    } finally {
      setIsSavingSupervisorFull(false);
    }
  };

  // Aplicar Dias de Trabalho para Todos os Supervisores de Uma Só Vez (Lote Único)
  const handleApplyBatchDias = async (e: React.FormEvent) => {
    e.preventDefault();
    const dias = Math.max(1, Number(batchDias) || 5);
    const defaultFichas = batchModoFichas === 'padrao' ? Math.max(1, Number(batchFichasPadrao) || 5) : undefined;

    setIsSavingBatchDias(true);
    try {
      const res = await batchUpdateSupervisoresDias(dias, defaultFichas);
      setBatchSuccessMsg(
        `Configuração global aplicada com sucesso a todos os ${res.count} supervisores! Duração definida para ${dias} dias de trabalho. O sistema recalculou automaticamente as metas: meta total geral da campanha é agora de ${res.totalFichasCampanha} fichas.`
      );
      setTimeout(() => setBatchSuccessMsg(''), 8000);
      setShowBatchDiasModal(false);
    } catch {
      alert('Erro ao gravar configuração global no Firebase.');
    } finally {
      setIsSavingBatchDias(false);
    }
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
      setSupSuccessMsg(`Metas do supervisor "${editingSupTarget.nome}" atualizadas com sucesso: ${totalFichas} fichas em ${diasTrab} dias!`);
      setTimeout(() => setSupSuccessMsg(''), 6000);
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

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [excelExportToast, setExcelExportToast] = useState<string>('');

  const handleExportExcel = (filtro?: { supervisorId?: string; dataLancamento?: string; titulo?: string }) => {
    try {
      setIsExportingExcel(true);
      exportarFichasParaExcel({
        submissoes,
        supervisores,
        coordenacoes,
        supervisorFiltroId: filtro?.supervisorId,
        dataLancamentoFiltro: filtro?.dataLancamento,
        filtroTitulo: filtro?.titulo,
      });
      setExcelExportToast(
        filtro?.titulo
          ? `Ficheiro Excel exportado com sucesso (${filtro.titulo})!`
          : 'Ficheiro Excel (.xlsx) completo exportado com sucesso!'
      );
      setTimeout(() => setExcelExportToast(''), 4500);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      alert('Ocorreu um erro ao gerar o ficheiro Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPdf(true);
      const supObj = supervisores.find((s) => s.id === relatorioSupervisorId);
      const coordObj = coordenacoes.find((c) => c.id === relatorioCoordenacaoId);

      exportarRelatorioParaPDF({
        submissoes: submissoesExecutivoFiltradas,
        supervisores,
        coordenacoes,
        filtroSupervisorNome: supObj ? `${supObj.nome} (${supObj.codigo})` : 'Todos os Supervisores',
        filtroCoordenacaoNome: coordObj ? coordObj.nome : 'Todas as Coordenações',
        filtroDataStr: relatorioDataFilter !== 'todas' ? formatarDataPt(relatorioDataFilter) : 'Todas as Datas',
        totaisCategorias: totais8Pontos,
      });

      setPdfExportToast('Relatório Oficial em PDF (.pdf) exportado com sucesso!');
      setTimeout(() => setPdfExportToast(''), 4500);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Ocorreu um erro ao gerar o relatório em PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcelRelatorio = () => {
    const supObj = supervisores.find((s) => s.id === relatorioSupervisorId);
    handleExportExcel({
      supervisorId: relatorioSupervisorId,
      dataLancamento: relatorioDataFilter !== 'todas' ? relatorioDataFilter : undefined,
      titulo: supObj ? `Executivo_${supObj.nome}` : 'Executivo_8_Categorias',
    });
  };

  return (
    <div id="admin-view" className="flex flex-col md:flex-row min-h-screen md:h-screen bg-[#f1f5f9] md:overflow-hidden">
      {/* ============================================================== */}
      {/* DRAWER MOBILE OVERLAY (NÃO CORTA ECRÃ EM SMARTPHONES E TABLETS) */}
      {/* ============================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-4/5 max-w-xs bg-[#1e293b] text-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="text-base font-black text-[#2667ff] tracking-tight flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#2667ff]" />
                  <span>MS-Sumbe Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Gestão de Mobilização Social</div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isReadOnly && (
              <div className="p-3 space-y-2 border-b border-slate-700/80">
                <button
                  onClick={() => {
                    setShowAddCoordenacaoModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Coordenação</span>
                </button>

                <button
                  onClick={() => {
                    setActiveScreen('formulario');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Preencher Nova Ficha</span>
                </button>
              </div>
            )}

            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard & Gráficos</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('diario');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'diario'
                    ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  <span>Fichas por Dia & Metas</span>
                </div>
                <span className="text-[10px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  {dailyAnalytics.sortedDates.length}d
                </span>
              </button>

              {/* ABA COORDENAÇÕES (1 A 2 SUPERVISORES) */}
              <button
                onClick={() => {
                  setActiveTab('coordenacoes');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'coordenacoes'
                    ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>Coordenações (1-2 Sup)</span>
                </div>
                <span className="text-[10px] bg-slate-900 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {coordenacoes.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('supervisores');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'supervisores'
                    ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Supervisores Cadastrados</span>
                </div>
                <span className="text-[10px] bg-slate-900 text-[#2667ff] px-2 py-0.5 rounded-full font-bold">
                  {supervisores.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('leitores');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'leitores'
                    ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Utilizadores de Leitura</span>
                </div>
                <span className="text-[10px] bg-slate-900 text-sky-400 px-2 py-0.5 rounded-full font-bold">
                  {leitores.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('relatorios');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'relatorios'
                    ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Relatórios Enviados</span>
                </div>
                <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {submissoes.length}
                </span>
              </button>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    setActiveTab('configuracoes');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'configuracoes'
                      ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Definições & Firebase</span>
                </button>
              )}
            </nav>

            <div className="p-3 border-t border-slate-700/80 bg-slate-900/40 text-[10px] text-slate-400">
              <div className="font-semibold text-slate-200">Município do Sumbe (Sede)</div>
              <div className="text-emerald-400">Firebase Firestore Sincronizado</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIDEBAR DESKTOP FIXA (PARA ECRÃS MÉDIOS E GRANDES) */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col md:w-64 bg-[#1e293b] text-white shrink-0 border-r border-slate-700 h-full">
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-[#2667ff] tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-[#2667ff]" />
              <span>MS-Sumbe Admin</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Gestão de Mobilização Social</div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO PRINCIPAIS NA SIDEBAR */}
        {!isReadOnly && (
          <div className="px-3 pt-3 pb-1 space-y-2">
            <button
              onClick={() => setShowAddCoordenacaoModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              title="Cadastrar nova coordenação (cada coordenação tem 1 a 2 supervisores)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Coordenação</span>
            </button>

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

          {/* SEPARADOR: FICHAS POR DIA & METAS */}
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

          {/* SEPARADOR: COORDENAÇÕES (1 A 2 SUPERVISORES) */}
          <button
            onClick={() => setActiveTab('coordenacoes')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'coordenacoes'
                ? 'bg-slate-800 text-white border-l-4 border-l-[#2667ff]'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Coordenações (1-2 Sup)</span>
            </div>
            <span className="text-xs bg-slate-900 text-purple-300 px-2 py-0.5 rounded-full font-bold">
              {coordenacoes.length}
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

      {/* ============================================================== */}
      {/* ÁREA PRINCIPAL DO ADMIN (TOTALMENTE RESPONSIVA) */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-100">
        {/* Top Header Responsivo com Botão Hambúrguer e Botão Cadastrar Coordenação */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              {/* Botão Menu Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
                title="Abrir Menu de Navegação"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
              </button>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate sm:whitespace-normal">
                  {activeTab === 'dashboard' && 'Visão Geral & Gráficos de Mobilização'}
                  {activeTab === 'diario' && 'Controlo Diário de Fichas & Metas'}
                  {activeTab === 'coordenacoes' && 'Coordenações do Sumbe (1-2 Sup)'}
                  {activeTab === 'supervisores' && 'Supervisores Cadastrados & Metas'}
                  {activeTab === 'leitores' && 'Utilizadores Só de Leitura'}
                  {activeTab === 'relatorios' && 'Fichas e Relatórios Recebidos'}
                  {activeTab === 'configuracoes' && 'Definições da Base de Dados & Código'}
                </h2>
                <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                  Município do Sumbe, Província do Cuanza-Sul &bull; Sincronização em tempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* BOTÃO EXPORTAR EXCEL (.XLSX) */}
              <button
                type="button"
                onClick={() => handleExportExcel()}
                disabled={isExportingExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                title="Exportar todas as fichas coletadas para um ficheiro Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{isExportingExcel ? 'A Gerar...' : 'Exportar Excel'}</span>
                <span className="sm:hidden">{isExportingExcel ? '...' : 'Excel'}</span>
              </button>

              {/* BOTÃO SOLICITADO: CADASTRAR COORDENAÇÃO (Disponível no drawer móvel e aqui no desktop) */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowAddCoordenacaoModal(true)}
                  className="hidden sm:flex bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                  title="Cadastrar nova coordenação no Sumbe (cada coordenação tem 1 a 2 supervisores)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Coordenação</span>
                </button>
              )}

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setActiveScreen('formulario')}
                  className="hidden sm:flex bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs px-3 py-1.5 rounded-lg items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
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
                <div className="text-right hidden lg:block pl-2 border-l border-slate-200 text-xs">
                  <div className="font-bold text-slate-700">Coordenação Municipal</div>
                  <div className="text-[10px] text-emerald-600 font-medium font-mono">Código: {adminCode}</div>
                </div>
              )}

              <div className={`w-8 h-8 rounded-full ${isReadOnly ? 'bg-sky-600' : 'bg-[#2667ff]'} text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0`}>
                {isReadOnly ? 'LT' : 'AD'}
              </div>
            </div>
          </div>

          {/* FITA HORIZONTAL RESPONSIVA DE ABAS (PERMITE NAVEGAÇÃO RÁPIDA EM QUALQUER DISPOSITIVO) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs border-t border-slate-100 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#2667ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('diario')}
              className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'diario' ? 'bg-[#2667ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Fichas por Dia ({dailyAnalytics.sortedDates.length}d)
            </button>
            <button
              onClick={() => setActiveTab('coordenacoes')}
              className={`px-3 py-1 rounded-md font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'coordenacoes'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Coordenações</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === 'coordenacoes' ? 'bg-purple-800 text-white' : 'bg-purple-200 text-purple-900'}`}>
                {coordenacoes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('supervisores')}
              className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'supervisores' ? 'bg-[#2667ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Supervisores ({supervisores.length})
            </button>
            <button
              onClick={() => setActiveTab('leitores')}
              className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'leitores' ? 'bg-[#2667ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Leitores ({leitores.length})
            </button>
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'relatorios' ? 'bg-[#2667ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Relatórios ({submissoes.length})
            </button>
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

              {/* RESUMO DA CAMADA LÓGICA AUTOMATIZADA: TOTAL DE FICHAS REQUERIDAS POR SUPERVISOR */}
              <div className="bg-white rounded-xl border border-indigo-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Camada Lógica Automatizada &bull; Metas de Fichas por Supervisor
                      </h4>
                      <p className="text-xs text-slate-500">
                        Cálculo automático: <code>Meta Diária ({automatedFichaPlanning.supervisoresCalculados[0]?.fichasDiarias || 5} fichas/dia) × Dias ({automatedFichaPlanning.mediaDiasCampanha} dias) = Total Requerido</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('relatorios');
                        setRelatorioSubView('supervisor');
                      }}
                      className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ver Relatório por Supervisor</span>
                    </button>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const commonDias = supervisores[0]?.diasTrabalhoPrevistos || 5;
                          setBatchDias(commonDias);
                          setShowBatchDiasModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Definir os dias de trabalho da campanha uma única vez para todos os supervisores"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ajustar Dias da Campanha</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Métricas Principais da Camada Lógica */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50/60 border-b border-slate-100">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">Total Requerido</span>
                    <div className="text-xl font-black text-indigo-950 mt-0.5">
                      {automatedFichaPlanning.totalRequeridoGeral} Fichas
                    </div>
                    <span className="text-[10px] text-indigo-600">Soma de todos os supervisores</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-[#2667ff] uppercase tracking-wider block">Fichas Lançadas</span>
                    <div className="text-xl font-black text-[#1a53db] mt-0.5">
                      {automatedFichaPlanning.totalLancadoGeral} Fichas
                    </div>
                    <span className="text-[10px] text-slate-500">{automatedFichaPlanning.progressoGeralStr} cumprido</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Fichas em Falta</span>
                    <div className="text-xl font-black text-amber-800 mt-0.5">
                      {automatedFichaPlanning.totalRestanteGeral} Fichas
                    </div>
                    <span className="text-[10px] text-amber-600">Para atingir 100% da campanha</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Pessoas Mobilizadas</span>
                    <div className="text-xl font-black text-emerald-800 mt-0.5">
                      {automatedFichaPlanning.totalPessoasGeral.toLocaleString('pt-PT')}
                    </div>
                    <span className="text-[10px] text-slate-500">em {automatedFichaPlanning.totalLocaisGeral} locais visitados</span>
                  </div>
                </div>

                {/* Barra de Progresso Global */}
                <div className="p-4 bg-white border-b border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Progresso Geral da Campanha no Sumbe</span>
                    <span className="font-mono text-indigo-700 font-bold">
                      {automatedFichaPlanning.totalLancadoGeral} de {automatedFichaPlanning.totalRequeridoGeral} fichas ({automatedFichaPlanning.progressoGeralStr})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, automatedFichaPlanning.progressoGeralPct)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tabela Resumo dos 9 Supervisores com Cálculo Automatizado */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Supervisor</th>
                        <th className="py-2.5 px-3">Coordenação</th>
                        <th className="py-2.5 px-3 text-center">Meta Diária</th>
                        <th className="py-2.5 px-3 text-center">Dias Escolhidos</th>
                        <th className="py-2.5 px-3 text-center font-bold text-indigo-900 bg-indigo-50/50">
                          Total Requerido
                        </th>
                        <th className="py-2.5 px-3 text-center">Lançadas</th>
                        <th className="py-2.5 px-3 text-center text-amber-800">Em Falta</th>
                        <th className="py-2.5 px-3 text-center">Cumprimento</th>
                        <th className="py-2.5 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {automatedFichaPlanning.supervisoresCalculados.map((sc) => (
                        <tr key={sc.supervisor.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-slate-900">{sc.supervisor.nome}</div>
                            <div className="text-[10px] font-mono text-[#2667ff] font-semibold">{sc.supervisor.codigo}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {sc.supervisor.coordenacao || 'Coordenação Geral'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {sc.fichasDiarias}/dia
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-indigo-700 font-semibold">
                            {sc.diasTrabalho} dias
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-indigo-950 bg-indigo-50/30">
                            {sc.totalFichasRequeridas} fichas
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#1a53db]">
                            {sc.fichasLancadas}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                            {sc.fichasRestantes}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                              sc.percentualCumprimento >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : sc.percentualCumprimento >= 50
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sc.percentualStr}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setRelatorioSubView('supervisor');
                                setRelatorioSupervisorId(sc.supervisor.id);
                                setActiveTab('relatorios');
                              }}
                              className="text-[11px] text-[#2667ff] hover:text-[#1a53db] font-bold hover:underline cursor-pointer"
                            >
                              Ver Fichas &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        Controlo Diário de Fichas por Supervisor & Coordenação
                      </h4>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                        {dailyAnalytics.sortedDates.length} Dias Registados
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Acompanhe dia a dia o cumprimento das metas: total de <strong>{dailyAnalytics.totalGeralLancado} de {dailyAnalytics.totalGeralPrevisto} fichas</strong> lançadas ({dailyAnalytics.taxaGlobalCumprimento}% da meta global). Veja a matriz detalhada de quantas fichas cada supervisor e cada coordenação lançou em cada dia.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('diario');
                      setDiarioSubView('supervisores');
                    }}
                    className="w-full sm:w-auto bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Fichas por Supervisor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('diario');
                      setDiarioSubView('coordenacoes');
                    }}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Fichas por Coordenação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('diario');
                      setDiarioSubView('explorador');
                    }}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Explorar Fichas</span>
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

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                      Métricas por Supervisor
                    </span>
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

                  {/* GRÁFICO 2: BARRAS COMPARATIVAS POR SUPERVISOR (8 colunas) */}
                  <div className="lg:col-span-8 bg-slate-50/90 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Taxa % de Aceitação e Rejeição por Supervisor
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Valores em percentagem (%)
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={supervisorAcceptanceData}
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
                        {supervisorAcceptanceData.slice(0, 4).map((item) => (
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
                        <th className="py-3 px-4 text-center">Nº Fichas</th>
                        <th className="py-3 px-4">Total Pessoas</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissoes.slice(0, 5).map((sub) => {
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
                            <td className="py-3 px-4 text-center font-bold text-slate-800 text-xs font-mono">
                              <span className="bg-blue-50 text-[#1a53db] border border-blue-200 px-2.5 py-0.5 rounded-full">
                                {sub.fichas ? sub.fichas.length : 1} {sub.fichas?.length === 1 ? 'ficha' : 'fichas'}
                              </span>
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

              {/* SELETOR DE MODO DE VISUALIZAÇÃO DIÁRIA: POR SUPERVISOR, POR COORDENAÇÃO OU EXPLORADOR DE FICHAS POR DIA */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setDiarioSubView('supervisores')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      diarioSubView === 'supervisores'
                        ? 'bg-[#2667ff] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Por Supervisor ({supervisores.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiarioSubView('coordenacoes')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      diarioSubView === 'coordenacoes'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Por Coordenação ({coordenacoes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiarioSubView('explorador')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      diarioSubView === 'explorador'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Fichas por Dia ({submissoes.reduce((acc, s) => acc + (s.fichas?.length || 0), 0)} fichas)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center text-xs">
                  {(diarioFiltroData !== 'todas' || diarioFiltroSupervisor !== 'todos' || diarioFiltroCoordenacao !== 'todas') && (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#1a53db] px-2.5 py-1 rounded-lg font-semibold">
                      <span>Filtro Ativo:</span>
                      {diarioFiltroData !== 'todas' && <span className="underline">{diarioFiltroData}</span>}
                      {diarioFiltroSupervisor !== 'todos' && (
                        <span>&bull; {supervisores.find((s) => s.id === diarioFiltroSupervisor)?.nome?.split(' ')[0]}</span>
                      )}
                      {diarioFiltroCoordenacao !== 'todas' && (
                        <span>&bull; {coordenacoes.find((c) => c.id === diarioFiltroCoordenacao)?.nome}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDiarioFiltroData('todas');
                          setDiarioFiltroSupervisor('todos');
                          setDiarioFiltroCoordenacao('todas');
                        }}
                        className="text-red-600 hover:underline ml-1 font-bold cursor-pointer"
                        title="Limpar todos os filtros diários"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                  <span className="text-slate-400 hidden sm:inline">&bull;</span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">
                    Clique em qualquer número de fichas para ver as submissões detalhadas daquele dia
                  </span>
                </div>
              </div>

              {/* VISTA 1: MATRIZ DIÁRIA POR SUPERVISOR */}
              {diarioSubView === 'supervisores' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#2667ff]" />
                        <span>Matriz Diária: Fichas Lançadas por Supervisor</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Acompanhamento dia a dia: quantas fichas cada supervisor lançou em cada data da campanha no Sumbe.
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 flex-wrap">
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
                          <th className="py-3 px-3 text-right min-w-[100px]">Ações</th>
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
                                      <button
                                        type="button"
                                        onClick={() => handleVerFichasDoDia(d, sup.id, undefined)}
                                        className={`inline-flex flex-col items-center justify-center px-2 py-1 rounded-lg border font-mono font-bold text-xs cursor-pointer hover:scale-105 transition shadow-2xs ${
                                          atingiuMeta
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                            : 'bg-blue-50 text-[#1a53db] border-blue-200 hover:bg-blue-100'
                                        }`}
                                        title={`Ver as ${fichasNoDia} ficha(s) enviadas neste dia por ${sup.nome}`}
                                      >
                                        <span>{fichasNoDia} {fichasNoDia === 1 ? 'ficha' : 'fichas'}</span>
                                        <span className="text-[9px] font-normal text-slate-500">
                                          {pessoasNoDia} pess.
                                        </span>
                                      </button>
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

                              {/* Ações */}
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleVerFichasDoDia(undefined, sup.id, undefined)}
                                    className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-1.5 rounded transition cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                                    title="Ver todas as fichas enviadas por este supervisor"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Fichas</span>
                                  </button>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTarget(sup)}
                                      className="text-[#2667ff] hover:text-[#1a53db] hover:bg-blue-50 p-1.5 rounded transition cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                                      title="Ajustar total de fichas ou dias previstos"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Metas</span>
                                    </button>
                                  )}
                                </div>
                              </td>
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

                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* VISTA 2: MATRIZ DIÁRIA POR COORDENAÇÃO (1 A 2 SUPERVISORES POR COORDENAÇÃO) */}
              {diarioSubView === 'coordenacoes' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <Compass className="w-5 h-5 text-purple-600" />
                        <span>Matriz Diária: Fichas Lançadas por Coordenação</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Acompanhamento territorial dia a dia: cada coordenação mobiliza 1 a 2 supervisores no Sumbe.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-purple-600" />
                        <span>{dailyAnalytics.coordenacaoMatrix.length} Coordenações Ativas</span>
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3 w-10 text-center">#</th>
                          <th className="py-3 px-3 min-w-[190px]">Coordenação</th>
                          <th className="py-3 px-3 min-w-[200px]">Supervisores Vinculados</th>
                          <th className="py-3 px-3 text-center min-w-[95px]">Meta Total</th>

                          {/* Colunas Dinâmicas de Cada Data */}
                          {dailyAnalytics.sortedDates.map((d) => {
                            const info = dailyAnalytics.dateLabels[d];
                            return (
                              <th key={d} className="py-3 px-3 text-center bg-purple-50/50 border-l border-slate-200 min-w-[95px]">
                                <div className="font-bold text-purple-900">{info?.label || d}</div>
                                <div className="text-[10px] text-slate-400 font-normal lowercase">{d}</div>
                              </th>
                            );
                          })}

                          <th className="py-3 px-3 text-center bg-slate-100 border-l border-slate-200 font-bold min-w-[100px]">
                            Total Lançado
                          </th>
                          <th className="py-3 px-3 text-center min-w-[140px]">% Meta</th>
                          <th className="py-3 px-3 text-right min-w-[90px]">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailyAnalytics.coordenacaoMatrix.map((item, idx) => {
                          const coord = item.coordenacao;
                          return (
                            <tr key={coord.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                                #{idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{coord.nome}</div>
                                <div className="text-[11px] text-slate-500">
                                  {coord.municipio} &bull; {coord.comuna}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {item.supervisores.length > 0 ? (
                                    item.supervisores.map((sup) => (
                                      <span
                                        key={sup.id}
                                        className="bg-blue-50 text-[#1a53db] border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                                        title={`Supervisor: ${sup.nome} (${sup.codigo})`}
                                      >
                                        {sup.nome.split(' ')[0]} ({sup.codigo})
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Sem supervisores vinculados</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                                <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold">
                                  {item.totalPrevisto} fichas
                                </span>
                              </td>

                              {/* Fichas Lançadas por Data para esta Coordenação */}
                              {dailyAnalytics.sortedDates.map((d) => {
                                const fichasNoDia = item.fichasPorData[d] || 0;
                                const pessoasNoDia = item.pessoasPorData[d] || 0;

                                return (
                                  <td key={d} className="py-2.5 px-3 text-center border-l border-slate-100">
                                    {fichasNoDia > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => handleVerFichasDoDia(d, undefined, coord.id)}
                                        className="inline-flex flex-col items-center justify-center px-2 py-1 rounded-lg border font-mono font-bold text-xs bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 cursor-pointer transition shadow-2xs"
                                        title={`Ver as ${fichasNoDia} ficha(s) da coordenação ${coord.nome} nesta data`}
                                      >
                                        <span>{fichasNoDia} {fichasNoDia === 1 ? 'ficha' : 'fichas'}</span>
                                        <span className="text-[9px] font-normal text-purple-700">
                                          {pessoasNoDia} pess.
                                        </span>
                                      </button>
                                    ) : (
                                      <span className="text-slate-300 font-mono text-xs">-</span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Total Acumulado */}
                              <td className="py-2.5 px-3 text-center bg-slate-50 border-l border-slate-200">
                                <span className="font-mono font-black text-sm text-purple-900">
                                  {item.totalFichasLancadas}
                                </span>
                                <div className="text-[10px] text-slate-500">
                                  {item.totalPessoasLancadas.toLocaleString('pt-PT')} pess.
                                </div>
                              </td>

                              {/* % Meta */}
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
                                          ? 'bg-purple-600'
                                          : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${Math.min(100, item.percentualCumprido)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>

                              {/* Ações */}
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleVerFichasDoDia(undefined, undefined, coord.id)}
                                  className="text-purple-700 hover:text-purple-900 hover:bg-purple-50 p-1.5 rounded transition cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                                  title="Ver todas as fichas desta coordenação"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Ver Fichas</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      {/* Totais Gerais das Coordenações */}
                      <tfoot className="bg-purple-50/70 text-slate-800 font-bold border-t-2 border-purple-200">
                        <tr>
                          <td colSpan={4} className="py-3 px-4 uppercase tracking-wider text-xs font-black text-purple-950">
                            Total Geral das Coordenações por Dia:
                          </td>

                          {dailyAnalytics.sortedDates.map((d) => {
                            const tot = dailyAnalytics.totalsByDate[d] || { totalFichas: 0, totalPessoas: 0, supervisoresAtivos: 0 };
                            return (
                              <td key={d} className="py-3 px-3 text-center border-l border-purple-200 bg-purple-100/60">
                                <div className="font-mono font-black text-sm text-purple-900">
                                  {tot.totalFichas} fichas
                                </div>
                                <div className="text-[10px] text-slate-600 font-normal">
                                  {tot.totalPessoas.toLocaleString('pt-PT')} pess.
                                </div>
                              </td>
                            );
                          })}

                          <td className="py-3 px-3 text-center bg-purple-200/80 border-l border-purple-300">
                            <div className="font-mono font-black text-base text-purple-950">
                              {dailyAnalytics.totalGeralLancado}
                            </div>
                            <div className="text-[10px] text-purple-800 font-bold uppercase">Total Fichas</div>
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                            {dailyAnalytics.taxaGlobalCumprimento}% global
                          </td>

                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* VISTA 3: EXPLORADOR INTERATIVO DE FICHAS POR DIA (A CADA SUPERVISOR E COORDENAÇÃO) */}
              {diarioSubView === 'explorador' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <span>Fichas por Dia a Cada Supervisor e Coordenação</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Consulte e audite individualmente as fichas lançadas em cada dia, filtrando por data de recolha, supervisor e coordenação.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDiarioFiltroData('todas');
                        setDiarioFiltroSupervisor('todos');
                        setDiarioFiltroCoordenacao('todas');
                      }}
                      className="text-xs text-[#2667ff] hover:text-[#1a53db] font-semibold border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition cursor-pointer self-start sm:self-center"
                    >
                      Mostrar Todas as Fichas
                    </button>
                  </div>

                  {/* Barra de Filtros Interativos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Filtrar por Dia de Coleta:
                      </label>
                      <select
                        value={diarioFiltroData}
                        onChange={(e) => setDiarioFiltroData(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#2667ff]"
                      >
                        <option value="todas">Todos os Dias de Campanha ({dailyAnalytics.sortedDates.length} dias)</option>
                        {dailyAnalytics.sortedDates.map((d) => {
                          const info = dailyAnalytics.dateLabels[d];
                          const tot = dailyAnalytics.totalsByDate[d]?.totalFichas || 0;
                          return (
                            <option key={d} value={d}>
                              {info?.label || d} &bull; {tot} fichas lançadas
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Filtrar por Coordenação:
                      </label>
                      <select
                        value={diarioFiltroCoordenacao}
                        onChange={(e) => setDiarioFiltroCoordenacao(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="todas">Todas as Coordenações ({coordenacoes.length})</option>
                        {coordenacoes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} ({c.comuna})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Filtrar por Supervisor:
                      </label>
                      <select
                        value={diarioFiltroSupervisor}
                        onChange={(e) => setDiarioFiltroSupervisor(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="todos">Todos os Supervisores ({supervisores.length})</option>
                        {supervisores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome} ({s.codigo} - {s.comuna})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cartões de Resumo do Filtro Selecionado */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="text-[10px] uppercase font-bold text-emerald-800">Fichas no Filtro</div>
                      <div className="text-2xl font-black text-emerald-700 mt-0.5">
                        {filteredSubmissoesDiario.reduce((acc, s) => acc + (s.fichas ? s.fichas.length : 0), 0)}
                      </div>
                      <div className="text-[10px] text-emerald-600">fichas lançadas</div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="text-[10px] uppercase font-bold text-[#1a53db]">Pessoas Mobilizadas</div>
                      <div className="text-2xl font-black text-[#1b4fd8] mt-0.5">
                        {filteredSubmissoesDiario.reduce((acc, s) => acc + s.totalSim, 0).toLocaleString('pt-PT')}
                      </div>
                      <div className="text-[10px] text-blue-600">sim à mobilização</div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                      <div className="text-[10px] uppercase font-bold text-purple-800">Supervisores Ativos</div>
                      <div className="text-2xl font-black text-purple-700 mt-0.5">
                        {new Set(filteredSubmissoesDiario.map((s) => s.supervisorId)).size}
                      </div>
                      <div className="text-[10px] text-purple-600">com lançamentos no filtro</div>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
                      <div className="text-[10px] uppercase font-bold text-slate-700">Remessas de Envio</div>
                      <div className="text-2xl font-black text-slate-800 mt-0.5">
                        {filteredSubmissoesDiario.length}
                      </div>
                      <div className="text-[10px] text-slate-500">lotes submetidos</div>
                    </div>
                  </div>

                  {/* Tabela e Lista de Fichas do Filtro */}
                  {filteredSubmissoesDiario.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                      <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="font-semibold text-sm">Nenhuma ficha encontrada para os filtros selecionados.</p>
                      <p className="text-xs text-slate-400 mt-1">Tente selecionar outro dia, supervisor ou coordenação.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3">Data & Dia</th>
                            <th className="py-3 px-3">Supervisor</th>
                            <th className="py-3 px-3">Coordenação</th>
                            <th className="py-3 px-3 text-center">Nº Fichas</th>
                            <th className="py-3 px-3 text-center">Pessoas (Sim)</th>
                            <th className="py-3 px-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSubmissoesDiario.map((sub) => {
                            const sup = supervisores.find((s) => s.id === sub.supervisorId);
                            const coord = coordenacoes.find(
                              (c) =>
                                (sup && c.supervisorIds && c.supervisorIds.includes(sup.id)) ||
                                (sup && sup.coordenacaoId === c.id) ||
                                (sup && c.nome && sup.coordenacao && sup.coordenacao.toLowerCase().trim() === c.nome.toLowerCase().trim())
                            );

                            return (
                              <tr key={sub.id} className="hover:bg-slate-50 transition">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-900 font-mono">{sub.data}</div>
                                  <div className="text-[10px] text-[#1a53db] font-semibold">
                                    {dailyAnalytics.dateLabels[sub.data]?.label || (sub.diaCampanha ? `Dia ${sub.diaCampanha}` : sub.data)}
                                    {sub.dataEnvio ? ` • ${new Date(sub.dataEnvio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <div className="font-bold text-slate-900">{sub.supervisorNome}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {sup?.codigo || sub.supervisorId} &bull; {sup?.comuna || sub.fichas?.[0]?.comuna || 'Sede'}
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  {coord ? (
                                    <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                      {coord.nome}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">
                                      {sup?.coordenacao || 'Geral'}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                                  <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    {sub.fichas ? sub.fichas.length : 1}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center font-bold text-[#1a53db]">
                                  {sub.totalSim.toLocaleString('pt-PT')}
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="bg-[#2667ff] hover:bg-[#1a53db] text-white px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer shadow-2xs transition"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Ver Ficha</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

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
          {/* TAB: GESTÃO DAS COORDENAÇÕES (1 A 2 SUPERVISORES POR COORDENAÇÃO) */}
          {/* ============================================================== */}
          {activeTab === 'coordenacoes' && (
            <div className="space-y-6">
              {/* Cabeçalho da Aba de Coordenações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-800">
                      Coordenações de Mobilização Social no Sumbe
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Estrutura operacional territorial: <strong>cada coordenação tem atribuídos de 1 a 2 supervisores</strong> para liderar as ações nos bairros, assegurando a cobertura de campo e o controlo diário de fichas.
                  </p>
                </div>

                {!isReadOnly && (
                  <button
                    onClick={() => setShowAddCoordenacaoModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition cursor-pointer shrink-0"
                    title="Cadastrar nova coordenação no Sumbe"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Coordenação</span>
                  </button>
                )}
              </div>

              {/* Mensagem de sucesso */}
              {coordSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{coordSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setCoordSuccessMsg('')}
                    className="text-emerald-700 hover:text-emerald-950 font-bold text-lg leading-none cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* 4 Cards de Resumo da Estrutura de Coordenação */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-purple-600">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Total de Coordenações
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                    {coordenacoes.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Setores municipais ativos
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Com 2 Supervisores
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                    {coordenacoes.filter((c) => (c.supervisorIds?.length || 0) === 2).length}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1">
                    Lotação completa (2 de 2)
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Com 1 Supervisor
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                    {coordenacoes.filter((c) => (c.supervisorIds?.length || 0) === 1).length}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium mt-1">
                    Com 1 vaga disponível
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-[#2667ff]">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Supervisores Alocados
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1a53db]">
                    {coordenacoes.reduce((acc, c) => acc + (c.supervisorIds?.length || 0), 0)} <span className="text-xs font-normal text-slate-400">/ {coordenacoes.length * 2} vagas</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Em coordenações ativas
                  </div>
                </div>
              </div>

              {/* Grid das Coordenações */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {coordenacoes.length === 0 ? (
                  <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                    <Compass className="w-12 h-12 text-purple-400 mx-auto opacity-40" />
                    <h4 className="font-bold text-slate-800 text-base">Nenhuma Coordenação Cadastrada</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Cadastre as coordenações de campo do município do Sumbe para organizar os bairros e atribuir 1 a 2 supervisores a cada uma.
                    </p>
                    {!isReadOnly && (
                      <button
                        onClick={() => setShowAddCoordenacaoModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Cadastrar Primeira Coordenação</span>
                      </button>
                    )}
                  </div>
                ) : (
                  coordenacoes.map((coord) => {
                    const diasCoord = coord.diasTrabalho || 5;
                    const mobCoord = coord.totalMobilizadores || 10;
                    const porMobCoord = coord.fichasDiariasPorMobilizador || 5;
                    const totalDiariasCoord = coord.totalFichasDiarias || mobCoord * porMobCoord;
                    const metaCoord = coord.metaFichasTotal || totalDiariasCoord * diasCoord;

                    const numSupervisores = coord.supervisorIds?.length || 0;
                    const cotaPorSup = numSupervisores === 2 ? Math.round(metaCoord / 2) : metaCoord;
                    const cotaDiariaPorSup = numSupervisores === 2 ? Math.round(totalDiariasCoord / 2) : totalDiariasCoord;
                    const temVaga = numSupervisores < (coord.limiteSupervisores || 2);

                    const coordSups = supervisores.filter((s) => coord.supervisorIds?.includes(s.id));
                    const coordSubmissoes = submissoes.filter((sub) => coord.supervisorIds?.includes(sub.supervisorId));
                    const totalFichasCoord = coordSubmissoes.reduce((acc, sub) => acc + sub.fichas.length, 0);
                    const totalPessoasCoord = coordSubmissoes.reduce((acc, sub) => acc + sub.totalPessoas, 0);
                    const pctCumprimento = Math.min(100, Math.round((totalFichasCoord / metaCoord) * 100));

                    return (
                      <div
                        key={coord.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-purple-300 transition"
                      >
                        <div className="p-5">
                          {/* Topo do Card */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                                <Compass className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                  {coord.nome}
                                </h4>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {coord.municipio || 'Sumbe'} &bull; Comuna {coord.comuna || 'Sede'}
                                </div>
                              </div>
                            </div>

                            {/* Badge de Lotação (1 a 2 Supervisores) */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                                numSupervisores === 2
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : numSupervisores === 1
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {numSupervisores === 2
                                ? '2 / 2 Supervisores'
                                : numSupervisores === 1
                                ? '1 / 2 (1 Vaga)'
                                : '0 / 2 Supervisores'}
                            </span>
                          </div>

                          {/* Badges Estruturados: Mobilizadores, Dias e Fichas/Dia */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 mb-2">
                            <span className="bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Users className="w-3 h-3 text-purple-600" />
                              <span>{mobCoord} Mobilizadores</span>
                            </span>
                            <span className="bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-blue-600" />
                              <span>{diasCoord} Dias de Trabalho</span>
                            </span>
                            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-600" />
                              <span>{totalDiariasCoord} fichas/dia</span>
                            </span>
                          </div>

                          {/* Descrição */}
                          {coord.descricao && (
                            <p className="text-xs text-slate-600 mt-1 mb-3 leading-relaxed">
                              {coord.descricao}
                            </p>
                          )}

                          {/* Meta & Progresso da Coordenação com Cálculo Estruturado */}
                          <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">Fichas Lançadas:</span>
                              <span className="font-mono font-bold text-purple-900">
                                {totalFichasCoord} / {metaCoord} ({pctCumprimento}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pctCumprimento}%` }}
                              ></div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-[11px] text-purple-950 space-y-1">
                              <div className="flex items-center justify-between text-slate-600">
                                <span>Cálculo da Coordenação:</span>
                                <span className="font-mono font-bold text-purple-800">
                                  {mobCoord} mob. × {porMobCoord} fichas/dia × {diasCoord}d = {metaCoord} fichas
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[#1a53db] font-semibold border-t border-slate-100 pt-1">
                                <span>Cota por Supervisor ({numSupervisores} atribuído{numSupervisores !== 1 ? 's' : ''}):</span>
                                <span className="font-bold text-slate-900">
                                  {cotaPorSup} fichas ({cotaDiariaPorSup}/dia)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                              <span>Pessoas mobilizadas: <strong>{totalPessoasCoord.toLocaleString('pt-PT')}</strong></span>
                              <span>Meta total: <strong>{metaCoord} fichas</strong></span>
                            </div>
                          </div>

                          {/* Supervisores Atribuídos (1 a 2) */}
                          <div className="mt-4">
                            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-600" />
                                <span>Supervisores Vinculados ({numSupervisores} de 2):</span>
                              </span>
                              {temVaga && !isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(coord)}
                                  className="text-[11px] text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
                                >
                                  + Atribuir {numSupervisores === 0 ? '1º' : '2º'}
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {coordSups.map((sup) => {
                                const supSubs = submissoes.filter((s) => s.supervisorId === sup.id);
                                const supFichas = supSubs.reduce((acc, s) => acc + s.fichas.length, 0);

                                return (
                                  <div
                                    key={sup.id}
                                    className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                        {sup.nome.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900 truncate">
                                          {sup.nome}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                          <span className="text-[#2667ff] font-bold">{sup.codigo}</span>
                                          <span>&bull; {supFichas} fichas</span>
                                        </div>
                                      </div>
                                    </div>

                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSupervisorFromCoord(coord.id, sup.id)}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 text-[10px] font-semibold transition cursor-pointer"
                                        title="Desvincular supervisor desta coordenação"
                                      >
                                        Desvincular
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Vaga Aberta para o 2º supervisor */}
                              {temVaga && (
                                <button
                                  type="button"
                                  onClick={() => !isReadOnly && handleOpenAssignModal(coord)}
                                  disabled={isReadOnly}
                                  className="w-full border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 p-2.5 rounded-lg text-xs font-semibold text-purple-700 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-default"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>
                                    {numSupervisores === 0
                                      ? 'Atribuir 1º Supervisor (Vaga Aberta)'
                                      : 'Atribuir 2º Supervisor (Vaga Aberta)'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rodapé de Ações da Coordenação */}
                        {!isReadOnly ? (
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCoordenacao(coord)}
                              className="flex-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Editar nome, bairros ou metas desta coordenação"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar Coordenação</span>
                            </button>

                            {temVaga && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(coord)}
                                className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Atribuir supervisor a esta coordenação"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>+ Supervisor</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteCoordenacao(coord)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                              title="Eliminar coordenação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
                            Coordenação Ativa &bull; Modo de Leitura
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: GESTÃO DOS 9 SUPERVISORES & CÓDIGOS DE ACESSO */}
          {/* ============================================================== */}
          {activeTab === 'supervisores' && (
            <div className="space-y-6">
              {/* Notificações de Sucesso */}
              {batchSuccessMsg && (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-[#2667ff] shrink-0" />
                    <div>{batchSuccessMsg}</div>
                  </div>
                  <button onClick={() => setBatchSuccessMsg('')} className="text-blue-700 hover:text-blue-950 font-bold ml-2 cursor-pointer">&times;</button>
                </div>
              )}

              {supSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>{supSuccessMsg}</div>
                  </div>
                  <button onClick={() => setSupSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer">&times;</button>
                </div>
              )}

              {/* Cabeçalho da Aba com Ações Globais */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#2667ff]" />
                    <h3 className="text-lg font-bold text-slate-800">
                      Supervisores de Campo ({supervisores.length} Cadastrados)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cada supervisor tem o seu número diário de fichas e total de dias. O sistema <strong>calcula automaticamente</strong> o total de fichas até ao término da campanha.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Seletor de Modo de Visualização */}
                  <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
                    <button
                      type="button"
                      onClick={() => setSupervisoresViewMode('cards')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        supervisoresViewMode === 'cards'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Ver em Cartões"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cartões</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupervisoresViewMode('tabela')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        supervisoresViewMode === 'tabela'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Ver em Tabela Comparativa"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Tabela Geral</span>
                    </button>
                  </div>

                  {!isReadOnly && (
                    <>
                      {/* Botão de Destaque: Configurar Dias para Todos de Uma Só Vez */}
                      <button
                        type="button"
                        onClick={() => {
                          const commonDias = supervisores[0]?.diasTrabalhoPrevistos || 5;
                          setBatchDias(commonDias);
                          setShowBatchDiasModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                        title="Definir os dias de trabalho da campanha uma única vez para todos os supervisores"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Definir Dias da Campanha para Todos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddSupervisorModal(true)}
                        className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Novo Supervisor</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Barra de Resumo de Metas e Fichas Totais Calculadas */}
              {(() => {
                const totalFichasCampanha = supervisores.reduce((acc, s) => {
                  const dias = s.diasTrabalhoPrevistos || 5;
                  const diarias = s.fichasDiariasPrevistas || Math.ceil((s.totalFichasPrevistas || 25) / dias) || 5;
                  return acc + (diarias * dias);
                }, 0);
                const totalLancadasGeral = submissoes.reduce((acc, s) => acc + s.fichas.length, 0);
                const totalPessoasGeral = submissoes.reduce((acc, s) => acc + s.totalPessoas, 0);
                const diasComuns = supervisores[0]?.diasTrabalhoPrevistos || 5;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Supervisores</span>
                      <div className="text-xl font-bold text-slate-800 mt-0.5">{supervisores.length} Ativos</div>
                      <span className="text-[10px] text-slate-400">Todos com acesso sem senha</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">Duração Padrão</span>
                      <div className="text-xl font-bold text-indigo-900 mt-0.5">{diasComuns} Dias de Campanha</div>
                      <span className="text-[10px] text-indigo-600">Aplicado uniformemente</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Meta Total Calculada</span>
                      <div className="text-xl font-bold text-emerald-800 mt-0.5">{totalFichasCampanha} Fichas</div>
                      <span className="text-[10px] text-emerald-600">Soma de (fichas/dia × dias)</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <span className="text-[11px] font-semibold text-[#2667ff] uppercase tracking-wider block">Progresso Atual</span>
                      <div className="text-xl font-bold text-[#1a53db] mt-0.5">
                        {totalLancadasGeral} / {totalFichasCampanha}
                      </div>
                      <span className="text-[10px] text-slate-500">{totalPessoasGeral.toLocaleString('pt-PT')} pessoas mobilizadas</span>
                    </div>
                  </div>
                );
              })()}

              {/* MODO 1: TABELA GERAL COMPARATIVA DE SUPERVISORES */}
              {supervisoresViewMode === 'tabela' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Quadro Geral de Supervisores: Fichas Diárias, Dias de Trabalho e Total Calculado
                      </h4>
                      <p className="text-xs text-slate-500">
                        Cada linha exibe o cálculo automático em tempo real: <code>Fichas/Dia × Dias = Total da Campanha</code>
                      </p>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const commonDias = supervisores[0]?.diasTrabalhoPrevistos || 5;
                          setBatchDias(commonDias);
                          setShowBatchDiasModal(true);
                        }}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ajustar Dias para Todos</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Supervisor & Código</th>
                          <th className="py-3 px-3">Coordenação & Área</th>
                          <th className="py-3 px-3 text-center">Fichas Diárias</th>
                          <th className="py-3 px-3 text-center">Dias da Campanha</th>
                          <th className="py-3 px-4 text-center bg-indigo-50/60 font-bold text-indigo-900">
                            Total Previsto (Calculado)
                          </th>
                          <th className="py-3 px-3 text-center">Fichas Lançadas</th>
                          <th className="py-3 px-3 text-center">Pessoas</th>
                          <th className="py-3 px-3 text-center">Estado</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supervisores.map((sup, index) => {
                          const supSubmissions = submissoes.filter((s) => s.supervisorId === sup.id);
                          const totalSupFichas = supSubmissions.reduce((acc, s) => acc + s.fichas.length, 0);
                          const totalSupPessoas = supSubmissions.reduce((acc, s) => acc + s.totalPessoas, 0);
                          const dias = Math.max(1, Number(sup.diasTrabalhoPrevistos) || 5);
                          const totalExatoFichas =
                            sup.totalFichasPrevistas !== undefined && Number(sup.totalFichasPrevistas) > 0
                              ? Number(sup.totalFichasPrevistas)
                              : (sup.fichasDiariasPrevistas ? Number(sup.fichasDiariasPrevistas) * dias : 25);
                          const fichasDiarias =
                            sup.fichasDiariasPrevistas !== undefined && Number(sup.fichasDiariasPrevistas) > 0
                              ? Number(sup.fichasDiariasPrevistas)
                              : Math.max(1, Math.round(totalExatoFichas / dias));
                          const pct = totalExatoFichas > 0 ? Math.min(100, Math.round((totalSupFichas / totalExatoFichas) * 100)) : 0;
                          const color = COLORS_9_SUPERVISORES[index % COLORS_9_SUPERVISORES.length];

                          return (
                            <tr key={sup.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0"
                                    style={{ backgroundColor: color }}
                                  >
                                    {sup.nome.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{sup.nome}</div>
                                    <div className="text-[11px] font-mono text-[#2667ff] font-semibold">{sup.codigo}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-slate-600">
                                <div className="font-medium text-slate-800">{sup.coordenacao || 'Coordenação Geral'}</div>
                                <div className="text-[11px] text-slate-400">{sup.municipio || 'Sumbe'} &bull; {sup.comuna || 'Sede'}</div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                  {fichasDiarias} / dia
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                  {dias} dias
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center bg-indigo-50/40">
                                <div className="font-mono font-bold text-indigo-900 text-sm">
                                  {totalExatoFichas} fichas
                                </div>
                                <div className="text-[10px] text-indigo-600 font-sans">
                                  ({fichasDiarias} × {dias} dias)
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <div className="font-bold text-slate-800">
                                  {totalSupFichas} / {totalExatoFichas}
                                </div>
                                <div className="w-16 bg-slate-200 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                                  <div
                                    className="bg-[#2667ff] h-full rounded-full"
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center font-bold text-emerald-700">
                                {totalSupPessoas.toLocaleString('pt-PT')}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className={`badge ${sup.ativo ? 'badge-success' : 'bg-slate-100 text-slate-500'}`}>
                                  {sup.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditSupervisorFull(sup)}
                                      className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                      title="Editar todos os dados (Nome, Código, Fichas Diárias, Dias de Trabalho)"
                                    >
                                      <Edit3 className="w-3 h-3 text-indigo-600" />
                                      <span>Editar</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleTestAsSupervisor(sup)}
                                    className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                    title={`Aceder como ${sup.nome}`}
                                  >
                                    <UserCheck className="w-3 h-3 text-[#2667ff]" />
                                    <span>Entrar</span>
                                  </button>

                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Deseja remover o supervisor ${sup.nome}?`)) {
                                          deleteSupervisor(sup.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                                      title="Eliminar supervisor"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODO 2: GRID DE CARTÕES DOS SUPERVISORES */}
              {supervisoresViewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {supervisores.map((sup, index) => {
                    const supSubmissions = submissoes.filter((s) => s.supervisorId === sup.id);
                    const totalSupFichas = supSubmissions.reduce((acc, s) => acc + s.fichas.length, 0);
                    const totalSupPessoas = supSubmissions.reduce((acc, s) => acc + s.totalPessoas, 0);
                    const color = COLORS_9_SUPERVISORES[index % COLORS_9_SUPERVISORES.length];

                    const dias = Math.max(1, Number(sup.diasTrabalhoPrevistos) || 5);
                    const totalExatoFichas =
                      sup.totalFichasPrevistas !== undefined && Number(sup.totalFichasPrevistas) > 0
                        ? Number(sup.totalFichasPrevistas)
                        : (sup.fichasDiariasPrevistas ? Number(sup.fichasDiariasPrevistas) * dias : 25);
                    const fichasDiarias =
                      sup.fichasDiariasPrevistas !== undefined && Number(sup.fichasDiariasPrevistas) > 0
                        ? Number(sup.fichasDiariasPrevistas)
                        : Math.max(1, Math.round(totalExatoFichas / dias));
                    const pct = totalExatoFichas > 0 ? Math.min(100, Math.round((totalSupFichas / totalExatoFichas) * 100)) : 0;

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

                          {/* Estatísticas de Fichas Lançadas e Pessoas */}
                          <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                            <div className="bg-[#eff4ff] p-2 rounded border border-[#bfdbfe]">
                              <div className="text-[11px] text-slate-500 font-medium">Fichas Lançadas</div>
                              <div className="text-base font-bold text-[#1a53db]">
                                {totalSupFichas} / {totalExatoFichas}
                              </div>
                              <div className="text-[10px] text-[#2667ff] font-semibold">{pct}% cumprido</div>
                            </div>
                            <div className="bg-emerald-50/70 p-2 rounded border border-emerald-100">
                              <div className="text-[11px] text-slate-500 font-medium">Pessoas Mobilizadas</div>
                              <div className="text-base font-bold text-emerald-800">
                                {totalSupPessoas.toLocaleString('pt-PT')}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-semibold">no Sumbe</div>
                            </div>
                          </div>

                          {/* Detalhe do Plano de Trabalho com Cálculo Automático */}
                          <div className="mt-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs">
                            <div className="flex items-center justify-between font-semibold text-indigo-950 mb-1.5">
                              <span className="flex items-center gap-1.5">
                                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Informações da Campanha:</span>
                              </span>
                              <span className="font-mono text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                {dias} dias de trabalho
                              </span>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-indigo-100 flex items-center justify-between text-[11px]">
                              <div>
                                <span className="text-slate-500 block">Fichas por Dia:</span>
                                <strong className="text-slate-800 font-mono text-xs">{fichasDiarias} fichas/dia</strong>
                              </div>
                              <div className="text-slate-400 font-bold">&times;</div>
                              <div>
                                <span className="text-slate-500 block">Dias:</span>
                                <strong className="text-slate-800 font-mono text-xs">{dias} dias</strong>
                              </div>
                              <div className="text-indigo-400 font-bold">=</div>
                              <div className="text-right">
                                <span className="text-indigo-600 font-semibold block">Meta Real Atribuída:</span>
                                <strong className="text-indigo-900 font-mono text-xs">{totalExatoFichas} fichas</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ações do Cartão */}
                        {!isReadOnly ? (
                          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupervisorFull(sup)}
                              className="flex-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                              title="Editar Nome, Código, Telefone, Comuna, Fichas Diárias e Dias de Trabalho"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Editar Dados</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTestAsSupervisor(sup)}
                              className="bg-white hover:bg-[#eff4ff] hover:text-[#1a53db] text-slate-700 border border-slate-200 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                              title="Entrar com a conta deste supervisor para ver o formulário dele"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#2667ff]" />
                              <span>Entrar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Deseja remover o supervisor ${sup.nome}?`)) {
                                  deleteSupervisor(sup.id);
                                }
                              }}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
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
              )}
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
          {/* TAB 4: RELATÓRIOS & FICHAS DE MOBILIZAÇÃO */}
          {/* ============================================================== */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6">
              {/* CABEÇALHO DO RELATÓRIO COM NAVEGADOR DE SUB-VISTAS & EXPORTAÇÃO */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-[#2667ff]" />
                      <h3 className="font-bold text-slate-900 text-lg">
                        Relatório de Fichas de Mobilização Comunitária
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Visualização detalhada conforme os dados são inseridos na ficha (as 8 categorias com locais e pessoas), separado por Supervisor, por Coordenação e Geral.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setActiveScreen('formulario')}
                        className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Preencher Nova Ficha</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExportPDF()}
                      disabled={isExportingPdf}
                      className="bg-[#0f172a] hover:bg-[#1e3a8a] text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer border border-blue-900/60"
                      title="Descarregar Relatório Executivo Oficial em PDF (.pdf) com layout Azul Torrado e as 8 categorias"
                    >
                      <FileDown className="w-4 h-4 text-amber-400" />
                      <span>{isExportingPdf ? 'A Gerar PDF...' : 'Exportar PDF (.pdf)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportExcelRelatorio()}
                      disabled={isExportingExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      title="Descarregar ficheiro Excel (.xlsx) completo com todas as fichas, resumo por supervisor e por datas de lançamento"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isExportingExcel ? 'A Gerar Excel...' : 'Exportar Excel (.xlsx)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportToCSV}
                      className="bg-slate-600 hover:bg-slate-700 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      title="Descarregar ficheiro CSV com todas as 8 categorias de locais e pessoas"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>

                {/* NOTIFICAÇÃO DE EXPORTAÇÃO PDF OU EXCEL CONCLUÍDA */}
                {pdfExportToast && (
                  <div className="bg-blue-950 border border-blue-700 text-blue-100 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{pdfExportToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfExportToast('')}
                      className="text-blue-300 hover:text-white font-bold ml-2 text-xs"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {excelExportToast && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{excelExportToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExcelExportToast('')}
                      className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-xs"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* BARRA DE NAVEGAÇÃO DAS SUB-VISTAS: EXECUTIVO (8 PONTOS), GERAL, POR SUP, POR DATA, POR COORDE */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setRelatorioSubView('executivo')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        relatorioSubView === 'executivo'
                          ? 'bg-[#0f172a] text-white shadow-xs ring-1 ring-amber-400/40'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>1. Executivo (8 Pontos • Azul Torrado)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRelatorioSubView('geral')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        relatorioSubView === 'geral'
                          ? 'bg-[#2667ff] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>2. Geral (Consolidado)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRelatorioSubView('supervisor')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        relatorioSubView === 'supervisor'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>3. Por Supervisor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRelatorioSubView('data_lancamento')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        relatorioSubView === 'data_lancamento'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>4. Por Data de Lançamento</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRelatorioSubView('coordenacao')}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        relatorioSubView === 'coordenacao'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                      <span>5. Por Coordenação</span>
                    </button>
                  </div>

                  {/* Resumo Rápido de Contadores */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 justify-end">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono">
                      <strong>{submissoes.length}</strong> envios &bull; <strong>{stats.totalFichas}</strong> fichas
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-mono font-bold">
                      {stats.totalPessoas.toLocaleString('pt-PT')} pessoas
                    </span>
                  </div>
                </div>
              </div>

              {/* BANNER DA CAMADA LÓGICA AUTOMATIZADA: RESUMO DAS METAS REQUERIDAS */}
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 rounded-xl p-4 sm:p-5 text-white shadow-xs border border-indigo-700/40 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold shrink-0">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-white">
                          Camada Lógica Automatizada &bull; Metas da Campanha
                        </h4>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-mono font-bold px-2 py-0.5 rounded border border-indigo-400/30">
                          {automatedFichaPlanning.supervisoresCalculados.length} Supervisores
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        O total requerido é calculado automaticamente pelo sistema: <code>Meta Diária × Dias de Trabalho = Total Requerido</code>.
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const commonDias = supervisores[0]?.diasTrabalhoPrevistos || 5;
                        setBatchDias(commonDias);
                        setShowBatchDiasModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start md:self-auto shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Alterar Dias para Todos de Uma Vez</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700/60">
                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">Total Requerido Geral</span>
                    <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      {automatedFichaPlanning.totalRequeridoGeral} Fichas
                    </div>
                    <span className="text-[10px] text-slate-400">Meta total somando todos</span>
                  </div>

                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider block">Fichas Lançadas</span>
                    <div className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
                      {automatedFichaPlanning.totalLancadoGeral} Fichas
                    </div>
                    <span className="text-[10px] text-slate-400">{automatedFichaPlanning.progressoGeralStr} cumprido</span>
                  </div>

                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider block">Fichas Restantes</span>
                    <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                      {automatedFichaPlanning.totalRestanteGeral} Fichas
                    </div>
                    <span className="text-[10px] text-slate-400">Para concluir o objetivo</span>
                  </div>

                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">Pessoas / Locais</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                      {automatedFichaPlanning.totalPessoasGeral.toLocaleString('pt-PT')}
                    </div>
                    <span className="text-[10px] text-slate-400">{automatedFichaPlanning.totalLocaisGeral} locais visitados</span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* SUB-VISTA 1: RELATÓRIO EXECUTIVO ESPECÍFICO (8 PONTOS • AZUL TORRADO) */}
              {/* ============================================================== */}
              {relatorioSubView === 'executivo' && (
                <div className="space-y-6">
                  {/* 1. PAINEL DE FILTROS: POR SUPERVISOR, POR COORDENAÇÃO, POR DATA */}
                  <div className="bg-[#0f172a] text-white p-5 rounded-2xl shadow-lg border border-blue-900/40 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                          <Filter className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-white text-base tracking-tight">
                            Filtros de Pesquisa do Relatório
                          </h4>
                          <p className="text-xs text-slate-300">
                            Filtre instantaneamente por <strong>Supervisor</strong>, por <strong>Coordenação</strong> ou por <strong>Data</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-blue-950 text-blue-200 border border-blue-800/80 px-3 py-1 rounded-lg">
                          <strong>{submissoesExecutivoFiltradas.length}</strong> {submissoesExecutivoFiltradas.length === 1 ? 'Envio' : 'Envios'} &bull; <strong>{resumoExecutivo.totalFichas}</strong> {resumoExecutivo.totalFichas === 1 ? 'Ficha' : 'Fichas'}
                        </span>
                        {(relatorioSupervisorId !== 'todos' || relatorioCoordenacaoId !== 'todas' || relatorioDataFilter !== 'todas' || relatorioExecutivoSearch !== '') && (
                          <button
                            type="button"
                            onClick={() => {
                              setRelatorioSupervisorId('todos');
                              setRelatorioCoordenacaoId('todas');
                              setRelatorioDataFilter('todas');
                              setRelatorioExecutivoSearch('');
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            title="Repor todos os filtros"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Limpar Filtros</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Controles de Filtro: 4 colunas responsivas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Filtro 1: Supervisor */}
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>Por Supervisor</span>
                        </label>
                        <select
                          value={relatorioSupervisorId}
                          onChange={(e) => setRelatorioSupervisorId(e.target.value)}
                          className="w-full py-2.5 px-3 text-xs bg-slate-800/90 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="todos">Todos os Supervisores ({supervisores.length})</option>
                          {supervisores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nome} ({s.codigo}) {s.coordenacao ? `• ${s.coordenacao}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro 2: Coordenação */}
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-purple-400" />
                          <span>Por Coordenação</span>
                        </label>
                        <select
                          value={relatorioCoordenacaoId}
                          onChange={(e) => setRelatorioCoordenacaoId(e.target.value)}
                          className="w-full py-2.5 px-3 text-xs bg-slate-800/90 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="todas">Todas as Coordenações ({coordenacoes.length})</option>
                          {coordenacoes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro 3: Data */}
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Por Data</span>
                        </label>
                        <select
                          value={relatorioDataFilter}
                          onChange={(e) => setRelatorioDataFilter(e.target.value)}
                          className="w-full py-2.5 px-3 text-xs bg-slate-800/90 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="todas">Todas as Datas</option>
                          {dailyAnalytics.sortedDates.map((d) => (
                            <option key={d} value={d}>
                              {formatarDataPt(d)} {dailyAnalytics.dateLabels[d]?.diaNum ? `(Dia ${dailyAnalytics.dateLabels[d].diaNum})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro 4: Pesquisa Texto Livre */}
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pesquisar Bairro / Palavra</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ex: Kikombo, Chingo, Centro..."
                            value={relatorioExecutivoSearch}
                            onChange={(e) => setRelatorioExecutivoSearch(e.target.value)}
                            className="w-full py-2.5 pl-8 pr-3 text-xs bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                          {relatorioExecutivoSearch && (
                            <button
                              type="button"
                              onClick={() => setRelatorioExecutivoSearch('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação Imediata no Relatório */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>
                          Os dados e totais abaixo correspondem estritamente aos filtros ativos.
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportPDF}
                          disabled={isExportingPdf}
                          className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer border border-blue-400/40"
                          title="Descarregar relatório oficial com cabeçalho governamental em PDF (.pdf)"
                        >
                          <FileDown className="w-4 h-4 text-amber-300" />
                          <span>{isExportingPdf ? 'A Gerar PDF...' : 'Exportar PDF Oficial (.pdf)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportExcelRelatorio}
                          disabled={isExportingExcel}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                          title="Descarregar folha de cálculo Excel (.xlsx) com estes dados filtrados"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>{isExportingExcel ? 'A Gerar Excel...' : 'Exportar Excel (.xlsx)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. CABEÇALHO GOVERNAMENTAL EM AZUL TORRADO */}
                  <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#0f172a] rounded-2xl p-5 text-white shadow-md border-b-4 border-amber-500 space-y-4">
                    <div className="text-center space-y-1">
                      <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase">
                        REPÚBLICA DE ANGOLA &bull; GOVERNO DA PROVÍNCIA DO CUANZA SUL
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        ADMINISTRAÇÃO MUNICIPAL DO SUMBE &bull; RELATÓRIO ESPECÍFICO DE MOBILIZAÇÃO SOCIAL
                      </h3>
                      <p className="text-xs text-slate-300 max-w-2xl mx-auto">
                        Campanha de Vacinação Contra a Poliomielite &bull; Apresentação discriminada das <strong>8 Categorias da Ficha</strong> com locais e pessoas.
                      </p>
                    </div>

                    {/* Barra de KPIs Resumo em Azul Torrado */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/50">
                        <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider block">Fichas Lançadas</span>
                        <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                          {resumoExecutivo.totalFichas}
                        </div>
                        <span className="text-[10px] text-slate-400">{submissoesExecutivoFiltradas.length} envios</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/50">
                        <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">Locais Cobertos</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                          {resumoExecutivo.totalLocais.toLocaleString('pt-PT')}
                        </div>
                        <span className="text-[10px] text-slate-400">Total somado das 8 categorias</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/50">
                        <span className="text-[10px] text-sky-300 uppercase font-bold tracking-wider block">Pessoas Mobilizadas</span>
                        <div className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">
                          {resumoExecutivo.totalPessoas.toLocaleString('pt-PT')}
                        </div>
                        <span className="text-[10px] text-slate-400">Total somado das 8 categorias</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/50">
                        <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block">Mobilizados (Sim)</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                          {resumoExecutivo.totalSim.toLocaleString('pt-PT')}
                        </div>
                        <span className="text-[10px] text-emerald-300 font-bold">{resumoExecutivo.taxaAdesao}% de adesão</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-900/50 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider block">Recusas (Não)</span>
                        <div className="text-xl sm:text-2xl font-black text-rose-400 mt-0.5">
                          {resumoExecutivo.totalNao.toLocaleString('pt-PT')}
                        </div>
                        <span className="text-[10px] text-slate-400">Pessoas que recusaram</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. AS 8 CATEGORIAS COM CORES DIFERENTES E FORMATO ESPECÍFICO */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">
                          Distribuição Específica por Ponto de Mobilização (As 8 Categorias)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Cada ponto possui uma cor exclusiva para visualização clara, rápida e sem confusão.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* PONTO 1: CASA A CASA */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border-2 border-blue-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Ponto 1</span>
                              <h5 className="font-extrabold text-blue-950 text-sm">Casa a casa</h5>
                            </div>
                          </div>
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Residências
                          </span>
                        </div>

                        <p className="text-[11px] text-blue-800/80 mb-3">
                          Visitas domiciliares de porta em porta nas comunidades
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-blue-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
                            <span className="text-xs font-semibold text-slate-600">Casa a casa - locais:</span>
                            <span className="text-base font-black text-blue-950 font-mono">
                              {totais8Pontos.casa.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Casa a casa - pessoas:</span>
                            <span className="text-base font-black text-blue-600 font-mono">
                              {totais8Pontos.casa.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 2: IGREJAS */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 border-2 border-purple-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                              <Church className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Ponto 2</span>
                              <h5 className="font-extrabold text-purple-950 text-sm">Igrejas</h5>
                            </div>
                          </div>
                          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Religioso
                          </span>
                        </div>

                        <p className="text-[11px] text-purple-800/80 mb-3">
                          Templos, paróquias, congregações e cultos
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-purple-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-purple-100">
                            <span className="text-xs font-semibold text-slate-600">Igrejas - locais:</span>
                            <span className="text-base font-black text-purple-950 font-mono">
                              {totais8Pontos.igrejas.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Igrejas - pessoas:</span>
                            <span className="text-base font-black text-purple-600 font-mono">
                              {totais8Pontos.igrejas.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 3: PRAÇAS / MERCADOS */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border-2 border-amber-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Ponto 3</span>
                              <h5 className="font-extrabold text-amber-950 text-sm">Praças / Mercados</h5>
                            </div>
                          </div>
                          <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Comércio
                          </span>
                        </div>

                        <p className="text-[11px] text-amber-800/80 mb-3">
                          Mercados municipais, feiras e praças públicas
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-amber-100">
                            <span className="text-xs font-semibold text-slate-600">Praças/Mercados - locais:</span>
                            <span className="text-base font-black text-amber-950 font-mono">
                              {totais8Pontos.pracas.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Praças/Mercados - pessoas:</span>
                            <span className="text-base font-black text-amber-600 font-mono">
                              {totais8Pontos.pracas.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 4: PARAGEM DE TÁXI */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Ponto 4</span>
                              <h5 className="font-extrabold text-emerald-950 text-sm">Paragem de táxi</h5>
                            </div>
                          </div>
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Transporte
                          </span>
                        </div>

                        <p className="text-[11px] text-emerald-800/80 mb-3">
                          Terminais de táxis, mototáxis e paragens
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                            <span className="text-xs font-semibold text-slate-600">Paragem de taxi - locais:</span>
                            <span className="text-base font-black text-emerald-950 font-mono">
                              {totais8Pontos.paragem.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Paragem de taxi - pessoas:</span>
                            <span className="text-base font-black text-emerald-600 font-mono">
                              {totais8Pontos.paragem.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 5: CRECHES */}
                      <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 border-2 border-rose-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                              <Baby className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Ponto 5</span>
                              <h5 className="font-extrabold text-rose-950 text-sm">Creches</h5>
                            </div>
                          </div>
                          <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Infantil
                          </span>
                        </div>

                        <p className="text-[11px] text-rose-800/80 mb-3">
                          Centros infantis, infantários e berçários
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-rose-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-rose-100">
                            <span className="text-xs font-semibold text-slate-600">Creches - locais:</span>
                            <span className="text-base font-black text-rose-950 font-mono">
                              {totais8Pontos.creches.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Creches - pessoas:</span>
                            <span className="text-base font-black text-rose-600 font-mono">
                              {totais8Pontos.creches.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 6: ESCOLAS */}
                      <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 border-2 border-sky-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Ponto 6</span>
                              <h5 className="font-extrabold text-sky-950 text-sm">Escolas</h5>
                            </div>
                          </div>
                          <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Ensino
                          </span>
                        </div>

                        <p className="text-[11px] text-sky-800/80 mb-3">
                          Colégios, escolas primárias e secundárias
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-sky-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                            <span className="text-xs font-semibold text-slate-600">Escolas - locais:</span>
                            <span className="text-base font-black text-sky-950 font-mono">
                              {totais8Pontos.escolas.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Escolas - pessoas:</span>
                            <span className="text-base font-black text-sky-600 font-mono">
                              {totais8Pontos.escolas.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 7: PONTO DE ÁGUA */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100/60 border-2 border-teal-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                              <Droplets className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Ponto 7</span>
                              <h5 className="font-extrabold text-teal-950 text-sm">Ponto de água</h5>
                            </div>
                          </div>
                          <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Comunitário
                          </span>
                        </div>

                        <p className="text-[11px] text-teal-800/80 mb-3">
                          Chafarizes, fontanários públicos e cacimbas
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-teal-200 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-teal-100">
                            <span className="text-xs font-semibold text-slate-600">Ponto de água - locais:</span>
                            <span className="text-base font-black text-teal-950 font-mono">
                              {totais8Pontos.agua.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Ponto de água - pessoas:</span>
                            <span className="text-base font-black text-teal-600 font-mono">
                              {totais8Pontos.agua.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PONTO 8: OUTROS */}
                      <div className="bg-gradient-to-br from-slate-100 to-indigo-50 border-2 border-slate-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs">
                              <MoreHorizontal className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Ponto 8</span>
                              <h5 className="font-extrabold text-slate-900 text-sm">Outros</h5>
                            </div>
                          </div>
                          <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Diversos
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-700/80 mb-3">
                          Outros locais públicos e aglomerações sociais
                        </p>

                        <div className="bg-white/90 rounded-xl p-3 border border-slate-300 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                            <span className="text-xs font-semibold text-slate-600">Outros - locais:</span>
                            <span className="text-base font-black text-slate-950 font-mono">
                              {totais8Pontos.outros.locais.toLocaleString('pt-PT')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Outros - pessoas:</span>
                            <span className="text-base font-black text-slate-800 font-mono">
                              {totais8Pontos.outros.pessoas.toLocaleString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. QUADRO TABELAR CONSOLIDADO DOS 8 PONTOS */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-[#0f172a] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Quadro Comparativo Oficial das 8 Categorias</span>
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Resumo discriminado de Locais Cobertos e Pessoas Sensibilizadas
                        </p>
                      </div>
                      <div className="text-xs text-amber-300 font-mono font-bold bg-blue-950/90 px-3 py-1 rounded-lg border border-blue-900">
                        Total: {resumoExecutivo.totalLocais.toLocaleString('pt-PT')} Locais &bull; {resumoExecutivo.totalPessoas.toLocaleString('pt-PT')} Pessoas
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Ponto de Mobilização</th>
                            <th className="py-3 px-4 text-center">Locais Visitados</th>
                            <th className="py-3 px-4 text-center">Pessoas Mobilizadas</th>
                            <th className="py-3 px-4 text-center">% do Total Pessoas</th>
                            <th className="py-3 px-4 text-center">Média Pessoas / Local</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          <tr className="hover:bg-blue-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-blue-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                              <span>1. Casa a casa</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-blue-950 font-mono">
                              {totais8Pontos.casa.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-blue-600 font-mono">
                              {totais8Pontos.casa.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.casa.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.casa.locais > 0 ? (totais8Pontos.casa.pessoas / totais8Pontos.casa.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-purple-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-purple-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                              <span>2. Igrejas</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-purple-950 font-mono">
                              {totais8Pontos.igrejas.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-purple-600 font-mono">
                              {totais8Pontos.igrejas.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.igrejas.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.igrejas.locais > 0 ? (totais8Pontos.igrejas.pessoas / totais8Pontos.igrejas.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-amber-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-amber-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
                              <span>3. Praças / Mercados</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-amber-950 font-mono">
                              {totais8Pontos.pracas.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-amber-600 font-mono">
                              {totais8Pontos.pracas.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.pracas.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.pracas.locais > 0 ? (totais8Pontos.pracas.pessoas / totais8Pontos.pracas.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-emerald-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-emerald-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                              <span>4. Paragem de táxi</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-950 font-mono">
                              {totais8Pontos.paragem.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-600 font-mono">
                              {totais8Pontos.paragem.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.paragem.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.paragem.locais > 0 ? (totais8Pontos.paragem.pessoas / totais8Pontos.paragem.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-rose-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-rose-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                              <span>5. Creches</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-rose-950 font-mono">
                              {totais8Pontos.creches.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-rose-600 font-mono">
                              {totais8Pontos.creches.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.creches.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.creches.locais > 0 ? (totais8Pontos.creches.pessoas / totais8Pontos.creches.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-sky-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-sky-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                              <span>6. Escolas</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-sky-950 font-mono">
                              {totais8Pontos.escolas.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-sky-600 font-mono">
                              {totais8Pontos.escolas.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.escolas.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.escolas.locais > 0 ? (totais8Pontos.escolas.pessoas / totais8Pontos.escolas.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-teal-50/50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-teal-950">
                              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
                              <span>7. Ponto de água</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-teal-950 font-mono">
                              {totais8Pontos.agua.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-teal-600 font-mono">
                              {totais8Pontos.agua.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.agua.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.agua.locais > 0 ? (totais8Pontos.agua.pessoas / totais8Pontos.agua.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>

                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                              <span>8. Outros</span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-950 font-mono">
                              {totais8Pontos.outros.locais.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700 font-mono">
                              {totais8Pontos.outros.pessoas.toLocaleString('pt-PT')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {resumoExecutivo.totalPessoas > 0 ? ((totais8Pontos.outros.pessoas / resumoExecutivo.totalPessoas) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">
                              {totais8Pontos.outros.locais > 0 ? (totais8Pontos.outros.pessoas / totais8Pontos.outros.locais).toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                          <tr>
                            <td className="py-3.5 px-4 text-right">TOTAL GERAL CONSOLIDADO:</td>
                            <td className="py-3.5 px-4 text-center text-blue-900 font-black font-mono text-sm">
                              {resumoExecutivo.totalLocais.toLocaleString('pt-PT')} locais
                            </td>
                            <td className="py-3.5 px-4 text-center text-blue-700 font-black font-mono text-sm">
                              {resumoExecutivo.totalPessoas.toLocaleString('pt-PT')} pessoas
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono">100.0%</td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                              {resumoExecutivo.totalLocais > 0 ? (resumoExecutivo.totalPessoas / resumoExecutivo.totalLocais).toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 5. LISTA DE FICHAS FILTRADAS */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          Submissões Filtradas ({submissoesExecutivoFiltradas.length} Envios)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Detalhamento ficha a ficha conforme dados lançados pelos supervisores no terreno
                        </p>
                      </div>
                    </div>

                    {submissoesExecutivoFiltradas.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold">Nenhuma ficha corresponde aos filtros selecionados.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setRelatorioSupervisorId('todos');
                            setRelatorioCoordenacaoId('todas');
                            setRelatorioDataFilter('todas');
                            setRelatorioExecutivoSearch('');
                          }}
                          className="text-xs text-blue-600 font-bold hover:underline"
                        >
                          Limpar filtros para ver todos os dados
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-3">Data</th>
                              <th className="py-3 px-3">Supervisor</th>
                              <th className="py-3 px-3">Bairro</th>
                              <th className="py-3 px-2 text-center text-blue-700">1. Casas (L/P)</th>
                              <th className="py-3 px-2 text-center text-purple-700">2. Igrejas (L/P)</th>
                              <th className="py-3 px-2 text-center text-amber-700">3. Praças (L/P)</th>
                              <th className="py-3 px-2 text-center text-emerald-700">4. Paragens (L/P)</th>
                              <th className="py-3 px-2 text-center text-rose-700">5. Creches (L/P)</th>
                              <th className="py-3 px-2 text-center text-sky-700">6. Escolas (L/P)</th>
                              <th className="py-3 px-2 text-center text-teal-700">7. Água (L/P)</th>
                              <th className="py-3 px-2 text-center text-slate-700">8. Outros (L/P)</th>
                              <th className="py-3 px-2 text-center font-bold">Total L.</th>
                              <th className="py-3 px-2 text-center font-bold">Total P.</th>
                              <th className="py-3 px-2 text-center text-emerald-600 font-bold">Sim</th>
                              <th className="py-3 px-2 text-center text-rose-600 font-bold">Não</th>
                              <th className="py-3 px-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {submissoesExecutivoFiltradas.map((sub) => {
                              return (sub.fichas || []).map((f, idx) => {
                                const locFicha =
                                  (f.casa_locais || 0) +
                                  (f.igrejas_locais || 0) +
                                  (f.pracas_locais || 0) +
                                  (f.paragem_locais || 0) +
                                  (f.creches_locais || 0) +
                                  (f.escolas_locais || 0) +
                                  (f.agua_locais || 0) +
                                  (f.outros_locais || 0);

                                const pessFicha =
                                  (f.casa_pessoas || 0) +
                                  (f.igrejas_pessoas || 0) +
                                  (f.pracas_pessoas || 0) +
                                  (f.paragem_pessoas || 0) +
                                  (f.creches_pessoas || 0) +
                                  (f.escolas_pessoas || 0) +
                                  (f.agua_pessoas || 0) +
                                  (f.outros_pessoas || 0);

                                return (
                                  <tr key={`${sub.id}_${f.id || idx}`} className="hover:bg-slate-50 transition">
                                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                                      {formatarDataPt(sub.dataEnvio || sub.data)}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="font-bold text-slate-900">{sub.supervisorNome}</div>
                                      <div className="text-[10px] text-slate-400">Ficha #{f.numeroFicha || idx + 1}</div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="font-semibold text-slate-800">{f.bairro || 'Sem Bairro'}</span>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-blue-900 bg-blue-50/30">
                                      {f.casa_locais || 0} / <strong>{f.casa_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-purple-900 bg-purple-50/30">
                                      {f.igrejas_locais || 0} / <strong>{f.igrejas_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-amber-900 bg-amber-50/30">
                                      {f.pracas_locais || 0} / <strong>{f.pracas_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-emerald-900 bg-emerald-50/30">
                                      {f.paragem_locais || 0} / <strong>{f.paragem_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-rose-900 bg-rose-50/30">
                                      {f.creches_locais || 0} / <strong>{f.creches_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-sky-900 bg-sky-50/30">
                                      {f.escolas_locais || 0} / <strong>{f.escolas_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-teal-900 bg-teal-50/30">
                                      {f.agua_locais || 0} / <strong>{f.agua_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-slate-800 bg-slate-50">
                                      {f.outros_locais || 0} / <strong>{f.outros_pessoas || 0}</strong>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                                      {locFicha}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-700">
                                      {pessFicha}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-emerald-700 font-bold">
                                      {f.total_sim || 0}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-rose-600 font-bold">
                                      {f.total_nao || 0}
                                    </td>
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubmission(sub)}
                                        className="text-[#2667ff] hover:text-[#1a53db] font-bold text-[11px] underline cursor-pointer"
                                      >
                                        Ver Envio
                                      </button>
                                    </td>
                                  </tr>
                                );
                              });
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SUB-VISTA 2: RELATÓRIO GERAL (CONSOLIDADO MUNICIPAL) */}
              {/* ============================================================== */}
              {relatorioSubView === 'geral' && (
                <div className="space-y-6">
                  {/* Quadro Consolidado Municipal com as 8 Categorias da Ficha */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          Consolidação Geral Municipal pelas 8 Categorias da Ficha
                        </h4>
                        <p className="text-xs text-slate-500">
                          Total somado de locais visitados e pessoas sensibilizadas em cada categoria conforme preenchido nas fichas
                        </p>
                      </div>
                      <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-mono font-semibold text-slate-700">
                        {stats.totalLocais} Locais &bull; {stats.totalPessoas.toLocaleString('pt-PT')} Pessoas
                      </div>
                    </div>

                    {/* Grelha das 8 Categorias conforme inseridas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">1. Casas / Residências</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.casa.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.casa.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">2. Igrejas / Cultos</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.igrejas.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.igrejas.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">3. Mercados / Praças</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.pracas.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.pracas.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">4. Paragens de Táxi</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.paragem.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.paragem.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">5. Creches / Infantários</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.creches.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.creches.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">6. Escolas / Ensino</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.escolas.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.escolas.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">7. Pontos de Água</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.agua.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.agua.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700">8. Outros Locais</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {automatedFichaPlanning.categoriasTotaisGeral.outros.locais} <span className="text-xs font-normal text-slate-500">locais</span>
                        </div>
                        <div className="text-xs font-bold text-[#2667ff]">
                          {automatedFichaPlanning.categoriasTotaisGeral.outros.pessoas.toLocaleString('pt-PT')} <span className="font-normal text-slate-500">pessoas</span>
                        </div>
                      </div>
                    </div>

                    {/* Balanço de Aceitação Sim vs Não */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-emerald-800 font-semibold uppercase block">Total Sim (Aceitaram)</span>
                          <div className="text-xl font-bold text-emerald-900">{stats.totalSim.toLocaleString('pt-PT')}</div>
                        </div>
                        <span className="badge badge-success text-xs font-bold">{stats.taxaAdesao}% Adesão</span>
                      </div>

                      <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-rose-800 font-semibold uppercase block">Total Não (Recusaram)</span>
                          <div className="text-xl font-bold text-rose-900">{stats.totalNao.toLocaleString('pt-PT')}</div>
                        </div>
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-xs font-bold">
                          {stats.totalSim + stats.totalNao > 0 ? (100 - stats.taxaAdesao).toFixed(1) : 0}% Recusas
                        </span>
                      </div>

                      <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-blue-800 font-semibold uppercase block">Total Fichas Lançadas</span>
                          <div className="text-xl font-bold text-[#1a53db]">{stats.totalFichas}</div>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#1a53db]">
                          {submissoes.length} Submissões
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filtros da Tabela Geral */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                            className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg outline-none"
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
                          className="w-full py-2 px-3 text-xs border rounded-lg bg-white"
                        >
                          <option value="todos">Todas as Comunas</option>
                          {COMUNAS_SUMBE.map((c) => (
                            <option key={c} value={c}>Comuna: {c}</option>
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
                          className="w-full py-2 px-3 text-xs border rounded-lg bg-white"
                        >
                          <option value="todos">Todos os Supervisores</option>
                          {supervisores.map((s) => (
                            <option key={s.id} value={s.id}>{s.nome} ({s.codigo})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Filtrar por Data
                        </label>
                        <select
                          value={filterDia}
                          onChange={(e) => setFilterDia(e.target.value)}
                          className="w-full py-2 px-3 text-xs border rounded-lg bg-white"
                        >
                          <option value="todos">Todas as Datas</option>
                          {dailyAnalytics.sortedDates.map((d) => (
                            <option key={d} value={d}>
                              {dailyAnalytics.dateLabels[d]?.label || d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tabela Completa de Fichas Gerais */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-bold text-slate-800 text-sm">
                        Todas as Fichas Enviadas ({filteredSubmissoes.length} Submissões Filtradas)
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Clique em &quot;Ver Detalhes&quot; para abrir a ficha completa
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Data / Dia</th>
                            <th className="py-3 px-4">Supervisor</th>
                            <th className="py-3 px-3">Comuna</th>
                            <th className="py-3 px-3 text-center">Fichas</th>
                            <th className="py-3 px-3 text-center">Locais</th>
                            <th className="py-3 px-3 text-center font-bold text-[#2667ff]">Sim (Pessoas)</th>
                            <th className="py-3 px-3 text-center text-slate-500">Não</th>
                            <th className="py-3 px-3 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSubmissoes.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">
                                Nenhuma ficha encontrada com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            filteredSubmissoes.map((sub) => {
                              const comunas = Array.from(new Set(sub.fichas.map((f) => f.comuna))).join(', ');
                              return (
                                <tr key={sub.id} className="hover:bg-slate-50 transition">
                                  <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                                    <div>{sub.data}</div>
                                    <div className="text-[10px] text-slate-400">Dia {sub.diaCampanha || 1}</div>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-slate-900">
                                    {sub.supervisorNome}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    {comunas || 'Sede'}
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold font-mono text-slate-800">
                                    <span className="bg-blue-50 text-[#1a53db] border border-blue-200 px-2 py-0.5 rounded-full">
                                      {sub.fichas.length}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                                    {sub.totalLocais}
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold text-[#2667ff]">
                                    {sub.totalSim.toLocaleString('pt-PT')}
                                  </td>
                                  <td className="py-3 px-3 text-center text-slate-500">
                                    {sub.totalNao}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {!isReadOnly ? (
                                      <select
                                        value={sub.status}
                                        onChange={(e) =>
                                          updateSubmissaoStatus(
                                            sub.id,
                                            e.target.value as 'Validado' | 'Pendente' | 'Em Revisão'
                                          )
                                        }
                                        className={`text-xs font-bold py-1 px-2 rounded border cursor-pointer ${
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
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubmission(sub)}
                                        className="text-xs bg-[#eff4ff] hover:bg-[#dbeafe] text-[#1a53db] font-semibold px-2.5 py-1.5 rounded transition inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Detalhes</span>
                                      </button>
                                      {!isReadOnly && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm('Deseja eliminar esta submissão?')) {
                                              deleteSubmissao(sub.id);
                                            }
                                          }}
                                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
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
              {/* SUB-VISTA 2: SEPARADO POR SUPERVISOR (POR SUP.) */}
              {/* ============================================================== */}
              {relatorioSubView === 'supervisor' && (
                <div className="space-y-6">
                  {/* Seletor do Supervisor */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          Relatório Individual Separado por Supervisor
                        </div>
                        <div className="text-xs text-slate-500">
                          Exibe cada ficha preenchida pelo supervisor exatamente no formato de inserção (as 8 categorias)
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleExportExcel(
                            relatorioSupervisorId !== 'todos'
                              ? {
                                  supervisorId: relatorioSupervisorId,
                                  titulo: `supervisor_${
                                    supervisores.find((s) => s.id === relatorioSupervisorId)?.nome || 'individual'
                                  }`,
                                }
                              : { titulo: 'todos_supervisores' }
                          )
                        }
                        disabled={isExportingExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Exportar fichas dos supervisores para Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Exportar Excel</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-600">Filtrar:</span>
                        <select
                          value={relatorioSupervisorId}
                          onChange={(e) => setRelatorioSupervisorId(e.target.value)}
                          className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 outline-none"
                        >
                          <option value="todos">Todos os Supervisores ({supervisores.length})</option>
                          {supervisores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nome} ({s.codigo}) &bull; {s.comuna}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Supervisores Selecionados */}
                  {automatedFichaPlanning.supervisoresCalculados
                    .filter((sc) => relatorioSupervisorId === 'todos' || sc.supervisor.id === relatorioSupervisorId)
                    .map((sc, index) => {
                      const color = COLORS_9_SUPERVISORES[index % COLORS_9_SUPERVISORES.length];

                      return (
                        <div key={sc.supervisor.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                          {/* Cabeçalho do Supervisor com Camada Lógica Automatizada */}
                          <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 border-b border-slate-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0"
                                  style={{ backgroundColor: color }}
                                >
                                  {sc.supervisor.nome.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-lg">{sc.supervisor.nome}</h4>
                                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                      {sc.supervisor.codigo}
                                    </span>
                                    <span className={`badge ${sc.supervisor.ativo ? 'badge-success' : 'bg-slate-100 text-slate-500'}`}>
                                      {sc.supervisor.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                                    <span><strong>Coordenação:</strong> {sc.supervisor.coordenacao || 'Coordenação Geral'}</span>
                                    <span>&bull;</span>
                                    <span><strong>Comuna:</strong> {sc.supervisor.comuna}</span>
                                    <span>&bull;</span>
                                    <span><strong>Contacto:</strong> {sc.supervisor.telefone || 'Sem telefone'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Card da Meta Automatizada deste Supervisor */}
                              <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 text-xs flex flex-wrap items-center gap-3 self-start md:self-auto">
                                <div>
                                  <span className="text-[10px] text-indigo-600 font-bold block uppercase">Cálculo Automatizado</span>
                                  <strong className="text-indigo-950 font-mono text-sm">
                                    {sc.fichasDiarias}/dia &times; {sc.diasTrabalho} dias = {sc.totalFichasRequeridas} fichas
                                  </strong>
                                </div>
                                <div className="border-l border-indigo-200 pl-3">
                                  <span className="text-[10px] text-indigo-600 font-bold block uppercase">Progresso</span>
                                  <span className="font-bold text-slate-800">
                                    {sc.fichasLancadas} / {sc.totalFichasRequeridas} ({sc.percentualStr})
                                  </span>
                                </div>
                                <div className="border-l border-indigo-200 pl-3">
                                  <span className="text-[10px] text-amber-700 font-bold block uppercase">Em Falta</span>
                                  <span className="font-bold text-amber-800 font-mono">
                                    {sc.fichasRestantes} fichas
                                  </span>
                                </div>
                                <div className="border-l border-indigo-200 pl-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleExportExcel({
                                        supervisorId: sc.supervisor.id,
                                        titulo: `supervisor_${sc.supervisor.nome}`,
                                      })
                                    }
                                    disabled={isExportingExcel}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                    title={`Exportar fichas de ${sc.supervisor.nome} para Excel`}
                                  >
                                    <FileSpreadsheet className="w-3 h-3" />
                                    <span>Excel</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Somatório das 8 Categorias deste Supervisor */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 pt-3 border-t border-slate-100">
                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">1. Casas</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.casa.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.casa.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">2. Igrejas</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.igrejas.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.igrejas.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">3. Praças</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.pracas.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.pracas.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">4. Paragens</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.paragem.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.paragem.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">5. Creches</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.creches.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.creches.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">6. Escolas</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.escolas.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.escolas.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">7. Água</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.agua.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.agua.pessoas} pess.</div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                                <div className="text-[10px] font-semibold text-slate-500 truncate">8. Outros</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">{sc.categorias.outros.locais} loc.</div>
                                <div className="text-[10px] font-bold text-[#2667ff]">{sc.categorias.outros.pessoas} pess.</div>
                              </div>
                            </div>
                          </div>

                          {/* Lista das Fichas Preenchidas por este Supervisor CONFORME INSERIDAS NO FORMULÁRIO */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>Fichas Registadas de {sc.supervisor.nome} ({sc.fichasIndividuais.length} fichas):</span>
                              <span className="text-slate-400 font-normal">
                                Total Sim: <strong className="text-emerald-700">{sc.totalSim}</strong> &bull; Total Não: <strong className="text-rose-700">{sc.totalNao}</strong>
                              </span>
                            </div>

                            {sc.fichasIndividuais.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl text-xs border border-dashed border-slate-200">
                                Este supervisor ainda não enviou nenhuma ficha de mobilização.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {sc.fichasIndividuais.map((ficha, fIdx) => (
                                  <div
                                    key={`${ficha.submissaoId}-${fIdx}`}
                                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition space-y-2.5"
                                  >
                                    {/* Cabeçalho da Ficha */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-[#2667ff] text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                                          Ficha {ficha.numeroFicha || fIdx + 1}
                                        </span>
                                        <span className="font-bold text-slate-900 text-sm">
                                          Bairro: {ficha.bairro}
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          ({ficha.comuna})
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                          Data: {ficha.data} (Dia {ficha.diaCampanha})
                                        </span>
                                        <span className={`badge ${ficha.status === 'Validado' ? 'badge-success' : 'badge-warning'}`}>
                                          {ficha.status}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Tabela das 8 Categorias da Ficha CONFORME INSERIDO */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-center text-[11px] border border-slate-200 bg-white rounded-lg overflow-hidden">
                                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                                          <tr>
                                            <th className="py-1 px-2 text-left">Categoria</th>
                                            <th className="py-1 px-1">1. Casas</th>
                                            <th className="py-1 px-1">2. Igrejas</th>
                                            <th className="py-1 px-1">3. Praças</th>
                                            <th className="py-1 px-1">4. Paragens</th>
                                            <th className="py-1 px-1">5. Creches</th>
                                            <th className="py-1 px-1">6. Escolas</th>
                                            <th className="py-1 px-1">7. Água</th>
                                            <th className="py-1 px-1">8. Outros</th>
                                            <th className="py-1 px-2 font-bold text-[#1a53db] bg-blue-50/50">Total</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          <tr>
                                            <td className="py-1 px-2 font-semibold text-slate-700 text-left bg-slate-50/50">Locais</td>
                                            <td className="py-1 px-1 font-mono">{ficha.casa_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.igrejas_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.pracas_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.paragem_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.creches_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.escolas_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.agua_locais}</td>
                                            <td className="py-1 px-1 font-mono">{ficha.outros_locais}</td>
                                            <td className="py-1 px-2 font-mono font-bold bg-blue-50/50 text-slate-900">{ficha.totalLocaisFicha}</td>
                                          </tr>
                                          <tr>
                                            <td className="py-1 px-2 font-semibold text-slate-700 text-left bg-slate-50/50">Pessoas</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.casa_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.igrejas_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.pracas_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.paragem_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.creches_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.escolas_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.agua_pessoas}</td>
                                            <td className="py-1 px-1 font-mono font-bold text-[#2667ff]">{ficha.outros_pessoas}</td>
                                            <td className="py-1 px-2 font-mono font-black bg-blue-50/50 text-[#1a53db]">{ficha.totalPessoasFicha}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Rodapé da Ficha: Aceitação Sim / Não */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                                      <div className="flex items-center gap-3">
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                          &check; Total Sim (Aceitação): {ficha.total_sim}
                                        </span>
                                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                          &cross; Total Não (Recusas): {ficha.total_nao}
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const sub = submissoes.find((s) => s.id === ficha.submissaoId);
                                          if (sub) setSelectedSubmission(sub);
                                        }}
                                        className="text-[#2667ff] hover:text-[#1a53db] font-semibold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Ver Submissão Completa</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUB-VISTA 3: SEPARADO POR DATA DE LANÇAMENTO (POR DATA) */}
              {/* ============================================================== */}
              {relatorioSubView === 'data_lancamento' && (
                <div className="space-y-6">
                  {/* Seletor da Data de Lançamento & Exportação */}
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                          <CalendarDays className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                            <span>Relatório de Fichas por Data de Lançamento</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                              Data de Envio no Sistema
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Acompanhe e audite as fichas organizadas rigorosamente pela data e hora em que foram inseridas e sincronizadas pelos supervisores na base de dados.
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleExportExcel({
                              dataLancamento:
                                relatorioDataLancamentoFilter !== 'todas' ? relatorioDataLancamentoFilter : undefined,
                              titulo:
                                relatorioDataLancamentoFilter !== 'todas'
                                  ? `data_lancamento_${relatorioDataLancamentoFilter}`
                                  : 'todas_datas_lancamento',
                            })
                          }
                          disabled={isExportingExcel}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="Exportar dados desta seleção para ficheiro Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>
                            {isExportingExcel
                              ? 'A Gerar...'
                              : relatorioDataLancamentoFilter !== 'todas'
                              ? 'Exportar Esta Data (.xlsx)'
                              : 'Exportar Todas as Datas (.xlsx)'}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">Filtrar Data:</span>
                          <select
                            value={relatorioDataLancamentoFilter}
                            onChange={(e) => setRelatorioDataLancamentoFilter(e.target.value)}
                            className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 outline-none max-w-xs"
                          >
                            <option value="todas">
                              Todas as Datas ({datasLancamentoAgrupadas.length} dias, {submissoes.length} envios)
                            </option>
                            {datasLancamentoAgrupadas.map((d) => (
                              <option key={d.dataKey} value={d.dataKey}>
                                {d.dataFormatada} &bull; {d.totalFichas} fichas ({d.submissoes.length} envios)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Resumo Consolidado do Filtro de Data */}
                    {(() => {
                      const gruposFiltrados = datasLancamentoAgrupadas.filter(
                        (d) => relatorioDataLancamentoFilter === 'todas' || d.dataKey === relatorioDataLancamentoFilter
                      );
                      const totalEnviosFiltro = gruposFiltrados.reduce((acc, g) => acc + g.submissoes.length, 0);
                      const totalFichasFiltro = gruposFiltrados.reduce((acc, g) => acc + g.totalFichas, 0);
                      const totalLocaisFiltro = gruposFiltrados.reduce((acc, g) => acc + g.totalLocais, 0);
                      const totalSimFiltro = gruposFiltrados.reduce((acc, g) => acc + g.totalSim, 0);
                      const totalNaoFiltro = gruposFiltrados.reduce((acc, g) => acc + g.totalNao, 0);
                      const totalPessoasFiltro = totalSimFiltro + totalNaoFiltro;
                      const taxaAdesao =
                        totalPessoasFiltro > 0 ? ((totalSimFiltro / totalPessoasFiltro) * 100).toFixed(1) : '100';

                      // Supervisores únicos envolvidos
                      const supervisoresUnicosSet = new Set<string>();
                      gruposFiltrados.forEach((g) => g.supervisoresNomes.forEach((nome) => supervisoresUnicosSet.add(nome)));

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Envios Registados</span>
                            <span className="font-mono font-bold text-slate-800 text-sm">
                              {totalEnviosFiltro} remessas
                            </span>
                          </div>

                          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                            <span className="text-[10px] text-blue-600 font-bold block uppercase">Fichas Lançadas</span>
                            <span className="font-mono font-bold text-blue-900 text-sm">
                              {totalFichasFiltro} fichas
                            </span>
                          </div>

                          <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                            <span className="text-[10px] text-indigo-600 font-bold block uppercase">Supervisores Ativos</span>
                            <span className="font-mono font-bold text-indigo-900 text-sm">
                              {supervisoresUnicosSet.size} supervisores
                            </span>
                          </div>

                          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                            <span className="text-[10px] text-amber-700 font-bold block uppercase">Locais Cobertos</span>
                            <span className="font-mono font-bold text-amber-900 text-sm">
                              {totalLocaisFiltro} locais
                            </span>
                          </div>

                          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 font-bold block uppercase">Mobilizados (Sim)</span>
                            <span className="font-mono font-bold text-emerald-800 text-sm">
                              {totalSimFiltro.toLocaleString('pt-PT')}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">Adesão Comunitária</span>
                            <span className="font-mono font-bold text-emerald-700 text-sm">
                              {taxaAdesao}% ({totalNaoFiltro} não)
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lista de Grupos por Data de Lançamento */}
                  {datasLancamentoAgrupadas.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 space-y-2">
                      <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="font-bold text-slate-700">Nenhuma ficha lançada no sistema até ao momento.</div>
                      <p className="text-xs text-slate-400">
                        Quando os supervisores preencherem fichas no terreno ou através do formulário, cada ficha ficará registrada pela sua data exata de envio.
                      </p>
                    </div>
                  ) : (
                    datasLancamentoAgrupadas
                      .filter(
                        (item) => relatorioDataLancamentoFilter === 'todas' || item.dataKey === relatorioDataLancamentoFilter
                      )
                      .map((dataGroup) => (
                        <div
                          key={dataGroup.dataKey}
                          className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                        >
                          {/* Cabeçalho da Data de Lançamento */}
                          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border-b border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-mono font-black flex flex-col items-center justify-center text-xs shadow-xs shrink-0">
                                  <span>{dataGroup.dataKey.split('-')[2] || 'D'}</span>
                                  <span className="text-[9px] uppercase font-bold opacity-80">
                                    {dataGroup.dataKey.split('-')[1] || 'M'}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                                      {dataGroup.dataFormatada}
                                    </h4>
                                    <span className="text-xs font-semibold text-slate-500">
                                      &bull; {dataGroup.dataCompleta}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                                      {dataGroup.totalFichas} fichas lançadas
                                    </span>
                                    <span>&bull;</span>
                                    <span>{dataGroup.submissoes.length} envios realizados</span>
                                    <span>&bull;</span>
                                    <span>{dataGroup.supervisoresNomes.length} supervisores ativos</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleExportExcel({
                                      dataLancamento: dataGroup.dataKey,
                                      titulo: `data_${dataGroup.dataKey}`,
                                    })
                                  }
                                  disabled={isExportingExcel}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                  title={`Exportar todas as fichas lançadas no dia ${dataGroup.dataFormatada} para Excel`}
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>Exportar Este Dia (.xlsx)</span>
                                </button>
                              </div>
                            </div>

                            {/* Supervisores Ativos neste Dia */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>Supervisores que lançaram nesta data:</span>
                              </span>
                              {dataGroup.supervisoresNomes.map((nome, idx) => {
                                const fichasDoSupNestaData = dataGroup.submissoes
                                  .filter((s) => s.supervisorNome === nome)
                                  .reduce((acc, s) => acc + (s.fichas?.length || 0), 0);
                                return (
                                  <span
                                    key={idx}
                                    className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    <span>{nome}</span>
                                    <strong className="text-indigo-700 font-mono">({fichasDoSupNestaData} fichas)</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Lista das Submissões e Fichas Lançadas Nesta Data */}
                          <div className="p-4 sm:p-5 space-y-4">
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                              Envios / Remessas Registadas no Sistema ({dataGroup.submissoes.length})
                            </div>

                            <div className="space-y-4">
                              {dataGroup.submissoes.map((sub, subIdx) => {
                                const horaEnvioFormatada = formatarHoraPt(sub.dataEnvio);
                                const totalLocaisSub = (sub.fichas || []).reduce((acc, f) => {
                                  return (
                                    acc +
                                    (f.casa_locais || 0) +
                                    (f.igrejas_locais || 0) +
                                    (f.pracas_locais || 0) +
                                    (f.paragem_locais || 0) +
                                    (f.creches_locais || 0) +
                                    (f.escolas_locais || 0) +
                                    (f.agua_locais || 0) +
                                    (f.outros_locais || 0)
                                  );
                                }, 0);

                                return (
                                  <div
                                    key={sub.id || subIdx}
                                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 transition hover:border-slate-300"
                                  >
                                    {/* Cabeçalho do Envio com Horário e Supervisor */}
                                    <div className="p-3 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs border border-slate-200">
                                          #{subIdx + 1}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-900 text-sm">
                                              {sub.supervisorNome}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                                              {sub.municipio || 'Sumbe'}
                                            </span>
                                            <span
                                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                sub.status === 'Validado'
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}
                                            >
                                              {sub.status || 'Validado'}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                            <span className="flex items-center gap-1 font-mono text-slate-600">
                                              <Clock className="w-3 h-3 text-slate-400" />
                                              Hora de Envio: <strong>{horaEnvioFormatada}</strong>
                                            </span>
                                            <span>&bull;</span>
                                            <span>Data no Terreno: <strong>{formatarDataPt(sub.data)}</strong></span>
                                            {sub.diaCampanha && (
                                              <>
                                                <span>&bull;</span>
                                                <span className="font-semibold text-indigo-700">
                                                  Dia {sub.diaCampanha} de Campanha
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Métricas e Botões de Ação do Envio */}
                                      <div className="flex items-center gap-2 self-end md:self-auto">
                                        <div className="text-right text-xs mr-2 hidden sm:block">
                                          <div className="font-bold text-slate-800">
                                            {sub.fichas?.length || 0} fichas &bull; {totalLocaisSub} locais
                                          </div>
                                          <div className="text-[11px]">
                                            <span className="text-emerald-700 font-bold">Sim: {sub.totalSim}</span>
                                            <span className="text-slate-400 mx-1">/</span>
                                            <span className="text-rose-700 font-bold">Não: {sub.totalNao}</span>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setSelectedSubmission(sub)}
                                          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                          title="Ver ficha completa detalhada"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                                          <span className="hidden sm:inline">Ver Detalhes</span>
                                        </button>

                                        {!isReadOnly && (
                                          <button
                                            type="button"
                                            onClick={() => handleStartAdminEditSub(sub)}
                                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                            title="Editar ficha caso o supervisor tenha cometido erros de lançamento"
                                          >
                                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Editar</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Tabela Resumo das Fichas Deste Envio */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                          <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[11px]">
                                            <th className="py-2 px-3">Ficha Nº</th>
                                            <th className="py-2 px-3">Bairro</th>
                                            <th className="py-2 px-2 text-center">1. Casas</th>
                                            <th className="py-2 px-2 text-center">2. Igrejas</th>
                                            <th className="py-2 px-2 text-center">3. Praças</th>
                                            <th className="py-2 px-2 text-center">4. Paragens</th>
                                            <th className="py-2 px-2 text-center">5. Creches</th>
                                            <th className="py-2 px-2 text-center">6. Escolas</th>
                                            <th className="py-2 px-2 text-center">7. Água</th>
                                            <th className="py-2 px-2 text-center">8. Outros</th>
                                            <th className="py-2 px-3 text-center font-bold text-slate-800">Locais</th>
                                            <th className="py-2 px-3 text-center font-bold text-emerald-700 bg-emerald-50/60">
                                              Sim
                                            </th>
                                            <th className="py-2 px-3 text-center font-bold text-rose-700 bg-rose-50/60">
                                              Não
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/60 bg-white">
                                          {(sub.fichas || []).map((f, fIdx) => {
                                            const locaisLinha =
                                              (f.casa_locais || 0) +
                                              (f.igrejas_locais || 0) +
                                              (f.pracas_locais || 0) +
                                              (f.paragem_locais || 0) +
                                              (f.creches_locais || 0) +
                                              (f.escolas_locais || 0) +
                                              (f.agua_locais || 0) +
                                              (f.outros_locais || 0);

                                            return (
                                              <tr key={f.id || fIdx} className="hover:bg-slate-50 transition">
                                                <td className="py-2 px-3 font-mono font-bold text-slate-700">
                                                  #{f.numeroFicha || fIdx + 1}
                                                </td>
                                                <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                                  {f.bairro || 'Sem Bairro'}
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.casa_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.casa_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.igrejas_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.igrejas_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.pracas_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.pracas_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.paragem_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.paragem_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.creches_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.creches_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.escolas_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.escolas_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.agua_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.agua_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono">
                                                  <span className="text-slate-800 font-medium">{f.outros_locais || 0}</span>
                                                  <span className="text-[10px] text-blue-600 ml-1">({f.outros_pessoas || 0})</span>
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                                                  {locaisLinha}
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                                  {f.total_sim}
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono font-bold text-rose-700 bg-rose-50/40">
                                                  {f.total_nao}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUB-VISTA 4: SEPARADO POR COORDENAÇÃO (POR COORDE.) */}
              {/* ============================================================== */}
              {relatorioSubView === 'coordenacao' && (
                <div className="space-y-6">
                  {/* Seletor de Coordenação */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          Relatório Separado por Coordenação de Campo
                        </div>
                        <div className="text-xs text-slate-500">
                          Agrupa os dados das fichas e o somatório dos 1 a 2 supervisores atribuídos a cada coordenação
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Filtrar Coordenação:</span>
                      <select
                        value={relatorioCoordenacaoId}
                        onChange={(e) => setRelatorioCoordenacaoId(e.target.value)}
                        className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 outline-none"
                      >
                        <option value="todas">Todas as Coordenações</option>
                        {coordenacoes.map((c) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Lista de Coordenações */}
                  {automatedFichaPlanning.coordenacoesCalculadas
                    .filter((cc) => relatorioCoordenacaoId === 'todas' || cc.coordenacao.id === relatorioCoordenacaoId)
                    .map((cc) => (
                      <div key={cc.coordenacao.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                        {/* Cabeçalho da Coordenação */}
                        <div className="p-5 bg-gradient-to-r from-purple-50/60 via-white to-slate-50 border-b border-slate-200">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                  <Compass className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-lg">{cc.coordenacao.nome}</h4>
                                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                    <span>{cc.coordenacao.municipio || 'Sumbe'} ({cc.coordenacao.comuna || 'Sede'})</span>
                                    <span>&bull;</span>
                                    <span>Setores: <strong>{(cc.coordenacao.bairros || ['Sede']).join(', ')}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card da Meta da Coordenação (Soma dos Supervisores Vinculados) */}
                            <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-200 text-xs flex flex-wrap items-center gap-3 self-start md:self-auto">
                              <div>
                                <span className="text-[10px] text-purple-700 font-bold block uppercase">Meta Requerida da Coordenação</span>
                                <strong className="text-purple-950 font-mono text-sm">
                                  {cc.totalRequeridoCoord} fichas
                                </strong>
                              </div>
                              <div className="border-l border-purple-200 pl-3">
                                <span className="text-[10px] text-purple-700 font-bold block uppercase">Lançadas</span>
                                <span className="font-bold text-slate-800">
                                  {cc.totalLancadoCoord} ({cc.percentualCoordStr})
                                </span>
                              </div>
                              <div className="border-l border-purple-200 pl-3">
                                <span className="text-[10px] text-purple-700 font-bold block uppercase">Em Falta</span>
                                <span className="font-bold text-amber-800 font-mono">
                                  {cc.totalRestanteCoord} fichas
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Supervisores Vinculados */}
                          <div className="mt-4 pt-3 border-t border-purple-100 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">Supervisores Vinculados:</span>
                            {cc.supervisoresVinculados.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">Nenhum supervisor vinculado</span>
                            ) : (
                              cc.supervisoresVinculados.map((sc) => (
                                <span
                                  key={sc.supervisor.id}
                                  className="bg-white border border-purple-200 text-purple-900 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Users className="w-3 h-3 text-purple-600" />
                                  <span>{sc.supervisor.nome} ({sc.supervisor.codigo})</span>
                                  <span className="text-[10px] text-slate-500 font-mono font-normal">
                                    &bull; {sc.fichasLancadas}/{sc.totalFichasRequeridas} fichas
                                  </span>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Consolidação das 8 Categorias da Coordenação */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 pt-3 border-t border-slate-100">
                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">1. Casas</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.casa.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.casa.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">2. Igrejas</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.igrejas.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.igrejas.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">3. Praças</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.pracas.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.pracas.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">4. Paragens</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.paragem.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.paragem.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">5. Creches</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.creches.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.creches.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">6. Escolas</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.escolas.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.escolas.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">7. Água</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.agua.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.agua.pessoas} pess.</div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200 text-center">
                              <div className="text-[10px] font-semibold text-slate-500 truncate">8. Outros</div>
                              <div className="font-mono font-bold text-slate-800 text-xs">{cc.categoriasCoord.outros.locais} loc.</div>
                              <div className="text-[10px] font-bold text-purple-700">{cc.categoriasCoord.outros.pessoas} pess.</div>
                            </div>
                          </div>
                        </div>

                        {/* Fichas Individuais Desta Coordenação */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Fichas Lançadas nesta Coordenação ({cc.todasFichasCoord.length}):</span>
                            <span className="text-slate-500 font-normal">
                              Pessoas: <strong>{cc.totalPessoasCoord.toLocaleString('pt-PT')}</strong> &bull; Locais: <strong>{cc.totalLocaisCoord}</strong>
                            </span>
                          </div>

                          {cc.todasFichasCoord.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl text-xs border border-dashed border-slate-200">
                              Nenhuma ficha lançada ainda nesta coordenação.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Data / Ficha</th>
                                    <th className="py-2.5 px-3">Supervisor</th>
                                    <th className="py-2.5 px-3">Bairro</th>
                                    <th className="py-2.5 px-2 text-center">Casas</th>
                                    <th className="py-2.5 px-2 text-center">Igrejas</th>
                                    <th className="py-2.5 px-2 text-center">Praças</th>
                                    <th className="py-2.5 px-2 text-center">Outros</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-purple-700">Locais</th>
                                    <th className="py-2.5 px-2 text-center font-bold text-[#2667ff]">Sim (Pessoas)</th>
                                    <th className="py-2.5 px-2 text-center text-slate-500">Não</th>
                                    <th className="py-2.5 px-3 text-right">Ação</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {cc.todasFichasCoord.map((ficha, fIdx) => (
                                    <tr key={`${ficha.submissaoId}-${fIdx}`} className="hover:bg-slate-50">
                                      <td className="py-2 px-3 font-mono font-medium text-slate-800">
                                        <div>{ficha.data}</div>
                                        <div className="text-[10px] text-slate-400">Ficha {ficha.numeroFicha || fIdx + 1}</div>
                                      </td>
                                      <td className="py-2 px-3 font-semibold text-slate-800">
                                        <div>{ficha.supervisorNome}</div>
                                        <div className="text-[10px] font-mono text-[#2667ff]">{ficha.supervisorCodigo}</div>
                                      </td>
                                      <td className="py-2 px-3 text-slate-700 font-medium">
                                        {ficha.bairro}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                                        {ficha.casa_locais}/{ficha.casa_pessoas}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                                        {ficha.igrejas_locais}/{ficha.igrejas_pessoas}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                                        {ficha.pracas_locais}/{ficha.pracas_pessoas}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                                        {ficha.outros_locais}/{ficha.outros_pessoas}
                                      </td>
                                      <td className="py-2 px-2 text-center font-bold font-mono text-purple-900 bg-purple-50/40">
                                        {ficha.totalLocaisFicha}
                                      </td>
                                      <td className="py-2 px-2 text-center font-black font-mono text-[#1a53db] bg-blue-50/40">
                                        {ficha.total_sim}
                                      </td>
                                      <td className="py-2 px-2 text-center font-mono text-slate-500">
                                        {ficha.total_nao}
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const sub = submissoes.find((s) => s.id === ficha.submissaoId);
                                            if (sub) setSelectedSubmission(sub);
                                          }}
                                          className="text-xs text-[#2667ff] hover:text-[#1a53db] font-semibold hover:underline cursor-pointer"
                                        >
                                          Ver Ficha
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
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

              {/* COORDENAÇÃO (SELEÇÃO DIRETA OU ESCRITA) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordenação de Atuação (1 a 2 Supervisores) <span className="text-purple-600">*</span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value={newSupCoordenacao}
                    onChange={(e) => {
                      const coordNome = e.target.value;
                      setNewSupCoordenacao(coordNome);
                      const found = coordenacoes.find((c) => c.nome === coordNome);
                      if (found) {
                        const dias = found.diasTrabalho || 5;
                        const mob = found.totalMobilizadores || 10;
                        const porMob = found.fichasDiariasPorMobilizador || 5;
                        const totalDiario = mob * porMob;
                        const totalCoord = found.metaFichasTotal || (totalDiario * dias);
                        const vagasTotais = 2;
                        const cota = Math.round(totalCoord / vagasTotais);
                        const cotaDiaria = Math.max(1, Math.round(totalDiario / vagasTotais));
                        setNewSupDiasTrabalho(dias);
                        setNewSupTotalFichas(cota);
                        setNewSupFichasDiarias(cotaDiaria);
                      }
                    }}
                    className="w-full text-sm font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Selecione uma coordenação registada...</option>
                    {coordenacoes.map((c) => {
                      const vagas = 2 - (c.supervisorIds?.length || 0);
                      const mob = c.totalMobilizadores || 10;
                      return (
                        <option key={c.id} value={c.nome}>
                          {c.nome} &bull; {mob} mob. &bull; {vagas > 0 ? `${vagas} vaga(s)` : 'Lotação completa'}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Ou digite o nome da coordenação..."
                    value={newSupCoordenacao}
                    onChange={(e) => setNewSupCoordenacao(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
                {(() => {
                  const matched = coordenacoes.find((c) => c.nome.toLowerCase() === newSupCoordenacao.trim().toLowerCase());
                  if (!matched) return null;
                  const mob = matched.totalMobilizadores || 10;
                  const porMob = matched.fichasDiariasPorMobilizador || 5;
                  const dias = matched.diasTrabalho || 5;
                  const total = matched.metaFichasTotal || (mob * porMob * dias);
                  const cota = Math.round(total / 2);
                  return (
                    <div className="mt-1.5 p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-950 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-purple-900">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Estruturação Automática da Coordenação:</span>
                      </div>
                      <div className="text-purple-800">
                        {mob} mobilizadores × {porMob} fichas/dia × {dias} dias = <strong>{total} fichas no total</strong>.
                      </div>
                      <div className="font-semibold text-purple-950">
                        Cota pré-configurada para este supervisor: <strong>{cota} fichas ({Math.round((mob * porMob) / 2)} fichas/dia)</strong>.
                      </div>
                    </div>
                  );
                })()}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Cada coordenação suporta até 2 supervisores. As metas são sincronizadas de forma estruturada.
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

                {/* Campo Principal: Número Exato de Fichas */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    Número Exato de Fichas Atribuídas (Meta Total Real) <span className="text-[#2667ff]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={newSupTotalFichas}
                    onChange={(e) => {
                      const tot = Math.max(1, parseInt(e.target.value) || 1);
                      setNewSupTotalFichas(tot);
                      setNewSupFichasDiarias(Math.max(1, Math.round(tot / (newSupDiasTrabalho || 5))));
                    }}
                    className="w-full text-base font-black font-mono text-emerald-900 bg-emerald-50/30 py-2 px-3 border border-emerald-300 rounded-lg outline-none"
                    placeholder="Ex: 25, 30..."
                  />
                  <span className="text-[10px] text-emerald-700 block mt-1 font-medium">
                    Número exato com que o supervisor será lançado na campanha
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fichas Diárias Previstas <span className="text-[#2667ff]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={newSupFichasDiarias}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setNewSupFichasDiarias(val);
                        setNewSupTotalFichas(val * newSupDiasTrabalho);
                      }}
                      className="w-full text-sm font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none"
                      placeholder="Ex: 5"
                    />
                    <span className="text-[10px] text-slate-500">Meta diária de recolha</span>
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
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setNewSupDiasTrabalho(val);
                        setNewSupTotalFichas(newSupFichasDiarias * val);
                      }}
                      className="w-full text-sm font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none"
                      placeholder="Ex: 5"
                    />
                    <span className="text-[10px] text-slate-500">Duração estimada da campanha</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Total Real Cadastrado:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {newSupTotalFichas} fichas ({newSupFichasDiarias}/dia × {newSupDiasTrabalho} dias)
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
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const sub = selectedSubmission;
                      setSelectedSubmission(null);
                      handleStartAdminEditSub(sub);
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1a53db] font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#2667ff]" />
                    <span>Editar Fichas desta Remessa</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADMIN EDITAR FICHAS DA SUBMISSÃO */}
      {/* ============================================================== */}
      {editingSubByAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 text-slate-800 my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1a53db] flex items-center justify-center font-bold shrink-0">
                  <Edit3 className="w-5 h-5 text-[#2667ff]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Editar e Corrigir Fichas (Admin)
                  </h3>
                  <div className="text-xs text-slate-500">
                    Supervisor: <strong className="text-slate-800">{editingSubByAdmin.supervisorNome}</strong> &bull; Remessa ID: <span className="font-mono">{editingSubByAdmin.id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubByAdmin(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {adminEditSuccessMsg && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminEditSuccessMsg}</span>
              </div>
            )}
            {adminEditErrorMsg && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminEditErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminSubEdit} className="overflow-y-auto flex-1 pr-1 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data da Atividade</label>
                  <input
                    type="date"
                    required
                    value={editAdminData}
                    onChange={(e) => setEditAdminData(e.target.value)}
                    className="w-full text-xs font-semibold py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dia da Campanha</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={editAdminDia}
                    onChange={(e) => setEditAdminDia(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-bold py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Fichas nesta Remessa ({editAdminFichas.length})</h4>

                {editAdminFichas.map((ficha, idx) => (
                  <div key={ficha.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="bg-[#2667ff] text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                        Ficha {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{ficha.bairro || 'Sem Bairro'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Comuna</label>
                        <input
                          type="text"
                          required
                          value={ficha.comuna}
                          onChange={(e) => handleAdminFichaFieldChange(idx, 'comuna', e.target.value)}
                          className="w-full text-xs py-1 px-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Bairro / Aldeia</label>
                        <input
                          type="text"
                          required
                          value={ficha.bairro}
                          onChange={(e) => handleAdminFichaFieldChange(idx, 'bairro', e.target.value)}
                          className="w-full text-xs font-semibold py-1 px-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Casa */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">1. Casa a casa</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.casa_locais === 0 ? '' : ficha.casa_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'casa_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                            title="Locais"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.casa_pessoas === 0 ? '' : ficha.casa_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'casa_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                            title="Pessoas"
                          />
                        </div>
                      </div>

                      {/* Igrejas */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">2. Igrejas</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.igrejas_locais === 0 ? '' : ficha.igrejas_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'igrejas_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                            title="Locais"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.igrejas_pessoas === 0 ? '' : ficha.igrejas_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'igrejas_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                            title="Pessoas"
                          />
                        </div>
                      </div>

                      {/* Praças */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">3. Praças</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.pracas_locais === 0 ? '' : ficha.pracas_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'pracas_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.pracas_pessoas === 0 ? '' : ficha.pracas_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'pracas_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                          />
                        </div>
                      </div>

                      {/* Paragens */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">4. Paragens</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.paragem_locais === 0 ? '' : ficha.paragem_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'paragem_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.paragem_pessoas === 0 ? '' : ficha.paragem_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'paragem_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                          />
                        </div>
                      </div>

                      {/* Creches */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">5. Creches</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.creches_locais === 0 ? '' : ficha.creches_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'creches_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.creches_pessoas === 0 ? '' : ficha.creches_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'creches_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                          />
                        </div>
                      </div>

                      {/* Escolas */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">6. Escolas</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.escolas_locais === 0 ? '' : ficha.escolas_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'escolas_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.escolas_pessoas === 0 ? '' : ficha.escolas_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'escolas_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                          />
                        </div>
                      </div>

                      {/* Água */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">7. Água</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.agua_locais === 0 ? '' : ficha.agua_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'agua_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.agua_pessoas === 0 ? '' : ficha.agua_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'agua_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                          />
                        </div>
                      </div>

                      {/* Outros */}
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[10px] mb-1">8. Outros</span>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.outros_locais === 0 ? '' : ficha.outros_locais}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'outros_locais', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ficha.outros_pessoas === 0 ? '' : ficha.outros_pessoas}
                            onChange={(e) => handleAdminFichaFieldChange(idx, 'outros_pessoas', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-center text-xs py-0.5 bg-white border border-blue-300 text-blue-700 font-bold rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded border border-blue-200 text-xs">
                      <div>
                        <span className="text-slate-600 font-semibold">Total Sim: </span>
                        <strong className="text-[#1a53db]">{ficha.total_sim} pessoas</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 font-semibold">Total Não:</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={ficha.total_nao === 0 ? '' : ficha.total_nao}
                          onChange={(e) => handleAdminFichaFieldChange(idx, 'total_nao', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-16 text-center text-xs py-0.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSubByAdmin(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdminEdit}
                  className="px-5 py-2 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isSavingAdminEdit ? 'A Guardar...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CADASTRAR NOVA COORDENAÇÃO (1 A 2 SUPERVISORES) */}
      {/* ============================================================== */}
      {showAddCoordenacaoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Cadastrar Nova Coordenação
                  </h3>
                  <div className="text-[11px] text-purple-700 font-semibold">
                    Regra: Cada coordenação tem de 1 a 2 supervisores
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCoordenacaoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed shrink-0">
              Crie uma coordenação territorial para mobilização no Sumbe. Cada coordenação agrupa bairros específicos e tem uma equipa de <strong>1 a 2 supervisores</strong> dedicados.
            </p>

            <form onSubmit={handleCreateCoordenacao} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Coordenação <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coordenação Sumbe Centro & Litoral"
                  value={newCoordNome}
                  onChange={(e) => setNewCoordNome(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Setor de Abrangência
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Zona central, comércio, orla marítima e porto pesqueiro"
                  value={newCoordDescricao}
                  onChange={(e) => setNewCoordDescricao(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              {/* PLANEAMENTO ESTRUTURADO: DIAS DE TRABALHO, MOBILIZADORES E MULTIPLICAÇÃO */}
              <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Estruturação: Mobilizadores × Fichas Diárias × Dias de Trabalho
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Dias de Trabalho <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={newCoordDiasTrabalho}
                      onChange={(e) => {
                        const dias = Math.max(1, parseInt(e.target.value) || 1);
                        setNewCoordDiasTrabalho(dias);
                        setNewCoordMetaFichas(newCoordTotalMobilizadores * newCoordFichasDiariasPorMob * dias);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Ex: 5"
                    />
                    <span className="text-[10px] text-slate-500">Dias de campanha</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Quantos Mobilizadores <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={newCoordTotalMobilizadores}
                      onChange={(e) => {
                        const mob = Math.max(1, parseInt(e.target.value) || 1);
                        setNewCoordTotalMobilizadores(mob);
                        setNewCoordMetaFichas(mob * newCoordFichasDiariasPorMob * newCoordDiasTrabalho);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Ex: 10"
                    />
                    <span className="text-[10px] text-slate-500">Mobilizadores na coord.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Fichas Diárias / Mob. <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={newCoordFichasDiariasPorMob}
                      onChange={(e) => {
                        const porMob = Math.max(1, parseInt(e.target.value) || 1);
                        setNewCoordFichasDiariasPorMob(porMob);
                        setNewCoordMetaFichas(newCoordTotalMobilizadores * porMob * newCoordDiasTrabalho);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Ex: 5"
                    />
                    <span className="text-[10px] text-slate-500">Fichas diárias por mob.</span>
                  </div>
                </div>

                {/* Resumo da Multiplicação Automática e Divisão por Supervisor */}
                <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-1">
                    <span className="text-slate-600 font-medium">Fichas Diárias da Coordenação:</span>
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {newCoordTotalMobilizadores * newCoordFichasDiariasPorMob} fichas / dia ({newCoordTotalMobilizadores} mobilizadores × {newCoordFichasDiariasPorMob} fichas)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs gap-1 pt-1 border-t border-slate-100">
                    <span className="text-slate-700 font-bold">Total Geral da Coordenação ({newCoordDiasTrabalho} dias):</span>
                    <span className="font-mono font-extrabold text-base text-purple-900">
                      {newCoordTotalMobilizadores * newCoordFichasDiariasPorMob * newCoordDiasTrabalho} fichas
                    </span>
                  </div>

                  <div className="bg-purple-50/70 p-2.5 rounded-lg text-[11px] text-purple-900 flex items-start gap-2 mt-1 border border-purple-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cálculo Estruturado nos Supervisores:</strong>{' '}
                      {newCoordSupervisorIds.length === 2 ? (
                        <span>
                          Com 2 supervisores vinculados, cada um recebe automaticamente a meta de{' '}
                          <strong>
                            {Math.round((newCoordTotalMobilizadores * newCoordFichasDiariasPorMob * newCoordDiasTrabalho) / 2)} fichas
                          </strong>{' '}
                          ({Math.round((newCoordTotalMobilizadores * newCoordFichasDiariasPorMob) / 2)} fichas/dia durante {newCoordDiasTrabalho} dias).
                        </span>
                      ) : newCoordSupervisorIds.length === 1 ? (
                        <span>
                          Com 1 supervisor vinculado, ele recebe o total de{' '}
                          <strong>
                            {newCoordTotalMobilizadores * newCoordFichasDiariasPorMob * newCoordDiasTrabalho} fichas
                          </strong>{' '}
                          ({newCoordTotalMobilizadores * newCoordFichasDiariasPorMob} fichas/dia durante {newCoordDiasTrabalho} dias).
                        </span>
                      ) : (
                        <span>
                          Ao vincular supervisores, o sistema divide automaticamente o total de{' '}
                          <strong>
                            {newCoordTotalMobilizadores * newCoordFichasDiariasPorMob * newCoordDiasTrabalho} fichas
                          </strong>{' '}
                          pelo número de supervisores da coordenação.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairros e Aldeias de Cobertura <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Centro, Litoral, Porto, Chingo, Bairro Novo (separados por vírgula)"
                  value={newCoordBairros}
                  onChange={(e) => setNewCoordBairros(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Indique os bairros separados por vírgula para organização territorial sem cortar texto.
                </span>
              </div>

              {/* SELEÇÃO DE SUPERVISORES (1 A 2 SUPERVISORES) */}
              <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 uppercase tracking-wide">
                    <Users className="w-4 h-4 text-purple-700" />
                    <span>Supervisores da Coordenação</span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      newCoordSupervisorIds.length === 2
                        ? 'bg-emerald-100 text-emerald-800'
                        : newCoordSupervisorIds.length === 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {newCoordSupervisorIds.length} de 2 selecionados
                  </span>
                </div>

                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Selecione <strong>1 ou 2 supervisores</strong> para esta coordenação. Caso selecione apenas 1 agora, poderá atribuir o 2º posteriormente.
                </p>

                <div className="max-h-44 overflow-y-auto space-y-1.5 bg-white p-2.5 rounded-lg border border-purple-200 divide-y divide-slate-100">
                  {supervisores.map((sup) => {
                    const isSelected = newCoordSupervisorIds.includes(sup.id);
                    const isMaxReached = newCoordSupervisorIds.length >= 2 && !isSelected;

                    return (
                      <label
                        key={sup.id}
                        className={`flex items-center justify-between p-2 rounded-md transition cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-purple-100/70 font-semibold text-purple-950'
                            : isMaxReached
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isMaxReached}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (newCoordSupervisorIds.length < 2) {
                                  setNewCoordSupervisorIds([...newCoordSupervisorIds, sup.id]);
                                }
                              } else {
                                setNewCoordSupervisorIds(newCoordSupervisorIds.filter((id) => id !== sup.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{sup.nome}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {sup.codigo} &bull; {sup.coordenacao || 'Sem coordenação'}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded">
                            Vinculado
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddCoordenacaoModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCoord || !newCoordNome.trim()}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                >
                  {isCreatingCoord ? 'A Gravar...' : 'Salvar Coordenação no Firebase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITAR COORDENAÇÃO EXISTENTE */}
      {/* ============================================================== */}
      {editingCoordenacao && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Editar Coordenação
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {editingCoordenacao.nome}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoordenacao(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditCoordenacao} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Coordenação <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCoordNome}
                  onChange={(e) => setEditCoordNome(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Setor
                </label>
                <textarea
                  rows={2}
                  value={editCoordDescricao}
                  onChange={(e) => setEditCoordDescricao(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              {/* PLANEAMENTO ESTRUTURADO: DIAS DE TRABALHO, MOBILIZADORES E MULTIPLICAÇÃO */}
              <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Estruturação: Mobilizadores × Fichas Diárias × Dias de Trabalho
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Dias de Trabalho <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={editCoordDiasTrabalho}
                      onChange={(e) => {
                        const dias = Math.max(1, parseInt(e.target.value) || 1);
                        setEditCoordDiasTrabalho(dias);
                        setEditCoordMetaFichas(editCoordTotalMobilizadores * editCoordFichasDiariasPorMob * dias);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Ex: 5"
                    />
                    <span className="text-[10px] text-slate-500">Dias de campanha</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Quantos Mobilizadores <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={editCoordTotalMobilizadores}
                      onChange={(e) => {
                        const mob = Math.max(1, parseInt(e.target.value) || 1);
                        setEditCoordTotalMobilizadores(mob);
                        setEditCoordMetaFichas(mob * editCoordFichasDiariasPorMob * editCoordDiasTrabalho);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Ex: 10"
                    />
                    <span className="text-[10px] text-slate-500">Mobilizadores na coord.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Fichas Diárias / Mob. <span className="text-purple-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={editCoordFichasDiariasPorMob}
                      onChange={(e) => {
                        const porMob = Math.max(1, parseInt(e.target.value) || 1);
                        setEditCoordFichasDiariasPorMob(porMob);
                        setEditCoordMetaFichas(editCoordTotalMobilizadores * porMob * editCoordDiasTrabalho);
                      }}
                      className="w-full text-xs font-bold text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="Ex: 5"
                    />
                    <span className="text-[10px] text-slate-500">Fichas diárias por mob.</span>
                  </div>
                </div>

                {/* Resumo da Multiplicação Automática e Divisão por Supervisor */}
                <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-1">
                    <span className="text-slate-600 font-medium">Fichas Diárias da Coordenação:</span>
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {editCoordTotalMobilizadores * editCoordFichasDiariasPorMob} fichas / dia ({editCoordTotalMobilizadores} mobilizadores × {editCoordFichasDiariasPorMob} fichas)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs gap-1 pt-1 border-t border-slate-100">
                    <span className="text-slate-700 font-bold">Total Geral da Coordenação ({editCoordDiasTrabalho} dias):</span>
                    <span className="font-mono font-extrabold text-base text-purple-900">
                      {editCoordTotalMobilizadores * editCoordFichasDiariasPorMob * editCoordDiasTrabalho} fichas
                    </span>
                  </div>

                  <div className="bg-purple-50/70 p-2.5 rounded-lg text-[11px] text-purple-900 flex items-start gap-2 mt-1 border border-purple-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cálculo Estruturado nos Supervisores:</strong>{' '}
                      {editCoordSupervisorIds.length === 2 ? (
                        <span>
                          Com 2 supervisores vinculados, cada um recebe automaticamente a meta de{' '}
                          <strong>
                            {Math.round((editCoordTotalMobilizadores * editCoordFichasDiariasPorMob * editCoordDiasTrabalho) / 2)} fichas
                          </strong>{' '}
                          ({Math.round((editCoordTotalMobilizadores * editCoordFichasDiariasPorMob) / 2)} fichas/dia durante {editCoordDiasTrabalho} dias).
                        </span>
                      ) : editCoordSupervisorIds.length === 1 ? (
                        <span>
                          Com 1 supervisor vinculado, ele recebe o total de{' '}
                          <strong>
                            {editCoordTotalMobilizadores * editCoordFichasDiariasPorMob * editCoordDiasTrabalho} fichas
                          </strong>{' '}
                          ({editCoordTotalMobilizadores * editCoordFichasDiariasPorMob} fichas/dia durante {editCoordDiasTrabalho} dias).
                        </span>
                      ) : (
                        <span>
                          Ao vincular supervisores, o sistema divide automaticamente o total de{' '}
                          <strong>
                            {editCoordTotalMobilizadores * editCoordFichasDiariasPorMob * editCoordDiasTrabalho} fichas
                          </strong>{' '}
                          pelo número de supervisores da coordenação.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairros de Cobertura (Separados por vírgula)
                </label>
                <input
                  type="text"
                  required
                  value={editCoordBairros}
                  onChange={(e) => setEditCoordBairros(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              {/* Supervisores Atribuídos (Máx 2) */}
              <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                    Supervisores Atribuídos ({editCoordSupervisorIds.length} de 2):
                  </span>
                  <span className="text-[11px] font-semibold text-purple-800">
                    Máximo permitido: 2
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-white p-2 rounded-lg border border-purple-200">
                  {supervisores.map((sup) => {
                    const isSelected = editCoordSupervisorIds.includes(sup.id);
                    const isMaxReached = editCoordSupervisorIds.length >= 2 && !isSelected;

                    return (
                      <label
                        key={sup.id}
                        className={`flex items-center justify-between p-2 rounded transition cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-purple-100 font-semibold text-purple-950'
                            : isMaxReached
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isMaxReached}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (editCoordSupervisorIds.length < 2) {
                                  setEditCoordSupervisorIds([...editCoordSupervisorIds, sup.id]);
                                }
                              } else {
                                setEditCoordSupervisorIds(editCoordSupervisorIds.filter((id) => id !== sup.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{sup.nome}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sup.codigo}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded">
                            Atribuído
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCoordenacao(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCoord}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {isSavingCoord ? 'A Gravar...' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ATRIBUIR SUPERVISOR A UMA COORDENAÇÃO RÁPIDO */}
      {/* ============================================================== */}
      {assignModalCoord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Atribuir Supervisor à Coordenação
                  </h3>
                  <div className="text-xs text-purple-700 font-semibold">
                    {assignModalCoord.nome}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalCoord(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Esta coordenação possui atualmente <strong>{assignModalCoord.supervisorIds.length} de 2 supervisores</strong>. Selecione o supervisor que irá ocupar a vaga disponível:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Supervisor
                </label>
                <select
                  value={selectedSupervisorToAssign}
                  onChange={(e) => setSelectedSupervisorToAssign(e.target.value)}
                  className="w-full text-sm font-semibold py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white"
                >
                  <option value="">Selecione um supervisor...</option>
                  {supervisores
                    .filter((s) => !assignModalCoord.supervisorIds.includes(s.id))
                    .map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.nome} ({sup.codigo}) &bull; Atual: {sup.coordenacao || 'Coordenação Geral'}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-900 flex items-start gap-2">
                <Compass className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  Ao confirmar, o supervisor será vinculado a esta coordenação e o seu perfil de campo passará a refletir esta área de atuação.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setAssignModalCoord(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!selectedSupervisorToAssign}
                  onClick={handleConfirmAssign}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Confirmar Atribuição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DEFINIR DIAS DA CAMPANHA PARA TODOS DE UMA SÓ VEZ */}
      {/* ============================================================== */}
      {showBatchDiasModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-800 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Definir Dias da Campanha para Todos os Supervisores
                  </h3>
                  <div className="text-xs text-indigo-700 font-semibold">
                    Configuração Global em Lote &bull; Recálculo Automático de Fichas
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchDiasModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Conteúdo rolável */}
            <form onSubmit={handleApplyBatchDias} className="overflow-y-auto flex-1 pr-1 space-y-4">
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span>Como funciona a validação única:</span>
                </div>
                <p className="leading-relaxed text-indigo-900">
                  Em vez de alterar supervisor por supervisor, insira aqui o número total de dias de trabalho da campanha uma única vez.
                  Como cada supervisor já tem a sua meta diária de fichas, 
                  <strong> o sistema calcula automaticamente quantas fichas cada um vai lançar até ao término dos dias</strong> 
                  (<code>Fichas Diárias × Dias = Total da Campanha</code>).
                </p>
              </div>

              {/* Campo de Entrada de Dias */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Duração Total da Campanha (Dias de Trabalho para Todos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={batchDias}
                    onChange={(e) => setBatchDias(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 text-lg font-bold font-mono text-indigo-700 bg-white py-2 px-3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    dias de trabalho (válido para todos os {supervisores.length} supervisores)
                  </span>
                </div>
              </div>

              {/* Opção de Fichas Diárias */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Meta de Fichas Diárias dos Supervisores
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="batchModoFichas"
                      checked={batchModoFichas === 'manter'}
                      onChange={() => setBatchModoFichas('manter')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      <strong>Manter o número diário de fichas de cada supervisor</strong> (Recomendado &mdash; apenas multiplica pelo novo número de dias)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="batchModoFichas"
                      checked={batchModoFichas === 'padrao'}
                      onChange={() => setBatchModoFichas('padrao')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      <strong>Definir uma meta diária padrão uniforme para todos:</strong>
                    </span>
                  </label>

                  {batchModoFichas === 'padrao' && (
                    <div className="ml-6 pl-3 border-l-2 border-indigo-200 pt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={batchFichasPadrao}
                        onChange={(e) => setBatchFichasPadrao(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 text-sm font-bold font-mono text-slate-800 bg-white py-1.5 px-3 border border-slate-300 rounded-lg outline-none"
                      />
                      <span className="text-xs text-slate-600 font-medium">fichas por dia para todos os supervisores</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabela de Simulação em Tempo Real */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-2.5 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Simulação em Tempo Real para os {supervisores.length} Supervisores:</span>
                  </span>
                  <span className="text-[11px] text-indigo-700 font-mono">
                    Meta Total Global = {supervisores.reduce((acc, s) => {
                      const diarias = batchModoFichas === 'padrao'
                        ? batchFichasPadrao
                        : (s.fichasDiariasPrevistas || Math.ceil((s.totalFichasPrevistas || 25) / (s.diasTrabalhoPrevistos || 5)) || 5);
                      return acc + (diarias * batchDias);
                    }, 0)} fichas
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Supervisor</th>
                        <th className="py-2 px-2 text-center">Fichas/Dia</th>
                        <th className="py-2 px-2 text-center">Dias Novos</th>
                        <th className="py-2 px-3 text-right font-bold text-indigo-900">Total Recalculado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supervisores.map((sup) => {
                        const diarias = batchModoFichas === 'padrao'
                          ? batchFichasPadrao
                          : (sup.fichasDiariasPrevistas || Math.ceil((sup.totalFichasPrevistas || 25) / (sup.diasTrabalhoPrevistos || 5)) || 5);
                        const novoTotal = diarias * batchDias;
                        return (
                          <tr key={sup.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3">
                              <span className="font-semibold text-slate-800">{sup.nome}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5">({sup.codigo})</span>
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono text-slate-700">{diarias}/dia</td>
                            <td className="py-1.5 px-2 text-center font-mono text-indigo-700 font-bold">{batchDias} dias</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/40">
                              {novoTotal} fichas
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBatchDiasModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBatchDias}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{isSavingBatchDias ? 'A Gravar...' : `Salvar e Aplicar ${batchDias} Dias a Todos`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIÇÃO COMPLETA DOS DADOS DO SUPERVISOR */}
      {/* ============================================================== */}
      {editingSupervisorFull && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-800 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Editar Dados do Supervisor
                  </h3>
                  <div className="text-xs text-indigo-700 font-semibold font-mono">
                    {editingSupervisorFull.codigo} &bull; {editingSupervisorFull.nome}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSupervisorFull(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Formulário com Scroll */}
            <form onSubmit={handleSaveSupervisorFull} className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Nome Completo e Código */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo <span className="text-[#2667ff]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSupNome}
                    onChange={(e) => setEditSupNome(e.target.value)}
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Acesso <span className="text-[#2667ff]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSupCodigo}
                    onChange={(e) => setEditSupCodigo(e.target.value.toUpperCase())}
                    className="w-full text-sm font-mono font-bold text-[#1a53db] py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none uppercase"
                  />
                </div>
              </div>

              {/* Telefone e Comuna */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editSupTelefone}
                    onChange={(e) => setEditSupTelefone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comuna de Atuação
                  </label>
                  <select
                    value={editSupComuna}
                    onChange={(e) => setEditSupComuna(e.target.value)}
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none bg-white"
                  >
                    {COMUNAS_SUMBE.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordenação */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordenação de Trabalho Vinculada
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={editSupCoordenacao}
                    onChange={(e) => setEditSupCoordenacao(e.target.value)}
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none bg-white"
                  >
                    <option value="">Selecione da lista de coordenações...</option>
                    {coordenacoes.map((c) => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editSupCoordenacao}
                    onChange={(e) => setEditSupCoordenacao(e.target.value)}
                    placeholder="Ou digite o nome da coordenação..."
                    className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none"
                  />
                </div>
              </div>

              {/* CARD DE INFORMAÇÕES REAIS: NÚMERO EXATO DE FICHAS, DIAS E RITMO DIÁRIO */}
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Meta Real do Supervisor (Número Exato de Fichas e Dias)
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Defina o <strong>número exato de fichas com que este supervisor foi lançado</strong> na campanha e a duração em dias. O sistema reconhece e preserva este número exato em todos os relatórios e painéis.
                </p>

                {/* Campo Principal: Número Exato de Fichas */}
                <div className="bg-white p-3 rounded-lg border border-indigo-200">
                  <label className="block text-xs font-bold text-indigo-950 mb-1">
                    Número Exato de Fichas Atribuídas (Meta Real da Campanha) <span className="text-[#2667ff]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={editSupTotalFichasCalculado}
                    onChange={(e) => {
                      const tot = Math.max(1, parseInt(e.target.value) || 1);
                      setEditSupTotalFichasCalculado(tot);
                      setEditSupFichasDiarias(Math.max(1, Math.round(tot / (editSupDias || 5))));
                    }}
                    className="w-full text-base font-black font-mono text-indigo-900 bg-indigo-50/30 py-2 px-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: 25, 30..."
                  />
                  <span className="text-[10px] text-indigo-600 block mt-1 font-medium">
                    Número exato com que o supervisor foi lançado no sistema
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fichas Diárias Previstas <span className="text-[#2667ff]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={editSupFichasDiarias}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setEditSupFichasDiarias(val);
                        setEditSupTotalFichasCalculado(val * editSupDias);
                      }}
                      className="w-full text-sm font-bold font-mono text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Ritmo de fichas por dia</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dias de Trabalho da Campanha <span className="text-[#2667ff]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={editSupDias}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setEditSupDias(val);
                        setEditSupTotalFichasCalculado(editSupFichasDiarias * val);
                      }}
                      className="w-full text-sm font-bold font-mono text-slate-900 bg-white py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Dias que o supervisor vai trabalhar</span>
                  </div>
                </div>

                {/* Banner de Resultado Calculado */}
                <div className="bg-white p-3 rounded-xl border border-indigo-200 flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Resumo Real da Campanha:</span>
                    <span className="text-[11px] text-slate-500">
                      {editSupFichasDiarias} fichas/dia &times; {editSupDias} dias de trabalho
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 text-sm">
                      = {editSupTotalFichasCalculado} fichas reais
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado Ativo / Inativo */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Estado da Conta do Supervisor</div>
                  <div className="text-[11px] text-slate-500">Supervisores ativos podem iniciar sessão e submeter fichas</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSupAtivo}
                    onChange={(e) => setEditSupAtivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSupervisorFull(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupervisorFull}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingSupervisorFull ? 'A Guardar...' : 'Salvar Alterações do Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

