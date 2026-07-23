
import { useState, useEffect } from 'react';
import { aximCoreClient } from '../lib/supabaseClient';

export function SpatialMapOverlay({ activeDeviceId, telemetry }) {
  const [activeAnomaly, setActiveAnomaly] = useState(null);

  useEffect(() => {
    // Check local telemetry for critical breaches
    if (telemetry) {
      if (telemetry.temp > 85) {
        setActiveAnomaly('CRITICAL_TEMP_' + telemetry.temp + 'C');
        return;
      }
      if (telemetry.cpuLoad > 90) {
        setActiveAnomaly('CRITICAL_CPU_' + telemetry.cpuLoad + '%');
        return;
      }
      if (telemetry.battery < 15) {
        setActiveAnomaly('CRITICAL_BATTERY_' + telemetry.battery + '%');
        return;
      }
    }
    setActiveAnomaly(null);
  }, [telemetry]);

  useEffect(() => {
    // Subscribe to ingress alerts or incidents for optical hazard flags
    if (!activeDeviceId) return;
    const channel = aximCoreClient.channel(`alerts:${activeDeviceId}`)
      .on('broadcast', { event: 'telemetry_ingress' }, (payload) => {
        if (payload?.payload?.alert_type === 'OPTICAL_DAMAGE_DETECTED') {
          setActiveAnomaly('OPTICAL_DAMAGE_DETECTED');
          // Auto-clear after 10 seconds for demo purposes
          setTimeout(() => setActiveAnomaly(null), 10000);
        }
      })
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, [activeDeviceId]);
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
        <div className="absolute top-[30%] left-[60%] z-10 group cursor-pointer">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] relative ${activeAnomaly ? 'bg-pink-500' : 'bg-cyan-500'}`}>
            {activeAnomaly && (
              <div className="absolute -inset-2 border border-pink-500 rounded-full animate-ping opacity-80 bg-pink-500"></div>
            )}
            {!activeAnomaly && (
              <div className="absolute -inset-2 border border-cyan-500 rounded-full animate-ping opacity-50"></div>
            )}

            {/* Tooltip */}
            {activeAnomaly && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-pink-950/90 border border-pink-500 text-pink-400 text-[9px] px-2 py-1 rounded">
                [HAZARD] {activeAnomaly}
              </div>
            )}
          </div>
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