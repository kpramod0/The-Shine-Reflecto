import React, { useState } from 'react';
import beforeImg from '../assets/dull_marble_before_1777108669472.png';
import afterImg from '../assets/polished_marble_after_v2_1777108700895.png';

const Transformation = () => {
  const [position, setPosition] = useState(50);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, x)));
  };

  return (
    <section className="py-24 bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[#a6ad3c] font-black uppercase tracking-[0.3em] text-sm mb-4 block">See the Shine Difference</span>
          <h2 className="text-5xl lg:text-6xl font-black mb-8">Real Results, Real Reflections</h2>
        </div>

        <div 
          className="relative aspect-[21/9] rounded-[3rem] overflow-hidden cursor-ew-resize group select-none shadow-2xl"
          onMouseMove={handleMove}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${afterImg})` }} />
          <div 
            className="absolute inset-0 bg-cover bg-center border-r-2 border-[#a6ad3c]" 
            style={{ 
              backgroundImage: `url(${beforeImg})`,
              clipPath: `inset(0 ${100 - position}% 0 0)`
            }} 
          />
          
          {/* Labels */}
          <div className="absolute top-10 left-10 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest">Before Restoration</div>
          <div className="absolute top-10 right-10 bg-[#a6ad3c]/80 backdrop-blur-md px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest">After Shine</div>

          {/* Handle */}
          <div className="absolute top-0 bottom-0 w-1 bg-[#a6ad3c]" style={{ left: `${position}%` }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#a6ad3c] rounded-full flex items-center justify-center shadow-2xl border-4 border-[#1a1a1a]">
              <div className="flex gap-1 text-[#1a1a1a]">
                 <span className="font-black text-2xl">↔</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Transformation;
