import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';
import { generateCertificate } from '../../../../lib/certificate-generator';
import storageService from '../../../../lib/storage';

async function handler(req, res) {
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
        message: 'Método não permitido'
      });
    }

    const { matricula_id } = req.body;
    
    if (!matricula_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Matrícula é obrigatória' 
      });
    }

    // Verificar matrícula
    const matriculaResult = await query(`
      SELECT m.*, c.titulo as curso_titulo, u.nome as estudante_nome,
             c.instrutor_id
      FROM matriculas m
      JOIN cursos c ON m.curso_id = c.id
      JOIN usuarios u ON m.estudante_id = u.id
      WHERE m.id = $1 AND m.estudante_id = $2
    `, [matricula_id, user.id]);
    
    if (matriculaResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matrícula não encontrada' 
      });
    }

    const matricula = matriculaResult.rows[0];

    // Verificar se o curso está concluído
    if (matricula.status !== 'concluida') {
      return res.status(400).json({ 
        success: false,
        message: 'O curso ainda não foi concluído' 
      });
    }

    // Verificar se já tem certificado na tabela certificados
    const certificadoExistente = await query(`
      SELECT url_pdf FROM certificados 
      WHERE matricula_id = $1
    `, [matricula_id]);

    if (certificadoExistente.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Certificado já existe',
        certificadoGerado: true,
        certificadoUrl: certificadoExistente.rows[0].url_pdf
      });
    }

    // Verificar se todos os quizzes foram aprovados
    const quizzesResult = await query(`
      SELECT COUNT(q.id) as total_quizzes,
             COUNT(rq.id) as approved_quizzes
      FROM modulos m
      LEFT JOIN quizzes q ON m.id = q.modulo_id
      LEFT JOIN resultados_quiz rq ON q.id = rq.quiz_id 
        AND rq.matricula_id = $1 
        AND rq.aprovado = true
      WHERE m.curso_id = $2
    `, [matricula_id, matricula.curso_id]);
    
    const { total_quizzes, approved_quizzes } = quizzesResult.rows[0];
    
    if (total_quizzes > 0 && approved_quizzes < total_quizzes) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos os quizzes devem ser aprovados antes de gerar o certificado' 
      });
    }

    // Gerar certificado
    const certificadoGerado = await gerarCertificado(matricula);
    
    if (certificadoGerado.success) {
      return res.status(200).json({
        success: true,
        message: 'Certificado gerado com sucesso!',
        certificadoGerado: true,
        certificadoUrl: certificadoGerado.url
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar certificado'
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar/emitir certificado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

async function gerarCertificado(matricula) {
  try {
    const instrutorResult = await query(`
      SELECT u.nome as instrutor_nome, u.email as instrutor_email
      FROM usuarios u
      WHERE u.id = $1
    `, [matricula.instrutor_id]);
    
    const instrutor = instrutorResult.rows[0] || { 
      instrutor_nome: 'Equipe de Ensino', 
      instrutor_email: '' 
    };

    const codigoVerificacao = `CERT-${matricula.curso_id}-${matricula.id}-${Date.now()}`.toUpperCase();
    
    const certificadoData = {
      estudanteNome: matricula.estudante_nome,
      cursoTitulo: matricula.curso_titulo,
      instrutorNome: instrutor.instrutor_nome,
      dataConclusao: new Date(matricula.data_conclusao || Date.now()).toLocaleDateString('pt-BR'),
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      codigoVerificacao: codigoVerificacao,
      horasCargaHoraria: '40 horas'
    };

    const pdfBuffer = await generateCertificate(certificadoData);
    
    const uploadResult = await storageService.uploadFile(
      pdfBuffer,
      `certificados/certificado-${matricula.id}-${Date.now()}.pdf`,
      'application/pdf'
    );

    await query(`
      INSERT INTO certificados 
        (matricula_id, curso_id, codigo_verificacao, url_pdf, data_emissao)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (matricula_id) DO UPDATE SET
        codigo_verificacao = EXCLUDED.codigo_verificacao,
        url_pdf = EXCLUDED.url_pdf,
        data_emissao = CURRENT_TIMESTAMP
    `, [matricula.id, matricula.curso_id, codigoVerificacao, uploadResult.url]);

    // Atualizar matrícula com URL do certificado
    await query(`
      UPDATE matriculas 
      SET certificado_url = $1
      WHERE id = $2
    `, [uploadResult.url, matricula.id]);

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

export default withCors(handler);