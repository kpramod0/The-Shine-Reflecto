import React, { useState, useEffect, useRef } from 'react';
import './Stats.css';

const STATS = [
  { target: 5000, suffix: '+', label: 'Projects Completed', icon: '🏆' },
  { target: 1200, suffix: '+', label: 'Happy Clients',       icon: '😊' },
  { target: 15,   suffix: '+', label: 'Years Experience',    icon: '⭐' },
  { target: 98,   suffix: '%', label: 'Retention Rate',      icon: '📈' },
];

const INDUSTRIES = [
  { icon: '🏨', label: 'Luxury Hotels' },
  { icon: '🏢', label: 'Corporate Offices' },
  { icon: '🏬', label: 'Premium Malls' },
  { icon: '🏥', label: 'Healthcare' },
];

function CountUp({ target, suffix }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (outQuad)
      const easedProgress = progress * (2 - progress);
      
      const currentCount = Math.floor(easedProgress * target);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, target]);

  return <span ref={elementRef}>{count}{suffix}</span>;
}

export default function Stats() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="stats-card">
              <span className="stats-icon">{s.icon}</span>
              <span className="stats-num">
                <CountUp target={s.target} suffix={s.suffix} />
              </span>
              <span className="stats-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="stats-trusted">
          <p className="stats-trusted-title">Trusted by Industry Leaders</p>
          <div className="stats-industries">
            {INDUSTRIES.map(ind => (
              <span key={ind.label} className="stats-industry-item">
                <span>{ind.icon}</span> {ind.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
