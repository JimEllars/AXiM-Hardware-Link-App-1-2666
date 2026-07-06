import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

export function ConnectorCard({ connector, onRemove }) {
  const getIcon = (type) => {
    switch (type) {
      case 'INDUSTRIAL': return FiIcons.FiSettings;
      case 'IOT': return FiIcons.FiCpu;
      case 'SATELLITE': return FiIcons.FiGlobe;
      default: return FiIcons.FiCloud;
    }
  };

  return (
    <div className="bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-sm group hover:border-cyan-500/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 bg-cyan-500/10 rounded">
            <SafeIcon icon={getIcon(connector.type)} className="text-cyan-400 text-lg" />
          </div>
          <button onClick={() => onRemove(connector.id)} className="text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <SafeIcon icon={FiIcons.FiTrash2} />
          </button>
        </div>
        <h4 className="text-white font-bold text-xs tracking-widest uppercase">{connector.name}</h4>
        <div className="text-[9px] text-cyan-600 font-mono mt-1">{connector.protocol} // {connector.endpoint}</div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-cyan-500/10 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-2"></div>
          <span className="text-[8px] text-green-500 font-bold uppercase tracking-tighter">LINK_ESTABLISHED</span>
        </div>
        <div className="text-[8px] text-gray-600 uppercase font-mono">Sync: {new Date(connector.lastSync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    </div>
  );
}