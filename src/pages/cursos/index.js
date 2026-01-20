import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

// Lista de categorias atualizada
const categorias = [
  'Programação',
  'Design',
  'Marketing',
  'Negócios',
  'TI e Software',
  'Desenvolvimento Pessoal',
  'Finanças',
  'Saúde e Fitness',
  'Música',
  'Fotografia',
  'Idiomas',
  'Outro'
];

// Note: A API retorna "Programacao" sem acento e "Desenvolvimento Pessoal" com acento
// Vamos criar um mapeamento para padronizar
const mapeamentoCategoriasAPI = {
  'Programacao': 'Programação',
  'Programação': 'Programação',
  'Design': 'Design',
  'Marketing': 'Marketing',
  'Negócios': 'Negócios',
  'TI e Software': 'TI e Software',
  'Desenvolvimento Pessoal': 'Desenvolvimento Pessoal',
  'Finanças': 'Finanças',
  'Saúde e Fitness': 'Saúde e Fitness',
  'Música': 'Música',
  'Fotografia': 'Fotografia',
  'Idiomas': 'Idiomas',
  'Outro': 'Outro'
};

// Normalizar categoria da API para o formato padrão
const normalizarCategoria = (categoriaAPI) => {
  if (!categoriaAPI) return '';
  
  // Verifica se já está no formato correto
  if (categorias.includes(categoriaAPI)) {
    return categoriaAPI;
  }
  
  // Tenta mapear
  return mapeamentoCategoriasAPI[categoriaAPI] || categoriaAPI;
};

export default function CatalogoCursos() {
  const [cursos, setCursos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    categoria: '',
    nivel: '',
    preco: 'todos',
    search: ''
  });

  // Carregar todos os cursos para contagem
  useEffect(() => {
    fetchTodosCursos();
  }, []);

  // Carregar cursos filtrados
  useEffect(() => {
    fetchCursosFiltrados();
  }, [filtros.categoria, filtros.nivel, filtros.preco]);

  const fetchTodosCursos = async () => {
    try {
      const response = await api.get('/cursos?status=publicado');
      setTodosCursos(response.data.cursos || []);
    } catch (error) {
      console.error('Erro ao carregar todos os cursos:', error);
    }
  };

  const fetchCursosFiltrados = async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      params.append('status', 'publicado');
      
      // IMPORTANTE: Enviar a categoria exatamente como está na API
      // Se filtros.categoria estiver vazio, não enviar o parâmetro
      if (filtros.categoria && filtros.categoria.trim() !== '') {
        // Reverter para o formato da API
        let categoriaAPI = filtros.categoria;
        
        // Mapeamento reverso (do formato exibido para o formato da API)
        if (categoriaAPI === 'Programação') {
          categoriaAPI = 'Programacao'; // API usa sem acento
        }
        
        params.append('categoria', categoriaAPI);
      }
      
      if (filtros.nivel) {
        params.append('nivel', filtros.nivel);
      }
      
      if (filtros.preco && filtros.preco !== 'todos') {
        if (filtros.preco === 'gratuito') {
          params.append('gratuito', 'true');
        } else if (filtros.preco === 'pago') {
          params.append('gratuito', 'false');
        }
      }
      
      if (filtros.search) {
        params.append('search', filtros.search);
      }
      
      console.log('Buscando cursos com filtros:', {
        categoria: filtros.categoria,
        params: params.toString()
      });
      
      const response = await api.get(`/cursos?${params.toString()}`);
      console.log('Resposta da API:', response.data.cursos);
      setCursos(response.data.cursos || []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para contar cursos por categoria
  const contarCursosPorCategoria = () => {
    const contagem = {};
    
    // Inicializar todas as categorias com 0
    categorias.forEach(categoria => {
      contagem[categoria] = 0;
    });
    
    // Contar cursos
    todosCursos.forEach(curso => {
      if (curso.categoria) {
        // Normalizar a categoria do curso
        const categoriaNormalizada = normalizarCategoria(curso.categoria);
        
        if (categorias.includes(categoriaNormalizada)) {
          contagem[categoriaNormalizada] = (contagem[categoriaNormalizada] || 0) + 1;
        } else {
          // Se não estiver na lista, contar como "Outro"
          contagem['Outro'] = (contagem['Outro'] || 0) + 1;
        }
      }
    });
    
    return contagem;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCursosFiltrados();
  };

  const handleClearFilters = () => {
    setFiltros({
      categoria: '',
      nivel: '',
      preco: 'todos',
      search: ''
    });
  };

  // Obter contagem de cursos por categoria
  const contagemCategorias = contarCursosPorCategoria();
  
  // Ordenar categorias por popularidade (mais cursos primeiro)
  const categoriasPopulares = categorias
    .filter(categoria => contagemCategorias[categoria] > 0)
    .sort((a, b) => contagemCategorias[b] - contagemCategorias[a])
    .slice(0, 6); // Pegar as 6 mais populares

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
                    {categorias.map((categoria, index) => (
                      <option 
                        key={index} 
                        value={categoria}
                      >
                        {categoria} ({contagemCategorias[categoria] || 0})
                      </option>
                    ))}
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
                    onClick={handleClearFilters}
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
          <button className="btn btn-primary mt-3" onClick={handleClearFilters}>
            Limpar Filtros
          </button>
        </div>
      ) : (
        <>
          <div className="row mb-4">
            <div className="col-12">
              <h2>{cursos.length} cursos encontrados</h2>
              {filtros.categoria && (
                <p className="text-muted">
                  Categoria: {filtros.categoria}
                </p>
              )}
              {filtros.nivel && (
                <p className="text-muted">
                  Nível: {filtros.nivel === 'iniciante' ? 'Iniciante' : 
                         filtros.nivel === 'intermediario' ? 'Intermediário' : 'Avançado'}
                </p>
              )}
              {filtros.preco && filtros.preco !== 'todos' && (
                <p className="text-muted">
                  Preço: {filtros.preco === 'gratuito' ? 'Grátis' : 'Pagos'}
                </p>
              )}
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
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholder-curso.jpg';
                        }}
                      />
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <div className="mb-2">
                      <span className={`badge bg-${curso.gratuito ? 'success' : 'warning'} me-2`}>
                        {curso.gratuito ? 'Grátis' : `MZN ${parseFloat(curso.preco).toFixed(2)}`}
                      </span>
                      <span className="badge bg-info me-1">
                        {curso.nivel === 'iniciante' ? 'Iniciante' : 
                         curso.nivel === 'intermediario' ? 'Intermediário' : 'Avançado'}
                      </span>
                      {curso.categoria && (
                        <span className="badge bg-secondary">
                          {normalizarCategoria(curso.categoria)}
                        </span>
                      )}
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
      {categoriasPopulares.length > 0 && (
        <div className="row mt-5">
          <div className="col-12">
            <h3 className="mb-4">Categorias Populares</h3>
            <div className="row g-3">
              {categoriasPopulares.map((categoria, idx) => {
                const cursosCount = contagemCategorias[categoria] || 0;
                const cores = ['primary', 'success', 'warning', 'info', 'danger', 'secondary'];
                
                return (
                  <div key={idx} className="col-md-4 col-lg-2">
                    <div 
                      className={`card bg-${cores[idx % cores.length]} bg-opacity-10 border-${cores[idx % cores.length]} border-2 text-center py-4 cursor-pointer hover-shadow`}
                      onClick={() => setFiltros({...filtros, categoria})}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <h5 className="mb-2">{categoria}</h5>
                      <p className="mb-0 text-muted">{cursosCount} curso{cursosCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}