import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getTelemetryHistory } from '../services/hardwareService';
import { format } from 'date-fns';

export function HistoryLog({ deviceId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getTelemetryHistory(deviceId);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [deviceId]);

  return (
    <div className="cyber-panel p-4 w-80 h-64 pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-2">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiDatabase} className="mr-2" />
          TELEMETRY_LOGBOOK
        </h3>
        <button onClick={fetchHistory} className="text-cyan-600 hover:text-cyan-400">
          <SafeIcon icon={FiIcons.FiRefreshCw} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {history.length === 0 && !loading && (
          <div className="text-[10px] text-gray-600 italic text-center mt-8">NO_RECORDS_IN_CLOUD_BUFFER</div>
        )}
        {history.map((entry) => (
          <div key={entry.id} className="bg-cyan-950/20 border border-cyan-500/10 p-2 rounded-sm text-[10px] flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-cyan-300 font-bold">
                {format(new Date(entry.timestamp), 'HH:mm:ss')}
              </span>
              <span className="text-gray-500 text-[8px]">{format(new Date(entry.timestamp), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex space-x-3 text-right">
              <div>
                <div className="text-gray-600 text-[8px]">CPU</div>
                <div className="text-cyan-500">{entry.cpu}%</div>
              </div>
              <div>
                <div className="text-gray-600 text-[8px]">TEMP</div>
                <div className="text-rose-500">{entry.temp}°C</div>
              </div>
              <div>
                <div className="text-gray-600 text-[8px]">PING</div>
                <div className="text-amber-500">{entry.ping}ms</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}