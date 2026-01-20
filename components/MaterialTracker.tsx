
import React, { useState, useEffect, useCallback } from 'react';
import { CITY_MARKET_DATA, DEFAULT_MARKET_PRICES, PAK_CITIES } from '../constants';
import { MaterialPrice, AvailabilityStatus } from '../types';
import { fetchLiveMarketData } from '../services/geminiService';

const MaterialTracker: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [marketData, setMarketData] = useState<MaterialPrice[]>(CITY_MARKET_DATA['Lahore']);
  const [isLoading, setIsLoading] = useState(false);
  const [isLivePulse, setIsLivePulse] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadLiveRates = useCallback(async (city: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // First, immediately show the best available local data to avoid UI lag
      const localData = CITY_MARKET_DATA[city] || DEFAULT_MARKET_PRICES;
      setMarketData(localData);

      // Then attempt to fetch live data from the web using Gemini
      // This uses Google Search grounding to get actual current prices
      const liveData = await fetchLiveMarketData(city);
      if (liveData && liveData.length > 0) {
        setMarketData(liveData);
      }
    } catch (error) {
      console.error("Error fetching live rates:", error);
      setFetchError("Live market sync unavailable. Showing baseline regional rates.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveRates(selectedCity);
  }, [selectedCity, loadLiveRates]);

  // Visual pulse for the "Live" indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLivePulse(prev => !prev);
      setTimeout(() => setIsLivePulse(true), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: AvailabilityStatus) => {
    switch (status) {
      case 'In Stock': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Low Stock': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'Out of Stock': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tracker Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full bg-emerald-500 ${isLivePulse ? 'animate-ping' : ''}`}></div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Market Pulse: {selectedCity}</h2>
            <span className="ml-2 bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Gemini Grounded</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Aggregating current rates from retail hubs and re-rolling mills</p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button 
            onClick={() => loadLiveRates(selectedCity)}
            disabled={isLoading}
            className="p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all disabled:opacity-50 border border-slate-100"
            title="Force Refresh"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoading ? 'animate-spin' : ''}>
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
          <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>
          <div className="flex flex-col">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Location</label>
            <select 
              value={selectedCity}
              onChange={handleCityChange}
              disabled={isLoading}
              className="bg-slate-900 text-white text-xs font-black py-2 px-4 rounded-xl outline-none ring-offset-2 focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer disabled:bg-slate-700 border-none appearance-none"
            >
              {PAK_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        
        {isLoading && (
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-blue-500 transition-all animate-shimmer w-full"></div>
        )}
      </div>

      {fetchError && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {fetchError}
        </div>
      )}

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketData.map((item, idx) => (
          <div key={idx} className={`bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative ${isLoading ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <span className="text-xl font-black text-slate-400 group-hover:text-emerald-600">
                  {item.type.charAt(0)}
                </span>
              </div>
              <div className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${getStatusColor(item.availability)}`}>
                {item.availability}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.type}</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">Rs.{item.price.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">Standard {item.unit}</p>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-50 flex justify-between items-center">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${item.change24h < 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <span className={`text-[11px] font-black ${item.change24h < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}%
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className={item.change24h < 0 ? 'rotate-180 text-rose-600' : 'text-emerald-600'}>
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </div>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">
                {isLoading ? 'Syncing...' : item.lastUpdated === 'Live from Search' ? 'Updated Now' : item.lastUpdated}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Regional Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
          </div>
          <div className="relative z-10">
            <h4 className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Strategic Intelligence: {selectedCity}</h4>
            <h3 className="text-3xl font-black mb-6 leading-tight max-w-md">Construction Landscape Analysis</h3>
            <p className="text-slate-300 leading-relaxed max-w-2xl font-medium">
              {selectedCity === 'Karachi' ? 
                "Coastal logistics prioritize anti-corrosive steel coatings. Local re-rolling mills are operating at 85% capacity. Port congestion is currently minimal, stabilizing cement export-grade pricing." :
                selectedCity === 'Islamabad' ? 
                "Strict adherence to CDA zone-wise building codes. Peak season demand from high-rise projects in Gulberg and DHA is driving local sand rates. Crushed stone supply is steady from Taxila." :
                selectedCity === 'Lahore' ?
                "High density housing schemes in LDA jurisdiction are leading to bulk purchase discounts in the Raiwind market hub. Brick kiln operations are normalized after smog season shutdowns." :
                `Market activity in ${selectedCity} is currently stable. Secondary supply chains from nearby hubs are compensating for direct mill access. We recommend hedging bulk material purchases before the upcoming fiscal cycle.`
              }
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
               <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                 <span className="block text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Stability Rating</span>
                 <span className="text-lg font-black">{selectedCity === 'Karachi' || selectedCity === 'Lahore' ? 'A+' : 'A'}</span>
               </div>
               <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                 <span className="block text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Sourcing Speed</span>
                 <span className="text-lg font-black">Optimal</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl flex flex-col">
           <div className="flex items-center justify-between mb-8">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Verified Suppliers</h4>
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
           </div>
           <div className="space-y-5 flex-1">
             {[
               { name: `${selectedCity} Steel & Build`, type: 'Wholesale', score: 98 },
               { name: 'National Cement Agency', type: 'Distributor', score: 96 },
               { name: 'Modern Bricks Co.', type: 'Local Kiln', score: 92 },
               { name: 'Elite Hardware Hub', type: 'Retail', score: 95 },
             ].map((v, i) => (
               <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-white group-hover:shadow-sm">
                     {i+1}
                   </div>
                   <div>
                     <span className="text-xs font-black text-slate-800 block">{v.name}</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase">{v.type}</span>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className="text-xs font-black text-emerald-600">{v.score}%</span>
                   <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Trust</span>
                 </div>
               </div>
             ))}
           </div>
           <button className="w-full mt-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">
             View Full Directory
           </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialTracker;
