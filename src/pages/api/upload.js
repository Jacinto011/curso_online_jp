import storageService from '../../lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para processar multipart form data
async function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'];
        
        if (!contentType || !contentType.includes('multipart/form-data')) {
          reject(new Error('Content-Type must be multipart/form-data'));
          return;
        }
        
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
          reject(new Error('No boundary found in Content-Type'));
          return;
        }
        
        const bufferStr = buffer.toString('binary');
        const bufferBoundary = `--${boundary}`;
        const endBoundary = `${bufferBoundary}--`;
        const parts = bufferStr.split(bufferBoundary);
        
        let fields = {};
        let fileBuffer = null;
        let fileName = '';
        let fileType = 'application/octet-stream';
        let cursoId = '';
        
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
                fileBuffer = Buffer.from(body, 'binary');
              } else {
                // É um campo normal
                fields[name] = body;
                if (name === 'curso_id') {
                  cursoId = body;
                }
              }
            }
          }
        }
        
        resolve({ fields, fileBuffer, fileName, fileType, cursoId });
      } catch (error) {
        console.error('❌ Erro no parse do form data:', error.message);
        reject(new Error('Erro ao processar dados do formulário'));
      }
    });
    
    req.on('error', reject);
  });
}

// Função para detectar tipo de arquivo pela extensão
function detectFileType(filename, mimeType) {
  if (mimeType && mimeType !== 'application/octet-stream') {
    return mimeType;
  }
  
  if (!filename) return 'application/octet-stream';
  
  const ext = filename.toLowerCase().match(/\.([a-zA-Z0-9]+)$/);
  if (!ext) return 'application/octet-stream';
  
  const extension = ext[1];
  
  const mimeTypes = {
    // Imagens
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    
    // Vídeos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'mkv': 'video/x-matroska',
    
    // Documentos
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'rtf': 'application/rtf',
    
    // Outros
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// Função para determinar o tipo de conteúdo
function getContentType(fileType) {
  const type = fileType.split('/')[0];
  return type === 'video' || type === 'image' || type === 'application' || type === 'text' ? type : 'document';
}

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }

  try {
    console.log('🔄 Recebendo requisição de upload...');
    console.log('📋 Content-Type:', req.headers['content-type']);

    // ✅ REMOVIDA AUTENTICAÇÃO OBRIGATÓRIA
    // Apenas log para debug se tiver token
    if (req.headers.authorization) {
      console.log('🔐 Token presente, mas não obrigatório para upload');
    }
    
    // Processar form data
    const { fields, fileBuffer, fileName, fileType, cursoId } = await parseMultipartFormData(req);
    
    console.log('✅ Dados processados:', {
      camposRecebidos: Object.keys(fields),
      temArquivo: !!fileBuffer,
      nomeArquivo: fileName,
      tipoArquivo: fileType,
      tamanhoArquivo: fileBuffer ? `${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB` : 'N/A',
      cursoId: cursoId
    });

    // Validações
    if (!fileBuffer || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Validar tamanho do arquivo (200MB máximo para vídeos, 10MB para outros)
    const maxSize = fileType.startsWith('video/') ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
      });
    }

    // Determinar tipo de arquivo final
    const finalFileType = detectFileType(fileName, fileType);
    const contentType = getContentType(finalFileType);
    
    console.log('📄 Tipo detectado:', {
      original: fileType,
      final: finalFileType,
      contentType: contentType
    });

    // Validar tipos permitidos
    const allowedTypes = [
      // Imagens
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      
      // Vídeos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
      
      // Outros
      'application/zip',
      'application/vnd.rar',
      'application/x-7z-compressed'
    ];

    if (!allowedTypes.includes(finalFileType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de arquivo não permitido',
        received_type: finalFileType,
        allowed_types: allowedTypes
      });
    }

    // Determinar pasta baseada no curso (se fornecido)
    let folder = 'geral';
    if (cursoId) {
      folder = `cursos/${cursoId}`;
      console.log('📂 Usando pasta específica do curso:', folder);
    }

    // Fazer upload
    console.log('📤 Iniciando upload para serviço de armazenamento...');
    
    const uploadResult = await storageService.uploadFile(
      fileBuffer,
      fileName,
      finalFileType,
      folder
    );

    console.log('✅ Upload realizado com sucesso:', {
      provider: uploadResult.provider,
      fileName: uploadResult.fileName,
      url: uploadResult.url,
      size: uploadResult.bytes
    });

    // Determinar URL compatível (mantendo estrutura antiga)
    let urlPath = '';
    switch (contentType) {
      case 'video':
        urlPath = '/uploads/videos/';
        break;
      case 'image':
        urlPath = '/uploads/images/';
        break;
      case 'application':
      case 'text':
        urlPath = '/uploads/documents/';
        break;
      default:
        urlPath = '/uploads/documents/';
    }

    const localUrl = `${urlPath}${uploadResult.fileName}`;

    // Retornar resposta
    return res.status(200).json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      file: {
        originalName: fileName,
        filename: uploadResult.fileName,
        // URLs: real e compatível
        url: uploadResult.url, // URL real do serviço externo
        localUrl: localUrl, // URL compatível com sistema antigo
        size: uploadResult.bytes || fileBuffer.length,
        mimetype: finalFileType,
        type: contentType,
        // Metadados
        provider: uploadResult.provider,
        public_id: uploadResult.public_id || null,
        path: uploadResult.path || null,
        // Informações adicionais
        curso_id: cursoId || null,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 ERRO NO PROCESSAMENTO:', error.message);
    
    let message = 'Erro interno do servidor';
    let statusCode = 500;

    if (error.message.includes('Content-Type must be')) {
      message = 'Formato de requisição inválido. Use multipart/form-data para uploads.';
      statusCode = 400;
    } else if (error.message.includes('Arquivo muito grande')) {
      message = error.message;
      statusCode = 400;
    } else if (error.message.includes('Tipo de arquivo não permitido')) {
      message = error.message;
      statusCode = 400;
    } else if (error.message.includes('Nenhum arquivo')) {
      message = error.message;
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}