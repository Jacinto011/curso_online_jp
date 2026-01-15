import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
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
      SELECT id FROM matriculas 
      WHERE id = $1 AND estudante_id = $2
    `, [matricula_id, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        message: 'Matrícula não encontrada' 
      });
    }

    // Verificar se módulo pertence ao curso da matrícula
    const moduloResult = await query(`
      SELECT m.id 
      FROM modulos m
      JOIN matriculas mat ON m.curso_id = mat.curso_id
      WHERE m.id = $1 AND mat.id = $2
    `, [modulo_id, matricula_id]);
    
    if (moduloResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Módulo não pertence a este curso' 
      });
    }

    // Registrar conclusão do material se fornecido
    if (material_id) {
      // Verificar se material existe e pertence ao módulo
      const materialResult = await query(`
        SELECT id FROM materiais 
        WHERE id = $1 AND modulo_id = $2
      `, [material_id, modulo_id]);
      
      if (materialResult.rows.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Material não encontrado' 
        });
      }

      // Verificar se já foi concluído
      const progressoResult = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 AND material_id = $2
      `, [matricula_id, material_id]);
      
      if (progressoResult.rows.length === 0) {
        await query(
          `INSERT INTO progresso (matricula_id, modulo_id, material_id, concluido, data_conclusao)
           VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)`,
          [matricula_id, modulo_id, material_id]
        );
      }
    }

    // Verificar se todos os materiais do módulo foram concluídos
    const materiaisModuloResult = await query(`
      SELECT id FROM materiais WHERE modulo_id = $1
    `, [modulo_id]);

    const materiaisModulo = materiaisModuloResult.rows;

    const materiaisConcluidosResult = await query(`
      SELECT material_id FROM progresso 
      WHERE matricula_id = $1 AND modulo_id = $2 AND material_id IS NOT NULL AND concluido = true
    `, [matricula_id, modulo_id]);

    const materiaisConcluidos = materiaisConcluidosResult.rows;
    const todosMateriaisConcluidos = materiaisModulo.length > 0 && 
      materiaisConcluidos.length === materiaisModulo.length;

    // Se todos materiais concluídos, marcar módulo como concluído
    if (todosMateriaisConcluidos) {
      const moduloConcluidoResult = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 AND modulo_id = $2 AND material_id IS NULL
      `, [matricula_id, modulo_id]);
      
      if (moduloConcluidoResult.rows.length === 0) {
        await query(
          `INSERT INTO progresso (matricula_id, modulo_id, concluido, data_conclusao)
           VALUES ($1, $2, true, CURRENT_TIMESTAMP)`,
          [matricula_id, modulo_id]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Progresso registrado com sucesso',
      moduloConcluido: todosMateriaisConcluidos
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

export default withCors(handler);