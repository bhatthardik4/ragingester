export const rssFeedCollector = {
  id: 'rss_feed',
  async collect({ source_input }) {
    const response = await fetch(source_input);
    const xml = await response.text();

    return {
      raw: xml,
      normalized: {
        item_count_estimate: (xml.match(/<item>/g) || []).length,
        status: response.status
      },
      metrics: {
        status: response.status,
        bytes: xml.length
      }
    };
  }
};