import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const InstructorSidebar = () => {
  const router = useRouter();
  
  const menuItems = [
    { path: '/instructor', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/instructor/cursos', icon: 'bi-book', label: 'Cursos' },
    { path: '/instructor/modulos', icon: 'bi-folder', label: 'Módulos' },
    { path: '/instructor/materiais', icon: 'bi-file-earmark', label: 'Materiais' },
    { path: '/instructor/matriculas', icon: 'bi-people', label: 'Matrículas' },
    { path: '/instructor/certificados', icon: 'bi-award', label: 'Certificados' },
  ];

  return (
    <div className="sidebar p-3">
      <h5 className="mb-4">Instrutor</h5>
      <ul className="nav nav-pills flex-column">
        {menuItems.map((item) => (
          <li className="nav-item" key={item.path}>
            <Link 
              href={item.path} 
              className={`nav-link ${router.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InstructorSidebar;