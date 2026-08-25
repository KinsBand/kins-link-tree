/* ==========================================================================
   KINS Tuner — Instrument Headstock SVGs (Neo-Brutalist Harmonized Style)
   Consistent geometry, tactile drop shadow filter, purfling, yellow inlays,
   synchronized string highlighting via CSS :has(), and clean string wraps.
   ========================================================================== */

const SVG_STYLE_BASE = `
  <defs>
    <filter id="brutal-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="0" flood-color="#000000" flood-opacity="1" />
    </filter>

    <style>
      .tuner-bg { fill: transparent; }
      
      .tuner-headstock-outline {
        fill: rgba(0, 0, 0, 0.35);
        stroke: #F5F4EF;
        stroke-width: 3px;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .tuner-purfling {
        fill: none;
        stroke: rgba(255, 255, 255, 0.08);
        stroke-width: 1.5px;
      }
      .tuner-headstock-inlay {
        fill: #F2FD43;
      }
      
      .tuner-truss-cover {
        fill: #0A0A0A;
        stroke: rgba(255, 255, 255, 0.25);
        stroke-width: 1.5px;
        stroke-linejoin: round;
      }
      .tuner-truss-screw {
        fill: #F5F4EF;
        opacity: 0.45;
      }
      .tuner-fretboard-base {
        fill: #0c0c0c;
        stroke: #F5F4EF;
        stroke-width: 2px;
      }
      .tuner-nut {
        fill: #F5F4EF;
        stroke: #000000;
        stroke-width: 2px;
      }
      .tuner-nut-slot {
        stroke: #000000;
        stroke-opacity: 0.4;
      }
      
      .tuner-peg-post {
        stroke: #F5F4EF;
        stroke-width: 4.5px;
        stroke-linecap: round;
      }
      .tuner-bushing-washer {
        fill: #141414;
        stroke: #F5F4EF;
        stroke-width: 1.5px;
      }
      .tuner-peg-bushing {
        fill: #222222;
        stroke: #000000;
        stroke-width: 1.2px;
      }
      .tuner-post-core {
        fill: #F5F4EF;
        opacity: 0.9;
      }

      .tuner-string-line {
        stroke: rgba(245, 244, 239, 0.45);
        stroke-linecap: round;
        transition: stroke 0.2s ease, stroke-width 0.2s ease, opacity 0.2s ease;
      }
      .tuner-string-wrap {
        fill: none;
        stroke: rgba(245, 244, 239, 0.45);
        transition: stroke 0.2s ease, opacity 0.2s ease;
      }

      .tuner-peg {
        cursor: pointer;
        outline: none;
        -webkit-tap-highlight-color: transparent;
      }
      .tuner-peg-glow {
        fill: #F2FD43;
        opacity: 0;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tuner-peg-ring {
        fill: none;
        stroke: #F5F4EF;
        stroke-width: 1.5px;
        stroke-dasharray: 2.5 3.5;
        opacity: 0.35;
        transition: stroke 0.2s ease, opacity 0.2s ease, stroke-dasharray 0.2s ease;
      }
      .tuner-peg-circle {
        fill: #F5F4EF;
        stroke: #000000;
        stroke-width: 2.8px;
        filter: url(#brutal-shadow);
        transition: fill 0.15s ease, stroke 0.15s ease;
      }
      .tuner-peg-label {
        fill: #000000;
        font-family: 'Space Grotesk', 'Impact', 'Inter', system-ui, sans-serif;
        font-size: 20px;
        font-weight: 800;
        user-select: none;
        pointer-events: none;
        transition: fill 0.15s ease;
      }

      .tuner-peg:hover .tuner-peg-glow,
      .tuner-peg:focus-visible .tuner-peg-glow {
        opacity: 0.28;
      }
      .tuner-peg:hover .tuner-peg-ring,
      .tuner-peg:focus-visible .tuner-peg-ring {
        opacity: 0.95;
        stroke: #F2FD43;
        stroke-dasharray: none;
      }
      .tuner-peg:hover .tuner-peg-circle,
      .tuner-peg:focus-visible .tuner-peg-circle {
        fill: #FFFFFF;
      }

      .tuner-peg:active .tuner-peg-circle,
      .tuner-peg.is-active .tuner-peg-circle {
        fill: #F2FD43;
      }
      .tuner-peg:active .tuner-peg-glow,
      .tuner-peg.is-active .tuner-peg-glow {
        opacity: 0.55;
      }
      .tuner-peg:active .tuner-peg-ring,
      .tuner-peg.is-active .tuner-peg-ring {
        stroke: #F2FD43;
        opacity: 1;
        stroke-dasharray: none;
      }
      .tuner-peg.is-in-tune .tuner-peg-circle {
        fill: #53FC18;
      }
      .tuner-peg.is-in-tune .tuner-peg-glow {
        fill: #53FC18;
        opacity: 0.6;
      }

      svg:has(.tuner-peg[data-string-index="0"]:hover) .str-s0,
      svg:has(.tuner-peg[data-string-index="0"]:focus-visible) .str-s0,
      svg:has(.tuner-peg[data-string-index="0"].is-active) .str-s0 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="1"]:hover) .str-s1,
      svg:has(.tuner-peg[data-string-index="1"]:focus-visible) .str-s1,
      svg:has(.tuner-peg[data-string-index="1"].is-active) .str-s1 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="2"]:hover) .str-s2,
      svg:has(.tuner-peg[data-string-index="2"]:focus-visible) .str-s2,
      svg:has(.tuner-peg[data-string-index="2"].is-active) .str-s2 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="3"]:hover) .str-s3,
      svg:has(.tuner-peg[data-string-index="3"]:focus-visible) .str-s3,
      svg:has(.tuner-peg[data-string-index="3"].is-active) .str-s3 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="4"]:hover) .str-s4,
      svg:has(.tuner-peg[data-string-index="4"]:focus-visible) .str-s4,
      svg:has(.tuner-peg[data-string-index="4"].is-active) .str-s4 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="5"]:hover) .str-s5,
      svg:has(.tuner-peg[data-string-index="5"]:focus-visible) .str-s5,
      svg:has(.tuner-peg[data-string-index="5"].is-active) .str-s5 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="6"]:hover) .str-s6,
      svg:has(.tuner-peg[data-string-index="6"]:focus-visible) .str-s6,
      svg:has(.tuner-peg[data-string-index="6"].is-active) .str-s6 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="7"]:hover) .str-s7,
      svg:has(.tuner-peg[data-string-index="7"]:focus-visible) .str-s7,
      svg:has(.tuner-peg[data-string-index="7"].is-active) .str-s7 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="8"]:hover) .str-s8,
      svg:has(.tuner-peg[data-string-index="8"]:focus-visible) .str-s8,
      svg:has(.tuner-peg[data-string-index="8"].is-active) .str-s8 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="9"]:hover) .str-s9,
      svg:has(.tuner-peg[data-string-index="9"]:focus-visible) .str-s9,
      svg:has(.tuner-peg[data-string-index="9"].is-active) .str-s9 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="10"]:hover) .str-s10,
      svg:has(.tuner-peg[data-string-index="10"]:focus-visible) .str-s10,
      svg:has(.tuner-peg[data-string-index="10"].is-active) .str-s10 {
        stroke: #F2FD43;
        opacity: 1;
      }
      svg:has(.tuner-peg[data-string-index="11"]:hover) .str-s11,
      svg:has(.tuner-peg[data-string-index="11"]:focus-visible) .str-s11,
      svg:has(.tuner-peg[data-string-index="11"].is-active) .str-s11 {
        stroke: #F2FD43;
        opacity: 1;
      }
    </style>
  </defs>
`;

/* ==========================================================================
   ACOUSTIC GUITAR — 6 STRINGS (3+3)
   ========================================================================== */
