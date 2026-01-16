import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../lib/api';

export default function DetalhesCurso() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('detalhes');

  useEffect(() => {
    if (!isInstructor || !id) {
      router.push('/auth/login');
      return;
    }
    fetchDados();
  }, [isInstructor, id]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [cursoRes, modulosRes, matriculasRes, quizzesRes] = await Promise.all([
        api.get(`/instructor/cursos/${id}`),
        api.get(`/instructor/modulos?curso_id=${id}`),
        api.get(`/instructor/matriculas?curso_id=${id}`),
        api.get(`/instructor/quizzes?curso_id=${id}`)
      ]);
      
      setCurso(cursoRes.data.data?.curso || []);
      setModulos(modulosRes.data?.data || []);
      setMatriculas(matriculasRes.data?.data || []);
      setQuizzes(quizzesRes.data?.data || []);
      setFormData(cursoRes.data);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.response?.status === 404) {
        router.push('/instructor/cursos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`instructor/cursos/${id}`, formData);
      setSucesso('Curso atualizado com sucesso!');
      setCurso(formData);
      setEditing(false);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao atualizar curso');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleMudarStatus = async (novoStatus) => {
    if (!window.confirm(`Deseja alterar o status do curso para "${novoStatus}"?`)) {
      return;
    }

    try {
      await api.put(`/instructor/cursos/${id}/status`, { status: novoStatus });
      setSucesso(`Status do curso alterado para ${novoStatus}`);
      setCurso({ ...curso, status: novoStatus });
      setFormData({ ...formData, status: novoStatus });
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao alterar status do curso');
      setTimeout(() => setErro(''), 3000);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione apenas imagens');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          imagem_url: data.file.url
        }));
        setSucesso('Imagem atualizada com sucesso!');
      } else {
        setErro(data.message || 'Erro ao enviar imagem');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setErro('Erro ao enviar imagem');
    }
  };

  const calcularProgressoMedio = () => {
    if (!matriculas.length) return 0;
    const concluidas = matriculas.filter(m => m.status === 'concluida').length;
    return Math.round((concluidas / matriculas.length) * 100);
  };

  const handleExcluirQuiz = async (quizId) => {
    if (!window.confirm('Tem certeza que deseja excluir este quiz? Todas as perguntas serão excluídas também.')) {
      return;
    }

    try {
      await api.delete(`/api/instructor/quizzes/${quizId}`);
      setSucesso('Quiz excluído com sucesso!');
      fetchDados();
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro('Erro ao excluir quiz');
      setTimeout(() => setErro(''), 3000);
    }
  };

  if (loading || !curso) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Cabeçalho */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-1">
                {editing ? 'Editar Curso' : curso.titulo}
              </h1>
              <p className="text-muted mb-0">
                Gerencie seu curso e acompanhe o desempenho
              </p>
            </div>
            <div>
              <Link href="/instructor/cursos" className="btn btn-outline-primary me-2">
                <i className="bi bi-arrow-left me-2"></i>
                Meus Cursos
              </Link>
              {!editing && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setEditing(true)}
                >
                  <i className="bi bi-pencil me-2"></i>
                  Editar Curso
                </button>
              )}
            </div>
          </div>

          {/* Mensagens */}
          {sucesso && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {sucesso}
              <button type="button" className="btn-close" onClick={() => setSucesso('')}></button>
            </div>
          )}
          
          {erro && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {erro}
              <button type="button" className="btn-close" onClick={() => setErro('')}></button>
            </div>
          )}

          {editing ? (
            /* Formulário de Edição */
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Editar Curso</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* ... mantém todo o formulário de edição existente ... */}
                  {/* Mesmo conteúdo do formulário original */}
                </form>
              </div>
            </div>
          ) : (
            /* Visualização dos Dados */
            <div className="row">
              {/* Informações do Curso (Lateral Esquerda) */}
              <div className="col-md-4 mb-4">
                <div className="card">
                  <div className="card-body">
                    {curso.imagem_url ? (
                      <img 
                        src={curso.imagem_url} 
                        className="card-img-top mb-3 rounded"
                        alt={curso.titulo}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center mb-3"
                           style={{ height: '200px' }}>
                        <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`badge bg-${getStatusColor(curso.status)} me-2`}>
                          {curso.status}
                        </span>
                        <span className={`badge bg-${curso.gratuito ? 'success' : 'warning'}`}>
                          {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    
                    <h5 className="card-title">{curso.titulo}</h5>
                    <p className="card-text text-muted">
                      {curso.descricao || 'Sem descrição'}
                    </p>
                    
                    <div className="mb-3">
                      <small className="text-muted d-block">
                        <i className="bi bi-clock me-2"></i>
                        {curso.duracao_estimada || 'N/A'} horas
                      </small>
                      <small className="text-muted d-block">
                        <i className="bi bi-bar-chart me-2"></i>
                        Nível: {curso.nivel || 'Não definido'}
                      </small>
                      <small className="text-muted d-block">
                        <i className="bi bi-tag me-2"></i>
                        Categoria: {curso.categoria || 'Não definida'}
                      </small>
                      <small className="text-muted d-block">
                        <i className="bi bi-calendar me-2"></i>
                        Criado em: {new Date(curso.data_criacao).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <Link 
                        href={`/instructor/cursos/${id}/modulos`}
                        className="btn btn-primary"
                      >
                        <i className="bi bi-folder me-2"></i>
                        Gerenciar Módulos
                      </Link>
                      
                      <div className="dropdown">
                        <button 
                          className="btn btn-outline-secondary dropdown-toggle w-100"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-gear me-2"></i>
                          Mais Ações
                        </button>
                        <ul className="dropdown-menu w-100">
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => setEditing(true)}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              Editar Curso
                            </button>
                          </li>
                          {curso.status !== 'publicado' && (
                            <li>
                              <button 
                                className="dropdown-item text-success"
                                onClick={() => handleMudarStatus('publicado')}
                              >
                                <i className="bi bi-check-circle me-2"></i>
                                Publicar Curso
                              </button>
                            </li>
                          )}
                          {curso.status !== 'arquivado' && (
                            <li>
                              <button 
                                className="dropdown-item text-warning"
                                onClick={() => handleMudarStatus('arquivado')}
                              >
                                <i className="bi bi-archive me-2"></i>
                                Arquivar Curso
                              </button>
                            </li>
                          )}
                          {curso.status !== 'rascunho' && (
                            <li>
                              <button 
                                className="dropdown-item text-secondary"
                                onClick={() => handleMudarStatus('rascunho')}
                              >
                                <i className="bi bi-pencil me-2"></i>
                                Mover para Rascunho
                              </button>
                            </li>
                          )}
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <Link 
                              href={`/cursos/${id}`}
                              className="dropdown-item"
                              target="_blank"
                            >
                              <i className="bi bi-eye me-2"></i>
                              Visualizar Curso
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteúdo Principal */}
              <div className="col-md-8">
                {/* Abas */}
                <div className="card mb-4">
                  <div className="card-header">
                    <ul className="nav nav-tabs card-header-tabs">
                      <li className="nav-item">
                        <button
                          className={`nav-link ${abaAtiva === 'detalhes' ? 'active' : ''}`}
                          onClick={() => setAbaAtiva('detalhes')}
                        >
                          <i className="bi bi-info-circle me-2"></i>
                          Detalhes
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${abaAtiva === 'modulos' ? 'active' : ''}`}
                          onClick={() => setAbaAtiva('modulos')}
                        >
                          <i className="bi bi-folder me-2"></i>
                          Módulos
                          <span className="badge bg-primary ms-2">{modulos.length}</span>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${abaAtiva === 'quizzes' ? 'active' : ''}`}
                          onClick={() => setAbaAtiva('quizzes')}
                        >
                          <i className="bi bi-question-circle me-2"></i>
                          Quizzes
                          <span className="badge bg-info ms-2">{quizzes.length}</span>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${abaAtiva === 'matriculas' ? 'active' : ''}`}
                          onClick={() => setAbaAtiva('matriculas')}
                        >
                          <i className="bi bi-people me-2"></i>
                          Matrículas
                          <span className="badge bg-success ms-2">{matriculas.length}</span>
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${abaAtiva === 'estatisticas' ? 'active' : ''}`}
                          onClick={() => setAbaAtiva('estatisticas')}
                        >
                          <i className="bi bi-graph-up me-2"></i>
                          Estatísticas
                        </button>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="card-body">
                    {/* Aba: Detalhes */}
                    {abaAtiva === 'detalhes' && (
                      <div>
                        <h5>Informações do Curso</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Título:</strong>
                              <p className="mb-0">{curso.titulo}</p>
                            </div>
                            <div className="mb-3">
                              <strong>Status:</strong>
                              <p className="mb-0">
                                <span className={`badge bg-${getStatusColor(curso.status)}`}>
                                  {curso.status}
                                </span>
                              </p>
                            </div>
                            <div className="mb-3">
                              <strong>Preço:</strong>
                              <p className="mb-0">
                                {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                              </p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Duração Estimada:</strong>
                              <p className="mb-0">{curso.duracao_estimada || 'N/A'} horas</p>
                            </div>
                            <div className="mb-3">
                              <strong>Nível:</strong>
                              <p className="mb-0">{curso.nivel || 'Não definido'}</p>
                            </div>
                            <div className="mb-3">
                              <strong>Categoria:</strong>
                              <p className="mb-0">{curso.categoria || 'Não definida'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <strong>Descrição:</strong>
                          <p className="mb-0">{curso.descricao || 'Sem descrição'}</p>
                        </div>
                        
                        <div className="mb-3">
                          <strong>Data de Criação:</strong>
                          <p className="mb-0">
                            {new Date(curso.data_criacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        
                        <div className="d-grid gap-2 d-md-flex">
                          <Link 
                            href={`/cursos/${id}`}
                            className="btn btn-outline-primary"
                            target="_blank"
                          >
                            <i className="bi bi-eye me-2"></i>
                            Visualizar como Aluno
                          </Link>
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => setEditing(true)}
                          >
                            <i className="bi bi-pencil me-2"></i>
                            Editar Curso
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Aba: Módulos */}
                    {abaAtiva === 'modulos' && (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5>Módulos do Curso</h5>
                          <Link 
                            href={`/instructor/cursos/${id}/modulos`}
                            className="btn btn-primary btn-sm"
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Gerenciar Módulos
                          </Link>
                        </div>
                        
                        {modulos.length === 0 ? (
                          <div className="text-center py-4">
                            <i className="bi bi-folder text-muted" style={{ fontSize: '3rem' }}></i>
                            <p className="text-muted mt-3">Nenhum módulo criado ainda</p>
                            <Link 
                              href={`/instructor/cursos/${id}/modulos`}
                              className="btn btn-primary"
                            >
                              Criar Primeiro Módulo
                            </Link>
                          </div>
                        ) : (
                          <div className="list-group">
                            {modulos.sort((a, b) => a.ordem - b.ordem).map((modulo, index) => (
                              <Link 
                                key={modulo.id}
                                href={`/instructor/cursos/${id}/modulos/${modulo.id}/materiais`}
                                className="list-group-item list-group-item-action"
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="d-flex align-items-center">
                                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                           style={{ width: '30px', height: '30px' }}>
                                        {index + 1}
                                      </div>
                                      <h6 className="mb-0">{modulo.titulo}</h6>
                                    </div>
                                    {modulo.descricao && (
                                      <small className="text-muted">{modulo.descricao}</small>
                                    )}
                                  </div>
                                  <div>
                                    <i className="bi bi-chevron-right"></i>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Aba: Quizzes */}
                    {abaAtiva === 'quizzes' && (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5>Quizzes do Curso</h5>
                          <div>
                            <Link 
                              href={`/instructor/cursos/${id}/quizzes`}
                              className="btn btn-primary btn-sm me-2"
                            >
                              <i className="bi bi-plus-circle me-2"></i>
                              Gerenciar Quizzes
                            </Link>
                            <Link 
                              href={`/instructor/cursos/${id}/quizzes/novo`}
                              className="btn btn-success btn-sm"
                            >
                              <i className="bi bi-plus-lg me-2"></i>
                              Novo Quiz
                            </Link>
                          </div>
                        </div>
                        
                        {quizzes.length === 0 ? (
                          <div className="text-center py-4">
                            <i className="bi bi-question-circle text-muted" style={{ fontSize: '3rem' }}></i>
                            <p className="text-muted mt-3">Nenhum quiz criado ainda</p>
                            <Link 
                              href={`/instructor/cursos/${id}/quizzes/novo`}
                              className="btn btn-primary"
                            >
                              Criar Primeiro Quiz
                            </Link>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover table-sm">
                              <thead>
                                <tr>
                                  <th>Módulo</th>
                                  <th>Título</th>
                                  <th>Perguntas</th>
                                  <th>Pontuação Mínima</th>
                                  <th>Tempo Limite</th>
                                  <th>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {quizzes.map(quiz => {
                                  const modulo = modulos.find(m => m.id === quiz.modulo_id);
                                  
                                  return (
                                    <tr key={quiz.id}>
                                      <td>
                                        {modulo ? (
                                          <div>
                                            <strong>Módulo {modulo.ordem}</strong>
                                            <div className="text-muted small">{modulo.titulo}</div>
                                          </div>
                                        ) : 'N/A'}
                                      </td>
                                      <td>
                                        <strong>{quiz.titulo}</strong>
                                        {quiz.descricao && (
                                          <div className="text-muted small">{quiz.descricao}</div>
                                        )}
                                      </td>
                                      <td>
                                        <span className={`badge ${quiz.total_perguntas > 0 ? 'bg-success' : 'bg-warning'}`}>
                                          {quiz.total_perguntas} pergunta{quiz.total_perguntas !== 1 ? 's' : ''}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="badge bg-primary">{quiz.pontuacao_minima}%</span>
                                      </td>
                                      <td>
                                        {quiz.tempo_limite ? (
                                          <span className="badge bg-info">{quiz.tempo_limite} min</span>
                                        ) : (
                                          <span className="badge bg-secondary">Sem limite</span>
                                        )}
                                      </td>
                                      <td>
                                        <div className="btn-group btn-group-sm">
                                          <Link
                                            href={`/instructor/cursos/${id}/quizzes/${quiz.id}/perguntas`}
                                            className="btn btn-outline-primary"
                                            title="Gerenciar perguntas"
                                          >
                                            <i className="bi bi-list-check"></i>
                                          </Link>
                                          <button
                                            className="btn btn-outline-danger"
                                            onClick={() => handleExcluirQuiz(quiz.id)}
                                            title="Excluir quiz"
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Módulos sem Quiz */}
                        {modulos.some(m => !quizzes.some(q => q.modulo_id === m.id)) && (
                          <div className="card mt-4 border-warning">
                            <div className="card-header bg-warning">
                              <h6 className="mb-0">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Módulos sem Quiz
                              </h6>
                            </div>
                            <div className="card-body">
                              <p className="text-muted mb-3">
                                Os seguintes módulos ainda não possuem quiz:
                              </p>
                              <div className="row">
                                {modulos
                                  .filter(modulo => !quizzes.some(quiz => quiz.modulo_id === modulo.id))
                                  .map(modulo => (
                                    <div key={modulo.id} className="col-md-4 mb-3">
                                      <div className="card border-warning">
                                        <div className="card-body">
                                          <h6>Módulo {modulo.ordem}: {modulo.titulo}</h6>
                                          <p className="text-muted small mb-2">{modulo.descricao || 'Sem descrição'}</p>
                                          <Link 
                                            href={`/instructor/cursos/${id}/quizzes/novo?modulo_id=${modulo.id}`}
                                            className="btn btn-warning btn-sm w-100"
                                          >
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Criar Quiz
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Aba: Matrículas */}
                    {abaAtiva === 'matriculas' && (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5>Matrículas no Curso</h5>
                          <Link 
                            href={`/instructor/matriculas?curso=${id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <i className="bi bi-people me-2"></i>
                            Ver Todas
                          </Link>
                        </div>
                        
                        {matriculas.length === 0 ? (
                          <div className="text-center py-4">
                            <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                            <p className="text-muted mt-3">Nenhuma matrícula ainda</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Aluno</th>
                                  <th>Email</th>
                                  <th>Status</th>
                                  <th>Data</th>
                                  <th>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {matriculas.slice(0, 5).map(mat => (
                                  <tr key={mat.id}>
                                    <td>{mat.estudante_nome}</td>
                                    <td>{mat.estudante_email}</td>
                                    <td>
                                      <span className={`badge bg-${getMatriculaStatusColor(mat.status)}`}>
                                        {mat.status}
                                      </span>
                                    </td>
                                    <td>{new Date(mat.data_matricula).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                      <button className="btn btn-sm btn-outline-primary">
                                        <i className="bi bi-envelope"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {matriculas.length > 5 && (
                              <div className="text-center mt-3">
                                <Link 
                                  href={`/instructor/matriculas?curso=${id}`}
                                  className="btn btn-link"
                                >
                                  Ver todas as {matriculas.length} matrículas
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Aba: Estatísticas */}
                    {abaAtiva === 'estatisticas' && (
                      <div>
                        <h5>Estatísticas do Curso</h5>
                        <div className="row mb-4">
                          <div className="col-md-3 mb-3">
                            <div className="card bg-primary text-white">
                              <div className="card-body text-center">
                                <h6>Total Matrículas</h6>
                                <h3>{matriculas.length}</h3>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3 mb-3">
                            <div className="card bg-success text-white">
                              <div className="card-body text-center">
                                <h6>Concluídas</h6>
                                <h3>{matriculas.filter(m => m.status === 'concluida').length}</h3>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3 mb-3">
                            <div className="card bg-info text-white">
                              <div className="card-body text-center">
                                <h6>Módulos</h6>
                                <h3>{modulos.length}</h3>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3 mb-3">
                            <div className="card bg-warning text-white">
                              <div className="card-body text-center">
                                <h6>Quizzes</h6>
                                <h3>{quizzes.length}</h3>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h6>Distribuição por Status</h6>
                          <div className="progress" style={{ height: '20px' }}>
                            {[
                              { status: 'ativa', label: 'Ativas', color: 'success' },
                              { status: 'concluida', label: 'Concluídas', color: 'info' },
                              { status: 'suspensa', label: 'Suspensas', color: 'warning' },
                              { status: 'pendente', label: 'Pendentes', color: 'secondary' }
                            ].map(item => {
                              const count = matriculas.filter(m => m.status === item.status).length;
                              const percent = matriculas.length > 0 ? (count / matriculas.length) * 100 : 0;
                              
                              return percent > 0 ? (
                                <div 
                                  key={item.status}
                                  className={`progress-bar bg-${item.color}`}
                                  role="progressbar"
                                  style={{ width: `${percent}%` }}
                                  title={`${item.label}: ${count} (${percent.toFixed(1)}%)`}
                                >
                                  {percent > 10 ? `${item.label}: ${count}` : ''}
                                </div>
                              ) : null;
                            })}
                          </div>
                          <small className="text-muted">
                            Total: {matriculas.length} matrículas
                          </small>
                        </div>
                        
                        <div>
                          <h6>Taxa de Conclusão</h6>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${calcularProgressoMedio()}%` }}
                              ></div>
                            </div>
                            <span className="ms-3">{calcularProgressoMedio()}%</span>
                          </div>
                          <small className="text-muted">
                            Percentual médio de conclusão do curso
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <Link 
                      href={`/instructor/cursos/${id}/modulos`}
                      className="card text-decoration-none"
                    >
                      <div className="card-body text-center">
                        <i className="bi bi-folder text-primary" style={{ fontSize: '2rem' }}></i>
                        <h6 className="mt-2 mb-0">Gerenciar Módulos</h6>
                        <small className="text-muted">{modulos.length} módulos</small>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3">
                    <Link 
                      href={`/instructor/cursos/${id}/quizzes`}
                      className="card text-decoration-none"
                    >
                      <div className="card-body text-center">
                        <i className="bi bi-question-circle text-info" style={{ fontSize: '2rem' }}></i>
                        <h6 className="mt-2 mb-0">Gerenciar Quizzes</h6>
                        <small className="text-muted">{quizzes.length} quizzes</small>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3">
                    <Link 
                      href={`/instructor/matriculas?curso=${id}`}
                      className="card text-decoration-none"
                    >
                      <div className="card-body text-center">
                        <i className="bi bi-people text-success" style={{ fontSize: '2rem' }}></i>
                        <h6 className="mt-2 mb-0">Ver Matrículas</h6>
                        <small className="text-muted">{matriculas.length} alunos</small>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card">
                      <div className="card-body text-center">
                        <i className="bi bi-graph-up text-warning" style={{ fontSize: '2rem' }}></i>
                        <h6 className="mt-2 mb-0">Estatísticas</h6>
                        <small className="text-muted">{calcularProgressoMedio()}% progresso</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo dos Quizzes */}
                {quizzes.length > 0 && (
                  <div className="card mt-4">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="bi bi-question-circle me-2"></i>
                        Resumo dos Quizzes
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '50px', height: '50px' }}>
                              <i className="bi bi-question-lg"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">{quizzes.length}</h5>
                              <small className="text-muted">Total de Quizzes</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '50px', height: '50px' }}>
                              <i className="bi bi-check-circle"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">
                                {quizzes.filter(q => q.total_perguntas > 0).length}
                              </h5>
                              <small className="text-muted">Quizzes com Perguntas</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '50px', height: '50px' }}>
                              <i className="bi bi-exclamation-circle"></i>
                            </div>
                            <div>
                              <h5 className="mb-0">
                                {quizzes.filter(q => q.total_perguntas === 0).length}
                              </h5>
                              <small className="text-muted">Quizzes sem Perguntas</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link 
                          href={`/instructor/cursos/${id}/quizzes`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-arrow-right me-2"></i>
                          Ver Todos os Quizzes
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares
function getStatusColor(status) {
  switch(status) {
    case 'publicado': return 'success';
    case 'rascunho': return 'warning';
    case 'arquivado': return 'secondary';
    default: return 'light';
  }
}

function getMatriculaStatusColor(status) {
  switch(status) {
    case 'ativa': return 'success';
    case 'concluida': return 'info';
    case 'pendente': return 'warning';
    case 'suspensa': return 'danger';
    default: return 'secondary';
  }
}