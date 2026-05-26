import React from 'react';
import { Layers, Box, Droplets, Eraser, PenTool, Lock } from 'lucide-react';

const Services = () => {
  const services = [
    { icon: <Layers />, title: 'Marble Polishing', desc: 'Diamond-grade polishing for an everlasting mirror shine.' },
    { icon: <Box />, title: 'Granite Restoration', desc: 'Restoring the natural depth and color of granite surfaces.' },
    { icon: <Droplets />, title: 'Tile & Grout Cleaning', desc: 'Deep extraction cleaning for pristine, bacteria-free grout lines.' },
    { icon: <Eraser />, title: 'Scratch Removal', desc: 'Eliminating deep etches and surface scratches with precision.' },
    { icon: <PenTool />, title: 'Crack Repair', desc: 'Seamless structural filling and color-matched resin repairs.' },
    { icon: <Lock />, title: 'Sealing & Protection', desc: 'High-performance nano-coating for stain resistance.' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-[#a6ad3c] font-black uppercase tracking-[0.3em] text-sm mb-4 block">Mastering Every Surface</span>
          <h2 className="text-5xl lg:text-6xl font-black text-[#1a1a1a]">Expert Restoration Services</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <div key={i} className="group p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:border-[#a6ad3c]/20 transition-all">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#a6ad3c] mb-8 shadow-sm group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <h3 className="text-2xl font-black text-[#1a1a1a] mb-4">{s.title}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
