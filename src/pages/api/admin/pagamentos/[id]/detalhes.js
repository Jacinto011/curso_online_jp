import withCors from '../../../../../lib/cors';
import { query } from '../../../../../lib/database-postgres';
import { authenticate } from '../../../../../lib/auth';

async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Acesso não autorizado. Apenas administradores.' 
      });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        try {
          // Buscar detalhes COMPLETOS do pagamento
          const pagamentoResult = await query(`
            SELECT 
              p.*,
              m.codigo as metodo_pagamento_nome,
              m.descricao as metodo_pagamento_descricao,
              u.nome as estudante_nome,
              u.email as estudante_email,
              u.telefone as estudante_telefone,
              u.id as estudante_id,
              c.titulo as curso_titulo,
              c.preco as curso_preco,
              c.instrutor_id,
              c.id as curso_id,
              instrutor.nome as instrutor_nome,
              mat.status as status_matricula
            FROM pagamentos p
            LEFT JOIN metodos_pagamento m ON p.metodo_pagamento_id = m.id
            LEFT JOIN matriculas mat ON p.matricula_id = mat.id
            LEFT JOIN usuarios u ON mat.estudante_id = u.id
            LEFT JOIN cursos c ON mat.curso_id = c.id
            LEFT JOIN usuarios instrutor ON c.instrutor_id = instrutor.id
            WHERE p.id = $1
          `, [id]);
          
          if (pagamentoResult.rows.length === 0) {
            return res.status(404).json({ 
              success: false,
              message: 'Pagamento não encontrado' 
            });
          }
          
          const pagamento = pagamentoResult.rows[0];
          
          // Buscar histórico usando data_registro
          const historicoResult = await query(`
            SELECT 
              hp.*,
              u.nome as usuario_nome,
              u.email as usuario_email,
              hp.data_registro,
              TO_CHAR(hp.data_registro, 'DD/MM/YYYY HH24:MI:SS') as data_registro_formatada
            FROM historico_pagamento hp
            LEFT JOIN usuarios u ON hp.usuario_id = u.id
            WHERE hp.pagamento_id = $1
            ORDER BY hp.data_registro DESC
          `, [id]);
          
          // Buscar informações de auditoria (se a tabela existir)
          let auditoriaResult = { rows: [] };
          try {
            auditoriaResult = await query(`
              SELECT 
                a.*,
                u.nome as usuario_nome,
                TO_CHAR(a.data_hora, 'DD/MM/YYYY HH24:MI:SS') as data_hora_formatada
              FROM auditoria_sistema a
              LEFT JOIN usuarios u ON a.usuario_id = u.id
              WHERE (a.detalhes->>'pagamento_id')::int = $1
                 OR (a.descricao ILIKE '%' || $2 || '%')
              ORDER BY a.data_hora DESC
              LIMIT 20
            `, [id, pagamento.codigo_transacao || id]);
          } catch (auditError) {
            console.log('ℹ️  Tabela auditoria_sistema não encontrada, continuando sem auditoria...');
          }
          
          // Calcular tempo de processamento
          const tempoProcessamento = calcularTempoProcessamento(pagamento);
          
          // Formatar datas para exibição
          const pagamentoFormatado = {
            ...pagamento,
            data_pagamento_formatada: formatarData(pagamento.data_pagamento),
            created_at_formatada: formatarData(pagamento.created_at),
            updated_at_formatada: pagamento.updated_at ? formatarData(pagamento.updated_at) : null,
            tempo_processamento: tempoProcessamento
          };
          
          res.status(200).json({
            success: true,
            data: {
              pagamento: pagamentoFormatado,
              historico: historicoResult.rows,
              auditoria: auditoriaResult.rows,
              metadata: {
                total_alteracoes: historicoResult.rows.length,
                ultima_alteracao: historicoResult.rows.length > 0 
                  ? historicoResult.rows[0].data_registro
                  : null
              }
            }
          });
          
        } catch (error) {
          console.error('❌ Erro ao buscar detalhes:', error.message);
          res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
        break;
        
      default:
        return res.status(405).json({ 
          success: false,
          message: 'Método não permitido',
          allowed: ['GET']
        });
    }
  } catch (error) {
    console.error('❌ Erro na API de detalhes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Função auxiliar para calcular tempo de processamento
function calcularTempoProcessamento(pagamento) {
  if (!pagamento) return 'N/A';
  
  try {
    const dataCriacao = new Date(pagamento.created_at || pagamento.data_pagamento);
    const agora = new Date();
    const diffMs = agora - dataCriacao;
    
    if (isNaN(diffMs)) {
      return 'Data inválida';
    }
    
    const segundos = Math.floor(diffMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
      return `${dias} dia${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
      return `${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
      return `${segundos} segundo${segundos > 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'Erro no cálculo';
  }
}

// Função para formatar data
function formatarData(data) {
  if (!data) return 'N/A';
  
  try {
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return 'Data inválida';
    
    return dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return 'Erro na formatação';
  }
}

export default withCors(handler);