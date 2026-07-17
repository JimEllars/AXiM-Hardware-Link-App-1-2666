import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { sendBatchCommands, getFleet } from '../services/hardwareService';
import { logAudit } from '../services/pentestService';
import { motion, AnimatePresence } from 'framer-motion';

export function BatchCommandCenter() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [command, setCommand] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, complete
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const fleet = await getFleet();
        setNodes(fleet);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, []);

  const toggleNode = (id) => {
    const next = new Set(selectedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedNodes(next);
  };

  const selectAll = () => {
    if (selectedNodes.size === nodes.length) setSelectedNodes(new Set());
    else setSelectedNodes(new Set(nodes.map(n => n.id)));
  };

  const handleBatchExecute = async (e) => {
    e.preventDefault();
    if (selectedNodes.size === 0 || !command.trim()) return;

    setStatus('sending');
    try {
      const nodeArray = Array.from(selectedNodes);
      await sendBatchCommands(nodeArray, command.trim());

      // Update local audit entries
      await Promise.all(nodeArray.map(nodeId => logAudit(nodeId, {
        type: 'BATCH_COMMAND_DISPATCH',
        target: nodeId,
        result: 'SUCCESS',
        severity: 'INFO'
      })));
      setStatus('complete');
      setTimeout(() => setStatus('idle'), 3000);
      setCommand('');
    } catch (err) {
      alert("Batch execution failed: " + err.message);
      setStatus('idle');
    }
  };

  if (loading) return (
    <div className="cyber-panel p-8 w-full h-[500px] flex items-center justify-center">
      <SafeIcon icon={FiIcons.FiRefreshCw} className="text-2xl text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="cyber-panel p-6 w-full max-w-2xl h-[550px] pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-6">
        <h2 className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-sm flex items-center">
          <SafeIcon icon={FiIcons.FiLayers} className="mr-3 text-xl" />
          BATCH_ORCHESTRATOR
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-[10px] text-cyan-700 uppercase">Selected: {selectedNodes.size}</span>
          <button 
            onClick={selectAll}
            className="text-[10px] border border-cyan-800 px-2 py-1 hover:bg-cyan-500/10 text-cyan-500"
          >
            {selectedNodes.size === nodes.length ? 'DESELECT_ALL' : 'SELECT_ALL'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        {/* Node Selection List */}
        <div className="flex flex-col overflow-hidden border-r border-cyan-500/10 pr-4">
          <h4 className="text-[9px] text-gray-500 uppercase mb-2 tracking-widest">Target_Fleet</h4>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {nodes.map(node => (
              <button
                key={node.id}
                onClick={() => toggleNode(node.id)}
                className={`w-full text-left p-2 border transition-all flex justify-between items-center ${
                  selectedNodes.has(node.id) 
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                    : 'bg-black/40 border-cyan-500/10 text-gray-500 hover:border-cyan-500/40'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold">{node.name}</div>
                  <div className="text-[8px] opacity-60 font-mono">{node.id}</div>
                </div>
                {selectedNodes.has(node.id) && <SafeIcon icon={FiIcons.FiCheck} className="text-xs" />}
              </button>
            ))}
          </div>
        </div>

        {/* Command Input Area */}
        <div className="flex flex-col">
          <h4 className="text-[9px] text-gray-500 uppercase mb-2 tracking-widest">Payload_Definition</h4>
          <form onSubmit={handleBatchExecute} className="flex-1 flex flex-col space-y-4">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter batch command string (e.g. SET_MODE --AUTONOMOUS)..."
              className="flex-1 bg-black/60 border border-cyan-500/30 p-3 text-cyan-300 text-xs font-mono focus:border-cyan-500 outline-none resize-none"
            />
            
            <div className="bg-cyan-950/20 p-3 border border-cyan-500/10">
              <div className="text-[9px] text-cyan-700 uppercase mb-2">Transaction_Summary</div>
              <div className="text-[11px] text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Target Count:</span>
                  <span className="text-white font-mono">{selectedNodes.size} Nodes</span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="text-white font-mono">UPLINK_BATCH_V1</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={status !== 'idle' || selectedNodes.size === 0 || !command.trim()}
              className={`w-full py-3 font-bold tracking-widest text-xs uppercase flex items-center justify-center space-x-2 transition-all ${
                status === 'complete' ? 'bg-green-600 text-white' :
                status === 'sending' ? 'bg-cyan-800 text-cyan-400' :
                'bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95'
              } disabled:opacity-30 disabled:grayscale`}
            >
              {status === 'complete' ? (
                <>
                  <SafeIcon icon={FiIcons.FiCheckCircle} />
                  <span>TRANSMITTED</span>
                </>
              ) : status === 'sending' ? (
                <>
                  <FiIcons.FiLoader className="animate-spin" />
                  <span>DISPATCHING...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiIcons.FiSend} />
                  <span>EXECUTE_BATCH</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {status === 'complete' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-2 bg-green-500/10 border border-green-500/30 rounded text-[10px] text-green-400 text-center"
          >
            Successfully queued {selectedNodes.size} commands in the uplink buffer.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}