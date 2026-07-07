import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getFleet, getIncidents } from '../services/hardwareService';
import ReactECharts from 'echarts-for-react';
import { aximCoreClient } from '../lib/supabaseClient';

export function MissionControl() {
  const [stats, setStats] = useState({
    online: 0,
    total: 0,
    criticalAlerts: 0,
    avgLatency: 0
  });

  useEffect(() => {
    const fetchGlobalStats = async () => {
      const fleet = await getFleet();
      const allIncidents = await Promise.all(fleet.map(n => getIncidents(n.id, 10)));
      const flatIncidents = allIncidents.flat();
      
      setStats({
        online: fleet.filter(n => n.status === 'ONLINE').length,
        total: fleet.length,
        criticalAlerts: flatIncidents.filter(i => i.severity === 'CRITICAL').length,
        avgLatency: 42 // Mocked global avg
      });
    };
    fetchGlobalStats();

    const hardwareChannel = aximCoreClient
      .channel('mc_hardware_registry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hardware_registry' },
        () => fetchGlobalStats()
      )
      .subscribe();

    const incidentChannel = aximCoreClient
      .channel('mc_incident_reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        () => fetchGlobalStats()
      )
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(hardwareChannel);
      aximCoreClient.removeChannel(incidentChannel);
    };
  }, []);

  const chartOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLine: { lineStyle: { width: 4, color: [[0.3, '#f43f5e'], [0.7, '#f59e0b'], [1, '#06b6d4']] } },
      pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '12%', width: 10, offsetCenter: [0, '-60%'], itemStyle: { color: 'auto' } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: { show: false },
      data: [{ value: (stats.online / stats.total) * 100 }]
    }]
  };

  return (
    <div className="cyber-panel p-8 w-full max-w-6xl h-[600px] pointer-events-auto overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-8 border-b border-cyan-500/30 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-[0.4em] uppercase italic">MISSION_CONTROL</h2>
          <p className="text-cyan-700 text-[10px] mt-1 tracking-widest">GLOBAL_FLEET_OPERATIONS_CENTER // v4.0</p>
        </div>
        <div className="flex space-x-12">
          <div className="text-right">
            <div className="text-gray-600 text-[9px] uppercase">Fleet_Efficacy</div>
            <div className="text-2xl font-mono text-cyan-400 font-bold">{(stats.online / (stats.total || 1) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-right">
            <div className="text-gray-600 text-[9px] uppercase">Active_Threats</div>
            <div className="text-2xl font-mono text-rose-500 font-bold">{stats.criticalAlerts.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-cyan-950/10 border border-cyan-500/10 p-6 flex flex-col justify-center">
            <h4 className="text-gray-500 text-[10px] uppercase mb-2">Network_Throughput</h4>
            <div className="text-3xl font-bold text-white font-mono">1.2 <span className="text-cyan-600 text-sm">GBPS</span></div>
            <div className="w-full h-1 bg-gray-900 mt-4 overflow-hidden">
              <div className="h-full bg-cyan-500 w-[65%] animate-pulse"></div>
            </div>
          </div>
          <div className="bg-cyan-950/10 border border-cyan-500/10 p-6 flex flex-col justify-center">
            <h4 className="text-gray-500 text-[10px] uppercase mb-2">Satellite_Link_Lock</h4>
            <div className="text-3xl font-bold text-green-500 font-mono">STABLE</div>
            <div className="flex space-x-1 mt-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-3 w-1 bg-green-500/40"></div>)}
            </div>
          </div>
          <div className="col-span-2 bg-black/40 border border-cyan-500/5 p-4 overflow-hidden">
             <h4 className="text-gray-500 text-[10px] uppercase mb-4 border-b border-cyan-500/10 pb-1">Uplink_Nodes_Map</h4>
             <div className="h-full relative bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale contrast-125">
                <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                <div className="absolute top-1/2 right-1/2 w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
             </div>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="cyber-panel p-4 flex-1 flex flex-col items-center justify-center relative">
            <h4 className="text-gray-500 text-[9px] uppercase absolute top-4">Node_Saturation</h4>
            <div className="h-48 w-full">
               <ReactECharts option={chartOption} style={{height: '100%'}} />
            </div>
            <div className="text-center -mt-8">
              <div className="text-4xl font-black text-cyan-400 font-mono">{stats.online}/{stats.total}</div>
              <div className="text-[8px] text-cyan-800 tracking-[0.5em] mt-2 uppercase">Online_Assets</div>
            </div>
          </div>
          
          <button 
            onClick={() => alert("Generating Forensic Report for G_SHEETS...")}
            className="w-full py-4 border border-cyan-500/30 text-cyan-500 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500/10 transition-all flex items-center justify-center space-x-3"
          >
            <SafeIcon icon={FiIcons.FiDownload} />
            <span>EXPORT_AUDIT_LOGS</span>
          </button>
        </div>
      </div>
    </div>
  );
}