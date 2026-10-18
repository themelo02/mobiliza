export interface Supervisor {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  provincia: string;
  municipio: string;
  comuna: string;
  coordenacao: string; // Coordenação de atuação
  ativo: boolean;
  dataCriacao: string;
  senha?: string;
}

export interface UserSession {
  tipo: 'admin' | 'supervisor';
  nome: string;
  codigo: string;
  supervisor?: Supervisor;
}

export interface FichaAtividade {
  id: string;
  numeroFicha: number;
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

export interface Submissao {
  id: string;
  supervisorId: string;
  supervisorNome: string;
  provincia: string;
  municipio: string;
  data: string; // YYYY-MM-DD
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
