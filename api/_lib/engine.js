// Storyboard engine: input validation, deterministic demo generator,
// prompt dialect builders (Kling / Sora / Veo / Keyframe) and a normalizer
// that makes any result (live or demo) match the shape the UI expects.
// Files under api/_lib are not exposed as Vercel functions.

export const LIMITS = { idea: 600, brand: 80, mood: 40 };
export const DURATIONS = [15, 30, 60];
export const ASPECTS = ['9:16', '16:9', '1:1'];
export const STYLES = {
  cinematic: {
    label: 'Cinematic realism',
    palette: ['#11161F', '#3A4452', '#C9A96E'],
    lighting: 'motivated low-key light with soft key, gentle rim and deep shadows',
    grade: 'filmic contrast, rich blacks, subtle teal-amber split tone',
    texture: 'fine 35mm grain, natural halation on highlights',
    lenses: ['35mm anamorphic', '50mm prime', '85mm prime', '100mm macro', '24mm wide'],
    tokens: 'cinematic, photoreal, shallow depth of field, anamorphic bokeh',
  },
  noir: {
    label: 'Moody noir',
    palette: ['#07080C', '#1E2433', '#8A93A8'],
    lighting: 'hard single-source key, venetian-blind shadows, smoky volumetric haze',
    grade: 'desaturated near-monochrome, crushed blacks, silver highlights',
    texture: 'heavy grain, slight gate weave',
    lenses: ['40mm anamorphic', '85mm prime', '100mm macro', '28mm wide', '135mm tele'],
    tokens: 'film noir, chiaroscuro, volumetric haze, high contrast',
  },
  warmfilm: {
    label: 'Warm 35mm film',
    palette: ['#3A2418', '#C27A45', '#F4D9B0'],
    lighting: 'golden-hour window light, warm practicals, soft bounce fill',
    grade: 'Kodak Portra-like warmth, lifted shadows, creamy skin tones',
    texture: '35mm grain, gentle light leaks, soft vignette',
    lenses: ['35mm prime', '50mm prime', '28mm wide', '85mm prime', '60mm macro'],
    tokens: 'shot on 35mm film, warm, nostalgic, handheld intimacy',
  },
  cleantech: {
    label: 'Clean tech / minimal',
    palette: ['#0E1013', '#4A5361', '#E9ECEF'],
    lighting: 'soft high-key studio light, broad light sweeps, crisp edge highlights',
    grade: 'neutral clean grade, cool whites, controlled saturation',
    texture: 'pristine, no grain, glossy UI reflections',
    lenses: ['35mm prime', '50mm prime', '24mm wide', '85mm prime', '100mm macro'],
    tokens: 'minimal, premium tech commercial, clean composition, glossy',
  },
  documentary: {
    label: 'Dreamy documentary',
    palette: ['#14303A', '#5E8C82', '#E9D8B4'],
    lighting: 'natural available light, soft overcast or low sun, atmospheric haze',
    grade: 'soft pastel grade, gentle contrast, airy highlights',
    texture: 'light grain, organic handheld micro-movement',
    lenses: ['24mm wide', '35mm prime', '50mm prime', '16mm ultra-wide', '70-200mm tele'],
    tokens: 'documentary realism, dreamy, natural light, authentic moments',
  },
  surreal: {
    label: 'Surreal / dreamlike',
    palette: ['#1B2430', '#8C6E63', '#E4D8C8'],
    lighting: 'soft iridescent light, luminous rim, floating volumetric particles',
    grade: 'saturated jewel tones, bloom on highlights',
    texture: 'soft bloom, subtle chromatic aberration',
    lenses: ['24mm wide', '35mm prime', '50mm prime', '14mm ultra-wide', '100mm macro'],
    tokens: 'surreal, dreamlike, ethereal, impossible physics, high-end CGI',
  },
};

