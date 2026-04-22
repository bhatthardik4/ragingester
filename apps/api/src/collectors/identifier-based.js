export const identifierBasedCollector = {
  id: 'identifier_based',
  async collect({ source_input, params }) {
    const now = new Date().toISOString();

    return {
      raw: { identifier: source_input, params, observed_at: now },
      normalized: { identifier: source_input, resolved: true, observed_at: now },
      metrics: { synthetic: true }
    };
  }
};