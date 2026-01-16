// api/student/progresso/registrar.js - COM GERAÇÃO DE CERTIFICADO
import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';
import { generateCertificate } from '../../../../lib/certificate-generator'; // Vamos criar esta lib
import storageService from '../../../../lib/storage'; // IMPORT CORRETO


async function handler(req, res) {

  // ⬇️ ADICIONE ESTAS 2 LINHAS AQUI (logo no início do handler)
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30');
  
  // ⬇️ Opcional: Adicione timeout específico
  req.setTimeout(30000); // 30 segundos
  try {
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['POST']
      });
    }

    const { matricula_id, modulo_id, material_id } = req.body;
    
    if (!matricula_id || !modulo_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Matrícula e módulo são obrigatórios' 
      });
    }

    // Verificar se a matrícula pertence ao usuário
    const matriculaResult = await query(`
      SELECT m.*, c.id as curso_id, c.titulo as curso_titulo, 
             u.nome as estudante_nome, c.instrutor_id
      FROM matriculas m
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON m.estudante_id = u.id
      WHERE m.id = $1 AND m.estudante_id = $2
    `, [matricula_id, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Matrícula não encontrada' 
      });
    }

    const matricula = matriculaResult.rows[0];

    // Registrar progresso do material
    if (material_id) {
      // Verificar se já existe registro para evitar duplicação
      const existingMaterial = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 AND material_id = $2
      `, [matricula_id, material_id]);
      
      if (existingMaterial.rows.length > 0) {
        // Atualizar registro existente
        await query(`
          UPDATE progresso 
          SET concluido = true, 
              data_conclusao = CURRENT_TIMESTAMP,
              modulo_id = $3
          WHERE matricula_id = $1 AND material_id = $2
        `, [matricula_id, material_id, modulo_id]);
      } else {
        // Inserir novo registro
        await query(`
          INSERT INTO progresso 
            (matricula_id, modulo_id, material_id, concluido, data_conclusao)
          VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
        `, [matricula_id, modulo_id, material_id]);
      }
    }

    // Verificar se todos os materiais foram concluídos
    const todosMateriaisConcluidos = await verificarConclusaoModulo(matricula_id, modulo_id);
    
    if (todosMateriaisConcluidos) {
      // Verificar se já existe registro de módulo concluído
      const existingModulo = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 
          AND modulo_id = $2 
          AND material_id IS NULL
      `, [matricula_id, modulo_id]);
      
      if (existingModulo.rows.length > 0) {
        // Atualizar registro existente
        await query(`
          UPDATE progresso 
          SET concluido = true, 
              data_conclusao = CURRENT_TIMESTAMP
          WHERE matricula_id = $1 
            AND modulo_id = $2 
            AND material_id IS NULL
        `, [matricula_id, modulo_id]);
      } else {
        // Inserir novo registro
        await query(`
          INSERT INTO progresso 
            (matricula_id, modulo_id, concluido, data_conclusao)
          VALUES ($1, $2, true, CURRENT_TIMESTAMP)
        `, [matricula_id, modulo_id]);
      }

      // Verificar se todos os módulos foram concluídos
      const todosModulosConcluidos = await verificarConclusaoCurso(matricula_id, matricula.curso_id);
      
      if (todosModulosConcluidos) {
        // Atualizar matrícula para concluída
        await query(
          `UPDATE matriculas 
           SET status = 'concluida', data_conclusao = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [matricula_id]
        );

        // GERAR CERTIFICADO AUTOMATICAMENTE
        const certificadoGerado = await gerarCertificado(matricula);
        
        if (certificadoGerado.success) {
          res.status(200).json({
            success: true,
            message: 'Parabéns! Você concluiu o curso e seu certificado foi gerado!',
            cursoConcluido: true,
            moduloConcluido: true,
            certificadoGerado: true,
            certificadoUrl: certificadoGerado.url
          });
        } else {
          res.status(200).json({
            success: true,
            message: 'Parabéns! Você concluiu o curso!',
            cursoConcluido: true,
            moduloConcluido: true,
            certificadoGerado: false,
            certificadoError: certificadoGerado.error
          });
        }
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Progresso registrado com sucesso',
      moduloConcluido: todosMateriaisConcluidos,
      cursoConcluido: false
    });
    
  } catch (error) {
    console.error('Erro ao registrar progresso:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Função para gerar certificado - VERSÃO CORRIGIDA
async function gerarCertificado(matricula) {
  try {
    // Buscar informações completas do instrutor
    const instrutorResult = await query(`
      SELECT u.nome as instrutor_nome, u.email as instrutor_email
      FROM usuarios u
      WHERE u.id = $1
    `, [matricula.instrutor_id]);
    
    const instrutor = instrutorResult.rows[0] || { 
      instrutor_nome: 'Equipe de Ensino', 
      instrutor_email: '' 
    };

    // Gerar código único de verificação
    const codigoVerificacao = `CERT-${matricula.curso_id}-${matricula.id}-${Date.now()}`.toUpperCase();
    
    // Dados para o certificado
    const certificadoData = {
      estudanteNome: matricula.estudante_nome,
      cursoTitulo: matricula.curso_titulo,
      instrutorNome: instrutor.instrutor_nome,
      dataConclusao: new Date().toLocaleDateString('pt-BR'),
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      codigoVerificacao: codigoVerificacao
    };

    // Gerar PDF do certificado
    const pdfBuffer = await generateCertificate(certificadoData);
    
    // Upload para storage - AGORA USANDO CORRETAMENTE
    const uploadResult = await storageService.uploadFile(
      pdfBuffer,
      `certificado-${matricula.id}-${Date.now()}.pdf`,
      'application/pdf',
      'certificados'
    );

    // Salvar no banco de dados
    await query(`
      INSERT INTO certificados 
        (matricula_id, curso_id, codigo_verificacao, url_pdf, data_emissao)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (matricula_id) DO UPDATE SET
        codigo_verificacao = EXCLUDED.codigo_verificacao,
        url_pdf = EXCLUDED.url_pdf,
        data_emissao = CURRENT_TIMESTAMP
    `, [matricula.id, matricula.curso_id, codigoVerificacao, uploadResult.url]);

    return {
      success: true,
      url: uploadResult.url,
      codigo: codigoVerificacao
    };

  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function verificarConclusaoModulo(matriculaId, moduloId) {
  const result = await query(`
    WITH materiais_modulo AS (
      SELECT COUNT(*) as total FROM materiais WHERE modulo_id = $1
    ),
    materiais_concluidos AS (
      SELECT COUNT(DISTINCT material_id) as concluidos 
      FROM progresso 
      WHERE matricula_id = $2 
        AND modulo_id = $1 
        AND material_id IS NOT NULL 
        AND concluido = true
    )
    SELECT 
      COALESCE((SELECT total FROM materiais_modulo), 0) as total,
      COALESCE((SELECT concluidos FROM materiais_concluidos), 0) as concluidos
  `, [moduloId, matriculaId]);

  const { total, concluidos } = result.rows[0];
  return total === 0 || concluidos === total;
}

async function verificarConclusaoCurso(matriculaId, cursoId) {
  const result = await query(`
    WITH modulos_curso AS (
      SELECT COUNT(*) as total FROM modulos WHERE curso_id = $1
    ),
    modulos_concluidos AS (
      SELECT COUNT(DISTINCT modulo_id) as concluidos 
      FROM progresso 
      WHERE matricula_id = $2 
        AND concluido = true
        AND material_id IS NULL
    )
    SELECT 
      (SELECT total FROM modulos_curso) as total,
      (SELECT concluidos FROM modulos_concluidos) as concluidos
  `, [cursoId, matriculaId]);

  const { total, concluidos } = result.rows[0];
  return concluidos === total;
}

export default withCors(handler);