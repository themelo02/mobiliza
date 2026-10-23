import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Submissao, FichaAtividade } from '../types';
import {
  FileText,
  Eye,
  Calendar,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle2,
  Save,
  X,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';

interface EditableFichaState {
  id: string;
  numeroFicha: number;
  comuna: string;
  bairro: string;
  diaCampanha: number;
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

export const SupervisorHistoryView: React.FC = () => {
  const { userSession, submissoes, coordenacoes, updateSubmissao, deleteSubmissao, setActiveScreen } = useApp();

  // Lista de todos os bairros registados no sistema
  const todosBairrosCadastrados = useMemo(() => {
    const bairrosSet = new Set<string>();
    (coordenacoes || []).forEach((c) => {
      (c.bairros || []).forEach((b) => {
        if (b && b.trim()) bairrosSet.add(b.trim());
      });
    });
    const listaOficialSumbe = [
      'Aeroporto', 'Amboiva', 'Baixo Cubal', 'Bairro Novo', 'Bela Vista', 'Bumba',
      'Cafula', 'Calunga', 'Cariango', 'Centro', 'Chingo', 'Comércio', 'E15',
      'Gangula', 'Kikombo', 'Litoral', 'Mercado Central', 'Paz', 'Pedra 1',
      'Pedreira', 'Pescadores', 'Plateau', 'Pomba', 'Porto', 'Quicombo Rural',
      'Rocha', 'Salinas', 'Valódia', 'Zona Alta',
    ];
    listaOficialSumbe.forEach((b) => bairrosSet.add(b));
    return Array.from(bairrosSet).sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }, [coordenacoes]);

  // Estados de modais
  const [selectedSub, setSelectedSub] = useState<Submissao | null>(null);
  const [editingSub, setEditingSub] = useState<Submissao | null>(null);
  const [subToDelete, setSubToDelete] = useState<Submissao | null>(null);

  // Estados dos campos do modal de edição
  const [editData, setEditData] = useState<string>('');
  const [editDiaCampanha, setEditDiaCampanha] = useState<number>(1);
  const [editFichas, setEditFichas] = useState<EditableFichaState[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string>('');
  const [editErrorMsg, setEditErrorMsg] = useState<string>('');

  const supervisorId = userSession?.supervisor?.id;
  // Supervisores vêem as suas fichas; se for admin no histórico, vê todas ou as do supervisor ativo
  const mySubmissions = submissoes.filter((s) =>
    userSession?.tipo === 'admin' ? true : s.supervisorId === supervisorId
  );

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return mySubmissions;
    const term = searchTerm.toLowerCase().trim();
    return mySubmissions.filter((s) => {
      const matchDate = (s.data || '').toLowerCase().includes(term);
      const matchDia = `dia ${s.diaCampanha || 1}`.includes(term);
      const matchBairros = (s.fichas || []).some((f) => (f.bairro || '').toLowerCase().includes(term));
      const matchComuna = (s.fichas || []).some((f) => (f.comuna || '').toLowerCase().includes(term));
      return matchDate || matchDia || matchBairros || matchComuna;
    });
  }, [mySubmissions, searchTerm]);

  const totalPessoasMinhas = mySubmissions.reduce((acc, s) => acc + s.totalPessoas, 0);
  const totalFichasMinhas = mySubmissions.reduce((acc, s) => acc + (s.fichas ? s.fichas.length : 0), 0);

  // Iniciar edição de uma remessa/submissão
  const handleStartEdit = (sub: Submissao) => {
    setEditingSub(sub);
    setEditData(sub.data || new Date().toISOString().split('T')[0]);
    setEditDiaCampanha(sub.diaCampanha || 1);
    setEditSuccessMsg('');
    setEditErrorMsg('');

    const convertedFichas: EditableFichaState[] = (sub.fichas || []).map((f, idx) => ({
      id: f.id || `f-${Date.now()}-${idx}`,
      numeroFicha: f.numeroFicha || idx + 1,
      comuna: f.comuna || 'Sede',
      bairro: f.bairro || '',
      diaCampanha: f.diaCampanha || sub.diaCampanha || 1,
      casa_locais: f.casa_locais === 0 ? '' : f.casa_locais,
      casa_pessoas: f.casa_pessoas === 0 ? '' : f.casa_pessoas,
      igrejas_locais: f.igrejas_locais === 0 ? '' : f.igrejas_locais,
      igrejas_pessoas: f.igrejas_pessoas === 0 ? '' : f.igrejas_pessoas,
      pracas_locais: f.pracas_locais === 0 ? '' : f.pracas_locais,
      pracas_pessoas: f.pracas_pessoas === 0 ? '' : f.pracas_pessoas,
      paragem_locais: f.paragem_locais === 0 ? '' : f.paragem_locais,
      paragem_pessoas: f.paragem_pessoas === 0 ? '' : f.paragem_pessoas,
      creches_locais: f.creches_locais === 0 ? '' : f.creches_locais,
      creches_pessoas: f.creches_pessoas === 0 ? '' : f.creches_pessoas,
      escolas_locais: f.escolas_locais === 0 ? '' : f.escolas_locais,
      escolas_pessoas: f.escolas_pessoas === 0 ? '' : f.escolas_pessoas,
      agua_locais: f.agua_locais === 0 ? '' : f.agua_locais,
      agua_pessoas: f.agua_pessoas === 0 ? '' : f.agua_pessoas,
      outros_locais: f.outros_locais === 0 ? '' : f.outros_locais,
      outros_pessoas: f.outros_pessoas === 0 ? '' : f.outros_pessoas,
      total_sim: Number(f.total_sim) || 0,
      total_nao: f.total_nao === 0 ? '' : f.total_nao,
    }));

    setEditFichas(convertedFichas.length > 0 ? convertedFichas : [createBlankEditFicha(1)]);
  };

  const createBlankEditFicha = (index: number): EditableFichaState => ({
    id: `new-f-${Date.now()}-${index}`,
    numeroFicha: index,
    comuna: editingSub?.provincia || 'Sede',
    bairro: '',
    diaCampanha: editDiaCampanha,
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

  const handleEditFichaChange = (
    index: number,
    field: keyof EditableFichaState,
    value: string | number
  ) => {
    setEditFichas((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };

      if (field === 'bairro' || field === 'comuna') {
        (current as any)[field] = String(value);
      } else {
        // Validação numérica flexível: aceita string vazia para facilitar edição limpa
        if (value === '') {
          (current as any)[field] = '';
        } else {
          const parsed = parseInt(String(value), 10);
          (current as any)[field] = isNaN(parsed) ? 0 : Math.max(0, parsed);
        }

        // Recálculo automático do Total Sim da ficha
        const c_casa_p = Number(field === 'casa_pessoas' ? value : current.casa_pessoas) || 0;
        const c_igrejas_p = Number(field === 'igrejas_pessoas' ? value : current.igrejas_pessoas) || 0;
        const c_pracas_p = Number(field === 'pracas_pessoas' ? value : current.pracas_pessoas) || 0;
        const c_paragem_p = Number(field === 'paragem_pessoas' ? value : current.paragem_pessoas) || 0;
        const c_creches_p = Number(field === 'creches_pessoas' ? value : current.creches_pessoas) || 0;
        const c_escolas_p = Number(field === 'escolas_pessoas' ? value : current.escolas_pessoas) || 0;
        const c_agua_p = Number(field === 'agua_pessoas' ? value : current.agua_pessoas) || 0;
        const c_outros_p = Number(field === 'outros_pessoas' ? value : current.outros_pessoas) || 0;

        current.total_sim =
          c_casa_p +
          c_igrejas_p +
          c_pracas_p +
          c_paragem_p +
          c_creches_p +
          c_escolas_p +
          c_agua_p +
          c_outros_p;
      }

      updated[index] = current;
      return updated;
    });
  };

  const handleAddFichaToEdit = () => {
    setEditFichas((prev) => [...prev, createBlankEditFicha(prev.length + 1)]);
  };

  const handleRemoveFichaFromEdit = (index: number) => {
    if (editFichas.length <= 1) {
      alert('A submissão deve conter pelo menos 1 ficha.');
      return;
    }
    setEditFichas((prev) =>
      prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, numeroFicha: i + 1 }))
    );
  };

  // Resumo em tempo real da edição
  const resumoEdicao = React.useMemo(() => {
    let totPessoas = 0;
    let totLocais = 0;
    let totNao = 0;

    editFichas.forEach((f) => {
      totPessoas += Number(f.total_sim) || 0;
      totNao += Number(f.total_nao) || 0;
      totLocais +=
        (Number(f.casa_locais) || 0) +
        (Number(f.igrejas_locais) || 0) +
        (Number(f.pracas_locais) || 0) +
        (Number(f.paragem_locais) || 0) +
        (Number(f.creches_locais) || 0) +
        (Number(f.escolas_locais) || 0) +
        (Number(f.agua_locais) || 0) +
        (Number(f.outros_locais) || 0);
    });

    return {
      fichasCount: editFichas.length,
      totalPessoas: totPessoas,
      totalLocais: totLocais,
      totalNao: totNao,
    };
  }, [editFichas]);

  // Salvar alterações da submissão no Firestore
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    // Validar se todos os bairros estão preenchidos
    const missingBairro = editFichas.some((f) => !f.bairro || f.bairro.trim() === '');
    if (missingBairro) {
      setEditErrorMsg('Por favor, informe o nome do Bairro/Aldeia em todas as fichas.');
      return;
    }

    setIsSavingEdit(true);
    setEditErrorMsg('');

    try {
      const sanitizedFichas: FichaAtividade[] = editFichas.map((f, idx) => ({
        id: f.id || `f-${Date.now()}-${idx}`,
        numeroFicha: idx + 1,
        comuna: f.comuna || 'Sede',
        bairro: f.bairro.trim(),
        diaCampanha: editDiaCampanha,
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

      await updateSubmissao(editingSub.id, {
        data: editData,
        diaCampanha: editDiaCampanha,
        fichas: sanitizedFichas,
      });

      setEditSuccessMsg('Fichas corrigidas e atualizadas com sucesso no sistema!');
      setTimeout(() => {
        setEditingSub(null);
        setEditSuccessMsg('');
      }, 1200);
    } catch (err) {
      setEditErrorMsg('Erro ao guardar as alterações. Por favor, tente novamente.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!subToDelete) return;
    try {
      await deleteSubmissao(subToDelete.id);
      setSubToDelete(null);
      if (selectedSub?.id === subToDelete.id) {
        setSelectedSub(null);
      }
    } catch (err) {
      alert('Erro ao excluir submissão.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <button
            onClick={() => setActiveScreen('formulario')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2667ff] hover:text-[#1a53db] mb-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Formulário</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Minhas Fichas Enviadas
            </h1>
            <span className="bg-blue-100 text-[#1a53db] text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full">
              Edição Habilitada
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
            Histórico das coletas enviadas por {userSession?.nome}. Se cometeu algum erro, clique em <strong>Editar Fichas</strong> para retificar.
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('formulario')}
          className="bg-[#2667ff] hover:bg-[#1a53db] text-white font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Preencher Nova Ficha</span>
        </button>
      </div>

      {/* Alerta de facilidade de correção */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 mb-4 sm:mb-6 flex items-start gap-2.5 sm:gap-3 text-amber-900 text-xs">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px] sm:text-xs">
          <strong>Lançou dados com erro?</strong> Agora pode corrigir qualquer ficha enviada a qualquer momento. Clique em <span className="font-bold underline decoration-amber-500">Editar Fichas</span> na remessa desejada para corrigir números, pessoas, bairros ou datas.
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase">Total de Envios</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{mySubmissions.length}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Registos gravados com sucesso</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase">Fichas / Bairros</div>
          <div className="text-xl sm:text-2xl font-black text-[#2667ff] mt-0.5 sm:mt-1">{totalFichasMinhas}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Bairros e áreas cobertas</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase">Pessoas Mobilizadas</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 sm:mt-1">{totalPessoasMinhas.toLocaleString('pt-PT')}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Alcançadas nas suas atividades</div>
        </div>
      </div>

      {/* Lista de Envios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm">Todas as Remessas Enviadas</h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full font-bold">
              {filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'remessa' : 'remessas'}
            </span>
          </div>

          {mySubmissions.length > 0 && (
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por data, dia ou bairro..."
                className="w-full text-xs py-1.5 pl-8 pr-3 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#2667ff] bg-slate-50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {mySubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2667ff]" />
            <p className="text-sm font-medium text-slate-600">Ainda não enviou nenhuma ficha.</p>
            <p className="text-xs mt-1">Clique em "Preencher Nova Ficha" para registar os dados de hoje.</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma remessa encontrada para a pesquisa "{searchTerm}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2667ff]" />
                    <span className="font-bold text-slate-900 text-sm">Data da Atividade: {sub.data}</span>
                    {sub.diaCampanha && (
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Dia {sub.diaCampanha} da Campanha
                      </span>
                    )}
                    <span className={`badge ${sub.status === 'Validado' ? 'badge-success' : 'badge-warning'}`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                    <span>
                      <strong>Fichas:</strong> {sub.fichas ? sub.fichas.length : 0}
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong>Bairros:</strong> {(sub.fichas || []).map((f) => f.bairro).join(', ') || 'Sem bairro'}
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong>Pessoas (Sim):</strong>{' '}
                      <strong className="text-[#1a53db]">{sub.totalSim}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong>Não:</strong> {sub.totalNao}
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong>Locais:</strong> {sub.totalLocais}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {/* Botão Ver Detalhes */}
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Ver desdobramento completo da remessa"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver</span>
                  </button>

                  {/* Botão EDITAR FICHAS (Destaque Principal) */}
                  <button
                    onClick={() => handleStartEdit(sub)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1a53db] hover:text-[#1848c4] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Editar ou corrigir os dados desta submissão"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#2667ff]" />
                    <span>Editar Fichas</span>
                  </button>

                  {/* Botão Excluir (com confirmação) */}
                  <button
                    onClick={() => setSubToDelete(sub)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Eliminar remessa duplicada ou incorreta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL DE EDIÇÃO COMPLETA DAS FICHAS DA SUBMISSÃO */}
      {/* ============================================================== */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 text-slate-800 my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1a53db] flex items-center justify-center font-bold shrink-0">
                  <Edit3 className="w-5 h-5 text-[#2667ff]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Editar e Corrigir Fichas de Atividade
                  </h3>
                  <div className="text-xs text-slate-500">
                    Supervisor: <strong className="text-slate-800">{editingSub.supervisorNome}</strong> &bull; Remessa ID: <span className="font-mono">{editingSub.id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Mensagens de Sucesso ou Erro */}
            {editSuccessMsg && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}
            {editErrorMsg && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            {/* Formulário com Scroll */}
            <form onSubmit={handleSaveEdits} className="overflow-y-auto flex-1 pr-1 space-y-5">
              {/* Metadados: Data e Dia da Campanha */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Coleta/Atividade <span className="text-[#2667ff]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editData}
                    onChange={(e) => setEditData(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia da Campanha (ex: Dia 1, Dia 2...) <span className="text-[#2667ff]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={editDiaCampanha}
                    onChange={(e) => setEditDiaCampanha(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-bold py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] bg-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Lista de Fichas */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <h4 className="font-extrabold text-slate-900 text-sm flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>Fichas nesta Remessa ({editFichas.length})</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      (Zeros automáticos removidos para agilizar)
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFichaToEdit}
                    className="text-xs font-bold text-[#1a53db] hover:text-[#1848c4] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Outra Ficha</span>
                  </button>
                </div>

                {editFichas.map((ficha, fIdx) => (
                  <div
                    key={ficha.id || fIdx}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#2667ff] text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                          Ficha {fIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {ficha.bairro ? `Bairro: ${ficha.bairro}` : 'Nova Ficha'}
                        </span>
                      </div>

                      {editFichas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFichaFromEdit(fIdx)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover Ficha</span>
                        </button>
                      )}
                    </div>

                    {/* Comuna e Bairro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Comuna <span className="text-[#2667ff]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={ficha.comuna}
                          onChange={(e) => handleEditFichaChange(fIdx, 'comuna', e.target.value)}
                          placeholder="Ex: Sede"
                          className="w-full text-xs py-1.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Bairro / Aldeia <span className="text-[#2667ff]">*</span>
                        </label>
                        <select
                          required
                          value={ficha.bairro}
                          onChange={(e) => handleEditFichaChange(fIdx, 'bairro', e.target.value)}
                          className="w-full text-xs font-bold py-1.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2667ff] bg-white outline-none cursor-pointer"
                        >
                          <option value="">-- Selecione o Bairro Cadastrado --</option>
                          {todosBairrosCadastrados.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                          {ficha.bairro && !todosBairrosCadastrados.includes(ficha.bairro) && (
                            <option value={ficha.bairro}>{ficha.bairro} (Personalizado)</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Grade de 8 Categorias (Locais e Pessoas) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                      {/* Casa a Casa */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">1. Casa a casa</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.casa_locais === 0 || ficha.casa_locais === '0' ? '' : ficha.casa_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'casa_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.casa_pessoas === 0 || ficha.casa_pessoas === '0' ? '' : ficha.casa_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'casa_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Igrejas */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">2. Igrejas</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.igrejas_locais === 0 || ficha.igrejas_locais === '0' ? '' : ficha.igrejas_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'igrejas_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.igrejas_pessoas === 0 || ficha.igrejas_pessoas === '0' ? '' : ficha.igrejas_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'igrejas_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Praças */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">3. Praças/Mercados</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.pracas_locais === 0 || ficha.pracas_locais === '0' ? '' : ficha.pracas_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'pracas_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.pracas_pessoas === 0 || ficha.pracas_pessoas === '0' ? '' : ficha.pracas_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'pracas_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Paragens */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">4. Paragens Táxi</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.paragem_locais === 0 || ficha.paragem_locais === '0' ? '' : ficha.paragem_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'paragem_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.paragem_pessoas === 0 || ficha.paragem_pessoas === '0' ? '' : ficha.paragem_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'paragem_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Creches */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">5. Creches</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.creches_locais === 0 || ficha.creches_locais === '0' ? '' : ficha.creches_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'creches_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.creches_pessoas === 0 || ficha.creches_pessoas === '0' ? '' : ficha.creches_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'creches_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Escolas */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">6. Escolas</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.escolas_locais === 0 || ficha.escolas_locais === '0' ? '' : ficha.escolas_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'escolas_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.escolas_pessoas === 0 || ficha.escolas_pessoas === '0' ? '' : ficha.escolas_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'escolas_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pontos de Água */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">7. Pontos de Água</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.agua_locais === 0 || ficha.agua_locais === '0' ? '' : ficha.agua_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'agua_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.agua_pessoas === 0 || ficha.agua_pessoas === '0' ? '' : ficha.agua_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'agua_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Outros */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] mb-1">8. Outros locais</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Locais</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.outros_locais === 0 || ficha.outros_locais === '0' ? '' : ficha.outros_locais}
                              onChange={(e) => handleEditFichaChange(fIdx, 'outros_locais', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#1a53db] font-bold block">Pessoas</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={ficha.outros_pessoas === 0 || ficha.outros_pessoas === '0' ? '' : ficha.outros_pessoas}
                              onChange={(e) => handleEditFichaChange(fIdx, 'outros_pessoas', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs font-mono font-bold text-center py-1 bg-white border border-[#bfdbfe] text-[#1a53db] rounded outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumo da Ficha: Total Sim e Total Não */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-200 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Total Pessoas Mobilizadas (Sim):</span>
                        <span className="font-black text-[#1a53db] text-sm bg-white px-2 py-0.5 rounded border border-blue-300">
                          {ficha.total_sim} pessoas
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700">Total Não (Recusas):</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={ficha.total_nao === 0 || ficha.total_nao === '0' ? '' : ficha.total_nao}
                          onChange={(e) => handleEditFichaChange(fIdx, 'total_nao', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-20 text-xs font-mono font-bold text-center py-1 bg-white border border-slate-300 rounded outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner de Totais Consolidados em Tempo Real */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm">
                <div className="text-[11px] uppercase tracking-wider text-blue-300 font-extrabold mb-2">
                  Resumo Geral da Remessa Atualizado em Tempo Real
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[10px] text-blue-200 block">Total de Fichas</span>
                    <span className="text-lg font-bold">{resumoEdicao.fichasCount}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-300 block">Pessoas (Sim)</span>
                    <span className="text-lg font-bold text-emerald-400">{resumoEdicao.totalPessoas}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[10px] text-amber-200 block">Total Não</span>
                    <span className="text-lg font-bold text-amber-300">{resumoEdicao.totalNao}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-300 block">Locais Visitados</span>
                    <span className="text-lg font-bold">{resumoEdicao.totalLocais}</span>
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-lg bg-[#2667ff] hover:bg-[#1a53db] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingEdit ? 'A Guardar...' : 'Salvar Alterações e Corrigir Fichas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE DETALHES DA FICHA (COM BOTÃO PARA EDITAR) */}
      {/* ============================================================== */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-800 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Detalhes do Envio &bull; {selectedSub.data}
                </h3>
                <div className="text-xs text-slate-500">
                  Enviado em {new Date(selectedSub.dataEnvio).toLocaleString('pt-PT')}
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {(selectedSub.fichas || []).map((f, i) => (
                <div key={f.id || i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-800 text-sm border-b border-slate-200 pb-1.5">
                    <span>Ficha {f.numeroFicha || i + 1}: Bairro {f.bairro}</span>
                    <span className="text-[#1a53db]">Comuna: {f.comuna}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>Casa a Casa: <strong>{f.casa_pessoas} pess.</strong> ({f.casa_locais} loc.)</div>
                    <div>Igrejas: <strong>{f.igrejas_pessoas} pess.</strong> ({f.igrejas_locais} loc.)</div>
                    <div>Praças/Mercados: <strong>{f.pracas_pessoas} pess.</strong> ({f.pracas_locais} loc.)</div>
                    <div>Paragens: <strong>{f.paragem_pessoas} pess.</strong> ({f.paragem_locais} loc.)</div>
                    <div>Creches: <strong>{f.creches_pessoas} pess.</strong> ({f.creches_locais} loc.)</div>
                    <div>Escolas: <strong>{f.escolas_pessoas} pess.</strong> ({f.escolas_locais} loc.)</div>
                    <div>Pontos de Água: <strong>{f.agua_pessoas} pess.</strong> ({f.agua_locais} loc.)</div>
                    <div>Outros: <strong>{f.outros_pessoas} pess.</strong> ({f.outros_locais} loc.)</div>
                  </div>

                  <div className="flex justify-between items-center bg-[#eff4ff] border border-[#bfdbfe] p-2 rounded text-slate-900 font-bold mt-2">
                    <span>Total Sim: {f.total_sim} pessoas</span>
                    <span>Total Não: {f.total_nao}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 mt-4 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = selectedSub;
                  setSelectedSub(null);
                  handleStartEdit(target);
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1a53db] font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar esta Remessa</span>
              </button>

              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ============================================================== */}
      {subToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Eliminar Remessa de Fichas?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tem a certeza que deseja eliminar esta remessa de data <strong>{subToDelete.data}</strong> com{' '}
              <strong>{subToDelete.fichas ? subToDelete.fichas.length : 0} ficha(s)</strong>? Esta ação removerá os dados do sistema.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
