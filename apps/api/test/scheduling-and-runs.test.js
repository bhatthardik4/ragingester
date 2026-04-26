import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMemoryRepository } from '../src/repository/memory-repository.js';
import { resetRepositoryForTests, setRepositoryForTests } from '../src/repository/index.js';

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeaders(userId) {
  return {
    'content-type': 'application/json',
    'x-user-id': userId
  };
}

test('create card returns 400 when schedule is enabled without cron_expression', async () => {
  setRepositoryForTests(createMemoryRepository());

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/cards`, {
      method: 'POST',
      headers: authHeaders('user-a'),
      body: JSON.stringify({
        source_type: 'identifier_based',
        source_input: 'sensor-no-cron',
        params: {},
        schedule_enabled: true,
        active: true
      })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'cron_expression is required when schedule_enabled is true');
  });

  resetRepositoryForTests();
});

test('schedule preview returns 400 when card has no cron expression', async () => {
  setRepositoryForTests(createMemoryRepository());

  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/cards`, {
      method: 'POST',
      headers: authHeaders('user-a'),
      body: JSON.stringify({
        source_type: 'identifier_based',
        source_input: 'sensor-preview',
        params: {},
        schedule_enabled: false,
        active: true
      })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();

    const previewResponse = await fetch(`${baseUrl}/cards/${created.id}/schedule/preview`, {
      headers: authHeaders('user-a')
    });
    assert.equal(previewResponse.status, 400);
    const body = await previewResponse.json();
    assert.equal(body.error, 'cron_expression is required');
  });

  resetRepositoryForTests();
});

test('manual run succeeds for identifier-based card and can be fetched by owner only', async () => {
  setRepositoryForTests(createMemoryRepository());

  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/cards`, {
      method: 'POST',
      headers: authHeaders('user-a'),
      body: JSON.stringify({
        source_type: 'identifier_based',
        source_input: 'sensor-run',
        params: { unit: 'celsius' },
        schedule_enabled: false,
        active: true
      })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();

    const runResponse = await fetch(`${baseUrl}/cards/${created.id}/run`, {
      method: 'POST',
      headers: authHeaders('user-a')
    });
    assert.equal(runResponse.status, 202);
    const run = await runResponse.json();
    assert.ok(run.id);
    assert.equal(run.owner_id, 'user-a');
    assert.equal(run.status, 'success');
    assert.equal(run.trigger_mode, 'manual');
    assert.equal(run.attempts, 1);

    const getRunResponse = await fetch(`${baseUrl}/runs/${run.id}`, {
      headers: authHeaders('user-a')
    });
    assert.equal(getRunResponse.status, 200);
    const fetchedRun = await getRunResponse.json();
    assert.equal(fetchedRun.id, run.id);

    const foreignGetRunResponse = await fetch(`${baseUrl}/runs/${run.id}`, {
      headers: authHeaders('user-b')
    });
    assert.equal(foreignGetRunResponse.status, 404);
  });

  resetRepositoryForTests();
});

test('manual run returns 409 when an active run already exists for the card', async () => {
  const repository = createMemoryRepository();
  setRepositoryForTests(repository);

  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/cards`, {
      method: 'POST',
      headers: authHeaders('user-a'),
      body: JSON.stringify({
        source_type: 'identifier_based',
        source_input: 'sensor-overlap',
        params: {},
        schedule_enabled: false,
        active: true
      })
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();

    await repository.createRun({
      card_id: created.id,
      owner_id: 'user-a',
      status: 'running',
      trigger_mode: 'manual',
      attempts: 1,
      started_at: new Date().toISOString(),
      ended_at: null,
      error: null,
      logs: []
    });

    const runResponse = await fetch(`${baseUrl}/cards/${created.id}/run`, {
      method: 'POST',
      headers: authHeaders('user-a')
    });
    assert.equal(runResponse.status, 409);
    const body = await runResponse.json();
    assert.equal(body.error, 'card already has an active run');
  });

  resetRepositoryForTests();
});
