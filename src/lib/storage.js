import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class StorageService {
  constructor() {
    this.defaultProvider = process.env.DEFAULT_STORAGE_PROVIDER || 'cloudinary';
  }

  async uploadFile(fileBuffer, fileName, fileType, folder = 'uploads') {
    const fileSize = fileBuffer.length;
    
    try {
      // Determinar resource type para Cloudinary
      const resourceType = this.getResourceType(fileType);
      
      // Regras de escolha do provider:
      // 1. Cloudinary para imagens e vídeos pequenos (<100MB)
      // 2. Supabase para documentos, vídeos grandes, e fallback
      
      if ((resourceType === 'image' || resourceType === 'video') && fileSize <= 100 * 1024 * 1024) {
        console.log('☁️  Usando Cloudinary para:', resourceType);
        return await this.uploadToCloudinary(fileBuffer, fileName, fileType, folder, resourceType);
      } else {
        console.log('🗄️  Usando Supabase para:', resourceType);
        return await this.uploadToSupabase(fileBuffer, fileName, fileType, folder);
      }
      
    } catch (error) {
      console.error('❌ Erro no upload principal:', error.message);
      
      // Fallback local apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development' || process.env.ENABLE_LOCAL_FALLBACK === 'true') {
        console.log('🔄 Usando fallback local...');
        return await this.uploadLocalFallback(fileBuffer, fileName, fileType, folder);
      }
      
      throw error;
    }
  }

  getResourceType(fileType) {
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('application/pdf')) return 'image'; // PDFs no Cloudinary
    if (fileType.includes('msword') || fileType.includes('spreadsheet') || fileType.includes('presentation')) {
      return 'raw'; // Documentos Office
    }
    return 'auto';
  }

  async uploadToCloudinary(fileBuffer, fileName, fileType, folder, resourceType = 'auto') {
    return new Promise((resolve, reject) => {
      console.log(`☁️  Cloudinary upload iniciado: ${resourceType} - ${fileName}`);
      
      // Configurações específicas por tipo
      const uploadOptions = {
        resource_type: resourceType,
        folder: `${folder}/${resourceType}s`,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        overwrite: false,
      };

      // Adicionar transformações específicas
      if (resourceType === 'image') {
        uploadOptions.transformation = [
          { quality: 'auto', fetch_format: 'auto' }
        ];
      } else if (resourceType === 'video') {
        uploadOptions.transformation = [
          { quality: 'auto' }
        ];
        uploadOptions.chunk_size = 6000000; // 6MB chunks para vídeos grandes
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', {
              url: result.secure_url,
              size: result.bytes,
              format: result.format
            });
            
            // Gerar thumbnail para vídeos
            let thumbnailUrl = null;
            if (resourceType === 'video') {
              thumbnailUrl = cloudinary.url(result.public_id, {
                resource_type: 'video',
                format: 'jpg',
                transformation: [
                  { width: 854, height: 480, crop: "fill" },
                  { quality: "auto" }
                ]
              });
            }

            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes,
              provider: 'cloudinary',
              fileName: result.public_id.split('/').pop() + '.' + result.format,
              localUrl: `/uploads/${resourceType}s/${result.public_id.split('/').pop()}.${result.format}`,
              thumbnailUrl: thumbnailUrl,
              resourceType: resourceType
            });
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  }

  async uploadToSupabase(fileBuffer, fileName, fileType, folder) {
    try {
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(7);
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${timestamp}-${uniqueId}-${safeFileName}`;
      
      const resourceType = fileType.split('/')[0];
      const filePath = `${folder}/${resourceType}s/${uniqueFileName}`;
      
      console.log(`🗄️  Supabase upload para: ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from('course-files')
        .upload(filePath, fileBuffer, {
          contentType: fileType,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      // Gerar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);

      console.log('✅ Supabase upload success:', { publicUrl });

      return {
        url: publicUrl,
        path: filePath,
        fileName: uniqueFileName,
        provider: 'supabase',
        localUrl: `/uploads/${resourceType}s/${uniqueFileName}`,
        resourceType: resourceType
      };
      
    } catch (error) {
      console.error('❌ Supabase upload failed:', error);
      throw error;
    }
  }

  async uploadLocalFallback(fileBuffer, fileName, fileType, folder) {
    console.log('💾 Usando fallback local...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const resourceType = fileType.split('/')[0];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${resourceType}s`);
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    fs.writeFileSync(filePath, fileBuffer);
    
    console.log('✅ Local fallback success:', filePath);
    
    return {
      url: `/uploads/${resourceType}s/${uniqueFileName}`,
      path: filePath,
      fileName: uniqueFileName,
      provider: 'local',
      localUrl: `/uploads/${resourceType}s/${uniqueFileName}`,
      resourceType: resourceType
    };
  }

  // Método para deletar arquivos
  async deleteFile(url, provider) {
    try {
      if (provider === 'cloudinary') {
        const publicId = this.extractCloudinaryPublicId(url);
        await cloudinary.uploader.destroy(publicId);
        console.log('✅ Arquivo deletado do Cloudinary:', publicId);
      } else if (provider === 'supabase') {
        const path = this.extractSupabasePath(url);
        await supabase.storage.from('course-files').remove([path]);
        console.log('✅ Arquivo deletado do Supabase:', path);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error.message);
      throw error;
    }
  }

  extractCloudinaryPublicId(url) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  }

  extractSupabasePath(url) {
    const match = url.match(/\/storage\/v1\/object\/public\/course-files\/(.+)$/);
    return match ? match[1] : null;
  }
}

export default new StorageService();