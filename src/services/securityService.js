import { aximCoreClient } from '../lib/supabaseClient';

export async function getDevicePolicy(deviceId) {
  const { data, error } = await aximCoreClient
    .from('security_policies')
    .select('id, device_id, encryption_level, auth_mode, stealth_mode, updated_at')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching device policy:', error);
    return { encryption: 'AES-128', authMode: 'MFA', stealth: false };
  }

  if (data) {
    return {
      id: data.id,
      deviceId: data.device_id,
      encryption: data.encryption_level,
      authMode: data.auth_mode,
      stealth: data.stealth_mode === true || data.stealth_mode === 'TRUE',
      updatedAt: data.updated_at
    };
  }

  return { encryption: 'AES-128', authMode: 'MFA', stealth: false };
}

export async function updatePolicy(deviceId, updates) {
  const now = new Date().toISOString();

  const { data: existing } = await aximCoreClient
    .from('security_policies')
    .select('id')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (existing) {
    await aximCoreClient
      .from('security_policies')
      .update({
        encryption_level: updates.encryption,
        auth_mode: updates.authMode,
        stealth_mode: updates.stealth,
        updated_at: now
      })
      .eq('id', existing.id);
  } else {
    await aximCoreClient
      .from('security_policies')
      .insert([{
        device_id: deviceId,
        encryption_level: updates.encryption,
        auth_mode: updates.authMode,
        stealth_mode: updates.stealth,
        updated_at: now
      }]);
  }
}

export async function getFirewallRules(deviceId) {
  const { data, error } = await aximCoreClient
    .from('firewall_rules')
    .select('id, device_id, port, protocol, action, label')
    .eq('device_id', deviceId);

  if (error) {
    console.error('Error fetching firewall rules:', error);
    return [];
  }

  return (data || []).map(r => ({
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

  if (error) {
    console.error('Error adding firewall rule:', error);
    throw error;
  }
}
