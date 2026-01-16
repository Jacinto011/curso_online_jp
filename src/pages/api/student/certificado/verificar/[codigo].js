// api/student/certificado/verificar/[codigo].js
import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  const { codigo } = req.query;

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
        message: 'Método não permitido',
        allowed: ['GET']
      });
    }

    if (!codigo) {
      return res.status(400).json({ 
        success: false,
        message: 'Código de verificação é obrigatório' 
      });
    }

    // Buscar certificado
    const result = await query(`
      SELECT 
        cert.*,
        c.titulo as curso_titulo,
        c.descricao as curso_descricao,
        estudante.nome as estudante_nome,
        estudante.email as estudante_email,
        instrutor.nome as instrutor_nome,
        instrutor.id as instrutor_id,
        m.data_conclusao,
        m.data_matricula,
        m.estudante_id
      FROM certificados cert
      JOIN matriculas m ON cert.matricula_id = m.id
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios estudante ON m.estudante_id = estudante.id
      JOIN usuarios instrutor ON c.instrutor_id = instrutor.id
      WHERE cert.codigo_verificacao = $1
    `, [codigo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificado não encontrado',
        valid: false
      });
    }

    const certificado = result.rows[0];

    // Verificar permissões: APENAS o estudante ou o instrutor do curso
    const usuarioAutorizado = 
      user.id === certificado.estudante_id || // É o estudante
      user.id === certificado.instrutor_id || // É o instrutor do curso
      user.tipo === 'admin';                   // É admin

    if (!usuarioAutorizado) {
      return res.status(403).json({ 
        success: false,
        message: 'Você não tem permissão para acessar este certificado',
        valid: false
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        estudante: {
          nome: certificado.estudante_nome,
          email: certificado.estudante_email
        },
        curso: {
          titulo: certificado.curso_titulo,
          descricao: certificado.curso_descricao
        },
        instrutor: {
          nome: certificado.instrutor_nome
        },
        datas: {
          conclusao: certificado.data_conclusao,
          matricula: certificado.data_matricula,
          emissao: certificado.data_emissao
        },
        certificado: {
          codigo: certificado.codigo_verificacao,
          url_pdf: certificado.url_pdf,
          id: certificado.id
        },
        permissao: {
          podeVer: true,
          ehEstudante: user.id === certificado.estudante_id,
          ehInstrutor: user.id === certificado.instrutor_id
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar certificado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      valid: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withCors(handler);