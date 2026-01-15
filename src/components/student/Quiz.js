import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function QuizComponent({ quizId, cursoId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [alternativas, setAlternativas] = useState([]);
  const [respostas, setRespostas] = useState([]);
  const [submetendo, setSubmetendo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const [quizRes, alternativasRes] = await Promise.all([
        api.get(`/api/quizzes/${quizId}`),
        api.get(`/api/quizzes/${quizId}/alternativas`)
      ]);
      
      setQuiz(quizRes.data);
      setAlternativas(alternativasRes.data);
    } catch (error) {
      console.error('Erro ao carregar quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativaClick = (alternativaId, multiplaEscolha) => {
    if (multiplaEscolha) {
      setRespostas(prev => 
        prev.includes(alternativaId) 
          ? prev.filter(id => id !== alternativaId)
          : [...prev, alternativaId]
      );
    } else {
      setRespostas([alternativaId]);
    }
  };

  const handleSubmit = async () => {
    if (respostas.length === 0) {
      alert('Selecione pelo menos uma alternativa');
      return;
    }

    try {
      setSubmetendo(true);
      const response = await api.post('/api/student/quizzes/submeter', {
        quiz_id: quizId,
        curso_id: cursoId,
        respostas: respostas
      });

      setResultado(response.data);
      
      if (response.data.aprovado && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      alert('Erro ao submeter quiz');
    } finally {
      setSubmetendo(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="alert alert-danger">
        Quiz não encontrado
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0">
          <i className="bi bi-question-circle me-2"></i>
          Quiz: {quiz.titulo}
        </h4>
      </div>
      
      <div className="card-body">
        {resultado ? (
          <div className={`text-center p-4 ${resultado.aprovado ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
            {resultado.aprovado ? (
              <i className="bi bi-trophy-fill text-success" style={{ fontSize: '4rem' }}></i>
            ) : (
              <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }}></i>
            )}
            
            <h3 className={`mt-3 ${resultado.aprovado ? 'text-success' : 'text-danger'}`}>
              {resultado.aprovado ? 'Parabéns!' : 'Que pena!'}
            </h3>
            
            <p className="lead">{resultado.mensagem}</p>
            <p className="h2">{resultado.pontuacao}%</p>
            <p>Pontuação mínima: {quiz.pontuacao_minima}%</p>
            
            {!resultado.aprovado && resultado.pode_repetir && (
              <button 
                className="btn btn-primary mt-3"
                onClick={() => {
                  setResultado(null);
                  setRespostas([]);
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Tentar Novamente
              </button>
            )}
            
            {resultado.aprovado && onComplete && (
              <button 
                className="btn btn-success mt-3"
                onClick={onComplete}
              >
                <i className="bi bi-arrow-right me-2"></i>
                Continuar
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h5>{quiz.pergunta}</h5>
              {quiz.descricao && (
                <p className="text-muted">{quiz.descricao}</p>
              )}
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                {quiz.multipla_escolha 
                  ? 'Selecione uma ou mais alternativas corretas'
                  : 'Selecione apenas uma alternativa correta'
                }
              </div>
            </div>
            
            <div className="mb-4">
              <h6>Alternativas:</h6>
              <div className="list-group">
                {alternativas.map(alternativa => (
                  <button
                    key={alternativa.id}
                    className={`list-group-item list-group-item-action text-start ${respostas.includes(alternativa.id) ? 'active' : ''}`}
                    onClick={() => handleAlternativaClick(alternativa.id, quiz.multipla_escolha)}
                    type="button"
                  >
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type={quiz.multipla_escolha ? 'checkbox' : 'radio'}
                        checked={respostas.includes(alternativa.id)}
                        readOnly
                      />
                      <label className="form-check-label w-100">
                        {alternativa.texto}
                      </label>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Pontuação mínima: {quiz.pontuacao_minima}%
              </small>
              <button 
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submetendo || respostas.length === 0}
              >
                {submetendo ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submeter Respostas
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}