// ---------- category kits ----------
const KITS = {
  watch: {
    match: /\b(watch(es)?|chronograph|jewell?ery|perfume|fragrance|luxury|timepiece)\b/i,
    product: 'the timepiece',
    setting: 'a black marble surface in a dim private study',
    character: 'a man in his 30s in a charcoal tailored suit, silver cufflinks, calm deliberate hands',
    wardrobe: 'charcoal wool suit, white shirt, no visible logos except the product',
    shots: {
      hook: ['Extreme macro of the second hand sweeping across a sunburst dial, light catching each index', 'Total darkness; a single sliver of rim light slides across the bezel revealing its edge'],
      build: ['Slow orbit around the case as light rakes across brushed and polished surfaces', 'Macro of fingertips turning the crown, reflections rippling across the crystal', 'A hand fastens the leather strap; the deployant clasp clicks shut', 'Rack focus from a crystal glass to the watch resting beside it on marble'],
      turn: ['The wearer pauses at a rain-streaked window, city lights blooming behind him', 'Close-up of his eyes glancing down at the wrist, a quiet decision made'],
      reveal: ['Hero packshot: the watch stands upright on marble, thin smoke drifting behind, dial razor sharp', 'Wrist shot as he adjusts his cuff in one fluid motion, dial catching the key light'],
      cta: ['Logo lockup on deep black, tagline fades in beneath', 'Final packshot with a soft mirror reflection, clean negative space for the end card'],
    },
    sfx: { hook: 'amplified mechanical tick, sub-bass swell', build: 'fabric rustle, crisp crown clicks', turn: 'distant rain, muted city hum', reveal: 'deep cinematic hit, reverb tail', cta: 'single piano note, silence' },
    music: 'slow minimal piano with low strings, building to a restrained swell at the reveal',
    vo: { hook: 'Some things are measured in seconds.', build: 'Others, in generations. Crafted by hand, finished by light.', turn: 'For the moments you decide to keep.', reveal: '{brand}. Made to outlast the moment.', cta: 'Discover the collection.' },
  },
  cafe: {
    match: /(caf[eé]|\bcoffee|\bespresso|\blatte|\bbakery|\btea\b|\brestaurant|\bfood\b|\bbrunch|\bcroissant|\bmatcha)/i,
    product: 'the signature drink',
    setting: 'a sunlit neighbourhood café with wooden counters, plants and a vintage espresso machine',
    character: 'a friendly barista in her 20s, linen apron, rolled sleeves, small gold hoop earrings',
    wardrobe: 'sand linen apron over a white tee, natural makeup',
    shots: {
      hook: ['Macro of espresso streaming from the portafilter in slow motion, rich crema forming', 'Top-down shot of a hand placing a ceramic cup on a sunlit table, steam curling up'],
      build: ['The barista pours latte art, a rosetta blooming across the surface', 'Close-up of croissants being pulled warm from the oven, flakes catching the light', 'Customers laughing at a window seat, sunlight dappling through leaves', 'Slow push across the counter past jars of beans and handwritten menu boards'],
      turn: ['A regular walks in and the barista already has their order ready, both smile', 'Steam rises past the window as morning commuters blur outside'],
      reveal: ['Hero shot of the signature drink on the counter, logo cup facing camera, soft backlight', 'Wide shot of the café alive with morning energy, sign visible through the window'],
      cta: ['The barista slides the cup toward camera with a warm smile', 'End card over a blurred café background: location and opening hours'],
    },
    sfx: { hook: 'espresso machine hiss, gentle drip', build: 'milk steaming, cups clinking, soft chatter', turn: 'door bell chime, street ambience', reveal: 'warm acoustic guitar lift', cta: 'cup set down on wood, light laugh' },
    music: 'warm lo-fi acoustic guitar with soft brushed percussion',
    vo: { hook: 'Mornings start better here.', build: 'Beans roasted this week. Pastries baked at dawn.', turn: 'A place that remembers your order.', reveal: '{brand}. Your neighbourhood cup.', cta: 'Come say hi.' },
  },
  tech: {
    match: /\b(saas|software|apps?|platform|dashboard|ai|startup|api|automation|product hunt|tool|crm|fintech)\b/i,
    product: 'the product interface',
    setting: 'a minimal dark studio with floating glass UI panels and soft gradient light',
    character: 'a focused founder in their late 20s, black crewneck, clean minimal look',
    wardrobe: 'black crewneck, silver watch, no visible third-party logos',
    shots: {
      hook: ['A cluttered desktop of spreadsheets and tabs shatters into particles', 'Black frame; a single cursor blinks, then a glowing line of light draws across the screen'],
      build: ['Floating glass UI panels assemble in mid-air, data flowing between them as light trails', 'Macro of a fingertip tapping a glossy button; a ripple of light spreads through the interface', 'Dashboard charts animate upward in clean motion, numbers ticking', 'The founder leans back, relieved, screen glow on their face'],
      turn: ['Time-lapse: a week of work compressed into seconds as tasks auto-complete', 'Notifications cascade and resolve themselves into a single green check'],
      reveal: ['Hero shot: the product UI on a floating laptop, logo materialising in light', 'Orbit around the interface as all panels lock into a perfect grid'],
      cta: ['Logo lockup with "Launching soon" and a glowing waitlist button', 'End card: URL and launch date on a deep gradient'],
    },
    sfx: { hook: 'glass shatter reversed, digital whoosh', build: 'soft UI clicks, data shimmer', turn: 'accelerating ticks, riser', reveal: 'bass drop, bright synth stab', cta: 'clean UI chime' },
    music: 'pulsing modern synth with a tight beat, riser into a bass drop at the reveal',
    vo: { hook: 'Work used to look like this.', build: 'Now it runs itself. Every task, connected.', turn: 'Hours become minutes.', reveal: 'Meet {brand}.', cta: 'Join the waitlist today.' },
  },
  travel: {
    match: /\b(travel|trip|journey|city|mountains?|beach|island|hotel|resort|tour|kerala|goa|bali|himalaya[sn]?|wander\w*|backwaters|ladakh)\b/i,
    product: 'the destination',
    setting: 'misty mountain roads, an old town at golden hour and a quiet coastline',
    character: 'a solo traveller in their 20s, olive field jacket, canvas backpack, film camera on a strap',
    wardrobe: 'olive field jacket, cream knit, worn leather boots, canvas backpack',
    shots: {
      hook: ['Drone rises over a sea of clouds as the sun breaks the horizon', 'Close-up of a hand pressing against a train window, landscape streaking past'],
      build: ['The traveller walks through a narrow old-town lane, lanterns flickering on', 'Macro of street food sizzling on a hot pan, steam in backlight', 'Wide shot of the traveller on a cliff edge, wind moving the jacket', 'Handheld follow through a bustling market, colours and faces in soft focus'],
      turn: ['The traveller sits with locals sharing tea, genuine laughter', 'Rain begins; they run for cover, laughing, under a temple awning'],
      reveal: ['Epic wide: the traveller tiny against a vast landscape at golden hour', 'Slow-motion turn to camera with a quiet smile, sun flare behind'],
      cta: ['Title card over a drifting aerial shot of the coastline', 'Film camera shutter clicks; frame freezes into a polaroid with the logo'],
    },
    sfx: { hook: 'wind, distant birds, train rhythm', build: 'market chatter, sizzle, footsteps on stone', turn: 'rain on tin roof, laughter', reveal: 'swelling strings, wind gust', cta: 'film shutter click' },
    music: 'emotive ambient score with acoustic guitar and rising strings',
    vo: { hook: 'Some places you visit.', build: 'Others stay with you. The food, the faces, the way the light falls.', turn: 'You came to see it. You leave a little changed.', reveal: '{brand}. Go further.', cta: 'Plan your journey.' },
  },
  generic: {
    match: /.*/,
    product: 'the product',
    setting: 'a premium studio set with sculpted light and a seamless backdrop',
    character: 'a confident lead in their late 20s with a natural, effortless look',
    wardrobe: 'neutral tailored basics in tones that echo the palette',
    shots: {
      hook: ['Macro detail of the product emerging from darkness as light sweeps across it', 'A bold graphic shape morphs into the product silhouette'],
      build: ['Slow orbit around the product revealing materials and texture', 'The lead picks up the product and uses it in one natural gesture', 'Close-up of a key feature in action, captured in slow motion', 'Lifestyle moment: the product fits seamlessly into everyday life'],
      turn: ['A small problem appears; the product solves it effortlessly', 'The lead shares a knowing glance with camera'],
      reveal: ['Hero packshot centred on a plinth with soft reflections', 'Wide shot of the lead with the product, framed with confident symmetry'],
      cta: ['Logo lockup with tagline', 'End card with offer and URL in clean negative space'],
    },
    sfx: { hook: 'deep whoosh, sub hit', build: 'tactile foley, soft clicks', turn: 'riser', reveal: 'cinematic impact', cta: 'clean tonal chime' },
    music: 'modern cinematic pulse with a confident build',
    vo: { hook: 'It starts with a detail.', build: 'Designed with intent. Built for the way you live.', turn: 'Simple, the way it should be.', reveal: '{brand}.', cta: 'Discover more.' },
  },
};

