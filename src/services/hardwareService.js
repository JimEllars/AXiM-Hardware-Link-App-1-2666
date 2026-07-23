import { aximCoreClient } from '../lib/supabaseClient';

export async function sendCommand(deviceId, command) {
  const { data, error } = await aximCoreClient
    .from('command_queue')
    .insert([{
      device_id: deviceId,
      command: command,
      status: 'PENDING'
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function sendBatchCommands(deviceIds, commandString) {
  try {
    const payloads = deviceIds.map(id => ({
      device_id: id,
      command: commandString,
      status: 'PENDING',
      created_at: new Date().toISOString()
    }));

    const { data, error } = await aximCoreClient
      .from('command_queue')
      .insert(payloads)
      .select('id');

    if (error) throw error;

    return data ? data.map(r => r.id) : [];
  } catch (err) {
    throw err;
  }
}

export async function getCommandHistory(deviceId, limit = 50) {
  const { data, error } = await aximCoreClient
    .from('command_queue')
    .select('id, device_id, command, status, created_at, updated_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    deviceId: row.device_id,
    command: row.command,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function updateCommandStatus(commandId, status) {
  const { error } = await aximCoreClient
    .from('command_queue')
    .update({
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', commandId);

  if (error) throw error;
}

export async function removeCommand(commandId) {
  const { error } = await aximCoreClient
    .from('command_queue')
    .delete()
    .eq('id', commandId);

  if (error) throw error;
}

export async function getFleet() {
  const { data, error } = await aximCoreClient
    .from('hardware_registry')
    .select('id, name, type, status, last_seen, created_at');

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    last_seen: row.last_seen,
    created_at: row.created_at
  }));
}

export async function updateDeviceName(deviceId, newName) {
  const { error } = await aximCoreClient
    .from('hardware_registry')
    .update({ name: newName })
    .eq('id', deviceId);

  if (error) throw error;
}

export async function registerDevice(device) {
  const now = new Date().toISOString();

  const { error } = await aximCoreClient
    .from('hardware_registry')
    .upsert({
      id: device.id,
      name: device.name || 'Unnamed Node',
      type: device.type || 'DRONE',
      status: device.status || 'ONLINE',
      last_seen: now,
      created_at: device.created_at || now
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function logTelemetry(deviceId, data) {
  const { error } = await aximCoreClient
    .from('telemetry_stream')
    .insert([{
      device_id: deviceId,
      battery: data.battery.toString(),
      signal: data.signal.toString(),
      ping: data.ping.toString(),
      cpu: data.cpu.toString(),
      temp: data.temp.toString(),
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
}

export async function logIncident(deviceId, incident) {
  const { data, error } = await aximCoreClient
    .from('incident_reports')
    .insert([{
      device_id: deviceId,
      type: incident.type || 'UNKNOWN_ERROR',
      severity: incident.severity || 'WARNING',
      message: incident.message || '',
      created_at: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getIncidents(deviceId, limit = 20) {
  const { data, error } = await aximCoreClient
    .from('incident_reports')
    .select('id, device_id, type, severity, message, created_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    timestamp: row.created_at
  }));
}

export async function getTelemetryHistory(deviceId, limit = 10) {
  const { data, error } = await aximCoreClient
    .from('telemetry_stream')
    .select('id, device_id, battery, signal, ping, cpu, temp, created_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    battery: row.battery,
    signal: row.signal,
    ping: row.ping,
    cpu: row.cpu,
    temp: row.temp,
    timestamp: row.created_at
  }));
}

export const dispatchTelemetryIngress = async (deviceId, diagnosticFrame) => {
  const payload = {
    device_id: deviceId,
    telemetry: diagnosticFrame,
    timestamp: new Date().toISOString(),
    source: 'AXiM_HARDWARE_LINK_HUD'
  };
  return await aximCoreClient.functions.invoke('telemetry-ingress', {
    body: payload
  });
};

export async function inspectVideoFrameWithWorkersAi(deviceId, imageBlob) {
  try {
    const formData = new FormData();
    formData.append('file', imageBlob, `frame_${deviceId}_${Date.now()}.png`);
    formData.append('model', '@cf/moondream/moondream3.1-9b-a2b');
    formData.append('prompt', 'Inspect hardware for physical damage, smoke, thermal stress, or structural alignment anomalies.');

    const workerUrl = import.meta.env.VITE_WORKER_INGRESS_URL || 'https://api.axim.us.com';
    const res = await fetch(`${workerUrl}/v1/ai/vision-inspect`, {
      method: 'POST',
      headers: {
        'X-AXiM-Internal-Auth': import.meta.env.VITE_AXIM_INTERNAL_KEY || ''
      },
      body: formData
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[WORKERS_AI] Vision frame inspection bypassed:', e);
  }
  return null;
}
