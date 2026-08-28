import { bandMembers } from './members.config';
import { contacts } from './contact.config';

export interface EpkMember {
  name: string;
  role: string;
  instruments: string[];
  icon: string;
  photoUrl: string;
  gearSummary: string;
}

export interface EpkDownloadItem {
  id: string;
  title: string;
  category: string;
  format: string;
  size: string;
  description: string;
  downloadFilename: string;
  icon: string;
}

export interface EpkPressPhoto {
  id: string;
  title: string;
  type: string;
  imgUrl: string;
  downloadUrl: string;
  badge: string;
}

export const epkConfig = {
  enabled: false,
  // Band Core Identity
  bandName: "KINS",
  handle: "@KinsBandOfficial",
  origin: "Newcastle, NSW, Australia",
  originDetails: "East Coast Hub • 2h North of Sydney",
  genreMain: "Post-Punk / Alternative Rock",
  subGenres: ["Post-Punk Revival", "Alternative Rock", "Atmospheric Indie", "Garage Rock"],
  riyl: ["Fontaines D.C.", "IDLES", "The Murder Capital", "The Cure", "Gang of Youths"],
  yearFormed: "2024",
  tagline: "Newcastle's visceral post-punk four-piece delivering high-voltage hooks, driving rhythm section urgency, and atmospheric wall-of-sound energy.",
  heroImage: "new.png",
  logoImage: "new.png",

  // Band Members Roster (single source: members.config.ts)
  members: bandMembers.map((m) => ({
    name: m.name,
    role: m.role,
    instruments: m.instruments,
    icon: m.icon,
    photoUrl: "new.png",
    gearSummary: m.gearSummary
  })) as EpkMember[],

  // Live Repertoire & Performance Offering (Day-0 Verified for Booking Agents)
  repertoire: {
    title: "Live Formats & Booking",
    subtitle: "Turnkey live set options and stage requirements tailored for support slots and club bills.",
    setOptions: [
      { length: "30 Min", label: "Opening / Support Set", desc: "High-octane, punchy set designed for multi-band bills and tour support slots." },
      { length: "45 Min", label: "Feature / Co-Headline Set", desc: "Dynamic balance of original anthems and select crowd-pleasing post-punk covers." }
    ],
    setBreakdown: [
      {
        title: "High-Voltage Originals",
        icon: "fa-bolt",
        description: "Original material driven by driving bass grooves, syncopated drums, and jagged chorused guitars."
      },
      {
        title: "Curated Post-Punk Covers",
        icon: "fa-record-vinyl",
        description: "Select high-energy renditions from seminal post-punk artists (The Cure, Joy Division, The Strokes)."
      },
      {
        title: "Turnkey 4-Piece Execution",
        icon: "fa-sliders",
        description: "Professional gain staging, IEM monitoring, and quick line-check changeover."
      }
    ]
  },

  // 3-Tier Press Biography Matrix (Short, Medium, Large)
  bios: {
    short: {
      id: "short",
      label: "Short",
      pillLabel: "Short (~50w)",
      wordCount: "48 Words",
      targetUse: "PRESS USE: SOCIALS & LINEUP POSTERS",
      description: "Elevator pitch for lineup posters, social blurbs, and quick festival announcements.",
      text: "Hailing from Newcastle, NSW, Australia, KINS (@KinsBandOfficial) are an explosive four-piece post-punk and alternative rock outfit. Formed in late 2024, the band fuses driving rhythm urgency, jagged chorused guitars, and visceral vocal hooks reminiscent of Fontaines D.C., IDLES, and The Cure. Direct booking: BookingsKinsBand@gmail.com."
    },
    medium: {
      id: "medium",
      label: "Medium",
      pillLabel: "Medium (~135w)",
      wordCount: "135 Words",
      targetUse: "PRESS USE: GIG GUIDES & PRESS RELEASES",
      description: "Standard program bio for festival guides, venue listings, radio intros, and press write-ups.",
      text: "Hailing from the coastal rock hub of Newcastle, NSW, Australia, KINS (@KinsBandOfficial) are an explosive four-piece post-punk and alternative rock outfit. Formed in late 2024 by Vivian (lead vocals, rhythm guitar), Charlie (lead guitar, backing vocals), Oscar (bass, synthesizers), and Trai (drums), the band creates a visceral sonic identity grounded in driving rhythm section urgency, jagged chorused guitar interplay, and impassioned melodic hooks. Drawing stylistic cues from the kinetic intensity of Fontaines D.C. and IDLES alongside the atmospheric textures of The Cure, KINS deliver high-octane live performances built to transform club rooms with raw volume, dynamic tension, and unrelenting stage presence. For booking and touring inquiries, contact BookingsKinsBand@gmail.com."
    },
    large: {
      id: "large",
      label: "Large",
      pillLabel: "Large (~280w)",
      wordCount: "282 Words",
      targetUse: "PRESS USE: EDITORIAL, INTERVIEWS & FEATURES",
      description: "Comprehensive editorial narrative for music journalists, print interviews, and deep-dive features.",
      text: "Formed in late 2024 in the historic coastal rock hub of Newcastle, NSW, Australia, KINS (@KinsBandOfficial) are a high-voltage four-piece post-punk and alternative rock unit delivering visceral energy, relentless rhythm, and brooding atmospheric wall-of-sound texture.\n\nThe lineup brings together Vivian (lead vocals, rhythm guitar), Charlie (lead guitar, backing vocals), Oscar (bass guitar, synthesizers), and Trai (drums and percussion). Together, the quartet establishes a commanding sonic signature built upon locked-groove basslines, driving drum pacing, jagged chorused guitar interplay, and impassioned vocal anthems.\n\nRooted in the lineage of classic UK and Australian post-punk revivalists while carving out an urgent modern sound, KINS draw creative inspiration from the kinetic intensity of Fontaines D.C. and IDLES alongside the rich tonal textures of The Cure and Joy Division. Their songwriting balances dynamic tension with explosive releases, crafting songs tailored for intimate club rooms and expansive festival stages alike.\n\nOperating with professional stage discipline and a shared DIY ethos, KINS provide turnkey live setups adaptable for support slots, co-headline bills, and multi-band showcases. With an expanding catalogue of original material and reimagined post-punk anthems, KINS represent the new wave of Australian alternative rock. Direct all booking, press, and festival inquiries to BookingsKinsBand@gmail.com."
    }
  },

  // Backward compatibility alias for single bio consumers
  bio: {
    wordCount: "48 Words",
    text: "Hailing from Newcastle, NSW, Australia, KINS (@KinsBandOfficial) are an explosive four-piece post-punk and alternative rock outfit. Formed in late 2024, the band fuses driving rhythm urgency, jagged chorused guitars, and visceral vocal hooks reminiscent of Fontaines D.C., IDLES, and The Cure. Direct booking: BookingsKinsBand@gmail.com."
  },

  // Press Photography & Visual Assets
  pressPhotos: [
    {
      id: "photo-1",
      title: "Official Studio Portrait",
      type: "Landscape / 300 DPI",
      imgUrl: "new.png",
      downloadUrl: "new.png",
      badge: "PRINT & WEB"
    },
    {
      id: "photo-2",
      title: "Live Stage Photography",
      type: "Landscape / 300 DPI",
      imgUrl: "new.png",
      downloadUrl: "new.png",
      badge: "HIGH RESOLUTION"
    },
    {
      id: "photo-3",
      title: "Official Vector Band Logo",
      type: "Vector SVG & Transparent PNG",
      imgUrl: "new.png",
      downloadUrl: "new.png",
      badge: "PROMO BRANDING"
    }
  ] as EpkPressPhoto[],

  // Backline Specification Details (for Promoters & Stage Managers)
  backlineSpec: {
    bandProvides: [
      "Drum Breakables (Snare drum, cymbals, kick pedal)",
      "Guitar Amplifier Heads / Combos & Pedalboards",
      "Wireless IEM Monitoring Transmitter System",
      "Instrument Cables, Power Supplies & Patch Leads"
    ],
    venueProvides: [
      "5-Piece Drum Shell Pack (Kick, 2x Rack Toms, Floor Tom, Snare Stand, Hi-Hat Stand, 3x Cymbal Boom Stands, Drum Throne)",
      "Bass Cabinet (4x10 or 8x10 enclosure)",
      "3x Vocal Microphones (Shure SM58 or Beta 58A) with tall boom stands",
      "3x Active DI Boxes (Bass, Synth, Acoustic/Aux)",
      "FOH Professional PA System & 4 Independent Monitor Mixes"
    ]
  },

  // Direct Contact Channels (single source: contact.config.ts)
  contacts,

  // Downloadable Assets Deck (Day-0 Verified Technical Assets)
  downloadDeck: [
    {
      id: "deck-rider",
      title: "Stage Plot & Tech Rider",
      category: "TECH SPECS",
      format: "PDF",
      size: "1.8 MB",
      description: "Complete stage plot diagram, explicit band vs. venue backline checklist, and power requirements.",
      downloadFilename: "KINS_StagePlot_TechRider_2026.pdf",
      icon: "fa-sliders"
    },
    {
      id: "deck-inputlist",
      title: "Channel Input & Patch List",
      category: "AUDIO SPECS",
      format: "PDF",
      size: "1.1 MB",
      description: "16-channel patch list with mic preferences, monitor mixes, DI routing, and FOH channel assignments.",
      downloadFilename: "KINS_Channel_Input_List_2026.pdf",
      icon: "fa-list-check"
    },
    {
      id: "deck-media",
      title: "Media & Press Kit Pack",
      category: "PHOTOS & LOGOS",
      format: "ZIP",
      size: "48.2 MB",
      description: "Print-ready 300 DPI high-resolution portraits, stage photography, vector logos & color palettes.",
      downloadFilename: "KINS_PressKit_Media_300DPI.zip",
      icon: "fa-file-zipper"
    },
    {
      id: "deck-onesheet",
      title: "Promotional One-Sheet",
      category: "ONE-SHEET",
      format: "PDF",
      size: "2.4 MB",
      description: "High-density artist summary with bio, sonic comps, lineup details, and booking contacts.",
      downloadFilename: "KINS_Official_OneSheet_2026.pdf",
      icon: "fa-file-lines"
    }
  ] as EpkDownloadItem[]
};
