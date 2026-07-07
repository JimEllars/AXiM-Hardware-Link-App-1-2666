import { ensureTab, getRows, appendRow, updateRow, findRowIndexById } from '../lib/googleSheets';

const TABS = {
  POLICIES: 'SecurityPolicies',
  FIREWALL: 'FirewallRules'
};

const HEADERS = {
  POLICIES: ['id', 'device_id', 'encryption_level', 'auth_mode', 'stealth_mode', 'updated_at'],
  FIREWALL: ['id', 'device_id', 'port', 'protocol', 'action', 'label']
};

export async function initSecurityDB() {
  await ensureTab(TABS.POLICIES, HEADERS.POLICIES);
  await ensureTab(TABS.FIREWALL, HEADERS.FIREWALL);
}

export async function getDevicePolicy(deviceId) {
  await initSecurityDB();
  const rows = await getRows(`${TABS.POLICIES}!A2:F`);
  const policy = rows.find(r => r[1] === deviceId);
  if (policy) {
    return {
      id: policy[0],
      deviceId: policy[1],
      encryption: policy[2],
      authMode: policy[3],
      stealth: policy[4] === 'TRUE',
      updatedAt: policy[5]
    };
  }
  return { encryption: 'AES-128', authMode: 'MFA', stealth: false };
}

export async function updatePolicy(deviceId, updates) {
  await initSecurityDB();
  const idx = await findRowIndexById(TABS.POLICIES, deviceId); // Use findRowIndexById on the ID column
  // Note: findRowIndexById scans Col A. If deviceId is in Col B, we need custom logic.
  // Let's refine findRowIndexById usage or create a helper.
  const allRows = await getRows(`${TABS.POLICIES}!A:F`);
  const rowIndex = allRows.findIndex(r => r[1] === deviceId) + 1;

  const now = new Date().toISOString();
  const row = [crypto.randomUUID(), deviceId, updates.encryption, updates.authMode, updates.stealth.toString(), now];

  if (rowIndex > 0) {
    await updateRow(`${TABS.POLICIES}!A${rowIndex}:F${rowIndex}`, row);
  } else {
    await appendRow(`${TABS.POLICIES}!A:F`, row);
  }
}

export async function getFirewallRules(deviceId) {
  await initSecurityDB();
  const rows = await getRows(`${TABS.FIREWALL}!A2:F`);
  return rows
    .filter(r => r[1] === deviceId)
    .map(r => ({ id: r[0], port: r[2], protocol: r[3], action: r[4], label: r[5] }));
}

export async function addFirewallRule(deviceId, rule) {
  await initSecurityDB();
  const row = [crypto.randomUUID(), deviceId, rule.port, rule.protocol, rule.action, rule.label];
  await appendRow(`${TABS.FIREWALL}!A:F`, row);
}