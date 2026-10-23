import * as XLSX from 'xlsx';
import { Submissao, Supervisor, Coordenacao, FichaAtividade } from '../types';

export interface ExcelExportOptions {
  submissoes: Submissao[];
  supervisores: Supervisor[];
  coordenacoes?: Coordenacao[];
  filtroTitulo?: string;
  supervisorFiltroId?: string;
  dataLancamentoFiltro?: string;
}

/**
 * Formata data ISO para DD/MM/AAAA
 */
export function formatarDataPt(isoOuString?: string): string {
  if (!isoOuString) return '-';
  try {
    const d = new Date(isoOuString);
    if (isNaN(d.getTime())) {
      // Se já vier no formato YYYY-MM-DD
      const partes = isoOuString.split('-');
      if (partes.length === 3) {
        return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
      }
      return isoOuString;
    }
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return isoOuString || '-';
  }
}

/**
 * Formata hora para HH:mm:ss
 */
export function formatarHoraPt(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '-';
  }
}

/**
 * Exporta todos os dados das fichas coletadas para um ficheiro Excel (.xlsx) profissional
 */
export function exportarFichasParaExcel({
  submissoes,
  supervisores,
  coordenacoes = [],
  filtroTitulo,
  supervisorFiltroId,
  dataLancamentoFiltro,
}: ExcelExportOptions) {
  // 1. Filtragem das submissões se especificado
  let submissoesFiltradas = [...submissoes];

  if (supervisorFiltroId && supervisorFiltroId !== 'todos') {
    submissoesFiltradas = submissoesFiltradas.filter((s) => s.supervisorId === supervisorFiltroId);
  }

  if (dataLancamentoFiltro && dataLancamentoFiltro !== 'todas') {
    submissoesFiltradas = submissoesFiltradas.filter((s) => {
      const dataEnvioKey = (s.dataEnvio || '').slice(0, 10);
      return dataEnvioKey === dataLancamentoFiltro || s.data === dataLancamentoFiltro;
    });
  }

  // Mapa rápido de supervisores por ID
  const mapSupervisores = new Map<string, Supervisor>();
  supervisores.forEach((s) => mapSupervisores.set(s.id, s));

  // Mapa de coordenações
  const mapCoordenacoes = new Map<string, Coordenacao>();
  coordenacoes.forEach((c) => mapCoordenacoes.set(c.id, c));

  // ==========================================
  // ABA 1: FICHAS DETALHADAS (Linha por Linha)
  // ==========================================
  const rowsFichasDetalhadas: any[] = [];
  let contadorFichaGlobal = 1;

  submissoesFiltradas.forEach((sub) => {
    const sup = mapSupervisores.get(sub.supervisorId);
    const dataLancamentoFormatada = formatarDataPt(sub.dataEnvio);
    const horaLancamento = formatarHoraPt(sub.dataEnvio);
    const dataAtividadeFormatada = formatarDataPt(sub.data);

    (sub.fichas || []).forEach((f: FichaAtividade) => {
      const totalLocaisFicha =
        (f.casa_locais || 0) +
        (f.igrejas_locais || 0) +
        (f.pracas_locais || 0) +
        (f.paragem_locais || 0) +
        (f.creches_locais || 0) +
        (f.escolas_locais || 0) +
        (f.agua_locais || 0) +
        (f.outros_locais || 0);

      const totalSim = Number(f.total_sim) || 0;
      const totalNao = Number(f.total_nao) || 0;
      const totalPessoasAbordadas = totalSim + totalNao;
      const taxaAdesao = totalPessoasAbordadas > 0 ? ((totalSim / totalPessoasAbordadas) * 100).toFixed(1) + '%' : '100%';

      rowsFichasDetalhadas.push({
        'Nº Ordem': contadorFichaGlobal++,
        'Nº Ficha no Envio': f.numeroFicha || 1,
        'Data Lançamento (Sistema)': dataLancamentoFormatada,
        'Hora Lançamento': horaLancamento,
        'Data da Atividade (Terreno)': dataAtividadeFormatada,
        'Dia de Campanha': f.diaCampanha || sub.diaCampanha || 1,
        'Supervisor': sub.supervisorNome || (sup ? sup.nome : 'Não especificado'),
        'Código Supervisor': sup ? sup.codigo : '-',
        'Telefone Supervisor': sup ? sup.telefone : '-',
        'Coordenação': sup?.coordenacao || 'Coordenação Geral',
        'Comuna': f.comuna || sub.municipio || 'Sede',
        'Bairro': f.bairro || 'Sem Bairro',
        
        // 8 Categorias: Locais e Pessoas
        '1. Casas (Locais)': f.casa_locais || 0,
        '1. Casas (Pessoas)': f.casa_pessoas || 0,
        
        '2. Igrejas (Locais)': f.igrejas_locais || 0,
        '2. Igrejas (Pessoas)': f.igrejas_pessoas || 0,
        
        '3. Praças/Mercados (Locais)': f.pracas_locais || 0,
        '3. Praças/Mercados (Pessoas)': f.pracas_pessoas || 0,
        
        '4. Paragens (Locais)': f.paragem_locais || 0,
        '4. Paragens (Pessoas)': f.paragem_pessoas || 0,
        
        '5. Creches (Locais)': f.creches_locais || 0,
        '5. Creches (Pessoas)': f.creches_pessoas || 0,
        
        '6. Escolas (Locais)': f.escolas_locais || 0,
        '6. Escolas (Pessoas)': f.escolas_pessoas || 0,
        
        '7. Pontos de Água (Locais)': f.agua_locais || 0,
        '7. Pontos de Água (Pessoas)': f.agua_pessoas || 0,
        
        '8. Outros (Locais)': f.outros_locais || 0,
        '8. Outros (Pessoas)': f.outros_pessoas || 0,

        // Totais e Indicadores
        'Total Locais': totalLocaisFicha,
        'Mobilizados (Sim)': totalSim,
        'Recusas (Não)': totalNao,
        'Total Pessoas': totalPessoasAbordadas,
        'Taxa de Adesão': taxaAdesao,
        'Estado': sub.status || 'Validado',
        'ID Submissão': sub.id,
      });
    });
  });

  // ==========================================
  // ABA 2: RESUMO POR SUPERVISOR
  // ==========================================
  const rowsResumoSupervisor: any[] = [];
  
  supervisores.forEach((sup) => {
    const subsSup = submissoes.filter((s) => s.supervisorId === sup.id);
    const totalFichasLancadas = subsSup.reduce((acc, s) => acc + (s.fichas?.length || 0), 0);
    const diasTrabalho = Math.max(1, Number(sup.diasTrabalhoPrevistos) || 5);
    const fichasDiarias = Math.max(1, Number(sup.fichasDiariasPrevistas) || 5);
    const totalMetaRequerida = Number(sup.totalFichasPrevistas) || fichasDiarias * diasTrabalho;
    const fichasRestantes = Math.max(0, totalMetaRequerida - totalFichasLancadas);
    const percConclusao = totalMetaRequerida > 0 ? ((totalFichasLancadas / totalMetaRequerida) * 100).toFixed(1) + '%' : '0%';

    let totalLocais = 0;
    let totalSim = 0;
    let totalNao = 0;

    subsSup.forEach((s) => {
      (s.fichas || []).forEach((f) => {
        totalLocais +=
          (f.casa_locais || 0) +
          (f.igrejas_locais || 0) +
          (f.pracas_locais || 0) +
          (f.paragem_locais || 0) +
          (f.creches_locais || 0) +
          (f.escolas_locais || 0) +
          (f.agua_locais || 0) +
          (f.outros_locais || 0);
        totalSim += Number(f.total_sim) || 0;
        totalNao += Number(f.total_nao) || 0;
      });
    });

    const totalPessoas = totalSim + totalNao;
    const taxaAdesao = totalPessoas > 0 ? ((totalSim / totalPessoas) * 100).toFixed(1) + '%' : '100%';

    rowsResumoSupervisor.push({
      'Supervisor': sup.nome,
      'Código': sup.codigo,
      'Telefone': sup.telefone || '-',
      'Coordenação': sup.coordenacao || 'Coordenação Geral',
      'Comuna': sup.comuna || 'Sede',
      'Fichas Diárias Previstas': fichasDiarias,
      'Dias Previstos': diasTrabalho,
      'Meta de Fichas Total': totalMetaRequerida,
      'Fichas Lançadas': totalFichasLancadas,
      'Fichas em Falta': fichasRestantes,
      'Progresso da Meta': percConclusao,
      'Total Locais Cobertos': totalLocais,
      'Pessoas Mobilizadas (Sim)': totalSim,
      'Recusas (Não)': totalNao,
      'Total Pessoas': totalPessoas,
      'Taxa de Adesão': taxaAdesao,
      'Estado': sup.ativo ? 'Ativo' : 'Inativo',
    });
  });

  // ==========================================
  // ABA 3: RESUMO POR DATA DE LANÇAMENTO (SISTEMA)
  // ==========================================
  // Agrupar submissões pela data exata de envio/lançamento (YYYY-MM-DD do dataEnvio)
  const mapaDatasLancamento: {
    [dataEnvioKey: string]: {
      dataEnvioIso: string;
      submissoesCount: number;
      totalFichas: number;
      supervisoresSet: Set<string>;
      totalLocais: number;
      totalSim: number;
      totalNao: number;
    };
  } = {};

  submissoes.forEach((sub) => {
    const dataKey = (sub.dataEnvio || '').slice(0, 10) || sub.data || 'Sem Data';
    if (!mapaDatasLancamento[dataKey]) {
      mapaDatasLancamento[dataKey] = {
        dataEnvioIso: sub.dataEnvio || sub.data,
        submissoesCount: 0,
        totalFichas: 0,
        supervisoresSet: new Set(),
        totalLocais: 0,
        totalSim: 0,
        totalNao: 0,
      };
    }
    const item = mapaDatasLancamento[dataKey];
    item.submissoesCount += 1;
    item.totalFichas += (sub.fichas?.length || 0);
    item.supervisoresSet.add(sub.supervisorNome);

    (sub.fichas || []).forEach((f) => {
      item.totalLocais +=
        (f.casa_locais || 0) +
        (f.igrejas_locais || 0) +
        (f.pracas_locais || 0) +
        (f.paragem_locais || 0) +
        (f.creches_locais || 0) +
        (f.escolas_locais || 0) +
        (f.agua_locais || 0) +
        (f.outros_locais || 0);
      item.totalSim += Number(f.total_sim) || 0;
      item.totalNao += Number(f.total_nao) || 0;
    });
  });

  const rowsResumoDataLancamento = Object.entries(mapaDatasLancamento)
    .sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
    .map(([dataKey, val]) => {
      const totalPessoas = val.totalSim + val.totalNao;
      const taxaAdesao = totalPessoas > 0 ? ((val.totalSim / totalPessoas) * 100).toFixed(1) + '%' : '100%';
      return {
        'Data de Lançamento (Sistema)': formatarDataPt(dataKey),
        'Data ISO': dataKey,
        'Envios Realizados': val.submissoesCount,
        'Total Fichas Lançadas': val.totalFichas,
        'Nº Supervisores Ativos': val.supervisoresSet.size,
        'Supervisores': Array.from(val.supervisoresSet).join(', '),
        'Total Locais Visitados': val.totalLocais,
        'Pessoas Mobilizadas (Sim)': val.totalSim,
        'Recusas (Não)': val.totalNao,
        'Total Pessoas Abordadas': totalPessoas,
        'Taxa de Adesão': taxaAdesao,
      };
    });

  // ==========================================
  // ABA 4: RESUMO POR COORDENAÇÃO
  // ==========================================
  const rowsResumoCoordenacao: any[] = [];
  if (coordenacoes && coordenacoes.length > 0) {
    coordenacoes.forEach((c) => {
      const supsDaCoord = supervisores.filter(
        (s) => s.coordenacaoId === c.id || (s.coordenacao && s.coordenacao.toLowerCase() === c.nome.toLowerCase())
      );
      const supIds = new Set(supsDaCoord.map((s) => s.id));
      const subsCoord = submissoes.filter((sub) => supIds.has(sub.supervisorId));

      let totalFichasCoord = 0;
      let totalLocaisCoord = 0;
      let totalSimCoord = 0;
      let totalNaoCoord = 0;

      subsCoord.forEach((sub) => {
        totalFichasCoord += sub.fichas?.length || 0;
        (sub.fichas || []).forEach((f) => {
          totalLocaisCoord +=
            (f.casa_locais || 0) +
            (f.igrejas_locais || 0) +
            (f.pracas_locais || 0) +
            (f.paragem_locais || 0) +
            (f.creches_locais || 0) +
            (f.escolas_locais || 0) +
            (f.agua_locais || 0) +
            (f.outros_locais || 0);
          totalSimCoord += Number(f.total_sim) || 0;
          totalNaoCoord += Number(f.total_nao) || 0;
        });
      });

      const totalPessoasCoord = totalSimCoord + totalNaoCoord;
      const taxaAdesao = totalPessoasCoord > 0 ? ((totalSimCoord / totalPessoasCoord) * 100).toFixed(1) + '%' : '100%';

      rowsResumoCoordenacao.push({
        'Coordenação': c.nome,
        'Município': c.municipio || 'Sumbe',
        'Comuna': c.comuna || 'Sede',
        'Bairros Atribuídos': (c.bairros || []).join(', ') || 'Geral',
        'Nº Supervisores': supsDaCoord.length,
        'Supervisores': supsDaCoord.map((s) => s.nome).join(' & ') || 'Nenhum',
        'Meta de Fichas': c.metaFichasTotal || 50,
        'Fichas Lançadas': totalFichasCoord,
        'Total Locais': totalLocaisCoord,
        'Mobilizados (Sim)': totalSimCoord,
        'Recusas (Não)': totalNaoCoord,
        'Total Pessoas': totalPessoasCoord,
        'Taxa de Adesão': taxaAdesao,
      });
    });
  }

  // ==========================================
  // CONSTRUÇÃO DO WORKBOOK EXCEL
  // ==========================================
  const wb = XLSX.utils.book_new();

  // 1. Sheet Fichas Detalhadas
  const wsFichas = XLSX.utils.json_to_sheet(
    rowsFichasDetalhadas.length > 0
      ? rowsFichasDetalhadas
      : [
          {
            Mensagem: 'Nenhuma ficha registada no sistema até ao momento.',
          },
        ]
  );
  // Auto-ajustar larguras de coluna
  wsFichas['!cols'] = [
    { wch: 8 },  // Nº Ordem
    { wch: 10 }, // Nº Ficha
    { wch: 15 }, // Data Lançamento
    { wch: 12 }, // Hora Lançamento
    { wch: 15 }, // Data Atividade
    { wch: 10 }, // Dia Campanha
    { wch: 25 }, // Supervisor
    { wch: 14 }, // Código
    { wch: 15 }, // Telefone
    { wch: 20 }, // Coordenação
    { wch: 12 }, // Comuna
    { wch: 20 }, // Bairro
    { wch: 14 }, // Casas loc
    { wch: 14 }, // Casas pess
    { wch: 14 }, // Igrejas loc
    { wch: 14 }, // Igrejas pess
    { wch: 14 }, // Praças loc
    { wch: 14 }, // Praças pess
    { wch: 14 }, // Paragens loc
    { wch: 14 }, // Paragens pess
    { wch: 14 }, // Creches loc
    { wch: 14 }, // Creches pess
    { wch: 14 }, // Escolas loc
    { wch: 14 }, // Escolas pess
    { wch: 14 }, // Água loc
    { wch: 14 }, // Água pess
    { wch: 14 }, // Outros loc
    { wch: 14 }, // Outros pess
    { wch: 12 }, // Total Locais
    { wch: 14 }, // Sim
    { wch: 14 }, // Não
    { wch: 14 }, // Total Pessoas
    { wch: 14 }, // Taxa Adesao
    { wch: 12 }, // Estado
  ];
  XLSX.utils.book_append_sheet(wb, wsFichas, 'Fichas Detalhadas');

  // 2. Sheet Resumo por Supervisor
  if (rowsResumoSupervisor.length > 0) {
    const wsSupervisores = XLSX.utils.json_to_sheet(rowsResumoSupervisor);
    wsSupervisores['!cols'] = [
      { wch: 26 }, // Supervisor
      { wch: 12 }, // Código
      { wch: 15 }, // Telefone
      { wch: 22 }, // Coordenação
      { wch: 12 }, // Comuna
      { wch: 14 }, // Fichas/Dia
      { wch: 14 }, // Dias Prev
      { wch: 16 }, // Meta Fichas
      { wch: 16 }, // Fichas Lançadas
      { wch: 14 }, // Em Falta
      { wch: 14 }, // Progresso
      { wch: 14 }, // Locais
      { wch: 16 }, // Sim
      { wch: 14 }, // Não
      { wch: 14 }, // Total Pessoas
      { wch: 14 }, // Adesão
      { wch: 10 }, // Estado
    ];
    XLSX.utils.book_append_sheet(wb, wsSupervisores, 'Resumo por Supervisor');
  }

  // 3. Sheet Resumo por Data de Lançamento
  if (rowsResumoDataLancamento.length > 0) {
    const wsDatas = XLSX.utils.json_to_sheet(rowsResumoDataLancamento);
    wsDatas['!cols'] = [
      { wch: 18 }, // Data Lancamento
      { wch: 14 }, // Data ISO
      { wch: 16 }, // Envios
      { wch: 16 }, // Fichas Lançadas
      { wch: 18 }, // Nº Supervisores
      { wch: 40 }, // Supervisores
      { wch: 14 }, // Locais
      { wch: 16 }, // Sim
      { wch: 14 }, // Não
      { wch: 16 }, // Total Pessoas
      { wch: 14 }, // Adesão
    ];
    XLSX.utils.book_append_sheet(wb, wsDatas, 'Por Data de Lançamento');
  }

  // 4. Sheet Resumo por Coordenação (se houver)
  if (rowsResumoCoordenacao.length > 0) {
    const wsCoords = XLSX.utils.json_to_sheet(rowsResumoCoordenacao);
    wsCoords['!cols'] = [
      { wch: 22 }, // Coordenação
      { wch: 14 }, // Município
      { wch: 12 }, // Comuna
      { wch: 30 }, // Bairros
      { wch: 14 }, // Nº Sups
      { wch: 35 }, // Supervisores
      { wch: 14 }, // Meta
      { wch: 16 }, // Fichas Lançadas
      { wch: 14 }, // Locais
      { wch: 14 }, // Sim
      { wch: 14 }, // Não
      { wch: 14 }, // Total Pessoas
      { wch: 14 }, // Adesão
    ];
    XLSX.utils.book_append_sheet(wb, wsCoords, 'Por Coordenação');
  }

  // Gerar e Descarregar o ficheiro .xlsx
  const hojeStr = new Date().toISOString().slice(0, 10);
  const sufixoFiltro = filtroTitulo ? `_${filtroTitulo.replace(/\s+/g, '_').toLowerCase()}` : '';
  const nomeFicheiro = `relatorio_fichas_sumbe_${hojeStr}${sufixoFiltro}.xlsx`;

  XLSX.writeFile(wb, nomeFicheiro);
}
