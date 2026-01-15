import { authenticate } from '../../../lib/auth';
import storageService from '../../../lib/storage';
import { getClient } from '../../../lib/database-postgres';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Função robusta para processar multipart form data
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Verificar se parece ser multipart
        const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
        const boundary = isMultipart ? req.headers['content-type']?.split('boundary=')[1] : null;
        
        if (!isMultipart || !boundary) {
          console.log('⚠️  Não é multipart ou sem boundary. Tentando processar como FormData simples...');
          
          // Tentar processar como URL-encoded primeiro
          try {
            const text = buffer.toString('utf-8');
            const params = new URLSearchParams(text);
            const fields = {};
            
            for (const [key, value] of params.entries()) {
              fields[key] = value;
            }
            
            resolve({
              fields,
              fileBuffer: null,
              fileName: '',
              fileType: 'application/octet-stream'
            });
            return;
          } catch (parseError) {
            // Se falhar, tentar como multipart mesmo sem header correto
            console.log('⚠️  Fallback para análise multipart...');
          }
        }
        
        // Processar como multipart
        const bufferStr = buffer.toString('binary');
        const bufferBoundary = `--${boundary}`;
        const endBoundary = `${bufferBoundary}--`;
        const parts = bufferStr.split(bufferBoundary);
        
        let fields = {};
        let fileBuffer = null;
        let fileName = '';
        let fileType = 'application/octet-stream';
        
        for (const part of parts) {
          if (!part.trim() || part.includes(endBoundary)) continue;
          
          const [headers, ...bodyParts] = part.split('\r\n\r\n');
          const body = bodyParts.join('\r\n\r\n').trim();
          
          if (headers.includes('Content-Disposition')) {
            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            
            if (nameMatch) {
              const name = nameMatch[1];
              
              if (filenameMatch) {
                // É um arquivo
                fileName = filenameMatch[1];
                const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
                fileType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
                
                // Converter body para Buffer
                fileBuffer = Buffer.from(body, 'binary');
              } else {
                // É um campo normal
                fields[name] = body;
              }
            }
          }
        }
        
        resolve({ fields, fileBuffer, fileName, fileType });
      } catch (error) {
        console.error('❌ Erro no parse do form data:', error.message);
        reject(new Error('Erro ao processar dados do formulário'));
      }
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro no stream da requisição:', error.message);
      reject(error);
    });
  });
}

