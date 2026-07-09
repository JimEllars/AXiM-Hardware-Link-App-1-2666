import { aximCoreClient } from '../lib/supabaseClient';

export async function getRules() {
  const { data, error } = await aximCoreClient
    .from('automation_rules')
    .select('id, name, trigger_type, threshold, action, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get automation rules', error);
    return [];
  }

  return data.map(r => ({
    id: r.id,
    name: r.name,
    triggerType: r.trigger_type,
    threshold: r.threshold,
    action: r.action,
    status: r.status,
    createdAt: r.created_at
  }));
}

export async function addRule(data) {
  const { error } = await aximCoreClient
    .from('automation_rules')
    .insert([{
      name: data.name,
      trigger_type: data.triggerType,
      threshold: data.threshold,
      action: data.action,
      status: 'ACTIVE'
    }]);

  if (error) {
    console.error('Failed to add rule', error);
    throw error;
  }
}

export async function createRule(data) {
  return addRule(data);
}

export async function toggleRule(id, currentStatus) {
  const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  const { error } = await aximCoreClient
    .from('automation_rules')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Failed to toggle rule', error);
    throw error;
  }
}

export async function deleteRule(id) {
  const { error } = await aximCoreClient
    .from('automation_rules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete rule', error);
    throw error;
  }
}
