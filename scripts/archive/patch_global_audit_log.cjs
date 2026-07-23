const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { aximCoreClient } from '../lib/supabaseClient';

export function GlobalAuditLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const [
          { data: telemetryData },
          { data: commandData },
          { data: incidentData }
        ] = await Promise.all([
          aximCoreClient.from('telemetry_stream').select('id, device_id, cpu, temp, created_at').order('created_at', { ascending: false }).limit(50),
          aximCoreClient.from('command_queue').select('id, device_id, command, updated_at').order('updated_at', { ascending: false }).limit(50),
          aximCoreClient.from('incident_reports').select('id, severity, message, created_at').order('created_at', { ascending: false }).limit(50)
        ]);

        const combined = [
          ...(telemetryData || []).map(r => ({ id: r.id, type: 'TELEMETRY', msg: \`Node \${r.device_id} pulse: CPU \${r.cpu}% TEMP \${r.temp}C\`, ts: r.created_at, color: 'text-cyan-500' })),
          ...(commandData || []).map(r => ({ id: r.id, type: 'COMMAND', msg: \`Node \${r.device_id} executed: \${r.command}\`, ts: r.updated_at, color: 'text-amber-500' })),
          ...(incidentData || []).map(r => ({ id: r.id, type: 'INCIDENT', msg: \`[\${r.severity}] \${r.message}\`, ts: r.created_at, color: 'text-rose-500' }))
        ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

        setLogs(combined.slice(0, 100));
      } catch (err) {
        // silent
      }
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
              className={\`text-[8px] px-2 py-0.5 border \${filter === f ? 'bg-cyan-500 text-black' : 'border-cyan-800 text-cyan-800'}\`}
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
             <span className={\`w-20 font-bold \${log.color}\`}>[{log.type}]</span>
             <span className="text-gray-300 flex-1">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/GlobalAuditLog.jsx', code);
