import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function GerenciarModulos() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const { id: cursoId } = router.query;
  
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    ordem: 1
  });

  useEffect(() => {
    if (!isInstructor || !cursoId) {
      router.push('/auth/login');
      return;
    }
    fetchDados();
  }, [isInstructor, cursoId]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [cursoRes, modulosRes] = await Promise.all([
        api.get(`/instructor/cursos/${cursoId}`),
        api.get(`/instructor/modulos?curso_id=${cursoId}`)
      ]);
      
      
      
      setCurso(cursoRes.data?.data || []);
      setModulos(modulosRes.data?.data || []);
      
      // Definir próxima ordem
      const maxOrdem = modulosRes.data.length > 0 
        ? Math.max(...modulosRes.data.map(m => m.ordem))
        : 0;
      setFormData(prev => ({ ...prev, ordem: maxOrdem + 1 }));
      
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
      [name]: name === 'ordem' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await api.put(`/instructor/modulos/${editando}`, {
          ...formData,
          curso_id: cursoId
        });
      } else {
        await api.post('/instructor/modulos', {
          ...formData,
          curso_id: cursoId
        });
      }
      
      setShowForm(false);
      setEditando(null);
      setFormData({ titulo: '', descricao: '', ordem: modulos.length + 1 });
      fetchDados();
      
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      alert('Erro ao salvar módulo');
    }
  };

  const handleEditar = (modulo) => {
    setEditando(modulo.id);
    setFormData({
      titulo: modulo.titulo,
      descricao: modulo.descricao || '',
      ordem: modulo.ordem
    });
    setShowForm(true);
  };

  const handleExcluir = async (moduloId) => {
    if (!window.confirm('Tem certeza que deseja excluir este módulo? Todos os materiais serão excluídos também.')) {
      return;
    }

    try {
      await api.delete(`/instructor/modulos/${moduloId}`);
      fetchDados();
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      alert('Erro ao excluir módulo');
    }
  };

  const handleReorder = async (moduloId, novaOrdem) => {
    try {
      await api.put(`/instructor/modulos/${moduloId}/reorder`, { ordem: novaOrdem });
      fetchDados();
    } catch (error) {
      console.error('Erro ao reordenar:', error);
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
              <h1 className="mb-1">Módulos do Curso</h1>
              <p className="text-muted mb-0">
                {curso.titulo}
              </p>
            </div>
            <div>
              <Link href={`/instructor/cursos/${cursoId}`} className="btn btn-outline-primary me-2">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar ao Curso
              </Link>
              {!showForm && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Novo Módulo
                </button>
              )}
            </div>
          </div>

          {/* Formulário de Módulo */}
          {showForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  {editando ? 'Editar Módulo' : 'Novo Módulo'}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label htmlFor="titulo" className="form-label">Título *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="titulo"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Introdução ao JavaScript"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="ordem" className="form-label">Ordem</label>
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
                      placeholder="Descreva o conteúdo deste módulo..."
                    />
                  </div>
                  
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setEditando(null);
                        setFormData({ titulo: '', descricao: '', ordem: modulos.length + 1 });
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      <i className="bi bi-save me-2"></i>
                      {editando ? 'Atualizar' : 'Salvar'} Módulo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Módulos */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                Módulos ({modulos.length})
                <small className="text-muted ms-2">
                  Arraste para reordenar ou clique para gerenciar materiais
                </small>
              </h5>
            </div>
            <div className="card-body">
              {modulos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-folder text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">Nenhum módulo criado</h4>
                  <p className="text-muted">Crie seu primeiro módulo para começar a adicionar conteúdo</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Criar Primeiro Módulo
                  </button>
                </div>
              ) : (
                <div className="list-group">
                  {modulos.sort((a, b) => a.ordem - b.ordem).map((modulo, index) => (
                    <div key={modulo.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ width: '40px', height: '40px' }}>
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="mb-1">{modulo.titulo}</h5>
                            {modulo.descricao && (
                              <p className="mb-0 text-muted small">{modulo.descricao}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="btn-group">
                          <Link
                            href={`/instructor/cursos/${cursoId}/modulos/${modulo.id}/materiais`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="bi bi-folder me-1"></i>
                            Materiais
                          </Link>
                          
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleEditar(modulo)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleExcluir(modulo.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          
                          {/* Controles de reordenação */}
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleReorder(modulo.id, modulo.ordem - 1)}
                              disabled={modulo.ordem <= 1}
                            >
                              <i className="bi bi-arrow-up"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleReorder(modulo.id, modulo.ordem + 1)}
                              disabled={modulo.ordem >= modulos.length}
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