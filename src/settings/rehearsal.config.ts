/**
 * Rehearsal & Stage Utilities Configuration (KINS TOOLS)
 * Single source of truth for all tools, descriptions, icons, and offline notices.
 */

export interface RehearsalToolItem {
  id: string;
  icon: string;
  title: string;
  shortTitle?: string;
  badge?: string;
  desktopBullets: string[];
  mobileBlurb: string;
  desktopBtn: string;
  mobileBtn: string;
  url: string;
  isExternal?: boolean;
}

export interface RehearsalConfig {
  title: string;
  icon: string;
  desktopSubtitle: string;
  mobileSubtitle: string;
  tools: RehearsalToolItem[];
  offlineBanner: {
    icon: string;
    desktop: string;
    mobile: string;
  };
}

export const rehearsalConfig: RehearsalConfig = {
  title: 'KINS TOOLS',
  icon: 'fa-solid fa-wrench',
  desktopSubtitle: 'Ad-free Web Audio tools engineered for fast backstage and rehearsal use.',
  mobileSubtitle: 'Offline-ready browser tools for musicians.',
  tools: [
    {
      id: 'tuner',
      icon: 'fa-solid fa-guitar',
      title: 'TUNER',
      shortTitle: 'TUNER',
      desktopBullets: [
        'Mic pitch detection',
        'E2 → E4 / Bass (±50¢)',
        'Drop D & DADGAD modes',
      ],
      mobileBlurb: 'Mic pitch detection · Standard/Drop D',
      desktopBtn: 'Launch Tuner →',
      mobileBtn: 'Open Tuner →',
      url: '/tuner',
    },
    {
      id: 'metronome',
      icon: 'fa-solid fa-drum',
      title: 'METRONOME',
      shortTitle: 'METRONOME',
      desktopBullets: [
        'Web Audio clock loop',
        'Multi-tap BPM counter',
        'Accents & subdivs',
      ],
      mobileBlurb: 'Tap tempo · 4/4, 6/8, 7/8 · Accents',
      desktopBtn: 'Launch Metronome →',
      mobileBtn: 'Open Metro →',
      url: '/metronome',
    },

  ],
  offlineBanner: {
    icon: 'fa-solid fa-bolt',
    desktop: 'works offline · 100% free',
    mobile: 'works offline · 100% free',
  },
};
