// lib/certificate-generator-puppeteer.js
import puppeteer from 'puppeteer';

// Template HTML/CSS profissional e limpo
function getCertificateTemplate(data) {
  const {
    estudanteNome = 'NOME DO ESTUDANTE',
    cursoTitulo = 'NOME DO CURSO',
    instrutorNome = 'Instrutor Exemplo',
    dataConclusao = '16/01/2026',
    cargaHoraria = '20 horas',
    dataEmissao = new Date().toLocaleDateString('pt-PT'),
    codigoVerificacao = `CERT-${Date.now()}`
  } = data;

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Conclusão</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: 29.7cm;
            height: 21cm;
            margin: 0;
            padding: 1.5cm 2cm 1cm 2cm; /* Margens ajustadas */
            background: #ffffff;
            position: relative;
            font-family: 'Inter', sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        /* Borda superior elegante */
        .top-border {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 1.2cm;
            background: linear-gradient(90deg, 
                #2a3b8c 0%, 
                #2a3b8c 15%, 
                #D4AF37 30%, 
                #2a3b8c 45%,
                #D4AF37 60%,
                #2a3b8c 75%,
                #2a3b8c 100%
            );
        }
        
        /* Borda inferior sutil */
        .bottom-border {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0.8cm;
            background: linear-gradient(90deg, 
                #D4AF37 0%, 
                #2a3b8c 20%, 
                #D4AF37 40%,
                #2a3b8c 60%,
                #D4AF37 80%,
                #D4AF37 100%
            );
        }
        
        /* Linhas decorativas laterais */
        .side-decoration {
            position: absolute;
            top: 1.2cm;
            bottom: 0.8cm;
            width: 1px;
            background: linear-gradient(to bottom, 
                transparent, 
                #2a3b8c 20%, 
                #D4AF37 40%,
                #2a3b8c 60%,
                #D4AF37 80%,
                transparent 100%
            );
        }
        
        .side-left {
            left: 0.5cm;
        }
        
        .side-right {
            right: 0.5cm;
        }
        
        /* Conteúdo principal */
        .certificate-content {
            width: 100%;
            max-width: 25cm;
            text-align: center;
            position: relative;
            z-index: 2;
            padding: 0 1.5cm;
        }
        
        /* Cabeçalho */
        .header {
            margin-bottom: 1.8cm;
            position: relative;
        }
        
        .certificate-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            position: relative;
        }
        
        .certificate-icon::before {
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            background: 
                linear-gradient(45deg, transparent 45%, #D4AF37 45%, #D4AF37 55%, transparent 55%),
                linear-gradient(-45deg, transparent 45%, #D4AF37 45%, #D4AF37 55%, transparent 55%),
                linear-gradient(135deg, transparent 45%, #2a3b8c 45%, #2a3b8c 55%, transparent 55%),
                linear-gradient(-135deg, transparent 45%, #2a3b8c 45%, #2a3b8c 55%, transparent 55%);
            border-radius: 50%;
            border: 3px solid #D4AF37;
        }
        
        .certificate-icon::after {
            content: "✓";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 36px;
            color: #2a3b8c;
            font-weight: bold;
        }
        
        .certificate-title {
            font-family: 'Cinzel', serif;
            font-size: 44px;
            font-weight: 800;
            color: #2a3b8c;
            letter-spacing: 4px;
            margin-bottom: 10px;
            text-transform: uppercase;
            line-height: 1.2;
        }
        
        .platform-name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 20px;
            color: #666;
            letter-spacing: 2px;
            font-weight: 500;
            margin-top: 5px;
            position: relative;
            display: inline-block;
            padding: 0 25px;
        }
        
        .platform-name::before,
        .platform-name::after {
            content: "";
            position: absolute;
            top: 50%;
            width: 15px;
            height: 1px;
            background: #D4AF37;
        }
        
        .platform-name::before {
            left: 0;
        }
        
        .platform-name::after {
            right: 0;
        }
        
        .header-divider {
            width: 400px;
            height: 2px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                #D4AF37 25%, 
                #2a3b8c 50%, 
                #D4AF37 75%, 
                transparent 100%
            );
            margin: 20px auto;
        }
        
        /* Conteúdo principal */
        .main-content {
            margin: 1cm 0;
        }
        
        .certification-text {
            font-family: 'Cormorant Garamond', serif;
            font-size: 22px;
            color: #444;
            margin-bottom: 20px;
            line-height: 1.6;
            font-weight: 500;
        }
        
        .student-name {
            font-family: 'Cinzel', serif;
            font-size: 48px;
            font-weight: 700;
            color: #2a3b8c;
            margin: 30px 0;
            padding: 25px 0;
            position: relative;
            letter-spacing: 1px;
        }
        
        .student-name::before {
            content: "";
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 2px;
            background: #D4AF37;
        }
        
        .student-name::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 2px;
            background: #D4AF37;
        }
        
        .course-title {
            font-family: 'Cinzel', serif;
            font-size: 34px;
            font-weight: 600;
            color: #2a3b8c;
            margin: 30px 0 40px;
            padding: 20px 40px;
            display: inline-block;
            position: relative;
            background: rgba(42, 59, 140, 0.05);
            border-radius: 5px;
            font-style: italic;
        }
        
        /* Informações do curso - Layout vertical simples */
        .course-info {
            margin: 1.5cm auto 2cm;
            max-width: 600px;
            text-align: left;
            background: #f8f9ff;
            padding: 25px 30px;
            border-radius: 8px;
            border-left: 4px solid #D4AF37;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }
        
        .info-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .info-label {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            color: #2a3b8c;
            min-width: 160px;
            font-size: 16px;
            text-align: left;
        }
        
        .info-value {
            color: #333;
            font-weight: 500;
            font-size: 16px;
            text-align: left;
            flex: 1;
        }
        
        /* Rodapé */
        .certificate-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 1.5cm;
            padding-top: 1.5cm;
            width: 100%;
            max-width: 700px;
            border-top: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .signature-section {
            text-align: center;
            width: 45%;
        }
        
        .signature-line {
            width: 220px;
            height: 1px;
            background: #2a3b8c;
            margin: 30px auto 15px;
            position: relative;
        }
        
        .signature-line::before {
            content: "";
            position: absolute;
            top: -1px;
            left: 0;
            width: 100%;
            height: 1px;
            background: #D4AF37;
            opacity: 0.5;
        }
        
        .signature-name {
            font-family: 'Cinzel', serif;
            font-weight: 600;
            color: #2a3b8c;
            font-size: 18px;
            letter-spacing: 0.5px;
        }
        
        .signature-title {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
            font-style: italic;
        }
        
        /* Marca d'água sutil */
        .watermark {
            position: absolute;
            font-size: 120px;
            color: rgba(42, 59, 140, 0.04);
            font-weight: 800;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
            font-family: 'Cinzel', serif;
            letter-spacing: 15px;
        }
        
        /* Selo JP CERT */
        .jp-cert-seal {
            position: absolute;
            bottom: 1.2cm;
            left: 1.5cm;
            text-align: center;
            z-index: 3;
        }
        
        .jp-cert-text {
            font-family: 'Cinzel', serif;
            font-size: 18px;
            font-weight: 700;
            color: #2a3b8c;
            letter-spacing: 1px;
            position: relative;
            padding: 8px 15px;
            background: rgba(212, 175, 55, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .jp-cert-text::before {
            content: "";
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 6px;
        }
        
        /* ID do certificado */
        .certificate-id {
            position: absolute;
            bottom: 1.2cm;
            right: 1.5cm;
            font-size: 11px;
            color: #777;
            text-align: right;
            font-family: 'Inter', sans-serif;
            z-index: 3;
        }
        
        /* Para impressão */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background: white !important;
            }
        }
    </style>
</head>
<body>
    <!-- Bordas -->
    <div class="top-border"></div>
    <div class="bottom-border"></div>
    <div class="side-decoration side-left"></div>
    <div class="side-decoration side-right"></div>
    
    <!-- Marca d'água -->
    <div class="watermark">CERTIFICADO</div>
    
    <!-- Conteúdo principal -->
    <div class="certificate-content">
        <!-- Cabeçalho -->
        <div class="header">
            <div class="certificate-icon"></div>
            <h1 class="certificate-title">CERTIFICADO DE CONCLUSÃO</h1>
            <div class="header-divider"></div>
            <p class="platform-name">Plataforma de Cursos Online</p>
        </div>
        
        <!-- Conteúdo principal -->
        <div class="main-content">
            <p class="certification-text">
                A plataforma de cursos online certifica que
            </p>
            
            <div class="student-name">
                ${estudanteNome.toUpperCase()}
            </div>
            
            <p class="certification-text">
                concluiu com sucesso o curso
            </p>
            
            <h2 class="course-title">"${cursoTitulo.toUpperCase()}"</h2>
            
            <!-- Informações do curso -->
            <div class="course-info">
                <div class="info-item">
                    <div class="info-label">Instrutor:</div>
                    <div class="info-value">${instrutorNome}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Data de Conclusão:</div>
                    <div class="info-value">${dataConclusao}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Carga Horária:</div>
                    <div class="info-value">${cargaHoraria}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">ID do Certificado:</div>
                    <div class="info-value">${codigoVerificacao}</div>
                </div>
            </div>
        </div>
        
        <!-- Rodapé -->
        <div class="certificate-footer">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-name">${instrutorNome}</div>
                <div class="signature-title">Instrutor e Avaliador</div>
            </div>
            
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-name">${dataEmissao}</div>
                <div class="signature-title">Data de Emissão</div>
            </div>
        </div>
    </div>
    
    <!-- Selo JP CERT -->
    <div class="jp-cert-seal">
        <div class="jp-cert-text">JP CERT</div>
    </div>
    
    <!-- ID do certificado -->
    <div class="certificate-id">
        ID: ${codigoVerificacao}<br>
        Verificar em: www.cursoonlinejp.com/verificar
    </div>
</body>
</html>
  `;
}

// Versão alternativa mais minimalista
export async function generateCleanCertificate(data) {
  let browser = null;
  
  try {
    const cleanTemplate = `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        @page { size: A4 landscape; margin: 0; }
        
        body {
            width: 29.7cm;
            height: 21cm;
            margin: 0;
            padding: 2cm 2.5cm 1.5cm 2.5cm;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Inter', sans-serif;
            position: relative;
        }
        
        /* Linha superior */
        .top-line {
            position: absolute;
            top: 0;
            left: 2.5cm;
            right: 2.5cm;
            height: 3px;
            background: linear-gradient(90deg, #2a3b8c, #D4AF37, #2a3b8c);
        }
        
        /* Linha inferior */
        .bottom-line {
            position: absolute;
            bottom: 0;
            left: 2.5cm;
            right: 2.5cm;
            height: 2px;
            background: linear-gradient(90deg, #D4AF37, #2a3b8c, #D4AF37);
        }
        
        .container {
            width: 100%;
            max-width: 24.7cm;
            text-align: center;
        }
        
        .header {
            margin-bottom: 2cm;
            position: relative;
        }
        
        .title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 42px;
            font-weight: 700;
            color: #1a365d;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        
        .subtitle {
            font-family: 'Cormorant Garamond', serif;
            font-size: 18px;
            color: #666;
            letter-spacing: 1.5px;
            font-weight: 400;
        }
        
        .divider {
            width: 350px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #d4af37, transparent);
            margin: 20px auto 30px;
        }
        
        .text {
            font-family: 'Cormorant Garamond', serif;
            font-size: 20px;
            color: #2d3748;
            line-height: 1.6;
            margin: 20px 0;
        }
        
        .name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 48px;
            font-weight: 600;
            color: #1a365d;
            margin: 30px 0;
            padding: 20px 0;
            position: relative;
        }
        
        .name::before {
            content: "";
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 2px;
            background: #d4af37;
        }
        
        .name::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 150px;
            height: 2px;
            background: #d4af37;
        }
        
        .course {
            font-family: 'Cormorant Garamond', serif;
            font-size: 28px;
            font-weight: 500;
            color: #2a3b8c;
            margin: 30px 0 40px;
            font-style: italic;
        }
        
        .info-section {
            margin: 40px auto;
            max-width: 600px;
            text-align: left;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        
        .info-row {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #1a365d;
            width: 180px;
            font-size: 16px;
        }
        
        .info-value {
            color: #333;
            flex: 1;
            font-size: 16px;
        }
        
        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 30px;
            width: 100%;
            max-width: 700px;
            border-top: 1px solid #ddd;
        }
        
        .signature {
            text-align: center;
            width: 45%;
        }
        
        .signature-line {
            width: 180px;
            height: 1px;
            background: #4a5568;
            margin: 25px auto 10px;
        }
        
        .signature-name {
            font-weight: 600;
            color: #1a365d;
            font-size: 16px;
        }
        
        .signature-role {
            color: #666;
            font-size: 13px;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            font-family: 'Cormorant Garamond', serif;
            font-size: 120px;
            color: rgba(26, 54, 93, 0.03);
            font-weight: 700;
            letter-spacing: 12px;
            white-space: nowrap;
            pointer-events: none;
        }
        
        .jp-cert {
            position: absolute;
            bottom: 30px;
            left: 40px;
            font-family: 'Cormorant Garamond', serif;
            font-size: 16px;
            font-weight: 700;
            color: #2a3b8c;
            letter-spacing: 1px;
        }
        
        .cert-id {
            position: absolute;
            bottom: 30px;
            right: 40px;
            font-size: 11px;
            color: #777;
            text-align: right;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="top-line"></div>
    <div class="bottom-line"></div>
    <div class="watermark">CERTIFICADO</div>
    
    <div class="container">
        <div class="header">
            <h1 class="title">CERTIFICADO DE CONCLUSÃO</h1>
            <div class="subtitle">Plataforma de Cursos Online</div>
            <div class="divider"></div>
        </div>
        
        <p class="text">A plataforma de cursos online certifica que</p>
        
        <div class="name">${data.estudanteNome.toUpperCase()}</div>
        
        <p class="text">concluiu com sucesso o curso</p>
        
        <div class="course">"${data.cursoTitulo.toUpperCase()}"</div>
        
        <div class="info-section">
            <div class="info-row">
                <div class="info-label">Instrutor:</div>
                <div class="info-value">${data.instrutorNome}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Data de Conclusão:</div>
                <div class="info-value">${data.dataConclusao}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Carga Horária:</div>
                <div class="info-value">${data.cargaHoraria}</div>
            </div>
            <div class="info-row">
                <div class="info-label">ID do Certificado:</div>
                <div class="info-value">${data.codigoVerificacao}</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">${data.instrutorNome}</div>
                <div class="signature-role">Instrutor</div>
            </div>
            
            <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">${data.dataEmissao || new Date().toLocaleDateString('pt-PT')}</div>
                <div class="signature-role">Data de Emissão</div>
            </div>
        </div>
    </div>
    
    <div class="jp-cert">JP CERT</div>
    <div class="cert-id">
        ID: ${data.codigoVerificacao || 'CERT-' + Date.now()}<br>
        Verificar em: www.cursoonlinejp.com/verificar
    </div>
</body>
</html>
    `;
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(cleanTemplate, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('Erro ao gerar certificado clean:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Função principal de geração
export async function generateCertificate(data) {
  let browser = null;
  
  try {
    const htmlContent = getCertificateTemplate(data);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Aguardar carregamento de fontes
    await page.evaluate(() => document.fonts.ready);
    
    // Esperar um pouco extra para garantir renderização
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      scale: 1
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Função para dados de exemplo
export function generateSampleData() {
  const now = Date.now();
  return {
    estudanteNome: 'Carla Manave',
    cursoTitulo: 'Lógica de Programação Teste',
    instrutorNome: 'Instrutor Exemplo',
    dataConclusao: '16/01/2026',
    cargaHoraria: '20 horas',
    dataEmissao: new Date().toLocaleDateString('pt-PT'),
    codigoVerificacao: `CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  };
}

// Middleware para Next.js
export async function generateCertificateAPI(data) {
  if (typeof window !== 'undefined') {
    throw new Error('Esta função deve ser executada apenas no servidor');
  }
  
  return await generateCertificate(data);
}