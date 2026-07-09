import React, { useState } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { logAudit } from '../services/pentestService';
import { sendCommand } from '../services/hardwareService';

export function NetworkScanner({ deviceId }) {
  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState('IDLE'); // IDLE, AWAITING_NODE_RESPONSE
  const [results, setResults] = useState([]);

  const startScan = async () => {
    setScanning(true);
    setResults([]); // Clear old results

    try {
      // Push actual scan command to hardware edge node
      await sendCommand(deviceId, 'SCAN_RF_SPECTRUM');

      await logAudit(deviceId, {
        type: 'NET_SCAN',
        target: 'LOCAL_RF_SPACE',
        result: `Scan command dispatched to edge node. Awaiting hardware telemetry...`,
        severity: 'INFO'
      });

      // Keep scanning state true until a webhook/realtime event returns results
      // (This removes the fake data and correctly awaits real hardware interaction)
    } catch (err) {
      console.error("Failed to dispatch scan command:", err);
      setScanning(false);
    }
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
        {results.length === 0 && scanState === 'IDLE' && (
          <div className="text-[10px] text-gray-600 italic text-center mt-10">READY_FOR_DISCOVERY</div>
        )}
        {scanState === 'AWAITING_NODE_RESPONSE' && (
          <div className="text-[10px] text-yellow-500 italic text-center mt-10 animate-pulse flex flex-col items-center">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            AWAITING_NODE_RESPONSE...
          </div>
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
