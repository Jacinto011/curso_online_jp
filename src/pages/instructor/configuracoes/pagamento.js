import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import api from '../../../lib/api';

export default function ConfiguracoesPagamento() {
  const { isInstructor } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dados, setDados] = useState({
    banco_nome: '',
    banco_codigo: '',
    agencia: '',
    conta: '',
    nib: '',
    tipo_conta: 'corrente',
    nome_titular: '',
    telefone_titular: '',
    mpesa_numero: '',
    emola_numero: '',
    airtel_money_numero: ''
  });

  useEffect(() => {
    if (!isInstructor) {
      router.push('/auth/login');
      return;
    }
    fetchDados();
  }, [isInstructor]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/instructor/dados-bancarios');
      if (response.data) {
        setDados(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.post('/api/instructor/dados-bancarios', dados);
      if (response.data.success) {
        alert('Dados bancários salvos com sucesso!');
        fetchDados();
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      alert(error.response?.data?.message || 'Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDados(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
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
          <h1 className="mb-4">Configurações de Pagamento</h1>
          <p className="text-muted mb-4">
            Configure suas contas bancárias e carteiras digitais para receber pagamentos dos alunos
          </p>

          <form onSubmit={handleSubmit}>
            {/* Informações Bancárias */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-bank me-2"></i>
                  Informações Bancárias
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nome do Banco *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="banco_nome"
                      value={dados.banco_nome}
                      onChange={handleChange}
                      placeholder="Ex: BCI, Standard Bank, Millennium BIM"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Código do Banco</label>
                    <input
                      type="text"
                      className="form-control"
                      name="banco_codigo"
                      value={dados.banco_codigo}
                      onChange={handleChange}
                      placeholder="Código SWIFT ou do banco"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Agência *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="agencia"
                      value={dados.agencia}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Conta *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="conta"
                      value={dados.conta}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">NIB</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nib"
                      value={dados.nib}
                      onChange={handleChange}
                      placeholder="Número de Identificação Bancária"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo de Conta</label>
                    <select
                      className="form-select"
                      name="tipo_conta"
                      value={dados.tipo_conta}
                      onChange={handleChange}
                    >
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nome do Titular *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nome_titular"
                      value={dados.nome_titular}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Telefone do Titular</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telefone_titular"
                      value={dados.telefone_titular}
                      onChange={handleChange}
                      placeholder="Ex: +258 84 123 4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Carteiras Digitais */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-phone me-2"></i>
                  Carteiras Digitais
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Número M-Pesa</label>
                    <div className="input-group">
                      <span className="input-group-text">+258</span>
                      <input
                        type="tel"
                        className="form-control"
                        name="mpesa_numero"
                        value={dados.mpesa_numero}
                        onChange={handleChange}
                        placeholder="84 123 4567"
                      />
                    </div>
                    <small className="text-muted">Vodacom</small>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Número e-Mola</label>
                    <div className="input-group">
                      <span className="input-group-text">+258</span>
                      <input
                        type="tel"
                        className="form-control"
                        name="emola_numero"
                        value={dados.emola_numero}
                        onChange={handleChange}
                        placeholder="86 123 4567"
                      />
                    </div>
                    <small className="text-muted">Movitel</small>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Número Airtel Money</label>
                    <div className="input-group">
                      <span className="input-group-text">+258</span>
                      <input
                        type="tel"
                        className="form-control"
                        name="airtel_money_numero"
                        value={dados.airtel_money_numero}
                        onChange={handleChange}
                        placeholder="85 123 4567"
                      />
                    </div>
                    <small className="text-muted">Airtel</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between">
              <button 
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => router.push('/instructor')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Voltar
              </button>
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}