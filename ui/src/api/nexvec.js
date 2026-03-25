const BASE_URL = '/api';

export async function ingest({ file, kb_name, chunking_strategy, chunk_size, overlap_size, embedding_model, overwrite }) {
  const form = new FormData();
  form.append('file', file);
  if (kb_name?.trim())           form.append('kb_name', kb_name.trim());
  if (chunking_strategy?.trim()) form.append('chunking_strategy', chunking_strategy.trim());
  if (chunk_size)                form.append('chunk_size', String(chunk_size));
  if (overlap_size)              form.append('overlap_size', String(overlap_size));
  if (embedding_model?.trim())   form.append('embedding_model', embedding_model.trim());
  // Only send overwrite when true — FastAPI treats any non-empty string as truthy
  if (overwrite)                 form.append('overwrite', 'true');

  const res = await fetch(`${BASE_URL}/ingest`, { method: 'POST', body: form });

  if (!res.ok) {
    let msg = `Server error ${res.status}`;
    try {
      const raw = await res.text();
      // Try JSON first (FastAPI validation errors)
      try {
        const err = JSON.parse(raw);
        // Custom format: { error, message, detail }
        if (err?.message)              msg = err.message;
        else if (err?.error)           msg = err.error;
        else if (Array.isArray(err?.detail))
          msg = err.detail.map(d => `[${d.loc?.slice(-1)[0] ?? 'field'}] ${d.msg}`).join(' · ');
        else if (typeof err?.detail === 'string') msg = err.detail;
        else                           msg = JSON.stringify(err);
      } catch {
        // Plain text or HTML — strip tags, take first 300 chars
        const clean = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        if (clean) msg = `${res.status}: ${clean}`;
      }
    } catch { /* network-level failure, keep default */ }
    throw new Error(msg);
  }

  // Response might be a plain string or JSON
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}
