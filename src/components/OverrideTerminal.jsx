import React, { useState, useRef, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { sendCommand, getCommandHistory } from '../services/hardwareService';

// Mock hook for checking user roles before allowing access.
// Prepares for Cloudflare Zero Trust tunnel integration.
function useAdminValidation() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating JWT decode / role validation against AXiM Core identities
    const checkRole = async () => {
      try {
        // Here we would decode a JWT or check the Cloudflare Access headers.
        // For phase 1, we assume success to not block current devs,
        // but establish the validation lifecycle.
        // In reality, this should check for the "axim_internal_admin" role.
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsAdmin(true);
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  return { isAdmin, loading };
}

export function OverrideTerminal({ deviceId }) {
  const { isAdmin, loading: authLoading } = useAdminValidation();

  const [logs, setLogs] = useState([
    { id: 'init-1', text: `AXiM_CORE SECURE SHELL v2.4`, type: 'info' },
    { id: 'init-2', text: `Connected to Hardware Node: ${deviceId}`, type: 'success' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCmds, setPendingCmds] = useState(new Set());
  const endOfLogsRef = useRef(null);

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Command status polling (routed over standard HTTPS now via Supabase REST)
  useEffect(() => {
    if (pendingCmds.size === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const history = await getCommandHistory(deviceId, 5);
        history.forEach(cmd => {
          if (pendingCmds.has(cmd.id) && cmd.status === 'EXECUTED') {
            setLogs(prev => [...prev, {
              id: `${cmd.id}-ack`,
              text: `ACK: Command [${cmd.command}] executed by remote node.`,
              type: 'success'
            }]);
            setPendingCmds(prev => {
              const next = new Set(prev);
              next.delete(cmd.id);
              return next;
            });
          }
        });
      } catch (err) {
        console.error("Poll Error:", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [pendingCmds, deviceId]);

  const handleCommand = async (e, forcedCmd = null) => {
    if (e) e.preventDefault();
    const cmdInput = (forcedCmd || input).trim();
    if (!cmdInput || isProcessing) return;

    setLogs(prev => [...prev, { id: Date.now(), text: `> ${cmdInput}`, type: 'cmd' }]);
    setInput('');
    setIsProcessing(true);

    try {
      const cmdId = await sendCommand(deviceId, cmdInput);
      setPendingCmds(prev => new Set(prev).add(cmdId));
      
      setLogs(prev => [...prev, { 
        id: `${cmdId}-pending`, 
        text: `DISPATCHED: ID [${cmdId.split('-')[0]}] status: PENDING`, 
        type: 'info' 
      }]);
    } catch (err) {
      setLogs(prev => [...prev, { 
        id: Date.now(), 
        text: `ERR: Link failure. (${err.message})`, 
        type: 'error' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="cyber-panel p-4 w-96 h-64 flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-cyan-500 animate-pulse font-mono text-sm">AUTHENTICATING...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="cyber-panel p-4 w-96 h-64 flex flex-col items-center justify-center pointer-events-auto border-red-500">
        <div className="text-red-500 font-bold tracking-widest uppercase mb-2">ACCESS DENIED</div>
        <div className="text-gray-400 text-xs text-center font-mono">Role "axim_internal_admin" required to access Override Terminal.</div>
      </div>
    );
  }

  return (
    <div className="cyber-panel p-4 w-96 h-64 flex flex-col pointer-events-auto">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-2">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiTerminal} className="mr-2" />
          DIRECT_OVERRIDE
        </h3>
        <div className="flex space-x-2">
           <button onClick={() => handleCommand(null, 'HELP')} className="text-[9px] text-cyan-600 hover:text-cyan-400 px-1 border border-cyan-800">HELP</button>
           <button onClick={() => handleCommand(null, 'CLEAR')} className="text-[9px] text-cyan-600 hover:text-cyan-400 px-1 border border-cyan-800">CLEAR</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto text-xs space-y-1 mb-2 pr-2 font-mono scrollbar-hide">
        {logs.map((log) => (
          <div key={log.id} className={`${
            log.type === 'error' ? 'text-rose-500' : 
            log.type === 'success' ? 'text-green-400' : 
            log.type === 'cmd' ? 'text-white' : 'text-gray-400'
          }`}>
            {log.text}
          </div>
        ))}
        {isProcessing && <div className="text-cyan-500 animate-pulse">TRANSMITTING...</div>}
        <div ref={endOfLogsRef} />
      </div>

      <form onSubmit={handleCommand} className="relative flex items-center border-t border-cyan-500/20 pt-2">
        <span className="text-cyan-500 mr-2 text-sm">#</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Inject command string..."
          className="flex-1 bg-transparent border-none outline-none text-cyan-300 text-xs placeholder-gray-600 font-mono focus:ring-0"
          autoComplete="off"
          disabled={isProcessing}
        />
      </form>
    </div>
  );
}
