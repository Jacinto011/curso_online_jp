import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import api from '../../lib/api';
import ModalPagamento from '@/components/ui/ModalPagamento';

export default function DetalhesCurso() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [matricula, setMatricula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processando, setProcessando] = useState(false);
  // Adicione este estado para os dados de pagamento
  const [dadosPagamentoInstrutor, setDadosPagamentoInstrutor] = useState(null);

  // Estado para modal de pagamento
  const [showModalPagamento, setShowModalPagamento] = useState({
    open: false,
    cursoId: null,
    cursoTitulo: '',
    valor: 0,
    instrutorId: null,
    matriculaId: null // Será preenchido após criar matrícula pendente
  });

  // Modifique o useEffect para buscar dados de pagamento
  useEffect(() => {
    if (id) {
      fetchCurso();
      if (isAuthenticated) {
        checkMatricula();
      }
    }
  }, [id, isAuthenticated]);

  // Modifique a função fetchCurso para buscar dados de pagamento
  const fetchCurso = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cursos/${id}`);
      //console.log('curso',response.data.data?.curso);
      //console.log('modulos',response.data.data?.modulos);
      
      
      setCurso(response.data.data?.curso || []);
      setModulos(response.data.data?.modulos || []); 
      // Buscar dados de pagamento do instrutor
      if (response.data.data?.curso.instrutor_id) {
        try {
          const pagamentoResponse = await api.get(`/instructor/${response.data.curso.instrutor_id}/dados-pagamento`);
          setDadosPagamentoInstrutor(pagamentoResponse.data);
        } catch (pagamentoError) {
          console.warn('Não foi possível carregar dados de pagamento:', pagamentoError);
          // Continua mesmo sem dados de pagamento
        }
      }
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      setError('Curso não encontrado');
    } finally {
      setLoading(false);
    }
  };


  const checkMatricula = async () => {
    try {
      if (!user?.id) return; // Verificar se tem usuário

      const response = await api.get(`/student/matriculas/curso/${id}`, {
        params: {
          estudanteId: user.id
        }
      });

      if (response.data.matricula) {
        setMatricula(response.data.matricula);
      }
    } catch (error) {
      console.error('Erro ao verificar matrícula:', error);
    }
  };




  const handleMatricular = async () => {
    try {
      if (!isAuthenticated) {
        router.push(`/auth/login`);
        return;
      }

      setProcessando(true);

      // Usar ID do usuário logado
      const estudanteId = user?.id;

      if (curso.gratuito) {
        // Cursos gratuitos: matricular diretamente
        const response = await api.post('/cursos/matricular', {
          cursoId: id,
          estudanteId: estudanteId
        });

        if (response.data.success) {
          alert('Matrícula realizada com sucesso!');
          setMatricula(response.data.matricula);
          router.push(`/student/curso/${curso.id}`);
        }
      } else {
        // Cursos pagos: apenas abrir modal sem criar matrícula ainda
        // A matrícula será criada APÓS o envio do comprovante
        setShowModalPagamento({
          open: true,
          cursoId: id,
          cursoTitulo: curso.titulo,
          valor: curso.preco,
          instrutorId: curso.instrutor_id,
          // Não passar matriculaId ainda - será criado após pagamento
          matriculaId: null
        });
      }
    } catch (error) {
      console.error('Erro ao matricular:', error);
      alert(error.response?.data?.message || 'Erro ao realizar matrícula');
    } finally {
      setProcessando(false);
    }
  };



  // Função chamada quando o pagamento é confirmado no modal
  const handlePagamentoConfirmado = (matriculaId) => {
    setMatricula({
      id: matriculaId,
      status: 'pendente' // Status muda para pendente enquanto aguarda confirmação
    });
    alert('Comprovante enviado com sucesso! Aguarde a confirmação do instrutor.');
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
          <h2 className="mt-3">Curso não encontrado</h2>
          <p className="text-muted mb-4">{error || 'O curso solicitado não existe.'}</p>
          <Link href="/cursos" className="btn btn-primary">
            Ver Todos os Cursos
          </Link>
        </div>
      </div>
    );
  }

  const isMatriculado = matricula && ['ativa', 'concluida', 'pendente'].includes(matricula.status);
  const isConcluido = matricula?.status === 'concluida';
  const aguardandoConfirmacao = matricula?.status === 'pendente';

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Conteúdo Principal */}
        <div className="col-lg-8">
          {/* Cabeçalho do Curso */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item">
                        <Link href="/cursos">Cursos</Link>
                      </li>
                      <li className="breadcrumb-item active">{curso.categoria}</li>
                    </ol>
                  </nav>

                  <h1 className="mb-3">{curso.titulo}</h1>

                  <div className="mb-3">
                    <span className="badge bg-primary me-2">{curso.nivel}</span>
                    <span className="badge bg-secondary me-2">{curso.categoria}</span>
                    {curso.gratuito ? (
                      <span className="badge bg-success">Grátis</span>
                    ) : (
                      <span className="badge bg-warning">MZN {parseFloat(curso.preco).toFixed(2)}</span>
                    )}
                  </div>

                  <p className="lead">{curso.descricao}</p>

                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px' }}>
                      {curso.instrutor_nome?.charAt(0) || 'I'}
                    </div>
                    <div>
                      <h6 className="mb-1">Instrutor</h6>
                      <p className="mb-0">{curso.instrutor_nome}</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  {curso.imagem_url && (
                    <img
                      src={curso.imagem_url}
                      className="img-fluid rounded"
                      alt={curso.titulo}
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Módulos do Curso */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="mb-0">Conteúdo do Curso</h3>
              <p className="text-muted mb-0">
                {modulos.length} módulos • {curso.duracao_estimada || 'N/A'} horas de conteúdo
              </p>
            </div>
            <div className="card-body">
              {modulos.length === 0 ? (
                <p className="text-muted">O curso ainda não possui conteúdo disponível.</p>
              ) : (
                <div className="accordion" id="modulosAccordion">
                  {modulos.map((modulo, index) => (
                    <div key={modulo.id} className="accordion-item">
                      <h2 className="accordion-header">
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#modulo${modulo.id}`}
                        >
                          <div className="d-flex w-100 justify-content-between align-items-center">
                            <div>
                              <strong>Módulo {index + 1}:</strong> {modulo.titulo}
                              {modulo.descricao && (
                                <small className="text-muted d-block mt-1">{modulo.descricao}</small>
                              )}
                            </div>
                            <span className="badge bg-secondary">
                              {modulo.total_materiais || modulo.materiais?.length || 0} aulas
                            </span>
                          </div>
                        </button>
                      </h2>
                      <div
                        id={`modulo${modulo.id}`}
                        className="accordion-collapse collapse"
                        data-bs-parent="#modulosAccordion"
                      >
                        <div className="accordion-body">
                          <ul className="list-group">
                            {modulo.materiais?.map((material, matIndex) => (
                              <li key={material.id} className="list-group-item border-0 py-2">
                                <div className="d-flex align-items-center">
                                  <div className="me-3">
                                    {material.tipo === 'video' && (
                                      <i className="bi bi-play-circle-fill text-primary"></i>
                                    )}
                                    {material.tipo === 'documento' && (
                                      <i className="bi bi-file-earmark-text-fill text-info"></i>
                                    )}
                                    {material.tipo === 'texto' && (
                                      <i className="bi bi-text-paragraph text-success"></i>
                                    )}
                                  </div>
                                  <div className="flex-grow-1">
                                    <span className="d-block">
                                      Aula {index + 1}.{matIndex + 1}: {material.titulo}
                                    </span>
                                    {material.tipo === 'video' && material.duracao && (
                                      <small className="text-muted">
                                        <i className="bi bi-clock me-1"></i>
                                        {Math.floor(material.duracao / 60)}:
                                        {String(material.duracao % 60).padStart(2, '0')}
                                      </small>
                                    )}
                                  </div>
                                  {isMatriculado && (
                                    <span className="badge bg-success">
                                      <i className="bi bi-check"></i>
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Requisitos */}
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">O que você vai aprender</h3>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Domínio completo da tecnologia abordada
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Projetos práticos para o portfólio
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Suporte direto do instrutor
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Certificado de conclusão
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar com Ações */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            {/* Card de Matrícula */}
            <div className="card mb-4">
              <div className="card-body text-center">
                {isMatriculado ? (
                  <>
                    {aguardandoConfirmacao ? (
                      <div className="mb-3">
                        <i className="bi bi-clock text-warning" style={{ fontSize: '3rem' }}></i>
                        <h4 className="mt-2">Aguardando Confirmação</h4>
                        <p className="text-muted">
                          Seu comprovante foi enviado. Aguarde a confirmação do instrutor.
                        </p>
                        <div className="alert alert-warning">
                          <small>
                            <i className="bi bi-info-circle me-1"></i>
                            Você receberá uma notificação quando o pagamento for confirmado.
                          </small>
                        </div>
                      </div>
                    ) : isConcluido ? (
                      <div className="mb-3">
                        <i className="bi bi-award text-success" style={{ fontSize: '3rem' }}></i>
                        <h4 className="mt-2">Curso Concluído!</h4>
                        <p className="text-muted">Parabéns pela conclusão!</p>
                        <Link
                          href={`/student/certificados/${matricula.certificado_id}`}
                          className="btn btn-success w-100"
                        >
                          <i className="bi bi-award me-2"></i>
                          Ver Certificado
                        </Link>
                      </div>
                    ) : (
                      <>
                        <h4 className="mb-3">Você está matriculado</h4>
                        <div className="mb-3">
                          <div className="progress" style={{ height: '10px' }}>
                            <div
                              className="progress-bar"
                              style={{ width: `${matricula.progresso || 0}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">
                            Progresso: {matricula.progresso || 0}%
                          </small>
                        </div>
                        <Link
                          href={`/student/curso/${curso.id}`}
                          className="btn btn-primary w-100 mb-2"
                        >
                          <i className="bi bi-play-circle me-2"></i>
                          Continuar Estudando
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="mb-3">
                      {curso.gratuito ? 'Comece a Estudar Agora' : 'Matricule-se no Curso'}
                    </h4>

                    {curso.gratuito ? (
                      <button
                        className="btn btn-primary w-100 mb-2"
                        onClick={handleMatricular}
                        disabled={processando}
                      >
                        {processando ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-circle me-2"></i>
                            Começar Curso Grátis
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <div className="mb-3">
                          <h2 className="text-primary">MZN {parseFloat(curso.preco).toFixed(2)}</h2>
                          <p className="text-muted">Pagamento único</p>
                        </div>

                        <button
                          className="btn btn-primary w-100 mb-2"
                          onClick={handleMatricular}
                          disabled={processando}
                        >
                          {processando ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Processando...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cart me-2"></i>
                              Comprar Curso
                            </>
                          )}
                        </button>

                        <button className="btn btn-outline-primary w-100">
                          <i className="bi bi-heart me-2"></i>
                          Adicionar à Lista de Desejos
                        </button>
                      </>
                    )}
                  </>
                )}

                <div className="mt-4 text-start">
                  <h6>Este curso inclui:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-play-circle text-primary me-2"></i>
                      Acesso vitalício
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-file-text text-primary me-2"></i>
                      {modulos.reduce((total, modulo) => total + (modulo.total_materiais || modulo.materiais?.length || 0), 0)} aulas
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-phone text-primary me-2"></i>
                      Acesso em qualquer dispositivo
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-award text-primary me-2"></i>
                      Certificado de conclusão
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Informações do Curso */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Informações do Curso</h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Nível</span>
                    <strong>{curso.nivel}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Duração</span>
                    <strong>{curso.duracao_estimada || 'N/A'} horas</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Alunos</span>
                    <strong>{curso.total_matriculas || 0}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Avaliação</span>
                    <strong>4.8/5.0</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Atualizado</span>
                    <strong>{new Date(curso.data_atualizacao || curso.data_criacao).toLocaleDateString('pt-BR')}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}


      <ModalPagamento
        isOpen={showModalPagamento.open}
        onClose={() => setShowModalPagamento({ open: false })}
        cursoId={showModalPagamento.cursoId}
        cursoTitulo={showModalPagamento.cursoTitulo}
        valor={showModalPagamento.valor}
        instrutorId={showModalPagamento.instrutorId}
        dadosInstrutor={dadosPagamentoInstrutor?.data} // Passe os dados diretamente
        onPagamentoConfirmado={handlePagamentoConfirmado}
      />
    </div>


  );
}