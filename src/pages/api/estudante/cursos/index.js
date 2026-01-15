import { lerDatabase, salvarDatabase } from '@/lib/database';

export default function handler(req, res) {
  const db = lerDatabase();
  
  switch (req.method) {
    case 'GET':
      try {
        const { categoria, nivel, busca, page = 1, limit = 10 } = req.query;
        let cursos = db.cursos.filter(curso => curso.publicado);
        
        // Aplicar filtros
        if (categoria) {
          cursos = cursos.filter(curso => 
            curso.categoria.toLowerCase().includes(categoria.toLowerCase())
          );
        }
        
        if (nivel) {
          cursos = cursos.filter(curso => curso.nivel === nivel);
        }
        
        if (busca) {
          const termo = busca.toLowerCase();
          cursos = cursos.filter(curso => 
            curso.titulo.toLowerCase().includes(termo) ||
            curso.descricao.toLowerCase().includes(termo) ||
            curso.tags.some(tag => tag.toLowerCase().includes(termo))
          );
        }
        
        // Paginação
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const cursosPaginados = cursos.slice(startIndex, endIndex);
        
        res.status(200).json({
          cursos: cursosPaginados,
          total: cursos.length,
          pagina: parseInt(page),
          totalPaginas: Math.ceil(cursos.length / limit)
        });
        
      } catch (error) {
        console.error('Erro ao listar cursos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
      break;
      
    default:
      res.status(405).json({ message: 'Método não permitido' });
  }
}