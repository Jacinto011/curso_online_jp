import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../../lib/api';

export default function NovoCurso() {
  const { user, isInstructor } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    preco: '0',
    gratuito: false,
    duracao_estimada: '',
    categoria: '',
    nivel: 'iniciante',
    imagem_url: ''
  });

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

  useEffect(() => {
    if (!isInstructor) {
      router.push('/auth/login');
    }
  }, [isInstructor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      const cursoData = {
        ...formData,
        preco: parseFloat(formData.preco) || 0,
        duracao_estimada: formData.duracao_estimada ? parseInt(formData.duracao_estimada) : null
      };

      const response = await api.post('/instructor/cursos', cursoData);
      
      if (response.data.success) {
        setSucesso('Curso criado com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push(`/instructor/cursos/${response.data.curso.id}`);
        }, 2000);
      } else {
        setErro(response.data.message || 'Erro ao criar curso');
      }
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      setErro(error.response?.data?.message || 'Erro ao criar curso');
    } finally {
      setLoading(false);
    }
  };


  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setErro('Por favor, selecione apenas imagens (JPG, PNG, GIF, etc.)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB
    setErro('A imagem deve ter no máximo 5MB');
    return;
  }

  try {
    setUploadingImage(true);
    setErro('');
    
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    console.log('📤 Iniciando upload da imagem do curso...');
    
    // ✅ REMOVER AUTHORIZATION HEADER
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
      // NÃO enviar headers de Authorization
    });

    const data = await response.json();
    console.log('📥 Resposta do upload:', data);
    
    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`);
    }

    if (data.success) {
      // ✅ Usar a URL real do Cloudinary
      const cloudinaryUrl = data.file.url;
      
      setFormData(prev => ({
        ...prev,
        imagem_url: cloudinaryUrl
      }));
      setSucesso('Imagem enviada com sucesso!');
      
      console.log('✅ Imagem enviada para Cloudinary:', cloudinaryUrl);
    } else {
      setErro(data.message || 'Erro ao enviar imagem');
    }
  } catch (error) {
    console.error('❌ Erro no upload da imagem:', error);
    setErro(error.message || 'Erro ao enviar imagem. Tente novamente.');
  } finally {
    setUploadingImage(false);
    e.target.value = ''; // Resetar input file
  }
};



  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(valor);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-1">Criar Novo Curso</h1>
              <p className="text-muted mb-0">
                Preencha os dados do seu novo curso
              </p>
            </div>
            <Link href="/instructor/cursos" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar para Meus Cursos
            </Link>
          </div>

          {/* Mensagens */}
          {sucesso && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {sucesso}
              <button type="button" className="btn-close" onClick={() => setSucesso('')}></button>
            </div>
          )}
          
          {erro && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {erro}
              <button type="button" className="btn-close" onClick={() => setErro('')}></button>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Título */}
                <div className="mb-4">
                  <label htmlFor="titulo" className="form-label fw-semibold">
                    Título do Curso *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Ex: JavaScript Moderno do Zero ao Avançado"
                    required
                  />
                  <small className="form-text text-muted">
                    Crie um título claro e atrativo para seu curso
                  </small>
                </div>

                {/* Descrição */}
                <div className="mb-4">
                  <label htmlFor="descricao" className="form-label fw-semibold">
                    Descrição do Curso *
                  </label>
                  <textarea
                    className="form-control"
                    id="descricao"
                    name="descricao"
                    rows="4"
                    value={formData.descricao}
                    onChange={handleChange}
                    placeholder="Descreva o que os alunos vão aprender neste curso..."
                    required
                  />
                  <small className="form-text text-muted">
                    Seja detalhado sobre o conteúdo, objetivos e benefícios do curso
                  </small>
                </div>

                {/* Imagem do Curso */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Imagem de Capa do Curso
                  </label>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="input-group">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage && (
                          <span className="input-group-text">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          </span>
                        )}
                      </div>
                      <small className="form-text text-muted">
                        Tamanho recomendado: 1280x720px. Máximo: 5MB
                      </small>
                      {uploadingImage && (
                        <div className="mt-2">
                          <div className="progress">
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated" 
                              style={{ width: '100%' }}
                            >
                              Enviando imagem...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      {formData.imagem_url ? (
                        <div className="mt-2">
                          <div className="card">
                            <div className="card-body p-2">
                              <div className="d-flex align-items-center">
                                <img 
                                  src={formData.imagem_url} 
                                  alt="Prévia da imagem do curso" 
                                  className="img-thumbnail me-3"
                                  style={{ width: '100px', height: '70px', objectFit: 'cover' }}
                                />
                                <div className="flex-grow-1">
                                  <p className="mb-1 small text-truncate">
                                    <strong>Imagem carregada:</strong>
                                  </p>
                                  <p className="mb-0 small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                    {formData.imagem_url}
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setFormData(prev => ({ ...prev, imagem_url: '' }))}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-center">
                          <div className="border rounded p-4 text-muted">
                            <i className="bi bi-image fs-1 d-block mb-2"></i>
                            <small>Nenhuma imagem selecionada</small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preço e Tipo */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title fw-semibold mb-3">Configurações de Preço</h6>
                        
                        <div className="form-check form-switch mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="gratuito"
                            name="gratuito"
                            checked={formData.gratuito}
                            onChange={handleChange}
                            role="switch"
                          />
                          <label className="form-check-label fw-medium" htmlFor="gratuito">
                            Curso Gratuito
                          </label>
                        </div>
                        
                        {!formData.gratuito && (
                          <div>
                            <label htmlFor="preco" className="form-label fw-semibold">
                              Preço do Curso
                            </label>
                            <div className="input-group">
                              <span className="input-group-text">MZN</span>
                              <input
                                type="number"
                                className="form-control"
                                id="preco"
                                name="preco"
                                value={formData.preco}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                disabled={formData.gratuito}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="mt-2">
                              <span className="badge bg-info">
                                {formatarMoeda(parseFloat(formData.preco) || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-title fw-semibold mb-3">Detalhes do Curso</h6>
                        
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="duracao_estimada" className="form-label fw-semibold">
                              Duração (horas)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              id="duracao_estimada"
                              name="duracao_estimada"
                              value={formData.duracao_estimada}
                              onChange={handleChange}
                              min="1"
                              placeholder="Ex: 20"
                            />
                          </div>
                          
                          <div className="col-md-6 mb-3">
                            <label htmlFor="nivel" className="form-label fw-semibold">
                              Nível
                            </label>
                            <select
                              className="form-select"
                              id="nivel"
                              name="nivel"
                              value={formData.nivel}
                              onChange={handleChange}
                            >
                              <option value="iniciante">Iniciante</option>
                              <option value="intermediario">Intermediário</option>
                              <option value="avancado">Avançado</option>
                              <option value="todos">Todos os Níveis</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categoria */}
                <div className="mb-4">
                  <div className="card">
                    <div className="card-body">
                      <label htmlFor="categoria" className="form-label fw-semibold">
                        Categoria do Curso *
                      </label>
                      <select
                        className="form-select"
                        id="categoria"
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecione uma categoria...</option>
                        {categorias.map((categoria, index) => (
                          <option key={index} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                      <small className="form-text text-muted">
                        Escolha a categoria que melhor descreve seu curso
                      </small>
                      
                      {formData.categoria && (
                        <div className="mt-2">
                          <span className="badge bg-primary">
                            <i className="bi bi-tag me-1"></i>
                            {formData.categoria}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumo do Curso */}
                <div className="mb-4">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title fw-semibold mb-3">Resumo do Curso</h6>
                      <div className="row">
                        <div className="col-md-3 mb-2">
                          <div className="border rounded p-2 text-center">
                            <div className="text-muted small">Status</div>
                            <div className="fw-semibold">
                              <span className="badge bg-warning">Rascunho</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 mb-2">
                          <div className="border rounded p-2 text-center">
                            <div className="text-muted small">Preço</div>
                            <div className="fw-semibold">
                              {formData.gratuito ? 'Gratuito' : formatarMoeda(parseFloat(formData.preco) || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 mb-2">
                          <div className="border rounded p-2 text-center">
                            <div className="text-muted small">Nível</div>
                            <div className="fw-semibold text-capitalize">{formData.nivel}</div>
                          </div>
                        </div>
                        <div className="col-md-3 mb-2">
                          <div className="border rounded p-2 text-center">
                            <div className="text-muted small">Categoria</div>
                            <div className="fw-semibold">
                              {formData.categoria || 'Não selecionada'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => router.push('/instructor/cursos')}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancelar
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-info me-2"
                      onClick={() => {
                        // Salvar como rascunho
                        console.log('Salvar como rascunho:', formData);
                        alert('Funcionalidade de salvar como rascunho em desenvolvimento');
                      }}
                    >
                      <i className="bi bi-save me-2"></i>
                      Salvar Rascunho
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      disabled={loading || !formData.titulo || !formData.categoria}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Criando Curso...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Criar Curso
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Validação */}
                {(!formData.titulo || !formData.categoria) && (
                  <div className="alert alert-warning mt-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Preencha o <strong>título</strong> e a <strong>categoria</strong> para criar o curso.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}