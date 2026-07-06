import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getRows } from '../lib/googleSheets';
import { format } from 'date-fns';

export function GlobalAuditLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchAllLogs = async () => {
      const [telemetry, commands, incidents] = await Promise.all([
        getRows('TelemetryStream!A2:H'),
        getRows('CommandQueue!A2:F'),
        getRows('IncidentReports!A2:F')
      ]);

      const combined = [
        ...telemetry.map(r => ({ id: r[0], type: 'TELEMETRY', msg: `Node ${r[1]} pulse: CPU ${r[5]}% TEMP ${r[6]}C`, ts: r[7], color: 'text-cyan-500' })),
        ...commands.map(r => ({ id: r[0], type: 'COMMAND', msg: `Node ${r[1]} executed: ${r[2]}`, ts: r[4], color: 'text-amber-500' })),
        ...incidents.map(r => ({ id: r[0], type: 'INCIDENT', msg: `[${r[3]}] ${r[4]}`, ts: r[5], color: 'text-rose-500' }))
      ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

      setLogs(combined.slice(0, 100));
    };
    fetchAllLogs();
  }, []);

  return (
    <div className="cyber-panel p-6 w-full max-w-4xl h-[600px] pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-4">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiActivity} className="mr-2" /> UNIFIED_EVENT_STREAM
        </h3>
        <div className="flex space-x-2">
          {['ALL', 'TELEMETRY', 'COMMAND', 'INCIDENT'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[8px] px-2 py-0.5 border ${filter === f ? 'bg-cyan-500 text-black' : 'border-cyan-800 text-cyan-800'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1">
        {logs.filter(l => filter === 'ALL' || l.type === filter).map(log => (
          <div key={log.id} className="flex space-x-4 border-b border-white/5 py-1 hover:bg-white/5 px-2">
             <span className="text-gray-600 w-32">{format(new Date(log.ts), 'yyyy-MM-dd HH:mm:ss')}</span>
             <span className={`w-20 font-bold ${log.color}`}>[{log.type}]</span>
             <span className="text-gray-300 flex-1">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}