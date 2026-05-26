import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  {
    label: 'Services', dropdown: [
      'Marble Polishing', 'Granite Restoration', 'Tile & Grout Cleaning',
      'Scratch Removal', 'Crack Repair', 'Sealing & Protection',
    ]
  },
  {
    label: 'Surfaces', dropdown: [
      'Floors', 'Countertops', 'Showers', 'Kitchen', 'Garage',
      'Outdoor', 'Patio', 'Pool Deck', 'Walls', 'Driveway',
    ]
  },
  { label: 'Residential', to: '#residential' },
  {
    label: 'Commercial', dropdown: [
      'Corporate / Office', 'Bank', 'Education', 'Medical', 'Church',
      'Memorial', 'Warehouse', 'Retail', 'Grocery', 'Hotel',
      'Restaurants', 'Club', 'Theater', 'National Landmarks', 'Government', 'New Construction',
    ]
  },
  { label: 'Projects', to: '#gallery' },
  { label: 'Contact', to: '#contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrop, setOpenDrop]     = useState(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpenDrop(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLoginClick = () => {
    if (user) navigate('/portal/home');
    else navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <img src={logoImg} alt="The Shine Reflecto Logo" />
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__links" ref={dropRef}>
          {NAV_LINKS.map((link) =>
            link.dropdown ? (
              <div
                key={link.label}
                className={`navbar__item navbar__item--drop ${openDrop === link.label ? 'open' : ''}`}
                onClick={() => setOpenDrop(openDrop === link.label ? null : link.label)}
              >
                <span className="navbar__link">
                  {link.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
                <div className="navbar__dropdown">
                  {link.dropdown.map((item) => (
                    <a key={item} href="#" className="navbar__dropdown-item" onClick={() => setOpenDrop(null)}>
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={link.label} href={link.to} className="navbar__link">{link.label}</a>
            )
          )}
        </div>

        {/* Actions */}
        <div className="navbar__actions">
          <button className="navbar__login" onClick={handleLoginClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            {user ? user.name.split(' ')[0] : 'Login'}
          </button>
          <button className="navbar__cta btn btn-primary" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
            Get Inspection
          </button>
          {/* Hamburger */}
          <button className="navbar__hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            <span className={mobileOpen ? 'open' : ''}></span>
            <span className={mobileOpen ? 'open' : ''}></span>
            <span className={mobileOpen ? 'open' : ''}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar__mobile">
          {NAV_LINKS.map((link) =>
            link.dropdown ? (
              <div key={link.label} className="navbar__mobile-group">
                <span className="navbar__mobile-link navbar__mobile-parent">{link.label} ▾</span>
                <div className="navbar__mobile-sub">
                  {link.dropdown.map(item => <a key={item} href="#" className="navbar__mobile-link navbar__mobile-sub-item" onClick={() => setMobileOpen(false)}>{item}</a>)}
                </div>
              </div>
            ) : (
              <a key={link.label} href={link.to} className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>{link.label}</a>
            )
          )}
          <div className="navbar__mobile-actions">
            <button className="btn btn-outline w-full" onClick={() => { handleLoginClick(); setMobileOpen(false); }}>Login</button>
            <button className="btn btn-primary w-full" onClick={() => { document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); }}>Get Inspection</button>
          </div>
        </div>
      )}
    </nav>
  );
}
