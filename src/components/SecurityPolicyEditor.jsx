import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getDevicePolicy, updatePolicy, getFirewallRules, addFirewallRule } from '../services/securityService';

export function SecurityPolicyEditor({ deviceId }) {
  const [policy, setPolicy] = useState(null);
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [p, r] = await Promise.all([getDevicePolicy(deviceId), getFirewallRules(deviceId)]);
      setPolicy(p);
      setRules(r);
    };
    fetchData();
  }, [deviceId]);

  const handleSave = async () => {
    setSaving(true);
    await updatePolicy(deviceId, policy);
    setSaving(false);
  };

  if (!policy) return <div className="text-cyan-900 animate-pulse">LOADING_POLICY...</div>;

  return (
    <div className="cyber-panel p-6 w-full max-w-4xl h-[550px] flex gap-6 pointer-events-auto">
      <div className="flex-1 flex flex-col">
        <h3 className="text-cyan-400 font-bold tracking-widest uppercase text-sm border-b border-cyan-500/30 pb-2 mb-4 flex items-center">
          <SafeIcon icon={FiIcons.FiLock} className="mr-2" /> NODE_HARDENING
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase">Encryption_Standard</label>
            <select 
              value={policy.encryption}
              onChange={(e) => setPolicy({...policy, encryption: e.target.value})}
              className="w-full bg-black border border-cyan-500/30 p-2 text-xs text-cyan-300 outline-none focus:border-cyan-500"
            >
              <option>AES-128-CBC</option>
              <option>AES-256-GCM</option>
              <option>CHACHA20-POLY1305</option>
              <option>RSA-4096-OAEP</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase">Auth_Protocol</label>
            <div className="grid grid-cols-2 gap-2">
              {['MFA', 'CERT_ONLY', 'BIOMETRIC', 'TOKEN_V2'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => setPolicy({...policy, authMode: mode})}
                  className={`p-2 border text-[10px] transition-all ${policy.authMode === mode ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-800 text-cyan-800 hover:border-cyan-600'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-cyan-500/10 bg-cyan-950/10">
            <div>
              <div className="text-xs font-bold text-white">STEALTH_MODE</div>
              <div className="text-[9px] text-gray-500">Disable ping responses & identifier broadcast</div>
            </div>
            <button 
              onClick={() => setPolicy({...policy, stealth: !policy.stealth})}
              className={`w-10 h-5 rounded-full relative transition-colors ${policy.stealth ? 'bg-cyan-500' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${policy.stealth ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="mt-auto w-full py-3 bg-cyan-500 text-black font-bold uppercase text-xs hover:bg-cyan-400 disabled:opacity-50"
          >
            {saving ? 'COMMITTING_CHANGES...' : 'APPLY_SECURITY_PROFILE'}
          </button>
        </div>
      </div>

      <div className="w-80 flex flex-col border-l border-cyan-500/10 pl-6">
        <h4 className="text-[10px] text-cyan-600 uppercase font-bold mb-4 tracking-widest">FIREWALL_RULES</h4>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {rules.map(rule => (
            <div key={rule.id} className="p-2 border border-cyan-500/10 text-[10px] flex justify-between items-center group">
              <div>
                <div className="font-bold text-cyan-300">{rule.label}</div>
                <div className="text-gray-600">{rule.port}/{rule.protocol}</div>
              </div>
              <span className={`px-1 rounded-sm ${rule.action === 'ALLOW' ? 'bg-green-500/20 text-green-500' : 'bg-rose-500/20 text-rose-500'}`}>
                {rule.action}
              </span>
            </div>
          ))}
        </div>
        <button 
          onClick={() => alert("Rule editor restricted: Elevated privileges required.")}
          className="w-full py-2 border border-dashed border-cyan-500/30 text-[9px] text-cyan-700 hover:text-cyan-500"
        >
          <SafeIcon icon={FiIcons.FiPlus} className="inline mr-1" /> APPEND_NETWORK_RULE
        </button>
      </div>
    </div>
  );
}