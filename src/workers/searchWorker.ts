import Fuse from 'fuse.js';

let fuse: any = null;
let docs: any[] = [];

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data || {};
  try {
    if (type === 'init') {
      docs = Array.isArray(payload?.docs) ? payload.docs : [];
      const options = {
        keys: ['name', 'sku', 'category'],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      } as any;
      fuse = new Fuse(docs, options);
      (self as any).postMessage({ type: 'ready' });
    } else if (type === 'search') {
      const q = String(payload?.q || '').trim();
      if (!q) {
        // return all ids when empty query (so caller can apply category filter)
        const allIds = docs.map(d => d.id);
        (self as any).postMessage({ type: 'result', results: allIds });
        return;
      }
      if (!fuse) {
        (self as any).postMessage({ type: 'result', results: [] });
        return;
      }
      const res = fuse.search(q, { limit: 1000 }).map((r: any) => r.item.id);
      (self as any).postMessage({ type: 'result', results: res });
    }
  } catch (err) {
    (self as any).postMessage({ type: 'error', error: String(err) });
  }
};
