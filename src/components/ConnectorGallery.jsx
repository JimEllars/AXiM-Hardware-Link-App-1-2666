import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const PREBUILT = [
  { type: 'INDUSTRIAL', name: 'SCADA_BRIDGE_V4', protocol: 'MODBUS/TCP', icon: FiIcons.FiHardDrive, endpoint: '192.168.1.50:502' },
  { type: 'IOT', name: 'MQTT_BROKER_GLOBAL', protocol: 'MQTT/MQTTS', icon: FiIcons.FiShare2, endpoint: 'broker.axim.io:8883' },
  { type: 'SATELLITE', name: 'IRIDIUM_UPLINK_01', protocol: 'SAT_COM_V2', icon: FiIcons.FiZap, endpoint: 'SAT_NODE_ALPHA' },
  { type: 'CLOUD', name: 'AWS_KINESIS_BRIDGE', protocol: 'HTTPS/REST', icon: FiIcons.FiCloud, endpoint: 'kinesis.us-east-1.aws' }
];

export function ConnectorGallery({ onAdd }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {PREBUILT.map((tpl, i) => (
        <button 
          key={i}
          onClick={() => onAdd(tpl)}
          className="text-left p-4 border border-cyan-500/10 bg-black/40 hover:bg-cyan-500/5 hover:border-cyan-500/40 transition-all group"
        >
          <div className="flex items-center mb-2">
            <SafeIcon icon={tpl.icon} className="text-cyan-700 group-hover:text-cyan-400 mr-3" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase">{tpl.name}</span>
          </div>
          <p className="text-[8px] text-gray-600 group-hover:text-cyan-800 leading-tight">PRE-CONFIGURED CONNECTOR FOR {tpl.type} PROTOCOLS.</p>
        </button>
      ))}
    </div>
  );
}