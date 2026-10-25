import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Submissao, Supervisor, Coordenacao, FichaAtividade } from '../types';
import { formatarDataPt } from './excelExport';

export interface RelatorioExecutivoCategorias {
  casa: { locais: number; pessoas: number };
  igrejas: { locais: number; pessoas: number };
  pracas: { locais: number; pessoas: number };
  paragem: { locais: number; pessoas: number };
  creches: { locais: number; pessoas: number };
  escolas: { locais: number; pessoas: number };
  agua: { locais: number; pessoas: number };
  outros: { locais: number; pessoas: number };
}

export interface PDFExportOptions {
  submissoes: Submissao[];
  supervisores: Supervisor[];
  coordenacoes?: Coordenacao[];
  filtroSupervisorNome?: string;
  filtroCoordenacaoNome?: string;
  filtroDataStr?: string;
  totaisCategorias?: RelatorioExecutivoCategorias;
}

/**
 * Calcula os totais das 8 categorias a partir de uma lista de submissões
 */
export function calcularTotaisCategorias(submissoes: Submissao[]): RelatorioExecutivoCategorias {
  const totais: RelatorioExecutivoCategorias = {
    casa: { locais: 0, pessoas: 0 },
    igrejas: { locais: 0, pessoas: 0 },
    pracas: { locais: 0, pessoas: 0 },
    paragem: { locais: 0, pessoas: 0 },
    creches: { locais: 0, pessoas: 0 },
    escolas: { locais: 0, pessoas: 0 },
    agua: { locais: 0, pessoas: 0 },
    outros: { locais: 0, pessoas: 0 },
  };

  submissoes.forEach((sub) => {
    (sub.fichas || []).forEach((f: FichaAtividade) => {
      totais.casa.locais += Number(f.casa_locais) || 0;
      totais.casa.pessoas += Number(f.casa_pessoas) || 0;

      totais.igrejas.locais += Number(f.igrejas_locais) || 0;
      totais.igrejas.pessoas += Number(f.igrejas_pessoas) || 0;

      totais.pracas.locais += Number(f.pracas_locais) || 0;
      totais.pracas.pessoas += Number(f.pracas_pessoas) || 0;

      totais.paragem.locais += Number(f.paragem_locais) || 0;
      totais.paragem.pessoas += Number(f.paragem_pessoas) || 0;

      totais.creches.locais += Number(f.creches_locais) || 0;
      totais.creches.pessoas += Number(f.creches_pessoas) || 0;

      totais.escolas.locais += Number(f.escolas_locais) || 0;
      totais.escolas.pessoas += Number(f.escolas_pessoas) || 0;

      totais.agua.locais += Number(f.agua_locais) || 0;
      totais.agua.pessoas += Number(f.agua_pessoas) || 0;

      totais.outros.locais += Number(f.outros_locais) || 0;
      totais.outros.pessoas += Number(f.outros_pessoas) || 0;
    });
  });

  return totais;
}

/**
 * Gera e descarrega um relatório oficial em PDF com layout Azul Torrado,
 * destacando especificamente as 8 categorias de mobilização (Locais e Pessoas),
 * filtros por Supervisor, Coordenação e Data.
 */
