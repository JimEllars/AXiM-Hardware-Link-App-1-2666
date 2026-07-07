import { ensureTab, getRows, appendRow, updateRow, findRowIndexById, deleteRow } from '../lib/googleSheets';

const TABS = {
  CONNECTORS: 'SystemConnectors',
  BRIDGES: 'SystemBridges'
};

const HEADERS = {
  CONNECTORS: ['id', 'name', 'type', 'protocol', 'endpoint', 'status', 'last_sync'],
  BRIDGES: ['id', 'connector_id', 'device_id', 'stream_mode', 'created_at']
};

export async function initConnectorDB() {
  await ensureTab(TABS.CONNECTORS, HEADERS.CONNECTORS);
  await ensureTab(TABS.BRIDGES, HEADERS.BRIDGES);
}

export async function getConnectors() {
  await initConnectorDB();
  const rows = await getRows(`${TABS.CONNECTORS}!A2:G`);
  return rows.map(r => ({
    id: r[0],
    name: r[1],
    type: r[2],
    protocol: r[3],
    endpoint: r[4],
    status: r[5],
    lastSync: r[6]
  }));
}

export async function addConnector(data) {
  await initConnectorDB();
  const id = crypto.randomUUID();
  const row = [id, data.name, data.type, data.protocol, data.endpoint, 'ACTIVE', new Date().toISOString()];
  await appendRow(`${TABS.CONNECTORS}!A:G`, row);
  return id;
}

export async function getBridges() {
  await initConnectorDB();
  const rows = await getRows(`${TABS.BRIDGES}!A2:E`);
  return rows.map(r => ({
    id: r[0],
    connectorId: r[1],
    deviceId: r[2],
    mode: r[3],
    createdAt: r[4]
  }));
}

export async function createBridge(connectorId, deviceId) {
  await initConnectorDB();
  const id = crypto.randomUUID();
  const row = [id, connectorId, deviceId, 'DUPLEX', new Date().toISOString()];
  await appendRow(`${TABS.BRIDGES}!A:E`, row);
  return id;
}

export async function removeConnector(id) {
  await deleteRow(TABS.CONNECTORS, id);
}