const CAMERA = {
  hook: ['slow push-in', 'static locked-off macro', 'crane rise', 'snap zoom'],
  build: ['slow orbit', 'lateral dolly', 'rack focus', 'handheld follow', 'top-down slide', 'parallax truck'],
  turn: ['slow push-in', 'over-the-shoulder drift', 'time-lapse locked-off', 'whip pan'],
  reveal: ['hero orbit', 'pull-back reveal', 'crane down', 'slow-motion push-in'],
  cta: ['static locked-off', 'gentle push-in', 'slow drift'],
};
const TRANSITIONS = {
  hook: ['Hard cut', 'Match cut on shape', 'Light-flash cut'],
  build: ['Cut on action', 'Match cut', 'Whip pan', 'Cross-dissolve'],
  turn: ['Cut on action', 'J-cut (audio leads)', 'Speed ramp'],
  reveal: ['Speed ramp into hit', 'Hard cut on beat', 'Light leak'],
  cta: ['Fade to black', 'Dip to brand colour', 'End'],
};

const BEAT_PLANS = {
  15: [['hook', 1, 0.2], ['build', 2, 0.4], ['reveal', 1, 0.24], ['cta', 1, 0.16]],
  30: [['hook', 1, 0.12], ['build', 3, 0.38], ['reveal', 2, 0.32], ['cta', 2, 0.18]],
  60: [['hook', 2, 0.12], ['build', 4, 0.33], ['turn', 2, 0.2], ['reveal', 2, 0.22], ['cta', 2, 0.13]],
};
const BEAT_META = {
  hook: { name: 'Hook', purpose: 'Stop the scroll in the first second with a striking image or sound.' },
  build: { name: 'Build', purpose: 'Show craft, texture and context; build desire and trust.' },
  turn: { name: 'Turn', purpose: 'Emotional shift: the human moment that makes it matter.' },
  reveal: { name: 'Reveal', purpose: 'Hero moment: product / brand at its best, on the music hit.' },
  cta: { name: 'CTA', purpose: 'Land the brand and a single clear action.' },
};

