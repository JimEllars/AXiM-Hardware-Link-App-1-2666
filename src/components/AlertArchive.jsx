import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getIncidents } from '../services/hardwareService';
import { format } from 'date-fns';

export function AlertArchive({ deviceId }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await getIncidents(deviceId);
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const getSeverityColor = (sev) => {
    switch (sev) {
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
        <button onClick={fetchIncidents} className="text-cyan-600 hover:text-cyan-400">
          <SafeIcon icon={FiIcons.FiRefreshCw} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {incidents.length === 0 && !loading && (
          <div className="text-[10px] text-gray-600 italic text-center mt-12">INCIDENT_BUFFER_CLEAR</div>
        )}
        {incidents.map((incident) => (
          <div key={incident.id} className={`border p-2 rounded-sm text-[10px] ${getSeverityColor(incident.severity)}`}>
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