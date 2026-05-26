import React, { useState } from 'react';
import './EstimateContact.css';

/* ── Estimate Section ────────────────────────────── */
export function Estimate() {
  const [service, setService] = useState('marble');
  const [area,    setArea]    = useState('');

  const RATES = { marble: [30,60], granite: [40,80], tile: [20,45], scratch: [25,55], crack: [35,75], sealing: [15,30] };
  const [lo, hi] = RATES[service] || [30, 80];
  const estLo = area ? Math.round(parseInt(area) * lo) : null;
  const estHi = area ? Math.round(parseInt(area) * hi) : null;

  return (
    <section className="section-pad">
      <div className="container">
        <div className="text-center mb-64">
          <span className="label-tag">Pricing</span>
          <h2 className="section-heading">Get a Quick Estimate</h2>
        </div>
        <div className="estimate-grid">
          {/* Cost Estimator */}
          <div className="estimate-card">
            <h3 className="estimate-card-title">
              <span className="estimate-card-icon">🧮</span> Cost Estimator
            </h3>
            <p className="estimate-card-sub">Select your service and area size</p>
            <div className="form-field">
              <label>Select Service</label>
              <select value={service} onChange={e => setService(e.target.value)}>
                <option value="marble">Marble Polishing</option>
                <option value="granite">Granite Restoration</option>
                <option value="tile">Tile &amp; Grout Cleaning</option>
                <option value="scratch">Scratch Removal</option>
                <option value="crack">Crack Repair</option>
                <option value="sealing">Sealing &amp; Protection</option>
              </select>
            </div>
            <div className="form-field">
              <label>Area Size (Sq. Ft.)</label>
              <input type="number" placeholder="e.g. 1000" value={area} onChange={e => setArea(e.target.value)} min="0" />
            </div>
            <div className="estimate-result">
              <span className="estimate-result-label">Estimated Range:</span>
              <span className="estimate-result-value">
                {estLo ? `₹${estLo.toLocaleString()} – ₹${estHi.toLocaleString()}` : `₹${lo} – ${hi} / sq.ft`}
              </span>
            </div>
            <p className="estimate-disclaimer">
              * Final price will be provided after physical inspection by our expert.
            </p>
            <button className="btn btn-primary" style={{width:'100%',marginTop:8}}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Book Free Inspection
            </button>
          </div>

          {/* AI Upload */}
          <div className="estimate-card estimate-card--dark">
            <h3 className="estimate-card-title" style={{color:'#fff'}}>
              <span className="estimate-card-icon">🤖</span> Upload for AI Estimate
            </h3>
            <p className="estimate-card-sub" style={{color:'#9BA432'}}>Upload a photo of your floor for a faster quote</p>
            <div className="upload-box">
              <span className="upload-icon">📸</span>
              <p>Drag &amp; Drop or Browse</p>
              <p className="upload-formats">Supports: JPG, PNG, WEBP</p>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="upload-input" />
            </div>
            <button className="btn btn-primary" style={{width:'100%',marginTop:16}}>Analyze Image</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Contact / Final CTA ─────────────────────────── */
export function Contact() {
  const [form, setForm] = useState({ name:'', phone:'', location:'', service:'', message:'' });
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = e => { e.preventDefault(); alert('Thank you! We\'ll contact you within 24 hours.'); };

  return (
    <section id="contact" className="section-pad bg-soft">
      <div className="container">
        <div className="contact-grid">
          {/* Left */}
          <div className="contact-left">
            <span className="label-tag">Get in Touch</span>
            <h2 className="section-heading contact-heading">
              Ready for a Mirror-Like<br />
              <span className="olive-text">Shine?</span>
            </h2>
            <p className="contact-sub">
              Proudly serving Pune and Mumbai with professional marble polishing and restoration services.
            </p>
            <div className="contact-cards">
              <div className="contact-info-card">
                <span className="contact-info-icon">📞</span>
                <div>
                  <p className="contact-info-label">Call Now</p>
                  <a href="tel:+918830227359" className="contact-info-value">+91 88302 27359</a>
                </div>
              </div>
              <div className="contact-info-card">
                <span className="contact-info-icon">💬</span>
                <div>
                  <p className="contact-info-label">Chat on WhatsApp</p>
                  <a href="https://wa.me/918830227359" target="_blank" rel="noreferrer" className="contact-info-value">Instant Response</a>
                </div>
              </div>
            </div>
            <div className="contact-trust">
              {['Certified Professionals','ISO Quality Materials Used','100% Satisfaction Guarantee'].map(t => (
                <div key={t} className="contact-trust-item">
                  <span className="contact-trust-check">✓</span> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right – Form */}
          <div className="contact-form-wrap">
            <h3 className="contact-form-title">Request Free Inspection</h3>
            <p className="contact-form-sub">We'll contact you within 24 hours</p>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Full Name</label>
                <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input name="phone" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Location</label>
                <select name="location" value={form.location} onChange={handleChange} required>
                  <option value="">Select city</option>
                  <option>Pune</option>
                  <option>Mumbai</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>Service Required</label>
                <select name="service" value={form.service} onChange={handleChange} required>
                  <option value="">Select service</option>
                  <option>Marble Polishing</option>
                  <option>Granite Restoration</option>
                  <option>Tile &amp; Grout Cleaning</option>
                  <option>Scratch Removal</option>
                  <option>Crack Repair</option>
                  <option>Sealing &amp; Protection</option>
                </select>
              </div>
              <div className="form-field">
                <label>Message (Optional)</label>
                <textarea name="message" rows={4} placeholder="Tell us about your flooring..." value={form.message} onChange={handleChange} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Request Free Inspection</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA Mini ──────────────────────────────── */
export function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <div className="final-cta-inner">
          <div>
            <h2 className="section-heading final-cta-heading">
              Let's Create Lasting<br />
              <span className="olive-text">Shine Together.</span>
            </h2>
            <p className="final-cta-sub">
              Join 1200+ satisfied clients who trust us with their premium surfaces.
              Request your free site inspection today.
            </p>
            <div className="final-cta-google">
              <span className="final-cta-google-icon">⭐</span>
              <span>5.0 Rating on Google</span>
            </div>
          </div>
          <button className="btn btn-primary final-cta-btn"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
            Request Free Inspection
          </button>
        </div>
      </div>
    </section>
  );
}
