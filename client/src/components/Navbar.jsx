import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // Close mobile menu on route change
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickAway = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [userMenuOpen]);

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`;

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <nav className={`sticky top-0 z-40 ${scrolled ? 'shadow-lg shadow-black/10' : ''} border-b border-white/10 bg-[#0c1116]/90 backdrop-blur`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-100">Chatbot AI</span>
            </Link>
          </div>
          {/* Center: Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/projects" className={navLinkClass}>Projects</NavLink>
                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              </>
            )}
            {/* Public links */}
            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5">Docs</a>
            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5">Pricing</a>
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10 focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center text-sm">
                      {userInitial}
                    </div>
                    {user?.email && <span className="text-gray-300 text-sm hidden lg:block">{user.email}</span>}
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                  </button>
                  {userMenuOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-48 rounded-md border border-white/10 bg-[#0c1116] shadow-lg py-1">
                      <button onClick={() => { navigate('/dashboard'); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5" role="menuitem">Dashboard</button>
                      <button onClick={() => { navigate('/projects'); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5" role="menuitem">Projects</button>
                      <div className="h-px bg-white/10 my-1" />
                      <button onClick={() => { logout(); navigate('/login'); }} className="block w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/5" role="menuitem">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `text-sm ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Login</NavLink>
                <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0c1116]">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <NavLink to="/" onClick={() => setMobileOpen(false)} className={navLinkClass} end>Home</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/projects" onClick={() => setMobileOpen(false)} className={navLinkClass}>Projects</NavLink>
                <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass}>Dashboard</NavLink>
              </>
            )}
            <div className="h-px bg-white/10 my-2" />
            {isAuthenticated ? (
              <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-500">Logout</button>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className={navLinkClass}>Login</NavLink>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


