import { aximCoreClient } from '../lib/supabaseClient';

export async function getConnectors() {
  const { data, error } = await aximCoreClient
    .from('system_connectors')
    .select('id, name, type, protocol, endpoint, status, last_sync');

  if (error) {
    console.error('Error fetching connectors:', error);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    protocol: r.protocol,
    endpoint: r.endpoint,
    status: r.status,
    lastSync: r.last_sync
  }));
}

export async function addConnector(data) {
  const { data: result, error } = await aximCoreClient
    .from('system_connectors')
    .insert([{
      name: data.name,
      type: data.type,
      protocol: data.protocol,
      endpoint: data.endpoint,
      status: 'ACTIVE',
      last_sync: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (error) {
    console.error('Error adding connector:', error);
    throw error;
  }
  return result.id;
}

export async function getBridges() {
  const { data, error } = await aximCoreClient
    .from('system_bridges')
    .select('id, connector_id, device_id, stream_mode, created_at');

  if (error) {
    console.error('Error fetching bridges:', error);
    return [];
  }

  return (data || []).map(r => ({
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
    .single();

  if (error) {
    console.error('Error creating bridge:', error);
    throw error;
  }
  return data.id;
}

export async function removeConnector(id) {
  const { error } = await aximCoreClient
    .from('system_connectors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing connector:', error);
    throw error;
  }
}
