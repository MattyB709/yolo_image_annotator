import React from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>YOLO Annotation Tool</h1>
        </Link>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;