// Pure formatting and export helpers shared by the UI and the tests.
// No DOM access in this file.

export const TOOLS = ['kling', 'sora', 'veo', 'keyframe'];
export const toolName = (t) => ({ kling: 'Kling', sora: 'Sora', veo: 'Veo', keyframe: 'Keyframe' }[t] || t);

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 2.5 -> "2.5s", 3 -> "3s" */
export const fmt = (n) => `${Number(n).toFixed(1).replace(/\.0$/, '')}s`;

/** Seconds -> "MM:SS.s" timecode, e.g. 12.5 -> "00:12.5" */
export const tc = (n) => {
  const s = Math.round(Number(n) * 10) / 10;
  const m = Math.floor(s / 60);
  const r = (s - m * 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${r}`;
};

export const ratioClass = (a) => (a === '9:16' ? 'r916' : a === '1:1' ? 'r11' : 'r169');

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'storyboard';

/** Ruler marks for the timeline. */
export const rulerMarks = (d) => (d === 60 ? [0, 10, 20, 30, 40, 50, 60] : d === 30 ? [0, 5, 10, 15, 20, 25, 30] : [0, 3, 6, 9, 12, 15]);

export const totalDuration = (shots) => Math.round(shots.reduce((a, s) => a + Number(s.duration || 0), 0) * 10) / 10;

/** All prompts for one dialect as one copyable block. */
export function promptsText(storyboard, tool) {
  const sb = storyboard;
  return [
    `${sb.title}: ${toolName(tool)} prompts`,
    `Consistency: ${sb.bible.consistencyTokens}`,
    '',
    ...sb.shots.map((s) => `Shot ${s.index} (${s.beat}, ${fmt(s.duration)})\n${s.prompts[tool]}\n`),
  ].join('\n');
}

/** Client-ready Markdown brief: beats, bible, shot table, all prompts, VO. */
export function toMarkdown(data) {
  const { storyboard: sb, input, mode } = data;
  const b = sb.bible;
  const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
  const L = [];
  L.push(`# ${sb.title}`, '', `> ${sb.logline}`, '');
  L.push(`**Duration:** ${input.duration}s · **Aspect:** ${input.aspect} · **Mood:** ${input.mood} · **Shots:** ${sb.shots.length} · **Source:** ${mode === 'live' ? 'Gemini (live)' : 'Demo data'}`, '');
  L.push(`**Brief:** ${input.idea}`, '');
  L.push('## Beats', '', '| Beat | Time | Purpose |', '|---|---|---|');
  sb.beats.forEach((x) => L.push(`| ${x.name} | ${tc(x.start)}–${tc(x.end)} | ${cell(x.purpose)} |`));
  L.push('', '## Character & style bible', '');
  [['Subject', b.subject], ['Character', b.character], ['Wardrobe', b.wardrobe], ['Setting', b.setting], ['Palette', (b.palette || []).join(', ')], ['Lighting', b.lighting], ['Lens package', b.lensPackage], ['Grade', b.grade], ['Texture', b.texture], ['Music', b.music], ['Negative', b.negative], ['Consistency tokens', `\`${b.consistencyTokens}\``]]
    .forEach(([k, v]) => v && L.push(`- **${k}:** ${v}`));
  L.push('', '## Shot list', '', '| # | Beat | Time | Dur | Camera | Lens | Lighting | Action | Transition | SFX / Music |', '|---|---|---|---|---|---|---|---|---|---|');
  sb.shots.forEach((s) => L.push(`| ${s.index} | ${s.beat} | ${tc(s.start)} | ${fmt(s.duration)} | ${cell(s.camera)} | ${cell(s.lens)} | ${cell(s.lighting)} | ${cell(s.action)} | ${cell(s.transition)} | ${cell(s.sfx)} · ${cell(s.music)} |`));
  L.push('', '## Prompts', '');
  sb.shots.forEach((s) => {
    L.push(`### Shot ${s.index} · ${s.beat} · ${fmt(s.duration)}`, '');
    TOOLS.forEach((t) => L.push(`**${toolName(t)}**`, '', '```text', s.prompts[t], '```', ''));
  });
  L.push('## Voiceover', '');
  sb.voiceover.forEach((v) => L.push(`- \`${tc(v.start)}\` **${v.beat}:** "${v.line}"`));
  L.push('', '---', '_Made with AI Video Storyboard Studio by Sai Tarun · saitarun.com_');
  return L.join('\n');
}
