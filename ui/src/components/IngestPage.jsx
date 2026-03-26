import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Type, FileText, Image, Video,
  Upload, X, CheckCircle2, AlertCircle,
  ChevronDown, RotateCcw, Copy, CheckCheck,
  Database, Layers,
} from 'lucide-react';
import { ingest } from '../api/nexvec';

const MODES = [
  { id: 'pdf',   label: 'PDF',   Icon: FileText, iconColor: '#dc2626', iconBg: '#fef2f2', accept: { 'application/pdf': ['.pdf'] },                                          hint: '.pdf files' },
  { id: 'text',  label: 'Text',  Icon: Type,     iconColor: '#6366f1', iconBg: '#eef2ff', accept: null,                                                                      hint: 'Plain text' },
  { id: 'image', label: 'Image', Icon: Image,    iconColor: '#0891b2', iconBg: '#ecfeff', accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.bmp'] },               hint: 'JPG, PNG, WEBP' },
  { id: 'video', label: 'Video', Icon: Video,    iconColor: '#7c3aed', iconBg: '#f5f3ff', accept: { 'video/*': ['.mp4','.mov','.avi','.mkv','.webm'] },                       hint: 'MP4, MOV, MKV' },
];

const STAGES = ['Uploading', 'Parsing', 'Embedding', 'Storing'];

function DropZone({ mode, file, setFile, disabled }) {
  const onDrop = useCallback((f) => { if (f[0]) setFile(f[0]); }, [setFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: mode.accept, maxFiles: 1, disabled });
  const fmt = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div {...getRootProps()} className={`drop-area${file?' filled':''}${isDragActive?' over':''}`} style={{ cursor: disabled ? 'default' : 'pointer' }}>
      <input {...getInputProps()} />
      {file ? (
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:46, height:46, borderRadius:11, background:mode.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <mode.Icon size={22} color={mode.iconColor} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:650, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
            <div style={{ fontSize:12.5, color:'#6b7280', marginTop:3 }}>{mode.label} · {fmt(file.size)}</div>
          </div>
          {!disabled && (
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
              style={{ background:'#f3f4f6', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'6px 8px', cursor:'pointer', display:'flex', color:'#9ca3af', flexShrink:0 }}>
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ pointerEvents:'none' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:mode.iconBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <mode.Icon size={24} color={mode.iconColor} />
          </div>
          <p style={{ fontSize:14.5, fontWeight:650, color:'#374151', marginBottom:5 }}>
            {isDragActive ? 'Release to drop' : `Drop ${mode.label} here, or click to browse`}
          </p>
          <p style={{ fontSize:12.5, color:'#9ca3af' }}>{mode.hint}</p>
        </div>
      )}
    </div>
  );
}

export default function IngestPage() {
  const [modeId, setModeId]       = useState('pdf');
  const mode                      = MODES.find(m => m.id === modeId);
  const [text, setText]           = useState('');
  const [file, setFile]           = useState(null);
  const [kbName, setKbName]       = useState('');
  const [showAdv, setShowAdv]     = useState(false);
  const [strategy, setStrategy]   = useState('');
  const [chunkSize, setChunkSize] = useState('');
  const [overlap, setOverlap]     = useState('');
  const [model, setModel]         = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [status, setStatus]       = useState(null);
  const [stage, setStage]         = useState(0);
  const [response, setResponse]   = useState(null);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);

  const switchMode = (id) => {
    if (status === 'loading') return;
    setModeId(id); setFile(null); setText('');
    setStatus(null); setError(''); setResponse(null);
  };

  const canSubmit = modeId === 'text' ? text.trim().length > 0 : file !== null;
  const busy = status === 'loading';

  const submit = async () => {
    if (!canSubmit) return;
    setStatus('loading'); setError(''); setResponse(null); setStage(0);
    let s = 0;
    const t = setInterval(() => { s++; if (s < STAGES.length) setStage(s); else clearInterval(t); }, 750);
    try {
      let fileToSend = file;
      if (modeId === 'text') {
        const blob = new Blob([text.trim()], { type: 'text/plain' });
        fileToSend = new File([blob], 'content.txt', { type: 'text/plain' });
      }
      const res = await ingest({
        file: fileToSend,
        kb_name:           kbName    || undefined,
        chunking_strategy: strategy  || undefined,
        chunk_size:        chunkSize ? +chunkSize : undefined,
        overlap_size:      overlap   ? +overlap   : undefined,
        embedding_model:   model     || undefined,
        overwrite,
      });
      clearInterval(t); setStage(STAGES.length - 1);
      setStatus('success'); setResponse(res);
    } catch (err) {
      clearInterval(t); setStatus('error'); setError(err.message);
    }
  };

  const reset = () => { setStatus(null); setError(''); setResponse(null); setStage(0); setFile(null); setText(''); };

  const copyResponse = () => {
    navigator.clipboard.writeText(typeof response === 'string' ? response : JSON.stringify(response, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Hero */}
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.22)', borderRadius:99, padding:'4px 14px', marginBottom:16 }}>
          <Database size={11} color="#a5b4fc" />
          <span style={{ fontSize:11, fontWeight:650, color:'#a5b4fc', letterSpacing:'0.07em', textTransform:'uppercase' }}>NexVec · Vector Database</span>
        </div>
        <h1 style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:10 }}>
          <span className="grad">Ingest Your Content</span>
        </h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.28)', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
          Embed text, PDFs, images, or videos into your custom vector knowledge base.
        </p>
      </div>

      {/* Card */}
      <div className="card fade-up" style={{ padding:'28px' }}>

        {/* Mode tabs */}
        <div className="mode-tabs" style={{ marginBottom:24 }}>
          {MODES.map(m => (
            <button key={m.id} className={`mode-tab${modeId===m.id?' active':''}`}
              onClick={() => switchMode(m.id)} disabled={busy} title={m.hint}>
              <m.Icon size={15} />{m.label}
            </button>
          ))}
        </div>

        {/* Input */}
        {modeId === 'text' ? (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
              <label className="field-label" style={{ margin:0 }}>Text Content</label>
              {text.length > 0 && <span style={{ fontSize:11.5, color:'#9ca3af' }}>{text.length.toLocaleString()} chars</span>}
            </div>
            <textarea className="field" rows={7}
              placeholder="Paste or type the content you want to embed…"
              value={text} onChange={e => setText(e.target.value)} disabled={busy} />
          </div>
        ) : (
          <div>
            <label className="field-label" style={{ marginBottom:8 }}>{mode.label} File</label>
            <DropZone mode={mode} file={file} setFile={setFile} disabled={busy} />
          </div>
        )}

        {/* KB Name */}
        <div style={{ marginTop:20 }}>
          <label className="field-label">Knowledge Base Name</label>
          <input className="field" type="text"
            placeholder="e.g. my-project  (leave empty for server default)"
            value={kbName} onChange={e => setKbName(e.target.value)} disabled={busy} />
        </div>

        {/* Advanced toggle */}
        <div className="adv-row" onClick={() => setShowAdv(v => !v)}>
          <span className="adv-label"><Layers size={14} />Advanced Options</span>
          <ChevronDown size={15} className={`adv-chevron${showAdv?' open':''}`} />
        </div>

        {showAdv && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, paddingBottom:18, borderBottom:'1.5px solid #f3f4f6', marginBottom:4 }}>

            <div>
              <label className="field-label">Chunking Strategy</label>
              <input className="field" type="text" placeholder="Server default"
                value={strategy} onChange={e => setStrategy(e.target.value)} disabled={busy} />
              <p style={{ fontSize:11.5, color:'#9ca3af', marginTop:5 }}>How the document is split into chunks before embedding.</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label className="field-label">Chunk Size</label>
                <input className="field" type="number" placeholder="512" min={1}
                  value={chunkSize} onChange={e => setChunkSize(e.target.value)} disabled={busy} />
                <p style={{ fontSize:11.5, color:'#9ca3af', marginTop:5 }}>Tokens per chunk.</p>
              </div>
              <div>
                <label className="field-label">Overlap Size</label>
                <input className="field" type="number" placeholder="64" min={0}
                  value={overlap} onChange={e => setOverlap(e.target.value)} disabled={busy} />
                <p style={{ fontSize:11.5, color:'#9ca3af', marginTop:5 }}>Token overlap between chunks.</p>
              </div>
            </div>

            <div>
              <label className="field-label">Embedding Model</label>
              <input className="field" type="text" placeholder="Server default"
                value={model} onChange={e => setModel(e.target.value)} disabled={busy} />
              <p style={{ fontSize:11.5, color:'#9ca3af', marginTop:5 }}>Must match the model used at query time.</p>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#fafafa', border:'1.5px solid #f3f4f6', borderRadius:10 }}>
              <div>
                <div style={{ fontSize:13.5, fontWeight:600, color:'#374151' }}>Overwrite Existing</div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>
                  Re-embed if document already exists in the KB. Default: <strong>off</strong>
                </div>
              </div>
              <label className="sw" style={{ marginLeft:16, flexShrink:0 }}>
                <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} disabled={busy} />
                <span className="sw-track" />
              </label>
            </div>
          </div>
        )}

        {/* Stage progress */}
        {busy && (
          <div className="stages" style={{ marginTop:16, marginBottom:4 }}>
            {STAGES.map((lbl, i) => (
              <div key={lbl} className={`stage${i<stage?' done':i===stage?' active':''}`}>
                {i < stage ? <CheckCircle2 size={12} />
                  : i === stage ? <div className="spin-purple" />
                  : <div style={{ width:12, height:12, borderRadius:'50%', border:'1.5px solid #e5e7eb' }} />}
                {lbl}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button className="btn-submit" style={{ marginTop: showAdv ? 18 : 10 }}
          onClick={status === 'success' ? reset : submit}
          disabled={busy || (!canSubmit && status !== 'success')}>
          {busy ? <><div className="spin" />Ingesting…</>
            : status === 'success' ? <><RotateCcw size={16} />Ingest Another</>
            : <><Upload size={16} />Ingest</>}
        </button>
      </div>

      {/* Success */}
      {status === 'success' && (
        <div className="res-box fade-up" style={{ marginTop:16 }}>
          <div className="res-box-header">
            <div style={{ width:32, height:32, borderRadius:8, background:'#d1fae5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <CheckCircle2 size={17} color="#059669" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Ingested Successfully</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>Server response</div>
            </div>
            <button className="btn-sm" onClick={copyResponse}>
              {copied ? <><CheckCheck size={12}/>Copied</> : <><Copy size={12}/>Copy</>}
            </button>
          </div>
          <div className="res-box-body">
            <pre className="res-pre">{typeof response==='string' ? response : JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="res-box fade-up" style={{ marginTop:16, border:'1.5px solid #fecaca' }}>
          <div className="res-box-header" style={{ background:'#fef2f2', borderBottomColor:'#fecaca' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <AlertCircle size={17} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#991b1b' }}>Ingest Failed</div>
              <div style={{ fontSize:12, color:'#b91c1c', marginTop:1, opacity:0.7 }}>
                {error.startsWith('500') ? 'Server error — the embedding model may not be configured on the server.' : 'Server returned an error'}
              </div>
            </div>
          </div>
          <div className="res-box-body">
            <pre className="res-pre" style={{ color:'#7f1d1d', background:'#fff7f7' }}>{error}</pre>
          </div>
        </div>
      )}
    </>
  );
}

