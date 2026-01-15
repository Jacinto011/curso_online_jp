import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/common/Layout';

export default function CertificadoPage() {
  const router = useRouter();
  const { cursoId } = router.query;
  
  const [certificado, setCertificado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  useEffect(() => {
    if (cursoId) {
      carregarCertificado();
    }
  }, [cursoId]);

  const carregarCertificado = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/certificado/${cursoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCertificado(data);
      } else {
        alert(data.message || 'Erro ao carregar certificado');
        router.push('/cursos/meus-cursos');
      }
    } catch (error) {
      console.error('Erro ao carregar certificado:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const gerarPDF = () => {
    setGerandoPDF(true);
    
    // Simulação de geração de PDF
    setTimeout(() => {
      alert('PDF gerado com sucesso! Em um sistema real, isso baixaria o certificado.');
      setGerandoPDF(false);
    }, 2000);
  };

  const compartilharCertificado = () => {
    if (navigator.share) {
      navigator.share({
        title: `Meu certificado: ${certificado?.curso.titulo}`,
        text: `Concluí o curso ${certificado?.curso.titulo}! Verifique meu certificado: ${certificado?.urlVerificacao}`,
        url: certificado?.urlVerificacao
      });
    } else {
      navigator.clipboard.writeText(certificado?.urlVerificacao || '');
      alert('Link de verificação copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!certificado) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="text-center">
            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
            <h4 className="mt-3">Certificado não encontrado</h4>
            <p className="text-muted">Este certificado não está disponível ou não existe.</p>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/cursos/meus-cursos')}
            >
              Voltar para Meus Cursos
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="text-center mb-5">
              <h1 className="fw-bold">Parabéns!</h1>
              <p className="lead">Você concluiu o curso e seu certificado está pronto</p>
            </div>

            {/* Certificado */}
            <div className="card border-success mb-5">
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <i className="bi bi-award text-success" style={{ fontSize: '4rem' }}></i>
                  <h2 className="mt-3 fw-bold">Certificado de Conclusão</h2>
                  <p className="text-muted">Este certificado atesta que</p>
                </div>

                <div className="text-center mb-5">
                  <h3 className="fw-bold border-bottom pb-3 d-inline-block">
                    {certificado.estudante.nome}
                  </h3>
                  <p className="mt-3">
                    concluiu com êxito o curso
                  </p>
                  <h4 className="text-primary fw-bold">
                    "{certificado.curso.titulo}"
                  </h4>
                </div>

                <div className="row mt-5 pt-5">
                  <div className="col-md-4 text-center">
                    <p className="mb-1"><strong>Data de Conclusão</strong></p>
                    <p>{formatarData(certificado.datas.conclusao)}</p>
                  </div>
                  <div className="col-md-4 text-center">
                    <p className="mb-1"><strong>Duração do Curso</strong></p>
                    <p>{certificado.curso.duracao} horas</p>
                  </div>
                  <div className="col-md-4 text-center">
                    <p className="mb-1"><strong>Código de Verificação</strong></p>
                    <code className="bg-light p-2 rounded">{certificado.codigo}</code>
                  </div>
                </div>

                <div className="text-center mt-5 pt-4 border-top">
                  {certificado.formador && (
                    <div className="d-inline-block mx-4">
                      <p className="mb-1"><strong>Formador</strong></p>
                      <p className="mb-0">{certificado.formador.nome}</p>
                    </div>
                  )}
                  
                  <div className="d-inline-block mx-4">
                    <p className="mb-1"><strong>Nível</strong></p>
                    <p className="mb-0 text-capitalize">{certificado.curso.nivel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="d-grid">
                      <button 
                        className="btn btn-success"
                        onClick={gerarPDF}
                        disabled={gerandoPDF}
                      >
                        {gerandoPDF ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Gerando PDF...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-download me-2"></i>
                            Baixar Certificado (PDF)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <div className="d-grid">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={compartilharCertificado}
                      >
                        <i className="bi bi-share me-2"></i>
                        Compartilhar Certificado
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <div className="d-grid">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => router.push('/cursos/meus-cursos')}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Voltar para Meus Cursos
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-light rounded">
                  <h6>Verificar este certificado:</h6>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      value={certificado.urlVerificacao}
                      readOnly
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigator.clipboard.writeText(certificado.urlVerificacao)}
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>
                  <small className="text-muted">
                    Use este link para verificar a autenticidade do certificado
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}