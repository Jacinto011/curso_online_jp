import { initializeDatabase } from '../../../lib/database';
import { authenticate } from '../../../lib/auth';

export default async function handler(req, res) {
  const db = await initializeDatabase();
  
  // Autenticação
  const user = await authenticate(req);
  if (!user || user.role !== 'student') {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  switch (req.method) {
    case 'POST':
      // Matricular em um curso
      try {
        const { curso_id } = req.body;
        
        // Verificar se o curso existe
        const curso = await db.get('SELECT * FROM cursos WHERE id = ? AND status = "publicado"', [curso_id]);
        if (!curso) {
          return res.status(404).json({ message: 'Curso não encontrado ou não disponível' });
        }
        
        // Verificar se já está matriculado
        const matriculaExistente = await db.get(
          'SELECT * FROM matriculas WHERE estudante_id = ? AND curso_id = ?',
          [user.id, curso_id]
        );
        
        if (matriculaExistente) {
          return res.status(400).json({ message: 'Você já está matriculado neste curso' });
        }
        
        // Determinar status da matrícula
        let status = 'ativa';
        let pagamento_confirmado = 1;
        let instrutor_confirmado = 1;
        
        if (!curso.gratuito) {
          // Para cursos pagos, matrícula fica suspensa
          status = 'suspensa';
          pagamento_confirmado = 0;
          instrutor_confirmado = 0;
        }
        
        // Criar matrícula
        const result = await db.run(
          `INSERT INTO matriculas 
           (estudante_id, curso_id, status, pagamento_confirmado, instrutor_confirmado)
           VALUES (?, ?, ?, ?, ?)`,
          [user.id, curso_id, status, pagamento_confirmado, instrutor_confirmado]
        );
        
        res.status(201).json({ 
          id: result.lastID, 
          message: curso.gratuito ? 
            'Matrícula realizada com sucesso!' : 
            'Solicitação de matrícula enviada. Aguarde confirmação do pagamento pelo instrutor.' 
        });
      } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar matrícula', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}