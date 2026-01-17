import React, { useState, useEffect, useRef } from 'react';
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
    
    // Estados para controlar dropdowns
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    
    // Refs para detectar cliques fora dos dropdowns
    const profileDropdownRef = useRef(null);
    const notificationsDropdownRef = useRef(null);
    const profileToggleRef = useRef(null);
    const notificationsToggleRef = useRef(null);

    // Estado para controlar posição dos dropdowns em telas pequenas
    const [dropdownPosition, setDropdownPosition] = useState({});

    // Atualizar posição dos dropdowns em telas pequenas
    const updateDropdownPosition = (toggleRef) => {
        if (!toggleRef.current) return {};
        
        const toggleRect = toggleRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        // Se estiver perto da borda direita em telas pequenas, ajustar posição
        if (windowWidth < 768 && toggleRect.right > windowWidth - 300) {
            return { right: 0 };
        }
        
        return {};
    };

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileDropdownRef.current && 
                !profileDropdownRef.current.contains(event.target) &&
                profileToggleRef.current &&
                !profileToggleRef.current.contains(event.target)
            ) {
                setShowProfileDropdown(false);
            }
            
            if (
                notificationsDropdownRef.current && 
                !notificationsDropdownRef.current.contains(event.target) &&
                notificationsToggleRef.current &&
                !notificationsToggleRef.current.contains(event.target)
            ) {
                setShowNotificationsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fechar dropdowns ao mudar de rota
    useEffect(() => {
        const handleRouteChange = () => {
            setShowProfileDropdown(false);
            setShowNotificationsDropdown(false);
        };

        router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [router]);

    // Atualizar posição quando dropdowns são abertos
    useEffect(() => {
        if (showNotificationsDropdown) {
            setDropdownPosition(updateDropdownPosition(notificationsToggleRef));
        }
    }, [showNotificationsDropdown]);

    useEffect(() => {
        if (showProfileDropdown) {
            setDropdownPosition(updateDropdownPosition(profileToggleRef));
        }
    }, [showProfileDropdown]);

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

    // Função para determinar cor do badge baseado no role
    const getRoleBadgeColor = (role) => {
        switch(role) {
            case 'admin': return 'bg-danger';
            case 'instructor': return 'bg-warning text-dark';
            case 'student': return 'bg-success';
            default: return 'bg-secondary';
        }
    };

    // Função para determinar texto do role
    const getRoleText = (role) => {
        switch(role) {
            case 'admin': return 'Administrador';
            case 'instructor': return 'Instrutor';
            case 'student': return 'Estudante';
            default: return 'Usuário';
        }
    };

    return (
        <header className="bg-dark text-white fixed-top shadow-sm" style={{ zIndex: 1030 }}>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid px-3 px-md-4">
                    {/* Logo */}
                    <Link href="/" className="navbar-brand d-flex align-items-center">
                        <i className="bi bi-book-half me-2"></i>
                        <span className="d-none d-md-inline">Plataforma de Cursos</span>
                        <span className="d-md-none">Plataforma</span>
                    </Link>

                    {/* Botão Mobile */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Menu Principal */}
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <Link href="/cursos" className="nav-link">
                                    <i className="bi bi-book me-1"></i>
                                    <span className="d-none d-md-inline">Cursos</span>
                                </Link>
                            </li>
                            

                            {isAuthenticated && user?.role === 'student' && (
                                <>
                                    <li className="nav-item">
                                        <Link href="/student" className="nav-link">
                                            <i className="bi bi-speedometer2 me-1"></i>
                                            <span className="d-none d-md-inline">Dashboard</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/student/cursos" className="nav-link">
                                            <i className="bi bi-journal me-1"></i>
                                            <span className="d-none d-md-inline">Meus Cursos</span>
                                        </Link>
                                    </li>
                                </>
                            )}

                            {isAuthenticated && user?.role === 'instructor' && (
                                <>
                                    <li className="nav-item">
                                        <Link href="/instructor" className="nav-link">
                                            <i className="bi bi-speedometer2 me-1"></i>
                                            <span className="d-none d-md-inline">Dashboard</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/instructor/cursos" className="nav-link">
                                            <i className="bi bi-journal me-1"></i>
                                            <span className="d-none d-md-inline">Meus Cursos</span>
                                        </Link>
                                    </li>
                                </>
                            )}

                            {isAuthenticated && user?.role === 'admin' && (
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                        <i className="bi bi-shield-check me-1"></i>
                                        <span className="d-none d-md-inline">Admin</span>
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
                                                Usuários
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/admin/cursos" className="dropdown-item">
                                                <i className="bi bi-book me-2"></i>
                                                Cursos
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                            )}

                            {/* Links Públicos - apenas ícones em mobile */}
                            <li className="nav-item">
                                <Link href="/sobre" className="nav-link">
                                    <i className="bi bi-info-circle me-1"></i>
                                    <span className="d-none d-md-inline">Sobre</span>
                                </Link>
                            </li>
                        </ul>

                        {/* Menu Direito */}
                        <ul className="navbar-nav align-items-center ms-auto">
                            {/* Notificações */}
                            {isAuthenticated && (
                                <li className="nav-item dropdown" ref={notificationsDropdownRef}>
                                    <a
                                        ref={notificationsToggleRef}
                                        className="nav-link dropdown-toggle position-relative"
                                        href="#"
                                        role="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowNotificationsDropdown(!showNotificationsDropdown);
                                            setShowProfileDropdown(false);
                                        }}
                                        aria-expanded={showNotificationsDropdown}
                                    >
                                        <i className="bi bi-bell fs-5">
                                            {notificacoesNaoLidas > 0 && (
                                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                                    {notificacoesNaoLidas}
                                                    <span className="visually-hidden">notificações não lidas</span>
                                                </span>
                                            )}
                                        </i>
                                    </a>
                                    <ul 
                                        className={`dropdown-menu dropdown-menu-end ${showNotificationsDropdown ? 'show' : ''}`}
                                        style={{ 
                                            minWidth: '320px', 
                                            maxWidth: 'min(400px, calc(100vw - 40px))',
                                            maxHeight: '80vh',
                                            overflowY: 'auto',
                                            ...dropdownPosition,
                                            position: 'fixed',
                                            top: '60px',
                                            right: '20px',
                                            zIndex: 1060
                                        }}
                                    >
                                        <li>
                                            <div className="dropdown-header d-flex justify-content-between align-items-center sticky-top bg-white py-3">
                                                <span className="fw-bold">Notificações</span>
                                                {notificacoesNaoLidas > 0 && (
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            marcarTodasComoLidas();
                                                        }}
                                                    >
                                                        Marcar todas lidas
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                        {notificacoes.length === 0 ? (
                                            <li>
                                                <div className="dropdown-item text-center py-4 text-muted">
                                                    <i className="bi bi-bell-slash display-6 mb-2"></i>
                                                    <p className="mb-0">Nenhuma notificação</p>
                                                </div>
                                            </li>
                                        ) : (
                                            <>
                                                {notificacoes.slice(0, 8).map(notificacao => (
                                                    <li key={notificacao.id}>
                                                        <a
                                                            className={`dropdown-item py-3 px-3 ${!notificacao.lida ? 'bg-light' : ''}`}
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setShowNotificationsDropdown(false);
                                                                if (notificacao.link) {
                                                                    router.push(notificacao.link);
                                                                }
                                                                if (!notificacao.lida) {
                                                                    marcarComoLida(notificacao.id);
                                                                }
                                                            }}
                                                        >
                                                            <div className="d-flex">
                                                                <div className="flex-shrink-0">
                                                                    <i className={`bi ${getIconePorTipo(notificacao.tipo)} text-primary fs-5`}></i>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <h6 className="mb-1 text-truncate">{notificacao.titulo}</h6>
                                                                        <small className="text-muted ms-2 flex-shrink-0">
                                                                            {formatarDataResumida(notificacao.data_criacao)}
                                                                        </small>
                                                                    </div>
                                                                    <p className="mb-0 small text-muted text-truncate">
                                                                        {notificacao.mensagem}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    </li>
                                                ))}
                                                {notificacoes.length > 8 && (
                                                    <li>
                                                        <div className="dropdown-item text-center text-muted small py-2">
                                                            + {notificacoes.length - 8} notificações antigas
                                                        </div>
                                                    </li>
                                                )}
                                                <li>
                                                    <hr className="dropdown-divider my-1" />
                                                </li>
                                                <li>
                                                    <Link 
                                                        href="/notificacoes" 
                                                        className="dropdown-item text-center text-primary fw-medium py-2"
                                                        onClick={() => setShowNotificationsDropdown(false)}
                                                    >
                                                        <i className="bi bi-arrow-right-circle me-1"></i>
                                                        Ver todas as notificações
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                </li>
                            )}
                            
                            {/* Dropdown do Perfil */}
                            {isAuthenticated ? (
                                <li className="nav-item dropdown ms-2" ref={profileDropdownRef}>
                                    <a
                                        ref={profileToggleRef}
                                        className="nav-link dropdown-toggle d-flex align-items-center"
                                        href="#"
                                        role="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowProfileDropdown(!showProfileDropdown);
                                            setShowNotificationsDropdown(false);
                                        }}
                                        aria-expanded={showProfileDropdown}
                                    >
                                        {/* Avatar do usuário */}
                                        <div className="position-relative">
                                            <div 
                                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                                style={{ 
                                                    width: '36px', 
                                                    height: '36px',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {user?.nome?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            {/* Status online */}
                                            <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle">
                                                <span className="visually-hidden">Online</span>
                                            </span>
                                        </div>
                                        
                                        {/* Nome do usuário (visível apenas em desktop) */}
                                        <span className="d-none d-lg-inline ms-2">
                                            {user?.nome?.split(' ')[0] || 'Usuário'}
                                        </span>
                                    </a>
                                    
                                    <ul 
                                        className={`dropdown-menu dropdown-menu-end shadow ${showProfileDropdown ? 'show' : ''}`}
                                        style={{ 
                                            minWidth: '280px',
                                            maxWidth: 'min(320px, calc(100vw - 40px))',
                                            ...dropdownPosition,
                                            position: 'fixed',
                                            top: '60px',
                                            right: '20px',
                                            zIndex: 1060
                                        }}
                                    >
                                        {/* Cabeçalho do perfil */}
                                        <li>
                                            <div className="dropdown-header">
                                                <div className="d-flex align-items-center">
                                                    <div 
                                                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white me-3"
                                                        style={{ 
                                                            width: '48px', 
                                                            height: '48px',
                                                            fontSize: '18px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {user?.nome?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                        <h6 className="mb-0 text-truncate">{user?.nome || 'Usuário'}</h6>
                                                        <small className="text-muted text-truncate d-block">{user?.email}</small>
                                                        <div className="mt-1">
                                                            <span className={`badge ${getRoleBadgeColor(user?.role)}`}>
                                                                {getRoleText(user?.role)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        
                                        <li><hr className="dropdown-divider" /></li>
                                        
                                        {/* Menu do Perfil */}
                                        <li>
                                            <Link 
                                                href="/auth/perfil" 
                                                className="dropdown-item py-2"
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                <i className="bi bi-person me-2"></i>
                                                Meu Perfil
                                            </Link>
                                        </li>
                                        
                                        <li>
                                            <Link 
                                                href="/termos" 
                                                className="dropdown-item py-2"
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                <i className="bi bi-shield-check me-1"></i>
                                                Termos e Politicas
                                            </Link>
                                        </li>

                                        
                                        {user?.role === 'student' && (
                                            <>
                                                <li>
                                                    <Link 
                                                        href="/student/cursos" 
                                                        className="dropdown-item py-2"
                                                        onClick={() => setShowProfileDropdown(false)}
                                                    >
                                                        <i className="bi bi-journal me-2"></i>
                                                        Meus Cursos
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link 
                                                        href="/student/certificados" 
                                                        className="dropdown-item py-2"
                                                        onClick={() => setShowProfileDropdown(false)}
                                                    >
                                                        <i className="bi bi-award me-2"></i>
                                                        Meus Certificados
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                        
                                        {user?.role === 'instructor' && (
                                            <>
                                                <li>
                                                    <Link 
                                                        href="/instructor/cursos" 
                                                        className="dropdown-item py-2"
                                                        onClick={() => setShowProfileDropdown(false)}
                                                    >
                                                        <i className="bi bi-journal me-2"></i>
                                                        Meus Cursos
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link 
                                                        href="/instructor/estatisticas" 
                                                        className="dropdown-item py-2"
                                                        onClick={() => setShowProfileDropdown(false)}
                                                    >
                                                        <i className="bi bi-graph-up me-2"></i>
                                                        Estatísticas
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                        
                                        {user?.role === 'admin' && (
                                            <li>
                                                <Link 
                                                    href="/admin" 
                                                    className="dropdown-item py-2"
                                                    onClick={() => setShowProfileDropdown(false)}
                                                >
                                                    <i className="bi bi-shield-check me-2"></i>
                                                    Painel Admin
                                                </Link>
                                            </li>
                                        )}
                                        
                                        <li>
                                            <Link 
                                                href="/ajuda" 
                                                className="dropdown-item py-2"
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                <i className="bi bi-question-circle me-2"></i>
                                                Ajuda & Suporte
                                            </Link>
                                        </li>
                                        
                                        <li><hr className="dropdown-divider" /></li>
                                        
                                        <li>
                                            <button
                                                onClick={() => {
                                                    setShowProfileDropdown(false);
                                                    logout();
                                                    router.push('/');
                                                }}
                                                className="dropdown-item text-danger py-2"
                                            >
                                                <i className="bi bi-box-arrow-right me-2"></i>
                                                Sair
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            ) : (
                                // Menu para usuários não autenticados
                                <div className="d-flex gap-2">
                                    <li className="nav-item">
                                        <Link href="/auth/login" className="btn btn-outline-light btn-sm">
                                            <i className="bi bi-box-arrow-in-right me-1"></i>
                                            <span className="d-none d-md-inline">Entrar</span>
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link href="/auth/register" className="btn btn-primary btn-sm">
                                            <i className="bi bi-person-plus me-1"></i>
                                            <span className="d-none d-md-inline">Registrar</span>
                                        </Link>
                                    </li>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;