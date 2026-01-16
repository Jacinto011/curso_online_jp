// pages/student/quiz/[id].js - COM CORREÇÃO DO handleIniciarQuiz
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function QuizPage() {
  const { isStudent, user } = useAuth();
  const router = useRouter();
  const { quizId } = router.query;
  console.log(router.query.quizId);
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState({});
  const [submetendo, setSubmetendo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(null);
  const [iniciado, setIniciado] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    if (!isStudent || !quizId) return;
    fetchQuiz();
  }, [isStudent, quizId]);

  // Adicionar esta função que estava faltando
  const handleIniciarQuiz = () => {
    setIniciado(true);
    
    // Iniciar contador de tempo se houver tempo limite
    if (quizData?.quiz?.tempo_limite) {
      const limiteSegundos = quizData.quiz.tempo_limite * 60;
      setTempoRestante(limiteSegundos);
      
      // Configurar intervalo do timer
      const interval = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTempoEsgotado();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimerInterval(interval);
    }
  };

  const handleTempoEsgotado = () => {
    alert('Tempo esgotado! O quiz será submetido automaticamente.');
    handleSubmeterQuiz();
  };

  // Limpar intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/quiz/${quizId}/iniciar`);
      
      if (response.data.success) {
        setQuizData(response.data.data);
        
        // Inicializar objeto de respostas
        const respostasIniciais = {};
        response.data.data.perguntas.forEach(pergunta => {
          respostasIniciais[pergunta.id] = null;
        });
        setRespostas(respostasIniciais);
        
      } else {
        alert(response.data.message);
        router.back();
      }
      
    } catch (error) {
      console.error('Erro ao carregar quiz:', error);
      if (error.response?.status === 403 || error.response?.status === 400) {
        alert(error.response.data.message || 'Não autorizado para realizar este quiz');
        router.back();
      } else {
        alert('Erro ao carregar quiz. Tente novamente.');
        router.push('/student/cursos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRespostaChange = (perguntaId, opcaoId) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: opcaoId
    }));
  };

  const handleSubmeterQuiz = async () => {
    if (submetendo) return;
    
    // Limpar timer se existir
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Verificar se todas as perguntas foram respondidas
    const perguntasRespondidas = Object.values(respostas).filter(r => r !== null).length;
    const totalPerguntas = quizData.perguntas.length;
    
    if (perguntasRespondidas < totalPerguntas) {
      const confirmar = window.confirm(
        `Você respondeu ${perguntasRespondidas} de ${totalPerguntas} perguntas. Deseja submeter mesmo assim?`
      );
      if (!confirmar) return;
    }

    setSubmetendo(true);
    
    try {
      // Preparar respostas no formato esperado
      const respostasArray = Object.entries(respostas)
        .filter(([_, opcaoId]) => opcaoId !== null)
        .map(([perguntaId, opcaoId]) => ({
          pergunta_id: parseInt(perguntaId),
          opcao_id: parseInt(opcaoId)
        }));

      const response = await api.post(`/student/quiz/${quizId}/submeter`, {
        matricula_id: quizData.quiz.matricula_id,
        respostas: respostasArray
      });

      if (response.data.success) {
        setResultado(response.data.data);
      } else {
        alert(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      alert(error.response?.data?.message || 'Erro ao submeter quiz. Tente novamente.');
    } finally {
      setSubmetendo(false);
    }
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !quizData) {
    return (
      <div className="container-fluid py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className={`card text-center ${resultado.aprovado ? 'border-success' : 'border-danger'}`}>
              <div className={`card-header ${resultado.aprovado ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                <h3 className="mb-0">
                  {resultado.aprovado ? '🎉 Parabéns!' : '😔 Não Aprovado'}
                </h3>
              </div>
              <div className="card-body">
                <div className={`display-1 mb-4 ${resultado.aprovado ? 'text-success' : 'text-danger'}`}>
                  {resultado.pontuacao}%
                </div>
                
                <h4 className="mb-3">{resultado.mensagem}</h4>
                
                <div className="card mb-4">
                  <div className="card-body">
                    <h5>Resultado Detalhado</h5>
                    <p className="mb-2">
                      <strong>Sua Pontuação:</strong> {resultado.pontuacao}%
                    </p>
                    <p className="mb-2">
                      <strong>Pontuação Mínima:</strong> {resultado.pontuacao_minima}%
                    </p>
                    <p className="mb-0">
                      <strong>Status:</strong> 
                      <span className={`badge ms-2 ${resultado.aprovado ? 'bg-success' : 'bg-danger'}`}>
                        {resultado.aprovado ? 'APROVADO' : 'REPROVADO'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="d-grid gap-2">
                  {resultado.aprovado ? (
                    <>
                      <Link 
                        href={`/student/curso/${quizData.quiz.curso_id}`}
                        className="btn btn-success"
                      >
                        <i className="bi bi-arrow-right-circle me-2"></i>
                        Continuar para Próximo Módulo
                      </Link>
                      <Link 
                        href="/student/certificados"
                        className="btn btn-outline-success"
                      >
                        <i className="bi bi-award me-2"></i>
                        Ver Certificados
                      </Link>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setResultado(null);
                          setRespostas({});
                          setIniciado(false); // Voltar para tela de instruções
                          
                          // Re-inicializar respostas
                          const respostasIniciais = {};
                          quizData.perguntas.forEach(pergunta => {
                            respostasIniciais[pergunta.id] = null;
                          });
                          setRespostas(respostasIniciais);
                        }}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Tentar Novamente
                      </button>
                      <Link 
                        href={`/student/curso/${quizData.quiz.curso_id}`}
                        className="btn btn-outline-primary"
                      >
                        <i className="bi bi-book me-2"></i>
                        Revisar Material
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!iniciado) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">Instruções do Quiz</h3>
              </div>
              <div className="card-body">
                <h4 className="mb-3">{quizData.quiz.titulo}</h4>
                
                {quizData.quiz.descricao && (
                  <div className="alert alert-info">
                    <p className="mb-0">{quizData.quiz.descricao}</p>
                  </div>
                )}
                
                <div className="card mb-4">
                  <div className="card-body">
                    <h5>Informações Importantes:</h5>
                    <ul className="mb-0">
                      <li>Total de Perguntas: <strong>{quizData.perguntas.length}</strong></li>
                      <li>Pontuação Mínima: <strong>{quizData.quiz.pontuacao_minima}%</strong></li>
                      {quizData.quiz.tempo_limite && (
                        <li>Tempo Limite: <strong>{quizData.quiz.tempo_limite} minutos</strong></li>
                      )}
                      <li>Tipo: <strong>Múltipla Escolha</strong></li>
                    </ul>
                  </div>
                </div>
                
                <div className="alert alert-warning">
                  <h6><i className="bi bi-exclamation-triangle me-2"></i>Atenção!</h6>
                  <ul className="mb-0">
                    <li>Este quiz é obrigatório para concluir o módulo</li>
                    <li>Você precisa de {quizData.quiz.pontuacao_minima}% para aprovação</li>
                    <li>Somente após aprovação você poderá acessar o próximo módulo</li>
                    <li>Você pode tentar novamente se não for aprovado</li>
                  </ul>
                </div>
                
                <div className="d-grid">
                  <button 
                    className="btn btn-success btn-lg"
                    onClick={handleIniciarQuiz}  
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Iniciar Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          {/* Cabeçalho com Timer */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">{quizData.quiz.titulo}</h4>
                  <p className="text-muted mb-0">
                    Curso: {quizData.quiz.curso_titulo}
                  </p>
                </div>
                
                <div className="d-flex align-items-center">
                  <div className="me-4">
                    <small className="text-muted d-block">Progresso</small>
                    <small>
                      {Object.values(respostas).filter(r => r !== null).length} de {quizData.perguntas.length} respondidas
                    </small>
                  </div>
                  
                  {tempoRestante !== null && (
                    <div className={`alert ${tempoRestante < 60 ? 'alert-danger' : 'alert-warning'} mb-0 py-2`}>
                      <i className="bi bi-clock me-2"></i>
                      <strong>Tempo Restante:</strong> {formatarTempo(tempoRestante)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Perguntas */}
          <div className="row">
            <div className="col-lg-8">
              {quizData.perguntas.map((pergunta, index) => (
                <div key={pergunta.id} className="card mb-4" id={`pergunta-${index}`}>
                  <div className="card-header">
                    <h5 className="mb-0">
                      Pergunta {index + 1} de {quizData.perguntas.length}
                      {pergunta.pontos > 1 && (
                        <span className="badge bg-info ms-2">{pergunta.pontos} pontos</span>
                      )}
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="lead mb-4">{pergunta.enunciado}</p>
                    
                    <div className="list-group">
                      {pergunta.opcoes.map(opcao => (
                        <button
                          key={opcao.id}
                          className={`list-group-item list-group-item-action text-start ${
                            respostas[pergunta.id] === opcao.id ? 'active' : ''
                          }`}
                          onClick={() => handleRespostaChange(pergunta.id, opcao.id)}
                        >
                          <div className="d-flex align-items-center">
                            <div className={`rounded-circle border d-flex align-items-center justify-content-center me-3 ${
                              respostas[pergunta.id] === opcao.id ? 'border-white' : 'border-primary'
                            }`} style={{ width: '24px', height: '24px' }}>
                              {String.fromCharCode(65 + pergunta.opcoes.indexOf(opcao))}
                            </div>
                            <span className={respostas[pergunta.id] === opcao.id ? 'text-white' : ''}>
                              {opcao.texto}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Sidebar com Sumário */}
            <div className="col-lg-4">
              <div className="card sticky-top" style={{ top: '20px' }}>
                <div className="card-header">
                  <h5 className="mb-0">Sumário</h5>
                </div>
                <div className="card-body">
                  <div className="row row-cols-4 g-2 mb-4">
                    {quizData.perguntas.map((pergunta, index) => (
                      <div key={pergunta.id} className="col">
                        <button
                          className={`btn btn-sm w-100 ${
                            respostas[pergunta.id] 
                              ? 'btn-success' 
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => {
                            document.getElementById(`pergunta-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          title={`Pergunta ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={handleSubmeterQuiz}
                      disabled={submetendo}
                    >
                      {submetendo ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submetendo...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Submeter Quiz
                        </>
                      )}
                    </button>
                    
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja sair? Seu progresso será perdido.')) {
                          router.push(`/student/curso/${quizData.quiz.curso_id}`);
                        }
                      }}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Sair do Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}