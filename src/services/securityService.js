import { aximCoreClient } from '../lib/supabaseClient';

export async function getDevicePolicy(deviceId) {
  const { data, error } = await aximCoreClient
    .from('security_policies')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"

  if (data) {
    return {
      id: data.id,
      deviceId: data.device_id,
      encryption: data.encryption_level,
      authMode: data.auth_mode,
      stealth: data.stealth_mode === 'TRUE' || data.stealth_mode === true,
      updatedAt: data.updated_at
    };
  }
  return { encryption: 'AES-128', authMode: 'MFA', stealth: false };
}

export async function updatePolicy(deviceId, updates) {
  const now = new Date().toISOString();

  // Try to find if policy exists first to do upsert cleanly if needed, or use upsert
  const { error } = await aximCoreClient
    .from('security_policies')
    .upsert({
      device_id: deviceId,
      encryption_level: updates.encryption,
      auth_mode: updates.authMode,
      stealth_mode: updates.stealth.toString(),
      updated_at: now
    }, { onConflict: 'device_id' });

  if (error) throw error;
}

export async function getFirewallRules(deviceId) {
  const { data, error } = await aximCoreClient
    .from('firewall_rules')
    .select('*')
    .eq('device_id', deviceId);

  if (error) throw error;

  return data.map(r => ({
    id: r.id,
    port: r.port,
    protocol: r.protocol,
    action: r.action,
    label: r.label
  }));
}

export async function addFirewallRule(deviceId, rule) {
  const { error } = await aximCoreClient
    .from('firewall_rules')
    .insert([{
      device_id: deviceId,
      port: rule.port,
      protocol: rule.protocol,
      action: rule.action,
      label: rule.label
    }]);

  if (error) throw error;
}
