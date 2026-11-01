// AI Video Storyboard Studio: client
import { esc, fmt, tc, ratioClass, slug, rulerMarks, totalDuration, toMarkdown, promptsText, toolName } from './format.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const STYLE_LABELS = { cinematic: 'Cinematic realism', noir: 'Moody noir', warmfilm: 'Warm 35mm film', cleantech: 'Clean tech', documentary: 'Soft documentary', surreal: 'Surreal' };
const PRESETS = [
  { id: 'watch', label: 'Luxury watch launch', data: { idea: 'Launch film for a hand-finished automatic watch: heritage craftsmanship meets modern city nights. Macro details, quiet confidence, one hero reveal.', brand: 'Aurelle', mood: 'luxurious', style: 'noir', duration: 30, aspect: '16:9' } },
  { id: 'cafe', label: 'Café reel', data: { idea: 'Instagram reel for a specialty coffee café: the morning ritual, latte art, fresh croissants and regulars who feel at home.', brand: 'Bean There', mood: 'cozy', style: 'warmfilm', duration: 15, aspect: '9:16' } },
  { id: 'saas', label: 'SaaS launch teaser', data: { idea: 'Launch teaser for an automation platform that connects your tools and runs busywork on autopilot. From chaos to clarity.', brand: 'Flowstack', mood: 'energetic', style: 'cleantech', duration: 30, aspect: '16:9' } },
  { id: 'travel', label: 'Travel film', data: { idea: 'A travel film through Kerala: misty tea hills, backwaters at golden hour, street food and the people you meet along the way.', brand: 'Wander India', mood: 'epic', style: 'documentary', duration: 60, aspect: '9:16' } },
];

const TOOL_NOTES = {
  kling: 'Kling: short subject, action, scene, camera, lighting and style lines, a negative line and generation settings. Chain shots by using the previous keyframe as the start frame.',
  sora: 'Sora: one paragraph of cinematic prose with physical detail and continuity cues. Describe camera and light the way a DP would.',
  veo: 'Veo (Google Flow): labelled lines, including an audio line with SFX, music and voiceover so native audio comes back in sync.',
  keyframe: 'Keyframe: a still prompt for Nanobanana or Krea. Generate the first frame, then use it for image-to-video in any tool to lock the look.',
};

const state = { duration: 30, aspect: '16:9', tool: 'kling', data: null, preset: null, busy: false };

// ---------- form ----------
function renderPresets() {
  $('#presets').innerHTML = PRESETS.map((p) => `<button type="button" class="chip" data-preset="${p.id}" aria-pressed="false">${esc(p.label)}</button>`).join('');
  $('#presetRows').innerHTML = PRESETS.map((p) => `<tr><td><b>${esc(p.label)}</b><span class="muted cell-sub">${esc(p.data.brand)} · ${esc(p.data.mood)}</span></td><td class="tnum">${p.data.duration}s</td><td class="tnum">${p.data.aspect}</td><td>${STYLE_LABELS[p.data.style]}</td><td class="right"><button type="button" class="btn btn-sm" data-preset="${p.id}">Open</button></td></tr>`).join('');
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => { applyPreset(PRESETS.find((x) => x.id === b.dataset.preset)); generate(); }));
}
function applyPreset(p) {
  state.preset = p.id;
  $('#idea').value = p.data.idea; $('#brand').value = p.data.brand; $('#mood').value = p.data.mood; $('#style').value = p.data.style;
  setSeg('duration', String(p.data.duration)); setSeg('aspect', p.data.aspect);
  updateCount(); markPreset(p.id);
}
const markPreset = (id) => $$('.chip[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === id)));
function setSeg(name, value) {
  const seg = $(`.seg[data-name="${name}"]`);
  $$('button', seg).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === value)));
  state[name] = name === 'duration' ? Number(value) : value;
}
$$('.seg').forEach((seg) => {
  const btns = $$('button', seg);
  btns.forEach((b, i) => {
    b.addEventListener('click', () => { setSeg(seg.dataset.name, b.dataset.value); markPreset(null); });
    b.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
      n.focus(); n.click();
    });
  });
});
const updateCount = () => { $('#ideaCount').textContent = $('#idea').value.length; };
$('#idea').addEventListener('input', () => { updateCount(); markPreset(null); setHint(''); $('#idea').removeAttribute('aria-invalid'); });
['#brand', '#mood', '#style'].forEach((s) => $(s).addEventListener('input', () => markPreset(null)));
$('#briefForm').addEventListener('submit', (e) => { e.preventDefault(); generate(); });
$('#retryBtn').addEventListener('click', () => generate());

