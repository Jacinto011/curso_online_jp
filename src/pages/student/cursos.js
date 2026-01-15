import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

export default function CursosEstudante() {
  const { user, isStudent } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState({
    disponiveis: [],
    matriculados: []
  });
  const [loading, setLoading] = useState(true);
  const [matriculando, setMatriculando] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [categoria, setCategoria] = useState('');
  const [nivel, setNivel] = useState('');

  useEffect(() => {
    if (!isStudent) {
      router.push('/auth/login');
      return;
    }
    fetchCursos();
  }, [isStudent]);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/cursos');
     // console.log(response.data);
      
      setCursos(response.data?.data || { disponiveis: [], matriculados: [] });
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cursosFiltrados = () => {
    let lista = [];
    
    if (filtro === 'matriculados') {
      lista = cursos.matriculados.map(item => ({
        ...item.curso,
        isMatriculado: true,
        matricula: item.matricula,
        progresso: item.progresso,
        total_modulos: item.total_modulos,
        modulos_concluidos: item.modulos_concluidos
      }));
    } else if (filtro === 'disponiveis') {
      lista = cursos.disponiveis.map(curso => ({
        ...curso,
        isMatriculado: false
      }));
    } else {
      // Todos: combinando matriculados e disponíveis
      const matriculados = cursos.matriculados.map(item => ({
        ...item.curso,
        isMatriculado: true,
        matricula: item.matricula,
        progresso: item.progresso,
        total_modulos: item.total_modulos,
        modulos_concluidos: item.modulos_concluidos
      }));
      
      const disponiveis = cursos.disponiveis.map(curso => ({
        ...curso,
        isMatriculado: false
      }));
      
      lista = [...matriculados, ...disponiveis];
    }
    
    // Aplicar filtros adicionais
    return lista.filter(curso => {
      const matchesCategoria = !categoria || curso.categoria === categoria;
      const matchesNivel = !nivel || curso.nivel === nivel;
      return matchesCategoria && matchesNivel;
    });
  };

  if (loading) {
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

  return (
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Cursos</h1>

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label htmlFor="filtro" className="form-label">Mostrar</label>
                  <select
                    className="form-select"
                    id="filtro"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  >
                    <option value="todos">Todos os Cursos</option>
                    <option value="matriculados">Meus Cursos</option>
                    <option value="disponiveis">Cursos Disponíveis</option>
                  </select>
                </div>
                
                <div className="col-md-3 mb-3">
                  <label htmlFor="categoria" className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    id="categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="">Todas as Categorias</option>
                    <option value="Programação">Programação</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Negócios">Negócios</option>
                  </select>
                </div>
                
                <div className="col-md-3 mb-3">
                  <label htmlFor="nivel" className="form-label">Nível</label>
                  <select
                    className="form-select"
                    id="nivel"
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                  >
                    <option value="">Todos os Níveis</option>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </div>
                
                <div className="col-md-3 mb-3 d-flex align-items-end">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setFiltro('todos');
                      setCategoria('');
                      setNivel('');
                    }}
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cursos */}
          <div className="row">
            {cursosFiltrados().length === 0 ? (
              <div className="col-12">
                <div className="text-center py-5">
                  <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 mb-2">
                    {filtro === 'matriculados' 
                      ? 'Nenhum curso matriculado' 
                      : filtro === 'disponiveis'
                      ? 'Nenhum curso disponível'
                      : 'Nenhum curso encontrado'}
                  </h4>
                  <p className="text-muted">
                    {filtro === 'matriculados'
                      ? 'Você ainda não está matriculado em nenhum curso.'
                      : filtro === 'disponiveis'
                      ? 'Não há cursos disponíveis com os filtros selecionados.'
                      : 'Não há cursos com os filtros selecionados.'}
                  </p>
                </div>
              </div>
            ) : (
              cursosFiltrados().map(curso => (
                <div key={curso.id} className="col-md-4 col-lg-3 mb-4">
                  <div className="card h-100">
                    {curso.imagem_url && (
                      <img 
                        src={curso.imagem_url} 
                        className="card-img-top" 
                        alt={curso.titulo}
                        style={{ height: '150px', objectFit: 'cover' }}
                      />
                    )}
                    <div className="card-body d-flex flex-column">
                      <div className="mb-2">
                        <span className={`badge ${curso.gratuito ? 'bg-success' : 'bg-warning'} me-2`}>
                          {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco || 0).toFixed(2)}`}
                        </span>
                        <span className="badge bg-secondary me-2">{curso.nivel}</span>
                        {curso.isMatriculado && (
                          <span className={`badge ${curso.matricula?.status === 'concluida' ? 'bg-success' : 'bg-info'}`}>
                            {curso.matricula?.status === 'concluida' ? 'Concluído' : 'Matriculado'}
                          </span>
                        )}
                      </div>
                      
                      <h5 className="card-title">{curso.titulo}</h5>
                      <p className="card-text text-muted small flex-grow-1">
                        {curso.descricao?.substring(0, 80) || 'Sem descrição'}...
                      </p>
                      
                      {curso.isMatriculado && curso.progresso > 0 && (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Progresso</small>
                            <small>{curso.progresso}%</small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${curso.progresso}%` }}
                              aria-valuenow={curso.progresso}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between mb-2">
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            {curso.instrutor_nome}
                          </small>
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {curso.duracao_estimada || '?'}h
                          </small>
                        </div>
                        
                        {curso.isMatriculado ? (
                          <div className="d-grid">
                            <Link 
                              href={`/student/curso/${curso.id}`}
                              className="btn btn-primary"
                            >
                              {curso.matricula?.status === 'concluida' ? 'Ver Certificado' : 'Continuar'}
                            </Link>
                            {curso.matricula?.status === 'concluida' && curso.matricula?.data_conclusao && (
                              <small className="text-success text-center mt-1">
                                <i className="bi bi-check-circle me-1"></i>
                                Concluído em {new Date(curso.matricula.data_conclusao).toLocaleDateString('pt-BR')}
                              </small>
                            )}
                          </div>
                        ) : (
                          <div className="d-grid">
                            <Link 
                              href={`/cursos/${curso.id}`}
                              className="btn btn-outline-secondary"
                            >
                              Ver detalhes
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}