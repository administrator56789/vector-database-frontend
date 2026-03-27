/**
 * Parses the /knowledgebases API response into a flat array of KB objects.
 * Handles all known response shapes:
 *   - Array:                    ["kb1", "kb2"]  or  [{name:"kb1"}, ...]
 *   - Wrapped array:            { "knowledgebases": [...] }
 *   - Wrapped object:           { "knowledgebases": { "kb1": {...}, "kb2": {...} } }
 *   - Plain object (keys=names): { "kb1": {...}, "kb2": {...} }
 */
export function parseKBList(data) {
  if (!data) return [];

  // Already an array
  if (Array.isArray(data)) {
    return data.map(d => (typeof d === 'string' ? { name: d } : d));
  }

  // Wrapped under a key (e.g. { knowledgebases: [...] } or { knowledgebases: {...} })
  const wrapperKey = Object.keys(data).find(k =>
    Array.isArray(data[k]) || (data[k] && typeof data[k] === 'object')
  );

  if (wrapperKey) {
    const inner = data[wrapperKey];
    if (Array.isArray(inner)) {
      return inner.map(d => (typeof d === 'string' ? { name: d } : d));
    }
    if (typeof inner === 'object') {
      return Object.keys(inner).map(name => ({
        name,
        ...(typeof inner[name] === 'object' ? inner[name] : {}),
      }));
    }
  }

  // Fallback: treat root object keys as KB names
  return Object.keys(data).map(name => ({
    name,
    ...(typeof data[name] === 'object' ? data[name] : {}),
  }));
}
