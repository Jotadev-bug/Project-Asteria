"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import ValuationDashboard from "@/components/ValuationDashboard";
import { fetchUpcomingNEOs } from "@/services/api";

const AsteroidCanvas = dynamic(() => import("@/components/AsteroidCanvas"), { ssr: false });

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [asteroids, setAsteroids] = useState<any[]>([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState<any | null>(null);
  const [isValuationOpen, setIsValuationOpen] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;
    
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
        const resp = await fetchUpcomingNEOs(today, nextWeek);
        
        if (resp && resp.data) {
           const mapped = resp.data.map((row: any) => ({
             des: row.des,
             a: row.a || (Math.random() * 4 + 0.5), 
             e: row.e || 0.0,
             i: row.i || 0.0,
             om: row.om || 0.0,
             w: row.w || 0.0,
             ma: row.ma || 0.0,
             epoch: row.epoch || 0,
             diameter: parseFloat(row.diameter || String(Math.random() * 1.5 + 0.1)),
             diameter_km: parseFloat(row.diameter || String(Math.random() * 1.5 + 0.1)),
             H: row.h ? parseFloat(row.h) : 13.0 + Math.random() * 8, 
             albedo: Math.random() * 0.3 + 0.05,
             q: row.q ? parseFloat(row.q) : Math.random() * 2 + 0.3,
           }));
           setAsteroids(mapped);
        }
      } catch (e) {
        console.error("Failed to fetch NEOs", e);
      }
    };
    
    fetchData();
  }, [hasStarted]);

  const handleSelectAsteroid = (ast: any) => {
    setSelectedAsteroid(ast);
    setIsValuationOpen(true);
  };

  if (!hasStarted) {
    return (
      <main className="w-screen h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
        <h1 className="text-sm tracking-[0.5em] text-gray-500 mb-8 uppercase">Project Asteria</h1>
        <div className="text-4xl md:text-6xl font-extralight tracking-widest mb-16 px-4 text-center">
          TERMINAL <span className="font-bold">OFFLINE</span>
        </div>
        <button 
          onClick={() => setHasStarted(true)}
          className="border border-white/20 hover:border-white/80 px-12 py-4 tracking-[0.2em] uppercase font-light text-sm transition-all hover:bg-white hover:text-black cursor-pointer"
        >
          Access Mainframe
        </button>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-black">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
           <div className="flex flex-col items-center gap-6">
             <div className="w-48 h-px bg-white/10 overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full w-full bg-white animate-loader"></div>
             </div>
             <p className="text-gray-500 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">Loading Spatial Textures</p>
           </div>
        </div>
      }>
        <AsteroidCanvas asteroids={asteroids} onSelect={handleSelectAsteroid} />
      </Suspense>
      
      {/* UI Overlay Layer */}
      <div className="absolute inset-0 pointer-events-none p-6 md:p-10 flex flex-col items-start gap-8 z-10">
        
        {/* Top Left Branding */}
        <div className="pointer-events-auto">
          <h1 className="text-2xl md:text-3xl font-light text-white tracking-[0.2em] uppercase drop-shadow-md">
            Project <span className="font-bold text-gray-400">Asteria</span>
          </h1>
          <p className="text-gray-500 font-mono tracking-[0.3em] text-[9px] mt-2 uppercase flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse inline-block"></span>
            Telemetry Active
          </p>
        </div>
        
        {/* Bottom Right Floating Action HUD */}
        {!isValuationOpen && (
          <div className="pointer-events-auto absolute bottom-8 right-8 md:bottom-12 md:right-12">
            <button 
              onClick={() => setIsValuationOpen(true)}
              className="glass-panel px-8 py-5 font-mono font-light text-xs tracking-[0.2em] text-white hover:bg-white hover:text-black border border-white/20 hover:border-white transition-all uppercase flex items-center gap-4 rounded-full cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></span>
              Enter Protocol
            </button>
          </div>
        )}
        
        {/* Full Screen Modal */}
        {isValuationOpen && (
          <div className="fixed inset-0 pointer-events-auto z-50 flex items-center justify-center p-4 md:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[12px] transition-opacity" onClick={() => setIsValuationOpen(false)} />
            <ValuationDashboard selectedAsteroid={selectedAsteroid} onClose={() => setIsValuationOpen(false)} />
          </div>
        )}
      </div>
    </main>
  );
}