export function exportarRelatorioParaPDF({
  submissoes,
  supervisores,
  coordenacoes = [],
  filtroSupervisorNome = 'Todos os Supervisores',
  filtroCoordenacaoNome = 'Todas as Coordenações',
  filtroDataStr = 'Todas as Datas',
  totaisCategorias,
}: PDFExportOptions) {
  // Inicializar documento PDF (A4 formato paisagem para acomodar detalhe com elegância)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const totais = totaisCategorias || calcularTotaisCategorias(submissoes);

  // Totais agregados
  let totalFichas = 0;
  let totalSim = 0;
  let totalNao = 0;

  submissoes.forEach((s) => {
    totalFichas += s.fichas?.length || 0;
    (s.fichas || []).forEach((f) => {
      totalSim += Number(f.total_sim) || 0;
      totalNao += Number(f.total_nao) || 0;
    });
  });

  const totalLocais =
    totais.casa.locais +
    totais.igrejas.locais +
    totais.pracas.locais +
    totais.paragem.locais +
    totais.creches.locais +
    totais.escolas.locais +
    totais.agua.locais +
    totais.outros.locais;

  const totalPessoas =
    totais.casa.pessoas +
    totais.igrejas.pessoas +
    totais.pracas.pessoas +
    totais.paragem.pessoas +
    totais.creches.pessoas +
    totais.escolas.pessoas +
    totais.agua.pessoas +
    totais.outros.pessoas;

  const totalPessoasAbordadas = totalSim + totalNao > 0 ? totalSim + totalNao : totalPessoas;
  const taxaAdesao = totalPessoasAbordadas > 0 ? ((totalSim / totalPessoasAbordadas) * 100).toFixed(1) : '100.0';

  // Cores do tema Azul Torrado
  const azulTorradoEscuro = [15, 23, 42]; // #0f172a
  const azulTorradoPrincipal = [30, 58, 138]; // #1e3a8a
  const azulTorradoMedio = [37, 99, 235]; // #2563eb
  const douradoAccent = [217, 119, 6]; // #d97706
  const cinzaClaro = [241, 245, 249]; // #f1f5f9
  const textoEscuro = [30, 41, 59]; // #1e293b

  // 1. CABEÇALHO GOVERNAMENTAL EM AZUL TORRADO
  doc.setFillColor(azulTorradoEscuro[0], azulTorradoEscuro[1], azulTorradoEscuro[2]);
  doc.rect(0, 0, 297, 28, 'F');

  // Faixa de destaque dourada inferior
  doc.setFillColor(douradoAccent[0], douradoAccent[1], douradoAccent[2]);
  doc.rect(0, 28, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REPÚBLICA DE ANGOLA • GOVERNO DA PROVÍNCIA DO CUANZA SUL', 148.5, 8, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO EXECUTIVO DE MOBILIZAÇÃO SOCIAL • MUNICÍPIO DO SUMBE', 148.5, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  const dataGeracao = new Date().toLocaleString('pt-PT');
  doc.text(`CAMPANHA DE VACINAÇÃO CONTRA A POLIOMIELITE | Emitido em: ${dataGeracao}`, 148.5, 22, { align: 'center' });

  // 2. PAINEL DE FILTROS APLICADOS (AZUL TORRADO SUAVE)
  doc.setFillColor(cinzaClaro[0], cinzaClaro[1], cinzaClaro[2]);
  doc.roundedRect(12, 33, 273, 13, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 33, 273, 13, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(azulTorradoPrincipal[0], azulTorradoPrincipal[1], azulTorradoPrincipal[2]);
  doc.text('FILTROS ATIVOS:', 16, 40);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2]);
  doc.text(`Supervisor: `, 43, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`${filtroSupervisorNome}`, 58, 40);

  doc.setFont('helvetica', 'normal');
  doc.text(`Coordenação: `, 125, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`${filtroCoordenacaoNome}`, 145, 40);

  doc.setFont('helvetica', 'normal');
  doc.text(`Data: `, 215, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`${filtroDataStr}`, 223, 40);

  // 3. CARTÕES DE INDICADORES (KPIs)
  const kpis = [
    { label: 'TOTAL SUBMISSÕES', valor: `${submissoes.length} Envios`, cor: [30, 58, 138] },
    { label: 'TOTAL FICHAS', valor: `${totalFichas} Fichas`, cor: [79, 70, 229] },
    { label: 'LOCAIS VISITADOS', valor: `${totalLocais.toLocaleString('pt-PT')} Locais`, cor: [5, 150, 105] },
    { label: 'PESSOAS MOBILIZADAS', valor: `${totais.casa.pessoas + totais.igrejas.pessoas + totais.pracas.pessoas + totais.paragem.pessoas + totais.creches.pessoas + totais.escolas.pessoas + totais.agua.pessoas + totais.outros.pessoas} Pessoas`, cor: [37, 99, 235] },
    { label: 'SIM (ACEITAÇÃO)', valor: `${totalSim.toLocaleString('pt-PT')} (${taxaAdesao}%)`, cor: [16, 185, 129] },
    { label: 'NÃO (RECUSAS)', valor: `${totalNao.toLocaleString('pt-PT')}`, cor: [225, 29, 72] },
  ];

  const kpiWidth = 43.5;
  const kpiHeight = 14;
  kpis.forEach((kpi, idx) => {
    const x = 12 + idx * (kpiWidth + 2.4);
    const y = 49;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, kpiWidth, kpiHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, kpiWidth, kpiHeight, 1.5, 1.5, 'S');

    // Barra superior colorida
    doc.setFillColor(kpi.cor[0], kpi.cor[1], kpi.cor[2]);
    doc.roundedRect(x, y, kpiWidth, 2.5, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + kpiWidth / 2, y + 6.5, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(textoEscuro[0], textoEscuro[1], textoEscuro[2]);
    doc.text(kpi.valor, x + kpiWidth / 2, y + 11.5, { align: 'center' });
  });

  // 4. TABELA 1: AS 8 CATEGORIAS ESPECÍFICAS (LOCAIS E PESSOAS)
  const perc = (v: number) => (totalPessoas > 0 ? ((v / totalPessoas) * 100).toFixed(1) + '%' : '0.0%');

  const dados8Categorias = [
    ['1. Casa a casa', 'Visitas residenciais nas comunidades', `${totais.casa.locais.toLocaleString('pt-PT')} locais`, `${totais.casa.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.casa.pessoas)],
    ['2. Igrejas', 'Templos, paróquias e cultos religiosos', `${totais.igrejas.locais.toLocaleString('pt-PT')} locais`, `${totais.igrejas.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.igrejas.pessoas)],
    ['3. Praças / Mercados', 'Mercados municipais e praças públicas', `${totais.pracas.locais.toLocaleString('pt-PT')} locais`, `${totais.pracas.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.pracas.pessoas)],
    ['4. Paragem de táxi', 'Terminais de táxis e mototáxis', `${totais.paragem.locais.toLocaleString('pt-PT')} locais`, `${totais.paragem.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.paragem.pessoas)],
    ['5. Creches', 'Centros infantis e berçários', `${totais.creches.locais.toLocaleString('pt-PT')} locais`, `${totais.creches.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.creches.pessoas)],
    ['6. Escolas', 'Colégios e complexos escolares', `${totais.escolas.locais.toLocaleString('pt-PT')} locais`, `${totais.escolas.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.escolas.pessoas)],
    ['7. Ponto de água', 'Chafarizes, fontanários e cacimbas', `${totais.agua.locais.toLocaleString('pt-PT')} locais`, `${totais.agua.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.agua.pessoas)],
    ['8. Outros', 'Outros locais públicos e comunitários', `${totais.outros.locais.toLocaleString('pt-PT')} locais`, `${totais.outros.pessoas.toLocaleString('pt-PT')} pessoas`, perc(totais.outros.pessoas)],
  ];

  autoTable(doc, {
    startY: 66,
    head: [
      [
        { content: 'PONTO DE MOBILIZAÇÃO (CATEGORIA)', styles: { halign: 'left', fillColor: [15, 23, 42] } },
        { content: 'DESCRIÇÃO DO LOCAL', styles: { halign: 'left', fillColor: [15, 23, 42] } },
        { content: 'LOCAIS VISITADOS', styles: { halign: 'center', fillColor: [30, 58, 138] } },
        { content: 'PESSOAS MOBILIZADAS', styles: { halign: 'center', fillColor: [37, 99, 235] } },
        { content: '% DO TOTAL DE PESSOAS', styles: { halign: 'center', fillColor: [15, 23, 42] } },
      ],
    ],
    body: dados8Categorias,
    foot: [
      [
        { content: 'TOTAL CONSOLIDADO', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `${totalLocais.toLocaleString('pt-PT')} locais`, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [30, 58, 138] } },
        { content: `${totalPessoas.toLocaleString('pt-PT')} pessoas`, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [37, 99, 235] } },
        { content: '100.0%', styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
    },
    headStyles: {
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 93 },
      2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 45, halign: 'center' },
    },
    margin: { left: 12, right: 12 },
  });

  // 5. SEGUNDA TABELA: DETALHE DAS FICHAS FILTRADAS
  const finalYTab1 = (doc as any).lastAutoTable?.finalY || 120;

  // Se houver pouco espaço na página para o cabeçalho e pelo menos 3 linhas da tabela 2, adicionar página
  if (finalYTab1 > 140) {
    doc.addPage();
  }

  const startYTab2 = finalYTab1 > 140 ? 15 : finalYTab1 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(azulTorradoPrincipal[0], azulTorradoPrincipal[1], azulTorradoPrincipal[2]);
  doc.text(`DETALHAMENTO DAS FICHAS LANÇADAS (${submissoes.length} submissões)`, 12, startYTab2);

  // Montar linhas de fichas
  const rowsFichas: any[] = [];
  submissoes.forEach((s) => {
    (s.fichas || []).forEach((f, idx) => {
      const locaisFicha =
        (f.casa_locais || 0) +
        (f.igrejas_locais || 0) +
        (f.pracas_locais || 0) +
        (f.paragem_locais || 0) +
        (f.creches_locais || 0) +
        (f.escolas_locais || 0) +
        (f.agua_locais || 0) +
        (f.outros_locais || 0);

      const pessoasFicha =
        (f.casa_pessoas || 0) +
        (f.igrejas_pessoas || 0) +
        (f.pracas_pessoas || 0) +
        (f.paragem_pessoas || 0) +
        (f.creches_pessoas || 0) +
        (f.escolas_pessoas || 0) +
        (f.agua_pessoas || 0) +
        (f.outros_pessoas || 0);

      const sim = Number(f.total_sim) || 0;
      const nao = Number(f.total_nao) || 0;

      rowsFichas.push([
        formatarDataPt(s.dataEnvio || s.data),
        s.supervisorNome,
        f.bairro || 'Sem Bairro',
        `${f.casa_locais || 0} / ${f.casa_pessoas || 0}`,
        `${f.igrejas_locais || 0} / ${f.igrejas_pessoas || 0}`,
        `${f.pracas_locais || 0} / ${f.pracas_pessoas || 0}`,
        `${f.paragem_locais || 0} / ${f.paragem_pessoas || 0}`,
        `${f.creches_locais || 0} / ${f.creches_pessoas || 0}`,
        `${f.escolas_locais || 0} / ${f.escolas_pessoas || 0}`,
        `${f.agua_locais || 0} / ${f.agua_pessoas || 0}`,
        `${f.outros_locais || 0} / ${f.outros_pessoas || 0}`,
        locaisFicha,
        pessoasFicha,
        sim,
        nao,
      ]);
    });
  });

  autoTable(doc, {
    startY: startYTab2 + 3,
    head: [
      [
        { content: 'Data', styles: { halign: 'center' } },
        { content: 'Supervisor' },
        { content: 'Bairro' },
        { content: 'Casas (L/P)', styles: { halign: 'center' } },
        { content: 'Igrejas (L/P)', styles: { halign: 'center' } },
        { content: 'Praças (L/P)', styles: { halign: 'center' } },
        { content: 'Paragem (L/P)', styles: { halign: 'center' } },
        { content: 'Creches (L/P)', styles: { halign: 'center' } },
        { content: 'Escolas (L/P)', styles: { halign: 'center' } },
        { content: 'Água (L/P)', styles: { halign: 'center' } },
        { content: 'Outros (L/P)', styles: { halign: 'center' } },
        { content: 'Total L.', styles: { halign: 'center' } },
        { content: 'Total P.', styles: { halign: 'center' } },
        { content: 'Sim', styles: { halign: 'center' } },
        { content: 'Não', styles: { halign: 'center' } },
      ],
    ],
    body: rowsFichas.length > 0 ? rowsFichas : [['-', 'Nenhuma ficha registada para os filtros selecionados.', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 32 },
      2: { cellWidth: 26 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' },
      11: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      12: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      13: { cellWidth: 13, halign: 'center', textColor: [5, 150, 105] },
      14: { cellWidth: 13, halign: 'center', textColor: [225, 29, 72] },
    },
    margin: { left: 12, right: 12 },
  });

  // Adicionar rodapé e paginação em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Linha divisória
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 200, 285, 200);

    doc.text('Governo da Província do Cuanza Sul • Administração Municipal do Sumbe • Sistema de Fichas de Mobilização', 12, 204);
    doc.text(`Página ${i} de ${totalPages}`, 285, 204, { align: 'right' });
  }

  // Descarregar ficheiro
  const dataHojeStr = new Date().toISOString().slice(0, 10);
  const nomeFiltroSup = filtroSupervisorNome && filtroSupervisorNome !== 'Todos os Supervisores' ? `_${filtroSupervisorNome.replace(/\s+/g, '_')}` : '';
  const nomeArquivo = `Relatorio_Mobilizacao_Sumbe_${dataHojeStr}${nomeFiltroSup}.pdf`;
  doc.save(nomeArquivo);
}