function setHint(text, kind = '') {
  const h = $('#formHint');
  h.textContent = text || 'Pick a preset to see a full storyboard in one click.';
  h.className = `hint ${kind}`;
}

// ---------- API ----------
async function requestStoryboard(payload) {
  let r;
  try {
    r = await fetch('/api/storyboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch { return localDemo(payload); } // offline or no functions
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return localDemo(payload); // static host without /api
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || `Request failed (${r.status}).`), { user: true });
  return j;
}
async function localDemo(payload) {
  // Static hosting fallback: run the same deterministic demo engine in the browser.
  const m = await import('../api/_lib/engine.js');
  const { input, errors } = m.validateInput(payload);
  if (errors.length) throw Object.assign(new Error(errors.join(' ')), { user: true });
  return { mode: 'demo', input, storyboard: m.generateDemo(input) };
}

async function generate() {
  if (state.busy) return;
  const payload = { idea: $('#idea').value.trim(), brand: $('#brand').value.trim(), mood: $('#mood').value.trim(), style: $('#style').value, duration: state.duration, aspect: state.aspect };
  if (payload.idea.length < 8) {
    setHint('Describe the idea in at least 8 characters, or pick a preset.', 'err');
    $('#idea').setAttribute('aria-invalid', 'true'); $('#idea').focus();
    return;
  }
  state.busy = true;
  setHint('Generating storyboard…');
  const btn = $('#generateBtn'); btn.classList.add('loading'); btn.disabled = true;
  showSkeleton(payload);
  try {
    const data = await requestStoryboard(payload);
    state.data = data;
    setMode(data.mode);
    render(data);
    setHint(data.mode === 'live' ? 'Generated with Gemini. Edit the brief and run it again any time.' : 'Demo data from the built-in engine. Set GEMINI_API_KEY for live results.');
  } catch (err) {
    showError(err.user ? err.message : 'The request did not complete. Check your connection and try again.');
    setHint('Fix the brief or try again.', 'err');
  } finally {
    state.busy = false; btn.classList.remove('loading'); btn.disabled = false;
    $('#results').setAttribute('aria-busy', 'false');
  }
}

function setMode(mode) {
  const b = $('#modeBadge');
  b.className = `badge ${mode === 'live' ? 'badge-ok' : 'badge-warn'}`;
  b.textContent = mode === 'live' ? 'Live' : 'Demo data';
}

function showError(msg) {
  // Keep the last good storyboard on screen if there is one.
  if (state.data) render(state.data, false);
  else { $('#results').hidden = true; $('#emptyState').hidden = true; }
  $('#errorMsg').textContent = msg; $('#errorState').hidden = false;
}

// ---------- render ----------
function showSkeleton(p) {
  $('#emptyState').hidden = true; $('#errorState').hidden = true;
  const res = $('#results'); res.hidden = false; res.setAttribute('aria-busy', 'true');
  const n = p.duration === 15 ? 5 : p.duration === 30 ? 8 : 12;
  $('#sumTitle').innerHTML = '<span class="sk" style="width:55%;height:22px"></span>';
  $('#sumLogline').innerHTML = '<span class="sk" style="width:80%"></span>';
  $('#sumStats').innerHTML = '';
  $('#tlBeats').innerHTML = ''; $('#tlRuler').innerHTML = '';
  $('#tlBar').innerHTML = '<span class="sk" style="height:40px;width:100%"></span>';
  $('#tlTotal').textContent = ''; $('#tlTotal').className = 'status';
  $('#board').innerHTML = Array.from({ length: Math.min(n, 4) }, () => `<article class="shot ${p.aspect === '16:9' ? 'wide' : ''}"><div class="frame-wrap"><div class="frame ${ratioClass(p.aspect)} sk"></div></div><div class="shot-body"><span class="sk" style="width:90%"></span><span class="sk" style="width:65%"></span><span class="sk" style="height:120px"></span></div></article>`).join('');
}

// Shot size from lens/action: drives the framing box in the neutral placeholder frame.
function framing(shot) {
  const a = `${shot.action} ${shot.lens}`.toLowerCase();
  if (/logo|end card|title card|lockup/.test(a)) return { code: 'Card', box: 0 };
  if (/macro|extreme/.test(a)) return { code: 'ECU', box: 0.72 };
  if (/close-up|85mm|135mm|eyes|wrist|packshot|hero shot/.test(a)) return { code: 'CU', box: 0.52 };
  if (/wide|drone|aerial|landscape|16mm|14mm|24mm/.test(a)) return { code: 'WS', box: 0.22 };
  return { code: 'MS', box: 0.36 };
}

