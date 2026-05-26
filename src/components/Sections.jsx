import React from 'react';
import './Sections.css';

/* ── Residential ──────────────────────────────────── */
export function Residential() {
  const areas = [
    { icon: '🛋️', label: 'Living Areas' },
    { icon: '🍽️', label: 'Luxury Kitchens' },
    { icon: '🛁', label: 'Spa-like Bathrooms' },
  ];
  return (
    <section id="residential" className="section-pad bg-soft">
      <div className="container">
        <div className="residential-card">
          <span className="label-tag">Residential Excellence</span>
          <h2 className="section-heading residential-heading">
            Your Home Deserves a<br />
            <span className="olive-text">Masterpiece Finish.</span>
          </h2>
          <p className="residential-desc">
            From luxury penthouses in Pune to heritage homes in Mumbai, we specialise in restoring the
            "soul" of your residential spaces. Our diamond-polishing process ensures a mirror-like
            finish that lasts for years, not months.
          </p>
          <div className="residential-areas">
            {areas.map(a => (
              <div key={a.label} className="residential-area">
                <span className="residential-area-icon">{a.icon}</span>
                <span>{a.label}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary">Book Home Inspection</button>
        </div>
      </div>
    </section>
  );
}

/* ── Services ─────────────────────────────────────── */
const SERVICES = [
  { icon: '💎', title: 'Marble Polishing',      desc: 'Diamond-grade polishing restores a flawless mirror shine on all marble surfaces.' },
  { icon: '🪨', title: 'Granite Restoration',   desc: 'Reviving the depth and lustre of granite surfaces worn by time and heavy use.' },
  { icon: '🧹', title: 'Tile & Grout Cleaning', desc: 'Deep-extraction cleaning for pristine, bacteria-free tile and grout lines.' },
  { icon: '✂️', title: 'Scratch Removal',       desc: 'Precision removal of deep etches and surface scratches using advanced techniques.' },
  { icon: '🔧', title: 'Crack Repair',           desc: 'Seamless structural filling with colour-matched resin for invisible repairs.' },
  { icon: '🛡️', title: 'Sealing & Protection',  desc: 'Nano-coat sealing for superior stain resistance and surface longevity.' },
];

export function Services() {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">Our Expertise</span>
          <h2 className="section-heading">Mastering Every Surface</h2>
        </div>
        <div className="services-grid">
          {SERVICES.map(s => (
            <div key={s.title} className="service-card">
              <span className="service-icon">{s.icon}</span>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Transformation (Before/After full-width) ─────── */
import beforeImg from '../assets/images/dull_marble_before_1777108669472.png';
import afterImg  from '../assets/images/polished_marble_after_v2_1777108700895.png';
import { useState, useRef } from 'react';

export function Transformation() {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const drag = useRef(false);
  const calc = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    return Math.max(5, Math.min(95, ((clientX - r.left) / r.width) * 100));
  };

  return (
    <section className="section-pad bg-dark">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag" style={{color:'#c8d04a'}}>See the Difference</span>
          <h2 className="section-heading" style={{color:'#fff'}}>See the Shine Difference</h2>
        </div>
        <div
          className="transform-slider"
          ref={ref}
          onMouseDown={() => drag.current = true}
          onMouseUp={() => drag.current = false}
          onMouseLeave={() => drag.current = false}
          onMouseMove={(e) => { if (drag.current) setPos(calc(e.clientX)); }}
          onTouchMove={(e) => setPos(calc(e.touches[0].clientX))}
        >
          <div className="transform-img">
            <img src={afterImg} alt="After marble polishing" />
            <div className="transform-label transform-label--right">After Shine ✦</div>
          </div>
          <div className="transform-overlay" style={{ width: `${pos}%` }}>
            <img src={beforeImg} alt="Before marble polishing" />
            <div className="transform-label transform-label--left">Before Restoration</div>
          </div>
          <div className="transform-divider" style={{ left: `${pos}%` }}>
            <div className="transform-handle">↔</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Industries ───────────────────────────────────── */
const INDUSTRIES = [
  { icon: '🏢', title: 'Commercial',   desc: 'Office towers, banks, retail spaces — we keep high-traffic floors pristine.' },
  { icon: '🏠', title: 'Residential',  desc: 'Luxury homes and apartments restored to their original brilliance.' },
  { icon: '🏨', title: 'Hospitality',  desc: 'Five-star hotels and resorts trust us for mirror-shine lobbies.' },
  { icon: '🏥', title: 'Healthcare',   desc: 'Hygienic, bacteria-free surface solutions for medical facilities.' },
];

export function Industries() {
  return (
    <section className="section-pad bg-soft">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">Industries We Serve</span>
          <h2 className="section-heading">Tailored for Every Space</h2>
        </div>
        <div className="industries-grid">
          {INDUSTRIES.map(ind => (
            <div key={ind.title} className="industry-card card">
              <span className="industry-icon">{ind.icon}</span>
              <h3 className="industry-title">{ind.title}</h3>
              <p className="industry-desc">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Technology ───────────────────────────────────── */
const TECH = [
  { icon: '💎', title: 'Diamond Abrasives',      desc: 'High-precision grinding pads that restore clarity and depth to natural stone.' },
  { icon: '🌿', title: 'Eco-Friendly Chemicals', desc: 'pH-neutral, non-toxic solutions that protect surfaces and indoor air quality.' },
  { icon: '🌬️', title: 'Dust Extraction',        desc: 'Advanced vacuum systems ensuring a clean, dust-free restoration process.' },
];

export function Technology() {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">Innovation Meets Craft</span>
          <h2 className="section-heading">Advanced Technology &amp; Eco-Materials</h2>
          <p className="section-subtext" style={{margin:'16px auto 0'}}>
            We leverage world-class machinery and environmentally safe chemicals to deliver superior
            results without compromising health or the planet.
          </p>
        </div>
        <div className="services-grid">
          {TECH.map(t => (
            <div key={t.title} className="service-card">
              <span className="service-icon">{t.icon}</span>
              <h3 className="service-title">{t.title}</h3>
              <p className="service-desc">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Process ──────────────────────────────────────── */
const STEPS = [
  { num: '01', title: 'Assessment',    desc: 'On-site inspection to analyse surface condition and requirements.' },
  { num: '02', title: 'Preparation',   desc: 'Deep cleaning and protecting surrounding areas before work begins.' },
  { num: '03', title: 'Execution',     desc: 'Multi-stage polishing using diamond abrasives and expert care.' },
  { num: '04', title: 'Quality Check', desc: 'Final buffing and client walkthrough to ensure 100% satisfaction.' },
];

export function Process() {
  return (
    <section className="section-pad bg-soft">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">How We Work</span>
          <h2 className="section-heading">Our Precision Process</h2>
        </div>
        <div className="process-grid">
          {STEPS.map((s, i) => (
            <div key={s.num} className="process-step">
              <div className="process-num">{s.num}</div>
              <div className="process-connector" style={{ display: i < STEPS.length - 1 ? 'block' : 'none' }} />
              <h3 className="process-title">{s.title}</h3>
              <p className="process-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Priya Sharma',    role: 'Homeowner, Pune',           rating: 5, review: 'Our marble floors look brand new! The team was professional, on time, and the finish is absolutely stunning. Highly recommend.' },
  { name: 'Rajesh Mehta',    role: 'GM, Grand Hyatt Pune',      rating: 5, review: 'We use TSR exclusively for our hotel lobbies. The quality and consistency are unmatched. True professionals.' },
  { name: 'Anita Desai',     role: 'Interior Designer, Mumbai', rating: 5, review: 'My clients are always blown away by the results. TSR is my go-to for every premium residential project.' },
];

export function Testimonials() {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">Client Stories</span>
          <h2 className="section-heading">What Our Clients Say</h2>
        </div>
        <div className="services-grid">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="testimonial-card card">
              <div className="testimonial-stars">{'★'.repeat(t.rating)}</div>
              <p className="testimonial-review">"{t.review}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name[0]}</div>
                <div>
                  <p className="testimonial-name">{t.name}</p>
                  <p className="testimonial-role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Gallery ──────────────────────────────────────── */
import heroImg  from '../assets/images/hero_marble_floor_1777108642365.png';
import proImg   from '../assets/images/marble_polishing_pro_1777108729080.png';
import machImg  from '../assets/images/marble_polishing_machine_detail_v2_1777108762631.png';

const PROJECTS = [
  { img: heroImg,  title: 'Luxury Hotel Lobby',      desc: 'Complete restoration of 5000 sq.ft. Italian marble floor.' },
  { img: proImg,   title: 'Corporate HQ Flooring',   desc: 'High-traffic maintenance programme for a premium office space.' },
  { img: machImg,  title: 'Private Estate Residence', desc: 'Restoring antique travertine surfaces to mirror finish.' },
];

export function Gallery() {
  return (
    <section id="gallery" className="section-pad bg-soft">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">Our Portfolio</span>
          <h2 className="section-heading">Masterpieces of Restoration</h2>
        </div>
        <div className="services-grid">
          {PROJECTS.map(p => (
            <div key={p.title} className="gallery-card card">
              <img src={p.img} alt={p.title} className="gallery-img" />
              <div className="gallery-body">
                <h3 className="gallery-title olive-text">{p.title}</h3>
                <p className="gallery-desc">{p.desc}</p>
                <a href="#" className="gallery-link">View Case Study →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