// ---------- helpers ----------
const CAMERA_RULES = [
  [/drone|aerial/i, 'aerial drone rise'],
  [/orbit/i, 'slow orbit'],
  [/rack focus/i, 'rack focus'],
  [/top-down/i, 'top-down static'],
  [/time-lapse/i, 'time-lapse locked-off'],
  [/handheld|follow|walks|run/i, 'handheld follow'],
  [/push across|slow push/i, 'lateral dolly'],
  [/turn to camera|slides the cup toward camera/i, 'slow-motion push-in'],
  [/logo|end card|title card|lockup/i, 'static locked-off'],
  [/macro|close-up/i, 'slow macro push-in'],
  [/epic wide|wide shot/i, 'slow pull-back reveal'],
];
function cameraFor(action, beat, pick) {
  for (const [re, move] of CAMERA_RULES) if (re.test(action)) return move;
  return pick(CAMERA[beat]);
}
function lensFor(action, st, pick) {
  const find = (re, fb) => st.lenses.find((l) => re.test(l)) || fb;
  if (/logo|end card|title card|lockup/i.test(action)) return '50mm prime';
  if (/macro/i.test(action)) return find(/macro/, '100mm macro');
  if (/close-up|eyes|glance|smile|packshot|hero shot|wrist/i.test(action)) return find(/85mm|135mm/, '85mm prime');
  if (/drone|aerial|epic wide|wide shot|landscape|cliff/i.test(action)) return find(/wide/, '24mm wide');
  return pick(st.lenses.filter((l) => !/macro/.test(l)));
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
}
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F]+/g, ' ').trim().slice(0, max);
const round1 = (n) => Math.round(n * 10) / 10;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function validateInput(body = {}) {
  const idea = clean(body.idea, LIMITS.idea);
  const brand = clean(body.brand, LIMITS.brand);
  const mood = clean(body.mood, LIMITS.mood) || 'cinematic';
  const duration = DURATIONS.includes(Number(body.duration)) ? Number(body.duration) : 30;
  const aspect = ASPECTS.includes(body.aspect) ? body.aspect : '16:9';
  const style = STYLES[body.style] ? body.style : 'cinematic';
  const errors = [];
  if (idea.length < 8) errors.push('Describe the idea in at least a few words (8+ characters).');
  if (String(body.idea ?? '').length > LIMITS.idea) errors.push(`Idea is limited to ${LIMITS.idea} characters.`);
  return { input: { idea, brand, mood, duration, aspect, style }, errors };
}

