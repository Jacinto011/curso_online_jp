import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function CursoEstudante() {
  const { isStudent } = useAuth();
  const router = useRouter();
  const { id: cursoId } = router.query;
  
  const [cursoData, setCursoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduloAtivo, setModuloAtivo] = useState(null);
  const [materialAtivo, setMaterialAtivo] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('modulos'); // 'modulos', 'materiais', 'conteudo'
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    if (!isStudent || !cursoId) {
      router.push('/auth/login');
      return;
    }
    fetchCursoConteudo();
  }, [isStudent, cursoId]);

  const fetchCursoConteudo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/curso/${cursoId}/conteudo`);
      
      setCursoData(response.data?.data || []);
      
      // Encontrar primeiro módulo disponível
      const primeiroModuloDisponivel = response.data.data?.modulos.find(m => 
        m.modulo_anterior_concluido === 1 || m.ordem === 1
      );
      
      if (primeiroModuloDisponivel) {
        setModuloAtivo(primeiroModuloDisponivel.id);
        // Encontrar primeiro material não concluído
        const primeiroMaterial = primeiroModuloDisponivel.materiais.find(m => !m.concluido);
        if (primeiroMaterial) {
          setMaterialAtivo(primeiroMaterial.id);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
      if (error.response?.status === 403) {
        router.push('/student/cursos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para verificar se pode avançar
  const verificarSePodeAvançar = (modulo) => {
    if (!modulo) return false;
    
    // Verifica se todos os materiais estão concluídos
    const todosMateriaisConcluidos = modulo.materiais.every(m => m.concluido);
    
    // Se tem quiz, verificar se foi aprovado
    if (modulo.quiz_id) {
      return todosMateriaisConcluidos && modulo.quiz_aprovado;
    }
    
    return todosMateriaisConcluidos;
  };

  // Função auxiliar para verificar se módulo está disponível
  const verificarModuloDisponivel = (modulo) => {
    // Se for o primeiro módulo, está sempre disponível
    if (modulo.ordem === 1) return true;
    
    // Verificar se o módulo anterior foi concluído
    const moduloAnterior = cursoData.modulos.find(m => m.ordem === modulo.ordem - 1);
    if (!moduloAnterior) return true;
    
    return verificarSePodeAvançar(moduloAnterior);


  };

const handleMaterialConcluido = async (materialId) => {
  try {
    setMensagem(null);
    
    const response = await api.post('/student/progresso/registrar', {
      matricula_id: cursoData.matricula.id,
      modulo_id: moduloAtivo,
      material_id: materialId
    });

    const data = response.data;
    
    // Sempre mostrar a mensagem do backend
    if (data.message) {
      setMensagem({ 
        tipo: data.success ? 'success' : 'info', 
        texto: data.message 
      });
    }

    // Se precisa de quiz, oferecer para ir direto
    if (data.needQuiz && data.quizId) {
      setTimeout(() => {
        if (confirm('Deseja realizar o quiz agora?')) {
          router.push(`/student/quiz/${data.quizId}`);
        }
      }, 1000);
    }

    // Se curso concluído, mostrar certificado
    if (data.cursoConcluido && data.certificadoUrl) {
      setTimeout(() => {
        if (confirm('Parabéns! Você concluiu o curso! Deseja visualizar seu certificado?')) {
          window.open(data.certificadoUrl, '_blank');
        }
      }, 1000);
    }
    
    // Recarregar conteúdo
    await fetchCursoConteudo();

    // Avançar para o próximo material se não for o último ou se não precisar de quiz
    if (data.success && !data.needQuiz) {
      const modulo = cursoData.modulos.find(m => m.id === moduloAtivo);
      const currentMaterialIndex = modulo.materiais.findIndex(m => m.id === materialId);
      
      // Se não for o último material, avançar
      if (!data.isLastMaterial && currentMaterialIndex < modulo.materiais.length - 1) {
        const nextMaterial = modulo.materiais[currentMaterialIndex + 1];
        setMaterialAtivo(nextMaterial.id);
        
        if (window.innerWidth < 768) {
          setAbaAtiva('conteudo');
        }
      } 
      // Se módulo foi concluído, ir para próximo módulo
      else if (data.moduloConcluido) {
        const currentModuloIndex = cursoData.modulos.findIndex(m => m.id === moduloAtivo);
        
        if (currentModuloIndex < cursoData.modulos.length - 1) {
          const nextModulo = cursoData.modulos[currentModuloIndex + 1];
          
          if (verificarModuloDisponivel(nextModulo)) {
            setModuloAtivo(nextModulo.id);
            const primeiroMaterial = nextModulo.materiais.find(m => !m.concluido);
            setMaterialAtivo(primeiroMaterial?.id || null);
            
            if (window.innerWidth < 768) {
              setAbaAtiva('materiais');
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao registrar progresso:', error);
    if (error.response?.data?.message) {
      setMensagem({ tipo: 'danger', texto: error.response.data.message });
    } else {
      setMensagem({ tipo: 'danger', texto: 'Erro ao registrar progresso. Tente novamente.' });
    }
  }
};

  const handleModuloChange = (moduloId) => {
    const modulo = cursoData.modulos.find(m => m.id === moduloId);
    
    // Verificar se módulo está disponível
    const isAvailable = verificarModuloDisponivel(modulo);
    
    if (!isAvailable) {
      setMensagem({ 
        tipo: 'warning', 
        texto: 'Complete o módulo anterior primeiro!' 
      });
      return;
    }

    // Verificar se módulo atual tem quiz não aprovado
    if (moduloAtivo) {
      const moduloAtualObj = cursoData.modulos.find(m => m.id === moduloAtivo);
      const isCurrentModuleCompleted = verificarSePodeAvançar(moduloAtualObj);

      if (!isCurrentModuleCompleted && moduloAtualObj?.quiz_id && !moduloAtualObj?.quiz_aprovado) {
        setMensagem({ 
          tipo: 'warning', 
          texto: 'Você precisa aprovar no quiz do módulo atual antes de mudar de módulo!' 
        });
        return;
      }
    }

    setModuloAtivo(moduloId);
    setMensagem(null);
    
    // Encontrar primeiro material não concluído
    const primeiroMaterial = modulo.materiais.find(m => !m.concluido);
    setMaterialAtivo(primeiroMaterial?.id || null);
    
    // Em mobile, muda para aba de materiais
    if (window.innerWidth < 768) {
      setAbaAtiva('materiais');
    }
  };

  const handleMaterialSelect = (materialId) => {
    setMaterialAtivo(materialId);
    setMensagem(null);
    
    // Em mobile, muda para aba de conteúdo
    if (window.innerWidth < 768) {
      setAbaAtiva('conteudo');
    }
  };

  // Funções para o botão de próximo
  const handleNextButton = () => {
    setMensagem(null);
    
    if (abaAtiva === 'modulos') {
      setAbaAtiva('materiais');
    } else if (abaAtiva === 'materiais') {
      setAbaAtiva('conteudo');
    } else if (abaAtiva === 'conteudo' && materialAtual && !materialAtual.concluido) {
      handleMaterialConcluido(materialAtual.id);
    }
  };

  const isNextButtonDisabled = () => {
    if (abaAtiva === 'modulos') return false;
    if (abaAtiva === 'materiais') return !moduloAtual;
    if (abaAtiva === 'conteudo') return !materialAtual || materialAtual.concluido;
    return false;
  };

  const getNextButtonText = () => {
    if (abaAtiva === 'modulos') return 'Próximo';
    if (abaAtiva === 'materiais') return 'Ver Conteúdo';
    if (abaAtiva === 'conteudo') {
      return materialAtual?.concluido ? 'Concluído' : 'Marcar como Concluído';
    }
    return 'Próximo';
  };

  if (loading || !cursoData) {
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

  const moduloAtual = cursoData.modulos.find(m => m.id === moduloAtivo);
  const materialAtual = moduloAtual?.materiais?.find(m => m.id === materialAtivo);

  return (
    <div className="container-fluid" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <style jsx>{`
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .bloqueado {
          opacity: 0.5;
          cursor: not-allowed;
          position: relative;
        }
        
        .bloqueado::after {
          content: "🔒";
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
        }
        
        .quiz-pendente {
          border: 2px solid #ffc107;
          animation: border-pulse 2s infinite;
        }
        
        @keyframes border-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
        }
      `}</style>
      
      {/* Header do Curso - Visível em todas as telas */}
      <div className="bg-white border-bottom py-3">
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div className="mb-2 mb-md-0">
              <h4 className="mb-1">{cursoData.curso.titulo}</h4>
              <div className="d-flex align-items-center">
                <div className="progress flex-grow-1 me-3" style={{ height: '6px', width: '200px' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${cursoData.progresso.percentual}%` }}
                  ></div>
                </div>
                <small className="text-muted">
                  {cursoData.progresso.modulosConcluidos}/{cursoData.progresso.totalModulos} módulos
                </small>
              </div>
            </div>
            <Link href="/student/cursos" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1"></i>
              Voltar aos Cursos
            </Link>
          </div>
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {mensagem && (
        <div className="container mt-3">
          <div className={`alert alert-${mensagem.tipo} alert-dismissible fade show`} role="alert">
            {mensagem.texto}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setMensagem(null)}
            ></button>
          </div>
        </div>
      )}

      {/* Navegação Mobile */}
      <div className="d-block d-md-none border-bottom">
        <div className="nav nav-tabs nav-fill">
          <button 
            className={`nav-link ${abaAtiva === 'modulos' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('modulos')}
          >
            <i className="bi bi-list-ul me-1"></i>
            Módulos
          </button>
          <button 
            className={`nav-link ${abaAtiva === 'materiais' ? 'active' : ''} ${!moduloAtual ? 'disabled' : ''}`}
            onClick={() => moduloAtual && setAbaAtiva('materiais')}
            disabled={!moduloAtual}
          >
            <i className="bi bi-file-text me-1"></i>
            Materiais
          </button>
          <button 
            className={`nav-link ${abaAtiva === 'conteudo' ? 'active' : ''} ${!materialAtual ? 'disabled' : ''}`}
            onClick={() => materialAtual && setAbaAtiva('conteudo')}
            disabled={!materialAtual}
          >
            <i className="bi bi-play-circle me-1"></i>
            Conteúdo
          </button>
        </div>
      </div>

      <div className="row" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {/* Sidebar de Módulos - Desktop */}
        <div className="col-md-3 col-lg-2 border-end p-0 d-none d-md-block" style={{ overflowY: 'auto' }}>
          <div className="p-3">
            <h6 className="mb-3">Módulos</h6>
            <div className="list-group list-group-flush">
              {cursoData.modulos.map(modulo => {
                const disponivel = verificarModuloDisponivel(modulo);
                const moduloCompleto = verificarSePodeAvançar(modulo);
                const temQuizPendente = modulo.quiz_id && !modulo.quiz_aprovado && modulo.materiais.every(m => m.concluido);
                
                return (
                  <button
                    key={modulo.id}
                    className={`list-group-item list-group-item-action border-0 rounded mb-1 ${
                      moduloAtivo === modulo.id ? 'bg-primary text-white' : ''
                    } ${!disponivel ? 'bloqueado' : ''} ${temQuizPendente ? 'quiz-pendente' : ''}`}
                    onClick={() => disponivel && handleModuloChange(modulo.id)}
                    disabled={!disponivel}
                  >
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                        moduloAtivo === modulo.id ? 'bg-white text-primary' : 'bg-light'
                      }`} style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>
                        {modulo.ordem}
                      </div>
                      <div className="text-start flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`small ${moduloAtivo === modulo.id ? 'text-white' : ''}`}>
                            {modulo.titulo}
                          </span>
                          <div>
                            {moduloCompleto ? (
                              <i className="bi bi-check-circle text-success"></i>
                            ) : temQuizPendente ? (
                              <i className="bi bi-exclamation-triangle text-warning"></i>
                            ) : null}
                          </div>
                        </div>
                        <small className={`d-block ${moduloAtivo === modulo.id ? 'text-white opacity-75' : 'text-muted'}`}>
                          {modulo.materiais?.length || 0} materiais
                          {temQuizPendente && ' • Quiz pendente'}
                        </small>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar de Materiais - Desktop */}
        <div className="col-md-3 col-lg-2 border-end p-0 d-none d-md-block" style={{ overflowY: 'auto' }}>
          {moduloAtual ? (
            <div className="p-3">
              <h6 className="mb-3">{moduloAtual.titulo}</h6>
              <small className="text-muted d-block mb-3">
                {moduloAtual.materiais.filter(m => m.concluido).length} de {moduloAtual.materiais.length} concluídos
                {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && (
                  <span className="text-warning d-block">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Quiz pendente
                  </span>
                )}
              </small>
              
              <div className="list-group list-group-flush">
                {moduloAtual.materiais.map(material => (
                  <button
                    key={material.id}
                    className={`list-group-item list-group-item-action border-0 rounded mb-1 d-flex align-items-start ${
                      materialAtivo === material.id ? 'bg-light' : ''
                    }`}
                    onClick={() => handleMaterialSelect(material.id)}
                  >
                    <div className="d-flex align-items-center w-100">
                      <i className={`bi bi-${
                        material.tipo === 'video' ? 'play-circle' :
                        material.tipo === 'documento' ? 'file-earmark-text' :
                        material.tipo === 'link' ? 'link' : 'text-paragraph'
                      } me-2 ${material.concluido ? 'text-success' : 'text-primary'}`}></i>
                      <div className="text-start flex-grow-1">
                        <small className={materialAtivo === material.id ? 'fw-bold' : ''}>
                          {material.titulo}
                        </small>
                        <div>
                          <small className={`${material.concluido ? 'text-success' : 'text-muted'}`}>
                            {material.concluido && (
                              <><i className="bi bi-check-circle me-1"></i>Concluído</>
                            )}
                          </small>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Botão do Quiz se existir */}
              {moduloAtual.quiz_id && (
                <div className="mt-4">
                  <Link 
                    href={`/student/quiz/${moduloAtual.quiz_id}`}
                    className={`btn btn-quiz-pendente btn-${moduloAtual.quiz_aprovado ? 'success' : 'warning'} w-100 ${
                      !moduloAtual.quiz_aprovado && moduloAtual.materiais.every(m => m.concluido) ? 'quiz-pendente' : ''
                    }`}
                  >
                    <i className="bi bi-question-circle me-2"></i>
                    {moduloAtual.quiz_aprovado ? 'Quiz Aprovado' : (
                      moduloAtual.materiais.every(m => m.concluido) ? 'Realizar Quiz Agora!' : 'Quiz (disponível após materiais)'
                    )}
                  </Link>
                  
                  {!moduloAtual.quiz_aprovado && moduloAtual.materiais.every(m => m.concluido) && (
                    <small className="text-warning d-block mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Você precisa aprovar no quiz para avançar
                    </small>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 text-center">
              <i className="bi bi-info-circle text-muted" style={{ fontSize: '2rem' }}></i>
              <p className="text-muted mt-2">Selecione um módulo</p>
            </div>
          )}
        </div>

        {/* Conteúdo Principal - Desktop */}
        <div className="col-md-6 col-lg-8 p-0 d-none d-md-block" style={{ overflowY: 'auto' }}>
          {renderConteudoPrincipal()}
        </div>

        {/* Conteúdo Mobile - Baseado na aba ativa */}
        <div className="col-12 p-0 d-block d-md-none">
          {abaAtiva === 'modulos' && renderModulosMobile()}
          {abaAtiva === 'materiais' && renderMateriaisMobile()}
          {abaAtiva === 'conteudo' && renderConteudoMobile()}
        </div>
      </div>

      {/* Footer Fixo */}
      <div className="bg-white border-top py-2">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {moduloAtual && materialAtual && (
                <>
                  {moduloAtual.titulo} • {materialAtual.titulo}
                </>
              )}
            </small>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={handleNextButton}
              disabled={isNextButtonDisabled()}
            >
              {getNextButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Funções para renderizar conteúdo específico
  function renderModulosMobile() {
    return (
      <div className="p-3" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        <h5 className="mb-3">Módulos do Curso</h5>
        <div className="list-group">
          {cursoData.modulos.map(modulo => {
            const disponivel = verificarModuloDisponivel(modulo);
            const moduloCompleto = verificarSePodeAvançar(modulo);
            const temQuizPendente = modulo.quiz_id && !modulo.quiz_aprovado && modulo.materiais.every(m => m.concluido);
            
            return (
              <button
                key={modulo.id}
                className={`list-group-item list-group-item-action mb-2 ${
                  moduloAtivo === modulo.id ? 'active' : ''
                } ${!disponivel ? 'bloqueado' : ''} ${temQuizPendente ? 'quiz-pendente' : ''}`}
                onClick={() => disponivel && handleModuloChange(modulo.id)}
                disabled={!disponivel}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                      moduloAtivo === modulo.id ? 'bg-white text-primary' : 'bg-light'
                    }`}
                         style={{ width: '32px', height: '32px' }}>
                      <strong>{modulo.ordem}</strong>
                    </div>
                    <div className="text-start">
                      <div className="fw-bold">{modulo.titulo}</div>
                      <small className="text-muted">
                        {modulo.materiais?.length || 0} materiais
                        {moduloCompleto ? ' • Concluído' : ''}
                        {temQuizPendente ? ' • Quiz pendente' : ''}
                      </small>
                    </div>
                  </div>
                  <div>
                    {moduloCompleto ? (
                      <i className="bi bi-check-circle text-success"></i>
                    ) : temQuizPendente ? (
                      <i className="bi bi-exclamation-triangle text-warning"></i>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMateriaisMobile() {
    if (!moduloAtual) {
      return (
        <div className="p-3 text-center">
          <i className="bi bi-info-circle text-muted" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted mt-2">Selecione um módulo primeiro</p>
        </div>
      );
    }

    return (
      <div className="p-3" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <button 
              className="btn btn-link text-decoration-none p-0"
              onClick={() => setAbaAtiva('modulos')}
            >
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
            <h5 className="mt-2">{moduloAtual.titulo}</h5>
          </div>
          <small className="text-muted">
            {moduloAtual.materiais.filter(m => m.concluido).length}/{moduloAtual.materiais.length}
            {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && (
              <span className="text-warning d-block">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Quiz pendente
              </span>
            )}
          </small>
        </div>

        <div className="list-group">
          {moduloAtual.materiais.map(material => (
            <button
              key={material.id}
              className={`list-group-item list-group-item-action mb-2 d-flex justify-content-between align-items-center ${
                materialAtivo === material.id ? 'active' : ''
              }`}
              onClick={() => handleMaterialSelect(material.id)}
            >
              <div className="d-flex align-items-center">
                <i className={`bi bi-${
                  material.tipo === 'video' ? 'play-circle' :
                  material.tipo === 'documento' ? 'file-earmark-text' :
                  material.tipo === 'link' ? 'link' : 'text-paragraph'
                } me-3 ${material.concluido ? 'text-success' : 'text-primary'}`}
                style={{ fontSize: '1.2rem' }}></i>
                <div className="text-start">
                  <div className="fw-bold">{material.titulo}</div>
                  <small className={`${material.concluido ? 'text-success' : 'text-muted'}`}>
                    {material.concluido ? 'Concluído' : material.tipo}
                  </small>
                </div>
              </div>
              {material.concluido && (
                <i className="bi bi-check-circle text-success"></i>
              )}
            </button>
          ))}
        </div>

        {/* Quiz do módulo */}
        {moduloAtual.quiz_id && (
          <div className="mt-4">
            <Link 
              href={`/student/quiz/${moduloAtual.quiz_id}`}
              className={`btn btn-quiz-pendente btn-${moduloAtual.quiz_aprovado ? 'success' : 'warning'} w-100 ${
                !moduloAtual.quiz_aprovado && moduloAtual.materiais.every(m => m.concluido) ? 'quiz-pendente' : ''
              }`}
            >
              <i className="bi bi-question-circle me-2"></i>
              {moduloAtual.quiz_aprovado ? 'Quiz Aprovado' : (
                moduloAtual.materiais.every(m => m.concluido) ? 'Realizar Quiz Agora!' : 'Quiz (disponível após materiais)'
              )}
            </Link>
            
            {!moduloAtual.quiz_aprovado && moduloAtual.materiais.every(m => m.concluido) && (
              <small className="text-warning d-block mt-2 text-center">
                <i className="bi bi-info-circle me-1"></i>
                Você precisa aprovar no quiz para avançar para o próximo módulo
              </small>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderConteudoMobile() {
    if (!materialAtual) {
      return (
        <div className="p-3 text-center">
          <i className="bi bi-info-circle text-muted" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted mt-2">Selecione um material</p>
        </div>
      );
    }

    return (
      <div className="p-3" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        <div className="mb-3">
          <button 
            className="btn btn-link text-decoration-none p-0 mb-2"
            onClick={() => setAbaAtiva('materiais')}
          >
            <i className="bi bi-arrow-left"></i> Voltar
          </button>
          <h5 className="mt-2">{materialAtual.titulo}</h5>
          <small className="text-muted">
            Módulo {moduloAtual.ordem}: {moduloAtual.titulo}
            {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && (
              <span className="text-warning d-block">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Quiz pendente neste módulo
              </span>
            )}
          </small>
        </div>

        {/* Conteúdo do Material */}
        {renderMaterialConteudo(materialAtual)}
        
        {/* Aviso sobre quiz */}
        {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && 
         moduloAtual.materiais.filter(m => m.concluido).length === moduloAtual.materiais.length - 1 &&
         !materialAtual.concluido && (
          <div className="alert alert-warning mt-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Atenção:</strong> Este é o último material do módulo. Após concluí-lo, você precisará realizar o quiz para poder avançar.
          </div>
        )}
      </div>
    );
  }

  function renderConteudoPrincipal() {
    if (!moduloAtual) {
      return (
        <div className="h-100 d-flex flex-column justify-content-center align-items-center">
          <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 mb-2">Selecione um módulo</h4>
          <p className="text-muted">Escolha um módulo na barra lateral para começar</p>
        </div>
      );
    }

    if (!materialAtual && moduloAtual.materiais.length > 0) {
      return (
        <div className="h-100 d-flex flex-column justify-content-center align-items-center">
          <i className="bi bi-folder text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 mb-2">Selecione um material</h4>
          <p className="text-muted">Escolha um material na barra lateral para visualizar</p>
          {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && 
           moduloAtual.materiais.every(m => m.concluido) && (
            <div className="alert alert-warning mt-3">
              <i className="bi bi-question-circle me-2"></i>
              Todos os materiais concluídos! Agora realize o quiz para completar este módulo.
            </div>
          )}
        </div>
      );
    }

    if (!materialAtual) {
      return (
        <div className="h-100 d-flex flex-column justify-content-center align-items-center">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 mb-2">Todos os materiais concluídos!</h4>
          {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && (
            <div className="text-center">
              <p className="text-muted mb-3">Você precisa realizar o quiz para completar este módulo</p>
              <Link 
                href={`/student/quiz/${moduloAtual.quiz_id}`}
                className="btn btn-warning btn-lg"
              >
                <i className="bi bi-question-circle me-2"></i>
                Realizar Quiz
              </Link>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4>{materialAtual.titulo}</h4>
            <p className="text-muted mb-0">
              Módulo {moduloAtual.ordem}: {moduloAtual.titulo}
            </p>
            {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && 
             moduloAtual.materiais.filter(m => m.concluido).length === moduloAtual.materiais.length - 1 &&
             !materialAtual.concluido && (
              <small className="text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Último material - Quiz obrigatório após conclusão
              </small>
            )}
          </div>
          
          {!materialAtual.concluido && (
            <button 
              className="btn btn-success"
              onClick={() => handleMaterialConcluido(materialAtual.id)}
            >
              <i className="bi bi-check-circle me-2"></i>
              Marcar como Concluído
            </button>
          )}
        </div>

        {/* Conteúdo do Material */}
        {renderMaterialConteudo(materialAtual)}
      </div>
    );
  }

  function renderMaterialConteudo(material) {
    return (
      <div className="card">
        <div className="card-body">
          {material.tipo === 'video' && material.url ? (
            <div className="ratio ratio-16x9 mb-4">
              <video 
                controls 
                controlsList="nodownload" 
                className="w-100 rounded"
                onContextMenu={(e) => e.preventDefault()}
                disablePictureInPicture
                disableRemotePlayback
              >
                <source src={material.url} type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>
          ) : material.tipo === 'documento' && material.url ? (
            <div className="text-center py-4">
              <i className="bi bi-file-earmark-text text-primary" style={{ fontSize: '5rem' }}></i>
              <h5 className="mt-3">Documento: {material.titulo}</h5>
              <p className="text-muted">Faça download do documento para visualizar</p>
              <a 
                href={material.url} 
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-download me-2"></i>
                Baixar Documento
              </a>
            </div>
          ) : material.tipo === 'link' && material.url ? (
            <div className="alert alert-info">
              <h5><i className="bi bi-link me-2"></i>Link Externo</h5>
              <p>Este material contém um link externo. Clique abaixo para acessar:</p>
              <a 
                href={material.url} 
                className="btn btn-outline-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-box-arrow-up-right me-2"></i>
                Acessar Link: {material.url}
              </a>
            </div>
          ) : material.tipo === 'texto' && material.conteudo ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: material.conteudo }} />
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
              <h4 className="mt-3 mb-2">Conteúdo não disponível</h4>
              <p className="text-muted">Este material não possui conteúdo para exibição</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}