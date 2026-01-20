
import React, { useState, useMemo } from 'react';
import { ConstructionInputs, MaterialType } from '../types';
import { PAK_CITIES, UNIT_CONVERSIONS, CITY_MARKET_DATA, DEFAULT_MARKET_PRICES } from '../constants';
import { generateArchitecturalImage } from '../services/geminiService';

type ArchStyle = {
  id: string;
  label: string;
  prompt: string;
  color: string;
};

type LightingMode = {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
};

const ARCH_STYLES: ArchStyle[] = [
  { id: 'minimal', label: 'Modern White', prompt: 'minimalist white plaster finish, clean lines, wood accents', color: 'bg-white border-slate-200' },
  { id: 'spanish', label: 'Spanish Revival', prompt: 'spanish colonial style, white walls, terracotta roof tiles, arches, popular in DHA', color: 'bg-orange-50 border-orange-200' },
  { id: 'brick', label: 'Lahore Heritage', prompt: 'traditional exposed red brick facade, intricate brickwork, classic Lahore style', color: 'bg-red-700' },
  { id: 'stone', label: 'Contemporary Stone', prompt: 'contemporary charcoal stone cladding, large glass panels, industrial look', color: 'bg-slate-700' },
];

const LIGHTING_MODES: LightingMode[] = [
  { id: 'day', label: 'Natural Day', prompt: 'bright mid-day sunlight, clear blue sky, natural colors', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
  { id: 'sunset', label: 'Golden Hour', prompt: 'warm sunset lighting, long shadows, orange and purple hues, cinematic', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg> },
  { id: 'night', label: 'Midnight', prompt: 'night time photography, dramatic exterior architectural lighting, glowing windows, deep blue sky', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
];

const CostCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<ConstructionInputs>({
    area: 5,
    unitType: 'Marla',
    floors: 'Ground Only',
    quality: 'Standard',
    city: 'Lahore',
    laborRate: 450,
    rooms: 3,
    bathrooms: 3,
    kitchens: 1,
    hasGarage: true,
    hasDrawing: true,
    hasDining: true,
    steelGrade: 'Grade 60',
    floorFinish: 'Tiles',
    foundationType: 'Shallow/Strip',
    beamReinforcement: 'Standard'
  });

  const [visuals, setVisuals] = useState<{ elevation: string | null, blueprint: string | null }>({
    elevation: null,
    blueprint: null
  });
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [isUpdatingStyle, setIsUpdatingStyle] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ArchStyle>(ARCH_STYLES[0]);
  const [selectedLight, setSelectedLight] = useState<LightingMode>(LIGHTING_MODES[0]);

  const analysis = useMemo(() => {
    const totalSqFtPerFloor = inputs.area * UNIT_CONVERSIONS[inputs.unitType];
    const floorCount = inputs.floors === 'Ground Only' ? 1 : inputs.floors === 'Ground + 1' ? 2 : 3;
    const totalCoveredArea = totalSqFtPerFloor * (1 + (floorCount - 1) * 0.85);

    const cityMarket = CITY_MARKET_DATA[inputs.city] || DEFAULT_MARKET_PRICES;
    const cementPrice = cityMarket.find(p => p.type === MaterialType.CEMENT)?.price || 1250;
    const baseSteelPrice = cityMarket.find(p => p.type === MaterialType.STEEL)?.price || 265000;
    const brickPrice = cityMarket.find(p => p.type === MaterialType.BRICKS)?.price || 18500;

    let steelBaseKg = 3.8; 
    if (inputs.floors === 'Ground + 1') steelBaseKg = 4.6;
    if (inputs.floors === 'Ground + 2') steelBaseKg = 5.4;
    if (inputs.beamReinforcement === 'Heavy') steelBaseKg *= 1.18;
    if (inputs.foundationType === 'Raft') steelBaseKg *= 1.30;
    const gradeAdjustment = inputs.steelGrade === 'Grade 40' ? 1.22 : 1.0;
    const steelTons = parseFloat(((totalCoveredArea * steelBaseKg * gradeAdjustment) / 1000).toFixed(2));

    let cementFactor = 0.42; 
    if (inputs.floorFinish === 'Marble' || inputs.floorFinish === 'Granite') cementFactor = 0.54;
    if (inputs.floorFinish === 'Concrete') cementFactor = 0.35;
    if (inputs.floorFinish === 'Wooden') cementFactor = 0.40;

    if (inputs.foundationType === 'Raft') cementFactor += 0.08;
    const wallPartitionImpact = 1 + (inputs.rooms * 0.03);
    const cementBags = Math.round(totalCoveredArea * cementFactor * wallPartitionImpact);

    const bricksPerSqFt = 28;
    const totalBricks = Math.round(totalCoveredArea * bricksPerSqFt * wallPartitionImpact);

    const qualityMultiplier = inputs.quality === 'Economy' ? 0.88 : inputs.quality === 'Premium' ? 1.45 : 1;
    const steelPriceAdj = inputs.steelGrade === 'Grade 40' ? 0.93 : 1.0; 

    const greyCostExclSteel = totalCoveredArea * 1800 * qualityMultiplier; 
    const steelCostTotal = steelTons * (baseSteelPrice * steelPriceAdj);
    const cementCostTotal = cementBags * cementPrice;
    const brickCostTotal = (totalBricks / 1000) * brickPrice;

    let finishingBaseSqFt = 2200; 
    if (inputs.floorFinish === 'Marble') finishingBaseSqFt = 3100; 
    if (inputs.floorFinish === 'Concrete') finishingBaseSqFt = 1400; 
    if (inputs.floorFinish === 'Granite') finishingBaseSqFt = 4200; 
    if (inputs.floorFinish === 'Wooden') finishingBaseSqFt = 3600; 
    
    const finishingCostTotal = (totalCoveredArea * finishingBaseSqFt * qualityMultiplier) + (inputs.bathrooms * 60000) + (inputs.kitchens * 90000);
    
    let laborRateAdj = inputs.laborRate;
    if (inputs.floorFinish === 'Marble') laborRateAdj += 80;
    if (inputs.floorFinish === 'Granite') laborRateAdj += 120; 
    if (inputs.floorFinish === 'Wooden') laborRateAdj += 60; 
    if (inputs.floorFinish === 'Concrete') laborRateAdj -= 40;
    
    const laborCostTotal = totalCoveredArea * laborRateAdj;
    const totalProjectCost = greyCostExclSteel + steelCostTotal + cementCostTotal + brickCostTotal + finishingCostTotal + laborCostTotal;

    const totalCoreMaterialCost = cementCostTotal + steelCostTotal + brickCostTotal;

    const materialBreakdown = [
      { 
        type: MaterialType.CEMENT, 
        quantity: `${cementBags.toLocaleString()} Bags`, 
        cost: cementCostTotal, 
        percent: (cementCostTotal / totalCoreMaterialCost) * 100,
        color: 'bg-emerald-500'
      },
      { 
        type: MaterialType.STEEL, 
        quantity: `${steelTons} Tons`, 
        cost: steelCostTotal, 
        percent: (steelCostTotal / totalCoreMaterialCost) * 100,
        color: 'bg-blue-600'
      },
      { 
        type: MaterialType.BRICKS, 
        quantity: `${totalBricks.toLocaleString()} Nos`, 
        cost: brickCostTotal, 
        percent: (brickCostTotal / totalCoreMaterialCost) * 100,
        color: 'bg-amber-600'
      },
    ];

    return {
      totalCoveredArea,
      totalProjectCost,
      materialBreakdown,
      steelTons,
      isFeasible: totalCoveredArea > (inputs.rooms * 150),
    };
  }, [inputs]);

  const handleGenerateVisuals = async () => {
    setIsGeneratingVisuals(true);
    try {
      const elevationPrompt = `Modern Pakistani house elevation, ${inputs.floors}, ${inputs.area} ${inputs.unitType}, ${inputs.quality} quality, ${selectedStyle.prompt}, ${selectedLight.prompt}, ${inputs.city} context. Highly detailed architectural photography, 8k resolution.`;
      const [elevation, blueprint] = await Promise.all([
        generateArchitecturalImage(elevationPrompt),
        generateArchitecturalImage(`Technical architectural floor plan layout, blue-print style, for a ${inputs.area} ${inputs.unitType} plot in Pakistan, showing ${inputs.rooms} rooms and detailed setbacks. Top-down view.`)
      ]);
      setVisuals({ elevation, blueprint });
    } catch (error) { console.error(error); } finally { setIsGeneratingVisuals(false); }
  };

  const handleRefineVisual = async (newStyle?: ArchStyle, newLight?: LightingMode) => {
    if (isUpdatingStyle || !visuals.elevation) return;
    
    const styleToUse = newStyle || selectedStyle;
    const lightToUse = newLight || selectedLight;
    
    if (newStyle) setSelectedStyle(newStyle);
    if (newLight) setSelectedLight(newLight);
    
    setIsUpdatingStyle(true);
    try {
      const elevationPrompt = `Modern Pakistani house elevation, ${inputs.floors}, ${inputs.area} ${inputs.unitType}, ${inputs.quality} quality, ${styleToUse.prompt}, ${lightToUse.prompt}, ${inputs.city} context. Highly detailed architectural photography, 8k resolution.`;
      const elevation = await generateArchitecturalImage(elevationPrompt);
      setVisuals(prev => ({ ...prev, elevation }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingStyle(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 text-slate-900 border border-slate-100 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            Precision Estimator
          </h2>
          <p className="text-slate-400 font-medium mt-1">Calculated using live market rates in {inputs.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">1. Project Foundation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Plot Size & City</label>
                <div className="flex gap-2">
                   <div className="flex-1 flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <input 
                      type="number" 
                      value={inputs.area}
                      onChange={(e) => setInputs({...inputs, area: parseFloat(e.target.value) || 0})}
                      className="flex-1 px-3 py-1.5 outline-none font-bold text-slate-700 w-16"
                    />
                    <select 
                      value={inputs.unitType}
                      onChange={(e) => setInputs({...inputs, unitType: e.target.value as any})}
                      className="px-2 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black outline-none"
                    >
                      <option>Marla</option>
                      <option>Kanal</option>
                      <option>SqFt</option>
                    </select>
                  </div>
                  <select 
                    value={inputs.city}
                    onChange={(e) => setInputs({...inputs, city: e.target.value})}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none text-xs"
                  >
                    {PAK_CITIES.map(city => <option key={city}>{city}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Storey / Floors</label>
                <select 
                  value={inputs.floors}
                  onChange={(e) => setInputs({...inputs, floors: e.target.value as any})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                >
                  <option>Ground Only</option>
                  <option>Ground + 1</option>
                  <option>Ground + 2</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">2. Structural Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Foundation</label>
                <select value={inputs.foundationType} onChange={(e) => setInputs({...inputs, foundationType: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none">
                  <option value="Shallow/Strip">Shallow / Strip</option>
                  <option value="Raft">Raft (RCC Mat)</option>
                  <option value="Piles">Piles (Deep)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Beam Style</label>
                <select value={inputs.beamReinforcement} onChange={(e) => setInputs({...inputs, beamReinforcement: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none">
                  <option value="Standard">Standard Beams</option>
                  <option value="Heavy">Heavy Reinforcement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Steel Rebar</label>
                <select value={inputs.steelGrade} onChange={(e) => setInputs({...inputs, steelGrade: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none">
                  <option value="Grade 40">Grade 40 (Legacy)</option>
                  <option value="Grade 60">Grade 60 (Standard)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">3. Interior & Finishes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Floor Finish</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 relative overflow-x-auto no-scrollbar">
                  {['Concrete', 'Tiles', 'Marble', 'Granite', 'Wooden'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setInputs({...inputs, floorFinish: f as any})} 
                      className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap px-2 ${inputs.floorFinish === f ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Overall Quality</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  {['Economy', 'Standard', 'Premium'].map(q => (
                    <button key={q} onClick={() => setInputs({...inputs, quality: q as any})} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inputs.quality === q ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>{q}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Cost Summary Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
              </div>
              <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2">Total Project Estimate ({inputs.city})</p>
              <div className="text-5xl font-black mb-1">Rs. {(analysis.totalProjectCost / 1000000).toFixed(2)}<span className="text-emerald-500 italic">M</span></div>
              <p className="text-slate-400 text-sm font-medium">Approx. {analysis.totalCoveredArea.toLocaleString()} sqft Covered Area</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Material Breakdown</h4>
                <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{inputs.floorFinish} Selected</span>
              </div>
              <div className="space-y-8">
                {analysis.materialBreakdown.map(item => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{item.type}</span>
                        <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-700 block">Rs. {(item.cost / 1000000).toFixed(2)}M</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.percent.toFixed(0)}% of Core Material</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} transition-all duration-1000 ease-out`} 
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!visuals.elevation ? (
              <button 
                onClick={handleGenerateVisuals} 
                disabled={isGeneratingVisuals} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl group"
              >
                {isGeneratingVisuals ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Generating Visuals</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:scale-110 transition-transform"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="m9 15 3-3 3 3"/><path d="M12 12v9"/></svg> Generate Design Visuals</>}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Visual Refinement Studio */}
      {visuals.elevation && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Design Studio</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">AI REFINEMENT</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Visual Preview */}
            <div className="lg:col-span-8 space-y-6">
              <div className="relative group rounded-[40px] overflow-hidden border-8 border-slate-50 shadow-inner aspect-video bg-slate-100">
                {isUpdatingStyle && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-xl z-20 flex flex-col items-center justify-center text-slate-800">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
                    <span className="text-xs font-black uppercase tracking-widest animate-pulse">Re-imagining Palette...</span>
                  </div>
                )}
                <img src={visuals.elevation} alt="House Elevation" className="w-full h-full object-cover" />
                
                {/* Overlay Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    Exterior Elevation
                  </div>
                  <div className="bg-white/90 backdrop-blur-md text-slate-800 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    {selectedStyle.label} • {selectedLight.label}
                  </div>
                </div>
              </div>

              {/* Layout Blueprint */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group rounded-3xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-50">
                  <img src={visuals.blueprint || ''} alt="Blueprint" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 text-white text-[10px] font-black uppercase tracking-widest">Architectural Floor Plan</div>
                </div>
                
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 flex flex-col justify-center">
                  <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Design Consultant AI
                  </h4>
                  <p className="text-sm text-emerald-700/80 leading-relaxed font-medium italic">
                    "I've optimized this {inputs.area} {inputs.unitType} plan for {inputs.city}. 
                    {inputs.floorFinish === 'Marble' || inputs.floorFinish === 'Granite' ? " Natural stone finishes require specific load-bearing considerations for the Ground Floor slab." : " Modern tile patterns are aligned to maximize space perception."} 
                    Light-wells are positioned to comply with LDA/CDA ventilation codes."
                  </p>
                </div>
              </div>
            </div>

            {/* Studio Controls */}
            <div className="lg:col-span-4 space-y-8">
              {/* Style Palette Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Architectural Style
                    <span className="text-[9px] bg-slate-50 px-2 py-1 rounded text-slate-400">PICK ONE</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {ARCH_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => handleRefineVisual(style)}
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all group ${
                          selectedStyle.id === style.id ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${style.color} border border-black/5 shadow-inner transition-transform group-hover:scale-110`}></div>
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{style.label}</span>
                        </div>
                        {selectedStyle.id === style.id && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Color Palette & Lighting
                    <span className="text-[9px] bg-slate-50 px-2 py-1 rounded text-slate-400">AMBIENCE</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {LIGHTING_MODES.map(light => (
                      <button
                        key={light.id}
                        onClick={() => handleRefineVisual(undefined, light)}
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all group ${
                          selectedLight.id === light.id ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${selectedLight.id === light.id ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {light.icon}
                          </div>
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{light.label}</span>
                        </div>
                        {selectedLight.id === light.id && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => handleRefineVisual()}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    Regenerate Current Combo
                  </button>
                </div>
              </div>

              {/* Download Option */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                 <p className="text-[10px] text-slate-400 font-black uppercase text-center">Export Design Package</p>
                 <div className="flex gap-2">
                   <button className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-[9px] font-black uppercase hover:bg-slate-100 transition-colors">Download Elevation</button>
                   <button className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-[9px] font-black uppercase hover:bg-slate-100 transition-colors">PDF Estimations</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Context Footer */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex gap-4 items-start">
         <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white shrink-0 mt-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
         <div className="space-y-1">
            <h4 className="font-black text-slate-900 text-sm uppercase">City-Aware Analysis</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">Estimates are adjusted for <span className="font-bold">{inputs.city}</span> market conditions. <span className="font-bold">{inputs.floorFinish}</span> requires specific logistics: {inputs.floorFinish === 'Marble' || inputs.floorFinish === 'Granite' ? "High labor and grinding water waste management." : inputs.floorFinish === 'Wooden' ? "Sub-floor moisture protection and specialized carpentry." : inputs.floorFinish === 'Concrete' ? "Efficient casting with standard grey structure teams." : "Standard tile wastage calculation (8-10%) applied."}</p>
         </div>
      </div>
    </div>
  );
};

export default CostCalculator;
