import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText,
  Upload, X, CheckCircle2, AlertCircle,
  ChevronDown, RotateCcw, Copy, CheckCheck,
  Database, Layers,
} from 'lucide-react';
import { ingest } from '../api/nexvec';

const MODES = [
  {
    id: 'pdf',
    label: 'PDF',
    Icon: FileText,
    iconColor: '#dc2626',
    iconBg: '#fef2f2',
    accept: { 'application/pdf': ['.pdf'] },
    hint: '.pdf files'
  }
];

const STAGES = ['Uploading', 'Parsing', 'Embedding', 'Storing'];

function DropZone({ mode, file, setFile, disabled }) {
  const onDrop = useCallback((f) => { if (f[0]) setFile(f[0]); }, [setFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mode.accept,
    maxFiles: 1,
    disabled
  });

  const fmt = (b) =>
    b < 1048576 ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div {...getRootProps()} className={`drop-area${file ? ' filled' : ''}${isDragActive ? ' over' : ''}`}>
      <input {...getInputProps()} />

      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 11,
            background: mode.iconBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <mode.Icon size={22} color={mode.iconColor} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{file.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{fmt(file.size)}</div>
          </div>

          {!disabled && (
            <button onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <mode.Icon size={24} color={mode.iconColor} />
          <p style={{ marginTop: 10 }}>
            {isDragActive ? 'Drop PDF here' : 'Click or drag PDF to upload'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function IngestPage() {
  const mode = MODES[0];

  const [file, setFile] = useState(null);
  const [kbName, setKbName] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [strategy, setStrategy] = useState('');
  const [chunkSize, setChunkSize] = useState('');
  const [overlap, setOverlap] = useState('');
  const [model, setModel] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [status, setStatus] = useState(null);
  const [stage, setStage] = useState(0);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const busy = status === 'loading';
  const canSubmit = file !== null;

  const submit = async () => {
    if (!canSubmit) return;

    setStatus('loading');
    setError('');
    setResponse(null);
    setStage(0);

    let s = 0;
    const t = setInterval(() => {
      s++;
      if (s < STAGES.length) setStage(s);
      else clearInterval(t);
    }, 750);

    try {
      const res = await ingest({
        file: file,
        kb_name: kbName || undefined,
        chunking_strategy: strategy || undefined,
        chunk_size: chunkSize ? +chunkSize : undefined,
        overlap_size: overlap ? +overlap : undefined,
        embedding_model: model || undefined,
        overwrite,
      });

      clearInterval(t);
      setStage(STAGES.length - 1);
      setStatus('success');
      setResponse(res);

    } catch (err) {
      clearInterval(t);
      setStatus('error');
      setError(err.message);
    }
  };

  const reset = () => {
    setStatus(null);
    setError('');
    setResponse(null);
    setStage(0);
    setFile(null);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(
      typeof response === 'string'
        ? response
        : JSON.stringify(response, null, 2)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Database size={14} color="#6366f1" />
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Ingest Your PDF</h1>
        <p style={{ color: '#6b7280' }}>Upload PDF into vector database</p>
      </div>

      {/* Card */}
      <div className="card" style={{ padding: 28 }}>

        {/* Input */}
        <div>
          <label style={{ fontWeight: 600 }}>PDF File</label>
          <DropZone mode={mode} file={file} setFile={setFile} disabled={busy} />
        </div>

        {/* KB Name */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontWeight: 600 }}>Knowledge Base Name</label>
          <input
            className="field"
            value={kbName}
            onChange={(e) => setKbName(e.target.value)}
          />
        </div>

        {/* Advanced toggle */}
        <div style={{ marginTop: 20, cursor: 'pointer' }} onClick={() => setShowAdv(v => !v)}>
          <Layers size={14} /> Advanced Options
          <ChevronDown size={14} />
        </div>

        {showAdv && (
          <div style={{ marginTop: 10 }}>
            <input placeholder="Chunking Strategy" value={strategy} onChange={e => setStrategy(e.target.value)} />
            <input placeholder="Chunk Size" value={chunkSize} onChange={e => setChunkSize(e.target.value)} />
            <input placeholder="Overlap" value={overlap} onChange={e => setOverlap(e.target.value)} />
            <input placeholder="Model" value={model} onChange={e => setModel(e.target.value)} />
          </div>
        )}

        {/* Stage progress */}
        {busy && (
          <div style={{ marginTop: 16 }}>
            {STAGES.map((s, i) => (
              <div key={i} style={{ fontSize: 12 }}>{s}</div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-submit"
          style={{ marginTop: 20 }}
          onClick={status === 'success' ? reset : submit}
          disabled={busy || (!canSubmit && status !== 'success')}
        >
          {busy ? 'Ingesting...' : status === 'success' ? 'Reset' : 'Ingest'}
        </button>
      </div>

      {/* Success */}
      {status === 'success' && (
        <div className="res-box" style={{ marginTop: 16, border: '1.5px solid #bbf7d0' }}>
          <div style={{ background: '#ecfdf5', padding: 10 }}>
            <CheckCircle2 color="#059669" />
            <span style={{ color: '#065f46', fontWeight: 600 }}>Ingested Successfully</span>
          </div>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="res-box" style={{ marginTop: 16, border: '1.5px solid #fecaca' }}>
          <div style={{ background: '#fef2f2', padding: 10 }}>
            <AlertCircle color="#dc2626" />
            <span style={{ color: '#991b1b', fontWeight: 600 }}>Ingest Failed</span>
          </div>
          <pre style={{ color: '#7f1d1d' }}>{error}</pre>
        </div>
      )}
    </>
  );
}







console.log("Function started");