// Função para detectar MIME type pela extensão
function detectMimeTypeByExtension(filename) {
  if (!filename) return 'application/octet-stream';
  
  // Extrair extensão
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) return 'application/octet-stream';
  
  const ext = match[1].toLowerCase();
  
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*'); // Permitir todos os headers

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método não permitido' 
    });
  }

  let client;

  try {
    console.log('🔄 Recebendo requisição...');
    console.log('📋 Headers recebidos:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'authorization': req.headers['authorization'] ? 'present' : 'missing'
    });

    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    console.log('✅ Usuário autenticado:', user.id, user.nome);
    
    // Processar form data
    console.log('📥 Processando dados do formulário...');
    const { fields, fileBuffer, fileName, fileType } = await parseFormData(req);
    
    console.log('✅ Dados processados:', {
      camposRecebidos: Object.keys(fields),
      temArquivo: !!fileBuffer,
      nomeArquivo: fileName,
      tipoArquivo: fileType,
      tamanhoArquivo: fileBuffer ? `${(fileBuffer.length / 1024).toFixed(2)}KB` : 'N/A'
    });

    // Log de todos os campos recebidos
    console.log('📝 Campos detalhados:');
    Object.keys(fields).forEach(key => {
      console.log(`  ${key}: "${fields[key]}"`);
    });

    // Extrair valores dos campos
    const matricula_id = fields.matricula_id;
    const metodo_pagamento = fields.metodo_pagamento;
    const valor = fields.valor;
    const estudante_nome = fields.estudante_nome;
    const observacoes = fields.observacoes || '';
    
    // Validações básicas
    if (!matricula_id || !metodo_pagamento || !valor) {
      const missing = [];
      if (!matricula_id) missing.push('matricula_id');
      if (!metodo_pagamento) missing.push('metodo_pagamento');
      if (!valor) missing.push('valor');
      
      console.error('❌ Campos obrigatórios faltando:', missing);
      console.error('📋 Campos recebidos:', fields);
      
      return res.status(400).json({ 
        success: false, 
        message: 'Campos obrigatórios faltando',
        missing_fields: missing,
        received_fields: Object.keys(fields)
      });
    }

    // Validar se há arquivo
    if (!fileBuffer || !fileName) {
      console.error('❌ Nenhum arquivo enviado ou arquivo inválido');
      console.error('📋 Dados do arquivo:', { fileBuffer: !!fileBuffer, fileName });
      
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor, selecione um arquivo de comprovante válido'
      });
    }

    // Determinar tipo de arquivo (com fallback)
    let finalFileType = fileType;
    if (!finalFileType || finalFileType === 'application/octet-stream') {
      finalFileType = detectMimeTypeByExtension(fileName);
      console.log('🔍 MIME type detectado pela extensão:', finalFileType);
    }

    console.log('📄 Tipo do arquivo final:', finalFileType);

    // Validar tipo de arquivo (apenas imagens e PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (!allowedTypes.includes(finalFileType)) {
      console.error('❌ Tipo de arquivo não permitido:', finalFileType);
      console.error('📋 Tipos permitidos:', allowedTypes);
      
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de arquivo não permitido. Apenas JPG, PNG e PDF são permitidos.',
        received_type: finalFileType,
        allowed_types: allowedTypes
      });
    }

    // Validar tamanho do arquivo (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxSize) {
      console.error('❌ Arquivo muito grande:', fileBuffer.length);
      
      return res.status(400).json({ 
        success: false, 
        message: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }

    // Resto do código permanece o mesmo...
    // [Manter todo o código de banco de dados e upload que já estava funcionando]
    
    // Conectar ao banco
    client = await getClient();
    await client.query('BEGIN');

    // Verificar se a matrícula existe
    console.log('🔎 Verificando matrícula:', matricula_id);
    
    const matriculaResult = await client.query(`
      SELECT m.*, c.titulo, c.instrutor_id, u.nome as estudante_nome 
      FROM matriculas m
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON m.estudante_id = u.id
      WHERE m.id = $1
    `, [matricula_id]);

    if (matriculaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: 'Matrícula não encontrada' 
      });
    }

    const matricula = matriculaResult.rows[0];
    console.log('✅ Matrícula encontrada:', matricula.id);

    // Verificar se já existe pagamento para esta matrícula
    const pagamentoExistenteResult = await client.query(`
      SELECT * FROM pagamentos WHERE matricula_id = $1
    `, [matricula_id]);

    if (pagamentoExistenteResult.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Já existe um pagamento para esta matrícula' 
      });
    }

    // Obter método de pagamento
    const metodoResult = await client.query(`
      SELECT * FROM metodos_pagamento WHERE codigo = $1
    `, [metodo_pagamento]);

    if (metodoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: 'Método de pagamento inválido' 
      });
    }

    const metodo = metodoResult.rows[0];
    console.log('✅ Método de pagamento:', metodo.codigo);

    // Fazer upload diretamente do buffer
    console.log('📤 Iniciando upload do arquivo...');
    console.log('📊 Tamanho do arquivo:', fileBuffer.length, 'bytes');
    
    const uploadResult = await storageService.uploadFile(
      fileBuffer,
      fileName,
      finalFileType,
      'comprovantes'
    );

    console.log('✅ Upload realizado com sucesso:', {
      provider: uploadResult.provider,
      fileName: uploadResult.fileName,
      url: uploadResult.url
    });

    // URLs compatíveis
    //const comprovanteUrl = uploadResult.url; // URL real
    const cloudinaryUrl = uploadResult.url; // URL do Cloudinary
    //const localComprovanteUrl = `/uploads/comprovantes/${uploadResult.fileName}`; // URL compatível

    const codigoTransacao = `PAY-${Date.now()}-${matricula_id}`;

    // Criar registro de pagamento
    console.log('💾 Salvando no banco de dados...');
    
    const pagamentoResult = await client.query(`
      INSERT INTO pagamentos 
      (matricula_id, metodo_pagamento_id, valor, status, comprovante_url, codigo_transacao, observacoes, provider_data) 
      VALUES ($1, $2, $3, 'pendente', $4, $5, $6, $7)
      RETURNING id
    `, [
      matricula_id, 
      metodo.id, 
      parseFloat(valor),
      cloudinaryUrl,
      codigoTransacao, 
      observacoes,
      JSON.stringify({
        realUrl: uploadResult.url,
        provider: uploadResult.provider,
        public_id: uploadResult.public_id,
        path: uploadResult.path,
        uploadedAt: new Date().toISOString()
      })
    ]);

    const pagamentoId = pagamentoResult.rows[0].id;
    console.log('✅ Pagamento registrado:', pagamentoId);

    // Registrar no histórico
    await client.query(`
      INSERT INTO historico_pagamento 
      (pagamento_id, status, observacoes) 
      VALUES ($1, 'pendente', 'Comprovante enviado pelo aluno')
    `, [pagamentoId]);

    // Atualizar status da matrícula para pendente (se já não estiver)
    if (matricula.status !== 'pendente') {
      await client.query(`
        UPDATE matriculas SET status = 'pendente' WHERE id = $1
      `, [matricula_id]);
    }

    // Criar notificação para o instrutor
    await client.query(`
      INSERT INTO notificacoes 
      (usuario_id, tipo, titulo, mensagem, link) 
      VALUES ($1, 'pagamento', 'Novo comprovante recebido', 
              $2, $3)
    `, [
      matricula.instrutor_id,
      `O aluno ${estudante_nome || matricula.estudante_nome} enviou comprovante para o curso "${matricula.titulo}". Valor: ${valor}.`,
      `/instructor/pagamentos`
    ]);

    await client.query('COMMIT');
    client.release();

    console.log('🎉 Comprovante processado com sucesso!');

    return res.status(200).json({
      success: true,
      message: 'Comprovante enviado com sucesso! Aguarde a confirmação.',
      data: {
        pagamento_id: pagamentoId,
        matricula_id: matricula_id,
        comprovante_url: cloudinaryUrl,
        real_url: cloudinaryUrl,
        provider: uploadResult.provider
      }
    });

  } catch (error) {
    console.error('💥 ERRO NO PROCESSAMENTO:', error.message);
    console.error('💥 Stack trace:', error.stack);
    
    // Rollback se houver cliente
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro no rollback:', rollbackError.message);
      }
      client.release();
    }

    let message = 'Erro interno do servidor';
    let statusCode = 500;

    if (error.message.includes('Arquivo muito grande')) {
      message = error.message;
      statusCode = 400;
    } else if (error.message.includes('Tipo de arquivo')) {
      message = error.message;
      statusCode = 400;
    } else if (error.message.includes('Campos obrigatórios')) {
      message = error.message;
      statusCode = 400;
    } else if (error.message.includes('Nenhum arquivo')) {
      message = error.message;
      statusCode = 400;
    } else if (error.message.includes('Content-Type')) {
      message = 'Formato de requisição inválido. O upload deve ser feito usando FormData.';
      statusCode = 400;
    } else if (error.message.includes('Erro ao processar dados')) {
      message = 'Erro ao processar o formulário. Verifique os dados enviados.';
      statusCode = 400;
    }

    return res.status(statusCode).json({ 
      success: false, 
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}