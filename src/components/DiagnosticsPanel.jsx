import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAximEcosystem } from '../hooks/useAximEcosystem';

export function DiagnosticsPanel({ deviceId, telemetry }) {
  const ecosystem = useAximEcosystem(deviceId);
  const specs = {
    firmware: "v4.2.1-stable",
    uptime: "14d 02h 11m",
    kernel: "AXiM-RTOS 0.9.4",
    load: `${telemetry.cpuLoad.toFixed(1)}%`,
    core_temp: `${telemetry.temp.toFixed(1)}°C`,
    asguard_status: ecosystem.asguard.status
  };

  const getSubsystemStatus = (val, threshold) => val > threshold ? 'STRESSED' : 'NOMINAL';

  return (
    <div className="cyber-panel p-4 w-64 pointer-events-auto">
      <h3 className="text-cyan-400 font-bold tracking-widest mb-3 uppercase text-xs border-b border-cyan-500/30 pb-1 flex justify-between">
        <span>HW_DIAGNOSTICS</span>
        <SafeIcon icon={FiIcons.FiActivity} className="text-cyan-600" />
      </h3>
      
      <div className="space-y-2">
        {Object.entries(specs).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase tracking-tighter">{key}</span>
            <span className={`text-[11px] font-mono ${key === 'core_temp' && telemetry.temp > 80 ? 'text-rose-500' : 'text-cyan-200'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-2 border-t border-cyan-500/10">
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gray-500 uppercase">Thermal_State:</span>
          <span className={telemetry.temp > 80 ? 'text-rose-500 animate-pulse' : 'text-green-500'}>
            {getSubsystemStatus(telemetry.temp, 80)}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1,2,3,4,5].map(i => {
            const isActive = (telemetry.temp / 20) >= i;
            return (
              <div 
                key={i} 
                className={`flex-1 h-1 transition-colors duration-500 ${
                  isActive 
                    ? (telemetry.temp > 80 ? 'bg-rose-500' : 'bg-green-500') 
                    : 'bg-gray-800'
                }`}
              ></div>
            );
          })}
        </div>
      </div>
    </div>
  );
}