const ACOUSTIC_6_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 160,20
    C 145,20 134,8 116,8
    C 82,8 60,18 58,42
    C 56,84 60,146 66,192
    C 71,222 81,245 88,245
    L 232,245
    C 239,245 249,222 254,192
    C 260,146 264,84 262,42
    C 260,18 238,8 204,8
    C 186,8 175,20 160,20
    Z" />

  <path class="tuner-purfling" d="
    M 160,26
    C 147,26 136,14 118,14
    C 86,14 66,23 64,44
    C 62,84 66,144 71,190
    C 76,218 84,239 92,240
    L 228,240
    C 236,239 244,218 249,190
    C 254,144 258,84 256,44
    C 254,23 234,14 202,14
    C 184,14 173,26 160,26
    Z" />

  <g id="tuner-inlay-group">
    <polygon fill="#F2FD43" points="160,24 167,31 160,33 153,31" opacity="0.95" />
    <polygon class="tuner-headstock-inlay" points="160,34 165,45 160,56 155,45" />
    <polygon fill="#F2FD43" points="160,66 167,59 160,57 153,59" opacity="0.95" />
    <polygon fill="#F2FD43" points="149,45 153,38 153,52" opacity="0.85" />
    <polygon fill="#F2FD43" points="171,45 167,38 167,52" opacity="0.85" />
  </g>

  <g id="tuner-truss-group">
    <path class="tuner-truss-cover" d="
      M 160,195
      C 163,195 168,202 170,212
      C 172,222 176,232 178,238
      L 142,238
      C 144,232 148,222 150,212
      C 152,202 157,195 160,195
      Z" />
    <circle class="tuner-truss-screw" cx="160" cy="201" r="1.6" />
    <circle class="tuner-truss-screw" cx="148" cy="233" r="1.6" />
    <circle class="tuner-truss-screw" cx="172" cy="233" r="1.6" />
  </g>

  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="48" x2="78" y2="48" />
    <circle class="tuner-bushing-washer" cx="78" cy="48" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="48" r="5" />
    <circle class="tuner-post-core" cx="78" cy="48" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="116" x2="78" y2="116" />
    <circle class="tuner-bushing-washer" cx="78" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="116" r="5" />
    <circle class="tuner-post-core" cx="78" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="184" x2="78" y2="184" />
    <circle class="tuner-bushing-washer" cx="78" cy="184" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="184" r="5" />
    <circle class="tuner-post-core" cx="78" cy="184" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="48" x2="242" y2="48" />
    <circle class="tuner-bushing-washer" cx="242" cy="48" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="48" r="5" />
    <circle class="tuner-post-core" cx="242" cy="48" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="116" x2="242" y2="116" />
    <circle class="tuner-bushing-washer" cx="242" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="116" r="5" />
    <circle class="tuner-post-core" cx="242" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="184" x2="242" y2="184" />
    <circle class="tuner-bushing-washer" cx="242" cy="184" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="184" r="5" />
    <circle class="tuner-post-core" cx="242" cy="184" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <path class="tuner-string-wrap str-s0" d="M 82,184 A 4 4 0 0 0 74,184" stroke-width="4.0" />
    <line class="tuner-string-line str-s0" x1="82" y1="184" x2="98" y2="245" stroke-width="4.0" />
    <line class="tuner-string-line str-s0" x1="98" y1="245" x2="98" y2="265" stroke-width="4.0" />

    <path class="tuner-string-wrap str-s1" d="M 82,116 A 4 4 0 0 0 74,116" stroke-width="3.2" />
    <line class="tuner-string-line str-s1" x1="82" y1="116" x2="122" y2="245" stroke-width="3.2" />
    <line class="tuner-string-line str-s1" x1="122" y1="245" x2="122" y2="265" stroke-width="3.2" />

    <path class="tuner-string-wrap str-s2" d="M 82,48 A 4 4 0 0 0 74,48" stroke-width="2.4" />
    <line class="tuner-string-line str-s2" x1="82" y1="48" x2="146" y2="245" stroke-width="2.4" />
    <line class="tuner-string-line str-s2" x1="146" y1="245" x2="146" y2="265" stroke-width="2.4" />

    <path class="tuner-string-wrap str-s3" d="M 238,48 A 4 4 0 0 1 246,48" stroke-width="1.8" />
    <line class="tuner-string-line str-s3" x1="238" y1="48" x2="174" y2="245" stroke-width="1.8" />
    <line class="tuner-string-line str-s3" x1="174" y1="245" x2="174" y2="265" stroke-width="1.8" />

    <path class="tuner-string-wrap str-s4" d="M 238,116 A 4 4 0 0 1 246,116" stroke-width="1.4" />
    <line class="tuner-string-line str-s4" x1="238" y1="116" x2="198" y2="245" stroke-width="1.4" />
    <line class="tuner-string-line str-s4" x1="198" y1="245" x2="198" y2="265" stroke-width="1.4" />

    <path class="tuner-string-wrap str-s5" d="M 238,184 A 4 4 0 0 1 246,184" stroke-width="1.0" />
    <line class="tuner-string-line str-s5" x1="238" y1="184" x2="222" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s5" x1="222" y1="245" x2="222" y2="265" stroke-width="1.0" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="98" y1="245" x2="98" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="122" y1="245" x2="122" y2="259" stroke-width="2.8" />
    <line class="tuner-nut-slot" x1="146" y1="245" x2="146" y2="259" stroke-width="2.2" />
    <line class="tuner-nut-slot" x1="174" y1="245" x2="174" y2="259" stroke-width="1.8" />
    <line class="tuner-nut-slot" x1="198" y1="245" x2="198" y2="259" stroke-width="1.4" />
    <line class="tuner-nut-slot" x1="222" y1="245" x2="222" y2="259" stroke-width="1.0" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="184" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="184" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="184" r="23" />
    <text class="tuner-peg-label" x="48" y="184" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="116" r="23" />
    <text class="tuner-peg-label" x="48" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="48" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="48" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="48" r="23" />
    <text class="tuner-peg-label" x="48" y="48" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="48" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="48" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="48" r="23" />
    <text class="tuner-peg-label" x="272" y="48" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="116" r="23" />
    <text class="tuner-peg-label" x="272" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="5" role="button" tabindex="0" aria-label="Target string 6">
    <circle class="tuner-peg-glow" cx="272" cy="184" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="184" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="184" r="23" />
    <text class="tuner-peg-label" x="272" y="184" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>
</svg>`;

/* ==========================================================================
   ACOUSTIC GUITAR — 5 STRINGS (3+2)
   ========================================================================== */
const ACOUSTIC_5_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 160,20
    C 145,20 134,8 116,8
    C 82,8 60,18 58,42
    C 56,84 60,146 66,192
    C 71,222 81,245 88,245
    L 232,245
    C 239,245 249,222 254,192
    C 260,146 264,84 262,42
    C 260,18 238,8 204,8
    C 186,8 175,20 160,20
    Z" />

  <path class="tuner-purfling" d="
    M 160,26
    C 147,26 136,14 118,14
    C 86,14 66,23 64,44
    C 62,84 66,144 71,190
    C 76,218 84,239 92,240
    L 228,240
    C 236,239 244,218 249,190
    C 254,144 258,84 256,44
    C 254,23 234,14 202,14
    C 184,14 173,26 160,26
    Z" />

  <g id="tuner-inlay-group">
    <polygon fill="#F2FD43" points="160,24 167,31 160,33 153,31" opacity="0.95" />
    <polygon class="tuner-headstock-inlay" points="160,34 165,45 160,56 155,45" />
    <polygon fill="#F2FD43" points="160,66 167,59 160,57 153,59" opacity="0.95" />
  </g>

  <g id="tuner-truss-group">
    <path class="tuner-truss-cover" d="
      M 160,195
      C 163,195 168,202 170,212
      C 172,222 176,232 178,238
      L 142,238
      C 144,232 148,222 150,212
      C 152,202 157,195 160,195
      Z" />
    <circle class="tuner-truss-screw" cx="160" cy="201" r="1.6" />
    <circle class="tuner-truss-screw" cx="148" cy="233" r="1.6" />
    <circle class="tuner-truss-screw" cx="172" cy="233" r="1.6" />
  </g>

  <!-- Left: 3 Posts (48, 48), (48, 116), (48, 184). Right: 2 Posts (272, 80), (272, 156) -->
  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="48" x2="78" y2="48" />
    <circle class="tuner-bushing-washer" cx="78" cy="48" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="48" r="5" />
    <circle class="tuner-post-core" cx="78" cy="48" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="116" x2="78" y2="116" />
    <circle class="tuner-bushing-washer" cx="78" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="116" r="5" />
    <circle class="tuner-post-core" cx="78" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="184" x2="78" y2="184" />
    <circle class="tuner-bushing-washer" cx="78" cy="184" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="184" r="5" />
    <circle class="tuner-post-core" cx="78" cy="184" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="80" x2="242" y2="80" />
    <circle class="tuner-bushing-washer" cx="242" cy="80" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="80" r="5" />
    <circle class="tuner-post-core" cx="242" cy="80" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="156" x2="242" y2="156" />
    <circle class="tuner-bushing-washer" cx="242" cy="156" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="156" r="5" />
    <circle class="tuner-post-core" cx="242" cy="156" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <!-- String 0 -> Nut x=102 -->
    <path class="tuner-string-wrap str-s0" d="M 82,184 A 4 4 0 0 0 74,184" stroke-width="3.8" />
    <line class="tuner-string-line str-s0" x1="82" y1="184" x2="102" y2="245" stroke-width="3.8" />
    <line class="tuner-string-line str-s0" x1="102" y1="245" x2="102" y2="265" stroke-width="3.8" />

    <!-- String 1 -> Nut x=131 -->
    <path class="tuner-string-wrap str-s1" d="M 82,116 A 4 4 0 0 0 74,116" stroke-width="3.0" />
    <line class="tuner-string-line str-s1" x1="82" y1="116" x2="131" y2="245" stroke-width="3.0" />
    <line class="tuner-string-line str-s1" x1="131" y1="245" x2="131" y2="265" stroke-width="3.0" />

    <!-- String 2 -> Nut x=160 -->
    <path class="tuner-string-wrap str-s2" d="M 82,48 A 4 4 0 0 0 74,48" stroke-width="2.2" />
    <line class="tuner-string-line str-s2" x1="82" y1="48" x2="160" y2="245" stroke-width="2.2" />
    <line class="tuner-string-line str-s2" x1="160" y1="245" x2="160" y2="265" stroke-width="2.2" />

    <!-- String 3 -> Nut x=189 -->
    <path class="tuner-string-wrap str-s3" d="M 238,80 A 4 4 0 0 1 246,80" stroke-width="1.6" />
    <line class="tuner-string-line str-s3" x1="238" y1="80" x2="189" y2="245" stroke-width="1.6" />
    <line class="tuner-string-line str-s3" x1="189" y1="245" x2="189" y2="265" stroke-width="1.6" />

    <!-- String 4 -> Nut x=218 -->
    <path class="tuner-string-wrap str-s4" d="M 238,156 A 4 4 0 0 1 246,156" stroke-width="1.1" />
    <line class="tuner-string-line str-s4" x1="238" y1="156" x2="218" y2="245" stroke-width="1.1" />
    <line class="tuner-string-line str-s4" x1="218" y1="245" x2="218" y2="265" stroke-width="1.1" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="102" y1="245" x2="102" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="131" y1="245" x2="131" y2="259" stroke-width="2.8" />
    <line class="tuner-nut-slot" x1="160" y1="245" x2="160" y2="259" stroke-width="2.2" />
    <line class="tuner-nut-slot" x1="189" y1="245" x2="189" y2="259" stroke-width="1.6" />
    <line class="tuner-nut-slot" x1="218" y1="245" x2="218" y2="259" stroke-width="1.1" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="184" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="184" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="184" r="23" />
    <text class="tuner-peg-label" x="48" y="184" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="116" r="23" />
    <text class="tuner-peg-label" x="48" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="48" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="48" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="48" r="23" />
    <text class="tuner-peg-label" x="48" y="48" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="80" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="80" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="80" r="23" />
    <text class="tuner-peg-label" x="272" y="80" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="156" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="156" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="156" r="23" />
    <text class="tuner-peg-label" x="272" y="156" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>
</svg>`;

/* ==========================================================================
   ELECTRIC GUITAR — 6 STRINGS (Solid Body Beveled Neo-Brutalist 3+3)
   ========================================================================== */
