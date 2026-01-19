
import React, { useState } from 'react';
import CostCalculator from './components/CostCalculator';
import MarketTrends from './components/MarketTrends';
import AIAssistant from './components/AIAssistant';
import MaterialTracker from './components/MaterialTracker';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'trends' | 'tracker' | 'assistant'>('calc');

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6 shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-xl italic shadow-inner">PP</div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">PAKCONSTRUCT <span className="text-emerald-400 italic">PRO</span></h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">The Future of Construction in Pakistan</p>
            </div>
          </div>
          
          <nav className="hidden md:flex bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'calc', label: 'Estimator' },
              { id: 'tracker', label: 'Live Tracker' },
              { id: 'trends', label: 'Trends' },
              { id: 'assistant', label: 'AI Advisor' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">
            Build smarter, <span className="text-emerald-600">save faster.</span>
          </h2>
          <p className="text-slate-500 max-w-2xl text-lg font-medium">
            Pakistan's first integrated platform for construction management, combining local market data with advanced AI intelligence.
          </p>
        </div>

        {activeTab === 'calc' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CostCalculator />
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MaterialTracker />
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MarketTrends />
          </div>
        )}
        
        {activeTab === 'assistant' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <AIAssistant />
          </div>
        )}

        {/* Informational Cards */}
        {activeTab !== 'assistant' && activeTab !== 'tracker' && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-md border-t-4 border-emerald-500">
              <h4 className="font-bold text-slate-800 mb-2">LDA/CDA Compliance</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Need help with building bylaws in Punjab or ICT? Our AI advisor knows the latest setbacks and floor area ratio regulations.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-md border-t-4 border-blue-500">
              <h4 className="font-bold text-slate-800 mb-2">Verified Vendors</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Connect with reliable material suppliers for Lucky Cement, Ittefaq Steel, and more, based on your project location.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-md border-t-4 border-amber-500">
              <h4 className="font-bold text-slate-800 mb-2">Site Monitoring</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Upload daily progress photos in our AI chat to get instant feedback on construction quality and safety milestones.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Mobile Nav */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto hidden md:block">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2024 PakConstruct Pro. Designed for the builders of Pakistan.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-20 px-4 z-50">
        {[
          { id: 'calc', label: 'Estimator', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="16" y1="10" y2="10"/></svg> },
          { id: 'tracker', label: 'Live', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M12 7v5l3 3"/></svg> },
          { id: 'trends', label: 'Trends', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
          { id: 'assistant', label: 'AI Chat', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
