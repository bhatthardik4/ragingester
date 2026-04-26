import React from 'react';
import { StatusPill } from './StatusPill';

export function CardList({ cards, onRun, onDelete, onSelect, onEdit, selectedId }) {
  return (
    <div className="panel">
      <h2>Cards</h2>
      {cards.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: '#888888',
          border: '1px dashed #333333',
          borderRadius: '6px',
          marginTop: '16px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.6 }}>📥</div>
          <div>No cards yet.</div>
        </div>
      )}
      {cards.map((card) => (
        <div key={card.id} className="card-item">
          <strong>{card.source_type}</strong>
          <div><strong>job:</strong> {card.params?.job_name || 'unnamed'}</div>
          <div>{card.source_input}</div>
          <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            schedule: <StatusPill active={card.schedule_enabled} label={card.schedule_enabled ? 'Active' : 'Inactive'} />
            {card.schedule_enabled && <span>{`${card.cron_expression} (${card.timezone})`}</span>}
          </div>
          <div className="meta">next run: {card.next_run_at || 'n/a'}</div>
          <div className="meta">last run: {card.last_run_at || 'n/a'}</div>
          <div className="row">
            <button type="button" onClick={() => onRun(card.id)}>Run now</button>
            <button className="secondary" type="button" onClick={() => onEdit(card)}>
              Edit
            </button>
            <button className="secondary" type="button" onClick={() => onSelect(card.id)}>
              {selectedId === card.id ? 'Selected' : 'View runs'}
            </button>
            <button className="secondary" type="button" onClick={() => onDelete(card.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
