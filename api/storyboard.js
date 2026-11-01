// POST /api/storyboard
// Body:    { idea, brand?, mood?, duration: 15|30|60, aspect: "9:16"|"16:9"|"1:1", style? }
// Returns: { mode: "live"|"demo", input, storyboard: { title, logline, category, beats, bible, shots, voiceover } }
// Errors:  { error: string } with 400 | 405 | 413 | 429
import { validateInput, generateDemo, normalize, llmPrompt } from './_lib/engine.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 20_000;
const MAX_BODY = 8_000; // bytes; the largest valid brief is well under 2 KB
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_PER_MIN) || 12;
const hits = new Map(); // best-effort, per serverless instance

export function rateLimited(ip, now = Date.now()) {
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}
export const _resetRateLimit = () => hits.clear();

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    if (JSON.stringify(req.body).length > MAX_BODY) throw new HttpError(413, 'Request body is too large.');
    return req.body;
  }
  let data = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!data && typeof req[Symbol.asyncIterator] === 'function') {
    for await (const chunk of req) {
      data += chunk;
      if (data.length > MAX_BODY) throw new HttpError(413, 'Request body is too large.');
    }
  }
  if (data.length > MAX_BODY) throw new HttpError(413, 'Request body is too large.');
  try {
    const parsed = JSON.parse(data || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed;
  } catch {
    throw new HttpError(400, 'Body must be a JSON object.');
  }
}

export async function callGemini(input, key, fetchImpl = fetch) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: llmPrompt(input) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 8192 },
      }),
    });
    if (!r.ok) throw new Error(`gemini status ${r.status}`);
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    return normalize(JSON.parse(text), input);
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') { res.setHeader('Allow', 'POST, OPTIONS'); return res.status(204).end(); }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return res.status(405).json({ error: 'Use POST.' }); }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim();
  if (rateLimited(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
  }

  let body;
  try { body = await readBody(req); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); }

  const { input, errors } = validateInput(body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const storyboard = await callGemini(input, key);
      return res.status(200).json({ mode: 'live', input, storyboard });
    } catch (e) {
      // Never log the key or the request URL; the status/message is enough.
      console.warn('[storyboard] live call failed, using demo engine:', e.name === 'AbortError' ? 'timeout' : e.message);
    }
  }
  return res.status(200).json({ mode: 'demo', input, storyboard: generateDemo(input) });
}
