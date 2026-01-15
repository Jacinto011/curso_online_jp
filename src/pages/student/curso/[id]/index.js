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
      //console.log(response.data?.data || []);
      
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

  const handleMaterialConcluido = async (materialId) => {
    try {
      await api.post('/student/progresso/registrar', {
        matricula_id: cursoData.matricula.id,
        modulo_id: moduloAtivo,
        material_id: materialId
      });
      
      // Recarregar conteúdo
      fetchCursoConteudo();
      
    } catch (error) {
      console.error('Erro ao registrar progresso:', error);
    }
  };

  const handleModuloChange = (moduloId) => {
    const modulo = cursoData.modulos.find(m => m.id === moduloId);
    
    // Verificar se módulo está disponível
    if (modulo.ordem === 1 || modulo.modulo_anterior_concluido === 1) {
      setModuloAtivo(moduloId);
      
      // Encontrar primeiro material não concluído
      const primeiroMaterial = modulo.materiais.find(m => !m.concluido);
      setMaterialAtivo(primeiroMaterial?.id || null);
      
      // Em mobile, muda para aba de materiais
      if (window.innerWidth < 768) {
        setAbaAtiva('materiais');
      }
    } else {
      alert('Complete o módulo anterior primeiro!');
    }
  };

  const handleMaterialSelect = (materialId) => {
    setMaterialAtivo(materialId);
    
    // Em mobile, muda para aba de conteúdo
    if (window.innerWidth < 768) {
      setAbaAtiva('conteudo');
    }
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
                const disponivel = modulo.ordem === 1 || modulo.modulo_anterior_concluido === 1;
                
                return (
                  <button
                    key={modulo.id}
                    className={`list-group-item list-group-item-action border-0 rounded mb-1 ${
                      moduloAtivo === modulo.id ? 'bg-primary text-white' : ''
                    } ${!disponivel ? 'opacity-50' : ''}`}
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
                          {modulo.concluido && (
                            <i className="bi bi-check-circle text-success"></i>
                          )}
                        </div>
                        <small className={`d-block ${moduloAtivo === modulo.id ? 'text-white opacity-75' : 'text-muted'}`}>
                          {modulo.materiais?.length || 0} materiais
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
                    className={`btn btn-${moduloAtual.quiz_aprovado ? 'success' : 'warning'} w-100`}
                  >
                    <i className="bi bi-question-circle me-2"></i>
                    {moduloAtual.quiz_aprovado ? 'Quiz Aprovado' : 'Realizar Quiz'}
                  </Link>
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
              onClick={() => {
                if (abaAtiva === 'modulos') setAbaAtiva('materiais');
                if (abaAtiva === 'materiais') setAbaAtiva('conteudo');
                if (abaAtiva === 'conteudo' && materialAtual && !materialAtual.concluido) {
                  handleMaterialConcluido(materialAtual.id);
                }
              }}
              disabled={abaAtiva === 'conteudo' && (!materialAtual || materialAtual.concluido)}
            >
              {abaAtiva === 'modulos' && 'Próximo'}
              {abaAtiva === 'materiais' && 'Ver Conteúdo'}
              {abaAtiva === 'conteudo' && (materialAtual?.concluido ? 'Concluído' : 'Marcar como Concluído')}
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
            const disponivel = modulo.ordem === 1 || modulo.modulo_anterior_concluido === 1;
            
            return (
              <button
                key={modulo.id}
                className={`list-group-item list-group-item-action mb-2 ${
                  moduloAtivo === modulo.id ? 'active' : ''
                } ${!disponivel ? 'opacity-50' : ''}`}
                onClick={() => disponivel && handleModuloChange(modulo.id)}
                disabled={!disponivel}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                         style={{ width: '32px', height: '32px' }}>
                      <strong>{modulo.ordem}</strong>
                    </div>
                    <div className="text-start">
                      <div className="fw-bold">{modulo.titulo}</div>
                      <small className="text-muted">
                        {modulo.materiais?.length || 0} materiais
                        {modulo.concluido && ' • Concluído'}
                      </small>
                    </div>
                  </div>
                  {modulo.concluido && (
                    <i className="bi bi-check-circle text-success"></i>
                  )}
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
              className={`btn btn-${moduloAtual.quiz_aprovado ? 'success' : 'warning'} w-100`}
            >
              <i className="bi bi-question-circle me-2"></i>
              {moduloAtual.quiz_aprovado ? 'Quiz Aprovado' : 'Realizar Quiz'}
            </Link>
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
          </small>
        </div>

        {/* Conteúdo do Material */}
        {renderMaterialConteudo(materialAtual)}
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
        </div>
      );
    }

    if (!materialAtual) {
      return (
        <div className="h-100 d-flex flex-column justify-content-center align-items-center">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
          <h4 className="mt-3 mb-2">Todos os materiais concluídos!</h4>
          {moduloAtual.quiz_id && !moduloAtual.quiz_aprovado && (
            <Link 
              href={`/student/quiz/${moduloAtual.quiz_id}`}
              className="btn btn-warning mt-2"
            >
              <i className="bi bi-question-circle me-2"></i>
              Realizar Quiz
            </Link>
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