const ELECTRIC_6_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <!-- Sharp, Modern Beveled Solid-Body Electric Silhouette -->
  <path class="tuner-headstock-outline" d="
    M 88,245
    C 80,225 64,198 64,180
    L 64,52
    C 64,28 78,14 100,10
    L 132,8
    C 146,8 152,18 160,22
    C 168,18 174,8 188,8
    L 220,10
    C 242,14 256,28 256,52
    L 256,180
    C 256,198 240,225 232,245
    Z" />

  <path class="tuner-purfling" d="
    M 94,240
    C 88,222 72,196 72,180
    L 72,56
    C 72,36 82,22 102,18
    L 130,16
    C 142,16 150,25 160,29
    C 170,25 178,16 190,16
    L 218,18
    C 238,22 248,36 248,56
    L 248,180
    C 248,196 232,222 226,240" />

  <!-- Electric Bolt Crest Inlay -->
  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,24 168,42 161,42 165,64 152,46 159,46" />
    <circle cx="160" cy="74" r="2.5" fill="#F5F4EF" opacity="0.4" />
  </g>

  <!-- Truss Cover & String Trees -->
  <g id="tuner-truss-group">
    <path class="tuner-truss-cover" d="M 152,192 C 152,185 168,185 168,192 L 172,224 C 172,232 148,232 148,224 Z" />
    <circle class="tuner-truss-screw" cx="160" cy="208" r="1.6" />
    <line x1="140" y1="135" x2="180" y2="135" stroke="#F5F4EF" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
  </g>

  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="48" x2="78" y2="48" />
    <circle class="tuner-bushing-washer" cx="78" cy="48" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="48" r="5" />
    <circle class="tuner-post-core" cx="78" cy="48" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="116" x2="78" y2="116" />
    <circle class="tuner-bushing-washer" cx="78" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="116" r="5" />
    <circle class="tuner-post-core" cx="78" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="184" x2="78" y2="184" />
    <circle class="tuner-bushing-washer" cx="78" cy="184" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="184" r="5" />
    <circle class="tuner-post-core" cx="78" cy="184" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="48" x2="242" y2="48" />
    <circle class="tuner-bushing-washer" cx="242" cy="48" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="48" r="5" />
    <circle class="tuner-post-core" cx="242" cy="48" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="116" x2="242" y2="116" />
    <circle class="tuner-bushing-washer" cx="242" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="116" r="5" />
    <circle class="tuner-post-core" cx="242" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="184" x2="242" y2="184" />
    <circle class="tuner-bushing-washer" cx="242" cy="184" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="184" r="5" />
    <circle class="tuner-post-core" cx="242" cy="184" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <path class="tuner-string-wrap str-s0" d="M 82,184 A 4 4 0 0 0 74,184" stroke-width="3.8" />
    <line class="tuner-string-line str-s0" x1="82" y1="184" x2="98" y2="245" stroke-width="3.8" />
    <line class="tuner-string-line str-s0" x1="98" y1="245" x2="98" y2="265" stroke-width="3.8" />

    <path class="tuner-string-wrap str-s1" d="M 82,116 A 4 4 0 0 0 74,116" stroke-width="3.0" />
    <line class="tuner-string-line str-s1" x1="82" y1="116" x2="122" y2="245" stroke-width="3.0" />
    <line class="tuner-string-line str-s1" x1="122" y1="245" x2="122" y2="265" stroke-width="3.0" />

    <path class="tuner-string-wrap str-s2" d="M 82,48 A 4 4 0 0 0 74,48" stroke-width="2.2" />
    <line class="tuner-string-line str-s2" x1="82" y1="48" x2="146" y2="245" stroke-width="2.2" />
    <line class="tuner-string-line str-s2" x1="146" y1="245" x2="146" y2="265" stroke-width="2.2" />

    <path class="tuner-string-wrap str-s3" d="M 238,48 A 4 4 0 0 1 246,48" stroke-width="1.6" />
    <line class="tuner-string-line str-s3" x1="238" y1="48" x2="174" y2="245" stroke-width="1.6" />
    <line class="tuner-string-line str-s3" x1="174" y1="245" x2="174" y2="265" stroke-width="1.8" />

    <path class="tuner-string-wrap str-s4" d="M 238,116 A 4 4 0 0 1 246,116" stroke-width="1.2" />
    <line class="tuner-string-line str-s4" x1="238" y1="116" x2="198" y2="245" stroke-width="1.2" />
    <line class="tuner-string-line str-s4" x1="198" y1="245" x2="198" y2="265" stroke-width="1.2" />

    <path class="tuner-string-wrap str-s5" d="M 238,184 A 4 4 0 0 1 246,184" stroke-width="0.9" />
    <line class="tuner-string-line str-s5" x1="238" y1="184" x2="222" y2="245" stroke-width="0.9" />
    <line class="tuner-string-line str-s5" x1="222" y1="245" x2="222" y2="265" stroke-width="0.9" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="98" y1="245" x2="98" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="122" y1="245" x2="122" y2="259" stroke-width="2.8" />
    <line class="tuner-nut-slot" x1="146" y1="245" x2="146" y2="259" stroke-width="2.2" />
    <line class="tuner-nut-slot" x1="174" y1="245" x2="174" y2="259" stroke-width="1.8" />
    <line class="tuner-nut-slot" x1="198" y1="245" x2="198" y2="259" stroke-width="1.4" />
    <line class="tuner-nut-slot" x1="222" y1="245" x2="222" y2="259" stroke-width="1.0" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="184" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="184" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="184" r="23" />
    <text class="tuner-peg-label" x="48" y="184" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="116" r="23" />
    <text class="tuner-peg-label" x="48" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="48" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="48" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="48" r="23" />
    <text class="tuner-peg-label" x="48" y="48" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="48" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="48" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="48" r="23" />
    <text class="tuner-peg-label" x="272" y="48" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="116" r="23" />
    <text class="tuner-peg-label" x="272" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="5" role="button" tabindex="0" aria-label="Target string 6">
    <circle class="tuner-peg-glow" cx="272" cy="184" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="184" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="184" r="23" />
    <text class="tuner-peg-label" x="272" y="184" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>
</svg>`;

/* ==========================================================================
   ELECTRIC GUITAR — 5 STRINGS (3+2)
   ========================================================================== */
const ELECTRIC_5_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 88,245
    C 80,225 64,198 64,180
    L 64,52
    C 64,28 78,14 100,10
    L 132,8
    C 146,8 152,18 160,22
    C 168,18 174,8 188,8
    L 220,10
    C 242,14 256,28 256,52
    L 256,180
    C 256,198 240,225 232,245
    Z" />

  <path class="tuner-purfling" d="
    M 94,240
    C 88,222 72,196 72,180
    L 72,56
    C 72,36 82,22 102,18
    L 130,16
    C 142,16 150,25 160,29
    C 170,25 178,16 190,16
    L 218,18
    C 238,22 248,36 248,56
    L 248,180
    C 248,196 232,222 226,240" />

  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,24 168,42 161,42 165,64 152,46 159,46" />
  </g>

  <!-- Left: 3 Posts (48, 48), (48, 116), (48, 184). Right: 2 Posts (272, 80), (272, 156) -->
  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="48" x2="78" y2="48" />
    <circle class="tuner-bushing-washer" cx="78" cy="48" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="48" r="5" />
    <circle class="tuner-post-core" cx="78" cy="48" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="116" x2="78" y2="116" />
    <circle class="tuner-bushing-washer" cx="78" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="116" r="5" />
    <circle class="tuner-post-core" cx="78" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="184" x2="78" y2="184" />
    <circle class="tuner-bushing-washer" cx="78" cy="184" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="184" r="5" />
    <circle class="tuner-post-core" cx="78" cy="184" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="80" x2="242" y2="80" />
    <circle class="tuner-bushing-washer" cx="242" cy="80" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="80" r="5" />
    <circle class="tuner-post-core" cx="242" cy="80" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="156" x2="242" y2="156" />
    <circle class="tuner-bushing-washer" cx="242" cy="156" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="156" r="5" />
    <circle class="tuner-post-core" cx="242" cy="156" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <!-- String 0 -> Nut x=102 -->
    <path class="tuner-string-wrap str-s0" d="M 82,184 A 4 4 0 0 0 74,184" stroke-width="3.8" />
    <line class="tuner-string-line str-s0" x1="82" y1="184" x2="102" y2="245" stroke-width="3.8" />
    <line class="tuner-string-line str-s0" x1="102" y1="245" x2="102" y2="265" stroke-width="3.8" />

    <!-- String 1 -> Nut x=131 -->
    <path class="tuner-string-wrap str-s1" d="M 82,116 A 4 4 0 0 0 74,116" stroke-width="3.0" />
    <line class="tuner-string-line str-s1" x1="82" y1="116" x2="131" y2="245" stroke-width="3.0" />
    <line class="tuner-string-line str-s1" x1="131" y1="245" x2="131" y2="265" stroke-width="3.0" />

    <!-- String 2 -> Nut x=160 -->
    <path class="tuner-string-wrap str-s2" d="M 82,48 A 4 4 0 0 0 74,48" stroke-width="2.2" />
    <line class="tuner-string-line str-s2" x1="82" y1="48" x2="160" y2="245" stroke-width="2.2" />
    <line class="tuner-string-line str-s2" x1="160" y1="245" x2="160" y2="265" stroke-width="2.2" />

    <!-- String 3 -> Nut x=189 -->
    <path class="tuner-string-wrap str-s3" d="M 238,80 A 4 4 0 0 1 246,80" stroke-width="1.6" />
    <line class="tuner-string-line str-s3" x1="238" y1="80" x2="189" y2="245" stroke-width="1.6" />
    <line class="tuner-string-line str-s3" x1="189" y1="245" x2="189" y2="265" stroke-width="1.6" />

    <!-- String 4 -> Nut x=218 -->
    <path class="tuner-string-wrap str-s4" d="M 238,156 A 4 4 0 0 1 246,156" stroke-width="1.1" />
    <line class="tuner-string-line str-s4" x1="238" y1="156" x2="218" y2="245" stroke-width="1.1" />
    <line class="tuner-string-line str-s4" x1="218" y1="245" x2="218" y2="265" stroke-width="1.1" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="102" y1="245" x2="102" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="131" y1="245" x2="131" y2="259" stroke-width="2.8" />
    <line class="tuner-nut-slot" x1="160" y1="245" x2="160" y2="259" stroke-width="2.2" />
    <line class="tuner-nut-slot" x1="189" y1="245" x2="189" y2="259" stroke-width="1.6" />
    <line class="tuner-nut-slot" x1="218" y1="245" x2="218" y2="259" stroke-width="1.1" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="184" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="184" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="184" r="23" />
    <text class="tuner-peg-label" x="48" y="184" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="116" r="23" />
    <text class="tuner-peg-label" x="48" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="48" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="48" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="48" r="23" />
    <text class="tuner-peg-label" x="48" y="48" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="80" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="80" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="80" r="23" />
    <text class="tuner-peg-label" x="272" y="80" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="156" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="156" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="156" r="23" />
    <text class="tuner-peg-label" x="272" y="156" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>
</svg>`;

