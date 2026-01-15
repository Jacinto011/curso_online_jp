import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

// Função auxiliar para calcular progresso
async function calcularProgresso(matriculaId, cursoId) {
  // Total de aulas do curso
  const totalResult = await query(`
    SELECT COUNT(*) as total
    FROM materiais m
    JOIN modulos md ON m.modulo_id = md.id
    WHERE md.curso_id = $1
  `, [cursoId]);
  
  const total = parseInt(totalResult.rows[0].total);
  
  // Aulas concluídas pelo estudante
  const concluidasResult = await query(`
    SELECT COUNT(*) as concluidas
    FROM progresso p
    JOIN materiais m ON p.material_id = m.id
    JOIN modulos md ON m.modulo_id = md.id
    WHERE p.matricula_id = $1 AND md.curso_id = $2 AND p.concluido = true
  `, [matriculaId, cursoId]);
  
  const concluidas = parseInt(concluidasResult.rows[0].concluidas);
  const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  
  return { total, concluidas, percentual };
}

// Função auxiliar para gerar certificado
async function gerarCertificado(matriculaId) {
  try {
    const codigoVerificacao = 'CERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    await query(`
      INSERT INTO certificados (matricula_id, codigo_verificacao, data_emissao)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `, [matriculaId, codigoVerificacao]);
    
    // Criar notificação
    await query(`
      INSERT INTO notificacoes 
      (usuario_id, tipo, titulo, mensagem)
      SELECT 
        m.estudante_id,
        'certificado',
        'Certificado emitido!',
        'Parabéns! Você concluiu o curso e seu certificado foi emitido.'
      FROM matriculas m
      WHERE m.id = $1
    `, [matriculaId]);
    
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido',
      allowed: ['POST']
    });
  }

  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    const { id: aulaId } = req.query;

    if (!aulaId) {
      return res.status(400).json({ 
        success: false,
        message: 'ID da aula é obrigatório' 
      });
    }

    // Buscar informações da aula
    const aulaResult = await query(`
      SELECT 
        m.id,
        m.modulo_id,
        md.curso_id
      FROM materiais m
      JOIN modulos md ON m.modulo_id = md.id
      WHERE m.id = $1
    `, [aulaId]);
    
    if (aulaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Aula não encontrada' 
      });
    }
    
    const aula = aulaResult.rows[0];

    // Verificar matrícula
    const matriculaResult = await query(`
      SELECT id 
      FROM matriculas 
      WHERE estudante_id = $1 AND curso_id = $2
    `, [user.id, aula.curso_id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Você não está matriculado neste curso' 
      });
    }
    
    const matriculaId = matriculaResult.rows[0].id;

    // Verificar se já está concluída
    const progressoResult = await query(`
      SELECT concluido 
      FROM progresso 
      WHERE matricula_id = $1 AND material_id = $2
    `, [matriculaId, aulaId]);
    
    if (progressoResult.rows.length > 0 && progressoResult.rows[0].concluido) {
      const progressoAtual = await calcularProgresso(matriculaId, aula.curso_id);
      return res.status(200).json({
        success: true,
        message: 'Aula já estava concluída',
        data: {
          progresso: progressoAtual.percentual,
          aulas_concluidas: progressoAtual.concluidas,
          total_aulas: progressoAtual.total
        }
      });
    }

    // Atualizar ou inserir progresso
    if (progressoResult.rows.length > 0) {
      await query(`
        UPDATE progresso 
        SET concluido = true, data_conclusao = CURRENT_TIMESTAMP
        WHERE matricula_id = $1 AND material_id = $2
      `, [matriculaId, aulaId]);
    } else {
      await query(`
        INSERT INTO progresso 
        (matricula_id, modulo_id, material_id, concluido, data_conclusao)
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
      `, [matriculaId, aula.modulo_id, aulaId]);
    }

    // Calcular novo progresso
    const progresso = await calcularProgresso(matriculaId, aula.curso_id);
    
    // Verificar se curso foi concluído
    if (progresso.percentual >= 100) {
      await query(`
        UPDATE matriculas 
        SET status = 'concluida', data_conclusao = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [matriculaId]);
      
      // Gerar certificado
      await gerarCertificado(matriculaId);
    }

    res.status(200).json({
      success: true,
      message: 'Aula marcada como concluída',
      data: {
        progresso: progresso.percentual,
        aulas_concluidas: progresso.concluidas,
        total_aulas: progresso.total,
        curso_concluido: progresso.percentual >= 100
      }
    });
    
  } catch (error) {
    console.error('Erro ao concluir aula:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);