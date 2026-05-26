import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import beforeImg from '../assets/images/dull_marble_before_1777108669472.png';
import afterImg  from '../assets/images/polished_marble_after_v2_1777108700895.png';

// Animated Icons
import phoneGif       from '../assets/icons/Animated Icon/phone.gif';
import whatsappGif    from '../assets/icons/Animated Icon/whatsapp.gif';
import fixWhatsappGif from '../assets/icons/Animated Icon/fix_whatsapp.gif';
import emailGif       from '../assets/icons/Animated Icon/email.gif';
import linkedinGif    from '../assets/icons/Animated Icon/linkedin.gif';
import instagramGif   from '../assets/icons/Animated Icon/instagram.gif';

import './Hero.css';

const TRUST_ITEMS = [
  { icon: '✓', text: '5000+ Projects' },
  { icon: '◑', text: '15+ Years' },
  { icon: '⚡', text: 'Free Inspection in 24 Hrs' },
];

const CONTACT_LINKS = [
  { icon: phoneGif,       label: 'Call Now', href: 'tel:+918830227359' },
  { icon: fixWhatsappGif, label: 'WhatsApp', href: 'https://wa.me/918830227359' },
  { icon: emailGif,       label: 'Email',    href: 'mailto:info@theshinereflecto.com' },
  { icon: linkedinGif,    label: 'LinkedIn',  href: '#' },
  { icon: instagramGif,   label: 'Instagram', href: '#' },
];

export default function Hero() {
  const [sliderX, setSliderX] = useState(50);
  const sliderRef = useRef(null);
  const dragging  = useRef(false);

  const calcPos = (clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    return Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
  };

  const onMouseDown = () => { dragging.current = true; };
  const onMouseUp   = () => { dragging.current = false; };
  const onMouseMove = (e) => { if (dragging.current) setSliderX(calcPos(e.clientX)); };
  const onTouchMove = (e) => { setSliderX(calcPos(e.touches[0].clientX)); };

  return (
    <section className="hero">
      <div className="container hero__inner">

        {/* ── Left ── */}
        <div className="hero__left reveal-up visible">
          <h1 className="hero__heading">
            Restore<br />
            <span className="hero__heading--olive">Mirror-Shine</span> to<br />
            <span style={{ whiteSpace: 'nowrap' }}>Your Floors Across</span><br />
            India
          </h1>

          <p className="hero__sub">
            Professional marble restoration providing the{' '}
            <strong>Best Service in Pune</strong>. We remove deep scratches and
            restore original brilliance nationwide.
          </p>

          <div className="hero__btns">
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Free Inspection
            </button>
            <button className="btn btn-outline">Get Instant Estimate</button>
          </div>

          {/* Trust row */}
          <div className="hero__trust">
            {TRUST_ITEMS.map((item, i) => (
              <React.Fragment key={item.text}>
                <span className="hero__trust-item">
                  <span className="hero__trust-icon">{item.icon}</span>
                  {item.text}
                </span>
                {i < TRUST_ITEMS.length - 1 && <span className="hero__trust-dot" />}
              </React.Fragment>
            ))}
          </div>

          {/* Urgency */}
          <p className="hero__urgency">
            <span className="hero__urgency-dot" />
            Same-day inspection available today in Pune!
          </p>

        </div>

        {/* ── Right: Before/After Card ── */}
        <div className="hero__right reveal-up visible">
          <div className="hero__card">
            <div
              className="hero__slider"
              ref={sliderRef}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseUp}
              onTouchMove={onTouchMove}
            >
              {/* After */}
              <div className="hero__slider-img">
                <img src={afterImg} alt="After marble polishing - mirror shine result" />
              </div>
              {/* Before overlay */}
              <div className="hero__slider-overlay" style={{ width: `${sliderX}%` }}>
                <img src={beforeImg} alt="Before marble polishing - dull floor" />
              </div>
              {/* Divider */}
              <div className="hero__slider-divider" style={{ left: `${sliderX}%` }}>
                <div className="hero__slider-handle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5l-7 7 7 7V5zm8 0v14l7-7-7-7z"/></svg>
                </div>
              </div>
            </div>
            <div className="hero__card-label">
              <span>Before</span>
              <span className="hero__card-arrow">↔</span>
              <span>After</span>
            </div>
          </div>
        </div>

        {/* Quick contacts - Spanning Full Width */}
        <div className="hero__contacts reveal-up visible">
          {CONTACT_LINKS.map(c => (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="hero__contact-chip">
              <img src={c.icon} alt={c.label} className="hero__contact-gif" />
              {c.label}
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
