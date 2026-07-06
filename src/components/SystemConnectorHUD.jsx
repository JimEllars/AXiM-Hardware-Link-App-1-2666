import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getConnectors, addConnector, removeConnector, getBridges, createBridge } from '../services/connectorService';
import { getFleet } from '../services/hardwareService';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorGallery } from './ConnectorGallery';

export function SystemConnectorHUD() {
  const [connectors, setConnectors] = useState([]);
  const [bridges, setBridges] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [c, b, f] = await Promise.all([getConnectors(), getBridges(), getFleet()]);
    setConnectors(c);
    setBridges(b);
    setFleet(f);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (tpl) => {
    await addConnector(tpl);
    setShowAdd(false);
    fetchData();
  };

  const handleRemove = async (id) => {
    await removeConnector(id);
    fetchData();
  };

  const handleLink = async (connectorId, deviceId) => {
    await createBridge(connectorId, deviceId);
    fetchData();
  };

  return (
    <div className="cyber-panel p-8 w-full max-w-6xl h-[650px] pointer-events-auto flex gap-8 overflow-hidden">
      {/* Left: Active Connectors Grid */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-[0.2em] uppercase italic flex items-center">
              <SafeIcon icon={FiIcons.FiLink} className="mr-3 text-cyan-400" /> SYSTEM_BRIDGE_MANAGER
            </h2>
            <p className="text-cyan-800 text-[9px] uppercase tracking-widest mt-1">Simultaneous_Node_Aggregation // Active_Links: {connectors.length}</p>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-cyan-500 text-black text-[10px] font-black uppercase hover:bg-cyan-400"
          >
            {showAdd ? 'CLOSE_GALLERY' : 'ADD_NEW_CONNECTOR'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4">
          {showAdd ? (
            <ConnectorGallery onAdd={handleAdd} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {connectors.map(c => (
                <ConnectorCard key={c.id} connector={c} onRemove={handleRemove} />
              ))}
              {connectors.length === 0 && (
                <div className="col-span-2 text-center py-20 text-gray-700 italic text-sm">NO_ACTIVE_SYSTEM_CONNECTORS_FOUND</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Bridge Matrix */}
      <div className="w-80 flex flex-col border-l border-cyan-500/10 pl-8">
        <h3 className="text-cyan-400 font-bold text-[10px] tracking-widest mb-6 uppercase border-b border-cyan-500/30 pb-2">CROSS_SYSTEM_BRIDGES</h3>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {bridges.map(bridge => {
            const connector = connectors.find(c => c.id === bridge.connectorId);
            const device = fleet.find(d => d.id === bridge.deviceId);
            return (
              <div key={bridge.id} className="p-3 bg-cyan-950/5 border-l-2 border-cyan-500 flex flex-col">
                <div className="flex justify-between text-[10px] font-bold text-white mb-2">
                  <span>{connector?.name || 'UNKNOWN'}</span>
                  <SafeIcon icon={FiIcons.FiRepeat} className="text-cyan-500" />
                  <span>{device?.name || 'UNKNOWN'}</span>
                </div>
                <div className="flex justify-between items-center text-[8px] text-gray-500 uppercase font-mono">
                  <span>MODE: {bridge.mode}</span>
                  <span>EST: {new Date(bridge.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
          {bridges.length === 0 && (
            <div className="text-[10px] text-gray-600 text-center py-10 italic">NO_ACTIVE_BRIDGES_FOR_UPLINK</div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-cyan-500/10">
          <div className="text-[9px] text-cyan-800 uppercase mb-2">Bridge_Protocol_Stack</div>
          <div className="flex flex-wrap gap-1">
            {['TCP', 'UDP', 'WEBSOCKET', 'GRPC', 'TLS1.3'].map(p => (
              <span key={p} className="text-[7px] border border-cyan-900 px-1 text-cyan-900">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}