/* ==========================================================================
   ELECTRIC GUITAR — 7 STRINGS (4+3)
   ========================================================================== */
const ELECTRIC_7_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <!-- Sharp, Modern Beveled Solid-Body Electric Silhouette -->
  <path class="tuner-headstock-outline" d="
    M 88,245
    C 80,225 64,198 64,180
    L 64,52
    C 64,28 78,14 100,10
    L 132,8
    C 146,8 152,18 160,22
    C 168,18 174,8 188,8
    L 220,10
    C 242,14 256,28 256,52
    L 256,180
    C 256,198 240,225 232,245
    Z" />

  <path class="tuner-purfling" d="
    M 94,240
    C 88,222 72,196 72,180
    L 72,56
    C 72,36 82,22 102,18
    L 130,16
    C 142,16 150,25 160,29
    C 170,25 178,16 190,16
    L 218,18
    C 238,22 248,36 248,56
    L 248,180
    C 248,196 232,222 226,240" />

  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,24 168,42 161,42 165,64 152,46 159,46" />
    <circle cx="160" cy="74" r="2.5" fill="#F5F4EF" opacity="0.4" />
  </g>

  <g id="tuner-truss-group">
    <path class="tuner-truss-cover" d="M 152,192 C 152,185 168,185 168,192 L 172,224 C 172,232 148,232 148,224 Z" />
    <circle class="tuner-truss-screw" cx="160" cy="208" r="1.6" />
    <line x1="140" y1="135" x2="180" y2="135" stroke="#F5F4EF" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
  </g>

  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="36" x2="78" y2="36" />
    <circle class="tuner-bushing-washer" cx="78" cy="36" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="36" r="5" />
    <circle class="tuner-post-core" cx="78" cy="36" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="94" x2="78" y2="94" />
    <circle class="tuner-bushing-washer" cx="78" cy="94" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="94" r="5" />
    <circle class="tuner-post-core" cx="78" cy="94" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="152" x2="78" y2="152" />
    <circle class="tuner-bushing-washer" cx="78" cy="152" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="152" r="5" />
    <circle class="tuner-post-core" cx="78" cy="152" r="2.2" />

    <line class="tuner-peg-post" x1="48" y1="210" x2="78" y2="210" />
    <circle class="tuner-bushing-washer" cx="78" cy="210" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="210" r="5" />
    <circle class="tuner-post-core" cx="78" cy="210" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="56" x2="242" y2="56" />
    <circle class="tuner-bushing-washer" cx="242" cy="56" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="56" r="5" />
    <circle class="tuner-post-core" cx="242" cy="56" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="116" x2="242" y2="116" />
    <circle class="tuner-bushing-washer" cx="242" cy="116" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="116" r="5" />
    <circle class="tuner-post-core" cx="242" cy="116" r="2.2" />

    <line class="tuner-peg-post" x1="272" y1="176" x2="242" y2="176" />
    <circle class="tuner-bushing-washer" cx="242" cy="176" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="176" r="5" />
    <circle class="tuner-post-core" cx="242" cy="176" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <path class="tuner-string-wrap str-s0" d="M 82,210 A 4 4 0 0 0 74,210" stroke-width="4.0" />
    <line class="tuner-string-line str-s0" x1="82" y1="210" x2="96" y2="245" stroke-width="4.0" />
    <line class="tuner-string-line str-s0" x1="96" y1="245" x2="96" y2="265" stroke-width="4.0" />

    <path class="tuner-string-wrap str-s1" d="M 82,152 A 4 4 0 0 0 74,152" stroke-width="3.2" />
    <line class="tuner-string-line str-s1" x1="82" y1="152" x2="116" y2="245" stroke-width="3.2" />
    <line class="tuner-string-line str-s1" x1="116" y1="245" x2="116" y2="265" stroke-width="3.2" />

    <path class="tuner-string-wrap str-s2" d="M 82,94 A 4 4 0 0 0 74,94" stroke-width="2.4" />
    <line class="tuner-string-line str-s2" x1="82" y1="94" x2="136" y2="245" stroke-width="2.4" />
    <line class="tuner-string-line str-s2" x1="136" y1="245" x2="136" y2="265" stroke-width="2.4" />

    <path class="tuner-string-wrap str-s3" d="M 82,36 A 4 4 0 0 0 74,36" stroke-width="2.0" />
    <line class="tuner-string-line str-s3" x1="82" y1="36" x2="156" y2="245" stroke-width="2.0" />
    <line class="tuner-string-line str-s3" x1="156" y1="245" x2="156" y2="265" stroke-width="2.0" />

    <path class="tuner-string-wrap str-s4" d="M 238,56 A 4 4 0 0 1 246,56" stroke-width="1.6" />
    <line class="tuner-string-line str-s4" x1="238" y1="56" x2="176" y2="245" stroke-width="1.6" />
    <line class="tuner-string-line str-s4" x1="176" y1="245" x2="176" y2="265" stroke-width="1.6" />

    <path class="tuner-string-wrap str-s5" d="M 238,116 A 4 4 0 0 1 246,116" stroke-width="1.2" />
    <line class="tuner-string-line str-s5" x1="238" y1="116" x2="196" y2="245" stroke-width="1.2" />
    <line class="tuner-string-line str-s5" x1="196" y1="245" x2="196" y2="265" stroke-width="1.2" />

    <path class="tuner-string-wrap str-s6" d="M 238,176 A 4 4 0 0 1 246,176" stroke-width="1.0" />
    <line class="tuner-string-line str-s6" x1="238" y1="176" x2="216" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s6" x1="216" y1="245" x2="216" y2="265" stroke-width="1.0" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="96" y1="245" x2="96" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="116" y1="245" x2="116" y2="259" stroke-width="2.8" />
    <line class="tuner-nut-slot" x1="136" y1="245" x2="136" y2="259" stroke-width="2.2" />
    <line class="tuner-nut-slot" x1="156" y1="245" x2="156" y2="259" stroke-width="1.8" />
    <line class="tuner-nut-slot" x1="176" y1="245" x2="176" y2="259" stroke-width="1.4" />
    <line class="tuner-nut-slot" x1="196" y1="245" x2="196" y2="259" stroke-width="1.1" />
    <line class="tuner-nut-slot" x1="216" y1="245" x2="216" y2="259" stroke-width="0.9" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="210" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="210" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="210" r="23" />
    <text class="tuner-peg-label" x="48" y="210" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="152" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="152" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="152" r="23" />
    <text class="tuner-peg-label" x="48" y="152" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="94" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="94" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="94" r="23" />
    <text class="tuner-peg-label" x="48" y="94" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="48" cy="36" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="36" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="36" r="23" />
    <text class="tuner-peg-label" x="48" y="36" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="56" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="56" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="56" r="23" />
    <text class="tuner-peg-label" x="272" y="56" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="5" role="button" tabindex="0" aria-label="Target string 6">
    <circle class="tuner-peg-glow" cx="272" cy="116" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="116" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="116" r="23" />
    <text class="tuner-peg-label" x="272" y="116" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="6" role="button" tabindex="0" aria-label="Target string 7">
    <circle class="tuner-peg-glow" cx="272" cy="176" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="176" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="176" r="23" />
    <text class="tuner-peg-label" x="272" y="176" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>
