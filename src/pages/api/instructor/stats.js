import withCors from '../../../lib/cors';
import { query } from '../../../lib/database-postgres';
import { authenticate } from '../../../lib/auth';

async function handler(req, res) {
  try {
    // Autenticação
    const user = await authenticate(req);
    if (!user || user.role !== 'instructor') {
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado' 
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false,
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    try {
      const { periodo = '30dias' } = req.query;
      
      // Calcular data base com base no período
      let dataInicio;
      const hoje = new Date();
      
      switch (periodo) {
        case '7dias':
          dataInicio = new Date(hoje.setDate(hoje.getDate() - 7));
          break;
        case '30dias':
          dataInicio = new Date(hoje.setDate(hoje.getDate() - 30));
          break;
        case '90dias':
          dataInicio = new Date(hoje.setDate(hoje.getDate() - 90));
          break;
        case 'ano':
          dataInicio = new Date(hoje.setFullYear(hoje.getFullYear() - 1));
          break;
        default:
          dataInicio = new Date(hoje.setDate(hoje.getDate() - 30));
      }

      // Matrículas por dia nos últimos 30 dias
      const matriculasPorDiaResult = await query(`
        SELECT 
          DATE(m.data_matricula) as data,
          COUNT(*) as total
        FROM matriculas m
        JOIN cursos c ON m.curso_id = c.id
        WHERE c.instrutor_id = $1 
          AND m.data_matricula >= $2
        GROUP BY DATE(m.data_matricula)
        ORDER BY data ASC
      `, [user.id, dataInicio]);

      // Pagamentos por dia
      const pagamentosPorDiaResult = await query(`
        SELECT 
          DATE(p.data_pagamento) as data,
          COUNT(*) as total,
          SUM(p.valor) as valor_total
        FROM pagamentos p
        JOIN matriculas m ON p.matricula_id = m.id
        JOIN cursos c ON m.curso_id = c.id
        WHERE c.instrutor_id = $1 
          AND p.status = 'pago'
          AND p.data_pagamento >= $2
        GROUP BY DATE(p.data_pagamento)
        ORDER BY data ASC
      `, [user.id, dataInicio]);

      // Cursos mais populares
      const cursosPopularesResult = await query(`
        SELECT 
          c.id,
          c.titulo,
          COUNT(m.id) as total_matriculas,
          COALESCE(SUM(p.valor), 0) as receita_total
        FROM cursos c
        LEFT JOIN matriculas m ON c.id = m.curso_id
        LEFT JOIN pagamentos p ON m.id = p.matricula_id AND p.status = 'pago'
        WHERE c.instrutor_id = $1
        GROUP BY c.id, c.titulo
        ORDER BY total_matriculas DESC
        LIMIT 5
      `, [user.id]);

      // Total de matrículas (sem taxa de conversão)
      const totalMatriculasResult = await query(`
        SELECT COUNT(*) as total
        FROM matriculas m
        JOIN cursos c ON m.curso_id = c.id
        WHERE c.instrutor_id = $1
      `, [user.id]);

      const totalMatriculas = parseInt(totalMatriculasResult.rows[0]?.total || 0);

      // Calcular valor mensal dos pagamentos
      const valorMensal = pagamentosPorDiaResult.rows.reduce((sum, row) => {
        return sum + (parseFloat(row.valor_total) || 0);
      }, 0);

      res.status(200).json({
        success: true,
        data: {
          period: periodo,
          matriculas_por_dia: matriculasPorDiaResult.rows,
          pagamentos_por_dia: pagamentosPorDiaResult.rows,
          cursos_populares: cursosPopularesResult.rows,
          metricas: {
            total_matriculas: totalMatriculas,
            valor_mensal: parseFloat(valorMensal.toFixed(2))
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('Erro na API de analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);