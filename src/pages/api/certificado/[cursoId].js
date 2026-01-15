import { lerDatabase } from '@/lib/database';

export default function handler(req, res) {
  const db = lerDatabase();
  const { cursoId } = req.query;
  
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
        
        // Verificar se curso existe
        const curso = db.cursos.find(c => c.id === cursoId);
        if (!curso) {
          return res.status(404).json({ message: 'Curso não encontrado' });
        }
        
        // Verificar matrícula e conclusão
        const matricula = db.matriculas.find(m => 
          m.estudanteId === decoded.userId && 
          m.cursoId === cursoId &&
          m.certificadoGerado
        );
        
        if (!matricula) {
          return res.status(403).json({ 
            message: 'Certificado não disponível. Complete o curso primeiro.' 
          });
        }
        
        // Buscar informações do estudante
        const estudante = db.usuarios.find(u => u.id === decoded.userId);
        const formador = db.usuarios.find(u => u.id === curso.formadorId);
        
        // Gerar código único do certificado
        const crypto = require('crypto');
        const certificadoHash = crypto
          .createHash('md5')
          .update(`${cursoId}-${decoded.userId}-${matricula.dataConclusao}`)
          .digest('hex')
          .toUpperCase()
          .substring(0, 12);
        
        const certificado = {
          codigo: certificadoHash,
          estudante: {
            nome: estudante.nome,
            email: estudante.email
          },
          curso: {
            titulo: curso.titulo,
            descricao: curso.descricao,
            duracao: curso.duracaoTotal,
            categoria: curso.categoria,
            nivel: curso.nivel
          },
          formador: formador ? {
            nome: formador.nome
          } : null,
          datas: {
            conclusao: matricula.dataConclusao,
            emissao: new Date().toISOString()
          },
          urlVerificacao: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verificar-certificado/${certificadoHash}`
        };
        
        res.status(200).json(certificado);
        
      } catch (error) {
        console.error('Erro ao gerar certificado:', error);
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