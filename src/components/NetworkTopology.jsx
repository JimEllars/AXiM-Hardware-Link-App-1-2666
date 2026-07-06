import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { getFleet } from '../services/hardwareService';
import { getConnectors, getBridges } from '../services/connectorService';

export function NetworkTopology() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const buildGraph = async () => {
      const [fleet, connectors, bridges] = await Promise.all([
        getFleet(), getConnectors(), getBridges()
      ]);

      const nodes = [
        ...connectors.map(c => ({ 
          id: c.id, name: c.name, category: 0, 
          symbolSize: 40, itemStyle: { color: '#06b6d4' } 
        })),
        ...fleet.map(f => ({ 
          id: f.id, name: f.name, category: 1, 
          symbolSize: 30, itemStyle: { color: f.status === 'ONLINE' ? '#22c55e' : '#4b5563' } 
        }))
      ];

      const links = bridges.map(b => ({
        source: b.connectorId,
        target: b.deviceId,
        lineStyle: { width: 2, curveness: 0.2, color: '#06b6d4', opacity: 0.4 }
      }));

      setGraphData({ nodes, links });
    };
    buildGraph();
  }, []);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      data: graphData.nodes,
      links: graphData.links,
      categories: [{ name: 'Connector' }, { name: 'Hardware' }],
      roam: true,
      label: { show: true, position: 'right', color: '#06b6d4', fontSize: 10, fontFamily: 'monospace' },
      force: { repulsion: 200, edgeLength: 150 },
      lineStyle: { color: 'source', curveness: 0.3 }
    }]
  };

  return (
    <div className="cyber-panel p-6 w-full max-w-5xl h-[550px] pointer-events-auto flex flex-col">
      <h3 className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs border-b border-cyan-500/30 pb-4 mb-4">
        ECOSYSTEM_TOPOLOGY_LAYER
      </h3>
      <div className="flex-1">
        <ReactECharts option={option} style={{ height: '100%' }} />
      </div>
    </div>
  );
}