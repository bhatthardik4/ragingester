import { createClient } from '@supabase/supabase-js';

export function createSupabaseRepository({ supabaseUrl, serviceRoleKey }) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  function unwrap(result) {
    if (result.error) throw result.error;
    return result.data;
  }

  return {
    async listCards(ownerId) {
      return unwrap(await supabase.from('cards').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }));
    },

    async getCardById(cardId, ownerId) {
      return unwrap(await supabase.from('cards').select('*').eq('id', cardId).eq('owner_id', ownerId).maybeSingle());
    },

    async createCard(payload) {
      return unwrap(await supabase.from('cards').insert(payload).select('*').single());
    },

    async updateCard(cardId, updates) {
      return unwrap(await supabase.from('cards').update(updates).eq('id', cardId).select('*').maybeSingle());
    },

    async deleteCard(cardId, ownerId) {
      const data = unwrap(await supabase.from('cards').delete().eq('id', cardId).eq('owner_id', ownerId).select('id'));
      return data.length > 0;
    },

    async listRuns(cardId, ownerId) {
      return unwrap(await supabase.from('collection_runs').select('*').eq('card_id', cardId).eq('owner_id', ownerId).order('created_at', { ascending: false }));
    },

    async createRun(payload) {
      return unwrap(await supabase.from('collection_runs').insert(payload).select('*').single());
    },

    async updateRun(runId, updates) {
      return unwrap(await supabase.from('collection_runs').update(updates).eq('id', runId).select('*').maybeSingle());
    },

    async getRunById(runId, ownerId) {
      return unwrap(await supabase.from('collection_runs').select('*').eq('id', runId).eq('owner_id', ownerId).maybeSingle());
    },

    async getActiveRunForCard(cardId) {
      return unwrap(await supabase.from('collection_runs').select('*').eq('card_id', cardId).eq('status', 'running').limit(1).maybeSingle());
    },

    async listDueCards(atIso) {
      return unwrap(
        await supabase
          .from('cards')
          .select('*')
          .eq('active', true)
          .eq('schedule_enabled', true)
          .not('next_run_at', 'is', null)
          .lte('next_run_at', atIso)
      );
    },

    async createCollectedData(payload) {
      return unwrap(await supabase.from('collected_data').insert(payload).select('*').single());
    }
  };
}