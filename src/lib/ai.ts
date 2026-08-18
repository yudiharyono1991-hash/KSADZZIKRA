export async function generateProductImage(prompt: string): Promise<string> {
  // If an AI image API is configured, call it. Expecting env var `VITE_AI_IMAGE_API`.
  const apiUrl = (import.meta as any).env?.VITE_AI_IMAGE_API || (typeof process !== 'undefined' ? (process.env.REACT_APP_AI_IMAGE_API || process.env.VITE_AI_IMAGE_API) : undefined);
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const body = await res.json();
        // Expecting { imageUrl } or { data: 'base64...' }
        if (body.imageUrl) return body.imageUrl;
        if (body.data) return `data:image/png;base64,${body.data}`;
      }
    } catch (err) {
      // fallthrough to placeholder
      // eslint-disable-next-line no-console
      console.warn('AI image generation failed', err);
    }
  }

  // Return empty string to trigger the React fallback component (ProductPlaceholder)
  return '';
}



function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
