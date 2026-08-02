import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutGrid, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar, Button, Logo, Spinner, cn } from './ui';

/** Nav links are data, so desktop and mobile can never drift apart. */
const publicLinks = [{ to: '/features', label: 'Features' }];
const authedLinks = [
  { to: '/projects', label: 'Projects' },
  { to: '/dashboard', label: 'Dashboard' },
];

const navLinkClass = ({ isActive }) =>
  cn(
    'focus-ring rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
    isActive ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:text-white'
  );

// Same states, full-width rows. Composed as a function because NavLink hands
// the active state to a callback — `cn(navLinkClass, …)` would drop it.
const mobileNavLinkClass = (state) => cn(navLinkClass(state), 'block py-2');

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onClickAway = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setUserMenuOpen(false);
    document.addEventListener('mousedown', onClickAway);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

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

  const links = isAuthenticated ? [...authedLinks, ...publicLinks] : publicLinks;

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-200',
        // The border only appears once content scrolls under it, so the header
        // sits flush with the hero on load.
        scrolled ? 'border-line bg-surface/85' : 'border-transparent bg-surface/60'
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="focus-ring shrink-0 rounded-lg" aria-label="Chatbot AI — home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className={cn(
                  'focus-ring flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors duration-150',
                  userMenuOpen ? 'bg-white/[0.07]' : 'hover:bg-white/[0.05]'
                )}
              >
                <Avatar name={user?.username} email={user?.email} size="sm" />
                <span className="max-w-[9rem] truncate text-[13px] font-medium text-slate-200">
                  {user?.username || 'Account'}
                </span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    'text-slate-500 transition-transform duration-200',
                    userMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-line bg-surface-floating shadow-overlay"
                >
                  <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
                    <Avatar name={user?.username} email={user?.email} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {user?.username || 'User'}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <MenuItem
                      icon={LayoutGrid}
                      label="Projects"
                      onClick={() => navigate('/projects')}
                    />
                    <MenuItem
                      icon={Sparkles}
                      label="Dashboard"
                      onClick={() => navigate('/dashboard')}
                    />
                  </div>

                  <div className="border-t border-line p-1.5">
                    <MenuItem
                      icon={isLoggingOut ? null : LogOut}
                      label={isLoggingOut ? 'Signing out…' : 'Sign out'}
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      destructive
                      leading={isLoggingOut ? <Spinner size="xs" className="text-rose-400" /> : null}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button as={Link} to="/signup" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="focus-ring ml-auto grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="animate-fade-in border-t border-line bg-surface/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-4">
            <NavLink to="/" className={mobileNavLinkClass} end>
              Home
            </NavLink>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={mobileNavLinkClass}>
                {link.label}
              </NavLink>
            ))}

            <div className="rule my-3" />

            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <Avatar name={user?.username} email={user?.email} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.username || 'User'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleLogout}
                  loading={isLoggingOut}
                  leftIcon={<LogOut size={15} />}
                >
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Button as={Link} to="/login" variant="secondary" fullWidth>
                  Sign in
                </Button>
                <Button as={Link} to="/signup" fullWidth>
                  Get started
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

function MenuItem({ icon: Icon, label, destructive, leading, className = '', ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'focus-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        destructive
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
        className
      )}
      {...props}
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center">
        {leading || (Icon ? <Icon size={15} aria-hidden="true" /> : null)}
      </span>
      {label}
    </button>
  );
}

export default Navbar;
