export interface Coordenacao {
  id: string;
  nome: string;
  descricao?: string;
  bairros?: string[];
  municipio: string;
  comuna: string;
  supervisorIds: string[]; // 1 a 2 supervisores por coordenação
  limiteSupervisores: number; // fixo em 2
  metaFichasTotal?: number;
  dataCriacao: string;
}

export interface Supervisor {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  provincia: string;
  municipio: string;
  comuna: string;
  coordenacao: string; // Nome da Coordenação de atuação
  coordenacaoId?: string; // ID da Coordenação vinculada
  totalFichasPrevistas?: number; // Total de fichas atribuídas durante a campanha
  diasTrabalhoPrevistos?: number; // Quantidade de dias de trabalho previstos (ex: 5, 6, 7...)
  ativo: boolean;
  dataCriacao: string;
  senha?: string;
}

export interface UtilizadorLeitura {
  id: string;
  codigo: string;
  nome: string;
  cargo?: string;
  ativo: boolean;
  dataCriacao: string;
}

export interface UserSession {
  tipo: 'admin' | 'supervisor' | 'leitor';
  nome: string;
  codigo: string;
  supervisor?: Supervisor;
  leitor?: UtilizadorLeitura;
}

export interface FichaAtividade {
  id: string;
  numeroFicha: number;
  comuna: string;
  bairro: string;
  diaCampanha?: number; // Dia 1, Dia 2, Dia 3... de trabalho
  
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

export interface Submissao {
  id: string;
  supervisorId: string;
  supervisorNome: string;
  provincia: string;
  municipio: string;
  data: string; // YYYY-MM-DD
  diaCampanha?: number; // Dia de trabalho (ex: 1, 2, 3...)
  dataEnvio: string; // ISO string
  fichas: FichaAtividade[];
  totalPessoas: number;
  totalLocais: number;
  totalSim: number;
  totalNao: number;
  status: 'Validado' | 'Pendente' | 'Em Revisão';
  observacoes?: string;
}

export const COMUNAS_SUMBE = [
  'Sede'
];
