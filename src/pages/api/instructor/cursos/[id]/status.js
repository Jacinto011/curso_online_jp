import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  const { id } = req.query;

  switch (req.method) {
    case 'PUT':
      try {
        const { status } = req.body;
        
        if (!['rascunho', 'publicado', 'arquivado'].includes(status)) {
          return res.status(400).json({ message: 'Status inválido' });
        }
        
        // Verificar se curso existe
        const cursoResult = await query(
          'SELECT id FROM cursos WHERE id = $1',
          [id]
        );
        
        if (cursoResult.rows.length === 0) {
          return res.status(404).json({ message: 'Curso não encontrado' });
        }
        
        await query(
          'UPDATE cursos SET status = $1 WHERE id = $2',
          [status, id]
        );
        
        res.status(200).json({ 
          success: true, 
          message: `Status do curso alterado para ${status}` 
        });
        
      } catch (error) {
        console.error('Erro ao alterar status do curso:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT']);
      res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['PUT']
      });
  }
}

export default withCors(handler);