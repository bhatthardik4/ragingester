import React, { useMemo, useState } from 'react';
import { SOURCE_TYPES } from '@ragingester/shared';

const presets = [
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily 9am', value: '0 9 * * *' },
  { label: 'Weekdays 8am', value: '0 8 * * 1-5' }
];

const sourceOptions = Object.values(SOURCE_TYPES);

const initialForm = {
  source_type: SOURCE_TYPES.HTTP_API,
  source_input: '',
  params: '{}',
  schedule_enabled: false,
  cron_expression: '0 9 * * *',
  timezone: 'America/Chicago',
  active: true
};

export function CardForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const parsedParams = useMemo(() => {
    try {
      return JSON.parse(form.params || '{}');
    } catch {
      return null;
    }
  }, [form.params]);

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!parsedParams) {
      setError('params must be valid JSON');
      return;
    }

    try {
      await onSubmit({
        source_type: form.source_type,
        source_input: form.source_input,
        params: parsedParams,
        schedule_enabled: form.schedule_enabled,
        cron_expression: form.schedule_enabled ? form.cron_expression : null,
        timezone: form.timezone,
        active: form.active
      });
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <div className="panel">
      <h2>Create Card</h2>
      <form onSubmit={submit}>
        <label>Source type</label>
        <select value={form.source_type} onChange={(e) => setForm((f) => ({ ...f, source_type: e.target.value }))}>
          {sourceOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <label>Source URL / Identifier</label>
        <input value={form.source_input} onChange={(e) => setForm((f) => ({ ...f, source_input: e.target.value }))} required />

        <label>Params (JSON)</label>
        <textarea rows={4} value={form.params} onChange={(e) => setForm((f) => ({ ...f, params: e.target.value }))} />

        <div className="grid-2">
          <label>
            <input
              type="checkbox"
              checked={form.schedule_enabled}
              onChange={(e) => setForm((f) => ({ ...f, schedule_enabled: e.target.checked }))}
            />
            {' '}Schedule enabled
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            {' '}Active
          </label>
        </div>

        {form.schedule_enabled && (
          <>
            <label>Preset cron</label>
            <select onChange={(e) => setForm((f) => ({ ...f, cron_expression: e.target.value }))} value={form.cron_expression}>
              {presets.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label} ({preset.value})</option>
              ))}
            </select>

            <label>Custom cron expression</label>
            <input value={form.cron_expression} onChange={(e) => setForm((f) => ({ ...f, cron_expression: e.target.value }))} />

            <label>Timezone</label>
            <input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
          </>
        )}

        {error && <div className="meta">Error: {error}</div>}
        <button disabled={loading} type="submit">{loading ? 'Saving...' : 'Create Card'}</button>
      </form>
    </div>
  );
}