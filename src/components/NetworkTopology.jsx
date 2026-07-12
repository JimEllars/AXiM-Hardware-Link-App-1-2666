import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { getFleet } from '../services/hardwareService';
import { getConnectors, getBridges } from '../services/connectorService';
import { aximCoreClient } from '../lib/supabaseClient';

export function NetworkTopology() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const buildGraph = async () => {
      const [fleet, connectors, bridges] = await Promise.all([
        getFleet(), getConnectors(), getBridges()
      ]);

      const cloudflareNode = {
        id: 'cloudflare_pages_edge', name: 'CLOUDFLARE_PAGES_EDGE', category: 2,
        symbolSize: 45, itemStyle: { color: '#f38020' }
      };

      const coreNode = {
        id: 'axim_core_cluster', name: 'AXiM_CORE_BACKEND', category: 3,
        symbolSize: 50, itemStyle: { color: '#8b5cf6' }
      };

      const nodes = [
        cloudflareNode,
        coreNode,
        ...connectors.map(c => ({ 
          id: c.id, name: c.name, category: 0, 
          symbolSize: 40, itemStyle: { color: '#06b6d4' } 
        })),
        ...fleet.map(f => ({ 
          id: f.id, name: f.name, category: 1, 
          symbolSize: 30, itemStyle: { color: f.status === 'ONLINE' ? '#22c55e' : '#4b5563' } 
        }))
      ];

      const coreLinks = connectors.map(c => ({
        source: c.id,
        target: 'axim_core_cluster',
        lineStyle: { width: 3, curveness: 0.1, color: '#8b5cf6', opacity: 0.6 }
      }));

      const edgeLink = {
        source: 'axim_core_cluster',
        target: 'cloudflare_pages_edge',
        lineStyle: { width: 4, curveness: 0.1, color: '#f38020', opacity: 0.8, type: 'dashed' }
      };

      const links = [
        edgeLink,
        ...coreLinks,
        ...bridges.map(b => ({
          source: b.connectorId,
          target: b.deviceId,
          lineStyle: { width: 2, curveness: 0.2, color: '#06b6d4', opacity: 0.4 }
        }))
      ];

      setGraphData({ nodes, links });
    };
    buildGraph();

    const topologyChannel = aximCoreClient
      .channel('topology_engine')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hardware_registry' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => {
          const newNodes = prev.nodes.map(n => {
            if (n.id === payload.new.id) {
              return {
                ...n,
                name: payload.new.name,
                itemStyle: { color: payload.new.status === 'ONLINE' ? '#22c55e' : '#4b5563' }
              };
            }
            return n;
          });
          return { ...prev, nodes: newNodes };
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hardware_registry' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => {
          const newNode = {
            id: payload.new.id, name: payload.new.name, category: 1,
            symbolSize: 30, itemStyle: { color: payload.new.status === 'ONLINE' ? '#22c55e' : '#4b5563' }
          };
          return { ...prev, nodes: [...prev.nodes, newNode] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'hardware_registry' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => ({
          ...prev,
          nodes: prev.nodes.filter(n => n.id !== payload.old.id)
        }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_connectors' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => {
          const newNode = {
            id: payload.new.id, name: payload.new.name, category: 0,
            symbolSize: 40, itemStyle: { color: '#06b6d4' }
          };
          const newLink = {
            source: payload.new.id,
            target: 'axim_core_cluster',
            lineStyle: { width: 3, curveness: 0.1, color: '#8b5cf6', opacity: 0.6 }
          };
          return { nodes: [...prev.nodes, newNode], links: [...prev.links, newLink] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'system_connectors' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => ({
          nodes: prev.nodes.filter(n => n.id !== payload.old.id),
          links: prev.links.filter(l => l.source !== payload.old.id && l.target !== payload.old.id)
        }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_bridges' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => {
          const newLink = {
            source: payload.new.connector_id,
            target: payload.new.device_id,
            lineStyle: { width: 2, curveness: 0.2, color: '#06b6d4', opacity: 0.4 }
          };
          return { ...prev, links: [...prev.links, newLink] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'system_bridges' }, (payload) => {
        if (!payload || (!payload.new && !payload.old)) return;
        setGraphData(prev => ({
          ...prev,
          links: prev.links.filter(l => !(l.source === payload.old.connector_id && l.target === payload.old.device_id))
        }));
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          void err;
        }
      });
return () => {
      aximCoreClient.removeChannel(topologyChannel);
    };
  }, []);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      data: graphData.nodes,
      links: graphData.links,
      categories: [{ name: 'Connector' }, { name: 'Hardware' }, { name: 'Edge' }, { name: 'Core' }],
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
        <ReactECharts option={option} style={{ height: '100%' }} notMerge={true} lazyUpdate={true} />
      </div>
    </div>
  );
}
