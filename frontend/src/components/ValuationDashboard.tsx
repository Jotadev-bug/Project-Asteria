"use client";

import { useState } from "react";
import { predictValuation, PredictionRequest, PredictionResponse } from "@/services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  selectedAsteroid?: PredictionRequest | null;
  onClose: () => void;
}

export default function ValuationDashboard({ selectedAsteroid, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictionResponse | null>(null);

  const targetToPredict: PredictionRequest = selectedAsteroid || {
    diameter_km: 1.5, H: 14.2, albedo: 0.15, e: 0.22, a: 2.5, q: 1.9, i: 5.1
  };

  const handlePredict = async () => {
    setLoading(true);
    // Simulate complex calculation time for loading aesthetics
    await new Promise(r => setTimeout(r, 1500));
    try {
      const res = await predictValuation(targetToPredict);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = data ? Object.keys(data.materials_breakdown).map(mat => ({
    name: mat.replace("_", " ").toUpperCase(),
    value: data.materials_breakdown[mat].estimated_value_usd
  })) : [];

  return (
    <div className="glass-panel w-[90vw] h-[90vh] flex flex-col text-white relative shadow-[0_0_80px_rgba(0,0,0,1)] z-50 animate-in fade-in zoom-in-95 duration-500 rounded-[2rem] overflow-hidden">
      {/* Header Area */}
      <div className="flex justify-between items-center p-8 border-b border-white/5 bg-black/40 shrink-0">
        <h2 className="text-3xl font-light tracking-[0.3em] text-white">
          ASTEROID <span className="font-bold text-gray-500">PROTOCOL</span>
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 flex items-center justify-center transition font-bold text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Side: Telemetry & Trigger */}
        <div className="w-full md:w-1/3 p-8 md:p-12 border-r border-white/5 flex flex-col gap-10 bg-black/20 overflow-y-auto custom-scrollbar">
          <div>
            <div className="text-xs text-gray-600 tracking-[0.2em] uppercase mb-6 font-bold">Target Telemetry</div>
            <div className="space-y-5 font-mono text-sm">
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">DIAMETER</span> <span className="text-gray-200">{(targetToPredict?.diameter_km || 0).toFixed(2)} km</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">MAGNITUDE (H)</span> <span className="text-gray-200">{(targetToPredict?.H || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">ALBEDO</span> <span className="text-gray-200">{(targetToPredict?.albedo || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">ECCENTRICITY</span> <span className="text-gray-200">{(targetToPredict?.e || 0).toFixed(3)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">SEMI-MAJOR AXIS</span> <span className="text-gray-200">{(targetToPredict?.a || 0).toFixed(2)} AU</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">PERIHELION (Q)</span> <span className="text-gray-200">{(targetToPredict?.q || 0).toFixed(2)} AU</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-3">
                <span className="text-gray-500">INCLINATION</span> <span className="text-gray-200">{(targetToPredict?.i || 0).toFixed(2)}°</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handlePredict} 
            className="w-full py-5 mt-auto text-center border border-white/20 hover:border-white transition-all tracking-[0.3em] font-light bg-white/5 hover:bg-white/10 uppercase rounded-xl" 
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Initiate Valuation"}
          </button>
        </div>

        {/* Right Side: Data Visualization */}
        <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col overflow-y-auto bg-black/60 relative custom-scrollbar">
          {!data && !loading && (
            <div className="flex-1 flex items-center justify-center text-gray-700 font-mono text-xs tracking-[0.3em]">
              AWAITING VALUATION TRIGGER
            </div>
          )}
          {loading && (
             <div className="flex-1 flex items-center justify-center flex-col gap-6">
                <div className="w-64 h-1 bg-gray-900 overflow-hidden">
                  <div className="h-full bg-white w-full animate-loader"></div>
                </div>
                <div className="text-gray-500 font-mono text-[10px] tracking-[0.3em] animate-pulse">EXTRACTING SPECTROSCOPIC DATA</div>
             </div>
          )}
          {data && !loading && (
            <div className="flex flex-col h-full animate-in fade-in duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                 <div className="sub-panel p-8 rounded-3xl">
                    <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mb-4">Class Prediction</div>
                    <div className="text-6xl font-extralight text-white tracking-widest">TYPE {data.predicted_class}</div>
                 </div>
                 <div className="sub-panel p-8 rounded-3xl">
                    <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mb-4">Estimated Mass</div>
                    <div className="text-4xl font-mono text-gray-300 font-light">{data.total_mass_kg.toExponential(2)} <span className="text-lg text-gray-500">kg</span></div>
                 </div>
               </div>

               <div className="sub-panel p-8 lg:p-10 rounded-3xl flex-1 flex flex-col min-h-[400px]">
                  <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mb-4">Market Valuation Estimate</div>
                  <div className="text-5xl lg:text-7xl font-mono text-white mb-10 font-light tracking-tighter">
                    ${data.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  
                  <div className="flex-1 w-full relative">
                    <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#333" tick={{ fill: '#666', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Valuation"]}
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid #222', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="value" fill="#eeeeee" radius={[8, 8, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
