import React, { useState } from 'react';
import { Calculator, Upload, Sparkles } from 'lucide-react';

const Estimate = () => {
  const [area, setArea] = useState('');
  const [service, setService] = useState('polishing');

  const prices = { polishing: 45, restoration: 85, cleaning: 25 };
  const estimatedCost = area ? parseInt(area) * prices[service] : 0;

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-[#a6ad3c] font-black uppercase tracking-[0.3em] text-sm mb-4 block">Get a Quick Estimate</span>
          <h2 className="text-5xl lg:text-6xl font-black text-[#1a1a1a]">Transparent Pricing, No Surprises</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Cost Estimator Card */}
          <div className="bg-gray-50 p-12 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-[#a6ad3c] text-white rounded-xl flex items-center justify-center">
                <Calculator />
              </div>
              <h3 className="text-2xl font-black text-[#1a1a1a]">Cost Estimator</h3>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col gap-3">
                <label className="font-bold text-sm text-gray-500 uppercase tracking-widest">Select Service</label>
                <select 
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-white px-6 py-4 rounded-xl border border-gray-200 outline-none font-bold text-[#1a1a1a]"
                >
                  <option value="polishing">Mirror Polishing (₹45/sq.ft)</option>
                  <option value="restoration">Full Restoration (₹85/sq.ft)</option>
                  <option value="cleaning">Deep Cleaning (₹25/sq.ft)</option>
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-bold text-sm text-gray-500 uppercase tracking-widest">Total Area (Sq.Ft)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-white px-6 py-4 rounded-xl border border-gray-200 outline-none font-bold text-[#1a1a1a]"
                />
              </div>

              <div className="pt-8 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Range</p>
                  <p className="text-4xl font-black text-[#1a1a1a]">₹{estimatedCost.toLocaleString()} - ₹{(estimatedCost * 1.2).toLocaleString()}</p>
                </div>
                <button className="bg-[#a6ad3c] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#7a8a31] transition-all shadow-lg shadow-[#a6ad3c]/20">
                  Book Inspection
                </button>
              </div>
            </div>
          </div>

          {/* AI Estimate Card */}
          <div className="bg-[#1a1a1a] p-12 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#a6ad3c] rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
            
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#a6ad3c] text-white rounded-xl flex items-center justify-center">
                  <Sparkles />
                </div>
                <h3 className="text-2xl font-black">AI Damage Analysis</h3>
              </div>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Upload a clear photo of your floor. Our AI will analyze the surface condition and provide an instant damage report.
              </p>

              <div className="border-2 border-dashed border-gray-700 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <Upload className="text-[#a6ad3c]" size={48} />
                <p className="font-bold text-lg">Drag & Drop or Browse</p>
                <p className="text-sm text-gray-500 font-medium">PNG, JPG up to 10MB</p>
              </div>
            </div>

            <button className="w-full bg-white text-[#1a1a1a] py-5 rounded-2xl font-black text-lg mt-10 hover:bg-[#a6ad3c] hover:text-white transition-all">
              Analyze Image Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Estimate;
