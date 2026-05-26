import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        {/* Column 1 */}
        <div className="footer__col">
          <img src={logoImg} alt="The Shine Reflecto" className="footer__logo" />
          <p className="footer__desc">
            Premium surface restoration and maintenance solutions.
            Best marble polishing service in Pune and Mumbai.
          </p>
          <div className="footer__socials">
            {[
              { label: 'Facebook',  icon: 'f',  href: '#' },
              { label: 'Instagram', icon: '📸', href: '#' },
              { label: 'LinkedIn',  icon: 'in', href: '#' },
            ].map(s => (
              <a key={s.label} href={s.href} aria-label={s.label} className="footer__social">{s.icon}</a>
            ))}
          </div>
        </div>

        {/* Column 2 – Quick Links */}
        <div className="footer__col">
          <h4 className="footer__col-title">Quick Links</h4>
          {['Home','Services','Industries','Projects'].map(l => (
            <a key={l} href="#" className="footer__link">{l}</a>
          ))}
        </div>

        {/* Column 3 – Contact */}
        <div className="footer__col">
          <h4 className="footer__col-title">Contact Us</h4>
          <p className="footer__link">Xion Mall, 309, Hinjawadi, Pune, MH 411057</p>
          <a href="tel:+918830227359" className="footer__link">+91 88302 27359</a>
          <a href="mailto:info@theshinereflecto.com" className="footer__link">info@theshinereflecto.com</a>
        </div>

        {/* Column 4 – Internal */}
        <div className="footer__col">
          <h4 className="footer__col-title">Internal</h4>
          <Link to="/login" className="btn btn-outline footer__staff-btn">Staff Login</Link>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} The Shine Reflecto. All rights reserved.</p>
      </div>
    </footer>
  );
}
