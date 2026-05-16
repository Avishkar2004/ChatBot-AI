import React from 'react';
import { Link } from 'react-router-dom';
import Container from './ui/Container.jsx';

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-surface">
      <Container className="py-8 pt-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Chatbot AI Platform</p>
            <p className="text-xs text-gray-500">Built for modern, secure, and delightful AI chat experiences.</p>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/features"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Features
            </Link>
            <a
              href="#pricing"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Pricing
            </a>
            <a
              href="#docs"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Docs
            </a>
            <a
              href="#privacy"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Privacy
            </a>
            <a
              href="#terms"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Terms
            </a>
          </nav>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;


