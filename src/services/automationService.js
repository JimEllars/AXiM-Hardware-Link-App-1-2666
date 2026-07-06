import { aximCoreClient } from '../lib/supabaseClient';

export async function getRules() {
  const { data, error } = await aximCoreClient
    .from('automation_rules')
    .select('id, name, trigger_type, threshold, action_string, status, created_at');

  if (error) {
    console.error('Error fetching automation rules:', error);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    triggerType: r.trigger_type,
    threshold: r.threshold,
    action: r.action_string,
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
      action_string: data.action,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error('Error adding automation rule:', error);
    throw error;
  }
}

export async function toggleRule(id, currentStatus) {
  const { error } = await aximCoreClient
    .from('automation_rules')
    .update({
      status: currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    })
    .eq('id', id);

  if (error) {
    console.error('Error toggling automation rule:', error);
    throw error;
  }
}
