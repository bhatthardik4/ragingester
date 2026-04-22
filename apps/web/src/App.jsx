import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { CardForm } from './components/CardForm.jsx';
import { CardList } from './components/CardList.jsx';
import { CardFilters } from './components/CardFilters.jsx';
import { RunList } from './components/RunList.jsx';

export function App() {
  const [auth, setAuth] = useState({ token: '', userId: 'dev-user-1' });
  const [cards, setCards] = useState([]);
  const [runs, setRuns] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ jobType: 'all', jobName: '' });

  async function refreshCards() {
    const nextCards = await api.listCards(auth);
    setCards(nextCards);
  }

  async function refreshRuns(cardId) {
    if (!cardId) return;
    const [runRows, previewData] = await Promise.all([
      api.listRuns(auth, cardId),
      api.schedulePreview(auth, cardId).catch(() => null)
    ]);
    setRuns(runRows);
    setPreview(previewData);
  }

  useEffect(() => {
    refreshCards().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(payload) {
    setLoading(true);
    try {
      await api.createCard(auth, payload);
      await refreshCards();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(payload) {
    if (!editingCard) return;
    setLoading(true);
    try {
      await api.updateCard(auth, editingCard.id, payload);
      setEditingCard(null);
      await refreshCards();
      if (selectedCardId === editingCard.id) {
        await refreshRuns(editingCard.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRun(cardId) {
    setError('');
    try {
      await api.runCard(auth, cardId);
      await refreshCards();
      if (selectedCardId === cardId) {
        await refreshRuns(cardId);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(cardId) {
    setError('');
    try {
      await api.deleteCard(auth, cardId);
      if (selectedCardId === cardId) {
        setSelectedCardId('');
        setRuns([]);
        setPreview(null);
      }
      await refreshCards();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelect(cardId) {
    setSelectedCardId(cardId);
    try {
      await refreshRuns(cardId);
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredCards = useMemo(() => {
    const nameNeedle = filters.jobName.trim().toLowerCase();
    return cards.filter((card) => {
      const typeMatch = filters.jobType === 'all' || card.source_type === filters.jobType;
      const jobName = String(card.params?.job_name || '').toLowerCase();
      const sourceName = String(card.source_input || '').toLowerCase();
      const nameMatch = !nameNeedle || jobName.includes(nameNeedle) || sourceName.includes(nameNeedle);
      return typeMatch && nameMatch;
    });
  }, [cards, filters]);

  return (
    <div className="container">
      <div className="panel">
        <h1>Ragingester</h1>
        <div className="meta">Card-based data collection with per-source cron schedules</div>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div>
            <label>Bearer token (optional)</label>
            <input value={auth.token} onChange={(e) => setAuth((a) => ({ ...a, token: e.target.value }))} />
          </div>
          <div>
            <label>Fallback user id</label>
            <input value={auth.userId} onChange={(e) => setAuth((a) => ({ ...a, userId: e.target.value }))} />
          </div>
        </div>
        {error && <div className="meta" style={{ marginTop: 8 }}>Error: {error}</div>}
      </div>

      <CardForm onSubmit={handleCreate} loading={loading} />
      {editingCard && (
        <CardForm
          mode="edit"
          initialCard={editingCard}
          onSubmit={handleUpdate}
          onCancel={() => setEditingCard(null)}
          loading={loading}
        />
      )}
      <CardFilters filters={filters} onChange={setFilters} />
      <CardList
        cards={filteredCards}
        onRun={handleRun}
        onDelete={handleDelete}
        onSelect={handleSelect}
        onEdit={setEditingCard}
        selectedId={selectedCardId}
      />
      <RunList runs={runs} preview={preview} />
    </div>
  );
}
