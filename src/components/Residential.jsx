import React from 'react';
import { Sofa, Utensils, Bath } from 'lucide-react';

const Residential = () => {
  const areas = [
    { icon: <Sofa size={32} />, label: 'Living Areas' },
    { icon: <Utensils size={32} />, label: 'Luxury Kitchens' },
    { icon: <Bath size={32} />, label: 'Spa-like Bathrooms' },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-[4rem] p-16 lg:p-24 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f4f6e9] rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f4f6e9] rounded-full blur-[100px] -ml-32 -mb-32"></div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="text-[#a6ad3c] font-black uppercase tracking-[0.3em] text-sm mb-6 block">Residential Excellence</span>
            <h2 className="text-5xl lg:text-7xl font-black leading-tight text-[#1a1a1a] mb-8">
              Your Home Deserves a <br />
              <span className="text-[#a6ad3c]">Masterpiece Finish.</span>
            </h2>
            <p className="text-xl text-gray-500 mb-16 leading-relaxed">
              From luxury penthouses in Pune to heritage homes in Mumbai, we specialize in creating mirror-like finishes that reflect your exquisite taste. Our residential team brings diamond-grade polishing to your doorstep.
            </p>

            <div className="grid md:grid-cols-3 gap-10 mb-16">
              {areas.map((area, index) => (
                <div key={index} className="flex flex-col items-center gap-4 group">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-[#a6ad3c] group-hover:bg-[#a6ad3c] group-hover:text-white transition-all shadow-sm">
                    {area.icon}
                  </div>
                  <span className="font-bold text-lg text-[#1a1a1a]">{area.label}</span>
                </div>
              ))}
            </div>

            <button className="bg-[#a6ad3c] text-white px-12 py-5 rounded-xl font-black text-xl hover:bg-[#7a8a31] transition-all shadow-2xl shadow-[#a6ad3c]/30">
              Book Home Inspection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Residential;
