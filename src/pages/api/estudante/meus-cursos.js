import { lerDatabase } from '@/lib/database';

export default function handler(req, res) {
  const db = lerDatabase();
  
  switch (req.method) {
    case 'GET':
      try {
        // Verificar autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ message: 'Não autorizado' });
        }
        
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui');
        
        // Buscar matrículas do estudante
        const matriculas = db.matriculas.filter(m => m.estudanteId === decoded.userId);
        
        // Buscar informações dos cursos
        const cursosComMatricula = matriculas.map(matricula => {
          const curso = db.cursos.find(c => c.id === matricula.cursoId);
          if (!curso) return null;
          
          const formador = db.usuarios.find(u => u.id === curso.formadorId);
          
          return {
            ...curso,
            formador: formador ? {
              id: formador.id,
              nome: formador.nome,
              fotoPerfil: formador.fotoPerfil
            } : null,
            matricula: {
              dataMatricula: matricula.dataMatricula,
              progresso: matricula.progresso,
              dataConclusao: matricula.dataConclusao,
              certificadoGerado: matricula.certificadoGerado
            }
          };
        }).filter(Boolean); // Remover nulos
        
        res.status(200).json({
          cursos: cursosComMatricula,
          total: cursosComMatricula.length,
          emAndamento: cursosComMatricula.filter(c => c.matricula.progresso < 100).length,
          concluidos: cursosComMatricula.filter(c => c.matricula.progresso >= 100).length
        });
        
      } catch (error) {
        console.error('Erro ao buscar cursos do estudante:', error);
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Token inválido' });
        }
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;
      
    default:
      res.status(405).json({ message: 'Método não permitido' });
  }
}