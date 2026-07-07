import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getFleet, getIncidents } from '../services/hardwareService';
import { aximCoreClient } from '../lib/supabaseClient';

export function FleetOverview() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const fleet = await getFleet();
        const nodesWithHealth = await Promise.all(fleet.map(async (node) => {
          const incidents = await getIncidents(node.id, 5);
          const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
          const healthScore = Math.max(0, 100 - (criticalCount * 25));
          return { ...node, healthScore };
        }));
        setNodes(nodesWithHealth);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();

    // Subscribe to hardware registry and incident reports to keep the fleet overview in sync
    const hardwareChannel = aximCoreClient
      .channel('fleet_hardware_registry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hardware_registry' },
        () => fetchFleetData()
      )
      .subscribe();

    const incidentChannel = aximCoreClient
      .channel('fleet_incident_reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        () => fetchFleetData()
      )
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(hardwareChannel);
      aximCoreClient.removeChannel(incidentChannel);
    };
  }, []);

  if (loading) return (
    <div className="cyber-panel p-8 w-full h-full flex items-center justify-center">
      <SafeIcon icon={FiIcons.FiRefreshCw} className="text-2xl text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="cyber-panel p-6 w-full max-w-4xl h-[500px] pointer-events-auto overflow-y-auto">
      <h2 className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-sm border-b border-cyan-500/30 pb-4 mb-6 flex items-center">
        <SafeIcon icon={FiIcons.FiShield} className="mr-3 text-xl" />
        GLOBAL_FLEET_READOUT
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map(node => (
          <div key={node.id} className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-sm flex justify-between items-center group hover:border-cyan-500/50 transition-all">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{node.id}</span>
                <div className={`w-2 h-2 rounded-full ${node.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mt-1">{node.name}</h4>
              <div className="text-[9px] text-cyan-600 mt-2 uppercase">{node.type} // {node.status}</div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-gray-500 mb-1">HEALTH_INDEX</div>
              <div className={`text-2xl font-black font-mono ${node.healthScore < 50 ? 'text-rose-500' : node.healthScore < 80 ? 'text-amber-500' : 'text-green-500'}`}>
                {node.healthScore}%
              </div>
              <div className="w-24 h-1 bg-gray-800 mt-1 rounded-full overflow-hidden ml-auto">
                <div 
                  className={`h-full transition-all duration-1000 ${node.healthScore < 50 ? 'bg-rose-500' : 'bg-green-500'}`} 
                  style={{ width: `${node.healthScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-cyan-500/10 pt-6">
        <div className="text-center">
          <div className="text-[9px] text-gray-600 uppercase mb-1">Active_Nodes</div>
          <div className="text-xl text-cyan-400 font-bold">{nodes.filter(n => n.status === 'ONLINE').length}</div>
        </div>
        <div className="text-center border-x border-cyan-500/10">
          <div className="text-[9px] text-gray-600 uppercase mb-1">Total_Uptime</div>
          <div className="text-xl text-cyan-400 font-bold">99.8%</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-gray-600 uppercase mb-1">Unresolved_Incidents</div>
          <div className="text-xl text-rose-500 font-bold">02</div>
        </div>
      </div>
    </div>
  );
}