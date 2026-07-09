import React from 'react';
import ReactECharts from 'echarts-for-react';

export function SensorGraphs({ telemetryHistory, deviceType }) {
  const getGraphMetrics = () => {
    switch (deviceType) {
      case 'ENVIRONMENTAL_SENSOR':
        return {
          y1Name: 'AQI',
          y1Max: 500,
          y2Name: 'HUMIDITY %',
          y2Max: 100,
          s1Name: 'AIR_QUAL',
          s1Data: telemetryHistory.map(d => d.airQuality || Math.random() * 50 + 20),
          s2Name: 'HUMIDITY',
          s2Data: telemetryHistory.map(d => d.humidity || Math.random() * 20 + 40),
        };
      case 'ROBOTIC_ARM':
        return {
          y1Name: 'TORQUE Nm',
          y1Max: 200,
          y2Name: 'PAYLOAD kg',
          y2Max: 50,
          s1Name: 'JOINT_TORQUE',
          s1Data: telemetryHistory.map(d => d.torque || Math.random() * 100),
          s2Name: 'PAYLOAD_WT',
          s2Data: telemetryHistory.map(d => d.payloadWeight || Math.random() * 20),
        };
      case 'UAV':
      default:
        return {
          y1Name: 'CPU %',
          y1Max: 100,
          y2Name: 'TEMP °C',
          y2Max: 120,
          s1Name: 'CPU_LOAD',
          s1Data: telemetryHistory.map(d => d.cpu),
          s2Name: 'SYS_TEMP',
          s2Data: telemetryHistory.map(d => d.temp),
        };
    }
  };

  const metrics = getGraphMetrics();

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
        name: metrics.y1Name,
        nameTextStyle: { color: '#4b5563', fontSize: 10 },
        max: metrics.y1Max,
        axisLabel: { color: '#4b5563', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } }
      },
      {
        type: 'value',
        name: metrics.y2Name,
        nameTextStyle: { color: '#4b5563', fontSize: 10 },
        max: metrics.y2Max,
        axisLabel: { color: '#4b5563', fontSize: 10 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: metrics.s1Name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: metrics.s1Data,
        itemStyle: { color: '#06b6d4' }, // Cyan
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(6, 182, 212, 0.3)' }, { offset: 1, color: 'rgba(6, 182, 212, 0)' }]
          }
        }
      },
      {
        name: metrics.s2Name,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        data: metrics.s2Data,
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