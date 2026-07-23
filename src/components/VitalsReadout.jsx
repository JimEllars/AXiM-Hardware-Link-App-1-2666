import React from 'react';

export function VitalsReadout({ battery, signal, ping, deviceType, telemetry = {}, isLinkStale }) {
  const renderUAVProfile = () => (
    <>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-400 text-xs">PWR_CELL</span>
          <span className={battery < 20 ? 'text-rose-500 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'text-cyan-300'}>{battery ?? '--'}%</span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${battery < 20 ? 'bg-rose-500' : 'bg-cyan-400'}`}
            style={{ width: `${battery || 0}%` }}
          ></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">ALTIMETER</span>
        <span className="text-cyan-300 font-mono">{telemetry.altimeter ?? '45.2'} m</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">PITCH</span>
        <span className="text-cyan-300 font-mono">{telemetry.pitch ?? '-2.4'}°</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">YAW</span>
        <span className="text-cyan-300 font-mono">{telemetry.yaw ?? '12.8'}°</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">GPS_LOCK</span>
        <span className="text-green-500 font-mono">{telemetry.gpsLock ?? '3D_FIX'}</span>
      </div>
    </>
  );

  const renderSensorProfile = () => (
    <>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">SYS_TEMP</span>
        <span className="text-cyan-300 font-mono">{telemetry.temp ?? '22.5'} °C</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">HUMIDITY</span>
        <span className="text-cyan-300 font-mono">{telemetry.humidity ?? '45'}%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">AIR_QUAL</span>
        <span className="text-green-500 font-mono">{telemetry.airQuality ?? 'GOOD (42 AQI)'}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">UPTIME</span>
        <span className="text-cyan-300 font-mono">{telemetry.uptime ?? '74h 12m'}</span>
      </div>
    </>
  );

  const renderRoboticProfile = () => (
    <>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">JOINT_TORQUE</span>
        <span className="text-cyan-300 font-mono">{telemetry.torque ?? '84.2'} Nm</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">PAYLOAD_WT</span>
        <span className="text-cyan-300 font-mono">{telemetry.payloadWeight ?? '12.5'} kg</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">COLLISION_SENS</span>
        <span className={telemetry.collisionWarning ? 'text-rose-500 font-bold' : 'text-green-500'}>
          {telemetry.collisionWarning ? 'PROXIMITY_ALERT' : 'CLEAR'}
        </span>
      </div>
    </>
  );

  const renderDefaultProfile = () => (
    <>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-400 text-xs">PWR_CELL</span>
          <span className={battery < 20 ? 'text-rose-500 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'text-cyan-300'}>{battery ?? '--'}%</span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${battery < 20 ? 'bg-rose-500' : 'bg-cyan-400'}`}
            style={{ width: `${battery || 0}%` }}
          ></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">UPLINK_SIG</span>
        <span className={isLinkStale ? "text-rose-500 font-mono" : "text-cyan-300 font-mono"}>{signal ?? '--'} dBm</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-xs">RTT_LATENCY</span>
        <span className={ping > 150 ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)] font-bold' : 'text-cyan-300 font-mono'}>{ping ?? '--'} ms</span>
      </div>
    </>
  );

  let profileContent;
  switch (deviceType) {
    case 'UAV':
      profileContent = renderUAVProfile();
      break;
    case 'ENVIRONMENTAL_SENSOR':
      profileContent = renderSensorProfile();
      break;
    case 'ROBOTIC_ARM':
      profileContent = renderRoboticProfile();
      break;
    default:
      profileContent = renderDefaultProfile();
      break;
  }

  return (
    <div className="cyber-panel p-4 w-64 pointer-events-auto">
        <h3 className="text-cyan-400 font-bold tracking-widest mb-3 uppercase text-xs border-b border-cyan-500/30 pb-1 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span>SYS_VITALS</span>
          {isLinkStale && (
            <span className="text-rose-500 text-[10px] animate-pulse drop-shadow-[0_0_3px_rgba(244,63,94,0.8)]">
              [LINK_DEGRADED]
            </span>
          )}
        </div>
        <span className="text-gray-500 text-[10px]">{deviceType || 'AXiM_CORE'}</span>

      </h3>
      
      {/* Vitals Numeric Cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Temp Card */}
        <div className={`flex flex-col items-center justify-center p-2 border rounded transition-colors duration-300 ${telemetry.temp > 85 ? 'border-pink-500/80 bg-pink-950/20 text-pink-400' : 'border-cyan-500/30 bg-cyan-950/10 text-cyan-300'}`}>
          <span className="text-[9px] text-gray-500 mb-1">TEMP</span>
          <span className="text-xs font-mono font-bold">{telemetry.temp ?? '--'}°</span>
        </div>
        {/* CPU Card */}
        <div className={`flex flex-col items-center justify-center p-2 border rounded transition-colors duration-300 ${telemetry.cpuLoad > 90 ? 'border-amber-500/80 bg-amber-950/20 text-amber-400' : 'border-cyan-500/30 bg-cyan-950/10 text-cyan-300'}`}>
          <span className="text-[9px] text-gray-500 mb-1">CPU</span>
          <span className="text-xs font-mono font-bold">{telemetry.cpuLoad ?? '--'}%</span>
        </div>
        {/* Battery Card */}
        <div className={`flex flex-col items-center justify-center p-2 border rounded transition-colors duration-300 ${battery < 15 ? 'border-red-500/80 bg-red-950/30 text-red-400 animate-pulse' : 'border-cyan-500/30 bg-cyan-950/10 text-cyan-300'}`}>
          <span className="text-[9px] text-gray-500 mb-1">BATT</span>
          <span className="text-xs font-mono font-bold">{battery ?? '--'}%</span>
        </div>
      </div>

      <div className="space-y-3 text-sm">

        {profileContent}
      </div>
    </div>
  );
}