</svg>`;

/* ==========================================================================
   BASS GUITAR — 4 STRINGS (2+2)
   ========================================================================== */
const BASS_4_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 94,245 L 94,265 L 226,265 L 226,245 Z" />
  <line x1="94" y1="262" x2="226" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <!-- Iconic Heavy Bass Headstock -->
  <path class="tuner-headstock-outline" d="
    M 94,245
    C 80,228 64,198 64,168
    C 64,136 68,126 68,114
    C 68,96 64,88 64,80
    C 64,48 78,26 104,18
    C 124,12 142,25 160,43
    C 178,25 196,12 216,18
    C 242,26 256,48 256,80
    C 256,88 252,96 252,114
    C 252,126 256,136 256,168
    C 256,198 240,228 226,245
    Z" />

  <path class="tuner-purfling" d="
    M 100,240
    C 88,224 74,196 74,168
    C 74,138 78,128 78,114
    C 78,98 74,90 74,80
    C 74,54 86,34 108,26
    C 126,20 142,32 160,49
    C 178,32 194,20 212,26
    C 234,34 246,54 246,80
    C 246,90 242,98 242,114
    C 242,128 246,138 246,168
    C 246,196 232,224 220,240" />

  <!-- Heavy Bass Split Inlay -->
  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,52 166,62 160,72 154,62" />
    <polygon class="tuner-headstock-inlay" points="160,76 166,86 160,96 154,86" opacity="0.85" />
  </g>

  <!-- Heavy Bass Posts & Washers -->
  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="80" x2="78" y2="80" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="78" cy="80" r="10" />
    <circle class="tuner-peg-bushing" cx="78" cy="80" r="6.5" />
    <circle class="tuner-post-core" cx="78" cy="80" r="3" />

    <line class="tuner-peg-post" x1="48" y1="168" x2="78" y2="168" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="78" cy="168" r="10" />
    <circle class="tuner-peg-bushing" cx="78" cy="168" r="6.5" />
    <circle class="tuner-post-core" cx="78" cy="168" r="3" />

    <line class="tuner-peg-post" x1="272" y1="80" x2="242" y2="80" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="242" cy="80" r="10" />
    <circle class="tuner-peg-bushing" cx="242" cy="80" r="6.5" />
    <circle class="tuner-post-core" cx="242" cy="80" r="3" />

    <line class="tuner-peg-post" x1="272" y1="168" x2="242" y2="168" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="242" cy="168" r="10" />
    <circle class="tuner-peg-bushing" cx="242" cy="168" r="6.5" />
    <circle class="tuner-post-core" cx="242" cy="168" r="3" />
  </g>

  <!-- Heavy Wound Bass Strings -->
  <g class="tuner-strings-group">
    <!-- String 0 (Low E) -> Nut x=110 -->
    <path class="tuner-string-wrap str-s0" d="M 84,168 A 6 6 0 0 0 72,168" stroke-width="5.4" />
    <line class="tuner-string-line str-s0" x1="84" y1="168" x2="110" y2="245" stroke-width="5.4" />
    <line class="tuner-string-line str-s0" x1="110" y1="245" x2="110" y2="265" stroke-width="5.4" />

    <!-- String 1 (A) -> Nut x=143 -->
    <path class="tuner-string-wrap str-s1" d="M 84,80 A 6 6 0 0 0 72,80" stroke-width="4.2" />
    <line class="tuner-string-line str-s1" x1="84" y1="80" x2="143" y2="245" stroke-width="4.2" />
    <line class="tuner-string-line str-s1" x1="143" y1="245" x2="143" y2="265" stroke-width="4.2" />

    <!-- String 2 (D) -> Nut x=177 -->
    <path class="tuner-string-wrap str-s2" d="M 236,80 A 6 6 0 0 1 248,80" stroke-width="3.2" />
    <line class="tuner-string-line str-s2" x1="236" y1="80" x2="177" y2="245" stroke-width="3.2" />
    <line class="tuner-string-line str-s2" x1="177" y1="245" x2="177" y2="265" stroke-width="3.2" />

    <!-- String 3 (G) -> Nut x=210 -->
    <path class="tuner-string-wrap str-s3" d="M 236,168 A 6 6 0 0 1 248,168" stroke-width="2.4" />
    <line class="tuner-string-line str-s3" x1="236" y1="168" x2="210" y2="245" stroke-width="2.4" />
    <line class="tuner-string-line str-s3" x1="210" y1="245" x2="210" y2="265" stroke-width="2.4" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="94" y="245" width="132" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="110" y1="245" x2="110" y2="259" stroke-width="5.0" />
    <line class="tuner-nut-slot" x1="143" y1="245" x2="143" y2="259" stroke-width="4.0" />
    <line class="tuner-nut-slot" x1="177" y1="245" x2="177" y2="259" stroke-width="3.0" />
    <line class="tuner-nut-slot" x1="210" y1="245" x2="210" y2="259" stroke-width="2.2" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="168" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="168" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="168" r="23" />
    <text class="tuner-peg-label" x="48" y="168" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="80" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="80" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="80" r="23" />
    <text class="tuner-peg-label" x="48" y="80" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="272" cy="80" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="80" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="80" r="23" />
    <text class="tuner-peg-label" x="272" y="80" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="168" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="168" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="168" r="23" />
    <text class="tuner-peg-label" x="272" y="168" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>
</svg>`;

/* ==========================================================================
   BASS GUITAR — 5 STRINGS (3+2)
   ========================================================================== */
const BASS_5_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 88,245
    C 76,226 62,198 62,172
    L 62,48
    C 62,24 76,12 100,8
    L 132,6
    C 146,6 152,16 160,20
    C 168,16 174,6 188,6
    L 220,8
    C 244,12 258,24 258,48
    L 258,172
    C 258,198 244,226 232,245
    Z" />

  <path class="tuner-purfling" d="
    M 94,240
    C 84,222 70,196 70,172
    L 70,52
    C 70,32 82,20 102,16
    L 130,14
    C 142,14 150,22 160,26
    C 170,22 178,14 190,14
    L 218,16
    C 238,20 250,32 250,52
    L 250,172
    C 250,196 236,222 226,240" />

  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,26 167,38 160,50 153,38" />
  </g>

  <!-- Left: 3 Posts (48, 52), (48, 124), (48, 196). Right: 2 Posts (272, 88), (272, 160) -->
  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="52" x2="78" y2="52" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="78" cy="52" r="9" />
    <circle class="tuner-peg-bushing" cx="78" cy="52" r="6" />

    <line class="tuner-peg-post" x1="48" y1="124" x2="78" y2="124" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="78" cy="124" r="9" />
    <circle class="tuner-peg-bushing" cx="78" cy="124" r="6" />

    <line class="tuner-peg-post" x1="48" y1="196" x2="78" y2="196" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="78" cy="196" r="9" />
    <circle class="tuner-peg-bushing" cx="78" cy="196" r="6" />

    <line class="tuner-peg-post" x1="272" y1="88" x2="242" y2="88" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="242" cy="88" r="9" />
    <circle class="tuner-peg-bushing" cx="242" cy="88" r="6" />

    <line class="tuner-peg-post" x1="272" y1="160" x2="242" y2="160" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="242" cy="160" r="9" />
    <circle class="tuner-peg-bushing" cx="242" cy="160" r="6" />
  </g>

  <g class="tuner-strings-group">
    <!-- String 0 (Low B) -> Nut x=102 -->
    <path class="tuner-string-wrap str-s0" d="M 84,196 A 6 6 0 0 0 72,196" stroke-width="5.8" />
    <line class="tuner-string-line str-s0" x1="84" y1="196" x2="102" y2="245" stroke-width="5.8" />
    <line class="tuner-string-line str-s0" x1="102" y1="245" x2="102" y2="265" stroke-width="5.8" />

    <!-- String 1 (E) -> Nut x=131 -->
    <path class="tuner-string-wrap str-s1" d="M 84,124 A 6 6 0 0 0 72,124" stroke-width="4.8" />
    <line class="tuner-string-line str-s1" x1="84" y1="124" x2="131" y2="245" stroke-width="4.8" />
    <line class="tuner-string-line str-s1" x1="131" y1="245" x2="131" y2="265" stroke-width="4.8" />

    <!-- String 2 (A) -> Nut x=160 -->
    <path class="tuner-string-wrap str-s2" d="M 84,52 A 6 6 0 0 0 72,52" stroke-width="3.8" />
    <line class="tuner-string-line str-s2" x1="84" y1="52" x2="160" y2="245" stroke-width="3.8" />
    <line class="tuner-string-line str-s2" x1="160" y1="245" x2="160" y2="265" stroke-width="3.8" />

    <!-- String 3 (D) -> Nut x=189 -->
    <path class="tuner-string-wrap str-s3" d="M 236,88 A 6 6 0 0 1 248,88" stroke-width="2.8" />
    <line class="tuner-string-line str-s3" x1="236" y1="88" x2="189" y2="245" stroke-width="2.8" />
    <line class="tuner-string-line str-s3" x1="189" y1="245" x2="189" y2="265" stroke-width="2.8" />

    <!-- String 4 (G) -> Nut x=218 -->
    <path class="tuner-string-wrap str-s4" d="M 236,160 A 6 6 0 0 1 248,160" stroke-width="2.0" />
    <line class="tuner-string-line str-s4" x1="236" y1="160" x2="218" y2="245" stroke-width="2.0" />
    <line class="tuner-string-line str-s4" x1="218" y1="245" x2="218" y2="265" stroke-width="2.0" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="102" y1="245" x2="102" y2="259" stroke-width="5.5" />
    <line class="tuner-nut-slot" x1="131" y1="245" x2="131" y2="259" stroke-width="4.5" />
    <line class="tuner-nut-slot" x1="160" y1="245" x2="160" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="189" y1="245" x2="189" y2="259" stroke-width="2.6" />
    <line class="tuner-nut-slot" x1="218" y1="245" x2="218" y2="259" stroke-width="1.8" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="196" r="32" />
    <circle class="tuner-peg-ring" cx="48" cy="196" r="26" />
    <circle class="tuner-peg-circle" cx="48" cy="196" r="22" />
    <text class="tuner-peg-label" x="48" y="196" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="124" r="32" />
    <circle class="tuner-peg-ring" cx="48" cy="124" r="26" />
    <circle class="tuner-peg-circle" cx="48" cy="124" r="22" />
    <text class="tuner-peg-label" x="48" y="124" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="52" r="32" />
    <circle class="tuner-peg-ring" cx="48" cy="52" r="26" />
    <circle class="tuner-peg-circle" cx="48" cy="52" r="22" />
    <text class="tuner-peg-label" x="48" y="52" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="88" r="32" />
    <circle class="tuner-peg-ring" cx="272" cy="88" r="26" />
    <circle class="tuner-peg-circle" cx="272" cy="88" r="22" />
    <text class="tuner-peg-label" x="272" y="88" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="160" r="32" />
    <circle class="tuner-peg-ring" cx="272" cy="160" r="26" />
    <circle class="tuner-peg-circle" cx="272" cy="160" r="22" />
    <text class="tuner-peg-label" x="272" y="160" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>
