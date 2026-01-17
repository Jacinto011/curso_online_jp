import storageService from '../../lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse multipart form data
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
          reject(new Error('Content-Type deve ser multipart/form-data'));
          return;
        }
        
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
          reject(new Error('Boundary não encontrado'));
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
        console.error('❌ Parse error:', error.message);
        reject(new Error('Erro ao processar formulário'));
      }
    });
    
    req.on('error', reject);
  });
}

// Detectar tipo de arquivo
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
    'txt': 'text/plain',
    'csv': 'text/csv'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido'
    });
  }

  console.log('🔄 Upload request recebido');
  
  try {
    // Parse dos dados
    const { fields, fileBuffer, fileName, fileType, cursoId } = await parseMultipartFormData(req);
    
    console.log('✅ Dados parseados:', {
      arquivo: fileName ? `${fileName} (${(fileBuffer?.length || 0) / 1024 / 1024}MB)` : 'Nenhum',
      tipo: fileType,
      cursoId: cursoId || 'Nenhum'
    });

    // Validações básicas
    if (!fileBuffer || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // Detectar tipo final
    const finalFileType = detectFileType(fileName, fileType);
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    
    console.log(`📄 Arquivo: ${fileName}, Tipo: ${finalFileType}, Tamanho: ${fileSizeMB}MB`);

    // Validar tipos permitidos
    const allowedTypes = [
      // Imagens
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      
      // VÍDEOS - TODOS permitidos no Supabase
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska',
      
      // Documentos
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(finalFileType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de arquivo não permitido',
        received_type: finalFileType
      });
    }

    // Validação de tamanho (200MB máximo)
    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande (${fileSizeMB}MB). Limite máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
        currentSizeMB: fileSizeMB
      });
    }

    // Determinar pasta
    let folder = 'geral';
    if (cursoId && cursoId.trim() !== '') {
      folder = `cursos/${cursoId.trim()}`;
      console.log('📂 Pasta do curso:', folder);
    }

    // Upload
    console.log('📤 Iniciando upload...');
    const startTime = Date.now();
    
    const uploadResult = await storageService.uploadFile(
      fileBuffer,
      fileName,
      finalFileType,
      folder
    );

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ Upload concluído:', {
      provider: uploadResult.provider,
      tempo: `${uploadTime}s`,
      tamanho: uploadResult.bytes ? `${(uploadResult.bytes / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    });

    // Determinar tipo de conteúdo para resposta
    let contentType = 'file';
    if (finalFileType.startsWith('video/')) contentType = 'video';
    else if (finalFileType.startsWith('image/')) contentType = 'image';
    else if (finalFileType.includes('pdf')) contentType = 'document';

    // Montar resposta
    const response = {
      success: true,
      message: 'Arquivo enviado com sucesso',
      file: {
        originalName: fileName,
        filename: uploadResult.fileName,
        url: uploadResult.url,
        localUrl: uploadResult.localUrl,
        size: uploadResult.bytes || fileBuffer.length,
        sizeMB: parseFloat(fileSizeMB),
        mimetype: finalFileType,
        type: contentType,
        provider: uploadResult.provider,
        path: uploadResult.path || null,
        curso_id: cursoId || null,
        uploadedAt: new Date().toISOString(),
        uploadTime: `${uploadTime}s`,
        // INFO IMPORTANTE: Mostrar que vídeos vão sempre para Supabase
        note: finalFileType.startsWith('video/') ? 'Vídeo armazenado no Supabase' : null
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 ERRO NO UPLOAD:', error.message);
    
    let statusCode = 500;
    let message = 'Erro interno do servidor';

    if (error.message.includes('Content-Type') || error.message.includes('multipart')) {
      statusCode = 400;
      message = 'Formato de requisição inválido. Use multipart/form-data.';
    } else if (error.message.includes('Tamanho') || error.message.includes('tamanho') || error.message.includes('size')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('Tipo de arquivo')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('Nenhum arquivo')) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes('Bucket não')) {
      statusCode = 500;
      message = 'Configuração de armazenamento incompleta. Contate o administrador.';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}