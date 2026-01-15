import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-auto py-3">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Plataforma de Cursos Online. Todos os direitos reservados.
            </p>
          </div>
          <div className="col-md-6 text-end">
            <p className="mb-0">
              Desenvolvido por JP-BUSINESS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;