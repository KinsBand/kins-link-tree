/* Coordinates describe artwork; paint and UI sizes live in semantic tokens.
 * Generate every peg, including custom 1–12 string setups. */
export function getInstrumentArt(instrumentId, stringCount) {
  if (!['electric', 'acoustic', 'bass'].includes(instrumentId)) return '';
  const count = Math.max(1, Math.min(12, Number(stringCount) || 6));
  const acoustic = instrumentId === 'acoustic', bass = instrumentId === 'bass';
  const split = acoustic || count > 6;
  const rows = split ? Math.ceil(count / 2) : count;
  const top = 112, spacing = 54, nut = top + rows * spacing + 22, height = nut + 90;
  // Swept electric headstock, broad bass paddle, symmetric acoustic crown.
  const outline = split
    ? `M112 ${nut} L106 85 Q94 56 108 30 Q129 35 143 22 Q160 32 177 22 Q191 35 212 30 Q226 56 214 85 L208 ${nut} Z`
    : bass
      ? `M141 ${nut} Q130 ${nut - 28} 110 ${nut - 42} L102 87 Q82 38 122 22 Q170 8 194 41 Q200 58 183 94 L175 ${nut} Z`
      : `M140 ${nut} Q132 ${nut - 25} 108 ${nut - 38} L103 61 Q96 26 126 20 Q155 12 188 33 Q207 48 182 61 L174 ${nut} Z`;
  let hardware = '', strings = '', pegs = '';
  for (let i = 0; i < count; i++) {
    const left = !split || i < rows, row = left ? rows - 1 - i : i - rows;
    const y = top + Math.max(0, row) * spacing, x = left ? 64 : 256;
    const post = left ? (split ? 122 : 126) : 198;
    const stringX = (split ? 123 : 143) + i * ((split ? 74 : 28) / Math.max(1, count - 1));
    const gauge = Math.max(0.5, bass ? 2.7 - i * 0.22 : 1.9 - i * 0.07);
    hardware += `<path class="art-metal-line" d="M${x} ${y} H${post}"/><circle class="art-washer" cx="${post}" cy="${y}" r="10"/><circle class="art-core" cx="${post}" cy="${y}" r="4"/>`;
    strings += `<path class="tuner-string-line str-s${i}" stroke-width="${gauge}" d="M${stringX} ${height} V${nut + 2} L${post} ${y}"/><circle class="art-string-wrap str-s${i}" cx="${post}" cy="${y}" r="6"/>`;
    const key = `<rect class="tuner-peg-circle" x="${x - 23}" y="${y - 19}" width="46" height="38" rx="10"/>`;
    pegs += `<g class="tuner-peg brutal-press" data-string-index="${i}" role="button" tabindex="0" aria-label="Target string ${count - i}"><rect class="art-hit-target" x="${x - 26}" y="${y - 26}" width="52" height="52" rx="8"/>${key}<text class="tuner-peg-label" x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle">${count - i}</text></g>`;
  }
  const highlights = Array.from({ length: count }, (_, i) => `.tuner-art-svg:has([data-string-index="${i}"].is-active) .str-s${i},.tuner-art-svg:has([data-string-index="${i}"]:hover) .str-s${i}{stroke:var(--brand-accent-primary)}`).join('');
  return `<svg class="tuner-art-svg art-${instrumentId}" viewBox="0 0 320 ${height}" role="group" aria-label="${instrumentId} guitar headstock with ${count} playable tuning pegs">
    <style>${highlights}</style>
    <path class="art-fretboard" d="M${split ? 112 : 138} ${nut} H${split ? 208 : 179} L${split ? 216 : 187} ${height} H${split ? 104 : 130} Z"/>
    <path class="tuner-headstock-outline" d="${outline}"/>
    <path class="art-fret" d="M${split ? 110 : 136} ${nut + 43} H${split ? 211 : 182} M${split ? 107 : 133} ${nut + 83} H${split ? 214 : 185}"/>
    <circle class="art-inlay" cx="${split ? 160 : 158}" cy="${nut + 64}" r="4"/>
    <text class="art-brand" x="${split ? 160 : 148}" y="54" text-anchor="middle">KINS</text>
    ${acoustic ? `<path class="art-truss" d="M148 ${nut - 12} Q160 ${nut - 65} 172 ${nut - 12} Z"/><circle class="art-core" cx="160" cy="${nut - 19}" r="2"/>` : `<ellipse class="art-truss" cx="157" cy="${nut - 19}" rx="5" ry="10"/>`}
    ${hardware}<path class="art-nut" d="M${split ? 112 : 138} ${nut} H${split ? 208 : 179} v8 H${split ? 112 : 138} Z"/>
    ${strings}${pegs}</svg>`;
}
