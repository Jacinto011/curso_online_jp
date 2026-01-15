import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../../../lib/api';

export default function GerenciarMateriais() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const { id: cursoId, moduloId } = router.query;
  
  const [curso, setCurso] = useState(null);
  const [modulo, setModulo] = useState(null);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'video',
    url: '',
    conteudo: '',
    horas: 0,
    minutos: 0,
    segundos: 0,
    ordem: 1
  });

  useEffect(() => {
    if (!isInstructor || !cursoId || !moduloId) {
      router.push('/auth/login');
      return;
    }
    fetchDados();
  }, [isInstructor, cursoId, moduloId]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [cursoRes, moduloRes, materiaisRes] = await Promise.all([
        api.get(`/instructor/cursos/${cursoId}`),
        api.get(`/instructor/modulos/${moduloId}`),
        api.get(`/instructor/materiais?modulo_id=${moduloId}`)
      ]);
      
      setCurso(cursoRes.data?.data || []);
      setModulo(moduloRes.data?.data || []);
      setMateriais(materiaisRes.data?.data || []);

      const maxOrdem = materiaisRes.data.length > 0 
        ? Math.max(...materiaisRes.data.map(m => m.ordem))
        : 0;
      setFormData(prev => ({ ...prev, ordem: maxOrdem + 1 }));
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.response?.status === 404) {
        router.push(`/instructor/cursos/${cursoId}/modulos`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Converter segundos para horas, minutos, segundos
  const segundosParaHMS = (segundosTotais) => {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;
    return { horas, minutos, segundos };
  };

  // Converter horas, minutos, segundos para segundos totais
  const HMSParaSegundos = (horas, minutos, segundos) => {
    return (horas * 3600) + (minutos * 60) + segundos;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'horas' || name === 'minutos' || name === 'segundos') {
      const numValue = parseInt(value) || 0;
      
      // Validações
      if (name === 'horas' && numValue < 0) return;
      if (name === 'minutos' && (numValue < 0 || numValue > 59)) return;
      if (name === 'segundos' && (numValue < 0 || numValue > 59)) return;
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (parseInt(value) || 0) : value
      }));
    }
  };

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file, file.name);

      // ✅ REMOVER AUTHORIZATION HEADER
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
        // NÃO enviar headers de Authorization
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          url: data.file.url,
          tipo: fileType
        }));
        
        alert('Arquivo enviado com sucesso!');
      } else {
        alert(data.message || 'Erro ao enviar arquivo');
      }
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      alert('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo) {
      alert('Título é obrigatório');
      return;
    }

    if (formData.tipo === 'video' && !formData.url) {
      alert('Por favor, faça upload do vídeo');
      return;
    }

    if (formData.tipo === 'documento' && !formData.url) {
      alert('Por favor, faça upload do documento');
      return;
    }

    try {
      // Converter HMS para segundos
      const duracaoEmSegundos = formData.tipo === 'video' 
        ? HMSParaSegundos(formData.horas, formData.minutos, formData.segundos)
        : null;

      const materialData = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        url: formData.url,
        conteudo: formData.conteudo,
        duracao: duracaoEmSegundos,
        ordem: formData.ordem,
        modulo_id: moduloId
      };

      if (editando) {
        await api.put(`/instructor/materiais/${editando}`, materialData);
      } else {
        await api.post('/instructor/materiais', materialData);
      }
      
      setShowForm(false);
      setEditando(null);
      setFormData({
        titulo: '',
        tipo: 'video',
        url: '',
        conteudo: '',
        horas: 0,
        minutos: 0,
        segundos: 0,
        ordem: materiais.length + 1
      });
      fetchDados();
      
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      alert('Erro ao salvar material');
    }
  };

  const handleEditar = (material) => {
    setEditando(material.id);
    const { horas, minutos, segundos } = segundosParaHMS(material.duracao || 0);
    
    setFormData({
      titulo: material.titulo,
      tipo: material.tipo,
      url: material.url || '',
      conteudo: material.conteudo || '',
      horas: horas,
      minutos: minutos,
      segundos: segundos,
      ordem: material.ordem
    });
    setShowForm(true);
  };

  const handleExcluir = async (materialId) => {
    if (!window.confirm('Tem certeza que deseja excluir este material?')) {
      return;
    }

    try {
      await api.delete(`/instructor/materiais/${materialId}`);
      fetchDados();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      alert('Erro ao excluir material');
    }
  };

  const handleReorder = async (materialId, novaOrdem) => {
    try {
      await api.put(`/instructor/materiais/${materialId}/reorder`, { ordem: novaOrdem });
      fetchDados();
    } catch (error) {
      console.error('Erro ao reordenar:', error);
    }
  };

  const getTipoIcone = (tipo) => {
    switch (tipo) {
      case 'video': return 'bi-play-circle';
      case 'documento': return 'bi-file-earmark-text';
      case 'link': return 'bi-link';
      case 'texto': return 'bi-text-paragraph';
      default: return 'bi-file-earmark';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'video': return 'Vídeo';
      case 'documento': return 'Documento';
      case 'link': return 'Link Externo';
      case 'texto': return 'Texto';
      default: return 'Material';
    }
  };

  const formatarDuracao = (segundosTotais) => {
    if (!segundosTotais) return '--:--';
    
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    } else {
      return `${minutos}:${segundos.toString().padStart(2, '0')}`;
    }
  };

  if (loading || !curso || !modulo) {
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
              <h1 className="mb-1">Materiais do Módulo</h1>
              <p className="text-muted mb-0">
                {curso.titulo} → {modulo.titulo}
              </p>
            </div>
            <div>
              <Link href={`/instructor/cursos/${cursoId}/modulos`} className="btn btn-outline-primary me-2">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar aos Módulos
              </Link>
              {!showForm && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Novo Material
                </button>
              )}
            </div>
          </div>

          {/* Formulário de Material */}
          {showForm && (
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className={`bi ${getTipoIcone(formData.tipo)} me-2`}></i>
                  {editando ? 'Editar Material' : 'Novo Material'}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label htmlFor="titulo" className="form-label fw-semibold">Título *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Introdução ao React"
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label htmlFor="ordem" className="form-label fw-semibold">Ordem</label>
                      <input
                        type="number"
                        className="form-control"
                        id="ordem"
                        name="ordem"
                        value={formData.ordem}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label htmlFor="tipo" className="form-label fw-semibold">Tipo</label>
                      <select
                        className="form-select"
                        id="tipo"
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                      >
                        <option value="video">Vídeo</option>
                        <option value="documento">Documento</option>
                        <option value="link">Link</option>
                        <option value="texto">Texto</option>
                      </select>
                    </div>
                  </div>

                  {/* Campo específico por tipo */}
                  {formData.tipo === 'video' && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Upload de Vídeo</label>
                      <div>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={(e) => handleFileUpload(e, 'video')}
                            disabled={uploading}
                          />
                          {uploading && (
                            <span className="input-group-text">
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            </span>
                          )}
                        </div>
                        <small className="form-text text-muted">
                          Formatos: MP4, WebM, OGG, MOV. Máximo: 200MB
                        </small>
                        {formData.url && (
                          <div className="mt-2">
                            <div className="alert alert-success">
                              <i className="bi bi-check-circle me-2"></i>
                              Vídeo enviado: {formData.url.split('/').pop()}
                            </div>
                            
                            {/* Seletor de duração */}
                            <div className="card mt-2">
                              <div className="card-body">
                                <label className="form-label fw-semibold">Duração do Vídeo *</label>
                                <div className="row">
                                  <div className="col-md-4 mb-2">
                                    <label className="form-label">Horas</label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      name="horas"
                                      value={formData.horas}
                                      onChange={handleChange}
                                      min="0"
                                      max="99"
                                      placeholder="0"
                                    />
                                  </div>
                                  <div className="col-md-4 mb-2">
                                    <label className="form-label">Minutos</label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      name="minutos"
                                      value={formData.minutos}
                                      onChange={handleChange}
                                      min="0"
                                      max="59"
                                      placeholder="0"
                                    />
                                  </div>
                                  <div className="col-md-4 mb-2">
                                    <label className="form-label">Segundos</label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      name="segundos"
                                      value={formData.segundos}
                                      onChange={handleChange}
                                      min="0"
                                      max="59"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <span className="badge bg-info">
                                    Duração total: {formatarDuracao(HMSParaSegundos(formData.horas, formData.minutos, formData.segundos))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.tipo === 'documento' && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Upload de Documento</label>
                      <div>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                            onChange={(e) => handleFileUpload(e, 'documento')}
                            disabled={uploading}
                          />
                          {uploading && (
                            <span className="input-group-text">
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            </span>
                          )}
                        </div>
                        <small className="form-text text-muted">
                          Formatos: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT. Máximo: 10MB
                        </small>
                        {formData.url && (
                          <div className="mt-2">
                            <div className="alert alert-success">
                              <i className="bi bi-check-circle me-2"></i>
                              Documento enviado: {formData.url.split('/').pop()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.tipo === 'link' && (
                    <div className="mb-3">
                      <label htmlFor="url" className="form-label fw-semibold">URL do Link *</label>
                      <input
                        type="url"
                        className="form-control"
                        id="url"
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        required
                        placeholder="https://exemplo.com/aula"
                      />
                    </div>
                  )}

                  {formData.tipo === 'texto' && (
                    <div className="mb-3">
                      <label htmlFor="conteudo" className="form-label fw-semibold">Conteúdo Textual *</label>
                      <textarea
                        className="form-control"
                        id="conteudo"
                        name="conteudo"
                        rows="8"
                        value={formData.conteudo}
                        onChange={handleChange}
                        required
                        placeholder="Digite o conteúdo textual da aula..."
                      />
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setEditando(null);
                        setFormData({
                          titulo: '',
                          tipo: 'video',
                          url: '',
                          conteudo: '',
                          horas: 0,
                          minutos: 0,
                          segundos: 0,
                          ordem: materiais.length + 1
                        });
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          {editando ? 'Atualizar' : 'Salvar'} Material
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Materiais */}
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-collection me-2"></i>
                Materiais ({materiais.length})
                <small className="text-muted ms-2">
                  Organize o conteúdo do módulo
                </small>
              </h5>
            </div>
            <div className="card-body">
              {materiais.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-file-earmark text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum material criado</h4>
                  <p className="text-muted">Adicione vídeos, documentos ou textos para este módulo</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Adicionar Material
                  </button>
                </div>
              ) : (
                <div className="list-group">
                  {materiais.sort((a, b) => a.ordem - b.ordem).map((material, index) => (
                    <div key={material.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <i className={`bi ${getTipoIcone(material.tipo)} text-primary`} style={{ fontSize: '1.5rem' }}></i>
                          </div>
                          <div>
                            <div className="d-flex align-items-center mb-1">
                              <h5 className="mb-0 me-2">{material.titulo}</h5>
                              <span className="badge bg-secondary">
                                {getTipoLabel(material.tipo)}
                              </span>
                              <span className="badge bg-light text-dark ms-2">
                                Ordem: {material.ordem}
                              </span>
                            </div>
                            <div className="d-flex align-items-center">
                              {material.tipo === 'video' && material.duracao && (
                                <span className="badge bg-info me-2">
                                  <i className="bi bi-clock me-1"></i>
                                  {formatarDuracao(material.duracao)}
                                </span>
                              )}
                              {material.url && (
                                <small className="text-muted text-truncate" style={{ maxWidth: '300px' }}>
                                  <i className="bi bi-link me-1"></i>
                                  {material.url}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleEditar(material)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleExcluir(material.id)}
                            title="Excluir"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          
                          {/* Controles de reordenação */}
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleReorder(material.id, material.ordem - 1)}
                              disabled={material.ordem <= 1}
                              title="Mover para cima"
                            >
                              <i className="bi bi-arrow-up"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleReorder(material.id, material.ordem + 1)}
                              disabled={material.ordem >= materiais.length}
                              title="Mover para baixo"
                            >
                              <i className="bi bi-arrow-down"></i>
                            </button>
                          </div>
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