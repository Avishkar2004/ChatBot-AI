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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`;

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '?');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/20 bg-[#0c1116]/95' : 'bg-[#0c1116]/90'} border-b border-white/10 backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">Chatbot AI</span>
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
            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200">Features</a>
            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200">Pricing</a>
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
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                      {userInitial}
                    </div>
                    {user?.username && <span className="text-gray-300 text-sm hidden lg:block max-w-32 truncate">{user.username.toUpperCase()}</span>}
                    <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border border-white/20 bg-[#0c1116]/95 backdrop-blur-md shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Account</p>
                        <p className="text-sm text-gray-200 truncate">{user?.email}</p>
                      </div>
                      <button onClick={() => { navigate('/dashboard'); setUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors duration-200" role="menuitem">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                          </svg>
                          Dashboard
                        </div>
                      </button>
                      <button onClick={() => { navigate('/projects'); setUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/5 transition-colors duration-200" role="menuitem">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Projects
                        </div>
                      </button>
                      <div className="h-px bg-white/10 my-2" />
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="block w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/5 transition-colors duration-200 disabled:opacity-50"
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          {isLoggingOut ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          )}
                          {isLoggingOut ? 'Signing out...' : 'Sign out'}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Login</NavLink>
                <Link to="/signup" className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200"
            >
              <svg className="h-6 w-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
        <div className="md:hidden border-t border-white/10 bg-[#0c1116]/95 backdrop-blur-md">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <NavLink to="/" onClick={() => setMobileOpen(false)} className={navLinkClass} end>Home</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/projects" onClick={() => setMobileOpen(false)} className={navLinkClass}>Projects</NavLink>
                <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass}>Dashboard</NavLink>
              </>
            )}
            <a href="#" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200">Features</a>
            <a href="#" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200">Pricing</a>
            <div className="h-px bg-white/10 my-2" />
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 border-b border-white/10 mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Account</p>
                  <p className="text-sm text-gray-200 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    {isLoggingOut ? (
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                  </div>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className={navLinkClass}>Login</NavLink>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition-all duration-200">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


