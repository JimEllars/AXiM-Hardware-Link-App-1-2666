import React from 'react';

export function SpatialMapOverlay() {
  return (
    <div className="cyber-panel p-4 w-64 h-64 pointer-events-auto relative overflow-hidden flex flex-col">
      <h3 className="text-cyan-400 font-bold tracking-widest mb-2 uppercase text-xs border-b border-cyan-500/30 pb-1 z-10">
        SPATIAL_TRACKING
      </h3>
      
      {/* Simulated Radar Map */}
      <div className="flex-1 relative flex items-center justify-center mt-2 border border-cyan-500/20 rounded-full bg-cyan-950/20 overflow-hidden">
        
        {/* Radar Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,rgba(6,182,212,0.1)_21%,transparent_22%,transparent_40%,rgba(6,182,212,0.1)_41%,transparent_42%,transparent_60%,rgba(6,182,212,0.1)_61%,transparent_62%,transparent_80%,rgba(6,182,212,0.2)_81%,transparent_82%)]"></div>
        
        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-cyan-500/30"></div>
        <div className="absolute h-full w-[1px] bg-cyan-500/30"></div>

        {/* Radar Sweep */}
        <div className="absolute inset-0 radar-sweep rounded-full origin-center"></div>

        {/* Hardware Blip */}
        <div className="absolute top-[30%] left-[60%] w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] z-10">
          <div className="absolute -inset-2 border border-rose-500 rounded-full animate-ping opacity-50"></div>
        </div>
        
        {/* Path Trail */}
        <svg className="absolute inset-0 w-full h-full z-0 opacity-50" viewBox="0 0 100 100">
          <polyline 
            points="20,80 35,70 50,75 55,50 60,30" 
            fill="none" 
            stroke="#06b6d4" 
            strokeWidth="1" 
            strokeDasharray="2,2" 
          />
        </svg>

      </div>
      
      <div className="mt-2 text-[10px] text-gray-400 flex justify-between z-10">
        <span>LAT: 34.0522° N</span>
        <span>LNG: 118.2437° W</span>
      </div>
    </div>
  );
}