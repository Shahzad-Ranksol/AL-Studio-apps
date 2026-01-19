import React, { useState, useMemo } from 'react';
import { ConstructionInputs, MaterialType } from '../types';
import { PAK_CITIES, UNIT_CONVERSIONS, CURRENT_MARKET_PRICES } from '../constants';
import { generateArchitecturalImage } from '../services/geminiService';

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

  const analysis = useMemo(() => {
    const totalSqFtPerFloor = inputs.area * UNIT_CONVERSIONS[inputs.unitType];
    const floorCount = inputs.floors === 'Ground Only' ? 1 : inputs.floors === 'Ground + 1' ? 2 : 3;
    
    // Total covered area with typical porch/balcony projections
    const totalCoveredArea = totalSqFtPerFloor * (1 + (floorCount - 1) * 0.85);

    // --- Precise Material Quantity Calculations ---
    
    // 1. STEEL REBAR (Tons)
    // Basic structural requirements in Pakistan (kg per sqft of covered area)
    let steelBaseKg = 3.8; 
    if (inputs.floors === 'Ground + 1') steelBaseKg = 4.6;
    if (inputs.floors === 'Ground + 2') steelBaseKg = 5.4;
    
    // Adjustments for structural choices
    if (inputs.beamReinforcement === 'Heavy') steelBaseKg *= 1.18; // Seismic or heavy span reinforcement
    if (inputs.foundationType === 'Raft') steelBaseKg *= 1.30; // Continuous mat foundations use significantly more rebar
    if (inputs.foundationType === 'Piles') steelBaseKg *= 1.45; // Deep foundations
    
    // Grade 40 vs Grade 60: Grade 40 has lower yield strength, requiring ~22% more sectional area/mass
    const gradeAdjustment = inputs.steelGrade === 'Grade 40' ? 1.22 : 1.0;
    
    const steelTons = parseFloat(((totalCoveredArea * steelBaseKg * gradeAdjustment) / 1000).toFixed(2));

    // 2. CEMENT (Bags)
    // Structure (RCC) + Brickwork + Plastering
    let cementFactor = 0.42; // bags per sqft
    
    // Foundation impact
    if (inputs.foundationType === 'Raft') cementFactor += 0.08;
    if (inputs.foundationType === 'Piles') cementFactor += 0.12;
    
    // Finishing impact (Mortar beds)
    if (inputs.floorFinish === 'Tiles') cementFactor += 0.04;
    if (inputs.floorFinish === 'Marble') cementFactor += 0.07; // Marble requires thicker leveled slurry bed
    
    const wallPartitionImpact = 1 + (inputs.rooms * 0.03); // More rooms = more partition walls = more cement for plaster/mortar
    const cementBags = Math.round(totalCoveredArea * cementFactor * wallPartitionImpact);

    // 3. BRICKS (Nos)
    // Average 9" outer and 4.5" inner walls
    const bricksPerSqFt = 28;
    const totalBricks = Math.round(totalCoveredArea * bricksPerSqFt * wallPartitionImpact);

    // --- Costing Logic ---
    const qualityMultiplier = inputs.quality === 'Economy' ? 0.88 : inputs.quality === 'Premium' ? 1.45 : 1;
    
    const cementPrice = CURRENT_MARKET_PRICES.find(p => p.type === MaterialType.CEMENT)?.price || 1250;
    const baseSteelPrice = CURRENT_MARKET_PRICES.find(p => p.type === MaterialType.STEEL)?.price || 265000;
    const steelPriceAdj = inputs.steelGrade === 'Grade 40' ? 0.93 : 1.0; // G40 is usually slightly cheaper per ton
    const brickPrice = CURRENT_MARKET_PRICES.find(p => p.type === MaterialType.BRICKS)?.price || 18500;

    const greyCostExclSteel = totalCoveredArea * 1800 * qualityMultiplier; // Generic materials (Sand, Crush, Excavation)
    const steelCostTotal = steelTons * (baseSteelPrice * steelPriceAdj);
    const cementCostTotal = cementBags * cementPrice;
    const brickCostTotal = (totalBricks / 1000) * brickPrice;

    // Finishing Costs (Flooring, Paint, Woodwork, Electric, Plumbing)
    let finishingBaseSqFt = 2200;
    if (inputs.floorFinish === 'Marble') finishingBaseSqFt += 350;
    if (inputs.floorFinish === 'Concrete') finishingBaseSqFt -= 200;
    
    const finishingCostTotal = (totalCoveredArea * finishingBaseSqFt * qualityMultiplier) + (inputs.bathrooms * 60000) + (inputs.kitchens * 90000);
    const laborCostTotal = totalCoveredArea * inputs.laborRate;

    const totalProjectCost = greyCostExclSteel + steelCostTotal + cementCostTotal + brickCostTotal + finishingCostTotal + laborCostTotal;

    const materialBreakdown = [
      { type: MaterialType.CEMENT, quantity: `${cementBags.toLocaleString()} Bags`, cost: cementCostTotal },
      { type: MaterialType.STEEL, quantity: `${steelTons} Tons`, cost: steelCostTotal },
      { type: MaterialType.BRICKS, quantity: `${totalBricks.toLocaleString()} Nos`, cost: brickCostTotal },
    ];

    return {
      totalCoveredArea,
      totalProjectCost,
      materialBreakdown,
      cementBags,
      steelTons,
      totalBricks,
      isFeasible: totalCoveredArea > (inputs.rooms * 150), // Simple feasibility check
    };
  }, [inputs]);

  const handleGenerateVisuals = async () => {
    setIsGeneratingVisuals(true);
    try {
      const elevationPrompt = `Modern Pakistani house elevation, ${inputs.floors}, ${inputs.area} ${inputs.unitType}, ${inputs.quality} style, front view, architectural lighting.`;
      const blueprintPrompt = `Architectural floor plan, technical 2D layout, for ${inputs.area} ${inputs.unitType} plot, ${inputs.rooms} bedrooms, precise drafting style.`;

      const [elevation, blueprint] = await Promise.all([
        generateArchitecturalImage(elevationPrompt),
        generateArchitecturalImage(blueprintPrompt)
      ]);

      setVisuals({ elevation, blueprint });
    } catch (error) {
      console.error("Error generating visuals:", error);
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 text-slate-900 border border-slate-100 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            Precision Estimator
          </h2>
          <p className="text-slate-400 font-medium mt-1">Refined quantities based on structural & finishing specs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Enhanced Inputs */}
        <div className="lg:col-span-7 space-y-8">
          {/* Plot & Structure */}
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
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Ground Only</option>
                  <option>Ground + 1</option>
                  <option>Ground + 2</option>
                </select>
              </div>
            </div>
          </section>

          {/* Structural Requirements */}
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">2. Structural Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Foundation</label>
                <select 
                  value={inputs.foundationType}
                  onChange={(e) => setInputs({...inputs, foundationType: e.target.value as any})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none"
                >
                  <option value="Shallow/Strip">Shallow / Strip</option>
                  <option value="Raft">Raft (RCC Mat)</option>
                  <option value="Piles">Piles (Deep)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Beam Style</label>
                <select 
                  value={inputs.beamReinforcement}
                  onChange={(e) => setInputs({...inputs, beamReinforcement: e.target.value as any})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none"
                >
                  <option value="Standard">Standard Beams</option>
                  <option value="Heavy">Heavy Reinforcement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Steel Rebar</label>
                <select 
                  value={inputs.steelGrade}
                  onChange={(e) => setInputs({...inputs, steelGrade: e.target.value as any})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none"
                >
                  <option value="Grade 40">Grade 40 (Legacy)</option>
                  <option value="Grade 60">Grade 60 (Standard)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Layout & Finishes */}
          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">3. Interior & Finishes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Rooms', key: 'rooms' },
                { label: 'Baths', key: 'bathrooms' },
                { label: 'Kitchens', key: 'kitchens' },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">{item.label}</label>
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <button 
                      onClick={() => setInputs({...inputs, [item.key]: Math.max(0, (inputs as any)[item.key] - 1)})}
                      className="px-2 py-1.5 hover:bg-slate-100 text-slate-400 font-bold"
                    >-</button>
                    <div className="flex-1 text-center font-bold text-slate-700 text-sm">{(inputs as any)[item.key]}</div>
                    <button 
                      onClick={() => setInputs({...inputs, [item.key]: (inputs as any)[item.key] + 1})}
                      className="px-2 py-1.5 hover:bg-slate-100 text-slate-400 font-bold"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Floor Finish</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  {['Concrete', 'Tiles', 'Marble'].map(f => (
                    <button
                      key={f}
                      onClick={() => setInputs({...inputs, floorFinish: f as any})}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        inputs.floorFinish === f ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
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
                    <button
                      key={q}
                      onClick={() => setInputs({...inputs, quality: q as any})}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        inputs.quality === q ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Results Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>
              </div>
              
              <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2">Total Project Estimate</p>
              <div className="text-5xl font-black mb-1">
                Rs. {(analysis.totalProjectCost / 1000000).toFixed(2)}<span className="text-emerald-500 italic">M</span>
              </div>
              <p className="text-slate-400 text-sm font-medium">Approx. {analysis.totalCoveredArea.toLocaleString()} sqft Covered Area</p>

              <div className="mt-8 space-y-3 pt-8 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Grey Structure</span>
                  <span className="font-black">~65% of budget</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Finishing Grade</span>
                  <span className="font-black text-emerald-400">{inputs.quality}</span>
                </div>
              </div>
            </div>

            {/* Precision Quantities */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-lg">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Precise Material Breakdown</h4>
              <div className="space-y-6">
                {analysis.materialBreakdown.map(item => (
                  <div key={item.type} className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{item.type}</span>
                      <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-700">Rs. {(item.cost / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateVisuals}
              disabled={isGeneratingVisuals}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-slate-200"
            >
              {isGeneratingVisuals ? (
                 <><span className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></span> Generating Visuals</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="m9 15 3-3 3 3"/><path d="M12 12v9"/></svg> Generate Design Visuals</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Visuals Display */}
      {(visuals.elevation || visuals.blueprint) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
           <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Architectural Elevation</h4>
              <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                 {visuals.elevation ? (
                   <img src={visuals.elevation} alt="Elevation" className="w-full h-full object-cover" />
                 ) : <div className="w-full h-full flex items-center justify-center text-slate-300">No image</div>}
              </div>
           </div>
           <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Conceptual Floor Plan</h4>
              <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                 {visuals.blueprint ? (
                   <img src={visuals.blueprint} alt="Blueprint" className="w-full h-full object-cover" />
                 ) : <div className="w-full h-full flex items-center justify-center text-slate-300">No image</div>}
              </div>
           </div>
        </section>
      )}

      {/* Engineering Footer Note */}
      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex gap-4 items-start">
         <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0 mt-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
         </div>
         <div className="space-y-1">
            <h4 className="font-black text-emerald-900 text-sm uppercase">Technical Analysis Summary</h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Based on your selection of <span className="font-bold">{inputs.foundationType}</span> foundation and <span className="font-bold">{inputs.beamReinforcement}</span> beams, the structure uses approximately <span className="font-bold">{analysis.steelTons} Tons</span> of <span className="font-bold">{inputs.steelGrade}</span> rebar. Cement calculation includes leveling mortar for <span className="font-bold">{inputs.floorFinish}</span> finish. This estimate follows ACI-318 and local Pakistani engineering norms (LDA/SBCA).
            </p>
         </div>
      </div>
    </div>
  );
};

export default CostCalculator;