</svg>`;

/* ==========================================================================
   BASS GUITAR — 6 STRINGS (3+3)
   ========================================================================== */
const BASS_6_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 84,245 L 84,265 L 236,265 L 236,245 Z" />
  <line x1="84" y1="262" x2="236" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 84,245
    C 72,224 58,196 58,172
    L 58,46
    C 58,22 72,10 96,6
    L 130,4
    C 144,4 152,14 160,18
    C 168,14 176,4 190,4
    L 224,6
    C 248,10 262,22 262,46
    L 262,172
    C 262,196 248,224 236,245
    Z" />

  <path class="tuner-purfling" d="
    M 90,240
    C 80,220 66,194 66,172
    L 66,50
    C 66,30 78,18 98,14
    L 128,12
    C 140,12 150,20 160,24
    C 170,20 180,12 192,12
    L 222,14
    C 242,18 254,30 254,50
    L 254,172
    C 254,194 240,220 230,240" />

  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,20 167,32 160,44 153,32" />
  </g>

  <!-- Left: 3 Posts (48, 48), (48, 116), (48, 184). Right: 3 Posts (272, 48), (272, 116), (272, 184) -->
  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="48" x2="74" y2="48" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="74" cy="48" r="8.5" />
    <circle class="tuner-peg-bushing" cx="74" cy="48" r="5.5" />

    <line class="tuner-peg-post" x1="48" y1="116" x2="74" y2="116" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="74" cy="116" r="8.5" />
    <circle class="tuner-peg-bushing" cx="74" cy="116" r="5.5" />

    <line class="tuner-peg-post" x1="48" y1="184" x2="74" y2="184" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="74" cy="184" r="8.5" />
    <circle class="tuner-peg-bushing" cx="74" cy="184" r="5.5" />

    <line class="tuner-peg-post" x1="272" y1="48" x2="246" y2="48" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="246" cy="48" r="8.5" />
    <circle class="tuner-peg-bushing" cx="246" cy="48" r="5.5" />

    <line class="tuner-peg-post" x1="272" y1="116" x2="246" y2="116" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="246" cy="116" r="8.5" />
    <circle class="tuner-peg-bushing" cx="246" cy="116" r="5.5" />

    <line class="tuner-peg-post" x1="272" y1="184" x2="246" y2="184" stroke-width="6.5" />
    <circle class="tuner-bushing-washer" cx="246" cy="184" r="8.5" />
    <circle class="tuner-peg-bushing" cx="246" cy="184" r="5.5" />
  </g>

  <g class="tuner-strings-group">
    <!-- String 0 (Low B) -> Nut x=96 -->
    <path class="tuner-string-wrap str-s0" d="M 78,184 A 6 6 0 0 0 66,184" stroke-width="5.8" />
    <line class="tuner-string-line str-s0" x1="78" y1="184" x2="96" y2="245" stroke-width="5.8" />
    <line class="tuner-string-line str-s0" x1="96" y1="245" x2="96" y2="265" stroke-width="5.8" />

    <!-- String 1 (E) -> Nut x=122 -->
    <path class="tuner-string-wrap str-s1" d="M 78,116 A 6 6 0 0 0 66,116" stroke-width="4.8" />
    <line class="tuner-string-line str-s1" x1="78" y1="116" x2="122" y2="245" stroke-width="4.8" />
    <line class="tuner-string-line str-s1" x1="122" y1="245" x2="122" y2="265" stroke-width="4.8" />

    <!-- String 2 (A) -> Nut x=148 -->
    <path class="tuner-string-wrap str-s2" d="M 78,48 A 6 6 0 0 0 66,48" stroke-width="3.8" />
    <line class="tuner-string-line str-s2" x1="78" y1="48" x2="148" y2="245" stroke-width="3.8" />
    <line class="tuner-string-line str-s2" x1="148" y1="245" x2="148" y2="265" stroke-width="3.8" />

    <!-- String 3 (D) -> Nut x=172 -->
    <path class="tuner-string-wrap str-s3" d="M 242,48 A 6 6 0 0 1 254,48" stroke-width="2.8" />
    <line class="tuner-string-line str-s3" x1="242" y1="48" x2="172" y2="245" stroke-width="2.8" />
    <line class="tuner-string-line str-s3" x1="172" y1="245" x2="172" y2="265" stroke-width="2.8" />

    <!-- String 4 (G) -> Nut x=198 -->
    <path class="tuner-string-wrap str-s4" d="M 242,116 A 6 6 0 0 1 254,116" stroke-width="2.0" />
    <line class="tuner-string-line str-s4" x1="242" y1="116" x2="198" y2="245" stroke-width="2.0" />
    <line class="tuner-string-line str-s4" x1="198" y1="245" x2="198" y2="265" stroke-width="2.0" />

    <!-- String 5 (C) -> Nut x=224 -->
    <path class="tuner-string-wrap str-s5" d="M 242,184 A 6 6 0 0 1 254,184" stroke-width="1.4" />
    <line class="tuner-string-line str-s5" x1="242" y1="184" x2="224" y2="245" stroke-width="1.4" />
    <line class="tuner-string-line str-s5" x1="224" y1="245" x2="224" y2="265" stroke-width="1.4" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="84" y="245" width="152" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="96" y1="245" x2="96" y2="259" stroke-width="5.5" />
    <line class="tuner-nut-slot" x1="122" y1="245" x2="122" y2="259" stroke-width="4.5" />
    <line class="tuner-nut-slot" x1="148" y1="245" x2="148" y2="259" stroke-width="3.5" />
    <line class="tuner-nut-slot" x1="172" y1="245" x2="172" y2="259" stroke-width="2.6" />
    <line class="tuner-nut-slot" x1="198" y1="245" x2="198" y2="259" stroke-width="1.8" />
    <line class="tuner-nut-slot" x1="224" y1="245" x2="224" y2="259" stroke-width="1.2" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="184" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="184" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="184" r="21" />
    <text class="tuner-peg-label" x="48" y="184" font-size="18" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>

  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="116" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="116" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="116" r="21" />
    <text class="tuner-peg-label" x="48" y="116" font-size="18" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>

  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="48" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="48" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="48" r="21" />
    <text class="tuner-peg-label" x="48" y="48" font-size="18" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>

  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="272" cy="48" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="48" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="48" r="21" />
    <text class="tuner-peg-label" x="272" y="48" font-size="18" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>

  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="116" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="116" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="116" r="21" />
    <text class="tuner-peg-label" x="272" y="116" font-size="18" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>

  <g class="tuner-peg" data-string-index="5" role="button" tabindex="0" aria-label="Target string 6">
    <circle class="tuner-peg-glow" cx="272" cy="184" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="184" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="184" r="21" />
    <text class="tuner-peg-label" x="272" y="184" font-size="18" font-weight="800" text-anchor="middle" dominant-baseline="central">C</text>
  </g>
</svg>`;

