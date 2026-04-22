export const websiteUrlCollector = {
  id: 'website_url',
  async collect({ source_input }) {
    const response = await fetch(source_input);
    const html = await response.text();

    return {
      raw: html,
      normalized: {
        title: (html.match(/<title>(.*?)<\/title>/i) || [null, null])[1],
        content_length: html.length,
        status: response.status
      },
      metrics: {
        status: response.status,
        bytes: html.length
      }
    };
  }
};