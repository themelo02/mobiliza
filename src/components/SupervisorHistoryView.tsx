import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Submissao } from '../types';
import { FileText, Eye, CheckCircle2, Clock, Calendar, MapPin, Plus, ArrowLeft } from 'lucide-react';

export const SupervisorHistoryView: React.FC = () => {
  const { userSession, submissoes, setActiveScreen } = useApp();
  const [selectedSub, setSelectedSub] = useState<Submissao | null>(null);

  const supervisorId = userSession?.supervisor?.id;
  const mySubmissions = submissoes.filter((s) => s.supervisorId === supervisorId);

  const totalPessoasMinhas = mySubmissions.reduce((acc, s) => acc + s.totalPessoas, 0);
  const totalFichasMinhas = mySubmissions.reduce((acc, s) => acc + s.fichas.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => setActiveScreen('formulario')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-800 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Formulário</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Minhas Fichas Enviadas
          </h1>
          <p className="text-xs text-slate-500">
            Histórico das coletas enviadas por {userSession?.nome} para a coordenação municipal
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('formulario')}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Preencher Nova Ficha</span>
        </button>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total de Envios</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{mySubmissions.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Registos gravados com sucesso</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Fichas / Bairros</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{totalFichasMinhas}</div>
          <div className="text-[11px] text-slate-400 mt-1">Bairros e áreas cobertas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Pessoas Mobilizadas</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalPessoasMinhas.toLocaleString('pt-PT')}</div>
          <div className="text-[11px] text-slate-400 mt-1">Alcançadas nas suas atividades</div>
        </div>
      </div>

      {/* Lista de Envios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Todas as Remessas Enviadas</h2>
          <span className="text-xs text-slate-500">{mySubmissions.length} remessa(s)</span>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-orange-500" />
            <p className="text-sm font-medium text-slate-600">Ainda não enviou nenhuma ficha.</p>
            <p className="text-xs mt-1">Clique em "Preencher Nova Ficha" para registar os dados de hoje.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mySubmissions.map((sub) => (
              <div key={sub.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="font-bold text-slate-900 text-sm">Data da Atividade: {sub.data}</span>
                    <span className={`badge ${sub.status === 'Validado' ? 'badge-success' : 'badge-warning'}`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <span><strong>Fichas:</strong> {sub.fichas.length}</span>
                    <span>&bull;</span>
                    <span><strong>Bairros:</strong> {sub.fichas.map((f) => f.bairro).join(', ')}</span>
                    <span>&bull;</span>
                    <span><strong>Pessoas (Sim):</strong> <strong className="text-orange-700">{sub.totalSim}</strong></span>
                    <span>&bull;</span>
                    <span><strong>Não:</strong> {sub.totalNao}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSub(sub)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50 text-xs font-semibold text-slate-700 hover:text-orange-700 transition flex items-center justify-center gap-1.5 self-start sm:self-center"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalhes</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Ficha para o Supervisor */}
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
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {selectedSub.fichas.map((f, i) => (
                <div key={f.id || i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-800 text-sm border-b border-slate-200 pb-1.5">
                    <span>Ficha {f.numeroFicha || i + 1}: Bairro {f.bairro}</span>
                    <span className="text-orange-700">Comuna: {f.comuna}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>Casa a Casa: <strong>{f.casa_pessoas} pess.</strong></div>
                    <div>Igrejas: <strong>{f.igrejas_pessoas} pess.</strong></div>
                    <div>Praças/Mercados: <strong>{f.pracas_pessoas} pess.</strong></div>
                    <div>Paragens: <strong>{f.paragem_pessoas} pess.</strong></div>
                    <div>Creches: <strong>{f.creches_pessoas} pess.</strong></div>
                    <div>Escolas: <strong>{f.escolas_pessoas} pess.</strong></div>
                    <div>Pontos de Água: <strong>{f.agua_pessoas} pess.</strong></div>
                    <div>Outros: <strong>{f.outros_pessoas} pess.</strong></div>
                  </div>

                  <div className="flex justify-between items-center bg-orange-100/70 p-2 rounded text-slate-900 font-bold mt-2">
                    <span>Total Sim: {f.total_sim}</span>
                    <span>Total Não: {f.total_nao}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 mt-4 text-right">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
