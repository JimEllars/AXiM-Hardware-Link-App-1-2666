import React, { useState, useEffect, useMemo } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { aximCoreClient } from '../lib/supabaseClient';

export function GlobalAuditLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

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
          ...(telemetryData || []).map(r => ({ id: r.id, type: 'TELEMETRY', msg: `Node ${r.device_id} pulse: CPU ${r.cpu}% TEMP ${r.temp}C`, ts: r.created_at, color: 'text-cyan-500', device_id: r.device_id, severity: 'INFO' })),
          ...(commandData || []).map(r => ({ id: r.id, type: 'COMMAND', msg: `Node ${r.device_id} executed: ${r.command}`, ts: r.updated_at, color: 'text-amber-500', device_id: r.device_id, severity: 'INFO' })),
          ...(incidentData || []).map(r => ({ id: r.id, type: 'INCIDENT', msg: `[${r.severity}] ${r.message}`, ts: r.created_at, color: 'text-rose-500', severity: r.severity }))
        ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

        setLogs(combined.slice(0, 100));
      } catch (err) {
        // silent
      }
    };
    fetchAllLogs();

    const channel = aximCoreClient.channel('global-audit-log-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_audit_logs' },
        (payload) => {
          const newRecord = payload.new;
          setLogs(prev => {
            const newLog = {
              id: newRecord.id,
              type: newRecord.action_type || 'AUDIT',
              msg: newRecord.description || `System audited by ${newRecord.actor_id}`,
              ts: newRecord.created_at,
              color: 'text-purple-500', // Distinct color for audit logs
              severity: 'INFO',
              device_id: newRecord.device_id || 'UNKNOWN'
            };
            return [newLog, ...prev].slice(0, 100);
          });
        }
      )
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filter !== 'ALL' && l.type !== filter) return false;
      if (severityFilter !== 'ALL' && l.severity !== severityFilter) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return (l.msg && l.msg.toLowerCase().includes(q)) ||
               (l.device_id && l.device_id.toLowerCase().includes(q)) ||
               (l.type && l.type.toLowerCase().includes(q));
      }
      return true;
    });
  }, [logs, filter, severityFilter, debouncedSearch]);

  return (
    <div className="cyber-panel p-6 w-full max-w-4xl h-[600px] pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-4">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiActivity} className="mr-2" /> UNIFIED_EVENT_STREAM
        </h3>
        <div className="flex flex-col items-end gap-2">
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
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="SEARCH LOGS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-black border border-cyan-500/50 text-[10px] text-cyan-300 px-2 py-1 outline-none focus:border-cyan-400 w-48"
            />
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-black border border-cyan-500/50 text-[10px] text-cyan-300 px-2 py-1 outline-none"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1">
        {filteredLogs.map(log => (
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
