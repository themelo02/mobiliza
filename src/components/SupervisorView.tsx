import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FichaAtividade } from '../types';
import { CheckCircle2, Plus, Minus, Send, AlertTriangle, ArrowRight, Printer, Sparkles, Building2, MapPin } from 'lucide-react';

interface FichaFormState {
  id: string;
  numeroFicha?: number;
  diaCampanha?: number;
  comuna: string;
  bairro: string;
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
}

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SupervisorView: React.FC = () => {
  const { userSession, supervisores, addSubmissao, setActiveScreen } = useApp();

  const isSupervisorSession = userSession?.tipo === 'supervisor';
  const supervisorData = userSession?.supervisor || supervisores[0];

  // If Admin is filling, allow selecting which supervisor or register as Admin
  const [selectedAdminSupId, setSelectedAdminSupId] = useState<string>(
    supervisorData?.id || supervisores[0]?.id || ''
  );

  const activeSupervisor = isSupervisorSession
    ? supervisorData
    : supervisores.find((s) => s.id === selectedAdminSupId) || supervisores[0];

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
    casa_locais: 0,
    casa_pessoas: 0,
    igrejas_locais: 0,
    igrejas_pessoas: 0,
    pracas_locais: 0,
    pracas_pessoas: 0,
    paragem_locais: 0,
    paragem_pessoas: 0,
    creches_locais: 0,
    creches_pessoas: 0,
    escolas_locais: 0,
    escolas_pessoas: 0,
    agua_locais: 0,
    agua_pessoas: 0,
    outros_locais: 0,
    outros_pessoas: 0,
    total_sim: 0,
    total_nao: 0,
  });

  const [fichas, setFichas] = useState<FichaFormState[]>([createBlankFicha(1)]);
  const [submittedModalData, setSubmittedModalData] = useState<{
    id: string;
    totalPessoas: number;
    totalLocais: number;
    totalFichas: number;
    bairros: string[];
  } | null>(null);

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
        const numVal = Math.max(0, parseInt(String(value), 10) || 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any)[field] = numVal;
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
      ...f,
      id: `f-${Date.now()}-${idx + 1}`,
      numeroFicha: idx + 1,
      diaCampanha: diaCampanha,
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

    setSubmittedModalData({
      id: newSubmissao.id,
      totalPessoas,
      totalLocais,
      totalFichas: finalFichas.length,
      bairros: finalFichas.map((f) => f.bairro),
    });

    // Reset form to 1 blank ficha with current supervisor comuna
    setFichas([createBlankFicha(1)]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="supervisor-view" className="py-6 px-4 md:px-6 relative min-h-screen">
      {/* Contador Flutuante de Fichas */}
      <div id="ficha-counter" title="Número total de fichas nesta submissão">
        <span>📋</span> Fichas: <span id="counter-value">{fichas.length}</span>
      </div>

      {/* Barra Superior */}
      <div className="top-bar">
        <div className="logo">
          MS<span>-sumbe</span>
        </div>
        <div className="user-profile-badge" title="Supervisor com sessão iniciada">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Supervisor: {activeSupervisor ? activeSupervisor.nome : 'Não identificado'}
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
                {fichas.map((ficha, index) => (
                  <div key={ficha.id} className="activity-block">
                    <div className="ficha-header">
                      Ficha <span className="ficha-number">{index + 1}</span>
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

                      {/* Bairro / Aldeia */}
                      <div className="form-group full-width">
                        <label>
                          <span className="required">*</span> Bairro/Aldeia
                        </label>
                        <input
                          type="text"
                          name="bairro[]"
                          value={ficha.bairro}
                          onChange={(e) => handleInputChange(index, 'bairro', e.target.value)}
                          placeholder="Digite o bairro ou aldeia visitada"
                          required
                        />
                        {activeSupervisor?.coordenacao && (
                          <div className="mt-1 text-xs text-slate-500">
                            <span>Coordenação: </span>
                            <span className="text-[#1a53db] font-medium">
                              {activeSupervisor.coordenacao}
                            </span>
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
                          name="casa_locais[]"
                          min="0"
                          value={ficha.casa_locais}
                          onChange={(e) => handleInputChange(index, 'casa_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Casa a casa - pessoas
                        </label>
                        <input
                          type="number"
                          name="casa_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.casa_pessoas}
                          onChange={(e) => handleInputChange(index, 'casa_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 2. Igrejas */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Igrejas - locais
                        </label>
                        <input
                          type="number"
                          name="igrejas_locais[]"
                          min="0"
                          value={ficha.igrejas_locais}
                          onChange={(e) => handleInputChange(index, 'igrejas_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Igrejas - pessoas
                        </label>
                        <input
                          type="number"
                          name="igrejas_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.igrejas_pessoas}
                          onChange={(e) => handleInputChange(index, 'igrejas_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 3. Praças/Mercados */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Praças/Mercados - locais
                        </label>
                        <input
                          type="number"
                          name="pracas_locais[]"
                          min="0"
                          value={ficha.pracas_locais}
                          onChange={(e) => handleInputChange(index, 'pracas_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Praças/Mercados - pessoas
                        </label>
                        <input
                          type="number"
                          name="pracas_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.pracas_pessoas}
                          onChange={(e) => handleInputChange(index, 'pracas_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 4. Paragem de taxi */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Paragem de taxi - locais
                        </label>
                        <input
                          type="number"
                          name="paragem_locais[]"
                          min="0"
                          value={ficha.paragem_locais}
                          onChange={(e) => handleInputChange(index, 'paragem_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Paragem de taxi - pessoas
                        </label>
                        <input
                          type="number"
                          name="paragem_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.paragem_pessoas}
                          onChange={(e) => handleInputChange(index, 'paragem_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 5. Creches */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Creches - locais
                        </label>
                        <input
                          type="number"
                          name="creches_locais[]"
                          min="0"
                          value={ficha.creches_locais}
                          onChange={(e) => handleInputChange(index, 'creches_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Creches - pessoas
                        </label>
                        <input
                          type="number"
                          name="creches_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.creches_pessoas}
                          onChange={(e) => handleInputChange(index, 'creches_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 6. Escolas */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Escolas - locais
                        </label>
                        <input
                          type="number"
                          name="escolas_locais[]"
                          min="0"
                          value={ficha.escolas_locais}
                          onChange={(e) => handleInputChange(index, 'escolas_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Escolas - pessoas
                        </label>
                        <input
                          type="number"
                          name="escolas_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.escolas_pessoas}
                          onChange={(e) => handleInputChange(index, 'escolas_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 7. Ponto de água */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Ponto de água - locais
                        </label>
                        <input
                          type="number"
                          name="agua_locais[]"
                          min="0"
                          value={ficha.agua_locais}
                          onChange={(e) => handleInputChange(index, 'agua_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Ponto de água - pessoas
                        </label>
                        <input
                          type="number"
                          name="agua_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.agua_pessoas}
                          onChange={(e) => handleInputChange(index, 'agua_pessoas', e.target.value)}
                        />
                      </div>

                      {/* 8. Outros */}
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Outros - locais
                        </label>
                        <input
                          type="number"
                          name="outros_locais[]"
                          min="0"
                          value={ficha.outros_locais}
                          onChange={(e) => handleInputChange(index, 'outros_locais', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          <span className="required">*</span> Outros - pessoas
                        </label>
                        <input
                          type="number"
                          name="outros_pessoas[]"
                          className="pessoas-input"
                          min="0"
                          value={ficha.outros_pessoas}
                          onChange={(e) => handleInputChange(index, 'outros_pessoas', e.target.value)}
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
                          name="total_nao[]"
                          min="0"
                          value={ficha.total_nao}
                          onChange={(e) => handleInputChange(index, 'total_nao', e.target.value)}
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

          {/* Ações do Formulário */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" title="Enviar para a base do Administrador">
              <Send className="w-4 h-4" />
              <span>➡️ Enviar Dados para o Administrador</span>
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
              Dados Enviados com Sucesso!
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              O Administrador Provincial e a Coordenação Municipal do Sumbe já receberam o seu relatório.
            </p>

            <div className="bg-[#eff4ff] border border-[#bfdbfe] rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Supervisor Atribuído:</span>
                <span className="font-semibold text-slate-900">{activeSupervisor?.nome}</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Total de Fichas:</span>
                <span className="font-semibold text-[#1a53db]">{submittedModalData.totalFichas} ficha(s)</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Total Pessoas Alcançadas:</span>
                <span className="font-bold text-[#1b4fd8] text-base">{submittedModalData.totalPessoas.toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex justify-between border-b border-[#bfdbfe]/60 pb-1.5">
                <span className="text-slate-600">Locais Visitados:</span>
                <span className="font-semibold text-slate-900">{submittedModalData.totalLocais}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Bairros:</span>
                <span className="font-semibold text-slate-900 text-right text-xs max-w-[200px] truncate">
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
