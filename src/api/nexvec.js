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

export async function ingest({ file, embedding_model }) {
  const form = new FormData();
  form.append('file', file);
  if (embedding_model?.trim()) form.append('embedding_model', embedding_model.trim());

  const res = await fetch(`${BASE_URL}/ingest`, { method: 'POST', body: form });
  return handleResponse(res);
}

export async function retrieve({ query, k, embedding_model }) {
  const res = await fetch(`${BASE_URL}/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      ...(k && { k }),
      ...(embedding_model?.trim() && { embedding_model: embedding_model.trim() }),
    }),
  });
  return handleResponse(res);
}

export async function listDocuments() {
  const res = await fetch(`${BASE_URL}/documents`);
  return handleResponse(res);
}

export async function deleteDocument(filename) {
  const res = await fetch(`${BASE_URL}/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}
