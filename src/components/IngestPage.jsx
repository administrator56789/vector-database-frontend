import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle2, AlertCircle, RotateCcw, Copy, CheckCheck, ChevronDown, Settings2 } from 'lucide-react';
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
            {isDragActive ? 'Release to drop' : <>Drop PDF here, or <span className="dz-link">click to browse</span></>}
          </p>
          <p className="dz-sub">Supports .pdf files up to 50MB</p>
        </div>
      )}
    </div>
  );
}

export default function IngestPage({ onIngestSuccess }) {
  const [file, setFile]           = useState(null);
  const [kbName, setKbName]       = useState('');
  const [showAdv, setShowAdv]     = useState(false);
  const [chunkSize, setChunkSize] = useState('512');
  const [overlap, setOverlap]     = useState('64');
  const [model, setModel]         = useState('');
  const [overwrite, setOverwrite] = useState(false);
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
    const t = setInterval(() => { s++; if (s < STAGES.length) setStage(s); else clearInterval(t); }, 750);
    try {
      const res = await ingest({
        file,
        kb_name:         kbName    || undefined,
        chunk_size:      chunkSize ? +chunkSize : undefined,
        overlap_size:    overlap   ? +overlap   : undefined,
        embedding_model: model     || undefined,
        overwrite,
      });
      clearInterval(t); setStage(STAGES.length - 1);
      setStatus('success'); setResponse(res);
      onIngestSuccess?.();
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
          NexVec · Vector Database
        </div>
        <h1 className="page-title">Ingest Your Content</h1>
        <p className="page-subtitle">
          Upload a PDF to embed it into your custom vector knowledge base and make it semantically searchable.
        </p>
      </div>

      <div className="card fade-up">
        <div className="section-label">PDF File</div>
        <DropZone file={file} setFile={setFile} disabled={busy} />

        <div className="field-group">
          <label className="field-label">
            Knowledge Base Name <span className="opt">optional</span>
          </label>
          <input
            className="field"
            type="text"
            placeholder="e.g. my-project  (leave empty for server default)"
            value={kbName}
            onChange={e => setKbName(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="adv-row" onClick={() => setShowAdv(v => !v)}>
          <div className="adv-left">
            <Settings2 size={14} color="#A89C94" />
            Advanced Options
          </div>
          <ChevronDown size={14} className={`adv-chevron${showAdv ? ' open' : ''}`} />
        </div>

        {showAdv && (
          <div className="adv-panel">
            <div className="chunk-row">
              <div>
                <label className="field-label">Chunk Size</label>
                <input className="field" type="number" placeholder="512" min={1}
                  value={chunkSize} onChange={e => setChunkSize(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="field-label">Chunk Overlap</label>
                <input className="field" type="number" placeholder="64" min={0}
                  value={overlap} onChange={e => setOverlap(e.target.value)} disabled={busy} />
              </div>
            </div>

            <div>
              <label className="field-label">Embedding Model</label>
              <select className="field" value={model} onChange={e => setModel(e.target.value)} disabled={busy}>
                <option value="">Server default</option>
                <option value="models/text-embedding-004">models/text-embedding-004</option>
                <option value="models/embedding-001">models/embedding-001</option>
                <option value="models/text-multilingual-embedding-002">models/text-multilingual-embedding-002</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '0.5px solid #E0DAD4', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2620' }}>Overwrite Existing</div>
                <div style={{ fontSize: 11.5, color: '#A89C94', marginTop: 2 }}>Re-embed if document already exists in the KB</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, marginLeft: 16 }}>
                <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} disabled={busy} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, cursor: 'pointer',
                  background: overwrite ? '#3B6EF5' : '#E5E7EB',
                  border: `1.5px solid ${overwrite ? '#2D5BCC' : '#D1D5DB'}`,
                  borderRadius: 99, transition: 'all 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', width: 16, height: 16, borderRadius: '50%',
                    top: 3, left: overwrite ? 21 : 3, background: overwrite ? '#fff' : '#9CA3AF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.2s',
                  }} />
                </span>
              </label>
            </div>
          </div>
        )}

        {busy && (
          <div className="stages" style={{ marginBottom: 16 }}>
            {STAGES.map((lbl, i) => (
              <div key={lbl} className={`stage${i < stage ? ' done' : i === stage ? ' active' : ''}`}>
                {i < stage
                  ? <CheckCircle2 size={12} />
                  : i === stage
                  ? <div className="spin-blue" />
                  : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #E0DAD4' }} />}
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
          {busy
            ? <><div className="spin" />Ingesting…</>
            : status === 'success'
            ? <><RotateCcw size={15} />Ingest Another</>
            : <>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M8 11V3M8 3L5 6M8 3l3 3"/><path d="M2 13h12" strokeLinecap="round"/>
                </svg>
                Ingest Document
              </>}
        </button>
      </div>

      {status === 'success' && (
        <div className="res-box fade-up" style={{ marginTop: 16 }}>
          <div className="res-box-header">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1814' }}>Ingested Successfully</div>
              <div style={{ fontSize: 11.5, color: '#A89C94', marginTop: 1 }}>Server response</div>
            </div>
            <button className="btn-sm" onClick={copyResponse}>
              {copied ? <><CheckCheck size={12} />Copied</> : <><Copy size={12} />Copy</>}
            </button>
          </div>
          <div className="res-box-body">
            <pre className="res-pre">{typeof response === 'string' ? response : JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="res-box fade-up" style={{ marginTop: 16, border: '0.5px solid #FECACA' }}>
          <div className="res-box-header" style={{ background: '#FEF2F2', borderBottomColor: '#FECACA' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={16} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#991B1B' }}>Ingest Failed</div>
              <div style={{ fontSize: 11.5, color: '#B91C1C', marginTop: 1, opacity: 0.7 }}>Server returned an error</div>
            </div>
          </div>
          <div className="res-box-body">
            <pre className="res-pre" style={{ color: '#7F1D1D', background: '#FFF7F7' }}>{error}</pre>
          </div>
        </div>
      )}
    </>
  );
}
