import { useState } from 'react';
import { Search, AlertCircle, User, MapPin, Briefcase, Mail } from 'lucide-react';
import { retrieve } from '../api/nexvec';

function ResultCard({ candidate }) {
  const score = (candidate.similarity_score * 100).toFixed(1);
  return (
    <div className="result-card fade-up">
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="#4F46E5" />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1814' }}>{candidate.name || candidate.source_filename}</div>
            <div style={{ fontSize: 11, color: '#A89C94', display: 'flex', alignItems: 'center', gap: 4 }}>
               <MapPin size={10} /> {candidate.location || 'Unknown Location'}
            </div>
          </div>
        </div>
        <span className="result-score">{score}% match</span>
      </div>
      
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#5C534A' }}>
        {candidate.work_experience_years !== null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Briefcase size={12} /> {candidate.work_experience_years} yrs exp
          </span>
        )}
        {candidate.email && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Mail size={12} /> {candidate.email}
          </span>
        )}
      </div>

      {candidate.skills && candidate.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {candidate.skills.slice(0, 8).map(s => (
            <span key={s} style={{ fontSize: 10.5, fontWeight: 500, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: 99 }}>
              {s}
            </span>
          ))}
          {candidate.skills.length > 8 && <span style={{ fontSize: 10, color: '#A89C94', alignSelf: 'center' }}>+{candidate.skills.length - 8} more</span>}
        </div>
      )}

      {candidate.matched_sections && candidate.matched_sections.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '0.5px solid #F0EDE9', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: '#A89C94', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched:</span>
          {candidate.matched_sections.map(sec => (
            <span key={sec} style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4, textTransform: 'capitalize' }}>
              {sec.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QueryPage() {
  const [query, setQuery]     = useState('');
  const [k, setK]             = useState(5);
  const [status, setStatus]   = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError]     = useState('');

  const busy = status === 'loading';

  const search = async () => {
    if (!query.trim()) return;
    setStatus('loading'); setError(''); setResults([]);
    try {
      const res = await retrieve({ query: query.trim(), k });
      setResults(res.candidates || []);
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
          NexVec · Semantic Match
        </div>
        <h1 className="page-title">Candidate Search</h1>
        <p className="page-subtitle">Describe the role or skills you're looking for to find the best-matched resumes.</p>
      </div>

      <div className="card fade-up">
        <div className="field-group">
          <label className="field-label">Natural Language Query</label>
          <textarea
            className="field"
            style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
            placeholder="e.g. Senior ML Engineer with 4+ years of Python and LLM experience"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={busy}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) search(); }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="field-label">Top Results Count</label>
          <input className="field" type="number" min={1} max={50} value={k}
            onChange={e => setK(+e.target.value)} disabled={busy} style={{ maxWidth: 100 }} />
        </div>

        <button
          className={`btn-submit${busy ? ' loading' : ''}`}
          onClick={search}
          disabled={busy || !query.trim()}
        >
          {busy ? <><div className="spin" />Searching…</> : <><Search size={15} />Run Semantic Match</>}
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
            {results.length} candidate{results.length !== 1 ? 's' : ''} found
          </div>
          {results.length === 0 ? (
            <div className="card fade-up" style={{ textAlign: 'center', padding: '32px', color: '#A89C94', fontSize: 13.5 }}>
              No candidates found matching your query.
            </div>
          ) : (
            results.map((c, i) => (
              <ResultCard key={i} candidate={c} />
            ))
          )}
        </div>
      )}
    </>
  );
}