const ELECTRIC_8_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 88,245
    C 80,225 64,198 64,180
    L 64,52
    C 64,28 78,14 100,10
    L 132,8
    C 146,8 152,18 160,22
    C 168,18 174,8 188,8
    L 220,10
    C 242,14 256,28 256,52
    L 256,180
    C 256,198 240,225 232,245
    Z" />

  <path class="tuner-purfling" d="
    M 94,240
    C 88,222 72,196 72,180
    L 72,56
    C 72,36 82,22 102,18
    L 130,16
    C 142,16 150,25 160,29
    C 170,25 178,16 190,16
    L 218,18
    C 238,22 248,36 248,56
    L 248,180
    C 248,196 232,222 226,240" />

  <g id="tuner-inlay-group">
    <polygon class="tuner-headstock-inlay" points="160,24 168,42 161,42 165,64 152,46 159,46" />
    <circle cx="160" cy="74" r="2.5" fill="#F5F4EF" opacity="0.4" />
  </g>

  <g id="tuner-truss-group">
    <path class="tuner-truss-cover" d="M 152,192 C 152,185 168,185 168,192 L 172,224 C 172,232 148,232 148,224 Z" />
    <circle class="tuner-truss-screw" cx="160" cy="208" r="1.6" />
    <line x1="140" y1="135" x2="180" y2="135" stroke="#F5F4EF" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
  </g>

  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="32" x2="78" y2="32" />
    <circle class="tuner-bushing-washer" cx="78" cy="32" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="32" r="5" />
    <circle class="tuner-post-core" cx="78" cy="32" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="90" x2="78" y2="90" />
    <circle class="tuner-bushing-washer" cx="78" cy="90" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="90" r="5" />
    <circle class="tuner-post-core" cx="78" cy="90" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="148" x2="78" y2="148" />
    <circle class="tuner-bushing-washer" cx="78" cy="148" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="148" r="5" />
    <circle class="tuner-post-core" cx="78" cy="148" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="206" x2="78" y2="206" />
    <circle class="tuner-bushing-washer" cx="78" cy="206" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="206" r="5" />
    <circle class="tuner-post-core" cx="78" cy="206" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="44" x2="242" y2="44" />
    <circle class="tuner-bushing-washer" cx="242" cy="44" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="44" r="5" />
    <circle class="tuner-post-core" cx="242" cy="44" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="102" x2="242" y2="102" />
    <circle class="tuner-bushing-washer" cx="242" cy="102" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="102" r="5" />
    <circle class="tuner-post-core" cx="242" cy="102" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="160" x2="242" y2="160" />
    <circle class="tuner-bushing-washer" cx="242" cy="160" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="160" r="5" />
    <circle class="tuner-post-core" cx="242" cy="160" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="218" x2="242" y2="218" />
    <circle class="tuner-bushing-washer" cx="242" cy="218" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="218" r="5" />
    <circle class="tuner-post-core" cx="242" cy="218" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <path class="tuner-string-wrap str-s0" d="M 82,206 A 4 4 0 0 0 74,206" stroke-width="4.2" />
    <line class="tuner-string-line str-s0" x1="82" y1="206" x2="92" y2="245" stroke-width="4.2" />
    <line class="tuner-string-line str-s0" x1="92" y1="245" x2="92" y2="265" stroke-width="4.2" />
    <path class="tuner-string-wrap str-s1" d="M 82,148 A 4 4 0 0 0 74,148" stroke-width="3.4" />
    <line class="tuner-string-line str-s1" x1="82" y1="148" x2="110" y2="245" stroke-width="3.4" />
    <line class="tuner-string-line str-s1" x1="110" y1="245" x2="110" y2="265" stroke-width="3.4" />
    <path class="tuner-string-wrap str-s2" d="M 82,90 A 4 4 0 0 0 74,90" stroke-width="2.6" />
    <line class="tuner-string-line str-s2" x1="82" y1="90" x2="128" y2="245" stroke-width="2.6" />
    <line class="tuner-string-line str-s2" x1="128" y1="245" x2="128" y2="265" stroke-width="2.6" />
    <path class="tuner-string-wrap str-s3" d="M 82,32 A 4 4 0 0 0 74,32" stroke-width="2.0" />
    <line class="tuner-string-line str-s3" x1="82" y1="32" x2="146" y2="245" stroke-width="2.0" />
    <line class="tuner-string-line str-s3" x1="146" y1="245" x2="146" y2="265" stroke-width="2.0" />
    <path class="tuner-string-wrap str-s4" d="M 238,44 A 4 4 0 0 1 246,44" stroke-width="1.6" />
    <line class="tuner-string-line str-s4" x1="238" y1="44" x2="164" y2="245" stroke-width="1.6" />
    <line class="tuner-string-line str-s4" x1="164" y1="245" x2="164" y2="265" stroke-width="1.6" />
    <path class="tuner-string-wrap str-s5" d="M 238,102 A 4 4 0 0 1 246,102" stroke-width="1.2" />
    <line class="tuner-string-line str-s5" x1="238" y1="102" x2="182" y2="245" stroke-width="1.2" />
    <line class="tuner-string-line str-s5" x1="182" y1="245" x2="182" y2="265" stroke-width="1.2" />
    <path class="tuner-string-wrap str-s6" d="M 238,160 A 4 4 0 0 1 246,160" stroke-width="1.0" />
    <line class="tuner-string-line str-s6" x1="238" y1="160" x2="200" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s6" x1="200" y1="245" x2="200" y2="265" stroke-width="1.0" />
    <path class="tuner-string-wrap str-s7" d="M 238,218 A 4 4 0 0 1 246,218" stroke-width="0.85" />
    <line class="tuner-string-line str-s7" x1="238" y1="218" x2="218" y2="245" stroke-width="0.85" />
    <line class="tuner-string-line str-s7" x1="218" y1="245" x2="218" y2="265" stroke-width="0.85" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="92" y1="245" x2="92" y2="259" stroke-width="4.0" />
    <line class="tuner-nut-slot" x1="110" y1="245" x2="110" y2="259" stroke-width="3.2" />
    <line class="tuner-nut-slot" x1="128" y1="245" x2="128" y2="259" stroke-width="2.4" />
    <line class="tuner-nut-slot" x1="146" y1="245" x2="146" y2="259" stroke-width="1.9" />
    <line class="tuner-nut-slot" x1="164" y1="245" x2="164" y2="259" stroke-width="1.5" />
    <line class="tuner-nut-slot" x1="182" y1="245" x2="182" y2="259" stroke-width="1.1" />
    <line class="tuner-nut-slot" x1="200" y1="245" x2="200" y2="259" stroke-width="0.95" />
    <line class="tuner-nut-slot" x1="218" y1="245" x2="218" y2="259" stroke-width="0.8" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="206" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="206" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="206" r="23" />
    <text class="tuner-peg-label" x="48" y="206" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">F#</text>
  </g>
  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="148" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="148" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="148" r="23" />
    <text class="tuner-peg-label" x="48" y="148" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>
  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="90" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="90" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="90" r="23" />
    <text class="tuner-peg-label" x="48" y="90" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>
  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="48" cy="32" r="34" />
    <circle class="tuner-peg-ring" cx="48" cy="32" r="28" />
    <circle class="tuner-peg-circle" cx="48" cy="32" r="23" />
    <text class="tuner-peg-label" x="48" y="32" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">A</text>
  </g>
  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="272" cy="44" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="44" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="44" r="23" />
    <text class="tuner-peg-label" x="272" y="44" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">D</text>
  </g>
  <g class="tuner-peg" data-string-index="5" role="button" tabindex="0" aria-label="Target string 6">
    <circle class="tuner-peg-glow" cx="272" cy="102" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="102" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="102" r="23" />
    <text class="tuner-peg-label" x="272" y="102" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">G</text>
  </g>
  <g class="tuner-peg" data-string-index="6" role="button" tabindex="0" aria-label="Target string 7">
    <circle class="tuner-peg-glow" cx="272" cy="160" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="160" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="160" r="23" />
    <text class="tuner-peg-label" x="272" y="160" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">B</text>
  </g>
  <g class="tuner-peg" data-string-index="7" role="button" tabindex="0" aria-label="Target string 8">
    <circle class="tuner-peg-glow" cx="272" cy="218" r="34" />
    <circle class="tuner-peg-ring" cx="272" cy="218" r="28" />
    <circle class="tuner-peg-circle" cx="272" cy="218" r="23" />
    <text class="tuner-peg-label" x="272" y="218" font-size="22" font-weight="800" text-anchor="middle" dominant-baseline="central">E</text>
  </g>
