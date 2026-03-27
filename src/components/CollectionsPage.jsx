import { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { listKnowledgebases } from '../api/nexvec';
import { parseKBList } from '../api/utils';

function CollectionCard({ collection }) {
  const name = collection?.name ?? collection;
  const docs  = collection?.document_count ?? collection?.documents ?? '—';
  const vecs  = collection?.vector_count   ?? collection?.vectors   ?? '—';
  const model = collection?.embedding_model ?? null;

  return (
    <div className="collection-card">
      <div className="collection-card-header">
        <div className="collection-icon">
          <Database size={16} color="#3B6EF5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="collection-name" title={name}>{name}</div>
          {model && <div className="collection-model">{model}</div>}
        </div>
      </div>
      <div className="collection-stats">
        <div className="cstat">
          <div className="cstat-num">{typeof vecs === 'number' ? vecs.toLocaleString() : vecs}</div>
          <div className="cstat-lbl">Vectors</div>
        </div>
        <div className="cstat-div" />
        <div className="cstat">
          <div className="cstat-num">{typeof docs === 'number' ? docs.toLocaleString() : docs}</div>
          <div className="cstat-lbl">Documents</div>
        </div>
        {collection?.created_at && (
          <>
            <div className="cstat-div" />
            <div className="cstat">
              <div className="cstat-num" style={{ fontSize: 11 }}>
                {new Date(collection.created_at).toLocaleDateString()}
              </div>
              <div className="cstat-lbl">Created</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [status, setStatus]           = useState('loading');
  const [error, setError]             = useState('');

  const load = async () => {
    setStatus('loading'); setError('');
    try {
      const data = await listKnowledgebases();
      setCollections(parseKBList(data));
      setStatus('success');
    } catch (err) {
      setStatus('error'); setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect width="10" height="10" rx="2" fill="#3B6EF5"/>
            <rect x="2.5" y="2.5" width="2" height="2" rx="0.5" fill="white"/>
            <rect x="5.5" y="2.5" width="2" height="2" rx="0.5" fill="white" opacity="0.6"/>
            <rect x="2.5" y="5.5" width="2" height="2" rx="0.5" fill="white" opacity="0.6"/>
            <rect x="5.5" y="5.5" width="2" height="2" rx="0.5" fill="white" opacity="0.3"/>
          </svg>
          NexVec · Collections
        </div>
        <h1 className="page-title">Knowledge Bases</h1>
        <p className="page-subtitle">All vector collections stored in your NexVec instance.</p>
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button className="btn-sm" onClick={load} disabled={status === 'loading'}>
            <RefreshCw size={12} className={status === 'loading' ? 'spin-slow' : ''} />
            Refresh
          </button>
        </div>

        {status === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="spin-blue" style={{ width: 24, height: 24, borderWidth: 3 }} />
          </div>
        )}

        {status === 'error' && (
          <div className="res-box fade-up" style={{ border: '0.5px solid #FECACA' }}>
            <div className="res-box-header" style={{ background: '#FEF2F2', borderBottomColor: '#FECACA' }}>
              <AlertCircle size={16} color="#DC2626" />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#991B1B' }}>Failed to load collections</div>
            </div>
            <div className="res-box-body">
              <pre className="res-pre" style={{ color: '#7F1D1D', background: '#FFF7F7' }}>{error}</pre>
            </div>
          </div>
        )}

        {status === 'success' && collections.length === 0 && (
          <div className="card fade-up" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <Database size={32} color="#D5CFC9" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: '#5C534A', marginBottom: 6 }}>No collections yet</div>
            <div style={{ fontSize: 13, color: '#A89C94' }}>Ingest a PDF to create your first knowledge base.</div>
          </div>
        )}

        {status === 'success' && collections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {collections.map((c, i) => (
              <div key={c?.name ?? i} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <CollectionCard collection={c} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
