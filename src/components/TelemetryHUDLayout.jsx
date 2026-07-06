import React, { useState } from 'react';
import { WebRTCVideoLayer } from './WebRTCVideoLayer';
import { VitalsReadout } from './VitalsReadout';
import { SensorGraphs } from './SensorGraphs';
import { SpatialMapOverlay } from './SpatialMapOverlay';
import { OverrideTerminal } from './OverrideTerminal';
import { FleetManager } from './FleetManager';
import { NotificationSystem } from './NotificationSystem';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { HistoryLog } from './HistoryLog';
import { AlertArchive } from './AlertArchive';
import { FleetOverview } from './FleetOverview';
import { CommandManager } from './CommandManager';
import { BatchCommandCenter } from './BatchCommandCenter';
import { PentestDashboard } from './PentestDashboard';
import { SecurityPolicyEditor } from './SecurityPolicyEditor';
import { MissionControl } from './MissionControl';
import { SystemConnectorHUD } from './SystemConnectorHUD';
import { NetworkTopology } from './NetworkTopology';
import { AutomationManager } from './AutomationManager';
import { GlobalAuditLog } from './GlobalAuditLog';
import { useTelemetryStream } from '../hooks/useTelemetryStream';
import { useHardwareSimulator } from '../hooks/useHardwareSimulator';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

export function TelemetryHUDLayout() {
  const [activeDeviceId, setActiveDeviceId] = useState('DRONE_01_ALPHA');
  const [showFleet, setShowFleet] = useState(false);
  const [activeTab, setActiveTab] = useState('HUD'); 
  
  const telemetry = useTelemetryStream(activeDeviceId);
  useHardwareSimulator(activeDeviceId);

  const TABS = ['HUD', 'LOGS', 'ALERTS', 'FLEET', 'CMDS', 'BATCH', 'PENTEST', 'SECURITY', 'OPS', 'CONNECT', 'TOPOLOGY', 'AUTO', 'STREAM'];

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-mono selection:bg-cyan-500/30">
      <WebRTCVideoLayer deviceId={activeDeviceId} />
      <NotificationSystem telemetry={telemetry} />

      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
        <div className="flex justify-between items-start">
          <div className="flex flex-col space-y-4">
            <div className="cyber-panel p-2 flex items-center space-x-4 pointer-events-auto">
              <button 
                onClick={() => setShowFleet(!showFleet)}
                className={`p-2 border transition-all ${showFleet ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-500 hover:border-cyan-500'}`}
              >
                <SafeIcon icon={FiIcons.FiMenu} />
              </button>
              <div>
                <h1 className="text-white text-sm font-bold tracking-widest uppercase">AXiM_CORE // {activeDeviceId}</h1>
                <div className="flex flex-wrap gap-1 mt-1 max-w-[500px]">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[8px] px-2 py-0.5 border ${activeTab === tab ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'border-cyan-800 text-cyan-800 hover:text-cyan-400'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showFleet && (
              <FleetManager 
                selectedId={activeDeviceId} 
                onSelectNode={(id) => { setActiveDeviceId(id); setShowFleet(false); }} 
              />
            )}

            {!showFleet && activeTab === 'HUD' && (
              <>
                <VitalsReadout battery={telemetry.battery} signal={telemetry.signal} ping={telemetry.ping} />
                <DiagnosticsPanel deviceId={activeDeviceId} telemetry={telemetry} />
              </>
            )}

            {!showFleet && activeTab === 'LOGS' && <HistoryLog deviceId={activeDeviceId} />}
            {!showFleet && activeTab === 'ALERTS' && <AlertArchive deviceId={activeDeviceId} />}
            {!showFleet && activeTab === 'CMDS' && <CommandManager deviceId={activeDeviceId} />}
          </div>

          <div className="flex flex-col space-y-4 items-end">
            <div className="cyber-panel px-3 py-1 pointer-events-auto flex items-center space-x-4 text-[10px]">
              <div className="flex items-center text-green-500 font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                G_SHEETS_LINK: ONLINE
              </div>
              <div className="text-gray-500">|</div>
              <div className="text-cyan-400">{new Date().toLocaleTimeString()}</div>
            </div>
            {activeTab === 'HUD' && <SensorGraphs telemetryHistory={telemetry.history} />}
          </div>
        </div>

        {!showFleet && !['HUD', 'LOGS', 'ALERTS', 'CMDS'].includes(activeTab) && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            {activeTab === 'FLEET' && <FleetOverview />}
            {activeTab === 'BATCH' && <BatchCommandCenter />}
            {activeTab === 'PENTEST' && <PentestDashboard deviceId={activeDeviceId} />}
            {activeTab === 'SECURITY' && <SecurityPolicyEditor deviceId={activeDeviceId} />}
            {activeTab === 'OPS' && <MissionControl />}
            {activeTab === 'CONNECT' && <SystemConnectorHUD />}
            {activeTab === 'TOPOLOGY' && <NetworkTopology />}
            {activeTab === 'AUTO' && <AutomationManager />}
            {activeTab === 'STREAM' && <GlobalAuditLog />}
          </div>
        )}

        <div className="flex justify-between items-end">
          <OverrideTerminal deviceId={activeDeviceId} />
          <div className="flex flex-col items-end space-y-4">
            <div className="cyber-panel p-2 pointer-events-auto text-[9px] text-cyan-700 uppercase tracking-tighter">
              Telemetry_Buffer: {telemetry.history.length}/20 frames
            </div>
            <SpatialMapOverlay />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-40"></div>
    </div>
  );
}