function frameHTML(s, palette, aspect) {
  const f = framing(s);
  const thirdsX = [33.33, 66.67, 50][s.index % 3];
  const w = f.box * 100; const h = f.box * 100;
  const box = f.box ? `<span class="subject" style="width:${w}%;height:${h}%;left:${Math.min(Math.max(thirdsX - w / 2, 4), 96 - w)}%;top:${Math.max(50 - h / 2, 8)}%"></span>` : '<span class="card-mark">End card</span>';
  return `<div class="frame ${ratioClass(aspect)}" role="img" aria-label="Placeholder frame for shot ${s.index}: ${f.code}, ${esc(s.camera)}">
    <span class="thirds" aria-hidden="true"></span>${box}
    <div class="frame-top"><span class="tnum">${String(s.index).padStart(2, '0')}</span><span>${esc(cap(s.beat))}</span></div>
    <div class="frame-bot"><span class="mini-swatches" aria-hidden="true">${palette.map((c) => `<i style="background:${esc(c)}"></i>`).join('')}</span><span class="tnum">${f.code} · ${fmt(s.duration)}</span></div>
  </div>`;
}
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const beatName = (k) => (k === 'cta' ? 'CTA' : cap(k));

function render(data, scroll = true) {
  const sb = data.storyboard; const input = data.input;
  $('#emptyState').hidden = true; $('#errorState').hidden = true;
  $('#results').hidden = false;
  $('#sumKicker').textContent = data.mode === 'live' ? 'Storyboard · Live' : 'Storyboard · Demo data';
  $('#sumTitle').textContent = sb.title;
  $('#sumLogline').textContent = sb.logline;
  const total = totalDuration(sb.shots);
  $('#sumStats').innerHTML = [['Length', `${input.duration}s`], ['Aspect', input.aspect], ['Shots', sb.shots.length], ['Beats', sb.beats.length], ['Style', STYLE_LABELS[input.style] || input.style], ['Mood', input.mood]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd class="tnum">${esc(v)}</dd></div>`).join('');

  // timeline
  const ok = Math.abs(total - input.duration) < 0.05;
  const tt = $('#tlTotal');
  tt.className = `status ${ok ? 'status-ok' : 'status-bad'}`;
  tt.textContent = ok ? `${fmt(total)} of ${input.duration}s · matches target` : `${fmt(total)} of ${input.duration}s · off target`;
  $('#tlBeats').innerHTML = sb.beats.map((b) => `<div class="tl-beat" style="flex:${b.end - b.start}" title="${esc(b.purpose)}"><span>${esc(b.name)}</span></div>`).join('');
  $('#tlBar').innerHTML = sb.shots.map((s) => `<button type="button" class="tl-seg ${s.beat === 'reveal' ? 'is-reveal' : ''}" style="flex:${s.duration}" data-shot="${s.index}" aria-label="Shot ${s.index}, ${fmt(s.duration)}, ${esc(s.camera)}" title="Shot ${s.index} · ${fmt(s.duration)} · ${esc(s.camera)}"><b class="tnum">${s.index}</b><small class="tnum">${fmt(s.duration)}</small></button>`).join('');
  $('#tlRuler').innerHTML = rulerMarks(input.duration).map((m) => `<span style="left:${(m / input.duration) * 100}%">${m}s</span>`).join('');
  $$('.tl-seg').forEach((b) => b.addEventListener('click', () => focusShot(Number(b.dataset.shot))));

  renderBoard();

  // bible
  const bi = sb.bible;
  $('#swatches').innerHTML = bi.palette.map((c) => `<div class="swatch"><i style="background:${esc(c)}"></i><code>${esc(c)}</code></div>`).join('');
  const rows = [['Subject', bi.subject], ['Character', bi.character], ['Wardrobe', bi.wardrobe], ['Setting', bi.setting], ['Lighting', bi.lighting], ['Lens package', bi.lensPackage], ['Grade', bi.grade], ['Texture', bi.texture], ['Music', bi.music], ['Negative', bi.negative]];
  $('#bibleList').innerHTML = rows.filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')
    + `<dt>Consistency tokens</dt><dd><div class="tokens"><code>${esc(bi.consistencyTokens)}</code><button type="button" class="btn btn-sm" id="copyTokens">Copy</button></div></dd>`;
  $('#copyTokens').addEventListener('click', () => copy(bi.consistencyTokens, 'Consistency tokens copied'));

  // beats + vo
  $('#beatRows').innerHTML = sb.beats.map((b) => {
    const v = sb.voiceover.find((x) => x.beat === b.name) || {};
    return `<tr><td><b>${esc(b.name)}</b><span class="muted cell-sub">${esc(b.purpose)}</span></td><td class="tnum nowrap">${tc(b.start)}–${tc(b.end)}</td><td>${v.line ? `"${esc(v.line)}"<span class="cell-sub ${v.fits === false ? 'warn' : 'muted'}">${v.words} words${v.fits === false ? ' · tight, consider trimming' : ''}</span>` : '<span class="muted">No line</span>'}</td></tr>`;
  }).join('');

  if (scroll && window.matchMedia('(max-width: 960px)').matches) $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBoard() {
  const { storyboard: sb, input } = state.data;
  const tool = state.tool;
  $('#tabNote').textContent = TOOL_NOTES[tool];
  $('#board').innerHTML = sb.shots.map((s) => `<article class="shot ${input.aspect === '16:9' ? 'wide' : ''}" id="shot-${s.index}" aria-label="Shot ${s.index}">
      <div class="frame-wrap ${input.aspect === '9:16' ? 'tall' : ''}">${frameHTML(s, sb.bible.palette, input.aspect)}</div>
      <div class="shot-body">
        <p class="shot-action">${esc(s.action)}</p>
        <dl class="meta">
          <div><dt>Time</dt><dd class="tnum">${tc(s.start)} · ${fmt(s.duration)}</dd></div>
          <div><dt>Lens</dt><dd>${esc(s.lens)}</dd></div>
          <div><dt>Camera</dt><dd>${esc(s.camera)}</dd></div>
          <div><dt>Transition</dt><dd>${esc(s.transition)}</dd></div>
          <div class="full"><dt>Lighting</dt><dd>${esc(s.lighting)}</dd></div>
          <div class="full"><dt>Sound</dt><dd>${esc(s.sfx)} · ${esc(s.music)}</dd></div>
          ${s.vo ? `<div class="full"><dt>Voiceover</dt><dd>"${esc(s.vo)}"</dd></div>` : ''}
        </dl>
        <div class="prompt-wrap">
          <div class="prompt-head"><span>${toolName(tool)} prompt</span><button class="btn btn-sm" type="button" data-copy="${s.index}">Copy</button></div>
          <pre class="prompt">${esc(s.prompts[tool])}</pre>
        </div>
      </div>
    </article>`).join('');
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    const s = sb.shots.find((x) => x.index === Number(b.dataset.copy));
    copy(s.prompts[state.tool], `Shot ${s.index} ${toolName(state.tool)} prompt copied`);
    b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1400);
  }));
}

function focusShot(n) {
  const el = $(`#shot-${n}`); if (!el) return;
  const board = $('#board');
  board.scrollTo({ left: el.offsetLeft - board.offsetLeft - 4, behavior: 'smooth' });
  $$('.tl-seg').forEach((b) => b.classList.toggle('active', Number(b.dataset.shot) === n));
  $$('.shot').forEach((x) => x.classList.toggle('active', x === el));
}

// tabs with arrow-key support
const tabs = $$('#tabs [role="tab"]');
function selectTab(b) {
  state.tool = b.dataset.tool;
  tabs.forEach((x) => { const on = x === b; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
  if (state.data) { const left = $('#board').scrollLeft; renderBoard(); $('#board').scrollLeft = left; }
}
tabs.forEach((b, i) => {
  b.addEventListener('click', () => selectTab(b));
  b.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    n.focus(); selectTab(n);
  });
});

// ---------- export ----------
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch {
    const t = Object.assign(document.createElement('textarea'), { value: text });
    t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand && document.execCommand('copy'); t.remove();
    toast(ok ? msg : 'Copy is blocked by the browser. Select the text instead.');
  }
}
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }

$('#copyAllBtn').addEventListener('click', () => {
  if (!state.data) return;
  copy(promptsText(state.data.storyboard, state.tool), `All ${state.data.storyboard.shots.length} ${toolName(state.tool)} prompts copied`);
});
$('#mdBtn').addEventListener('click', () => { if (state.data) { download(`${slug(state.data.storyboard.title)}.md`, toMarkdown(state.data), 'text/markdown'); toast('Markdown exported'); } });
$('#jsonBtn').addEventListener('click', () => { if (state.data) { download(`${slug(state.data.storyboard.title)}.json`, JSON.stringify(state.data, null, 2), 'application/json'); toast('JSON exported'); } });

// ---------- init ----------
renderPresets();
updateCount();
const q = new URLSearchParams(location.search).get('preset');
if (q && PRESETS.find((p) => p.id === q)) { applyPreset(PRESETS.find((p) => p.id === q)); generate(); }
