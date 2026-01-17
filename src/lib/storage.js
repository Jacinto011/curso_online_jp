import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// Configurar Cloudinary (apenas para imagens/PDFs)
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
    this.supabaseBucket = 'course-files';
    
    console.log('🚀 StorageService inicializado');
    console.log('📊 REGRA SIMPLES:');
    console.log('   • TODOS os vídeos → Supabase');
    console.log('   • Imagens/PDFs pequenos → Cloudinary');
    console.log('   • Outros arquivos → Supabase');
  }

  async uploadFile(fileBuffer, fileName, fileType, folder = 'uploads') {
    const fileSize = fileBuffer.length;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    
    console.log(`📤 Upload: ${fileName} (${fileSizeMB}MB, ${fileType})`);
    
    try {
      // REGRA ÚNICA: Se for vídeo → SEMPRE Supabase
      if (fileType.startsWith('video/')) {
        console.log(`🎬 VÍDEO detectado (${fileSizeMB}MB) → Supabase`);
        return await this.uploadToSupabase(fileBuffer, fileName, fileType, folder);
      }
      
      // Para imagens e PDFs pequenos, usar Cloudinary
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        if (fileSize <= 20 * 1024 * 1024) { // 20MB máximo para Cloudinary
          console.log(`🖼️  Imagem/PDF pequeno (${fileSizeMB}MB) → Cloudinary`);
          return await this.uploadToCloudinary(fileBuffer, fileName, fileType, folder);
        } else {
          console.log(`🖼️  Imagem/PDF grande (${fileSizeMB}MB > 20MB) → Supabase`);
          return await this.uploadToSupabase(fileBuffer, fileName, fileType, folder);
        }
      }
      
      // Qualquer outro arquivo → Supabase
      console.log(`📄 Outro arquivo (${fileType}) → Supabase`);
      return await this.uploadToSupabase(fileBuffer, fileName, fileType, folder);
      
    } catch (error) {
      console.error('❌ Erro no upload:', error.message);
      
      // Fallback local apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development' || process.env.ENABLE_LOCAL_FALLBACK === 'true') {
        console.log('🔄 Usando fallback local...');
        return await this.uploadLocalFallback(fileBuffer, fileName, fileType, folder);
      }
      
      throw error;
    }
  }

  async uploadToCloudinary(fileBuffer, fileName, fileType, folder) {
    return new Promise((resolve, reject) => {
      console.log(`☁️  Enviando para Cloudinary...`);
      
      const sanitizedName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, '_');
      
      const uploadOptions = {
        resource_type: 'image', // Sempre 'image' para Cloudinary (imagens e PDFs)
        folder: `${folder}/images`,
        public_id: sanitizedName,
        overwrite: false,
        timeout: 30000, // 30 segundos
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error.message);
            reject(new Error(`Cloudinary: ${error.message}`));
          } else {
            console.log('✅ Cloudinary success:', result.secure_url);
            
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes,
              provider: 'cloudinary',
              fileName: result.public_id.split('/').pop() + '.' + result.format,
              localUrl: `/uploads/images/${result.public_id.split('/').pop()}.${result.format}`,
              resourceType: 'image'
            });
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  }

  async uploadToSupabase(fileBuffer, fileName, fileType, folder) {
    try {
      const fileSize = fileBuffer.length;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
      
      // Verificar limite do Supabase (200MB para ser generoso)
      const MAX_SUPABASE_SIZE = 200 * 1024 * 1024;
      if (fileSize > MAX_SUPABASE_SIZE) {
        throw new Error(
          `Arquivo muito grande (${fileSizeMB}MB). ` +
          `Limite máximo: ${MAX_SUPABASE_SIZE / 1024 / 1024}MB. ` +
          `Por favor, comprima o arquivo.`
        );
      }
      
      // Gerar nome único e seguro
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const safeFileName = fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 80);
      
      const uniqueFileName = `${timestamp}-${uniqueId}-${safeFileName}`;
      const resourceType = fileType.split('/')[0]; // 'video', 'image', 'application', etc.
      const filePath = `${folder}/${resourceType}s/${uniqueFileName}`;
      
      console.log(`🗄️  Enviando para Supabase: ${filePath} (${fileSizeMB}MB)`);
      
      // Upload para Supabase
      const { data, error } = await supabase.storage
        .from(this.supabaseBucket)
        .upload(filePath, fileBuffer, {
          contentType: fileType,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Supabase error:', error.message);
        
        if (error.message.includes('not found')) {
          throw new Error('Bucket não encontrado. Verifique a configuração do Supabase.');
        }
        if (error.message.includes('Payload too large')) {
          throw new Error(`Arquivo muito grande (${fileSizeMB}MB) para o bucket configurado.`);
        }
        throw error;
      }

      // Gerar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(this.supabaseBucket)
        .getPublicUrl(filePath);

      console.log('✅ Supabase success! URL:', publicUrl);

      return {
        url: publicUrl,
        path: filePath,
        fileName: uniqueFileName,
        provider: 'supabase',
        localUrl: `/uploads/${resourceType}s/${uniqueFileName}`,
        resourceType: resourceType,
        bytes: fileSize
      };
      
    } catch (error) {
      console.error('❌ Supabase failed:', error.message);
      throw error;
    }
  }

  async uploadLocalFallback(fileBuffer, fileName, fileType, folder) {
    console.log('💾 Fallback local...');
    
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    
    const resourceType = fileType.split('/')[0];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${resourceType}s`);
    
    // Criar diretório
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.warn('⚠️  Erro ao criar diretório:', error.message);
    }
    
    // Nome único
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}-${uniqueId}-${safeFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    try {
      await fs.writeFile(filePath, fileBuffer);
      console.log('✅ Local fallback salvo:', filePath);
      
      return {
        url: `/uploads/${resourceType}s/${uniqueFileName}`,
        path: filePath,
        fileName: uniqueFileName,
        provider: 'local',
        localUrl: `/uploads/${resourceType}s/${uniqueFileName}`,
        resourceType: resourceType,
        bytes: fileBuffer.length
      };
    } catch (error) {
      console.error('❌ Erro no fallback local:', error.message);
      throw new Error('Falha no armazenamento local');
    }
  }

  async deleteFile(url, provider) {
    try {
      if (!url || !provider) {
        throw new Error('URL e provider são obrigatórios');
      }
      
      if (provider === 'cloudinary') {
        const publicId = this.extractCloudinaryPublicId(url);
        if (!publicId) throw new Error('Public ID não encontrado');
        
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('✅ Cloudinary delete:', publicId);
        return result;
        
      } else if (provider === 'supabase') {
        const path = this.extractSupabasePath(url);
        if (!path) throw new Error('Path não encontrado');
        
        const { data, error } = await supabase.storage
          .from(this.supabaseBucket)
          .remove([path]);
        
        if (error) throw error;
        
        console.log('✅ Supabase delete:', path);
        return data;
        
      } else if (provider === 'local') {
        const fs = await import('fs');
        const pathModule = await import('path');
        
        const filePath = pathModule.join(process.cwd(), 'public', url);
        fs.unlinkSync(filePath);
        console.log('✅ Local delete:', filePath);
        return { success: true };
        
      } else {
        throw new Error(`Provider não suportado: ${provider}`);
      }
    } catch (error) {
      console.error('❌ Delete error:', error.message);
      throw error;
    }
  }

  extractCloudinaryPublicId(url) {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  extractSupabasePath(url) {
    try {
      const match = url.match(/\/storage\/v1\/object\/public\/course-files\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

// Instância única
const storageService = new StorageService();
export default storageService;