import React, { useState } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { logAudit } from '../services/pentestService';

export function NetworkScanner({ deviceId }) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);

  const startScan = async () => {
    setScanning(true);
    setResults([]);
    
    // Simulate network discovery
    setTimeout(async () => {
      const mockResults = [
        { ssid: 'HIDDEN_UPLINK_04', mac: '00:1A:2B:3C:4D:5E', signal: -65, sec: 'WPA2-PSK' },
        { ssid: 'IOT_GATEWAY_HQ', mac: 'AA:BB:CC:DD:EE:FF', signal: -42, sec: 'OPEN' },
        { ssid: 'SECURE_MESH_V6', mac: '12:34:56:78:90:AB', signal: -88, sec: 'WPA3' }
      ];
      setResults(mockResults);
      setScanning(false);
      
      await logAudit(deviceId, {
        type: 'NET_SCAN',
        target: 'LOCAL_RF_SPACE',
        result: `Discovered ${mockResults.length} access points`,
        severity: 'INFO'
      });
    }, 3000);
  };

  return (
    <div className="cyber-panel p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-cyan-500/30 pb-2">
        <h4 className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase flex items-center">
          <SafeIcon icon={FiIcons.FiWifi} className="mr-2" /> RF_SPECTRUM_ANALYZER
        </h4>
        <button 
          onClick={startScan} 
          disabled={scanning}
          className="text-[9px] bg-cyan-500 text-black px-2 py-1 font-bold hover:bg-cyan-400 disabled:opacity-50"
        >
          {scanning ? 'SCANNING...' : 'INIT_SCAN'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {results.length === 0 && !scanning && (
          <div className="text-[10px] text-gray-600 italic text-center mt-10">READY_FOR_DISCOVERY</div>
        )}
        {results.map((ap, i) => (
          <div key={i} className="border border-cyan-500/10 p-2 text-[10px] bg-cyan-950/10 group hover:border-cyan-500/40">
            <div className="flex justify-between font-bold text-cyan-300">
              <span>{ap.ssid}</span>
              <span className={ap.sec === 'OPEN' ? 'text-rose-500' : 'text-green-500'}>{ap.sec}</span>
            </div>
            <div className="text-[8px] text-gray-500 font-mono mt-1 flex justify-between">
              <span>MAC: {ap.mac}</span>
              <span>SIG: {ap.signal}dBm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}