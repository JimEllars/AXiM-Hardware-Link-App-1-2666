import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getIncidents } from '../services/hardwareService';
import { format } from 'date-fns';
import { aximCoreClient } from '../lib/supabaseClient';

export function AlertArchive({ deviceId }) {
  const [incidents, setIncidents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidentsAndTickets = async () => {
    setLoading(true);
    try {
      const data = await getIncidents(deviceId);
      setIncidents(data);

      const { data: ticketData, error: ticketError } = await aximCoreClient
        .from('support_tickets')
        .select('*')
        .eq('device_id', deviceId)
        .in('status', ['OPEN', 'PENDING']);

      if (ticketError) throw ticketError;
      setTickets(ticketData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsAndTickets();

    const channel = aximCoreClient.channel(`public:incident_and_tickets:${deviceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_reports', filter: `device_id=eq.${deviceId}` }, (payload) => {
        setIncidents(prev => [{ id: payload.new.id, type: payload.new.type, severity: payload.new.severity, message: payload.new.message, timestamp: payload.new.created_at }, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `device_id=eq.${deviceId}` }, (payload) => {
         if (payload.eventType === 'INSERT') {
           setTickets(prev => [payload.new, ...prev]);
         } else if (payload.eventType === 'UPDATE') {
           setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t).filter(t => ['OPEN', 'PENDING'].includes(t.status)));
         } else if (payload.eventType === 'DELETE') {
           setTickets(prev => prev.filter(t => t.id !== payload.old.id));
         }
      })
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, [deviceId]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await aximCoreClient
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      const auditRecord = {
        action_type: 'TICKET_UPDATE',
        description: `Support ticket ${ticketId} status changed to ${newStatus}`,
        actor_id: 'SYSTEM',
        created_at: new Date().toISOString()
      };

      const { error: auditError } = await aximCoreClient
        .from('global_audit_logs')
        .insert([auditRecord]);

      if (auditError) {
        throw new Error('Audit log insert blocked for TICKET_UPDATE');
      }
    } catch (err) {
      console.error('Failed to update ticket status', err);
    }
  };

  const getSeverityColor = (sev, type) => {
    if (type === 'ONYX_OVERRIDE') {
      return 'text-fuchsia-500 border-fuchsia-500/50 bg-fuchsia-500/10 animate-pulse';
    }
    switch (sev) {
      case 'AUTONOMOUS_INTERVENTION': return 'text-fuchsia-500 border-fuchsia-500/50 bg-fuchsia-500/10 animate-pulse';
      case 'CRITICAL': return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
      case 'WARNING': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      default: return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
    }
  };

  return (
    <div className="cyber-panel p-4 w-80 h-80 pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-2">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiAlertOctagon} className="mr-2" />
          INCIDENT_ARCHIVE
        </h3>
        <button onClick={fetchIncidentsAndTickets} className="text-cyan-600 hover:text-cyan-400">
          <SafeIcon icon={FiIcons.FiRefreshCw} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {incidents.length === 0 && tickets.length === 0 && !loading && (
          <div className="text-[10px] text-gray-600 italic text-center mt-12">INCIDENT_BUFFER_CLEAR</div>
        )}

        {tickets.map((ticket) => (
          <div key={ticket.id} className="border p-2 rounded-sm text-[10px] text-amber-500 border-amber-500/50 bg-amber-500/10">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold tracking-widest uppercase">TICKET: {ticket.title}</span>
              <span className="text-[8px] opacity-60">
                {format(new Date(ticket.created_at || new Date()), 'HH:mm:ss')}
              </span>
            </div>
            <div className="text-[11px] leading-tight opacity-90 mb-2">{ticket.description}</div>
            <div className="flex space-x-2">
              <button onClick={() => updateTicketStatus(ticket.id, 'ACKNOWLEDGED')} className="bg-amber-900/50 hover:bg-amber-800/80 text-amber-400 border border-amber-700/50 px-2 py-1 rounded text-[9px] font-bold tracking-wider transition-colors">
                ACKNOWLEDGE
              </button>
              <button onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')} className="bg-green-900/50 hover:bg-green-800/80 text-green-400 border border-green-700/50 px-2 py-1 rounded text-[9px] font-bold tracking-wider transition-colors">
                RESOLVE
              </button>
            </div>
          </div>
        ))}

        {incidents.map((incident) => (
          <div key={incident.id} className={`border p-2 rounded-sm text-[10px] ${getSeverityColor(incident.severity, incident.type)}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold tracking-widest uppercase">{incident.type}</span>
              <span className="text-[8px] opacity-60">
                {format(new Date(incident.timestamp), 'HH:mm:ss')}
              </span>
            </div>
            <div className="text-[11px] leading-tight opacity-90">{incident.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