export function pickKit(input) {
  const text = `${input.brand} ${input.idea}`;
  // Score each kit by keyword hits; the brief's dominant theme wins (ties: earlier kit).
  let best = 'generic', bestScore = 0;
  for (const key of ['tech', 'watch', 'travel', 'cafe']) {
    const re = new RegExp(KITS[key].match.source, 'gi');
    const score = (text.match(re) || []).length;
    if (score > bestScore) { best = key; bestScore = score; }
  }
  return best;
}

// Allocate durations in 0.5s steps so they sum exactly to the target.
export function allocateDurations(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const steps = total * 2;
  let raw = weights.map((w) => Math.max(1, Math.round((w / sum) * steps)));
  let diff = steps - raw.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0 && i < 1000) {
    const idx = i % raw.length;
    if (diff > 0) { raw[idx]++; diff--; } else if (raw[idx] > 2) { raw[idx]--; diff++; }
    i++;
  }
  return raw.map((r) => r / 2);
}

function genLength(tool, secs) {
  if (tool === 'kling') return secs <= 5 ? 5 : 10;
  if (tool === 'veo') return 8;
  if (tool === 'sora') return secs <= 5 ? 5 : secs <= 10 ? 10 : 15;
  return null;
}

// ---------- prompt dialects ----------
export function buildPrompts(shot, bible, input) {
  const st = STYLES[input.style] || STYLES.cinematic;
  const subj = bible.subject;
  const char = bible.character;
  const palette = bible.palette.join(', ');
  const ar = input.aspect;
  const kling = [
    `${shot.action}. Featuring ${subj}${shot.usesCharacter ? `, with ${char}` : ''}.`,
    `Scene: ${bible.setting}.`,
    `Camera: ${shot.camera}, ${shot.lens} lens, smooth and stable.`,
    `Lighting: ${shot.lighting}.`,
    `Style: ${st.tokens}, ${input.mood} mood, colour palette ${palette}.`,
    `Negative: ${bible.negative}.`,
    `[Kling settings] aspect ${ar} · generate ${genLength('kling', shot.duration)}s → trim to ${shot.duration}s · Professional mode · camera control: ${shot.camera}${shot.index > 1 ? ' · use previous keyframe as start frame for continuity' : ''}`,
  ].join('\n');
  const sora = `${/^[aeiou]/i.test(input.mood) ? 'An' : 'A'} ${input.mood}, ${st.label.toLowerCase()} shot in ${ar}. ${shot.action}. Setting: ${bible.setting}. ` +
    `${shot.usesCharacter ? `The scene features ${char} (wardrobe: ${bible.wardrobe}). ` : ''}` +
    `The camera performs a ${shot.camera} on a ${shot.lens} lens, ${shot.duration <= 3 ? 'quick and precise' : 'unhurried and deliberate'}. ` +
    `Lighting is ${shot.lighting}. Colour palette of ${palette}; ${bible.grade}; ${bible.texture}. ` +
    `Physical realism, consistent subject identity, no text or watermarks. Duration about ${shot.duration} seconds (generate ${genLength('sora', shot.duration)}s).`;
  const veo = [
    `Subject: ${subj}${shot.usesCharacter ? `; ${char}` : ''}`,
    `Action: ${shot.action}`,
    `Scene: ${bible.setting}`,
    `Camera: ${shot.camera}; lens ${shot.lens}; aspect ${ar}`,
    `Lighting: ${shot.lighting}`,
    `Style: ${st.tokens}; ${bible.grade}`,
    `Audio: SFX — ${shot.sfx}; music — ${shot.music}${shot.vo ? `; voiceover (calm, close-mic): "${shot.vo}"` : '; no dialogue'}`,
    `Avoid: ${bible.negative}`,
    `[Veo] 8s clip → trim to ${shot.duration}s`,
  ].join('\n');
  const keyframe = `Still keyframe, ${ar} aspect ratio, ${st.label.toLowerCase()}. ${shot.action}. ` +
    `${shot.usesCharacter ? `${cap(char)} (wardrobe: ${bible.wardrobe}). ` : ''}` +
    `Setting: ${bible.setting}. Shot on a ${shot.lens} lens, ${shot.lighting}. Palette ${palette}; ${bible.grade}; ${bible.texture}. ` +
    `Ultra-detailed, editorial composition, leave natural headroom, no text, no watermark. Use as the image-to-video start frame for shot ${shot.index}.`;
  return { kling, sora, veo, keyframe };
}

