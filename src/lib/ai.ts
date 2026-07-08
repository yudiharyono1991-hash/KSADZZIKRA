export async function generateProductImage(prompt: string): Promise<string> {
  // If an AI image API is configured, call it. Expecting env var `VITE_AI_IMAGE_API`.
  const apiUrl = (import.meta as any).env?.VITE_AI_IMAGE_API || (process.env && (process.env.REACT_APP_AI_IMAGE_API || process.env.VITE_AI_IMAGE_API));
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

  // Fallback: generate simple SVG data URI with product name (safe, offline)
  // Try Unsplash Source fallback (no API key required) to get a relevant image URL
  try {
    const unsplashUrl = `https://source.unsplash.com/600x400/?${encodeURIComponent(prompt)}`;
    return unsplashUrl;
  } catch (err) {
    // If Unsplash construction or network fails, fall back to SVG placeholder
    // eslint-disable-next-line no-console
    console.warn('Unsplash fallback failed', err);
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='36' fill='%23343a40'>${escapeHtml(prompt)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
