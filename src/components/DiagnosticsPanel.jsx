import React, { useEffect, useState } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAximEcosystem } from '../hooks/useAximEcosystem';
import { dispatchTelemetryIngress } from '../services/hardwareService';
import { aximCoreClient } from '../lib/supabaseClient';

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

  const [auditAlerts, setAuditAlerts] = useState([]);

  useEffect(() => {
    const channel = aximCoreClient.channel('diagnostic-security-audits')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_audits' },
        (payload) => {
          setAuditAlerts(prev => {
            const updated = [payload.new, ...prev];
            return updated.slice(0, 3);
          });
        }
      )
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, []);

  const handleRunDiagnostics = async () => {
    // Simulate a diagnostic test result
    const testItem = { name: 'THERMAL_SENSOR_ARRAY', errorCode: 'ERR_THRM_042' };
    const status = 'FAILED';

    if (status === 'FAILED') {
      await dispatchTelemetryIngress(deviceId, {
        event: 'DIAGNOSTIC_FAILURE',
        component: testItem.name,
        diagnostic_code: testItem.errorCode,
        timestamp: new Date().toISOString()
      });
    }
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

      <div className="mt-4 pt-2 border-t border-cyan-500/10">
        <button onClick={handleRunDiagnostics} className="w-full bg-cyan-900/50 hover:bg-cyan-800/80 text-cyan-400 border border-cyan-700/50 px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-colors mb-2">
          RUN SELF-TEST
        </button>
        {auditAlerts.length > 0 && (
          <div className="space-y-1">
            {auditAlerts.map(alert => (
              <div key={alert.id} className="text-[9px] text-rose-400 font-mono animate-pulse bg-rose-900/20 px-1 py-0.5 rounded border border-rose-900/50">
                [{alert.action_type || 'ALERT'}] {alert.description || 'Audit logged'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