// ---------- demo generator ----------
export function generateDemo(input) {
  const kitKey = pickKit(input);
  const kit = KITS[kitKey];
  const st = STYLES[input.style];
  const r = rng(hash(JSON.stringify(input)));
  const pick = (arr) => arr[Math.floor(r() * arr.length) % arr.length];
  const brand = input.brand || (kitKey === 'generic' ? 'The brand' : cap(kit.product.replace(/^the /, '')));
  const subject = input.brand ? `${kit.product.replace(/^the /, `${input.brand}'s `)}` : kit.product;

  const bible = {
    subject,
    character: kit.character,
    wardrobe: kit.wardrobe,
    setting: kit.setting,
    palette: st.palette,
    lighting: st.lighting,
    lensPackage: st.lenses.slice(0, 4).join(', '),
    grade: st.grade,
    texture: st.texture,
    consistencyTokens: `${input.brand || brand} hero, ${kit.character.split(',')[0]}, ${st.label.toLowerCase()}, palette ${st.palette.join('/')}`,
    negative: 'warped hands, extra fingers, flicker, morphing logos, garbled text, oversaturated, low-res, watermark',
    music: kit.music,
  };

  const plan = BEAT_PLANS[input.duration];
  const weights = [];
  const slots = [];
  plan.forEach(([beat, count, share]) => {
    for (let i = 0; i < count; i++) { slots.push(beat); weights.push(share / count); }
  });
  const durs = allocateDurations(weights, input.duration);

  const used = new Set();
  const beatCounters = {};
  let t = 0;
  const shots = slots.map((beat, i) => {
    beatCounters[beat] = (beatCounters[beat] || 0) + 1;
    const pool = kit.shots[beat];
    let action = pool[(beatCounters[beat] - 1) % pool.length];
    if (used.has(action)) action = pick(pool);
    used.add(action);
    const lens = lensFor(action, st, pick);
    const shot = {
      index: i + 1,
      beat,
      start: round1(t),
      duration: durs[i],
      camera: cameraFor(action, beat, pick),
      lens,
      lighting: `${st.lighting.split(',')[0]}${beat === 'reveal' ? ', strong hero backlight' : beat === 'hook' ? ', high contrast' : ''}`,
      action,
      usesCharacter: /(?<!second )\b(hands?|fingertips|wearer|barista|founder|traveller|lead|he|she|his|her|customers|regular|locals|they)\b/i.test(action),
      transition: i === slots.length - 1 ? 'End on brand' : pick(TRANSITIONS[beat]),
      sfx: kit.sfx[beat],
      music: beat === 'hook' ? 'intro motif, sparse' : beat === 'reveal' ? 'music hit / drop' : beat === 'cta' ? 'resolve and tail out' : 'build layer by layer',
    };
    t += durs[i];
    return shot;
  });

  // Beats with timing
  const beats = [];
  plan.forEach(([beat]) => {
    const s = shots.filter((x) => x.beat === beat);
    const start = s[0].start;
    const end = round1(s[s.length - 1].start + s[s.length - 1].duration);
    beats.push({ key: beat, name: BEAT_META[beat].name, purpose: BEAT_META[beat].purpose, start, end });
  });

  // Voiceover: one line per beat, placed on the beat's first shot
  const voiceover = beats.map((b) => {
    const line = kit.vo[b.key].replace('{brand}', brand);
    const words = line.split(/\s+/).length;
    return { beat: b.name, start: b.start, end: b.end, line, words, fits: words / 2.6 <= b.end - b.start + 0.3 };
  });
  beats.forEach((b) => {
    const first = shots.find((s) => s.beat === b.key);
    first.vo = voiceover.find((v) => v.beat === b.name).line;
  });

  shots.forEach((s) => { s.prompts = buildPrompts(s, bible, input); });

  const moodWord = input.mood.toLowerCase();
  return {
    title: `${brand} · ${input.duration}s ${st.label} spot`,
    logline: `${/^[aeiou]/i.test(moodWord) ? 'An' : 'A'} ${moodWord}, ${st.label.toLowerCase()} ${input.duration}-second ${input.aspect === '9:16' ? 'vertical reel' : input.aspect === '1:1' ? 'square social cut' : 'widescreen film'} that ${kitKey === 'tech' ? 'turns chaos into clarity and lands' : kitKey === 'travel' ? 'pulls the viewer into a journey and lands' : 'moves from intimate detail to a hero reveal of'} ${input.brand || subject}.`,
    category: kitKey,
    beats,
    bible,
    shots,
    voiceover,
  };
}

