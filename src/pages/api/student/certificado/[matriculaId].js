import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido'
      });
    }

    const { matriculaId } = req.query;
    
    if (!matriculaId) {
      return res.status(400).json({ 
        success: false,
        message: 'ID da matrícula é obrigatório' 
      });
    }

    // Verificar se a matrícula pertence ao usuário
    const matriculaResult = await query(`
      SELECT m.id FROM matriculas m
      WHERE m.id = $1 AND m.estudante_id = $2
    `, [matriculaId, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Matrícula não encontrada' 
      });
    }

    // Buscar certificado
    const certificadoResult = await query(`
      SELECT c.* 
      FROM certificados c
      WHERE c.matricula_id = $1
    `, [matriculaId]);

    if (certificadoResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        certificado: certificadoResult.rows[0]
      });
    } else {
      return res.status(200).json({
        success: true,
        certificado: null,
        message: 'Nenhum certificado encontrado'
      });
    }
    
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

export default withCors(handler);