import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

export default function CatalogoCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    categoria: '',
    nivel: '',
    preco: 'todos',
    search: ''
  });

  useEffect(() => {
    fetchCursos();
  }, [filtros.categoria, filtros.nivel, filtros.preco]);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: 'publicado',
        categoria: filtros.categoria,
        nivel: filtros.nivel,
        preco: filtros.preco !== 'todos' ? filtros.preco : '',
        search: filtros.search
      }).toString();
      
      const response = await api.get(`/cursos?${params}`);
      //console.log(response.data.cursos);
      
      setCursos(response.data.cursos);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCursos();
  };

  return (
    <div className="container-fluid py-5">
      {/* Hero Section */}
      <div className="row mb-5">
        <div className="col-12 text-center">
          <h1 className="display-4 mb-3">Descubra Seu Próximo Curso</h1>
          <p className="lead mb-4">
            Aprenda com especialistas e desenvolva novas habilidades
          </p>
          
          {/* Barra de Pesquisa */}
          <form onSubmit={handleSearch} className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="input-group input-group-lg">
                <input
                  type="text"
                  className="form-control"
                  placeholder="O que você quer aprender hoje?"
                  value={filtros.search}
                  onChange={(e) => setFiltros({...filtros, search: e.target.value})}
                />
                <button className="btn btn-primary" type="submit">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Filtros */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    value={filtros.categoria}
                    onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                  >
                    <option value="">Todas as categorias</option>
                    <option value="programacao">Programação</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="negocios">Negócios</option>
                    <option value="ti">TI e Software</option>
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Nível</label>
                  <select
                    className="form-select"
                    value={filtros.nivel}
                    onChange={(e) => setFiltros({...filtros, nivel: e.target.value})}
                  >
                    <option value="">Todos os níveis</option>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Preço</label>
                  <select
                    className="form-select"
                    value={filtros.preco}
                    onChange={(e) => setFiltros({...filtros, preco: e.target.value})}
                  >
                    <option value="todos">Todos os preços</option>
                    <option value="gratuito">Grátis</option>
                    <option value="pago">Pagos</option>
                  </select>
                </div>
                
                <div className="col-md-3 d-flex align-items-end">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setFiltros({
                      categoria: '',
                      nivel: '',
                      preco: 'todos',
                      search: ''
                    })}
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cursos */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-search text-muted" style={{ fontSize: '4rem' }}></i>
          <h3 className="mt-3">Nenhum curso encontrado</h3>
          <p className="text-muted">Tente ajustar seus filtros de busca</p>
        </div>
      ) : (
        <>
          <div className="row mb-4">
            <div className="col-12">
              <h2>{cursos.length} cursos encontrados</h2>
            </div>
          </div>
          
          <div className="row">
            {cursos.map(curso => (
              <div key={curso.id} className="col-md-6 col-lg-4 col-xl-3 mb-4">
                <div className="card h-100 shadow-sm hover-shadow">
                  {curso.imagem_url && (
                    <div style={{ height: '180px', overflow: 'hidden' }}>
                      <img 
                        src={curso.imagem_url} 
                        className="card-img-top" 
                        alt={curso.titulo}
                        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <div className="mb-2">
                      <span className={`badge bg-${curso.gratuito ? 'success' : 'warning'} me-2`}>
                        {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                      </span>
                      <span className="badge bg-info">{curso.nivel}</span>
                    </div>
                    
                    <h5 className="card-title">{curso.titulo}</h5>
                    <p className="card-text text-muted flex-grow-1">
                      {curso.descricao?.substring(0, 100)}...
                    </p>
                    
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          {curso.instrutor_nome}
                        </small>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {curso.duracao_estimada || 'N/A'}h
                        </small>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">
                            <i className="bi bi-people me-1"></i>
                            {curso.total_matriculas || 0} alunos
                          </small>
                        </div>
                        
                        <Link 
                          href={`/cursos/${curso.id}`}
                          className="btn btn-sm btn-primary"
                        >
                          Ver Curso
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Categorias Populares */}
      <div className="row mt-5">
        <div className="col-12">
          <h3 className="mb-4">Categorias Populares</h3>
          <div className="row g-3">
            {[
              { nome: 'Programação', cursos: 24, cor: 'primary' },
              { nome: 'Design', cursos: 18, cor: 'success' },
              { nome: 'Marketing', cursos: 15, cor: 'warning' },
              { nome: 'Negócios', cursos: 12, cor: 'info' },
              { nome: 'TI', cursos: 8, cor: 'danger' },
              { nome: 'Data Science', cursos: 6, cor: 'secondary' }
            ].map((cat, idx) => (
              <div key={idx} className="col-md-4 col-lg-2">
                <div className={`card bg-${cat.cor} bg-opacity-10 border-${cat.cor} border-2 text-center py-4`}>
                  <h5 className="mb-2">{cat.nome}</h5>
                  <p className="mb-0 text-muted">{cat.cursos} cursos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}