// ---------- normalizer (for live LLM output) ----------
export function normalize(raw, input) {
  if (!raw || !Array.isArray(raw.shots) || raw.shots.length < 3) throw new Error('bad shape');
  const demo = generateDemo(input);
  const b = raw.bible || {};
  const bible = {
    ...demo.bible,
    ...Object.fromEntries(Object.entries(b).filter(([, v]) => typeof v === 'string' && v.trim())),
    palette: Array.isArray(b.palette) && b.palette.every((c) => /^#[0-9a-f]{6}$/i.test(c)) && b.palette.length >= 3 ? b.palette.slice(0, 3) : demo.bible.palette,
  };
  const list = raw.shots.slice(0, 16);
  const durs = allocateDurations(list.map((s) => Math.max(0.5, Number(s.duration) || 1)), input.duration);
  const beatKey = (name) => {
    const n = String(name || '').toLowerCase();
    return Object.keys(BEAT_META).find((k) => n.includes(k) || n.includes(BEAT_META[k].name.toLowerCase())) || 'build';
  };
  let t = 0;
  const shots = list.map((s, i) => {
    const shot = {
      index: i + 1,
      beat: beatKey(s.beat),
      start: round1(t),
      duration: durs[i],
      camera: clean(s.camera, 80) || 'slow push-in',
      lens: clean(s.lens, 40) || '50mm prime',
      lighting: clean(s.lighting, 160) || bible.lighting,
      action: clean(s.action, 300) || 'Hero detail of the subject',
      usesCharacter: s.usesCharacter !== false,
      transition: clean(s.transition, 60) || 'Cut',
      sfx: clean(s.sfx, 120) || '—',
      music: clean(s.music, 120) || '—',
      vo: clean(s.vo, 200) || '',
    };
    t += durs[i];
    const built = buildPrompts(shot, bible, input);
    const p = s.prompts || {};
    shot.prompts = {
      kling: clean(p.kling, 1500) || built.kling,
      sora: clean(p.sora, 1500) || built.sora,
      veo: clean(p.veo, 1500) || built.veo,
      keyframe: clean(p.keyframe, 1500) || built.keyframe,
    };
    return shot;
  });
  const order = ['hook', 'build', 'turn', 'reveal', 'cta'];
  const beats = order.filter((k) => shots.some((s) => s.beat === k)).map((k) => {
    const s = shots.filter((x) => x.beat === k);
    return { key: k, name: BEAT_META[k].name, purpose: BEAT_META[k].purpose, start: s[0].start, end: round1(s[s.length - 1].start + s[s.length - 1].duration) };
  });
  const vo = Array.isArray(raw.voiceover) && raw.voiceover.length ? raw.voiceover.slice(0, 12).map((v) => {
    const line = clean(v.line, 240);
    const words = line.split(/\s+/).filter(Boolean).length;
    return { beat: clean(v.beat, 20) || 'Build', start: Number(v.start) || 0, end: Number(v.end) || 0, line, words, fits: true };
  }).filter((v) => v.line) : demo.voiceover;
  return {
    title: clean(raw.title, 120) || demo.title,
    logline: clean(raw.logline, 400) || demo.logline,
    category: demo.category,
    beats,
    bible,
    shots,
    voiceover: vo,
  };
}

export function llmPrompt(input) {
  return `You are a senior commercial director and AI video prompt engineer (Kling, Sora, Google Veo, Nanobanana/Krea keyframes).
Create a production-ready storyboard as STRICT JSON for:
- Idea: ${input.idea}
- Brand/product: ${input.brand || '(unnamed)'}
- Mood: ${input.mood}
- Total duration: ${input.duration} seconds (shot durations MUST sum to exactly ${input.duration})
- Aspect ratio: ${input.aspect}
- Visual style: ${STYLES[input.style].label}

Return JSON with keys:
title (string), logline (one sentence),
bible: { subject, character, wardrobe, setting, palette: [3 hex colours], lighting, lensPackage, grade, texture, consistencyTokens, negative, music },
shots: array of ${input.duration === 15 ? '4-6' : input.duration === 30 ? '7-9' : '10-14'} objects { beat: one of Hook|Build|Turn|Reveal|CTA, duration (seconds, 0.5 steps), camera, lens, lighting, action (what the subject does, vivid, specific), usesCharacter (bool), transition, sfx, music, vo (voiceover line or empty), prompts: { kling, sora, veo, keyframe } },
voiceover: array of { beat, start, end, line } (~2.5 words per second, never over-written).
Prompt dialects: kling = concise comma-led subject/action/scene/camera/lighting/style + "Negative:" line; sora = flowing cinematic prose paragraph with physics and continuity; veo = labelled lines Subject/Action/Scene/Camera/Lighting/Style/Audio (include SFX, music and VO); keyframe = a still image prompt for the first frame. Keep character and palette identical across all shots. No text in frames, no real people or trademarks other than the given brand.`;
}
