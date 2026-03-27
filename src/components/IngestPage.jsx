import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle2, AlertCircle, RotateCcw, Copy, CheckCheck, User, Briefcase, Calendar } from 'lucide-react';
import { ingest } from '../api/nexvec';

const STAGES = ['Uploading', 'Parsing', 'Embedding', 'Storing'];

function DropZone({ file, setFile, disabled }) {
  const onDrop = useCallback((f) => { if (f[0]) setFile(f[0]); }, [setFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled,
  });
  const fmt = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div
      {...getRootProps()}
      className={`drop-area${file ? ' filled' : ''}${isDragActive ? ' over' : ''}`}
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      <input {...getInputProps()} />
      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="dz-icon-bg" style={{ margin: 0, width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B6EF5" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1A1814', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: 12, color: '#A89C94', marginTop: 3 }}>
              PDF · {fmt(file.size)} · Ready to ingest
            </div>
          </div>
          {!disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              style={{ background: '#F0EDE9', border: '0.5px solid #E0DAD4', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#A89C94', flexShrink: 0, display: 'flex', fontSize: 13 }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div style={{ pointerEvents: 'none' }}>
          <div className="dz-icon-bg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A89C94" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="dz-title">
            {isDragActive ? 'Release to drop' : <>Drop PDF resume here, or <span className="dz-link">click to browse</span></>}
          </p>
          <p className="dz-sub">PDF resumes only</p>
        </div>
      )}
    </div>
  );
}

export default function IngestPage({ onRefresh }) {
  const [file, setFile]           = useState(null);
  const [model, setModel]         = useState('');
  const [status, setStatus]       = useState(null);
  const [stage, setStage]         = useState(0);
  const [response, setResponse]   = useState(null);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);

  const canSubmit = file !== null;
  const busy = status === 'loading';

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('loading'); setError(''); setResponse(null); setStage(0);
    let s = 0;
    const t = setInterval(() => { s++; if (s < STAGES.length) setStage(s); else clearInterval(t); }, 800);
    try {
      const res = await ingest({
        file,
        embedding_model: model || undefined,
      });
      clearInterval(t); setStage(STAGES.length - 1);
      setStatus('success'); setResponse(res);
      onRefresh?.();
    } catch (err) {
      clearInterval(t); setStatus('error'); setError(err.message);
    }
  };

  const reset = () => { setStatus(null); setError(''); setResponse(null); setStage(0); setFile(null); };

  const copyResponse = () => {
    navigator.clipboard.writeText(typeof response === 'string' ? response : JSON.stringify(response, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect width="10" height="10" rx="2" fill="#3B6EF5"/>
            <path d="M3 5h4M5 3v4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          NexVec · Resume Ingestion
        </div>
        <h1 className="page-title">Ingest Resume</h1>
        <p className="page-subtitle">
          Upload a resume to automatically parse sections and store it in your searchable vector pool.
        </p>
      </div>

      <div className="card fade-up" style={{ padding: '28px' }}>
        <div>
          <label className="field-label" style={{ marginBottom: 8 }}>PDF Resume File</label>
          <DropZone file={file} setFile={setFile} disabled={busy} />
        </div>

        <div className="field-group">
          <label className="field-label">Embedding Model <span className="opt">optional</span></label>
          <select className="field" value={model} onChange={e => setModel(e.target.value)} disabled={busy}>
            <option value="">Server default (Gemini Flash)</option>
            <option value="models/text-embedding-004">Text-embedding-004</option>
            <option value="models/embedding-001">Embedding-001</option>
          </select>
        </div>

        {busy && (
          <div className="stages" style={{ marginBottom: 16 }}>
            {STAGES.map((lbl, i) => (
              <div key={lbl} className={`stage${i < stage ? ' done' : i === stage ? ' active' : ''}`}>
                {i < stage ? <CheckCircle2 size={12} /> : i === stage ? <div className="spin-blue" /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #E0DAD4' }} />}
                {lbl}
              </div>
            ))}
          </div>
        )}

        <button
          className={`btn-submit${status === 'success' ? ' success' : busy ? ' loading' : ''}`}
          onClick={status === 'success' ? reset : submit}
          disabled={busy || (!canSubmit && status !== 'success')}
        >
          {busy ? <><div className="spin" />Ingesting…</> : status === 'success' ? <><RotateCcw size={15} />Ingest Another</> : <>Ingest Candidate</>}
        </button>
      </div>

      {status === 'success' && response && (
        <div className="res-box fade-up" style={{ marginTop: 16 }}>
          <div className="res-box-header">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '0 10px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>Ingested Successfully</div>
              <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {response.name || response.source_filename}
              </div>
            </div>
            <button className="btn-sm" onClick={copyResponse}>
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <div className="res-box-body">
             <div style={{ padding: '4px 0', borderBottom: '1px solid #F3F4F6', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                      <User size={14} color="#6366F1" /> {response.name || 'Unknown Name'}
                   </div>
                   {response.work_experience_years !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                        <Briefcase size={14} color="#6366F1" /> {response.work_experience_years} Years
                      </div>
                   )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#9CA3AF' }}>
                   <Calendar size={13} /> Ingested on {new Date(response.ingested_at).toLocaleString()}
                </div>
             </div>
             {response.skills && response.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                   {response.skills.map(s => <span key={s} style={{ fontSize: 10, fontWeight: 600, color: '#4F46E5', background: '#F5F7FF', padding: '2px 8px', borderRadius: 99 }}>{s}</span>)}
                </div>
             )}
             <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 5 }}>Raw response preview:</div>
             <pre className="res-pre">{JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="res-box fade-up" style={{ marginTop: 16, border: '0.5px solid #FECACA' }}>
          <div className="res-box-header" style={{ background: '#FEF2F2', borderBottomColor: '#FECACA' }}>
            <AlertCircle size={16} color="#DC2626" />
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#991B1B' }}>Ingest Failed</div>
          </div>
          <div className="res-box-body">
            <pre className="res-pre" style={{ color: '#7F1D1D', background: '#FFF7F7' }}>{error}</pre>
          </div>
        </div>
      )}
    </>
  );
}
