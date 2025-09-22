import React from 'react';
import Container from './ui/Container.jsx';

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-white/10">
      <Container className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div>© {new Date().getFullYear()} Chatbot AI Platform</div>
        <div className="flex items-center gap-4">
          <a href="/" className="hover:text-white">Docs</a>
          <a href="/" className="hover:text-white">Privacy</a>
          <a href="/" className="hover:text-white">Terms</a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;


