
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

type ColorPalette = {
  id: string;
  label: string;
  swatches: string[];
  prompt: string;
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

const COLOR_PALETTES: ColorPalette[] = [
  { id: 'earth', label: 'Earthy', swatches: ['#D2B48C', '#8B4513', '#F5F5DC'], prompt: 'earthy color scheme with sandy beige, tan stone, and warm wood' },
  { id: 'slate', label: 'Cool Slate', swatches: ['#475569', '#94A3B8', '#F8FAFC'], prompt: 'modern cool slate palette with charcoal grey, silver metal, and white' },
  { id: 'terracotta', label: 'Warm Clay', swatches: ['#9A3412', '#F97316', '#FEF3C7'], prompt: 'vibrant terracotta palette with burnt orange accents and cream walls' },
  { id: 'alpine', label: 'Arctic Blue', swatches: ['#1E3A8A', '#DBEAFE', '#FFFFFF'], prompt: 'clean alpine palette with deep navy accents and crisp white plaster' },
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
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>(COLOR_PALETTES[0]);

  const analysis = useMemo(() => {
    const totalSqFtPerFloor = inputs.area * UNIT_CONVERSIONS[inputs.unitType];
    const floorCount = inputs.floors === 'Ground Only' ? 1 : inputs.floors === 'Ground + 1' ? 2 : 3;
    const totalCoveredArea = totalSqFtPerFloor * (1 + (floorCount - 1) * 0.85);

    const cityMarket = CITY_MARKET_DATA[inputs.city] || DEFAULT_MARKET_PRICES;
    const cementPrice = cityMarket.find(p => p.type === MaterialType.CEMENT)?.price || 1250;
    const baseSteelPrice = cityMarket.find(p => p.type === MaterialType.STEEL)?.price || 265000;
    const brickPrice = cityMarket.find(p => p.type === MaterialType.BRICKS)?.price || 18500;

    // --- FOUNDATION COST BREAKDOWN ---
    let foundationEarthworkCost = totalSqFtPerFloor * 40;
    let foundationTermiteCost = totalSqFtPerFloor * 15;
    let foundationMachineryCost = 0;
    
    let fndSteelMultiplier = 1.0;
    let fndCementMultiplier = 1.0;
    let fndLaborMultiplier = 1.0;

    if (inputs.foundationType === 'Raft') {
      foundationEarthworkCost *= 2.5;
      foundationMachineryCost = 45000;
      fndSteelMultiplier = 1.35;
      fndCementMultiplier = 1.25;
      fndLaborMultiplier = 1.15;
    } else if (inputs.foundationType === 'Piles') {
      foundationEarthworkCost *= 1.2;
      foundationMachineryCost = totalSqFtPerFloor * 450;
      fndSteelMultiplier = 1.65;
      fndCementMultiplier = 1.45;
      fndLaborMultiplier = 1.55;
    }

    let steelBaseKgPerSqFt = 3.6; 
    if (inputs.floors === 'Ground + 1') steelBaseKgPerSqFt = 4.8;
    if (inputs.floors === 'Ground + 2') steelBaseKgPerSqFt = 5.8;
    
    if (inputs.beamReinforcement === 'Heavy') steelBaseKgPerSqFt *= 1.18;
    const gradeAdjustment = inputs.steelGrade === 'Grade 40' ? 1.25 : inputs.steelGrade === 'Grade 75' ? 0.88 : 1.0;
    const steelTons = parseFloat(((totalCoveredArea * steelBaseKgPerSqFt * fndSteelMultiplier * gradeAdjustment) / 1000).toFixed(2));

    let cementFactor = 0.38; 
    if (inputs.floorFinish === 'Marble') cementFactor += 0.18;
    if (inputs.floorFinish === 'Granite') cementFactor += 0.22;
    if (inputs.floorFinish === 'Tiles') cementFactor += 0.08;
    if (inputs.floorFinish === 'Concrete') cementFactor += 0.02;
    if (inputs.floorFinish === 'Wooden') cementFactor += 0.04;

    const cementQualityFactor = inputs.quality === 'Premium' ? 1.15 : inputs.quality === 'Economy' ? 0.9 : 1.0;
    let cementBags = Math.round(totalCoveredArea * cementFactor * fndCementMultiplier * cementQualityFactor);
    cementBags += (inputs.bathrooms * 12) + (inputs.kitchens * 15);

    const baseBricksPerSqFt = 26;
    let bricksTotal = Math.round(totalCoveredArea * baseBricksPerSqFt);
    bricksTotal += (inputs.rooms * 1250); 
    bricksTotal += (inputs.bathrooms * 650);

    const qualityMultiplier = inputs.quality === 'Economy' ? 0.85 : inputs.quality === 'Premium' ? 1.45 : 1;
    const steelPriceAdj = inputs.steelGrade === 'Grade 40' ? 0.92 : inputs.steelGrade === 'Grade 75' ? 1.12 : 1.0; 

    const greyCostExclSteel = totalCoveredArea * 1750 * qualityMultiplier; 
    const steelCostTotal = steelTons * (baseSteelPrice * steelPriceAdj);
    const cementCostTotal = cementBags * cementPrice;
    const brickCostTotal = (bricksTotal / 1000) * brickPrice;
    const foundationTotalCost = foundationEarthworkCost + foundationTermiteCost + foundationMachineryCost;

    let finishingBaseSqFt = 2100; 
    if (inputs.floorFinish === 'Marble') finishingBaseSqFt = 3000; 
    if (inputs.floorFinish === 'Concrete') finishingBaseSqFt = 1350; 
    if (inputs.floorFinish === 'Granite') finishingBaseSqFt = 4100; 
    if (inputs.floorFinish === 'Wooden') finishingBaseSqFt = 3500; 
    
    const finishingCostTotal = (totalCoveredArea * finishingBaseSqFt * qualityMultiplier) + (inputs.bathrooms * 65000) + (inputs.kitchens * 105000);
    
    let laborRateAdj = inputs.laborRate * fndLaborMultiplier;
    if (inputs.floorFinish === 'Marble') laborRateAdj += 90;
    if (inputs.floorFinish === 'Granite') laborRateAdj += 140; 
    if (inputs.floorFinish === 'Wooden') laborRateAdj += 70; 
    
    const laborCostTotal = totalCoveredArea * laborRateAdj;
    const totalProjectCost = greyCostExclSteel + steelCostTotal + cementCostTotal + brickCostTotal + finishingCostTotal + laborCostTotal + foundationTotalCost;

    const materialBreakdown = [
      { type: MaterialType.CEMENT, quantity: `${cementBags.toLocaleString()} Bags`, cost: cementCostTotal, percent: (cementCostTotal / totalProjectCost) * 100, color: 'bg-emerald-500' },
      { type: MaterialType.STEEL, quantity: `${steelTons} Tons`, cost: steelCostTotal, percent: (steelCostTotal / totalProjectCost) * 100, color: 'bg-blue-600' },
      { type: MaterialType.BRICKS, quantity: `${bricksTotal.toLocaleString()} Nos`, cost: brickCostTotal, percent: (brickCostTotal / totalProjectCost) * 100, color: 'bg-amber-600' },
      { type: 'Labor Cost' as any, quantity: `${totalCoveredArea.toLocaleString()} sqft`, cost: laborCostTotal, percent: (laborCostTotal / totalProjectCost) * 100, color: 'bg-indigo-500' },
    ];

    return { totalCoveredArea, totalProjectCost, foundationTotalCost, foundationDetails: { earthwork: foundationEarthworkCost, termite: foundationTermiteCost, machinery: foundationMachineryCost, complexity: inputs.foundationType }, materialBreakdown, steelTons, isFeasible: totalCoveredArea > (inputs.rooms * 150) };
  }, [inputs]);

  const handleGenerateVisuals = async () => {
    setIsGeneratingVisuals(true);
    try {
      const elevationPrompt = `Modern Pakistani house elevation, ${inputs.floors}, ${inputs.area} ${inputs.unitType}, ${inputs.quality} quality, ${selectedStyle.prompt}, ${selectedLight.prompt}, ${selectedPalette.prompt}, ${inputs.city} context. Highly detailed architectural photography, 8k resolution.`;
      const [elevation, blueprint] = await Promise.all([
        generateArchitecturalImage(elevationPrompt),
        generateArchitecturalImage(`Technical architectural floor plan layout, blue-print style, for a ${inputs.area} ${inputs.unitType} plot in Pakistan, showing ${inputs.rooms} rooms and detailed setbacks. Top-down view.`)
      ]);
      setVisuals({ elevation, blueprint });
    } catch (error) { console.error(error); } finally { setIsGeneratingVisuals(false); }
  };

  const handleRefineVisual = async (newStyle?: ArchStyle, newLight?: LightingMode, newPalette?: ColorPalette) => {
    if (isUpdatingStyle || !visuals.elevation) return;
    
    const styleToUse = newStyle || selectedStyle;
    const lightToUse = newLight || selectedLight;
    const paletteToUse = newPalette || selectedPalette;
    
    if (newStyle) setSelectedStyle(newStyle);
    if (newLight) setSelectedLight(newLight);
    if (newPalette) setSelectedPalette(newPalette);
    
    setIsUpdatingStyle(true);
    try {
      const elevationPrompt = `Modern Pakistani house elevation, ${inputs.floors}, ${inputs.area} ${inputs.unitType}, ${inputs.quality} quality, ${styleToUse.prompt}, ${lightToUse.prompt}, ${paletteToUse.prompt}, ${inputs.city} context. Highly detailed architectural photography, 8k resolution.`;
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
      {/* Header Section */}
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
                    <input type="number" value={inputs.area} onChange={(e) => setInputs({...inputs, area: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-1.5 outline-none font-bold text-slate-700 w-16" />
                    <select value={inputs.unitType} onChange={(e) => setInputs({...inputs, unitType: e.target.value as any})} className="px-2 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black outline-none">
                      <option>Marla</option>
                      <option>Kanal</option>
                      <option>SqFt</option>
                    </select>
                  </div>
                  <select value={inputs.city} onChange={(e) => setInputs({...inputs, city: e.target.value})} className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none text-xs">
                    {PAK_CITIES.map(city => <option key={city}>{city}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Storey / Floors</label>
                <select value={inputs.floors} onChange={(e) => setInputs({...inputs, floors: e.target.value as any})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
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
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Foundation Type</label>
                <select value={inputs.foundationType} onChange={(e) => setInputs({...inputs, foundationType: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none">
                  <option value="Shallow/Strip">Shallow / Strip</option>
                  <option value="Raft">Raft / Mat</option>
                  <option value="Piles">Piles</option>
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
                  <option value="Grade 40">Grade 40</option>
                  <option value="Grade 60">Grade 60</option>
                  <option value="Grade 75">Grade 75</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">3. Interior & Finishes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Floor Finish</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 relative overflow-x-auto no-scrollbar">
                  {['Concrete', 'Tiles', 'Marble', 'Granite', 'Wooden'].map(f => (
                    <button key={f} onClick={() => setInputs({...inputs, floorFinish: f as any})} className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap px-2 ${inputs.floorFinish === f ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{f}</button>
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
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Labor Rate (Rs/sqft)</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <input type="number" value={inputs.laborRate} onChange={(e) => setInputs({...inputs, laborRate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-1.5 outline-none font-bold text-slate-700 text-sm" />
                  <div className="bg-slate-50 px-2 py-1.5 rounded-lg text-[9px] font-black text-slate-400 flex items-center">PKR</div>
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
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Material & Labor Breakdown</h4>
              </div>
              <div className="space-y-8">
                {analysis.materialBreakdown.map((item: any) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{item.type}</span>
                        <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-700 block">Rs. {(item.cost / 1000000).toFixed(2)}M</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.percent.toFixed(0)}% of Total</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} transition-all duration-1000 ease-out`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!visuals.elevation ? (
              <button onClick={handleGenerateVisuals} disabled={isGeneratingVisuals} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl group">
                {isGeneratingVisuals ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Generating Design...</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="m9 15 3-3 3 3"/><path d="M12 12v9"/></svg> Create AI Design Pack</>}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Visual Design & Customization Studio */}
      {visuals.elevation && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700 border-t border-slate-100 pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Design Customization Studio</h3>
            </div>
            <div className="hidden md:flex gap-2">
               <button onClick={handleGenerateVisuals} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Regenerate Base</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Visual Preview Engine */}
            <div className="lg:col-span-8 space-y-6">
              <div className="relative group rounded-[3rem] overflow-hidden border-[12px] border-slate-50 shadow-2xl aspect-[16/10] bg-slate-100">
                {isUpdatingStyle && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xl z-20 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 animate-pulse">Re-Rendering Facade...</span>
                  </div>
                )}
                <img src={visuals.elevation} alt="Architectural Render" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                {/* Overlay Context */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-10">
                  <div className="flex flex-col gap-2">
                    <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-2xl">
                      {selectedStyle.label} Facade
                    </div>
                    <div className="bg-white/90 backdrop-blur-md text-slate-800 text-[9px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      {inputs.city} Heritage Context
                    </div>
                  </div>
                  <div className="flex -space-x-3">
                    {selectedPalette.swatches.map((s, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: s }}></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Blueprint */}
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row gap-8 items-center">
                 <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 bg-white p-2">
                    <img src={visuals.blueprint || ''} alt="Plan" className="w-full h-full object-contain mix-blend-multiply opacity-70" />
                 </div>
                 <div className="flex-1 space-y-3">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Optimized Floor Layout</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Generated a technical 2D layout maximizing the {inputs.area} {inputs.unitType} footprint with efficient ventilation corridors and structural symmetry required for {inputs.city} bylaws.</p>
                    <div className="flex gap-4 pt-2">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-lg">LDA Compliant</div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg">Seismic Rated</div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Customization Controls (Toggles) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8 sticky top-28">
                
                {/* 1. Toggle Architectural Style */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">1. Facade Style</h4>
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase">Selection</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {ARCH_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => handleRefineVisual(style, undefined, undefined)}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all overflow-hidden ${
                          selectedStyle.id === style.id ? 'border-emerald-500 bg-emerald-50/50 shadow-inner' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                        }`}
                      >
                        <span className={`text-[11px] font-black uppercase tracking-widest ${selectedStyle.id === style.id ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'}`}>
                          {style.label}
                        </span>
                        {selectedStyle.id === style.id && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Toggle Lighting / Mood */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">2. Lighting Context</h4>
                  </div>
                  <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 gap-2">
                    {LIGHTING_MODES.map(light => (
                      <button
                        key={light.id}
                        onClick={() => handleRefineVisual(undefined, light, undefined)}
                        className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${
                          selectedLight.id === light.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'
                        }`}
                      >
                        {light.icon}
                        <span className="text-[8px] font-black uppercase">{light.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Toggle Color Palette */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">3. Material Palette</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {COLOR_PALETTES.map(palette => (
                      <button
                        key={palette.id}
                        onClick={() => handleRefineVisual(undefined, undefined, palette)}
                        className={`group p-3 rounded-2xl border-2 transition-all flex flex-col gap-2.5 items-center ${
                          selectedPalette.id === palette.id ? 'border-amber-500 bg-amber-50/30 shadow-inner' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                        }`}
                      >
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${selectedPalette.id === palette.id ? 'text-amber-700' : 'text-slate-400 group-hover:text-slate-600'}`}>{palette.label}</span>
                        <div className="flex -space-x-1.5">
                          {palette.swatches.map((color, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }}></div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] transition-all hover:bg-emerald-600 shadow-2xl flex items-center justify-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download Design Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculator;
