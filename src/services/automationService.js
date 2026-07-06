import { ensureTab, getRows, appendRow, updateRow, deleteRow, findRowIndexById } from '../lib/googleSheets';

const TAB = 'AutomationRules';
const HEADERS = ['id', 'name', 'trigger_type', 'threshold', 'action_string', 'status', 'created_at'];

export async function initAutomationDB() {
  await ensureTab(TAB, HEADERS);
}

export async function getRules() {
  await initAutomationDB();
  const rows = await getRows(`${TAB}!A2:G`);
  return rows.map(r => ({
    id: r[0],
    name: r[1],
    triggerType: r[2],
    threshold: r[3],
    action: r[4],
    status: r[5],
    createdAt: r[6]
  }));
}

export async function addRule(data) {
  await initAutomationDB();
  const row = [
    crypto.randomUUID(),
    data.name,
    data.triggerType,
    data.threshold,
    data.action,
    'ACTIVE',
    new Date().toISOString()
  ];
  await appendRow(`${TAB}!A:G`, row);
}

export async function toggleRule(id, currentStatus) {
  const idx = await findRowIndexById(TAB, id);
  if (idx > 0) {
    const rows = await getRows(`${TAB}!A${idx}:G${idx}`);
    const row = rows[0];
    row[5] = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await updateRow(`${TAB}!A${idx}:G${idx}`, row);
  }
}