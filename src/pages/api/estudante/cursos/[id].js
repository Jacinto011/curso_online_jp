import { lerDatabase } from '@/lib/database';

export default function handler(req, res) {
  const db = lerDatabase();
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      try {
        const curso = db.cursos.find(c => c.id === id && c.publicado);
        
        if (!curso) {
          return res.status(404).json({ message: 'Curso não encontrado' });
        }
        
        // Buscar informações do formador
        const formador = db.usuarios.find(u => u.id === curso.formadorId);
        
        // Verificar se o usuário está matriculado
        let matriculado = false;
        let progresso = 0;
        
        if (req.headers.authorization) {
          const token = req.headers.authorization.split(' ')[1];
          try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui');
            
            const matricula = db.matriculas.find(m => 
              m.estudanteId === decoded.userId && m.cursoId === id
            );
            
            if (matricula) {
              matriculado = true;
              progresso = matricula.progresso;
            }
          } catch (error) {
            // Token inválido ou expirado
          }
        }
        
        // Calcular média de avaliações
        const avaliacoesCurso = db.matriculas
          .filter(m => m.cursoId === id && m.avaliacao)
          .map(m => m.avaliacao);
        
        const resposta = {
          ...curso,
          formador: formador ? {
            id: formador.id,
            nome: formador.nome,
            fotoPerfil: formador.fotoPerfil
          } : null,
          totalEstudantes: db.matriculas.filter(m => m.cursoId === id).length,
          matriculado,
          progresso,
          avaliacoes: avaliacoesCurso.length,
          avaliacaoMedia: avaliacoesCurso.length > 0 
            ? avaliacoesCurso.reduce((a, b) => a + b, 0) / avaliacoesCurso.length
            : curso.avaliacaoMedia
        };
        
        res.status(200).json(resposta);
        
      } catch (error) {
        console.error('Erro ao buscar curso:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;
      
    default:
      res.status(405).json({ message: 'Método não permitido' });
  }
}