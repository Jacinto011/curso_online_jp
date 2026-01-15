import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ModalPagamento({ 
  isOpen, 
  onClose, 
  cursoId,
  cursoTitulo, 
  valor,
  instrutorId,
  dadosInstrutor, // Novo prop para receber dados diretamente
  onPagamentoConfirmado
}) {
  const [passoAtual, setPassoAtual] = useState(1);
  const [dadosInstrutorLocal, setDadosInstrutorLocal] = useState(null);
  const [metodoSelecionado, setMetodoSelecionado] = useState('');
  const [comprovante, setComprovante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [matriculaId, setMatriculaId] = useState(null);
  const { user } = useAuth();

  // Use os dados passados diretamente ou busque se não tiver
  useEffect(() => {
    if (isOpen && passoAtual === 1) {
      if (dadosInstrutor) {
        // Usa os dados passados diretamente
        setDadosInstrutorLocal(dadosInstrutor);
      } else if (instrutorId) {
        // Se não tiver dados passados, busca da API
        buscarDadosInstrutor();
      }
    }
  }, [isOpen, passoAtual, dadosInstrutor, instrutorId]);

  const buscarDadosInstrutor = async () => {
    try {
      setCarregandoDados(true);
      const response = await api.get(`/instructor/${instrutorId}/dados-pagamento`);
      setDadosInstrutorLocal(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar dados do instrutor:', error);
      setMensagem('Erro ao carregar dados do instrutor');
    } finally {
      setCarregandoDados(false);
    }
  };

  // Use dadosInstrutorLocal para mostrar as informações
  const instrutorParaExibir = dadosInstrutor || dadosInstrutorLocal;

  const handleComprovanteChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMensagem('O arquivo deve ter no máximo 5MB');
        return;
      }
      setComprovante(file);
    }
  };

  const handleEnviarPagamento = async () => {
  if (!metodoSelecionado || !comprovante) {
    setMensagem('Selecione um método de pagamento e envie o comprovante');
    return;
  }

  try {
    setLoading(true);
    setMensagem('');

    console.log('📤 Iniciando processo de pagamento...');
    console.log('📄 Arquivo selecionado:', comprovante.name, comprovante.type, comprovante.size);

    // 1. Primeiro criar a matrícula (pendente)
    console.log('🔗 Criando matrícula...');
    const matriculaResponse = await api.post('/cursos/matricular', {
      cursoId: cursoId,
      estudanteId: user?.id
    });

    if (!matriculaResponse.data.success) {
      throw new Error(matriculaResponse.data.message || 'Erro ao criar matrícula');
    }

    const novaMatriculaId = matriculaResponse.data.matricula_id;
    setMatriculaId(novaMatriculaId);
    console.log('✅ Matrícula criada:', novaMatriculaId);

    // 2. Enviar o comprovante de pagamento usando FETCH diretamente
    console.log('📤 Preparando FormData...');
    const formData = new FormData();
    
    // Adicionar arquivo COM nome
    formData.append('comprovante', comprovante, comprovante.name);
    
    // Adicionar outros campos
    formData.append('matricula_id', novaMatriculaId);
    formData.append('metodo_pagamento', metodoSelecionado);
    formData.append('valor', valor);
    formData.append('observacoes', observacoes);
    formData.append('estudante_nome', user?.nome || 'Estudante');

    // Debug: Verificar o que está sendo enviado
    console.log('🔍 Conteúdo do FormData:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: "${value}"`);
      }
    }

    // Usar fetch diretamente para garantir headers corretos
    console.log('🚀 Enviando para API...');
    
    const token = localStorage.getItem('token'); // ou seu método de obtenção de token
    
    const response = await fetch('/api/pagamentos/enviar-comprovante', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}` // Adicione autenticação se necessário
        // NÃO definir Content-Type aqui - o browser define automaticamente
      }
    });

    console.log('📥 Resposta recebida, status:', response.status);

    const data = await response.json();
    console.log('📊 Dados da resposta:', data);

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`);
    }

    if (data.success) {
      console.log('✅ Upload bem-sucedido!');
      setPassoAtual(3);
      if (onPagamentoConfirmado) {
        onPagamentoConfirmado(novaMatriculaId);
      }
      setMensagem('Comprovante enviado com sucesso!');
    } else {
      setMensagem(data.message || 'Erro ao enviar comprovante');
    }
  } catch (error) {
    console.error('💥 Erro ao enviar pagamento:', error);
    
    // Mensagem de erro mais detalhada
    const errorMessage = error.message || 'Erro ao processar pagamento';
    setMensagem(errorMessage);
    
    // Log adicional para debug
    if (error.response) {
      console.error('Detalhes do erro da API:', error.response.data);
    }
  } finally {
    setLoading(false);
  }
};

  

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor);
  };

  const renderPasso1 = () => (
    <div className="p-4">
      <div className="text-center mb-4">
        <i className="bi bi-credit-card text-primary" style={{ fontSize: '3rem' }}></i>
        <h4 className="mt-3">Instruções de Pagamento</h4>
        <p className="text-muted">
          Siga os passos abaixo para concluir sua matrícula no curso:
          <br />
          <strong>{cursoTitulo}</strong>
        </p>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Valor a Pagar</h5>
          <div className="display-4 text-primary fw-bold">
            {formatarValor(valor)}
          </div>
          {instrutorParaExibir && (
            <p className="text-muted mt-2">
              Pagar para: <strong>{instrutorParaExibir.instrutor_nome}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Exibe Dados Bancários do Instrutor na Primeira Página */}
      {instrutorParaExibir && (
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Dados do Instrutor para Pagamento</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {instrutorParaExibir.banco_nome && (
                <div className="col-md-6 mb-3">
                  <div className="p-3 border rounded">
                    <h6 className="text-primary">
                      <i className="bi bi-bank me-2"></i>
                      Transferência Bancária
                    </h6>
                    <small className="d-block"><strong>Banco:</strong> {instrutorParaExibir.banco_nome}</small>
                    <small className="d-block"><strong>Agência:</strong> {instrutorParaExibir.agencia}</small>
                    <small className="d-block"><strong>Conta:</strong> {instrutorParaExibir.conta}</small>
                    {instrutorParaExibir.nib && (
                      <small className="d-block"><strong>NIB:</strong> {instrutorParaExibir.nib}</small>
                    )}
                    <small className="d-block"><strong>Titular:</strong> {instrutorParaExibir.nome_titular}</small>
                  </div>
                </div>
              )}
              
              {instrutorParaExibir.mpesa_numero && (
                <div className="col-md-6 mb-3">
                  <div className="p-3 border rounded">
                    <h6 className="text-success">
                      <i className="bi bi-phone me-2"></i>
                      M-Pesa
                    </h6>
                    <small className="d-block"><strong>Número:</strong> {instrutorParaExibir.mpesa_numero}</small>
                    <small className="d-block"><strong>Nome:</strong> {instrutorParaExibir.nome_titular}</small>
                  </div>
                </div>
              )}
              
              {instrutorParaExibir.emola_numero && (
                <div className="col-md-6 mb-3">
                  <div className="p-3 border rounded">
                    <h6 className="text-primary">
                      <i className="bi bi-wallet2 me-2"></i>
                      e-Mola
                    </h6>
                    <small className="d-block"><strong>Número:</strong> {instrutorParaExibir.emola_numero}</small>
                    <small className="d-block"><strong>Nome:</strong> {instrutorParaExibir.nome_titular}</small>
                  </div>
                </div>
              )}
              
              {instrutorParaExibir.airtel_money_numero && (
                <div className="col-md-6 mb-3">
                  <div className="p-3 border rounded">
                    <h6 className="text-danger">
                      <i className="bi bi-phone me-2"></i>
                      Airtel Money
                    </h6>
                    <small className="d-block"><strong>Número:</strong> {instrutorParaExibir.airtel_money_numero}</small>
                    <small className="d-block"><strong>Nome:</strong> {instrutorParaExibir.nome_titular}</small>
                  </div>
                </div>
              )}
            </div>
            
            <div className="alert alert-info mt-2">
              <i className="bi bi-info-circle me-2"></i>
              <small>
                Escolha uma das formas acima para realizar o pagamento. 
                Na próxima etapa você informará qual método utilizou.
              </small>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-light">
          <h5 className="mb-0">Passos para Matrícula</h5>
        </div>
        <div className="card-body">
          <ol className="list-group list-group-numbered">
            <li className="list-group-item border-0 d-flex align-items-start">
              <div className="ms-2 me-auto">
                <div className="fw-bold">Ver instruções de pagamento (esta etapa)</div>
                Veja as formas de pagamento disponíveis do instrutor
              </div>
            </li>
            <li className="list-group-item border-0 d-flex align-items-start">
              <div className="ms-2 me-auto">
                <div className="fw-bold">Realizar o pagamento</div>
                Faça a transferência ou pagamento móvel para o instrutor
              </div>
            </li>
            <li className="list-group-item border-0 d-flex align-items-start">
              <div className="ms-2 me-auto">
                <div className="fw-bold">Informar método usado e enviar comprovante</div>
                Selecione o método usado e faça upload do comprovante
              </div>
            </li>
            <li className="list-group-item border-0 d-flex align-items-start">
              <div className="ms-2 me-auto">
                <div className="fw-bold">Aguardar confirmação</div>
                O instrutor confirmará o pagamento em até 24 horas
              </div>
            </li>
          </ol>
          
          <div className="alert alert-warning mt-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <small>
              <strong>Importante:</strong> Guarde o comprovante de pagamento. 
              Você precisará enviá-lo na próxima etapa.
            </small>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button 
          className="btn btn-outline-secondary"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => setPassoAtual(2)}
          disabled={carregandoDados || !instrutorParaExibir}
        >
          {carregandoDados ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Carregando...
            </>
          ) : (
            <>
              Já Realizei o Pagamento <i className="bi bi-arrow-right ms-2"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPasso2 = () => (
    <div className="p-4">
      <div className="text-center mb-4">
        <i className="bi bi-wallet text-primary" style={{ fontSize: '3rem' }}></i>
        <h4 className="mt-3">Informar Método de Pagamento</h4>
        <p className="text-muted">
          Selecione qual método de pagamento você utilizou e envie o comprovante
        </p>
      </div>

      {instrutorParaExibir && (
        <>
          {/* Seleção do Método Utilizado */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Qual método você utilizou?</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {instrutorParaExibir.banco_nome && (
                  <div className="col-md-6 mb-3">
                    <div 
                      className={`p-3 border rounded text-center cursor-pointer ${metodoSelecionado === 'banco' ? 'border-primary bg-primary-light' : ''}`}
                      onClick={() => setMetodoSelecionado('banco')}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="bi bi-bank text-primary fs-1"></i>
                      <h6 className="mt-2">Transferência Bancária</h6>
                      <small className="text-muted">
                        {instrutorParaExibir.banco_nome}
                      </small>
                    </div>
                  </div>
                )}
                
                {instrutorParaExibir.mpesa_numero && (
                  <div className="col-md-6 mb-3">
                    <div 
                      className={`p-3 border rounded text-center cursor-pointer ${metodoSelecionado === 'mpesa' ? 'border-success bg-success-light' : ''}`}
                      onClick={() => setMetodoSelecionado('mpesa')}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="bi bi-phone text-success fs-1"></i>
                      <h6 className="mt-2">M-Pesa</h6>
                      <small className="text-muted">
                        {instrutorParaExibir.mpesa_numero}
                      </small>
                    </div>
                  </div>
                )}
                
                {instrutorParaExibir.emola_numero && (
                  <div className="col-md-6 mb-3">
                    <div 
                      className={`p-3 border rounded text-center cursor-pointer ${metodoSelecionado === 'emola' ? 'border-primary bg-primary-light' : ''}`}
                      onClick={() => setMetodoSelecionado('emola')}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="bi bi-wallet2 text-primary fs-1"></i>
                      <h6 className="mt-2">e-Mola</h6>
                      <small className="text-muted">
                        {instrutorParaExibir.emola_numero}
                      </small>
                    </div>
                  </div>
                )}
                
                {instrutorParaExibir.airtel_money_numero && (
                  <div className="col-md-6 mb-3">
                    <div 
                      className={`p-3 border rounded text-center cursor-pointer ${metodoSelecionado === 'airtel_money' ? 'border-danger bg-danger-light' : ''}`}
                      onClick={() => setMetodoSelecionado('airtel_money')}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="bi bi-phone text-danger fs-1"></i>
                      <h6 className="mt-2">Airtel Money</h6>
                      <small className="text-muted">
                        {instrutorParaExibir.airtel_money_numero}
                      </small>
                    </div>
                  </div>
                )}
              </div>
              
              {metodoSelecionado && (
                <div className="alert alert-info mt-3">
                  <i className="bi bi-check-circle me-2"></i>
                  Método selecionado: <strong>
                    {metodoSelecionado === 'banco' ? 'Transferência Bancária' :
                     metodoSelecionado === 'mpesa' ? 'M-Pesa' :
                     metodoSelecionado === 'emola' ? 'e-Mola' : 'Airtel Money'}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Upload do Comprovante */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Enviar Comprovante</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Comprovante de Pagamento *</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,.pdf"
                  onChange={handleComprovanteChange}
                  required
                />
                <small className="form-text text-muted">
                  Envie uma imagem ou PDF do comprovante (máximo 5MB)
                </small>
              </div>
              
              {comprovante && (
                <div className="alert alert-success mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-check-circle me-2"></i>
                      Comprovante selecionado: <strong>{comprovante.name}</strong>
                      <div className="small text-muted">
                        Tamanho: {(comprovante.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setComprovante(null)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <label className="form-label">Observações (opcional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Ex: data da transferência, número de referência, etc..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {mensagem && (
            <div className={`alert ${mensagem.includes('sucesso') ? 'alert-success' : 'alert-danger'} mb-3`}>
              {mensagem}
            </div>
          )}

          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setPassoAtual(1)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Voltar
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleEnviarPagamento}
              disabled={!metodoSelecionado || !comprovante || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Enviando...
                </>
              ) : (
                'Enviar Comprovante'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderPasso3 = () => (
    <div className="p-4 text-center">
      <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
      <h3 className="mt-3 text-success">Matrícula Submetida!</h3>
      <p className="lead">
        Seu comprovante foi enviado com sucesso.
      </p>
      
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Resumo da Submissão</h5>
          <div className="row mt-3 text-start">
            <div className="col-md-6 mb-3">
              <div className="p-3 border rounded">
                <h6>Curso</h6>
                <p className="mb-1"><strong>{cursoTitulo}</strong></p>
                <small className="text-muted">Valor: {formatarValor(valor)}</small>
              </div>
            </div>
            
            <div className="col-md-6 mb-3">
              <div className="p-3 border rounded">
                <h6>Status</h6>
                <span className="badge bg-warning">Pendente de Confirmação</span>
                <small className="d-block text-muted mt-1">
                  Aguardando confirmação do instrutor
                </small>
              </div>
            </div>
            
            <div className="col-md-12 mb-3">
              <div className="p-3 border rounded">
                <h6>Método de Pagamento</h6>
                <p className="mb-0">
                  <strong>
                    {metodoSelecionado === 'banco' ? 'Transferência Bancária' :
                     metodoSelecionado === 'mpesa' ? 'M-Pesa' :
                     metodoSelecionado === 'emola' ? 'e-Mola' : 'Airtel Money'}
                  </strong>
                </p>
              </div>
            </div>
          </div>
          
          <div className="alert alert-success">
            <h6><i className="bi bi-check-circle me-2"></i>Submissão Concluída</h6>
            <p className="mb-0">
              Você receberá uma notificação quando o instrutor confirmar seu pagamento. 
              A matrícula será ativada automaticamente após a confirmação.
            </p>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center mt-4">
        <button 
          className="btn btn-primary"
          onClick={onClose}
        >
          <i className="bi bi-check-circle me-2"></i>
          Fechar
        </button>
      </div>
    </div>
  );

  const renderProgresso = () => (
    <div className="progress-steps px-4 pt-4">
      <div className="d-flex justify-content-between position-relative">
        <div className="position-absolute top-50 start-0 end-0 h-1 bg-secondary" style={{ zIndex: 0 }}></div>
        {[1, 2, 3].map((passo) => (
          <div key={passo} className="position-relative" style={{ zIndex: 1 }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${
              passo <= passoAtual ? 'bg-primary text-white' : 'bg-secondary text-white'
            }`} style={{ width: '40px', height: '40px' }}>
              {passo}
            </div>
            <div className="position-absolute top-100 start-50 translate-middle-x mt-2 text-center">
              <small className="text-muted">
                {passo === 1 ? 'Dados Pagamento' : passo === 2 ? 'Enviar Comprovante' : 'Conclusão'}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              {passoAtual === 1 && 'Dados para Pagamento'}
              {passoAtual === 2 && 'Enviar Comprovante'}
              {passoAtual === 3 && 'Matrícula Submetida'}
            </h5>
            {passoAtual !== 3 && (
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            )}
          </div>
          
          <div className="modal-body">
            {renderProgresso()}
            
            {passoAtual === 1 && renderPasso1()}
            {passoAtual === 2 && renderPasso2()}
            {passoAtual === 3 && renderPasso3()}
          </div>
        </div>
      </div>
    </div>
  );
}