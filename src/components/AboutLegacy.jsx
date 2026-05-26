import React from 'react';
import legacyImg from '../assets/images/luxury_residential_marble_interior_1777125177401.png';
import './AboutLegacy.css';

const FEATURES = [
  'Eco-Friendly Solutions',
  'Advanced Diamond Polishing',
  'Pan-India Service Presence',
  'Certified Professionals',
];

export default function AboutLegacy() {
  return (
    <section className="about section-pad">
      <div className="container about__inner">
        {/* Left – image */}
        <div className="about__img-wrap">
          <img src={legacyImg} alt="Worker polishing marble in luxury hotel lobby" className="about__img" />
          <div className="about__badge">
            <span className="about__badge-num">15+</span>
            <span className="about__badge-txt">Years of Shine</span>
          </div>
        </div>

        {/* Right – content */}
        <div className="about__content">
          <span className="label-tag">Our Legacy</span>
          <h2 className="section-heading about__heading">
            Pioneering Surface<br />Restoration Across<br />India
          </h2>
          <p className="about__para">
            Founded on the principles of precision and quality, The Shine Reflecto has become
            India's leading name in marble and stone restoration. We combine traditional
            craftsmanship with advanced technology to breathe new life into your surfaces.
          </p>
          <ul className="about__features">
            {FEATURES.map(f => (
              <li key={f} className="about__feature">
                <span className="about__check">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button className="btn btn-primary">Explore Our History</button>
        </div>
      </div>
    </section>
  );
}
