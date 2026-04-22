export const httpApiCollector = {
  id: 'http_api',
  async collect({ source_input, params }) {
    const method = params.method || 'GET';
    const response = await fetch(source_input, {
      method,
      headers: params.headers || undefined,
      body: params.body ? JSON.stringify(params.body) : undefined
    });

    const contentType = response.headers.get('content-type') || '';
    const raw = contentType.includes('application/json') ? await response.json() : await response.text();

    return {
      raw,
      normalized: {
        status: response.status,
        ok: response.ok,
        payload: raw
      },
      metrics: {
        status: response.status,
        contentType
      }
    };
  }
};