import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { 
        user, 
        logout, 
        isAuthenticated,
        notificacoes = [],
        notificacoesNaoLidas = 0,
        marcarComoLida = () => {},
        marcarTodasComoLidas = () => {}
    } = useAuth();
    const router = useRouter();

    // Função para formatar data resumida
    const formatarDataResumida = (dataString) => {
        const data = new Date(dataString);
        const hoje = new Date();
        
        if (data.toDateString() === hoje.toDateString()) {
            return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return data.toLocaleDateString('pt-BR');
        }
    };

    // Função para obter ícone por tipo
    const getIconePorTipo = (tipo) => {
        const icones = {
            'pagamento': 'bi-cash-coin',
            'matricula': 'bi-person-plus',
            'curso': 'bi-book',
            'sistema': 'bi-gear',
            'mensagem': 'bi-chat'
        };
        return icones[tipo] || 'bi-bell';
    };

    return (
        <header className="bg-dark text-white fixed-top shadow-sm" style={{ zIndex: 1030 }}>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    <Link href="/" className="navbar-brand">
                        Plataforma de Cursos
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <Link href="/cursos" className="nav-link">
                                    Cursos
                                </Link>
                            </li>

                            {isAuthenticated && user?.role === 'student' && (
                                <>
                                    <li className="nav-item">
                                        <Link href="/student" className="nav-link">
                                            <i className="bi bi-speedometer2 me-1"></i>
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/student/cursos" className="nav-link">
                                            <i className="bi bi-book me-1"></i>
                                            Cursos
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/student/certificados" className="nav-link">
                                            <i className="bi bi-award me-1"></i>
                                            Certificados
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/student/pagamentos" className="nav-link">
                                            <i className="bi bi-cash-coin me-1"></i>
                                            Meus Pagamentos
                                        </Link>
                                    </li>
                                </>
                            )}

                            {isAuthenticated && user?.role === 'instructor' && (
                                <>
                                    <li className="nav-item">
                                        <Link href="/instructor" className="nav-link">
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/instructor/pagamentos" className="nav-link">
                                            <i className="bi bi-cash-coin me-1"></i>
                                            Pagamentos
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/instructor/certificados" className="nav-link">
                                            <i className="bi-award"></i>
                                            Certificados
                                        </Link>
                                    </li>
                                </>
                            )}

                            {isAuthenticated && user?.role === 'admin' && (
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                        Admin
                                    </a>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <Link href="/admin" className="dropdown-item">
                                                <i className="bi bi-speedometer2 me-2"></i>
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/admin/usuarios" className="dropdown-item">
                                                <i className="bi bi-people me-2"></i>
                                                Gerenciar Usuários
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/admin/instrutores" className="dropdown-item">
                                                <i className="bi bi-person-badge me-2"></i>
                                                Aprovar Instrutores
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/admin/cursos" className="dropdown-item">
                                                <i className="bi bi-book me-2"></i>
                                                Gerenciar Cursos
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/admin/configuracoes" className="dropdown-item">
                                                <i className="bi bi-gear me-2"></i>
                                                Configurações
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                            )}
                        </ul>

                        <ul className="navbar-nav">
                            {/* Notificações */}
                            {isAuthenticated && (
                                <li className="nav-item dropdown">
                                    <a
                                        className="nav-link dropdown-toggle"
                                        href="#"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        <i className="bi bi-bell"></i>
                                        {notificacoesNaoLidas > 0 && (
                                            <span className="badge bg-danger rounded-pill">
                                                {notificacoesNaoLidas}
                                            </span>
                                        )}
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '300px' }}>
                                        <li>
                                            <h6 className="dropdown-header">
                                                Notificações {notificacoesNaoLidas > 0 && `(${notificacoesNaoLidas} novas)`}
                                            </h6>
                                        </li>
                                        {notificacoes.length === 0 ? (
                                            <li>
                                                <div className="dropdown-item text-center py-3 text-muted">
                                                    Nenhuma notificação
                                                </div>
                                            </li>
                                        ) : (
                                            <>
                                                {notificacoes.slice(0, 5).map(notificacao => (
                                                    <li key={notificacao.id}>
                                                        <a
                                                            className={`dropdown-item ${!notificacao.lida ? 'fw-bold' : ''}`}
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (notificacao.link) {
                                                                    router.push(notificacao.link);
                                                                }
                                                                if (!notificacao.lida) {
                                                                    marcarComoLida(notificacao.id);
                                                                }
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-start">
                                                                <i className={`bi ${getIconePorTipo(notificacao.tipo)} mt-1 me-2`}></i>
                                                                <div>
                                                                    <div className="small text-muted">
                                                                        {formatarDataResumida(notificacao.data_criacao)}
                                                                    </div>
                                                                    <div>{notificacao.titulo}</div>
                                                                    <small className="text-muted">
                                                                        {notificacao.mensagem.substring(0, 50)}...
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    </li>
                                                ))}
                                                <li><hr className="dropdown-divider" /></li>
                                            </>
                                        )}
                                        <li>
                                            <Link href="/notificacoes" className="dropdown-item">
                                                <i className="bi bi-list me-2"></i>
                                                Ver todas as notificações
                                            </Link>
                                        </li>
                                        {notificacoesNaoLidas > 0 && (
                                            <li>
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => marcarTodasComoLidas()}
                                                >
                                                    <i className="bi bi-check-all me-2"></i>
                                                    Marcar todas como lidas
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                </li>
                            )}
                            
                            {/* Menu do usuário */}
                            {isAuthenticated ? (
                                <>
                                    <li className="nav-item">
                                        <span className="nav-link">
                                            Olá, {user?.nome}
                                        </span>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/auth/perfil" className="nav-link">
                                            Perfil
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            onClick={logout}
                                            className="btn btn-outline-light btn-sm ms-2"
                                        >
                                            Sair
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <Link href="/auth/login" className="nav-link">
                                            Login
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/auth/register" className="btn btn-primary ms-2">
                                            Registrar
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;