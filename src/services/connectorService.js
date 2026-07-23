import { aximCoreClient } from '../lib/supabaseClient';

export async function getConnectors() {
  const { data, error } = await aximCoreClient
    .from('system_connectors')
    .select('*')
    .setHeader('X-AXiM-Internal-Auth', import.meta.env.VITE_AXIM_INTERNAL_KEY || '')
    .setHeader('CF-Ray', `axim-hud-\${Date.now()}`);

  if (error) throw error;

  return data.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    protocol: r.protocol,
    endpoint: r.endpoint,
    status: r.status,
    lastSync: r.last_sync
  }));
}

export async function addConnector(connectorData) {
  const { data, error } = await aximCoreClient
    .from('system_connectors')
    .insert([{
      name: connectorData.name,
      type: connectorData.type,
      protocol: connectorData.protocol,
      endpoint: connectorData.endpoint,
      status: 'ACTIVE',
      last_sync: new Date().toISOString()
    }])
    .select('id')
    .single()
    .setHeader('X-AXiM-Internal-Auth', import.meta.env.VITE_AXIM_INTERNAL_KEY || '')
    .setHeader('CF-Ray', `axim-hud-\${Date.now()}`);

  if (error) throw error;
  return data.id;
}

export async function getBridges() {
  const { data, error } = await aximCoreClient
    .from('system_bridges')
    .select('*')
    .setHeader('X-AXiM-Internal-Auth', import.meta.env.VITE_AXIM_INTERNAL_KEY || '')
    .setHeader('CF-Ray', `axim-hud-\${Date.now()}`);

  if (error) throw error;

  return data.map(r => ({
    id: r.id,
    connectorId: r.connector_id,
    deviceId: r.device_id,
    mode: r.stream_mode,
    createdAt: r.created_at
  }));
}

export async function createBridge(connectorId, deviceId) {
  const { data, error } = await aximCoreClient
    .from('system_bridges')
    .insert([{
      connector_id: connectorId,
      device_id: deviceId,
      stream_mode: 'DUPLEX',
      created_at: new Date().toISOString()
    }])
    .select('id')
    .single()
    .setHeader('X-AXiM-Internal-Auth', import.meta.env.VITE_AXIM_INTERNAL_KEY || '')
    .setHeader('CF-Ray', `axim-hud-\${Date.now()}`);

  if (error) throw error;
  return data.id;
}

export async function removeConnector(id) {
  const { error } = await aximCoreClient
    .from('system_connectors')
    .delete()
    .eq('id', id)
    .setHeader('X-AXiM-Internal-Auth', import.meta.env.VITE_AXIM_INTERNAL_KEY || '')
    .setHeader('CF-Ray', `axim-hud-\${Date.now()}`);

  if (error) throw error;
}
