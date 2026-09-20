import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/stock', label: 'Stock' },
  { to: '/map-search', label: 'Map Search' },
  { to: '/about', label: 'About us' },
];

export default function Header() {
  const { session, hospital, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-cream transition-shadow duration-300 ${scrolled ? 'shadow-[0_2px_16px_-6px_rgba(43,42,34,0.15)]' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Antivenin" className="h-8 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `text-sm transition-colors ${isActive ? 'font-semibold text-olive' : 'text-ink/70 hover:text-ink'}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-ink/10" />
          ) : session ? (
            <>
              <Link to="/dashboard" className="text-sm font-semibold text-ink hover:text-olive">
                {hospital?.hospital_name || 'Dashboard'}
              </Link>
              <button onClick={logout} className="text-sm font-semibold text-ink/70 hover:text-olive">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink hover:text-olive">Log in</Link>
              <Link to="/register" className="btn-press rounded-full bg-olive px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-olive-dark">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}