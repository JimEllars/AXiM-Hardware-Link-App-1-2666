import React from 'react';

export function VitalsReadout({ battery, signal, ping, deviceType, telemetry = {} }) {
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
        <span className="text-cyan-300 font-mono">{signal ?? '--'} dBm</span>
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
      <h3 className="text-cyan-400 font-bold tracking-widest mb-3 uppercase text-xs border-b border-cyan-500/30 pb-1 flex justify-between">
        <span>SYS_VITALS</span>
        <span className="text-gray-500 text-[10px]">{deviceType || 'AXiM_CORE'}</span>
      </h3>
      
      <div className="space-y-3 text-sm">
        {profileContent}
      </div>
    </div>
  );
}
