// src/pages/instructor/cursos/[cursoId]/quizzes/index.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../../lib/api';

export default function QuizzesInstrutor() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const { id } = router.query;
 // console.log();
  
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    modulo_id: '',
    titulo: '',
    descricao: '',
    pontuacao_minima: 70,
    tempo_limite: ''
  });

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
      const [cursoRes, modulosRes, quizzesRes] = await Promise.all([
        api.get(`/instructor/cursos/${id}`),
        api.get(`/instructor/modulos?curso_id=${id}`),
        api.get(`/instructor/quizzes?curso_id=${id}`)
      ]);
      
      setCurso(cursoRes.data?.data || cursoRes.data);
      setModulos(modulosRes.data?.data || modulosRes.data);
      setQuizzes(quizzesRes.data?.data || quizzesRes.data);
      
      // Selecionar primeiro módulo sem quiz
      const primeiroModuloSemQuiz = (modulosRes.data?.data || modulosRes.data).find(modulo => 
        !(quizzesRes.data?.data || quizzesRes.data).some(quiz => quiz.modulo_id === modulo.id)
      );
      
      if (primeiroModuloSemQuiz) {
        setFormData(prev => ({ ...prev, modulo_id: primeiroModuloSemQuiz.id }));
      }
      
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pontuacao_minima' || name === 'tempo_limite' ? parseInt(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.modulo_id || !formData.titulo) {
      alert('Módulo e título são obrigatórios');
      return;
    }

    try {
      await api.post('/instructor/quizzes', formData);
      setShowForm(false);
      setFormData({
        modulo_id: '',
        titulo: '',
        descricao: '',
        pontuacao_minima: 70,
        tempo_limite: ''
      });
      fetchDados();
      alert('Quiz criado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar quiz:', error);
      alert(error.response?.data?.message || 'Erro ao criar quiz');
    }
  };

  const handleExcluir = async (quizId) => {
    if (!window.confirm('Tem certeza que deseja excluir este quiz? Todas as perguntas serão excluídas também.')) {
      return;
    }

    try {
      await api.delete(`/instructor/quizzes/${quizId}`);
      fetchDados();
      alert('Quiz excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir quiz:', error);
      alert('Erro ao excluir quiz');
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
              <h1 className="mb-1">Quizzes do Curso</h1>
              <p className="text-muted mb-0">
                {curso.titulo}
              </p>
            </div>
            <div>
              <Link href={`/instructor/cursos/${id}`} className="btn btn-outline-primary me-2">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar ao Curso
              </Link>
              {!showForm && modulos.some(m => !quizzes.some(q => q.modulo_id === m.id)) && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Novo Quiz
                </button>
              )}
            </div>
          </div>

          {/* Formulário de Quiz */}
          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Criar Novo Quiz</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="modulo_id" className="form-label">Módulo *</label>
                      <select
                        className="form-select"
                        id="modulo_id"
                        name="modulo_id"
                        value={formData.modulo_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecione um módulo</option>
                        {modulos
                          .filter(modulo => !quizzes.some(quiz => quiz.modulo_id === modulo.id))
                          .map(modulo => (
                            <option key={modulo.id} value={modulo.id}>
                              Módulo {modulo.ordem}: {modulo.titulo}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="titulo" className="form-label">Título do Quiz *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Quiz do Módulo 1"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="descricao" className="form-label">Descrição</label>
                    <textarea
                      className="form-control"
                      id="descricao"
                      name="descricao"
                      rows="3"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Descreva o objetivo deste quiz..."
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="pontuacao_minima" className="form-label">
                        Pontuação Mínima (%)
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          id="pontuacao_minima"
                          name="pontuacao_minima"
                          value={formData.pontuacao_minima}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="tempo_limite" className="form-label">
                        Tempo Limite (minutos)
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          id="tempo_limite"
                          name="tempo_limite"
                          value={formData.tempo_limite}
                          onChange={handleChange}
                          min="1"
                          placeholder="Opcional"
                        />
                        <span className="input-group-text">min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({
                          modulo_id: '',
                          titulo: '',
                          descricao: '',
                          pontuacao_minima: 70,
                          tempo_limite: ''
                        });
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <i className="bi bi-save me-2"></i>
                      Criar Quiz
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Quizzes */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quizzes do Curso ({quizzes.length})</h5>
            </div>
            <div className="card-body">
              {quizzes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-question-circle text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum quiz criado</h4>
                  <p className="text-muted">Crie quizzes para avaliar o aprendizado dos alunos</p>
                  {modulos.length > 0 && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowForm(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Criar Primeiro Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Módulo</th>
                        <th>Título</th>
                        <th>Pontuação Mínima</th>
                        <th>Tempo Limite</th>
                        <th>Perguntas</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.map(quiz => {
                        const modulo = modulos.find(m => m.id === quiz.modulo_id);
                        const quizId = quiz.id;
                        const cursoId = router.query.id;
                        
                        
                        
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
                            <td>{quiz.titulo}</td>
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
                              <span className={`badge ${quiz.total_perguntas > 0 ? 'bg-success' : 'bg-warning'}`}>
                                {quiz.total_perguntas} pergunta{quiz.total_perguntas !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-success">Ativo</span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <Link
                                  href={`/instructor/cursos/${cursoId}/quizzes/${quizId}/perguntas`}
                                  className="btn btn-outline-primary"
                                  title="Gerenciar perguntas"
                                >
                                  <i className="bi bi-list-check"></i>
                                </Link>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleExcluir(quiz.id)}
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
            </div>
          </div>

          {/* Módulos sem Quiz */}
          {modulos.some(m => !quizzes.some(q => q.modulo_id === m.id)) && (
            <div className="card mt-4">
              <div className="card-header bg-warning">
                <h5 className="mb-0">Módulos sem Quiz</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {modulos
                    .filter(modulo => !quizzes.some(quiz => quiz.modulo_id === modulo.id))
                    .map(modulo => (
                      <div key={modulo.id} className="col-md-4 mb-3">
                        <div className="card border-warning">
                          <div className="card-body">
                            <h6>Módulo {modulo.ordem}: {modulo.titulo}</h6>
                            <p className="text-muted small mb-3">{modulo.descricao || 'Sem descrição'}</p>
                            <button 
                              className="btn btn-warning btn-sm w-100"
                              onClick={() => {
                                setFormData({
                                  modulo_id: modulo.id,
                                  titulo: `Quiz - Módulo ${modulo.ordem}`,
                                  descricao: '',
                                  pontuacao_minima: 70,
                                  tempo_limite: ''
                                });
                                setShowForm(true);
                              }}
                            >
                              <i className="bi bi-plus-circle me-2"></i>
                              Criar Quiz
                            </button>
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
      </div>
    </div>
  );
}