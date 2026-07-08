import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getCommandHistory, sendCommand, removeCommand } from '../services/hardwareService';
import { format } from 'date-fns';
import { aximCoreClient } from '../lib/supabaseClient';

const MACROS = [
  { id: 'reboot', label: 'SYS_REBOOT', icon: FiIcons.FiRefreshCw, cmd: 'REBOOT --FORCE --NOW' },
  { id: 'calibrate', label: 'SENSOR_CAL', icon: FiIcons.FiTarget, cmd: 'CALIBRATE --ALL --PRECISE' },
  { id: 'purge', label: 'LOG_PURGE', icon: FiIcons.FiTrash2, cmd: 'SYSTEM --PURGE-LOGS' },
  { id: 'diagnostic', label: 'RUN_DIAG', icon: FiIcons.FiActivity, cmd: 'DIAGNOSTIC --FULL --VERBOSE' }
];

export function CommandManager({ deviceId }) {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getCommandHistory(deviceId);
      setCommands(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const channel = aximCoreClient.channel('public:command_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'command_queue', filter: `device_id=eq.${deviceId}` }, () => {
        fetchHistory(); // Re-fetch the list when any command is added or updated (e.g. PENDING -> EXECUTED)
      })
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, [deviceId]);

  const handleMacro = async (macro) => {
    setExecuting(macro.id);
    try {
      await sendCommand(deviceId, macro.cmd);
      // Realtime subscription handles adding the command to state
    } catch (err) {
      alert("Macro injection failed.");
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove command record from auditing?")) return;
    try {
      await removeCommand(id);
      // Realtime subscription handles removing the command from state
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="cyber-panel p-4 w-[400px] h-[500px] pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiCommand} className="mr-2" />
          COMMAND_CENTER
        </h3>
        <button onClick={fetchHistory} className="text-cyan-600 hover:text-cyan-400">
          <SafeIcon icon={FiIcons.FiRefreshCw} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Macro Section */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {MACROS.map(macro => (
          <button
            key={macro.id}
            onClick={() => handleMacro(macro)}
            disabled={executing !== null}
            className="flex items-center justify-between p-2 border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all text-[10px] group"
          >
            <div className="flex items-center">
              <SafeIcon icon={macro.icon} className="mr-2 text-cyan-400 group-hover:animate-pulse" />
              <span className="text-white font-bold">{macro.label}</span>
            </div>
            {executing === macro.id && <FiIcons.FiLoader className="animate-spin text-cyan-400" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <h4 className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">Audit_Trail</h4>
        {commands.map((cmd) => (
          <div key={cmd.id} className="bg-black/40 border border-cyan-500/10 p-2 rounded-sm group">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-cyan-300 font-bold font-mono">
                {cmd.command.length > 25 ? cmd.command.substring(0, 25) + '...' : cmd.command}
              </span>
              <div className="flex items-center space-x-2">
                <span className={`text-[8px] px-1 rounded ${
                  cmd.status === 'EXECUTED' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500 animate-pulse'
                }`}>
                  {cmd.status}
                </span>
                <button 
                  onClick={() => handleDelete(cmd.id)}
                  className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-opacity"
                >
                  <SafeIcon icon={FiIcons.FiX} className="text-[10px]" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-[8px] text-gray-600">
              <span className="font-mono">{cmd.id.split('-')[0]}</span>
              <span>{format(new Date(cmd.created_at), 'MMM dd HH:mm:ss')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