</svg>`;

const ACOUSTIC_12_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 265" width="100%" height="100%">
  ${SVG_STYLE_BASE}
  <rect class="tuner-bg" width="320" height="265" />

  <path class="tuner-fretboard-base" d="M 88,245 L 88,265 L 232,265 L 232,245 Z" />
  <line x1="88" y1="262" x2="232" y2="262" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

  <path class="tuner-headstock-outline" d="
    M 160,20
    C 145,20 134,8 116,8
    C 82,8 60,18 58,42
    C 56,84 60,146 66,192
    C 71,222 81,245 88,245
    L 232,245
    C 239,245 249,222 254,192
    C 260,146 264,84 262,42
    C 260,18 238,8 204,8
    C 186,8 175,20 160,20
    Z" />

  <path class="tuner-purfling" d="
    M 160,26
    C 147,26 136,14 118,14
    C 86,14 66,23 64,44
    C 62,84 66,144 71,190
    C 76,218 84,239 92,240
    L 228,240
    C 236,239 244,218 249,190
    C 254,144 258,84 256,44
    C 254,23 234,14 202,14
    C 184,14 173,26 160,26
    Z" />

  <g id="tuner-inlay-group">
    <polygon fill="#F2FD43" points="160,24 167,31 160,33 153,31" opacity="0.95" />
    <polygon class="tuner-headstock-inlay" points="160,34 165,45 160,56 155,45" />
    <polygon fill="#F2FD43" points="160,66 167,59 160,57 153,59" opacity="0.95" />
  </g>

  <g id="tuner-truss-group">
    <path class="tuner-truss-cover" d="
      M 160,195
      C 163,195 168,202 170,212
      C 172,222 176,232 178,238
      L 142,238
      C 144,232 148,222 150,212
      C 152,202 157,195 160,195
      Z" />
    <circle class="tuner-truss-screw" cx="160" cy="201" r="1.6" />
    <circle class="tuner-truss-screw" cx="148" cy="233" r="1.6" />
    <circle class="tuner-truss-screw" cx="172" cy="233" r="1.6" />
  </g>

  <g id="tuner-hardware-group">
    <line class="tuner-peg-post" x1="48" y1="28" x2="78" y2="28" />
    <circle class="tuner-bushing-washer" cx="78" cy="28" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="28" r="5" />
    <circle class="tuner-post-core" cx="78" cy="28" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="58" x2="78" y2="58" />
    <circle class="tuner-bushing-washer" cx="78" cy="58" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="58" r="5" />
    <circle class="tuner-post-core" cx="78" cy="58" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="88" x2="78" y2="88" />
    <circle class="tuner-bushing-washer" cx="78" cy="88" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="88" r="5" />
    <circle class="tuner-post-core" cx="78" cy="88" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="118" x2="78" y2="118" />
    <circle class="tuner-bushing-washer" cx="78" cy="118" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="118" r="5" />
    <circle class="tuner-post-core" cx="78" cy="118" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="148" x2="78" y2="148" />
    <circle class="tuner-bushing-washer" cx="78" cy="148" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="148" r="5" />
    <circle class="tuner-post-core" cx="78" cy="148" r="2.2" />
    <line class="tuner-peg-post" x1="48" y1="178" x2="78" y2="178" />
    <circle class="tuner-bushing-washer" cx="78" cy="178" r="8" />
    <circle class="tuner-peg-bushing" cx="78" cy="178" r="5" />
    <circle class="tuner-post-core" cx="78" cy="178" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="38" x2="242" y2="38" />
    <circle class="tuner-bushing-washer" cx="242" cy="38" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="38" r="5" />
    <circle class="tuner-post-core" cx="242" cy="38" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="68" x2="242" y2="68" />
    <circle class="tuner-bushing-washer" cx="242" cy="68" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="68" r="5" />
    <circle class="tuner-post-core" cx="242" cy="68" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="98" x2="242" y2="98" />
    <circle class="tuner-bushing-washer" cx="242" cy="98" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="98" r="5" />
    <circle class="tuner-post-core" cx="242" cy="98" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="128" x2="242" y2="128" />
    <circle class="tuner-bushing-washer" cx="242" cy="128" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="128" r="5" />
    <circle class="tuner-post-core" cx="242" cy="128" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="158" x2="242" y2="158" />
    <circle class="tuner-bushing-washer" cx="242" cy="158" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="158" r="5" />
    <circle class="tuner-post-core" cx="242" cy="158" r="2.2" />
    <line class="tuner-peg-post" x1="272" y1="188" x2="242" y2="188" />
    <circle class="tuner-bushing-washer" cx="242" cy="188" r="8" />
    <circle class="tuner-peg-bushing" cx="242" cy="188" r="5" />
    <circle class="tuner-post-core" cx="242" cy="188" r="2.2" />
  </g>

  <g class="tuner-strings-group">
    <path class="tuner-string-wrap str-s0" d="M 82,178 A 4 4 0 0 0 74,178" stroke-width="3.2" />
    <line class="tuner-string-line str-s0" x1="82" y1="178" x2="92" y2="245" stroke-width="3.2" />
    <line class="tuner-string-line str-s0" x1="92" y1="245" x2="92" y2="265" stroke-width="3.2" />
    <path class="tuner-string-wrap str-s1" d="M 82,148 A 4 4 0 0 0 74,148" stroke-width="1.2" />
    <line class="tuner-string-line str-s1" x1="82" y1="148" x2="104" y2="245" stroke-width="1.2" />
    <line class="tuner-string-line str-s1" x1="104" y1="245" x2="104" y2="265" stroke-width="1.2" />
    <path class="tuner-string-wrap str-s2" d="M 82,118 A 4 4 0 0 0 74,118" stroke-width="2.8" />
    <line class="tuner-string-line str-s2" x1="82" y1="118" x2="116" y2="245" stroke-width="2.8" />
    <line class="tuner-string-line str-s2" x1="116" y1="245" x2="116" y2="265" stroke-width="2.8" />
    <path class="tuner-string-wrap str-s3" d="M 82,88 A 4 4 0 0 0 74,88" stroke-width="1.2" />
    <line class="tuner-string-line str-s3" x1="82" y1="88" x2="128" y2="245" stroke-width="1.2" />
    <line class="tuner-string-line str-s3" x1="128" y1="245" x2="128" y2="265" stroke-width="1.2" />
    <path class="tuner-string-wrap str-s4" d="M 82,58 A 4 4 0 0 0 74,58" stroke-width="2.4" />
    <line class="tuner-string-line str-s4" x1="82" y1="58" x2="140" y2="245" stroke-width="2.4" />
    <line class="tuner-string-line str-s4" x1="140" y1="245" x2="140" y2="265" stroke-width="2.4" />
    <path class="tuner-string-wrap str-s5" d="M 82,28 A 4 4 0 0 0 74,28" stroke-width="1.0" />
    <line class="tuner-string-line str-s5" x1="82" y1="28" x2="152" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s5" x1="152" y1="245" x2="152" y2="265" stroke-width="1.0" />
    <path class="tuner-string-wrap str-s6" d="M 238,38 A 4 4 0 0 1 246,38" stroke-width="2.4" />
    <line class="tuner-string-line str-s6" x1="238" y1="38" x2="164" y2="245" stroke-width="2.4" />
    <line class="tuner-string-line str-s6" x1="164" y1="245" x2="164" y2="265" stroke-width="2.4" />
    <path class="tuner-string-wrap str-s7" d="M 238,68 A 4 4 0 0 1 246,68" stroke-width="1.0" />
    <line class="tuner-string-line str-s7" x1="238" y1="68" x2="176" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s7" x1="176" y1="245" x2="176" y2="265" stroke-width="1.0" />
    <path class="tuner-string-wrap str-s8" d="M 238,98 A 4 4 0 0 1 246,98" stroke-width="2.2" />
    <line class="tuner-string-line str-s8" x1="238" y1="98" x2="188" y2="245" stroke-width="2.2" />
    <line class="tuner-string-line str-s8" x1="188" y1="245" x2="188" y2="265" stroke-width="2.2" />
    <path class="tuner-string-wrap str-s9" d="M 238,128 A 4 4 0 0 1 246,128" stroke-width="2.2" />
    <line class="tuner-string-line str-s9" x1="238" y1="128" x2="200" y2="245" stroke-width="2.2" />
    <line class="tuner-string-line str-s9" x1="200" y1="245" x2="200" y2="265" stroke-width="2.2" />
    <path class="tuner-string-wrap str-s10" d="M 238,158 A 4 4 0 0 1 246,158" stroke-width="1.0" />
    <line class="tuner-string-line str-s10" x1="238" y1="158" x2="212" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s10" x1="212" y1="245" x2="212" y2="265" stroke-width="1.0" />
    <path class="tuner-string-wrap str-s11" d="M 238,188 A 4 4 0 0 1 246,188" stroke-width="1.0" />
    <line class="tuner-string-line str-s11" x1="238" y1="188" x2="224" y2="245" stroke-width="1.0" />
    <line class="tuner-string-line str-s11" x1="224" y1="245" x2="224" y2="265" stroke-width="1.0" />
  </g>

  <g id="tuner-nut-group">
    <rect class="tuner-nut" x="88" y="245" width="144" height="14" rx="3" />
    <line class="tuner-nut-slot" x1="92" y1="245" x2="92" y2="259" stroke-width="2.8" />
    <line class="tuner-nut-slot" x1="104" y1="245" x2="104" y2="259" stroke-width="1.0" />
    <line class="tuner-nut-slot" x1="116" y1="245" x2="116" y2="259" stroke-width="2.4" />
    <line class="tuner-nut-slot" x1="128" y1="245" x2="128" y2="259" stroke-width="1.0" />
    <line class="tuner-nut-slot" x1="140" y1="245" x2="140" y2="259" stroke-width="2.0" />
    <line class="tuner-nut-slot" x1="152" y1="245" x2="152" y2="259" stroke-width="0.9" />
    <line class="tuner-nut-slot" x1="164" y1="245" x2="164" y2="259" stroke-width="2.0" />
    <line class="tuner-nut-slot" x1="176" y1="245" x2="176" y2="259" stroke-width="0.9" />
    <line class="tuner-nut-slot" x1="188" y1="245" x2="188" y2="259" stroke-width="1.9" />
    <line class="tuner-nut-slot" x1="200" y1="245" x2="200" y2="259" stroke-width="1.9" />
    <line class="tuner-nut-slot" x1="212" y1="245" x2="212" y2="259" stroke-width="0.9" />
    <line class="tuner-nut-slot" x1="224" y1="245" x2="224" y2="259" stroke-width="0.9" />
  </g>

  <g class="tuner-peg" data-string-index="0" role="button" tabindex="0" aria-label="Target string 1">
    <circle class="tuner-peg-glow" cx="48" cy="178" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="178" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="178" r="21" />
    <text class="tuner-peg-label" x="48" y="178" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">E2</text>
  </g>
  <g class="tuner-peg" data-string-index="1" role="button" tabindex="0" aria-label="Target string 2">
    <circle class="tuner-peg-glow" cx="48" cy="148" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="148" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="148" r="21" />
    <text class="tuner-peg-label" x="48" y="148" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">E3</text>
  </g>
  <g class="tuner-peg" data-string-index="2" role="button" tabindex="0" aria-label="Target string 3">
    <circle class="tuner-peg-glow" cx="48" cy="118" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="118" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="118" r="21" />
    <text class="tuner-peg-label" x="48" y="118" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">A2</text>
  </g>
  <g class="tuner-peg" data-string-index="3" role="button" tabindex="0" aria-label="Target string 4">
    <circle class="tuner-peg-glow" cx="48" cy="88" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="88" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="88" r="21" />
    <text class="tuner-peg-label" x="48" y="88" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">A3</text>
  </g>
  <g class="tuner-peg" data-string-index="4" role="button" tabindex="0" aria-label="Target string 5">
    <circle class="tuner-peg-glow" cx="48" cy="58" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="58" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="58" r="21" />
    <text class="tuner-peg-label" x="48" y="58" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">D3</text>
  </g>
  <g class="tuner-peg" data-string-index="5" role="button" tabindex="0" aria-label="Target string 6">
    <circle class="tuner-peg-glow" cx="48" cy="28" r="30" />
    <circle class="tuner-peg-ring" cx="48" cy="28" r="25" />
    <circle class="tuner-peg-circle" cx="48" cy="28" r="21" />
    <text class="tuner-peg-label" x="48" y="28" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">D4</text>
  </g>
  <g class="tuner-peg" data-string-index="6" role="button" tabindex="0" aria-label="Target string 7">
    <circle class="tuner-peg-glow" cx="272" cy="38" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="38" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="38" r="21" />
    <text class="tuner-peg-label" x="272" y="38" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">G3</text>
  </g>
  <g class="tuner-peg" data-string-index="7" role="button" tabindex="0" aria-label="Target string 8">
    <circle class="tuner-peg-glow" cx="272" cy="68" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="68" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="68" r="21" />
    <text class="tuner-peg-label" x="272" y="68" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">G4</text>
  </g>
  <g class="tuner-peg" data-string-index="8" role="button" tabindex="0" aria-label="Target string 9">
    <circle class="tuner-peg-glow" cx="272" cy="98" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="98" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="98" r="21" />
    <text class="tuner-peg-label" x="272" y="98" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">B3</text>
  </g>
  <g class="tuner-peg" data-string-index="9" role="button" tabindex="0" aria-label="Target string 10">
    <circle class="tuner-peg-glow" cx="272" cy="128" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="128" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="128" r="21" />
    <text class="tuner-peg-label" x="272" y="128" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">B3</text>
  </g>
  <g class="tuner-peg" data-string-index="10" role="button" tabindex="0" aria-label="Target string 11">
    <circle class="tuner-peg-glow" cx="272" cy="158" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="158" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="158" r="21" />
    <text class="tuner-peg-label" x="272" y="158" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">E4</text>
  </g>
  <g class="tuner-peg" data-string-index="11" role="button" tabindex="0" aria-label="Target string 12">
    <circle class="tuner-peg-glow" cx="272" cy="188" r="30" />
    <circle class="tuner-peg-ring" cx="272" cy="188" r="25" />
    <circle class="tuner-peg-circle" cx="272" cy="188" r="21" />
    <text class="tuner-peg-label" x="272" y="188" font-size="16" font-weight="800" text-anchor="middle" dominant-baseline="central">E4</text>
  </g>
</svg>`;

const ART_REGISTRY = {
  acoustic: {
    6: ACOUSTIC_6_SVG,
    5: ACOUSTIC_5_SVG,
    12: ACOUSTIC_12_SVG
  },
  electric: {
    6: ELECTRIC_6_SVG,
    5: ELECTRIC_5_SVG,
    7: ELECTRIC_7_SVG,
    8: ELECTRIC_8_SVG
  },
  bass: {
    4: BASS_4_SVG,
    5: BASS_5_SVG,
    6: BASS_6_SVG
  }
};

export function getInstrumentArt(instrumentId, stringCount) {
  const group = ART_REGISTRY[instrumentId];
  if (!group) return null;
  if (stringCount && group[stringCount]) return group[stringCount];
  // Fallback to closest count for custom sizes (e.g., 9 for electric, 7-11 for acoustic)
  if (stringCount) {
    const keys = Object.keys(group).map(Number).sort((a,b)=>a-b);
    let best = keys[0];
    let bestDiff = Math.abs(keys[0] - stringCount);
    for (const k of keys) {
      const diff = Math.abs(k - stringCount);
      if (diff < bestDiff) { bestDiff = diff; best = k; }
    }
    if (group[best]) return group[best];
  }
  if (instrumentId === 'bass') return group[4] || group[5] || group[6];
  if (instrumentId === 'electric') return group[8] || group[7] || group[6] || group[5];
  return group[12] || group[6] || group[5];
}

