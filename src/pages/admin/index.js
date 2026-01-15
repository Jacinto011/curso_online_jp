import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import { withAuth } from '../../components/withAuth';

function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalCursos: 0,
    totalMatriculas: 0,
    pedidosInstrutor: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin) {
      router.push('/auth/login');
      return;
    }

    fetchDashboardData();
  }, [isAdmin, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recent-users')
      ]);
      
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.usuarios);
      //console.log('Dados: ', usersRes.data.usuarios);
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Dashboard Administrativo</h1>
          
          {/* Estatísticas */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Total de Usuários</h5>
                      <h2 className="mb-0">{stats.totalUsuarios}</h2>
                    </div>
                    <i className="bi bi-people-fill" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Total de Cursos</h5>
                      <h2 className="mb-0">{stats.totalCursos}</h2>
                    </div>
                    <i className="bi bi-book-fill" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Total de Matrículas</h5>
                      <h2 className="mb-0">{stats.totalMatriculas}</h2>
                    </div>
                    <i className="bi bi-clipboard-check-fill" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-dark">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title">Pedidos Instrutor</h5>
                      <h2 className="mb-0">{stats.pedidosInstrutor}</h2>
                    </div>
                    <i className="bi bi-person-badge-fill" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            {/* Usuários Recentes */}
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Usuários Recentes</h5>
                  <Link href="/admin/usuarios" className="btn btn-sm btn-outline-primary">
                    Ver todos
                  </Link>
                </div>
                <div className="card-body">
                  {recentUsers.length === 0 ? (
                    <p className="text-muted text-center py-3">Nenhum usuário registrado recentemente</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Papel</th>
                            <th>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.slice(0, 5).map(user => (
                            <tr key={user.id}>
                              <td>{user.nome}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`badge bg-${user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'success' : 'primary'}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td>
                                {new Date(user.data_criacao).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ações Rápidas */}
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Ações Rápidas</h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-3">
                    <Link href="/admin/usuarios" className="btn btn-outline-primary">
                      <i className="bi bi-people me-2"></i>
                      Gerenciar Usuários
                    </Link>
                    
                    <Link href="/admin/instrutores" className="btn btn-outline-success">
                      <i className="bi bi-person-badge me-2"></i>
                      Aprovar Instrutores
                    </Link>
                    
                    <Link href="/admin/cursos" className="btn btn-outline-info">
                      <i className="bi bi-book me-2"></i>
                      Gerenciar Cursos
                    </Link>
                    
                    <Link href="/admin/configuracoes" className="btn btn-outline-secondary">
                      <i className="bi bi-gear me-2"></i>
                      Configurações do Sistema
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sistema */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Informações do Sistema</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <strong>Versão:</strong> 1.0.0
                  </div>
                  <div className="mb-3">
                    <strong>Banco de Dados:</strong> SQLite
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <strong>Total de Instrutores:</strong> {stats.totalInstrutores || 0}
                  </div>
                  <div className="mb-3">
                    <strong>Total de Estudantes:</strong> {stats.totalEstudantes || 0}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <strong>Última Atualização:</strong> Hoje
                  </div>
                  <div className="mb-3">
                    <strong>Status:</strong> <span className="badge bg-success">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default withAuth(AdminDashboard, ['admin']);