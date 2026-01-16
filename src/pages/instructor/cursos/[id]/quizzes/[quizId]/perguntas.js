// src/pages/instructor/cursos/[cursoId]/quizzes/[quizId]/perguntas.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../../../lib/api';

export default function GerenciarPerguntas() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const { quizId }   = router.query;
  const cursoId = router.query.id;
  
  
  
  
  const [quiz, setQuiz] = useState(null);
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState('');
  
  const [formData, setFormData] = useState({
    enunciado: '',
    tipo: 'multipla_escolha',
    pontos: 1,
    opcoes: [
      { texto: '', correta: false },
      { texto: '', correta: false }
    ]
  });

  useEffect(() => {
    console.log('🔍 Parâmetros da rota:', { cursoId, quizId });
    
    if (!isInstructor) {
      router.push('/auth/login');
      return;
    }
    
    if (cursoId && quizId) {
      fetchPerguntas();
    }
  }, [isInstructor, cursoId, quizId]);

  const fetchPerguntas = async () => {
    try {
      setLoading(true);
      setErro('');
      
      console.log(`📡 Buscando perguntas para quiz: ${quizId}`);
      const response = await api.get(`/instructor/quizzes/${quizId}/perguntas`);
      
      if (response.data.success) {
        setQuiz(response.data.data.quiz);
        setPerguntas(response.data.data.perguntas);
        console.log(`✅ Carregadas ${response.data.data.perguntas.length} perguntas`);
      } else {
        setErro(response.data.message || 'Erro ao carregar perguntas');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar perguntas:', error);
      setErro(error.response?.data?.message || 'Erro ao carregar perguntas');
      
      if (error.response?.status === 404) {
        router.push(`/instructor/cursos/${cursoId}/quizzes`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpcaoChange = (index, field, value) => {
    const novasOpcoes = [...formData.opcoes];
    
    if (field === 'correta') {
      // Se marcando como correta, desmarca todas as outras
      if (value) {
        novasOpcoes.forEach((opcao, i) => {
          novasOpcoes[i].correta = i === index;
        });
      }
    } else {
      novasOpcoes[index][field] = value;
    }
    
    setFormData({ ...formData, opcoes: novasOpcoes });
  };

  const adicionarOpcao = () => {
    setFormData({
      ...formData,
      opcoes: [...formData.opcoes, { texto: '', correta: false }]
    });
  };

  const removerOpcao = (index) => {
    if (formData.opcoes.length <= 2) {
      alert('É necessário pelo menos 2 opções');
      return;
    }
    
    const novasOpcoes = formData.opcoes.filter((_, i) => i !== index);
    setFormData({ ...formData, opcoes: novasOpcoes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.enunciado.trim()) {
      alert('O enunciado é obrigatório');
      return;
    }

    // Filtrar opções vazias
    const opcoesValidas = formData.opcoes.filter(opcao => opcao.texto.trim() !== '');
    
    if (opcoesValidas.length < 2) {
      alert('É necessário pelo menos 2 opções');
      return;
    }

    // Verificar se há pelo menos uma correta
    const temCorreta = opcoesValidas.some(opcao => opcao.correta);
    if (!temCorreta) {
      alert('Pelo menos uma opção deve ser correta');
      return;
    }

    try {
      const perguntaData = {
        enunciado: formData.enunciado,
        tipo: formData.tipo,
        pontos: formData.pontos,
        opcoes: opcoesValidas
      };

      console.log('📤 Enviando pergunta:', perguntaData);
      
      await api.post(`/instructor/quizzes/${quizId}/perguntas`, perguntaData);
      
      setShowForm(false);
      setEditando(null);
      setFormData({
        enunciado: '',
        tipo: 'multipla_escolha',
        pontos: 1,
        opcoes: [
          { texto: '', correta: false },
          { texto: '', correta: false }
        ]
      });
      
      fetchPerguntas();
      alert(editando ? 'Pergunta atualizada!' : 'Pergunta criada!');
      
    } catch (error) {
      console.error('❌ Erro ao salvar pergunta:', error);
      alert(error.response?.data?.message || 'Erro ao salvar pergunta');
    }
  };

  const handleExcluir = async (perguntaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta pergunta?')) {
      return;
    }

    try {
      // API DELETE para excluir pergunta
      await api.delete(`/instructor/perguntas/${perguntaId}`);
      fetchPerguntas();
      alert('Pergunta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir pergunta:', error);
      alert(error.response?.data?.message || 'Erro ao excluir pergunta');
    }
  };

  const carregarParaEdicao = (pergunta) => {
    const opcoesParaEdicao = [...pergunta.opcoes];
    // Garantir mínimo de 2 opções
    while (opcoesParaEdicao.length < 2) {
      opcoesParaEdicao.push({ texto: '', correta: false });
    }
    
    setFormData({
      enunciado: pergunta.enunciado,
      tipo: pergunta.tipo,
      pontos: pergunta.pontos || 1,
      opcoes: opcoesParaEdicao
    });
    setEditando(pergunta.id);
    setShowForm(true);
  };

  if (loading) {
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

  if (!cursoId || !quizId) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <h5>Aguardando parâmetros...</h5>
          <p>Carregando informações do quiz...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <h5>Erro ao carregar quiz</h5>
          <p>{erro}</p>
          <Link href={`/instructor/cursos/${cursoId}/quizzes`} className="btn btn-outline-danger">
            Voltar para Quizzes
          </Link>
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
              <h1 className="mb-1">Perguntas do Quiz</h1>
              <p className="text-muted mb-0">
                <strong>{quiz?.titulo}</strong> → Módulo: {quiz?.modulo_titulo}
              </p>
              <small className="text-muted">Curso ID: {cursoId} | Quiz ID: {quizId}</small>
            </div>
            <div>
              <Link 
                href={`/instructor/cursos/${cursoId}/quizzes`}
                className="btn btn-outline-primary me-2"
              >
                <i className="bi bi-arrow-left me-2"></i>
                Voltar aos Quizzes
              </Link>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nova Pergunta
              </button>
            </div>
          </div>

          {/* Formulário de Pergunta */}
          {showForm && (
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">{editando ? 'Editar Pergunta' : 'Nova Pergunta'}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="enunciado" className="form-label">Enunciado *</label>
                    <textarea
                      className="form-control"
                      id="enunciado"
                      rows="3"
                      value={formData.enunciado}
                      onChange={(e) => setFormData({...formData, enunciado: e.target.value})}
                      required
                      placeholder="Digite o enunciado da pergunta..."
                    />
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="tipo" className="form-label">Tipo</label>
                      <select
                        className="form-select"
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                      >
                        <option value="multipla_escolha">Múltipla Escolha</option>
                        
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="pontos" className="form-label">Pontos</label>
                      <input
                        type="number"
                        className="form-control"
                        id="pontos"
                        value={formData.pontos}
                        onChange={(e) => setFormData({...formData, pontos: parseInt(e.target.value) || 1})}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  {/* Opções de Resposta */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label fw-semibold mb-0">Opções de Resposta *</label>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-success"
                        onClick={adicionarOpcao}
                      >
                        <i className="bi bi-plus me-1"></i>Adicionar Opção
                      </button>
                    </div>
                    
                    <small className="text-muted d-block mb-3">
                      Marque pelo menos uma opção como correta (mínimo 2 opções)
                    </small>
                    
                    {formData.opcoes.map((opcao, index) => (
                      <div key={index} className="input-group mb-2">
                        <div className="input-group-text">
                          <input
                            className="form-check-input mt-0"
                            type="radio"
                            name="correta"
                            checked={opcao.correta}
                            onChange={(e) => handleOpcaoChange(index, 'correta', e.target.checked)}
                          />
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Opção ${index + 1}`}
                          value={opcao.texto}
                          onChange={(e) => handleOpcaoChange(index, 'texto', e.target.value)}
                          required={formData.opcoes.length > 0}
                        />
                        {formData.opcoes.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removerOpcao(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setEditando(null);
                        setFormData({
                          enunciado: '',
                          tipo: 'multipla_escolha',
                          pontos: 1,
                          opcoes: [
                            { texto: '', correta: false },
                            { texto: '', correta: false }
                          ]
                        });
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      {editando ? (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Atualizar Pergunta
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Criar Pergunta
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Perguntas */}
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  Perguntas ({perguntas.length})
                </h5>
                <small className="text-muted">
                  Total de pontos: {perguntas.reduce((sum, p) => sum + (p.pontos || 1), 0)}
                </small>
              </div>
            </div>
            <div className="card-body">
              {perguntas.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-question-circle text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhuma pergunta criada</h4>
                  <p className="text-muted">Adicione perguntas para este quiz</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Criar Primeira Pergunta
                  </button>
                </div>
              ) : (
                <div className="list-group">
                  {perguntas.map((pergunta, index) => (
                    <div key={pergunta.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 me-3">
                          <div className="d-flex align-items-center mb-2">
                            <h5 className="mb-0 me-3">
                              <span className="badge bg-secondary">#{index + 1}</span>
                            </h5>
                            <span className="badge bg-primary me-2">
                              {pergunta.pontos || 1} {pergunta.pontos === 1 ? 'ponto' : 'pontos'}
                            </span>
                            <span className="badge bg-info">
                              {pergunta.tipo === 'verdadeiro_falso' ? 'Verdadeiro/Falso' : 'Múltipla Escolha'}
                            </span>
                          </div>
                          <p className="mb-2 fw-semibold">{pergunta.enunciado}</p>
                          
                          <div className="mt-3">
                            <small className="text-muted d-block mb-2">Opções:</small>
                            <div className="row">
                              {pergunta.opcoes.map((opcao, opcaoIndex) => (
                                <div key={opcao.id} className="col-md-6 mb-2">
                                  <div className={`card ${opcao.correta ? 'border-success bg-success-light' : 'border-light'}`}>
                                    <div className="card-body py-2">
                                      <div className="d-flex align-items-center">
                                        <div className={`rounded-circle ${opcao.correta ? 'bg-success text-white' : 'bg-light'} d-flex align-items-center justify-content-center me-3`}
                                             style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>
                                          {String.fromCharCode(65 + opcaoIndex)}
                                        </div>
                                        <div className="flex-grow-1">
                                          <span className={opcao.correta ? 'fw-bold text-success' : ''}>
                                            {opcao.texto}
                                          </span>
                                        </div>
                                        {opcao.correta && (
                                          <i className="bi bi-check-circle-fill text-success"></i>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => carregarParaEdicao(pergunta)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleExcluir(pergunta.id)}
                            title="Excluir"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}