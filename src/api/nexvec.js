const BASE_URL = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    let msg = `Server error ${res.status}`;
    try {
      const raw = await res.text();
      try {
        const err = JSON.parse(raw);
        if (err?.message)                      msg = err.message;
        else if (err?.error)                   msg = err.error;
        else if (Array.isArray(err?.detail))
          msg = err.detail.map(d => `[${d.loc?.slice(-1)[0] ?? 'field'}] ${d.msg}`).join(' · ');
        else if (typeof err?.detail === 'string') msg = err.detail;
        else                                   msg = JSON.stringify(err);
      } catch {
        const clean = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
        if (clean) msg = `${res.status}: ${clean}`;
      }
    } catch { /* network-level failure */ }
    throw new Error(msg);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function ingest({ file, kb_name, chunking_strategy, chunk_size, overlap_size, embedding_model, overwrite }) {
  const form = new FormData();
  form.append('file', file);
  if (kb_name?.trim())           form.append('kb_name', kb_name.trim());
  if (chunking_strategy?.trim()) form.append('chunking_strategy', chunking_strategy.trim());
  if (chunk_size)                form.append('chunk_size', String(chunk_size));
  if (overlap_size)              form.append('overlap_size', String(overlap_size));
  if (embedding_model?.trim())   form.append('embedding_model', embedding_model.trim());
  if (overwrite)                 form.append('overwrite', 'true');

  const res = await fetch(`${BASE_URL}/ingest`, { method: 'POST', body: form });
  return handleResponse(res);
}

export async function retrieve({ query, kb_name, k, embedding_model, retrieval_strategy, excludevectors = false }) {
  const res = await fetch(`${BASE_URL}/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      ...(kb_name?.trim()       && { kb_name: kb_name.trim() }),
      ...(k                     && { k }),
      ...(embedding_model?.trim() && { embedding_model: embedding_model.trim() }),
      ...(retrieval_strategy    && { retrieval_strategy }),
      excludevectors,
    }),
  });
  return handleResponse(res);
}

export async function listKnowledgebases() {
  const res = await fetch(`${BASE_URL}/knowledgebases`);
  return handleResponse(res);
}

export async function listChunkingStrategies() {
  const res = await fetch(`${BASE_URL}/chunking-strategies`);
  return handleResponse(res);
}

export async function listRetrievalStrategies() {
  const res = await fetch(`${BASE_URL}/retrieval-strategies`);
  return handleResponse(res);
}
