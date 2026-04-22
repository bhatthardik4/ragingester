import React from 'react';

export function CardList({ cards, onRun, onDelete, onSelect, selectedId }) {
  return (
    <div className="panel">
      <h2>Cards</h2>
      {cards.length === 0 && <div className="meta">No cards yet.</div>}
      {cards.map((card) => (
        <div key={card.id} className="card-item">
          <strong>{card.source_type}</strong>
          <div>{card.source_input}</div>
          <div className="meta">
            schedule: {card.schedule_enabled ? `${card.cron_expression} (${card.timezone})` : 'disabled'}
          </div>
          <div className="meta">next run: {card.next_run_at || 'n/a'}</div>
          <div className="meta">last run: {card.last_run_at || 'n/a'}</div>
          <div className="row">
            <button type="button" onClick={() => onRun(card.id)}>Run now</button>
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