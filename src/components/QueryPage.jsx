import { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { retrieve, listKnowledgebases } from '../api/nexvec';
import { parseKBList } from '../api/utils';

export default function QueryPage() {
  const [query, setQuery]         = useState('');
  const [kbName, setKbName]       = useState('');
  const [k, setK]                 = useState(5);
  const [collections, setCollections] = useState([]);
  const [status, setStatus]       = useState(null);
  const [results, setResults]     = useState([]);
  const [error, setError]         = useState('');

  useEffect(() => {
    listKnowledgebases()
      .then(data => setCollections(parseKBList(data)))
      .catch(() => {});
  }, []);

  const busy = status === 'loading';

  const search = async () => {
    if (!query.trim()) return;
    setStatus('loading'); setError(''); setResults([]);
    try {
      const res = await retrieve({ query: query.trim(), kb_name: kbName || undefined, k });
      // Handle all possible response shapes
      let items = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && typeof res === 'object') {
        const key = ['results', 'matches', 'chunks', 'documents', 'hits', 'data']
          .find(k => Array.isArray(res[k]));
        items = key ? res[key] : [res];
      }
      setResults(items);
      setStatus('success');
    } catch (err) {
      setStatus('error'); setError(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect width="10" height="10" rx="2" fill="#3B6EF5"/>
            <circle cx="4.5" cy="4.5" r="2" stroke="white" strokeWidth="1.2"/>
            <path d="M6 6l1.5 1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          NexVec · Semantic Search
        </div>
        <h1 className="page-title">Search Your Content</h1>
        <p className="page-subtitle">Run semantic queries against your vector knowledge bases.</p>
      </div>

      <div className="card fade-up">
        <div className="field-group">
          <label className="field-label">Query</label>
          <textarea
            className="field"
            style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
            placeholder="e.g. What are the key concepts in chapter 3?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={busy}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) search(); }}
          />
          <p style={{ fontSize: 11, color: '#C0B9B2', marginTop: 5 }}>Press Ctrl+Enter to search</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14, marginBottom: 12 }}>
          <div>
            <label className="field-label">Knowledge Base <span className="opt">optional</span></label>
            <select className="field" value={kbName} onChange={e => setKbName(e.target.value)} disabled={busy}>
              <option value="">All collections</option>
              {collections.map(c => {
                const name = c?.name ?? c;
                return <option key={name} value={name}>{name}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="field-label">Top K</label>
            <input className="field" type="number" min={1} max={50} value={k}
              onChange={e => setK(+e.target.value)} disabled={busy} />
          </div>
        </div>

        <button
          className={`btn-submit${busy ? ' loading' : ''}`}
          onClick={search}
          disabled={busy || !query.trim()}
        >
          {busy ? <><div className="spin" />Searching…</> : <><Search size={15} />Search</>}
        </button>
      </div>

      {status === 'error' && (
        <div className="res-box fade-up" style={{ marginTop: 16, border: '0.5px solid #FECACA' }}>
          <div className="res-box-header" style={{ background: '#FEF2F2', borderBottomColor: '#FECACA' }}>
            <AlertCircle size={16} color="#DC2626" />
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#991B1B' }}>Search Failed</div>
          </div>
          <div className="res-box-body">
            <pre className="res-pre" style={{ color: '#7F1D1D', background: '#FFF7F7' }}>{error}</pre>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div style={{ width: '100%', maxWidth: 560, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#A89C94', marginBottom: 10, fontWeight: 500 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          {results.length === 0 ? (
            <div className="card fade-up" style={{ textAlign: 'center', padding: '32px', color: '#A89C94', fontSize: 13.5 }}>
              No matching chunks found. Try a different query or knowledge base.
            </div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="result-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="result-header">
                  <span className="result-rank">#{i + 1}</span>
                  {(r?.score ?? r?.similarity ?? r?.distance) !== undefined && (
                    <span className="result-score">
                      {(((r?.score ?? r?.similarity ?? r?.distance)) * 100).toFixed(1)}% match
                    </span>
                  )}
                  {r?.metadata?.source && (
                    <span className="result-source">{r.metadata.source}</span>
                  )}
                </div>
                <p className="result-text">
                  {r?.text ?? r?.content ?? r?.chunk ?? r?.passage ?? r?.document ?? JSON.stringify(r, null, 2)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
