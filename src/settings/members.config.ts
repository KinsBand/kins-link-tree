/**
 * Canonical band roster. Single source of truth consumed by the homepage
 * MembersSection and the EPK member cards. Add/modify members here only.
 */
export interface BandMember {
  id: string;
  name: string;
  role: string;
  icon: string;
  initial: string;
  badge: string;
  bio: string;
  instruments: string[];
  gearSummary: string;
}

export const bandMembers: BandMember[] = [
  {
    id: "vivian",
    name: "Vivian",
    role: "Lead Vocals & Rhythm Guitar",
    icon: "fa-microphone",
    initial: "V",
    badge: "VOCALS & GUITAR",
    bio: "Melodies & guitar hooks.",
    instruments: ["Lead Vocals", "Rhythm Electric Guitar"],
    gearSummary: "Vocal Mic (SM58/Beta58), Fender Combo / Head, Pedalboard"
  },
  {
    id: "charlie",
    name: "Charlie",
    role: "Lead Guitar & Backing Vocals",
    icon: "fa-guitar",
    initial: "C",
    badge: "GUITAR & VOCALS",
    bio: "Lyrics, guitar & band energy.",
    instruments: ["Lead Electric Guitar", "Backing Vocals"],
    gearSummary: "Guitar Head/Cab, Dual Chorus & Fuzz Pedalboard, Backing Mic"
  },
  {
    id: "oscar",
    name: "Oscar",
    role: "Bass Guitar & Synthesizers",
    icon: "fa-sliders",
    initial: "O",
    badge: "BASS",
    bio: "Basslines & vintage synths.",
    instruments: ["Electric Bass", "Bass Synth / Moog"],
    gearSummary: "Bass Head/Cab, DI Box (Radial J48), Drive/Chorus Board"
  },
  {
    id: "trai",
    name: "Trai",
    role: "Drums & Percussion",
    icon: "fa-drum",
    initial: "T",
    badge: "DRUMS",
    bio: "Drums & driving heartbeat.",
    instruments: ["Acoustic Drum Kit", "Sample Pad (SPD-SX)"],
    gearSummary: "Drum Rug, Cymbals, Snare, Kick Pedal, SPD-SX Trigger Unit"
  }
];
