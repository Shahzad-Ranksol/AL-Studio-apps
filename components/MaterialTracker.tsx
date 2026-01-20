
import React, { useState, useEffect, useCallback } from 'react';
import { CITY_MARKET_DATA, DEFAULT_MARKET_PRICES, PAK_CITIES } from '../constants';
import { MaterialPrice, AvailabilityStatus } from '../types';
import { fetchLiveMarketData } from '../services/geminiService';

const MaterialTracker: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [marketData, setMarketData] = useState<MaterialPrice[]>(CITY_MARKET_DATA['Lahore']);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadLiveRates = useCallback(async (city: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const liveData = await fetchLiveMarketData(city);
      if (liveData && liveData.length > 0) {
        setMarketData(liveData);
      } else {
        setMarketData(CITY_MARKET_DATA[city] || DEFAULT_MARKET_PRICES);
      }
    } catch (error) {
      console.error("Error fetching live rates:", error);
      setFetchError("Unable to reach live markets. Showing estimated rates.");
      setMarketData(CITY_MARKET_DATA[city] || DEFAULT_MARKET_PRICES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveRates(selectedCity);
  }, [selectedCity, loadLiveRates]);

  // Pulsing "Live" indicator logic
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
      setTimeout(() => setIsLive(true), 100);
    }, 5000);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tracker Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full bg-emerald-500 ${isLive ? 'animate-ping' : ''}`}></div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Real-Time Market Pulse</h2>
            <span className="ml-2 bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">AI Verified</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Sourcing current rates for {selectedCity} via Gemini Search Grounding</p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button 
            onClick={() => loadLiveRates(selectedCity)}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
            title="Refresh live rates"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoading ? 'animate-spin' : ''}>
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
          <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market:</label>
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={isLoading}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer disabled:bg-slate-100"
          >
            {PAK_CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        
        {isLoading && (
          <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all animate-pulse w-full"></div>
        )}
      </div>

      {fetchError && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {fetchError}
        </div>
      )}

      {/* Ticker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketData.map((item, idx) => (
          <div key={idx} className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative ${isLoading ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                <span className="text-xl font-bold text-slate-400 group-hover:text-emerald-600">
                  {item.type[0]}
                </span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border ${getStatusColor(item.availability)}`}>
                {item.availability}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.type}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">Rs. {item.price.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">per {item.unit}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-black ${item.change24h < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}%
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={item.change24h < 0 ? 'rotate-180 text-rose-500' : 'text-emerald-500'}>
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </div>
              <span className="text-[9px] text-slate-300 font-bold italic">
                {isLoading ? 'Fetching...' : item.lastUpdated === 'Live from Search' ? new Date().toLocaleDateString('en-PK') : item.lastUpdated}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Market Insight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <svg width="160" height="160" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
          </div>
          <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">Market Summary: {selectedCity}</h4>
          <p className="text-slate-300 leading-relaxed max-w-xl">
            {selectedCity === 'Karachi' ? 
              "As a coastal entry point, Karachi remains the benchmark for steel and imported finishing prices. Currently, scrap re-rolling mills show stable output but rising fuel costs may pressure logistics next week." :
              selectedCity === 'Islamabad' ? 
              "The northern market is experiencing peak seasonal demand. Cement availability is slightly tight in Sector H and I warehouses. Expect a 2-3% hike if rain delays supply chains from the Taxila hub." :
              "Central Punjab markets are showing increased activity in private residential sectors. Bricks prices are competitive due to proximity of Bhatta zones, but coal price fluctuations remain a variable factor."
            }
          </p>
          <div className="mt-8 flex gap-4">
             <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
               <span className="block text-[10px] text-slate-500 font-black uppercase">Volatility Index</span>
               <span className="text-sm font-black">Moderate (Low)</span>
             </div>
             <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
               <span className="block text-[10px] text-slate-500 font-black uppercase">Trade Volume</span>
               <span className="text-sm font-black">Trending Up</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Top Local Vendors</h4>
           <div className="space-y-4">
             {[
               { name: 'Model Town Hardware', status: 'Online', score: 98 },
               { name: 'Ittefaq Steel Agency', status: 'Busy', score: 94 },
               { name: 'Lucky Distributors', status: 'Online', score: 91 },
             ].map((v, i) => (
               <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                 <div>
                   <span className="text-sm font-bold text-slate-800 block">{v.name}</span>
                   <span className="text-[10px] text-emerald-500 font-bold">{v.status}</span>
                 </div>
                 <div className="text-right">
                   <span className="text-xs font-black text-slate-700">{v.score}%</span>
                   <span className="block text-[8px] font-bold text-slate-400 uppercase">Trust Score</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialTracker;
