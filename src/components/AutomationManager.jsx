import React, { useState, useEffect, useRef } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getRules, addRule, toggleRule } from '../services/automationService';
import { aximCoreClient } from '../lib/supabaseClient';
import { sendBatchCommands, dispatchTelemetryIngress } from '../services/hardwareService';

export function AutomationManager() {
  const [rules, setRules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', triggerType: 'TEMP_HIGH', threshold: '90', action: 'REBOOT' });

  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useEffect(() => {
    loadRules();

    const incidentSub = aximCoreClient.channel('automation-incident-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incident_reports' }, async (payload) => {
        const incident = payload.new;
        const activeRules = rulesRef.current.filter(r => r.status === 'ACTIVE');

        for (const rule of activeRules) {
          if (
            (rule.triggerType === 'SECURITY_BREACH' && incident.type === 'UNAUTHORIZED_CMD') ||
            (rule.triggerType === 'TEMP_HIGH' && incident.severity === 'CRITICAL') // Example mapping
          ) {
            console.log(`[AUTOMATION] Rule ${rule.name} triggered by incident ${incident.id}`);
            if (incident.device_id) {
               await sendBatchCommands([incident.device_id], rule.action);
               await dispatchTelemetryIngress(incident.device_id, { event: 'AUTOMATION_RULE_EXECUTED', rule_id: rule.id });
            }
          }
        }
      })
      .subscribe();

    const telemetrySub = aximCoreClient.channel('automation-telemetry-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemetry_stream' }, async (payload) => {
        const telemetry = payload.new;
        const activeRules = rulesRef.current.filter(r => r.status === 'ACTIVE');

        for (const rule of activeRules) {
          if (rule.triggerType === 'TEMP_HIGH' && parseFloat(telemetry.temp) > parseFloat(rule.threshold)) {
             console.log(`[AUTOMATION] Rule ${rule.name} triggered by telemetry temp ${telemetry.temp}`);
             if (telemetry.device_id) {
                await sendBatchCommands([telemetry.device_id], rule.action);
                await dispatchTelemetryIngress(telemetry.device_id, { event: 'AUTOMATION_RULE_EXECUTED', rule_id: rule.id });
             }
          }
          if (rule.triggerType === 'BATT_LOW' && parseFloat(telemetry.battery) < parseFloat(rule.threshold)) {
             console.log(`[AUTOMATION] Rule ${rule.name} triggered by telemetry batt ${telemetry.battery}`);
             if (telemetry.device_id) {
                await sendBatchCommands([telemetry.device_id], rule.action);
                await dispatchTelemetryIngress(telemetry.device_id, { event: 'AUTOMATION_RULE_EXECUTED', rule_id: rule.id });
             }
          }
        }
      })
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(incidentSub);
      aximCoreClient.removeChannel(telemetrySub);
    };
  }, []);

  const loadRules = async () => {
    const data = await getRules();
    setRules(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addRule(newRule);
    setShowForm(false);
    loadRules();
  };

  return (
    <div className="cyber-panel p-6 w-full max-w-3xl h-[550px] pointer-events-auto flex flex-col">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-6">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-xs flex items-center">
          <SafeIcon icon={FiIcons.FiZap} className="mr-2" /> REACTIVE_PROTOCOLS
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] bg-cyan-500 text-black px-3 py-1 font-black hover:bg-cyan-400"
        >
          {showForm ? 'CANCEL' : 'DEFINE_NEW_RULE'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              placeholder="RULE_NAME" 
              className="w-full bg-black border border-cyan-500/30 p-3 text-xs text-cyan-300 outline-none"
              onChange={e => setNewRule({...newRule, name: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="bg-black border border-cyan-500/30 p-3 text-xs text-cyan-300 outline-none"
                onChange={e => setNewRule({...newRule, triggerType: e.target.value})}
              >
                <option value="TEMP_HIGH">THERMAL_THRESHOLD</option>
                <option value="BATT_LOW">POWER_CRITICAL</option>
                <option value="SIGNAL_LOST">UPLINK_DISCONNECT</option>
                <option value="UNAUTHORIZED_CMD">SECURITY_BREACH</option>
              </select>
              <input 
                placeholder="THRESHOLD_VAL" 
                className="bg-black border border-cyan-500/30 p-3 text-xs text-cyan-300 outline-none"
                onChange={e => setNewRule({...newRule, threshold: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="ACTION_PAYLOAD (e.g. EXECUTE --SHUTDOWN --GRACEFUL)" 
              className="w-full h-32 bg-black border border-cyan-500/30 p-3 text-xs text-cyan-300 outline-none font-mono"
              onChange={e => setNewRule({...newRule, action: e.target.value})}
            />
            <button type="submit" className="w-full py-3 bg-cyan-500 text-black font-bold uppercase text-xs">COMMITT_PROTOCOL_TO_EEPROM</button>
          </form>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="p-4 border border-cyan-500/10 bg-cyan-950/5 flex justify-between items-center group">
                <div>
                  <div className="text-xs font-bold text-white tracking-widest">{rule.name}</div>
                  <div className="text-[9px] text-cyan-700 mt-1 uppercase">
                    IF {rule.triggerType} &gt; {rule.threshold} THEN {rule.action.substring(0, 30)}...
                  </div>
                </div>
                <button 
                  onClick={async () => { await toggleRule(rule.id, rule.status); loadRules(); }}
                  className={`text-[8px] px-2 py-1 border ${rule.status === 'ACTIVE' ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-700'}`}
                >
                  {rule.status}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}