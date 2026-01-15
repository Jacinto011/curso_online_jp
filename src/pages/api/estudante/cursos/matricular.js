import { lerDatabase, salvarDatabase } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  const db = lerDatabase();
  
  switch (req.method) {
    case 'POST':
      try {
        const { cursoId } = req.body;
        
        if (!cursoId) {
          return res.status(400).json({ message: 'ID do curso é obrigatório' });
        }
        
        // Verificar autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ message: 'Não autorizado' });
        }
        
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui');
        
        // Verificar se curso existe e está publicado
        const curso = db.cursos.find(c => c.id === cursoId && c.publicado);
        if (!curso) {
          return res.status(404).json({ message: 'Curso não encontrado' });
        }
        
        // Verificar se já está matriculado
        const jaMatriculado = db.matriculas.find(m => 
          m.estudanteId === decoded.userId && m.cursoId === cursoId
        );
        
        if (jaMatriculado) {
          return res.status(400).json({ message: 'Você já está matriculado neste curso' });
        }
        
        // Criar matrícula
        const matricula = {
          id: uuidv4(),
          estudanteId: decoded.userId,
          cursoId: cursoId,
          dataMatricula: new Date().toISOString(),
          progresso: 0,
          aulasConcluidas: [],
          certificadoGerado: false,
          status: curso.gratuito ? 'ativo' : 'pendente_pagamento'
        };
        
        db.matriculas.push(matricula);
        salvarDatabase(db);
        
        // Se for gratuito, criar pagamento simbólico
        if (curso.gratuito) {
          const pagamento = {
            id: uuidv4(),
            matriculaId: matricula.id,
            valor: 0,
            comissaoPlataforma: 0,
            valorFormador: 0,
            status: 'pago',
            metodo: 'gratuito',
            dataPagamento: new Date().toISOString()
          };
          
          db.pagamentos.push(pagamento);
          salvarDatabase(db);
        }
        
        res.status(201).json({
          message: 'Matrícula realizada com sucesso',
          matricula,
          curso: {
            id: curso.id,
            titulo: curso.titulo,
            gratuito: curso.gratuito
          }
        });
        
      } catch (error) {
        console.error('Erro ao matricular:', error);
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