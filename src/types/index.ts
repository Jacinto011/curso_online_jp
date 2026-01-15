export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: 'estudante' | 'formador' | 'admin';
  fotoPerfil?: string;
  dataCriacao: string;
  ativo: boolean;
  emailVerificado: boolean;
}

export interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  descricaoLonga: string;
  formadorId: string;
  formadorNome: string;
  categoria: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  preco: number;
  precoMZN?: number;
  precoUSD?: number;
  gratuito: boolean;
  imagemCapa: string;
  videoIntroducao?: string;
  duracaoTotal: number;
  aulas: Aula[];
  dataCriacao: string;
  dataPublicacao?: string;
  publicado: boolean;
  tags: string[];
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  estudantesMatriculados: number;
}

export interface Aula {
  id: string;
  cursoId: string;
  titulo: string;
  descricao: string;
  ordem: number;
  videoUrl: string;
  duracao: number;
  conteudo?: string;
  recursos?: string[];
  tipo: 'video' | 'texto' | 'documento';
}

export interface Matricula {
  id: string;
  estudanteId: string;
  cursoId: string;
  dataMatricula: string;
  dataConclusao?: string;
  progresso: number;
  aulasConcluidas: string[];
  avaliacao?: number;
  comentario?: string;
  certificadoGerado: boolean;
  dataCertificado?: string;
  status: 'ativa' | 'concluida' | 'cancelada';
}

export interface Pagamento {
  id: string;
  matriculaId: string;
  valor: number;
  moeda: 'MZN' | 'USD';
  comissaoPlataforma: number;
  valorFormador: number;
  status: 'pendente' | 'pago' | 'cancelado' | 'reembolsado';
  metodo: 'cartao' | 'pix' | 'boleto' | 'mpesa' | 'emola';
  dataPagamento?: string;
  transacaoId?: string;
}

export interface Certificado {
  id: string;
  matriculaId: string;
  estudanteId: string;
  cursoId: string;
  codigoVerificacao: string;
  dataEmissao: string;
  urlPdf: string;
}