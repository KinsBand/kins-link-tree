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
  heroImage: "kins-studio/pfp.jpg",
  logoImage: "kins-logo-new.png",

  // Band Members Roster (Day-0 Verified Lineup & Equipment)
  members: [
    { 
      name: "Vivian", 
      role: "Lead Vocals & Rhythm Guitar", 
      instruments: ["Lead Vocals", "Rhythm Electric Guitar"], 
      icon: "fa-microphone",
      photoUrl: "kins-studio/pfp.jpg",
      gearSummary: "Vocal Mic (SM58/Beta58), Fender Combo / Head, Pedalboard"
    },
    { 
      name: "Charlie", 
      role: "Lead Guitar & Backing Vocals", 
      instruments: ["Lead Electric Guitar", "Backing Vocals"], 
      icon: "fa-guitar",
      photoUrl: "pfp.jpg",
      gearSummary: "Guitar Head/Cab, Dual Chorus & Fuzz Pedalboard, Backing Mic"
    },
    { 
      name: "Oscar", 
      role: "Bass Guitar & Synthesizers", 
      instruments: ["4-String Bass", "Analog Synthesizer"], 
      icon: "fa-sliders",
      photoUrl: "kins-studio/pfp.jpg",
      gearSummary: "Active DI, Bass Preamp / Cab, Synth DI Line"
    },
    { 
      name: "Trai", 
      role: "Drums & Percussion", 
      instruments: ["5-Piece Drum Kit", "Percussion Pads"], 
      icon: "fa-drum",
      photoUrl: "pfp.jpg",
      gearSummary: "Band brings snare, cymbals, kick pedal (Requires venue shell pack)"
    }
  ] as EpkMember[],

  // Live Repertoire & Performance Offering (Day-0 Verified for Booking Agents)
  repertoire: {
    title: "Live Repertoire & Performance Format",
    subtitle: "Turnkey live set configurations tailored for club headliners, support slots, and multi-band bills.",
    setOptions: [
      { length: "30 Min", label: "Support / Opening Set", desc: "Fast, punchy, high-octane set designed to capture the room immediately." },
      { length: "45 Min", label: "Feature / Co-Headline", desc: "Balanced dynamic arc of original anthems and select crowd-pleasing post-punk covers." },
      { length: "60 Min", label: "Full Headline Set", desc: "Comprehensive full-throttle live show with extended instrumental builds and high-energy encore." }
    ],
    setBreakdown: [
      {
        title: "High-Voltage Originals",
        icon: "fa-bolt",
        description: "Original material driven by muscular bass grooves, syncopated drum rhythms, jagged chorused guitars, and commanding vocal hooks."
      },
      {
        title: "Curated Post-Punk Covers",
        icon: "fa-record-vinyl",
        description: "Reimagined high-energy renditions of seminal tracks from artists including The Cure, Joy Division, and The Strokes that immediately connect with live crowds."
      },
      {
        title: "Stage Presence & Volume",
        icon: "fa-fire",
        description: "Tight four-piece live execution with professional gain staging, seamless song transitions, and charismatic crowd connection."
      }
    ]
  },

  // Focused 1-Paragraph Band Biography (Day-0 Honest)
  bio: {
    wordCount: "135 Words",
    text: "Hailing from the coastal rock hub of Newcastle, NSW, Australia, KINS (@KinsBandOfficial) are an explosive four-piece post-punk and alternative rock outfit. Formed in late 2024 by Vivian (lead vocals, rhythm guitar), Charlie (lead guitar, backing vocals), Oscar (bass, synthesizers), and Trai (drums), the band creates a visceral sonic identity grounded in driving rhythm section urgency, jagged chorused guitar interplay, and impassioned melodic hooks. Drawing stylistic cues from the kinetic intensity of Fontaines D.C. and IDLES alongside the atmospheric textures of The Cure, KINS deliver high-octane live performances built to transform club rooms with raw volume, dynamic tension, and unrelenting stage presence. For booking and touring inquiries, contact booking@kinsband.com."
  },

  // Press Photography & Visual Assets
  pressPhotos: [
    {
      id: "photo-1",
      title: "Official Studio Portrait",
      type: "Landscape / 300 DPI",
      imgUrl: "kins-studio/pfp.jpg",
      downloadUrl: "kins-studio/pfp.jpg",
      badge: "PRINT & WEB"
    },
    {
      id: "photo-2",
      title: "Live Stage Photography",
      type: "Landscape / 300 DPI",
      imgUrl: "pfp.jpg",
      downloadUrl: "pfp.jpg",
      badge: "HIGH RESOLUTION"
    },
    {
      id: "photo-3",
      title: "Official Vector Band Logo",
      type: "Vector SVG & Transparent PNG",
      imgUrl: "kins-logo-new.png",
      downloadUrl: "kins-logo-new.png",
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

  // Direct Contact Channels (Strictly 2 Official Emails)
  contacts: [
    {
      role: "Live Booking & Shows",
      email: "booking@kinsband.com",
      description: "Headline concerts, festival lineups, venue booking & tour routing inquiries.",
      cta: "Contact Booking",
      icon: "fa-calendar-check"
    },
    {
      role: "General & Inquiries",
      email: "hello@kinsband.com",
      description: "General artist inquiries, press features, sync licensing & collaborations.",
      cta: "Contact Hello",
      icon: "fa-envelope-open-text"
    }
  ],

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
