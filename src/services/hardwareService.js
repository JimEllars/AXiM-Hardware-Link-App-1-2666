import { ensureTab, getRows, appendRow, appendRows, updateRow, findRowIndexById, deleteRow } from '../lib/googleSheets';

const TABS = {
  REGISTRY: 'HardwareRegistry',
  TELEMETRY: 'TelemetryStream',
  COMMANDS: 'CommandQueue',
  INCIDENTS: 'IncidentReports'
};

const HEADERS = {
  REGISTRY: ['id', 'name', 'type', 'status', 'last_seen', 'created_at'],
  TELEMETRY: ['id', 'device_id', 'battery', 'signal', 'ping', 'cpu', 'temp', 'created_at'],
  COMMANDS: ['id', 'device_id', 'command', 'status', 'created_at', 'updated_at'],
  INCIDENTS: ['id', 'device_id', 'type', 'severity', 'message', 'created_at']
};

export async function initHardwareDB() {
  await ensureTab(TABS.REGISTRY, HEADERS.REGISTRY);
  await ensureTab(TABS.TELEMETRY, HEADERS.TELEMETRY);
  await ensureTab(TABS.COMMANDS, HEADERS.COMMANDS);
  await ensureTab(TABS.INCIDENTS, HEADERS.INCIDENTS);
}

export async function sendCommand(deviceId, command) {
  await initHardwareDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const row = [id, deviceId, command, 'PENDING', now, now];
  await appendRow(`${TABS.COMMANDS}!A:F`, row);
  return id;
}

export async function sendBatchCommands(deviceIds, command) {
  await initHardwareDB();
  const now = new Date().toISOString();
  const rows = deviceIds.map(id => [
    crypto.randomUUID(),
    id,
    command,
    'PENDING',
    now,
    now
  ]);
  await appendRows(`${TABS.COMMANDS}!A:F`, rows);
  return rows.map(r => r[0]);
}

export async function getCommandHistory(deviceId, limit = 50) {
  await initHardwareDB();
  const rows = await getRows(`${TABS.COMMANDS}!A2:F`);
  return rows
    .filter(row => row[1] === deviceId)
    .slice(-limit)
    .reverse()
    .map(row => ({
      id: row[0],
      deviceId: row[1],
      command: row[2],
      status: row[3],
      created_at: row[4],
      updated_at: row[5]
    }));
}

export async function updateCommandStatus(commandId, status) {
  await initHardwareDB();
  const idx = await findRowIndexById(TABS.COMMANDS, commandId);
  if (idx > 0) {
    const rows = await getRows(`${TABS.COMMANDS}!A${idx}:F${idx}`);
    if (rows.length > 0) {
      const row = rows[0];
      const updatedRow = [row[0], row[1], row[2], status, row[4], new Date().toISOString()];
      await updateRow(`${TABS.COMMANDS}!A${idx}:F${idx}`, updatedRow);
    }
  }
}

export async function removeCommand(commandId) {
  await deleteRow(TABS.COMMANDS, commandId);
}

export async function getFleet() {
  await initHardwareDB();
  const rows = await getRows(`${TABS.REGISTRY}!A2:F`);
  return rows.map(row => ({
    id: row[0],
    name: row[1],
    type: row[2],
    status: row[3],
    last_seen: row[4],
    created_at: row[5]
  }));
}

export async function updateDeviceName(deviceId, newName) {
  await initHardwareDB();
  const idx = await findRowIndexById(TABS.REGISTRY, deviceId);
  if (idx > 0) {
    const fleet = await getFleet();
    const device = fleet.find(d => d.id === deviceId);
    if (device) {
      const row = [device.id, newName, device.type, device.status, device.last_seen, device.created_at];
      await updateRow(`${TABS.REGISTRY}!A${idx}:F${idx}`, row);
    }
  }
}

export async function registerDevice(device) {
  await initHardwareDB();
  const existingIdx = await findRowIndexById(TABS.REGISTRY, device.id);
  const now = new Date().toISOString();
  const row = [device.id, device.name || 'Unnamed Node', device.type || 'DRONE', device.status || 'ONLINE', now, device.created_at || now];
  if (existingIdx > 0) {
    await updateRow(`${TABS.REGISTRY}!A${existingIdx}:F${existingIdx}`, row);
  } else {
    await appendRow(`${TABS.REGISTRY}!A:F`, row);
  }
}

export async function logTelemetry(deviceId, data) {
  await initHardwareDB();
  const row = [crypto.randomUUID(), deviceId, data.battery.toString(), data.signal.toString(), data.ping.toString(), data.cpu.toString(), data.temp.toString(), new Date().toISOString()];
  await appendRow(`${TABS.TELEMETRY}!A:H`, row);
}

export async function logIncident(deviceId, incident) {
  await initHardwareDB();
  const id = crypto.randomUUID();
  const row = [
    id, 
    deviceId, 
    incident.type || 'UNKNOWN_ERROR', 
    incident.severity || 'WARNING', 
    incident.message || '', 
    new Date().toISOString()
  ];
  await appendRow(`${TABS.INCIDENTS}!A:F`, row);
  return id;
}

export async function getIncidents(deviceId, limit = 20) {
  await initHardwareDB();
  const rows = await getRows(`${TABS.INCIDENTS}!A2:F`);
  return rows
    .filter(row => row[1] === deviceId)
    .slice(-limit)
    .reverse()
    .map(row => ({
      id: row[0],
      type: row[2],
      severity: row[3],
      message: row[4],
      timestamp: row[5]
    }));
}

export async function getTelemetryHistory(deviceId, limit = 10) {
  await initHardwareDB();
  const allRows = await getRows(`${TABS.TELEMETRY}!A2:H`);
  return allRows
    .filter(row => row[1] === deviceId)
    .slice(-limit)
    .reverse()
    .map(row => ({
      id: row[0],
      battery: row[2],
      signal: row[3],
      ping: row[4],
      cpu: row[5],
      temp: row[6],
      timestamp: row[7]
    }));
}