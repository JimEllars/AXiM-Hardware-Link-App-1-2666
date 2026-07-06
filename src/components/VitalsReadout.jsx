import React from 'react';

export function VitalsReadout({ battery, signal, ping }) {
  return (
    <div className="cyber-panel p-4 w-64 pointer-events-auto">
      <h3 className="text-cyan-400 font-bold tracking-widest mb-3 uppercase text-xs border-b border-cyan-500/30 pb-1 flex justify-between">
        <span>SYS_VITALS</span>
        <span className="text-gray-500 text-[10px]">AXiM_CORE</span>
      </h3>
      
      <div className="space-y-3 text-sm">
        {/* Battery */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-xs">PWR_CELL</span>
            <span className={battery < 20 ? 'text-rose-500 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'text-cyan-300'}>{battery}%</span>
          </div>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${battery < 20 ? 'bg-rose-500' : 'bg-cyan-400'}`} 
              style={{ width: `${battery}%` }}
            ></div>
          </div>
        </div>

        {/* Signal */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">UPLINK_SIG</span>
          <span className="text-cyan-300 font-mono">{signal} dBm</span>
        </div>

        {/* Latency */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">RTT_LATENCY</span>
          <span className={ping > 150 ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)] font-bold' : 'text-cyan-300 font-mono'}>{ping} ms</span>
        </div>
      </div>
    </div>
  );
}