// src/pages/instructor/cursos/[cursoId]/quizzes/novo.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../../../lib/api';

export default function NovoQuiz() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const  cursoId  = router.query.id;
  
  const [curso, setCurso] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    modulo_id: '',
    titulo: '',
    descricao: '',
    pontuacao_minima: 70,
    tempo_limite: ''
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
      
      setCurso(cursoRes.data?.data || cursoRes.data);
      setModulos(modulosRes.data?.data || modulosRes.data);
      
      // Selecionar primeiro módulo
      if (modulosRes.data?.data?.length > 0 || modulosRes.data?.length > 0) {
        const modulosArray = modulosRes.data?.data || modulosRes.data;
        setFormData(prev => ({ 
          ...prev, 
          modulo_id: modulosArray[0].id,
          titulo: `Quiz - Módulo ${modulosArray[0].ordem}`
        }));
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

    setSubmitting(true);

    try {
      const response = await api.post('/instructor/quizzes', formData);
      
      if (response.data.success) {
        alert('Quiz criado com sucesso!');
        // Redirecionar para a página de perguntas do quiz criado
        router.push(`/instructor/cursos/${cursoId}/quizzes/${response.data.data.id}/perguntas`);
      }
      
    } catch (error) {
      console.error('Erro ao criar quiz:', error);
      alert(error.response?.data?.message || 'Erro ao criar quiz');
      setSubmitting(false);
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
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          {/* Cabeçalho */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-1">Criar Novo Quiz</h1>
              <p className="text-muted mb-0">
                {curso.titulo}
              </p>
            </div>
            <div>
              <Link href={`/instructor/cursos/${cursoId}/quizzes`} className="btn btn-outline-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar
              </Link>
            </div>
          </div>

          {/* Formulário de Quiz */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Informações do Quiz</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
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
                    {modulos.map(modulo => (
                      <option key={modulo.id} value={modulo.id}>
                        Módulo {modulo.ordem}: {modulo.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
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
                
                <div className="row mb-3">
                  <div className="col-md-6">
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
                  
                  <div className="col-md-6">
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
                  <Link
                    href={`/instructor/cursos/${cursoId}/quizzes`}
                    className="btn btn-outline-secondary"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Criando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Criar Quiz
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="card mt-4">
            <div className="card-body">
              <h6 className="mb-3">Informações Importantes:</h6>
              <ul className="mb-0 text-muted">
                <li>Após criar o quiz, você será redirecionado para adicionar perguntas</li>
                <li>Cada quiz deve ter pelo menos 2 perguntas</li>
                <li>A pontuação mínima padrão é 70%</li>
                <li>O tempo limite é opcional</li>
                <li>Você poderá editar o quiz a qualquer momento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}