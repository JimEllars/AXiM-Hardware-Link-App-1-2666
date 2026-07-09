import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getFleet, registerDevice, updateDeviceName, sendCommand } from '../services/hardwareService';
import { aximCoreClient } from '../lib/supabaseClient';

export function FleetManager({ onSelectNode, selectedId }) {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const refreshFleet = async () => {
    try {
      const data = await getFleet();
      if (data.length === 0) {
        const defaultNode = { id: 'DRONE_01_ALPHA', name: 'Alpha Interceptor', type: 'DRONE', status: 'ONLINE' };
        await registerDevice(defaultNode);
        setFleet([defaultNode]);
      } else {
        setFleet(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshFleet();

    // Enterprise WebSocket Subscription (No Polling)
    const channel = aximCoreClient
      .channel('fleet-registry-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hardware_registry' }, async (payload) => {

        if (payload.eventType === 'INSERT') {
          // 1. Instantly update UI without polling
          setFleet(current => [payload.new, ...current]);

          // 2. Trigger Auto-Handshake based on device type
          try {
            await sendCommand(payload.new.id, `INIT_HANDSHAKE --TYPE ${payload.new.type}`);
            console.log(`[AXiM_CORE] Auto-handshake dispatched to new node: ${payload.new.id}`);
          } catch (err) {
            console.error("Handshake dispatch failed", err);
          }
        }
        else if (payload.eventType === 'UPDATE') {
          setFleet(current => current.map(node => node.id === payload.new.id ? payload.new : node));
        }
      })
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, []);

  const handleEdit = (node) => {
    setEditingId(node.id);
    setEditName(node.name);
  };

  const handleSave = async (id) => {
    setLoading(true);
    await updateDeviceName(id, editName);
    setEditingId(null);
    setLoading(false);
    // Realtime subscription will handle the update in state
  };

  return (
    <div className="cyber-panel p-4 w-72 pointer-events-auto flex flex-col h-[400px]">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiCpu} className="mr-2" />
          FLEET_REGISTRY
        </h3>
        <button onClick={refreshFleet} className="text-cyan-500 hover:text-cyan-300 transition-colors">
          <SafeIcon icon={FiIcons.FiRefreshCw} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {fleet.map((node) => (
          <div
            key={node.id}
            className={`w-full text-left p-3 border transition-all duration-300 group ${
              selectedId === node.id 
                ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                : 'bg-black/40 border-cyan-500/20 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <button 
                onClick={() => onSelectNode(node.id)}
                className={`text-[10px] font-bold tracking-tighter ${selectedId === node.id ? 'text-cyan-300' : 'text-gray-500'}`}
              >
                {node.id}
              </button>
              <div className="flex space-x-2 items-center">
                <button onClick={() => handleEdit(node)} className="text-gray-600 hover:text-cyan-400">
                  <SafeIcon icon={FiIcons.FiEdit3} className="text-[10px]" />
                </button>
                <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
              </div>
            </div>

            {editingId === node.id ? (
              <div className="flex space-x-2 mt-1">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-black/60 border border-cyan-500/50 text-xs text-white px-2 py-0.5 w-full outline-none"
                  autoFocus
                />
                <button onClick={() => handleSave(node.id)} className="text-green-500">
                  <SafeIcon icon={FiIcons.FiCheck} />
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => onSelectNode(node.id)}>
                {node.name}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <span className="text-[9px] text-cyan-600 uppercase tracking-widest">{node.type}</span>
              <span className="text-[9px] text-gray-600">
                {node.last_seen ? new Date(node.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="mt-4 w-full py-2 border border-dashed border-cyan-500/30 text-[10px] text-cyan-600 hover:text-cyan-400 hover:border-cyan-500/60 transition-all flex items-center justify-center"
        onClick={() => alert("Auto-discovery protocol initiated... scan for BLE/RF nodes.")}
      >
        <SafeIcon icon={FiIcons.FiPlus} className="mr-1" /> REGISTER_NEW_NODE
      </button>
    </div>
  );
}
