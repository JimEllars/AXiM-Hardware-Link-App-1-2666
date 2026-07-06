import React from 'react';
import ReactECharts from 'echarts-for-react';

export function SensorGraphs({ telemetryHistory }) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'rgba(6, 182, 212, 0.5)',
      textStyle: { color: '#00e5ff', fontFamily: 'monospace', fontSize: 12 }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: telemetryHistory.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(6, 182, 212, 0.3)' } },
      axisLabel: { color: '#4b5563', fontSize: 10 },
      splitLine: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: 'CPU %',
        nameTextStyle: { color: '#4b5563', fontSize: 10 },
        max: 100,
        axisLabel: { color: '#4b5563', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'TEMP °C',
        nameTextStyle: { color: '#4b5563', fontSize: 10 },
        max: 120,
        axisLabel: { color: '#4b5563', fontSize: 10 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'CPU_LOAD',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: telemetryHistory.map(d => d.cpu),
        itemStyle: { color: '#06b6d4' }, // Cyan
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(6, 182, 212, 0.3)' }, { offset: 1, color: 'rgba(6, 182, 212, 0)' }]
          }
        }
      },
      {
        name: 'SYS_TEMP',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        data: telemetryHistory.map(d => d.temp),
        itemStyle: { color: '#f43f5e' }, // Rose
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(244, 63, 94, 0.3)' }, { offset: 1, color: 'rgba(244, 63, 94, 0)' }]
          }
        }
      }
    ]
  };

  return (
    <div className="cyber-panel p-4 w-80 pointer-events-auto">
      <h3 className="text-cyan-400 font-bold tracking-widest mb-1 uppercase text-xs border-b border-cyan-500/30 pb-1 flex justify-between">
        <span>HW_METRICS</span>
        <span className="text-rose-500 text-[10px] animate-pulse">LIVE</span>
      </h3>
      <div className="h-40 w-full mt-2">
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }} 
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
}