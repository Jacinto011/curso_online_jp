import withCors from '../../../../lib/cors';
import { query } from '../../../../lib/database-postgres';
import { authenticate } from '../../../../lib/auth';
import { generateCertificate } from '../../../../lib/certificate-generator';
import storageService from '../../../../lib/storage';

async function handler(req, res) {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30');
  req.setTimeout(30000);

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

    // VERIFICAÇÃO ATUALIZADA - Removida a coluna que não existe
    const matriculaResult = await query(`
      SELECT m.*, c.id as curso_id, c.titulo as curso_titulo, 
             u.nome as estudante_nome, c.instrutor_id
             -- certificado_autoemitir removido por enquanto
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

    // 1. Verificar se é a última aula do módulo
    const ultimaAulaInfo = await query(`
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
        COALESCE((SELECT total FROM materiais_modulo), 0) as total_materiais,
        COALESCE((SELECT concluidos FROM materiais_concluidos), 0) as concluidos_antes
    `, [modulo_id, matricula_id]);

    const { total_materiais, concluidos_antes } = ultimaAulaInfo.rows[0];
    
    // Calcular se será a última aula
    let seraUltimaAula = false;
    if (total_materiais > 0) {
      const materiaisRestantes = total_materiais - (concluidos_antes || 0);
      seraUltimaAula = materiaisRestantes === 1;
    }

    // 2. Verificar se existe quiz para este módulo e se foi aprovado
    const quizInfo = await query(`
      SELECT q.id, 
             COALESCE(q.pontuacao_minima, 70) as pontuacao_minima,
             rq.pontuacao as nota_estudante,
             rq.aprovado as quiz_aprovado,
             -- Verificar se é o último módulo do curso
             (SELECT MAX(ordem) FROM modulos WHERE curso_id = $3) as ultima_ordem,
             m.ordem as ordem_atual
      FROM modulos m
      LEFT JOIN quizzes q ON m.id = q.modulo_id
      LEFT JOIN resultados_quiz rq ON q.id = rq.quiz_id AND rq.matricula_id = $1
      WHERE m.id = $2
      ORDER BY rq.data_realizacao DESC
      LIMIT 1
    `, [matricula_id, modulo_id, matricula.curso_id]);

    const hasQuiz = quizInfo.rows[0]?.id;
    const quizApproved = quizInfo.rows[0]?.quiz_aprovado === true;
    const quizScore = quizInfo.rows[0]?.nota_estudante;
    const minScore = quizInfo.rows[0]?.pontuacao_minima || 70;
    const isLastQuizCourse = quizInfo.rows[0]?.ordem_atual === quizInfo.rows[0]?.ultima_ordem;

    // Verificar aprovação
    let isQuizApproved = false;
    if (hasQuiz) {
      if (quizApproved) {
        isQuizApproved = true;
      } else if (quizScore !== null && quizScore >= minScore) {
        isQuizApproved = true;
      }
    }

    // 3. Registrar progresso do material
    if (material_id) {
      const existingMaterial = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 AND material_id = $2
      `, [matricula_id, material_id]);
      
      if (existingMaterial.rows.length > 0) {
        await query(`
          UPDATE progresso 
          SET concluido = true, 
              data_conclusao = CURRENT_TIMESTAMP,
              modulo_id = $3
          WHERE matricula_id = $1 AND material_id = $2
        `, [matricula_id, material_id, modulo_id]);
      } else {
        await query(`
          INSERT INTO progresso 
            (matricula_id, modulo_id, material_id, concluido, data_conclusao)
          VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
        `, [matricula_id, modulo_id, material_id]);
      }
    }

    // 4. Verificar se todos os materiais foram concluídos
    const todosMateriaisConcluidos = await verificarConclusaoModulo(matricula_id, modulo_id);
    
    // SE NÃO FOR A ÚLTIMA AULA: permitir normalmente
    if (!seraUltimaAula) {
      return res.status(200).json({
        success: true,
        message: 'Material concluído com sucesso!',
        moduloConcluido: false,
        cursoConcluido: false,
        isLastMaterial: false
      });
    }
    
    // SE FOR A ÚLTIMA AULA E TEM QUIZ NÃO APROVADO
    if (seraUltimaAula && hasQuiz && !isQuizApproved) {
      return res.status(200).json({
        success: true,
        message: 'Material concluído! Agora realize o quiz para completar este módulo.',
        moduloConcluido: false,
        cursoConcluido: false,
        hasQuiz: true,
        quizId: quizInfo.rows[0].id,
        needQuiz: true,
        isLastMaterial: true,
        isLastQuizCourse: isLastQuizCourse
      });
    }

    // SE FOR A ÚLTIMA AULA E (NÃO TEM QUIZ OU QUIZ APROVADO)
    if (seraUltimaAula && (!hasQuiz || isQuizApproved)) {
      // Registrar módulo como concluído
      const existingModulo = await query(`
        SELECT id FROM progresso 
        WHERE matricula_id = $1 
          AND modulo_id = $2 
          AND material_id IS NULL
      `, [matricula_id, modulo_id]);
      
      if (existingModulo.rows.length > 0) {
        await query(`
          UPDATE progresso 
          SET concluido = true, 
              data_conclusao = CURRENT_TIMESTAMP
          WHERE matricula_id = $1 
            AND modulo_id = $2 
            AND material_id IS NULL
        `, [matricula_id, modulo_id]);
      } else {
        await query(`
          INSERT INTO progresso 
            (matricula_id, modulo_id, concluido, data_conclusao)
          VALUES ($1, $2, true, CURRENT_TIMESTAMP)
        `, [matricula_id, modulo_id]);
      }

      // Verificar se todos os módulos foram concluídos
      const todosModulosConcluidos = await verificarConclusaoCurso(matricula_id, matricula.curso_id);
      
      if (todosModulosConcluidos) {
        // Verificar se todos os quizzes foram aprovados
        const todosQuizzesAprovados = await verificarTodosQuizzesAprovados(matricula_id, matricula.curso_id);
        
        if (!todosQuizzesAprovados) {
          return res.status(200).json({
            success: true,
            message: 'Módulo concluído! Complete todos os quizzes para finalizar o curso.',
            moduloConcluido: true,
            cursoConcluido: false,
            needQuiz: true,
            isLastMaterial: true,
            todosQuizzesAprovados: false
          });
        }

        // Concluir curso
        await query(
          `UPDATE matriculas 
           SET status = 'concluida', data_conclusao = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [matricula_id]
        );

        // SEMPRE tentar gerar certificado quando curso for concluído
        let certificadoGerado = false;
        let certificadoUrl = null;
        
        try {
          const certificadoResult = await gerarCertificado(matricula);
          if (certificadoResult.success) {
            certificadoGerado = true;
            certificadoUrl = certificadoResult.url;
          }
        } catch (certError) {
          console.error('Erro ao gerar certificado:', certError);
        }

        return res.status(200).json({
          success: true,
          message: certificadoGerado 
            ? 'Parabéns! Você concluiu o curso e seu certificado foi gerado!' 
            : 'Parabéns! Você concluiu o curso!',
          cursoConcluido: true,
          moduloConcluido: true,
          certificadoGerado: certificadoGerado,
          certificadoUrl: certificadoUrl,
          isLastMaterial: true,
          todosQuizzesAprovados: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Módulo concluído com sucesso!',
        moduloConcluido: true,
        cursoConcluido: false,
        isLastMaterial: true
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Progresso registrado com sucesso',
      moduloConcluido: todosMateriaisConcluidos,
      cursoConcluido: false,
      isLastMaterial: seraUltimaAula
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

// Funções auxiliares atualizadas
async function gerarCertificado(matricula) {
  try {
    // Buscar instrutor
    const instrutorResult = await query(`
      SELECT u.nome as instrutor_nome, u.email as instrutor_email
      FROM usuarios u
      WHERE u.id = $1
    `, [matricula.instrutor_id]);
    
    const instrutor = instrutorResult.rows[0] || { 
      instrutor_nome: 'Equipe de Ensino', 
      instrutor_email: '' 
    };

    // Gerar código único
    const codigoVerificacao = `CERT-${matricula.curso_id}-${matricula.id}-${Date.now()}`.toUpperCase();
    
    const certificadoData = {
      estudanteNome: matricula.estudante_nome,
      cursoTitulo: matricula.curso_titulo,
      instrutorNome: instrutor.instrutor_nome,
      dataConclusao: new Date().toLocaleDateString('pt-BR'),
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      codigoVerificacao: codigoVerificacao,
      horasCargaHoraria: '40 horas'
    };

    // Gerar PDF do certificado
    const pdfBuffer = await generateCertificate(certificadoData);
    
    // Upload para storage
    const uploadResult = await storageService.uploadFile(
      pdfBuffer,
      `certificados/certificado-${matricula.id}-${Date.now()}.pdf`,
      'application/pdf'
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
      COALESCE((SELECT total FROM modulos_curso), 0) as total,
      COALESCE((SELECT concluidos FROM modulos_concluidos), 0) as concluidos
  `, [cursoId, matriculaId]);

  const { total, concluidos } = result.rows[0];
  return concluidos === total;
}

async function verificarTodosQuizzesAprovados(matriculaId, cursoId) {
  const result = await query(`
    WITH quizzes_curso AS (
      SELECT q.id 
      FROM quizzes q
      JOIN modulos m ON q.modulo_id = m.id
      WHERE m.curso_id = $1
    ),
    quizzes_aprovados AS (
      SELECT COUNT(DISTINCT rq.quiz_id) as aprovados
      FROM resultados_quiz rq
      JOIN quizzes_curso qc ON rq.quiz_id = qc.id
      WHERE rq.matricula_id = $2 AND rq.aprovado = true
    ),
    total_quizzes AS (
      SELECT COUNT(*) as total FROM quizzes_curso
    )
    SELECT 
      COALESCE((SELECT total FROM total_quizzes), 0) as total,
      COALESCE((SELECT aprovados FROM quizzes_aprovados), 0) as aprovados
  `, [cursoId, matriculaId]);

  const { total, aprovados } = result.rows[0];
  
  // Se não há quizzes, retorna true
  if (total === 0) return true;
  
  return total === aprovados;
}

export default withCors(handler);