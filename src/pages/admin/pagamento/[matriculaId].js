import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/common/Layout';
import api from '../../../lib/api';

export default function PagamentoPage() {
  const router = useRouter();
  const { matriculaId } = router.query;
  
  const [etapa, setEtapa] = useState(1); // 1: Instruções, 2: Comprovativo, 3: Sucesso
  const [instrucoes, setInstrucoes] = useState(null);
  const [pagamentoId, setPagamentoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comprovante, setComprovante] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (matriculaId && etapa === 1) {
      carregarInstrucoes();
    }
  }, [matriculaId, etapa]);

  const carregarInstrucoes = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/pagamento/instrucoes', {
        matricula_id: matriculaId
      });
      
      if (response.data.success) {
        setInstrucoes(response.data.instrucoes);
        setPagamentoId(response.data.instrucoes.pagamento_id);
      } else {
        alert(response.data.message);
        router.push('/cursos/meus-cursos');
      }
    } catch (error) {
      console.error('Erro ao carregar instruções:', error);
      alert('Erro ao carregar instruções de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, envie apenas imagens (JPG, PNG) ou PDF');
      return;
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    setComprovante(file);
  };

  const handleEnviarComprovativo = async () => {
    if (!comprovante) {
      alert('Por favor, selecione o comprovante de pagamento');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('pagamento_id', pagamentoId);
      formData.append('observacoes', observacoes);
      formData.append('comprovante', comprovante);

      const response = await api.post('/api/pagamento/enviar-comprovativo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setEtapa(3);
        setSucesso(true);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao enviar comprovativo:', error);
      alert('Erro ao enviar comprovativo');
    } finally {
      setUploading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor);
  };

  return (
    <Layout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Progresso */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-center">
                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${etapa >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                         style={{ width: '40px', height: '40px' }}>
                      <span>1</span>
                    </div>
                    <div className="small">Instruções</div>
                  </div>
                  
                  <div className="flex-grow-1 mx-3">
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar" style={{ width: etapa >= 2 ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${etapa >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                         style={{ width: '40px', height: '40px' }}>
                      <span>2</span>
                    </div>
                    <div className="small">Comprovativo</div>
                  </div>
                  
                  <div className="flex-grow-1 mx-3">
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar" style={{ width: etapa >= 3 ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${etapa >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                         style={{ width: '40px', height: '40px' }}>
                      <span>3</span>
                    </div>
                    <div className="small">Concluído</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo por etapa */}
            <div className="card">
              <div className="card-body">
                {etapa === 1 && (
                  <div>
                    <h4 className="card-title mb-4">Instruções de Pagamento</h4>
                    
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Carregando...</span>
                        </div>
                      </div>
                    ) : instrucoes ? (
                      <div>
                        <div className="alert alert-info">
                          <h5 className="alert-heading">Como proceder:</h5>
                          <ol className="mb-0">
                            <li>Faça o pagamento usando uma das opções abaixo</li>
                            <li>Guarde o comprovante da transação</li>
                            <li>No próximo passo, envie o comprovante</li>
                            <li>Aguarde a confirmação do instrutor (até 24 horas)</li>
                          </ol>
                        </div>

                        <div className="mb-4">
                          <h6>Resumo do Pedido</h6>
                          <table className="table table-bordered">
                            <tbody>
                              <tr>
                                <th>Curso</th>
                                <td>{instrucoes.curso}</td>
                              </tr>
                              <tr>
                                <th>Instrutor</th>
                                <td>{instrucoes.instrutor}</td>
                              </tr>
                              <tr>
                                <th>Valor a pagar</th>
                                <td className="fw-bold text-primary">{formatarMoeda(instrucoes.valor)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="mb-4">
                          <h6>Opções de Pagamento</h6>
                          {instrucoes.metodos.length === 0 ? (
                            <div className="alert alert-warning">
                              O instrutor ainda não configurou métodos de pagamento. Entre em contato diretamente.
                            </div>
                          ) : (
                            <div className="row">
                              {instrucoes.metodos.map((metodo, index) => (
                                <div key={index} className="col-md-6 mb-3">
                                  <div className="card h-100">
                                    <div className="card-body">
                                      <div className="d-flex align-items-center mb-3">
                                        <i className={`bi ${metodo.tipo === 'banco' ? 'bi-bank' : 'bi-phone'} fs-3 text-primary me-3`}></i>
                                        <div>
                                          <h6 className="mb-0">{metodo.nome}</h6>
                                          <small className="text-muted">{metodo.tipo === 'banco' ? 'Transferência bancária' : 'Carteira digital'}</small>
                                        </div>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <small className="text-muted d-block mb-1">Instruções:</small>
                                        <p className="mb-2">{metodo.instrucoes}</p>
                                        
                                        {metodo.dados && Object.entries(metodo.dados).map(([key, value]) => (
                                          value && (
                                            <div key={key} className="mb-1">
                                              <small className="text-muted">{key.replace('_', ' ')}:</small>
                                              <div className="fw-bold">{value}</div>
                                            </div>
                                          )
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="d-flex justify-content-between">
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => router.push('/cursos/meus-cursos')}
                          >
                            Cancelar
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => setEtapa(2)}
                            disabled={instrucoes.metodos.length === 0}
                          >
                            <i className="bi bi-arrow-right me-2"></i>
                            Próximo: Enviar Comprovativo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
                        <p className="mt-3">Não foi possível carregar as instruções de pagamento</p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => router.push('/cursos/meus-cursos')}
                        >
                          Voltar para Meus Cursos
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {etapa === 2 && (
                  <div>
                    <h4 className="card-title mb-4">Enviar Comprovativo de Pagamento</h4>
                    
                    <div className="alert alert-warning">
                      <i className="bi bi-info-circle me-2"></i>
                      Envie uma foto ou scan legível do comprovante de pagamento
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Comprovante de pagamento *</label>
                      <div className="card">
                        <div className="card-body text-center">
                          {comprovante ? (
                            <div>
                              <i className="bi bi-file-earmark-check text-success fs-1"></i>
                              <p className="mt-2 mb-1">{comprovante.name}</p>
                              <small className="text-muted">
                                {(comprovante.size / 1024).toFixed(2)} KB
                              </small>
                              <div className="mt-3">
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setComprovante(null)}
                                >
                                  <i className="bi bi-trash me-1"></i>
                                  Remover
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <i className="bi bi-cloud-arrow-up text-muted fs-1"></i>
                              <p className="mt-2 mb-1">Clique para selecionar o arquivo</p>
                              <small className="text-muted">JPG, PNG ou PDF (máx. 5MB)</small>
                              <input
                                type="file"
                                className="form-control mt-3"
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Observações (opcional)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Ex: Data da transferência, código da transação, referência, etc."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                      />
                    </div>

                    <div className="d-flex justify-content-between">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => setEtapa(1)}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Voltar
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={handleEnviarComprovativo}
                        disabled={!comprovante || uploading}
                      >
                        {uploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Enviar Comprovativo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {etapa === 3 && sucesso && (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                    <h4 className="mt-4 mb-3">Pedido de Matrícula Submetido!</h4>
                    
                    <div className="alert alert-success mb-4">
                      <h5 className="alert-heading">O que acontece agora:</h5>
                      <ul className="mb-0">
                        <li>Seu comprovativo foi enviado para o instrutor</li>
                        <li>O instrutor será notificado para validar o pagamento</li>
                        <li>Você receberá uma notificação quando for aprovado</li>
                        <li>O acesso ao curso será liberado automaticamente</li>
                      </ul>
                    </div>

                    <div className="alert alert-info">
                      <i className="bi bi-clock-history me-2"></i>
                      <strong>Tempo de espera:</strong> O processo pode levar até 24 horas úteis
                    </div>

                    <div className="mt-4">
                      <button 
                        className="btn btn-primary me-3"
                        onClick={() => router.push('/cursos/meus-cursos')}
                      >
                        <i className="bi bi-list me-2"></i>
                        Ver Meus Cursos
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => router.push('/cursos')}
                      >
                        <i className="bi bi-search me-2"></i>
                        Explorar Mais Cursos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}