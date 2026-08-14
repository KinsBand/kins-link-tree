import { showToast } from './toast.js';

function lockScroll() {
  document.body.classList.add('modal-open');
  document.body.classList.add('gig-map-open');
  document.documentElement.classList.add('modal-open');
  document.documentElement.classList.add('gig-map-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.body.classList.remove('gig-map-open');
  document.documentElement.classList.remove('modal-open');
  document.documentElement.classList.remove('gig-map-open');
}

export const VENUES = [
  {
    id: "venue-cambridge",
    name: "The Cambridge Hotel",
    city: "Newcastle West, NSW",
    address: "789 Hunter St, Newcastle West NSW 2302",
    region: "newcastle",
    lat: -32.9265,
    lng: 151.7675,
    rating: "4.9 ★",
    capacity: "500 Cap",
    transitSummary: "4 min walk from Wickham Interchange",
    parkingSummary: "Free street parking on Hunter St after 6pm",
    amenities: ["💳 Card-Only Bar", "♿ Wheelchair Accessible", "🍺 Craft Taps", "🔊 Full PA Rig", "👕 Merch Booth"],
    shows: [
      {
        id: "gig-newcastle-1",
        venueId: "venue-cambridge",
        venue: "The Cambridge Hotel",
        city: "Newcastle West, NSW",
        address: "789 Hunter St, Newcastle West NSW 2302",
        region: "newcastle",
        lat: -32.9265,
        lng: 151.7675,
        type: "upcoming",
        isNextShow: true,
        dateText: "Sat, Aug 22, 2026",
        urgencyBadgeText: "🔥 IN 8 DAYS",
        ticketPriceLabel: "$15 (EARLY BIRD)",
        ticketUrl: "https://www.bandsintown.com",
        doorsTime: "7:00 PM",
        ageLimit: "18+",
        capacity: "500",
        ticketStatus: "selling_fast",
        targetDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        setTimes: [
          { time: "7:00 PM", act: "Doors Open", role: "Doors" },
          { time: "7:30 PM", act: "The Local Openers", role: "Support", link: "https://open.spotify.com" },
          { time: "8:45 PM", act: "KINS (Main Set)", role: "Headliner" }
        ],
        plannedSetlist: [
          { name: "Pictures of You (The Cure)", tag: "OPENER", duration: "4:20" },
          { name: "Say It Ain't So (Weezer)", tag: "HIGH ENERGY", duration: "4:18" },
          { name: "Common People (Pulp)", tag: "FAN FAVORITE", duration: "4:10" },
          { name: "Jane (The Long Faces)", tag: "DEEP CUT", duration: "3:45" },
          { name: "Everlong (Foo Fighters)", tag: "ENCORE", duration: "4:10" }
        ],
        merchItems: [
          { name: "Tour Tee 2026", price: "$40", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80" },
          { name: "Embroidered Dad Hat", price: "$30", imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80" },
          { name: "Silk Screen Poster", price: "$15", imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80" }
        ]
      },
      {
        id: "gig-cambridge-archive-1",
        venueId: "venue-cambridge",
        venue: "The Cambridge Hotel",
        city: "Newcastle West, NSW",
        address: "789 Hunter St, Newcastle West NSW 2302",
        region: "newcastle",
        lat: -32.9265,
        lng: 151.7675,
        type: "past",
        isNextShow: false,
        dateText: "Played Jan 17, 2025",
        attendanceCount: 340,
        hasUserCheckedIn: false,
        doorsTime: "7:00 PM",
        ageLimit: "18+",
        capacity: "500",
        spotifyPlaylistUrl: "https://open.spotify.com",
        recapPhotos: [
          { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", caption: "Stage & Light Rig", credit: "@local_photographer" },
          { url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", caption: "Full Room Crowd", credit: "@rock_lens" },
          { url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80", caption: "Encore on Bar Counter", credit: "@band_archives" }
        ],
        asPlayedSetlist: [
          { name: "Pictures of You (The Cure cover)", tag: "Opener", duration: "4:20" },
          { name: "Say It Ain't So (Weezer cover)", tag: "High Energy", duration: "4:18" },
          { name: "Common People", tag: "Britpop", duration: "4:10" },
          { name: "Jane", tag: "Art Rock", duration: "3:45" },
          { name: "Neon Horizon [UNRELEASED NEW SONG]", isUnreleased: true, tag: "Debut", duration: "3:55" },
          { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", hasSnippet: true }
        ],
        highlightsAndTrivia: [
          "Sold out 3 days in advance (500 cap).",
          "Surprise acoustic encore performed directly from the bar counter.",
          "Total Set Time: 1 hour 18 minutes."
        ],
        pastVenueHistory: [
          { date: "Jan 17, 2025", tourName: "Tour 2025" },
          { date: "Aug 12, 2023", tourName: "Debut EP Tour" }
        ]
      }
    ]
  },
  {
    id: "venue-lansdowne",
    name: "The Lansdowne Hotel",
    city: "Chippendale, Sydney NSW",
    address: "2-6 City Rd, Chippendale NSW 2008",
    region: "sydney",
    lat: -33.8845,
    lng: 151.1985,
    rating: "5.0 ★",
    capacity: "300 Cap",
    transitSummary: "5 min walk from Central Station (Railway Square exit)",
    parkingSummary: "Limited street parking on Broadway & City Rd",
    amenities: ["🍕 Famous Pizza", "🎸 Intimate Stage", "💿 Vinyl DJs", "🍺 Resch's On Tap", "♿ Accessible Ground"],
    shows: [
      {
        id: "gig-lansdowne-upcoming",
        venueId: "venue-lansdowne",
        venue: "The Lansdowne Hotel",
        city: "Chippendale, Sydney",
        address: "2-6 City Rd, Chippendale NSW 2008",
        region: "sydney",
        lat: -33.8845,
        lng: 151.1985,
        type: "upcoming",
        isNextShow: false,
        dateText: "Sat, Oct 17, 2026",
        urgencyBadgeText: "🔥 80% SOLD",
        ticketPriceLabel: "$20 + BF",
        ticketUrl: "https://www.bandsintown.com",
        doorsTime: "7:30 PM",
        ageLimit: "18+",
        capacity: "300",
        ticketStatus: "available",
        targetDate: new Date(Date.now() + 64 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        setTimes: [
          { time: "7:30 PM", act: "Doors Open", role: "Doors" },
          { time: "8:15 PM", act: "Velvet Bloom", role: "Support", link: "https://open.spotify.com" },
          { time: "9:30 PM", act: "KINS (Headline Set)", role: "Headliner" }
        ],
        plannedSetlist: [
          { name: "Boys Don't Cry (The Cure)", tag: "OPENER", duration: "2:40" },
          { name: "Buddy Holly (Weezer)", tag: "HIGH ENERGY", duration: "2:40" },
          { name: "Common People (Pulp)", tag: "FAN FAVORITE", duration: "4:10" },
          { name: "Cadillac (The Long Faces)", tag: "DEEP CUT", duration: "3:30" },
          { name: "Everlong (Foo Fighters)", tag: "ENCORE", duration: "4:10" }
        ],
        merchItems: [
          { name: "Tour Tee 2026", price: "$40", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80" },
          { name: "Lansdowne Special Poster", price: "$15", imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80" }
        ]
      },
      {
        id: "gig-sydney-past-1",
        venueId: "venue-lansdowne",
        venue: "The Lansdowne Hotel",
        city: "Chippendale, Sydney",
        address: "2-6 City Rd, Chippendale NSW 2008",
        region: "sydney",
        lat: -33.8845,
        lng: 151.1985,
        type: "past",
        isNextShow: false,
        dateText: "Played Jul 18, 2026",
        attendanceCount: 300,
        hasUserCheckedIn: true,
        doorsTime: "7:30 PM",
        ageLimit: "18+",
        capacity: "300",
        spotifyPlaylistUrl: "https://open.spotify.com",
        recapPhotos: [
          { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", caption: "Packed Sweatbox", credit: "@sydney_gig_lens" },
          { url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", caption: "Stage Diving in Encore", credit: "@indie_rock_syd" }
        ],
        asPlayedSetlist: [
          { name: "Friday I'm in Love (The Cure)", tag: "Opener", duration: "3:35" },
          { name: "Undone - The Sweater Song (Weezer)", tag: "Heavy Jam", duration: "5:05" },
          { name: "Babyshambles (Pulp)", tag: "Crowd Surge", duration: "4:15" },
          { name: "Boys Don't Cry (The Cure)", tag: "Encore", duration: "3:10", hasSnippet: true }
        ],
        highlightsAndTrivia: [
          "Sold out within 2 hours of announcement.",
          "Crowd decibel level broke venue summer record.",
          "Stage diving during the encore!"
        ],
        pastVenueHistory: [
          { date: "Jul 18, 2026", tourName: "Winter Headline" },
          { date: "Oct 14, 2024", tourName: "First Sydney Headline" }
        ]
      }
    ]
  },
  {
    id: "venue-metro",
    name: "Metro Theatre",
    city: "Sydney CBD, NSW",
    address: "624 George St, Sydney NSW 2000",
    region: "sydney",
    lat: -33.8762,
    lng: 151.2064,
    rating: "4.9 ★",
    capacity: "1,100 Cap",
    amenities: [
      { icon: "fa-train-subway", label: "Town Hall Station" },
      { icon: "fa-wheelchair", label: "Accessible" },
      { icon: "fa-martini-glass-citrus", label: "Full Bar" },
      { icon: "fa-vest", label: "Cloakroom" },
      { icon: "fa-shirt", label: "Merch Booth" }
    ],
    venueAndFood: {
      venueDesc: "Sydney's premier heritage live music venue featuring multi-tiered viewing and world-class sound rig.",
      transitDesc: "2 min walk from Town Hall Station. Light Rail directly outside on George St.",
      foodRecommendation: "Late-night ramen in Chinatown or Spanish tapas on Liverpool St right around the corner."
    },
    shows: [
      {
        id: "gig-sydney-metro",
        venueId: "venue-metro",
        venue: "Metro Theatre",
        city: "Sydney CBD, NSW",
        address: "624 George St, Sydney NSW 2000",
        region: "sydney",
        lat: -33.8762,
        lng: 151.2064,
        type: "upcoming",
        isNextShow: false,
        dateText: "Fri, Sep 12, 2026",
        timeText: "Doors: 7:00 PM • Kins on stage: 8:45 PM",
        targetDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
        rating: "4.9 ★",
        capacity: "1,100 Cap",
        ticketPrice: "$22 + BF",
        ticketStatus: "available",
        ageLimit: "18+ Event",
        ticketUrl: "https://www.bandsintown.com",
        supportActs: "Velvet Bloom & Midnight Echoes",
        snapshot: {
          vibe: "Sydney CBD Headline Showcase / Legendary Acoustic Heritage Soundstage",
          highlight: "Special guest vocalists joining for 90s alt-rock anthems & full light show."
        },
        setlistDetails: {
          songs: [
            { name: "Boys Don't Cry (The Cure)", tag: "Upbeat", duration: "2:40", genre: "Post-Punk" },
            { name: "Buddy Holly (Weezer)", tag: "Crowd Singalong", duration: "2:40", genre: "Power Pop" },
            { name: "Disco 2000 (Pulp)", tag: "Groove", duration: "4:33", genre: "Britpop" },
            { name: "Cadillac (The Long Faces)", tag: "Cover Special", duration: "3:30", genre: "Art Rock" },
            { name: "Just Like Heaven (The Cure)", tag: "Encore", duration: "3:32", genre: "Classic" }
          ]
        }
      },
      {
        id: "gig-metro-archive-1",
        venueId: "venue-metro",
        venue: "Metro Theatre",
        city: "Sydney CBD, NSW",
        address: "624 George St, Sydney NSW 2000",
        region: "sydney",
        lat: -33.8762,
        lng: 151.2064,
        type: "past",
        isNextShow: false,
        dateText: "Fri, Nov 21, 2025",
        timeText: "EP Launch Showcase",
        rating: "4.9 ★",
        capacity: "1,100 Cap",
        ticketPrice: "$20 Door",
        ticketStatus: "archived",
        ageLimit: "18+ Event",
        supportActs: "Royel Otis Tribute & Local Sydney Acts",
        snapshot: {
          vibe: "Epic Mainstage Production / Laser Visuals & Heavy Guitars",
          highlight: "Debut EP showcase performed to a thunderous standing ovation."
        },
        setlistDetails: {
          songs: [
            { name: "Pictures of You (The Cure)", tag: "Opener", duration: "4:20", genre: "Post-Punk" },
            { name: "Say It Ain't So (Weezer)", tag: "Heavy Jams", duration: "4:18", genre: "Alt-Rock" },
            { name: "Jane (The Long Faces)", tag: "Art Rock", duration: "3:45", genre: "Deep Cut" },
            { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", genre: "Power Jam" }
          ],
          audioRecording: "24-bit / 96kHz Multitrack Live Soundboard Desk Master.",
          stageNotes: "Full tiered floor was bouncing in unison during the Weezer guitar solos."
        },
        crowdAndGallery: {
          energyScore: "9.7/10 Roaring Mainstage",
          fanQuote: "“The sound clarity and guitar tones at Metro were absolutely stadium grade.” — FasterLouder",
          photos: [
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
          ]
        }
      }
    ]
  },
  {
    id: "venue-oaf",
    name: "Oxford Art Factory",
    city: "Darlinghurst, Sydney NSW",
    address: "38-46 Oxford St, Darlinghurst NSW 2010",
    region: "sydney",
    lat: -33.8785,
    lng: 151.2140,
    rating: "4.9 ★",
    capacity: "500 Cap",
    amenities: [
      { icon: "fa-palette", label: "Art Showcase" },
      { icon: "fa-beer-mug-empty", label: "Two Craft Bars" },
      { icon: "fa-bus", label: "Oxford St Buses" },
      { icon: "fa-volume-high", label: "Acoustic Tuning" }
    ],
    venueAndFood: {
      venueDesc: "Iconic underground Darlinghurst arts & live music venue with dual rooms and immersive lighting.",
      transitDesc: "5 min walk from Museum Station or any Oxford St bus stop.",
      foodRecommendation: "Grab gourmet burgers at Mister Gee or cocktails at The Cliff Dive post-show."
    },
    shows: [
      {
        id: "gig-sydney-oaf",
        venueId: "venue-oaf",
        venue: "Oxford Art Factory",
        city: "Darlinghurst, Sydney",
        address: "38-46 Oxford St, Darlinghurst NSW 2010",
        region: "sydney",
        lat: -33.8785,
        lng: 151.2140,
        type: "past",
        isNextShow: false,
        dateText: "Sat, Apr 11, 2026",
        timeText: "Indie Rock Gala Showcase",
        rating: "4.9 ★",
        capacity: "500 Cap (Sold Out)",
        ticketPrice: "$18 Pre-sale",
        ticketStatus: "archived",
        ageLimit: "18+ Event",
        supportActs: "Sunroom Sounds & Velvet Bloom",
        snapshot: {
          vibe: "Underground Art & Rock Fusion / Glowing Neon Visuals",
          highlight: "Special dual-guitar jam with guest musicians under neon light art."
        },
        setlistDetails: {
          songs: [
            { name: "Friday I'm in Love (The Cure)", tag: "Opener", duration: "3:35", genre: "Post-Punk" },
            { name: "Hash Pipe (Weezer)", tag: "Heavy Energy", duration: "3:06", genre: "Alt-Rock" },
            { name: "Common People (Pulp)", tag: "Dance Anthem", duration: "4:10", genre: "Britpop" },
            { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", genre: "Power Jam" }
          ],
          audioRecording: "Stereo Desk Master + Ambient Room Microphones.",
          stageNotes: "Underground room hit max capacity 20 mins before stage time."
        },
        crowdAndGallery: {
          energyScore: "9.8/10 Neon Underground",
          fanQuote: "“Oxford Art Factory has never sounded crisper. Kins tore down the roof!” — Sydney Music Scene",
          photos: [
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80"
          ]
        }
      }
    ]
  },
  {
    id: "venue-manning",
    name: "Manning Bar",
    city: "Camperdown, Sydney NSW",
    address: "Manning Rd, University of Sydney, Camperdown NSW 2006",
    region: "sydney",
    lat: -33.8885,
    lng: 151.1890,
    rating: "4.8 ★",
    capacity: "950 Cap",
    amenities: [
      { icon: "fa-wheelchair", label: "Accessible" },
      { icon: "fa-martini-glass-citrus", label: "Full Bar" },
      { icon: "fa-bus", label: "Near Bus Stop" },
      { icon: "fa-tree", label: "Open Balcony" }
    ],
    venueAndFood: {
      venueDesc: "Spacious multi-level uni venue with stellar balcony views and great acoustic soundstage.",
      transitDesc: "Buses along Parramatta Rd / City Rd. 10 min walk to Redfern Station.",
      foodRecommendation: "Hit up Newtown's King Street for Thai or artisan burgers before doors open."
    },
    shows: [
      {
        id: "gig-sydney-manning",
        venueId: "venue-manning",
        venue: "Manning Bar",
        city: "Camperdown, Sydney",
        address: "Manning Rd, University of Sydney, Camperdown NSW 2006",
        region: "sydney",
        lat: -33.8885,
        lng: 151.1890,
        type: "upcoming",
        isNextShow: false,
        dateText: "Sat, Oct 03, 2026",
        timeText: "Doors: 7:30 PM • Kins on stage: 9:00 PM",
        targetDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        rating: "4.8 ★",
        capacity: "950 Cap",
        ticketPrice: "$18 Student / $25 GA",
        ticketStatus: "available",
        ageLimit: "Lic / All Ages (AA)",
        ticketUrl: "https://www.bandsintown.com",
        supportActs: "Royel Otis Tribute & Sunroom Sounds",
        snapshot: {
          vibe: "Spring Campus Indie Fest / Outdoor Courtyard Pre-Party",
          highlight: "Co-headlining indie festival with student entry discounts & outdoor deck bar."
        },
        setlistDetails: {
          songs: [
            { name: "Friday I'm in Love (The Cure)", tag: "Opener", duration: "3:35", genre: "Post-Punk" },
            { name: "Hash Pipe (Weezer)", tag: "Heavy Energy", duration: "3:06", genre: "Alt-Rock" },
            { name: "Sorted for E's & Wizz (Pulp)", tag: "Synth Groove", duration: "3:40", genre: "Britpop" },
            { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", genre: "Power Jam" }
          ]
        }
      }
    ]
  },
  {
    id: "venue-lass",
    name: "The Lass O'Gowrie",
    city: "Wickham, Newcastle NSW",
    address: "Railway St, Wickham NSW 2293",
    region: "newcastle",
    lat: -32.9230,
    lng: 151.7510,
    rating: "4.9 ★",
    capacity: "250 Cap",
    amenities: [
      { icon: "fa-tree", label: "Beer Garden" },
      { icon: "fa-dog", label: "Dog Friendly" },
      { icon: "fa-burger", label: "Smoked Brisket" },
      { icon: "fa-wine-glass", label: "Natural Wines" }
    ],
    venueAndFood: {
      venueDesc: "Classic Wickham pub known for arts, local band residency, and cozy outdoor beer garden.",
      transitDesc: "4 min walk from Newcastle Interchange station.",
      foodRecommendation: "Smoked brisket tacos & waffle fries at the Lass pub kitchen."
    },
    shows: [
      {
        id: "gig-newcastle-past-1",
        venueId: "venue-lass",
        venue: "The Lass O'Gowrie",
        city: "Wickham, Newcastle",
        address: "Railway St, Wickham NSW 2293",
        region: "newcastle",
        lat: -32.9230,
        lng: 151.7510,
        type: "past",
        isNextShow: false,
        dateText: "Fri, Jun 05, 2026",
        timeText: "Past Summer Session",
        rating: "4.9 ★",
        capacity: "250 Cap",
        ticketPrice: "Free Entry (Passed Hat)",
        ticketStatus: "archived",
        ageLimit: "18+ Event",
        supportActs: "Local Hunter Valley Songwriters",
        snapshot: {
          vibe: "Underground Newcastle Scene / Summer Night Garden Session",
          highlight: "Acoustic intro into full power band set under fairy lights and string lamps."
        },
        setlistDetails: {
          songs: [
            { name: "Just Like Heaven (The Cure)", tag: "Summer Vibe", duration: "3:32", genre: "Post-Punk" },
            { name: "Island in the Sun (Weezer)", tag: "Chill Jam", duration: "3:20", genre: "Alt-Rock" },
            { name: "Common People (Pulp)", tag: "Crowd Singalong", duration: "4:10", genre: "Britpop" }
          ],
          audioRecording: "Live Stereo Desk Record + Ambient Crowd Microphones.",
          stageNotes: "Beer garden was packed to capacity with fans singing every chorus back to us."
        },
        crowdAndGallery: {
          energyScore: "9.5/10 Cozy & Loud",
          fanQuote: "“Hearing 'Just Like Heaven' under the string lights in Wickham was magic.” — Newcastle Herald Music",
          photos: [
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80"
          ]
        }
      }
    ]
  },
  {
    id: "venue-king-st",
    name: "King Street Bandroom",
    city: "Newcastle CBD, NSW",
    address: "15 Steel St, Newcastle NSW 2300",
    region: "newcastle",
    lat: -32.9278,
    lng: 151.7640,
    rating: "4.9 ★",
    capacity: "450 Cap",
    amenities: [
      { icon: "fa-volume-high", label: "Huge Sub Bass" },
      { icon: "fa-beer-mug-empty", label: "Two Bars" },
      { icon: "fa-train-tram", label: "Light Rail Stop" },
      { icon: "fa-square-parking", label: "Multi-Deck Parking" }
    ],
    venueAndFood: {
      venueDesc: "Newcastle CBD's dedicated multi-level bandroom with booming subs and dual bars.",
      transitDesc: "Steel St Light Rail stop directly adjacent to the venue entrance.",
      foodRecommendation: "Grab street tacos or late-night burgers along King Street."
    },
    shows: [
      {
        id: "gig-newcastle-past-2",
        venueId: "venue-king-st",
        venue: "King Street Bandroom",
        city: "Newcastle CBD, NSW",
        address: "15 Steel St, Newcastle NSW 2300",
        region: "newcastle",
        lat: -32.9278,
        lng: 151.7640,
        type: "past",
        isNextShow: false,
        dateText: "Fri, May 15, 2026",
        timeText: "Packed House Show",
        rating: "4.9 ★",
        capacity: "450 Cap",
        ticketPrice: "$12 Door",
        ticketStatus: "archived",
        ageLimit: "18+ Event",
        supportActs: "Newcastle Rock Collective",
        snapshot: {
          vibe: "Massive Bass & High Voltage Electric Rock Set",
          highlight: "Triple encore demanded by the crowd after Foo Fighters cover."
        },
        setlistDetails: {
          songs: [
            { name: "Say It Ain't So (Weezer)", tag: "Opener", duration: "4:18", genre: "Alt-Rock" },
            { name: "Pictures of You (The Cure)", tag: "Atmospheric", duration: "4:20", genre: "Post-Punk" },
            { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", genre: "Power Jam" }
          ],
          audioRecording: "Direct Multitrack Live Desk Recording in Master Flac.",
          stageNotes: "Full sound system was shaking the room. Crowd demanded 3 separate encores before curfew."
        },
        crowdAndGallery: {
          energyScore: "9.8/10 Wall-to-Wall Energy",
          fanQuote: "“Kins shook the entire building from the first guitar riff.” — Live Newcastle",
          photos: [
            "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80"
          ]
        }
      }
    ]
  }
];

// Flat array of all individual gig instances for backward compatibility
export const LOCAL_GIGS = VENUES.flatMap(v => v.shows.map(s => ({
  ...s,
  amenities: v.amenities,
  venueAndFood: v.venueAndFood,
  venueRating: v.rating,
  venueCapacity: v.capacity
})));

// NSW Tour Corridor Polyline coordinates (Newcastle -> Central Coast -> Sydney)
const TOUR_CORRIDOR_PATH = [
  [-32.9265, 151.7675], // The Cambridge Hotel (Newcastle)
  [-32.9230, 151.7510], // The Lass O'Gowrie (Wickham)
  [-32.9278, 151.7640], // King Street Bandroom
  [-33.0000, 151.6500], // Lake Macquarie
  [-33.2800, 151.4200], // Tuggerah / Wyong
  [-33.4300, 151.3400], // Gosford (Central Coast)
  [-33.6000, 151.2000], // Hawkesbury River
  [-33.8000, 151.1800], // Sydney North
  [-33.8762, 151.2064], // Metro Theatre (Sydney CBD)
  [-33.8785, 151.2140], // Oxford Art Factory (Darlinghurst)
  [-33.8845, 151.1985], // The Lansdowne Hotel
  [-33.8885, 151.1890]  // Manning Bar
];

// Coastal Polygon for the Hunter / Sydney catchment
const COASTAL_LAND_POLYGON = [
  [-32.73, 151.55],
  [-32.88, 151.72],
  [-32.93, 151.78],
  [-33.08, 151.65],
  [-33.30, 151.50],
  [-33.58, 151.32],
  [-33.85, 151.28],
  [-34.05, 151.15],
  [-34.05, 150.85],
  [-33.75, 150.68],
  [-33.35, 151.10],
  [-32.80, 151.25]
];

let leafletMapInstance = null;
let tourPolylineInstance = null;
let regionPolygonInstance = null;
let activeRoutePolyline = null;
let userLocationMarker = null;
let countdownInterval = null;
let activeVenueId = "venue-cambridge";
let activeGigId = "gig-newcastle-1";
let activeFilter = "all";
let userLocation = null;
const markerMap = new Map();

export let currentSnapState = 'peek'; // 'peek' | 'mid' | 'expanded'

// Calculate dynamic pixel snap heights relative to current viewport
export function getSnapHeights() {
  const vh = window.innerHeight;
  return {
    peek: 136,
    mid: Math.round(vh * 0.50),
    expanded: Math.round(vh * 0.94)
  };
}

// Set bottom sheet snap state with smooth animation and accessibility ARIA sync
export function setSnapState(targetState, options = { animate: true, autoPanMap: true }) {
  const venueDetailCard = document.getElementById('venueDetailBottomCard');
  if (!venueDetailCard) return;

  currentSnapState = targetState;
  venueDetailCard.classList.remove('is-dragging');
  venueDetailCard.classList.remove('is-peek', 'is-mid', 'is-expanded');
  venueDetailCard.classList.add(`is-${targetState}`);
  venueDetailCard.setAttribute('data-snap-state', targetState);
  venueDetailCard.setAttribute('aria-expanded', targetState === 'expanded' ? 'true' : 'false');

  // Clean inline height style to let CSS classes take control
  venueDetailCard.style.height = '';

  // If collapsing to peek, reset inner scroll position
  if (targetState === 'peek') {
    venueDetailCard.scrollTo({ top: 0, behavior: 'smooth' });
    venueDetailCard.scrollTop = 0;
  }

  // Auto-pan Leaflet map so the active venue marker is positioned comfortably in remaining visible map
  if (options.autoPanMap && leafletMapInstance && activeVenueId) {
    const activeVenue = VENUES.find(v => v.id === activeVenueId);
    if (activeVenue) {
      const isDesktop = window.innerWidth >= 768;
      if (!isDesktop) {
        // On mobile, apply vertical latitude offset based on sheet coverage
        const latOffset = targetState === 'expanded' ? 0.045 : (targetState === 'mid' ? 0.018 : 0.006);
        leafletMapInstance.panTo([activeVenue.lat - latOffset, activeVenue.lng], {
          animate: true,
          duration: 0.4
        });
      }
    }
  }

  setTimeout(() => {
    if (leafletMapInstance) leafletMapInstance.invalidateSize();
  }, 360);
}

// Cycle to next higher state or toggle back to peek
export function cycleSheetState() {
  if (currentSnapState === 'peek') {
    setSnapState('mid');
  } else if (currentSnapState === 'mid') {
    setSnapState('expanded');
  } else {
    setSnapState('peek');
  }
}

export function stepUpSheetState() {
  if (currentSnapState === 'peek') setSnapState('mid');
  else if (currentSnapState === 'mid') setSnapState('expanded');
}

export function stepDownSheetState() {
  if (currentSnapState === 'expanded') setSnapState('mid');
  else if (currentSnapState === 'mid') setSnapState('peek');
}

// Helper to find venue and show
export function findVenueAndShow(targetId) {
  if (!targetId) {
    const defaultVenue = VENUES[0];
    const defaultShow = defaultVenue.shows.find(s => s.isNextShow) || defaultVenue.shows[0];
    return { venue: defaultVenue, show: defaultShow };
  }

  // Check if targetId is a Venue ID
  const venueById = VENUES.find(v => v.id === targetId);
  if (venueById) {
    const show = venueById.shows.find(s => s.isNextShow) || venueById.shows.find(s => s.type === 'upcoming') || venueById.shows[0];
    return { venue: venueById, show };
  }

  // Check if targetId is a Gig ID
  for (const v of VENUES) {
    const show = v.shows.find(s => s.id === targetId);
    if (show) {
      return { venue: v, show };
    }
  }

  return { venue: VENUES[0], show: VENUES[0].shows[0] };
}

// Generate high-density popup HTML with zero negative space and multi-show preview
function buildPopupHtml(venue, activeShow) {
  const show = activeShow || venue.shows.find(s => s.isNextShow) || venue.shows[0];
  const isUpcoming = show.type === 'upcoming';
  const isNext = show.isNextShow;
  const showCount = venue.shows.length;
  
  let distHtml = "";
  if (userLocation) {
    const d = calculateDistanceKm(userLocation.lat, userLocation.lng, venue.lat, venue.lng);
    distHtml = `<span class="map-popup-distance-tag"><i class="fa-solid fa-location-arrow"></i> ${d} km</span>`;
  }

  let badgeText = isNext ? '🔥 NEXT GIG' : (isUpcoming ? '🎟️ UPCOMING' : '📼 ARCHIVE');
  if (showCount > 1) {
    badgeText = `${badgeText} • ${showCount} SHOWS`;
  }

  return `
    <div class="map-popup-card">
      <div class="map-popup-header-row">
        <span class="map-popup-badge ${isNext ? 'badge-next' : (isUpcoming ? 'badge-upcoming' : 'badge-past')}">
          ${badgeText}
        </span>
        <span class="map-popup-rating"><i class="fa-solid fa-star"></i> ${venue.rating}</span>
      </div>
      <h4 class="map-popup-title" title="${venue.name}">${venue.name}</h4>
      <div class="map-popup-meta">
        <span><i class="fa-solid fa-location-dot"></i> ${venue.city.split(',')[0]}</span>
        ${distHtml}
      </div>
      <div class="map-popup-dates-summary">
        <span class="map-popup-date-preview"><i class="fa-regular fa-calendar"></i> ${show.dateText}</span>
      </div>
      <div class="map-popup-actions">
        <button type="button" class="map-popup-btn map-popup-action-btn" data-popup-venue-id="${venue.id}" data-popup-gig-id="${show.id}" title="View setlist and timeline">
          <i class="fa-solid fa-circle-info"></i> Details
        </button>
        <button type="button" class="map-popup-btn btn-route map-popup-route-btn" data-route-venue-id="${venue.id}" data-route-gig-id="${show.id}" title="Get directions from current location">
          <i class="fa-solid fa-diamond-turn-right"></i> Route
        </button>
      </div>
    </div>
  `;
}

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function updateCountdownTimer(targetDate) {
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  if (countdownInterval) clearInterval(countdownInterval);

  function tick() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMins) cdMins.textContent = '00';
      if (cdSecs) cdSecs.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(d).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(h).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(m).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(s).padStart(2, '0');
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

function updateSetlistPlaybackState(currentTrack, isPlaying) {
  const setlistRows = document.querySelectorAll('.setlist-item-row');
  setlistRows.forEach(row => {
    const songFullName = row.getAttribute('data-song-fullname') || '';
    const icon = row.querySelector('.setlist-play-icon');
    
    let isMatch = false;
    if (currentTrack && currentTrack.title) {
      const cleanName = songFullName.replace(/\(.*\)/, '').trim().toLowerCase();
      const playingTitle = currentTrack.title.toLowerCase();
      if (cleanName.includes(playingTitle) || playingTitle.includes(cleanName)) {
        isMatch = true;
      }
    }

    if (isMatch && isPlaying) {
      row.classList.add('is-playing');
      if (icon) {
        icon.className = 'fa-solid fa-pause setlist-play-icon';
      }
    } else {
      row.classList.remove('is-playing');
      if (icon) {
        icon.className = 'fa-solid fa-play setlist-play-icon';
      }
    }
  });
}

window.addEventListener('trackPlaybackStateChanged', (e) => {
  const { track, isPlaying } = e.detail || {};
  updateSetlistPlaybackState(track, isPlaying);
});

function parseSetlistTrackInfo(fullName) {
  let title = fullName.replace(/\(.*\)/, '').trim();
  let artist = "Kins";
  if (fullName.includes('(The Cure)')) artist = "The Cure";
  else if (fullName.includes('(Weezer)')) artist = "Weezer";
  else if (fullName.includes('(The Long Faces)')) artist = "The Long Faces";
  else if (fullName.includes('(Foo Fighters)')) artist = "Foo Fighters";
  else if (fullName.includes('(Pulp)')) artist = "Pulp";
  return { title, artist };
}

// Generate Google Calendar Link
function getGoogleCalendarUrl(gig) {
  if (!gig.targetDate) return "#";
  const start = new Date(gig.targetDate);
  const end = new Date(start.getTime() + 3.5 * 60 * 60 * 1000); // 3.5 hours show

  const formatCalDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const title = encodeURIComponent(`Kins Live at ${gig.venue}`);
  const details = encodeURIComponent(`Kins Live in Concert!\nVenue: ${gig.venue}\nAddress: ${gig.address}\nTimes: ${gig.timeText}\nTickets: ${gig.ticketUrl || 'https://www.bandsintown.com'}`);
  const location = encodeURIComponent(`${gig.venue}, ${gig.address}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalDate(start)}/${formatCalDate(end)}&details=${details}&location=${location}`;
}

// Generate and trigger iCal .ics download
function downloadIcsFile(gig) {
  if (!gig.targetDate) return;
  const start = new Date(gig.targetDate);
  const end = new Date(start.getTime() + 3.5 * 60 * 60 * 1000);
  const formatIcsDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kins Band//Live Concert//EN",
    "BEGIN:VEVENT",
    `UID:${gig.id}-${Date.now()}@kinsband.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Kins Live at ${gig.venue}`,
    `DESCRIPTION:Kins Live Concert\\nVenue: ${gig.venue}\\nTimes: ${gig.timeText}\\nTickets: ${gig.ticketUrl || 'https://www.bandsintown.com'}`,
    `LOCATION:${gig.venue}, ${gig.address}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `kins-live-${gig.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`📅 Calendar event downloaded for ${gig.venue}!`);
}

function openPhotoLightbox(imgSrc, caption) {
  const lightbox = document.getElementById('gigPhotoLightbox');
  const lightboxImg = document.getElementById('gigLightboxImg');
  const lightboxCaption = document.getElementById('gigLightboxCaption');
  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = imgSrc;
  if (lightboxCaption) lightboxCaption.textContent = caption || "Fan Concert Photo • Kins Live";
  lightbox.classList.add('active');
}

function closePhotoLightbox() {
  const lightbox = document.getElementById('gigPhotoLightbox');
  if (lightbox) lightbox.classList.remove('active');
}

// Render multi-show timeline tabs inside venue detail card
function renderVenueEditionTimeline(venue, activeShow) {
  const timelineBar = document.getElementById('venueEditionTimelineBar');
  const timelinePills = document.getElementById('timelineBarPills');
  if (!timelineBar || !timelinePills) return;

  if (!venue || !venue.shows || venue.shows.length <= 1) {
    timelineBar.classList.add('hidden');
    timelinePills.innerHTML = '';
    return;
  }

  timelineBar.classList.remove('hidden');
  timelinePills.innerHTML = venue.shows.map(s => {
    const isAct = s.id === activeShow.id;
    const isUp = s.type === 'upcoming';
    const isNext = s.isNextShow;
    const iconClass = isNext ? 'fa-fire' : (isUp ? 'fa-ticket' : 'fa-compact-disc');
    const badgeText = isNext ? 'NEXT SHOW' : (isUp ? 'UPCOMING' : 'ARCHIVE');

    return `
      <button type="button" class="venue-edition-tab ${isAct ? 'active' : ''} ${isUp ? 'is-upcoming' : 'is-past'}" data-show-id="${s.id}" aria-label="Show on ${s.dateText}">
        <i class="fa-solid ${iconClass}"></i>
        <span class="edition-date">${s.dateText}</span>
        <span class="edition-status-badge">${badgeText}</span>
      </button>
    `;
  }).join('');

  timelinePills.querySelectorAll('.venue-edition-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const showId = btn.getAttribute('data-show-id');
      const targetShow = venue.shows.find(s => s.id === showId);
      if (targetShow) {
        displayVenueDetails(venue, targetShow);
      }
    });
  });
}

// Display venue & show details in the bottom card
export function displayVenueDetails(targetVenueOrGig, specificShow) {
  const venueNameEl = document.getElementById('venueCardName');
  const venueLocationEl = document.getElementById('venueCardLocation');
  const venuePeekDate = document.getElementById('venuePeekDate');
  const venueUrgencyPill = document.getElementById('venueUrgencyPill');
  const venueBookingBtn = document.getElementById('venueBookingBtn');
  const venueBookingBtnText = document.getElementById('venueBookingBtnText');
  const quickInfoRow = document.getElementById('venueQuickInfoRow');
  const venueDirectionsBtn = document.getElementById('venueDirectionsBtn');
  const venueCalendarBtn = document.getElementById('venueCalendarBtn');
  const venueShareBtn = document.getElementById('venueShareBtn');
  const richBreakdown = document.getElementById('richShowBreakdown');
  const venueAddressEl = document.getElementById('venueAddressLine');
  const amenitiesRow = document.getElementById('venueAmenitiesRow');
  const transitNoteEl = document.getElementById('venueTransitNote');

  if (!targetVenueOrGig) {
    if (venueNameEl) venueNameEl.textContent = "No Scheduled Shows Found";
    if (venueLocationEl) venueLocationEl.textContent = "Newcastle & Sydney Region";
    if (venuePeekDate) venuePeekDate.textContent = "Check Back Soon";
    if (venueUrgencyPill) venueUrgencyPill.classList.add('hidden');
    if (venueBookingBtn) venueBookingBtn.style.display = "none";
    if (quickInfoRow) quickInfoRow.innerHTML = "";
    if (richBreakdown) {
      richBreakdown.innerHTML = `
        <div class="show-section-card" style="text-align: center; padding: 32px 16px;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
          <h4 style="font-family: var(--font-heading); color: var(--text-white); font-size: 1.05rem; margin-bottom: 8px;">No Shows Match This Filter</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); max-width: 320px; margin: 0 auto 16px auto;">Try selecting 'All Shows' to explore the full tour route across Sydney and Newcastle.</p>
        </div>
      `;
    }
    renderVenueEditionTimeline(null, null);
    return;
  }

  // Resolve venue and show
  let venue, show;
  if (targetVenueOrGig.shows && Array.isArray(targetVenueOrGig.shows)) {
    venue = targetVenueOrGig;
    show = specificShow || (activeFilter === 'past' 
      ? (venue.shows.find(s => s.type === 'past') || venue.shows[0])
      : (venue.shows.find(s => s.isNextShow) || venue.shows.find(s => s.type === 'upcoming') || venue.shows[0]));
  } else {
    const pair = findVenueAndShow(targetVenueOrGig.id);
    venue = pair.venue;
    show = specificShow || targetVenueOrGig;
  }

  activeVenueId = venue.id;
  activeGigId = show.id;
  const isUpcoming = show.type === 'upcoming';

  // 1. Venue Title, Location & Date
  if (venueNameEl) venueNameEl.textContent = venue.name;
  if (venueLocationEl) venueLocationEl.textContent = venue.city.split(',')[0].trim();
  if (venuePeekDate) venuePeekDate.textContent = show.dateText;

  // 2. Badges: Urgency Pill (Upcoming) vs Archive Badge (Past)
  const venueArchiveBadge = document.getElementById('venueArchiveBadge');
  if (venueUrgencyPill) {
    if (isUpcoming && show.urgencyBadgeText) {
      venueUrgencyPill.innerHTML = `<i class="fa-solid fa-fire"></i> ${show.urgencyBadgeText.replace('🔥', '').trim()}`;
      venueUrgencyPill.classList.remove('hidden');
    } else {
      venueUrgencyPill.classList.add('hidden');
    }
  }

  if (venueArchiveBadge) {
    if (!isUpcoming) {
      venueArchiveBadge.classList.remove('hidden');
    } else {
      venueArchiveBadge.classList.add('hidden');
    }
  }

  // 3. Primary Full-Width CTA
  const venueCheckinBtn = document.getElementById('venueCheckinBtn');
  const venueCheckinBtnText = document.getElementById('venueCheckinBtnText');

  if (isUpcoming) {
    if (venueBookingBtn) {
      venueBookingBtn.style.display = "flex";
      const isSellingFast = show.ticketStatus === 'selling_fast';
      venueBookingBtn.className = `venue-booking-btn ${isSellingFast ? 'is-selling-fast' : ''}`;
      const priceTag = show.ticketPriceLabel || show.ticketPrice || '$15 (EARLY BIRD)';
      venueBookingBtn.innerHTML = `<i class="fa-solid fa-bolt"></i><span>GET TICKETS — ${priceTag}</span>`;
      venueBookingBtn.href = show.ticketUrl || "https://www.bandsintown.com";
      venueBookingBtn.target = "_blank";
    }
    if (venueCheckinBtn) venueCheckinBtn.classList.add('hidden');
  } else {
    if (venueBookingBtn) venueBookingBtn.style.display = "none";
    if (venueCheckinBtn) {
      venueCheckinBtn.classList.remove('hidden');
      const updateCheckinUI = () => {
        const count = (show.attendanceCount || 340) + (show.hasUserCheckedIn ? 1 : 0);
        if (show.hasUserCheckedIn) {
          venueCheckinBtn.className = "venue-checkin-btn is-checked-in";
          if (venueCheckinBtnText) venueCheckinBtnText.textContent = `CHECKED IN! • YOU ATTENDED THIS SHOW (${count} FANS)`;
          venueCheckinBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>CHECKED IN! • YOU ATTENDED THIS SHOW (${count} FANS)</span>`;
        } else {
          venueCheckinBtn.className = "venue-checkin-btn";
          if (venueCheckinBtnText) venueCheckinBtnText.textContent = `${count} FANS ATTENDED • "I WAS THERE" (CHECK IN)`;
          venueCheckinBtn.innerHTML = `<i class="fa-solid fa-ticket"></i><span>${count} FANS ATTENDED • "I WAS THERE" (CHECK IN)</span>`;
        }
      };
      updateCheckinUI();

      venueCheckinBtn.onclick = (e) => {
        e.preventDefault();
        show.hasUserCheckedIn = !show.hasUserCheckedIn;
        updateCheckinUI();
        if (show.hasUserCheckedIn) {
          showToast(`🎟️ Checked in to ${venue.name}! Added to your tour passport.`);
        } else {
          showToast(`Removed check-in for ${venue.name}`);
        }
      };
    }
  }

  // Build unified chronological history of all shows at this venue (most recent on top)
  const venueHistoryItems = [];
  (venue.shows || []).forEach(s => {
    venueHistoryItems.push({
      id: s.id,
      dateText: s.dateText,
      tourTitle: s.tourName || s.timeText || (s.type === 'upcoming' ? 'Headline Tour 2026' : 'Soundboard Tape Recorded'),
      type: s.type,
      isNextShow: s.isNextShow,
      sortDate: s.targetDate ? new Date(s.targetDate).getTime() : (s.type === 'upcoming' ? Date.now() + 10000000000 : (Date.parse(s.dateText.replace('Played ', '').replace('Sat, ', '')) || 0))
    });
  });

  if (show.pastVenueHistory && Array.isArray(show.pastVenueHistory)) {
    show.pastVenueHistory.forEach(h => {
      const alreadyExists = venueHistoryItems.some(item => item.dateText.includes(h.date) || h.date.includes(item.dateText));
      if (!alreadyExists) {
        venueHistoryItems.push({
          id: null,
          dateText: h.date,
          tourTitle: h.tourName,
          type: 'past',
          isNextShow: false,
          sortDate: Date.parse(h.date) || 0
        });
      }
    });
  }

  venueHistoryItems.sort((a, b) => b.sortDate - a.sortDate);

  // 4. Render Dynamic Body Content for Upcoming vs Archived
  const venueDynamicBody = document.getElementById('venueDynamicBody');
  if (venueDynamicBody) {
    if (isUpcoming) {
      // UPCOMING GIG SECTIONS
      const originParam = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : '';
      const directionsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(venue.name + ', ' + venue.address)}`;
      const googleCalUrl = getGoogleCalendarUrl(show);

      venueDynamicBody.innerHTML = `
        <!-- Mid-State Logistics Section (Tier 2 View) -->
        <div class="venue-quick-info-row">
          <span class="quick-chip"><i class="fa-regular fa-clock"></i> Doors ${show.doorsTime || '7:00 PM'}</span>
          <span class="quick-chip"><i class="fa-solid fa-id-card"></i> ${show.ageLimit || '18+'}</span>
          <span class="quick-chip"><i class="fa-solid fa-users"></i> ${show.capacity || '500'} Cap</span>
        </div>

        <!-- Redesigned Quick Action Row -->
        <div class="venue-action-chips-row">
          <a href="${directionsUrl}" target="_blank" rel="noopener" class="venue-action-chip-btn" id="venueDirectionsAction" aria-label="Directions to venue">
            <i class="fa-solid fa-diamond-turn-right"></i>
            <span>Navigate</span>
          </a>
          <button type="button" class="venue-action-chip-btn" id="venueCalendarAction" aria-label="Add show to calendar">
            <i class="fa-regular fa-calendar-plus"></i>
            <span>+Calendar</span>
          </button>
          <button type="button" class="venue-action-chip-btn" id="venueShareAction" aria-label="Share show details">
            <i class="fa-solid fa-arrow-up-from-bracket"></i>
            <span>Share</span>
          </button>
        </div>

        <!-- Enhanced Set Times & Lineup Card (Clean Hierarchy, No Arrows) -->
        <div class="set-times-card">
          <div class="set-times-header-title">
            <i class="fa-solid fa-clock-rotate-left fa-fw"></i> Set Times & Lineup
          </div>
          <div class="set-times-list">
            ${(show.setTimes || [
              { time: "7:00 PM", act: "Doors Open", role: "Doors" },
              { time: "7:30 PM", act: "The Local Openers", role: "Support" },
              { time: "8:45 PM", act: "KINS (Main Set)", role: "Headliner" }
            ]).map(st => `
              <div class="set-time-row">
                <div class="set-time-left">
                  <span class="set-time-pill">${st.time}</span>
                  <span class="set-act-title ${st.role === 'Headliner' ? 'is-headliner' : ''}">${st.act}</span>
                </div>
                <span class="set-role-badge role-${st.role ? st.role.toLowerCase() : 'support'}">${st.role || 'ACT'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Fixed Interactive Bottom Drawer Trigger (Tier 2 Bottom) -->
        <div class="swipe-up-hint-box" id="upcomingSwipeUpTrigger" role="button" tabindex="0" title="Tap or swipe up for full details">
          <i class="fa-solid fa-chevron-up"></i>
          <span>Swipe up for Setlist preview & Song Requests</span>
        </div>

        <!-- FULL STATE ONLY EXTENDED CONTENT (Revealed via swipe-up / CTA tap) -->
        <div class="expanded-only-block" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Section 1: Planned Setlist Preview -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-music fa-fw"></i> Planned Setlist</span>
            </h3>
            <div class="setlist-preview-list">
              ${(show.plannedSetlist || [
                { name: "Pictures of You (The Cure)", tag: "OPENER", duration: "4:20" },
                { name: "Say It Ain't So (Weezer)", tag: "HIGH ENERGY", duration: "4:18" },
                { name: "Common People (Pulp)", tag: "FAN FAVORITE", duration: "4:10" },
                { name: "Jane (The Long Faces)", tag: "DEEP CUT", duration: "3:45" },
                { name: "Everlong (Foo Fighters)", tag: "ENCORE", duration: "4:10" }
              ]).map((t, idx) => `
                <div class="setlist-preview-row" data-track-name="${t.name}">
                  <div class="track-title-wrap">
                    <i class="fa-solid fa-play" style="font-size: 0.65rem; color: #a1a1aa;"></i>
                    <span><strong>${idx + 1}.</strong> ${t.name}</span>
                  </div>
                  <span class="track-tag">[${t.tag || 'LIVE'}]</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Request a Song or Cover -->
          <div class="song-request-card">
            <div class="song-request-header">
              <i class="fa-solid fa-envelope fa-fw"></i> Request a Song or Cover
            </div>
            <p class="song-request-desc">Have a track you want us to play? Let the band know before soundcheck!</p>
            <div class="song-request-form" id="songRequestFormContainer">
              <input type="text" placeholder="e.g. Pictures of You - The Cure" class="song-request-input" id="songRequestInput" />
              <button type="button" class="song-request-submit-btn" id="songRequestSubmitBtn">Submit</button>
            </div>
          </div>

          <!-- Section 3: Venue & Location -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-location-dot fa-fw"></i> Venue & Location</span>
            </h3>
            <div class="venue-travel-card">
              <button type="button" class="copy-address-btn" id="copyVenueAddressBtn" data-address="${venue.address}" title="Click to copy full address">
                <div class="copy-address-text-wrap">
                  <i class="fa-solid fa-location-dot address-icon"></i>
                  <span class="venue-full-address-text">${venue.address}</span>
                </div>
                <span class="copy-address-action-badge">
                  <i class="fa-regular fa-copy"></i>
                  <span>Copy</span>
                </span>
              </button>
              <div class="travel-amenities-pills">
                ${(venue.amenities && Array.isArray(venue.amenities) ? venue.amenities.map(am => typeof am === 'object' ? `<span class="travel-amenity-chip">${am.label || ''}</span>` : `<span class="travel-amenity-chip">${am}</span>`) : ['<span class="travel-amenity-chip">💳 Card-Only Bar</span>', '<span class="travel-amenity-chip">♿ Accessible</span>']).join('')}
              </div>
            </div>
          </div>

          <!-- Section 4: Past Shows at Venue (Chronological History List) -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-clock-rotate-left fa-fw"></i> Past Shows at Venue</span>
              <span class="right-hint">${venueHistoryItems.length} Shows</span>
            </h3>
            <div class="venue-history-list">
              ${venueHistoryItems.map(item => `
                <div class="venue-history-card-row ${item.id === show.id ? 'is-current-active' : ''}" ${item.id ? `data-show-id="${item.id}"` : ''}>
                  <div class="venue-history-row-left">
                    <span class="venue-history-date">${item.dateText}</span>
                    <span class="venue-history-sub">${item.tourTitle}</span>
                  </div>
                  <div class="venue-history-row-right">
                    ${item.isNextShow 
                      ? '<span class="venue-history-badge is-live"><i class="fa-solid fa-bolt"></i> NEXT SHOW</span>'
                      : (item.type === 'upcoming'
                          ? '<span class="venue-history-badge is-upcoming"><i class="fa-solid fa-calendar-check"></i> UPCOMING</span>'
                          : '<span class="venue-history-badge is-past"><i class="fa-solid fa-box-archive"></i> COMPLETED</span>')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tier 3 Bottom Navigation Controls (Back to Top & Back to Map) -->
          <div class="sheet-bottom-nav-row">
            <button type="button" class="sheet-nav-btn is-back-to-top sheet-back-to-top-btn" aria-label="Back to top of gig details">
              <i class="fa-solid fa-arrow-up"></i>
              <span>Back to Top</span>
            </button>
            <button type="button" class="sheet-nav-btn is-back-to-map sheet-back-to-map-btn" aria-label="Back to interactive map">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Back to Map</span>
            </button>
          </div>
        </div>
      `;

      // Wire interactive events for upcoming components
      const dirBtn = document.getElementById('venueDirectionsAction');
      if (dirBtn) {
        dirBtn.onclick = (e) => {
          e.preventDefault();
          calculateAndRenderRoute(venue);
        };
      }

      const copyAddrBtn = document.getElementById('copyVenueAddressBtn');
      if (copyAddrBtn) {
        copyAddrBtn.onclick = () => {
          const addr = copyAddrBtn.getAttribute('data-address') || venue.address;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(addr);
            showToast(`📋 Address copied: ${addr}`);
          } else {
            showToast(`📍 ${addr}`);
          }
        };
      }

      const calBtn = document.getElementById('venueCalendarAction');
      if (calBtn) {
        calBtn.onclick = (e) => {
          e.preventDefault();
          const choice = confirm(`Add "${venue.name}" show to calendar?\n\nClick OK for Google Calendar\nClick Cancel to download .ics (Apple / Outlook)`);
          if (choice) {
            window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
          } else {
            downloadIcsFile(show);
          }
        };
      }

      const shareBtn = document.getElementById('venueShareAction');
      if (shareBtn) {
        shareBtn.onclick = () => triggerShareShow(venue, show);
      }

      const swipeUp = document.getElementById('upcomingSwipeUpTrigger');
      if (swipeUp) {
        swipeUp.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('expanded');
        };
      }

      // Track preview row clicks
      venueDynamicBody.querySelectorAll('.setlist-preview-row').forEach(row => {
        row.addEventListener('click', () => {
          const trackName = row.getAttribute('data-track-name') || '';
          const trackObj = parseSetlistTrackInfo(trackName);
          if (window.playTrackPreview) {
            window.playTrackPreview(trackObj);
          }
        });
      });

      // History row clicks
      venueDynamicBody.querySelectorAll('.venue-history-card-row[data-show-id]').forEach(row => {
        row.addEventListener('click', () => {
          const sId = row.getAttribute('data-show-id');
          const targetShow = venue.shows.find(s => s.id === sId);
          if (targetShow && targetShow.id !== show.id) {
            displayVenueDetails(venue, targetShow);
          }
        });
      });

      // Song Request Form submission
      const songReqBtn = document.getElementById('songRequestSubmitBtn');
      const songReqInput = document.getElementById('songRequestInput');
      const songReqContainer = document.getElementById('songRequestFormContainer');
      if (songReqBtn && songReqInput && songReqContainer) {
        songReqBtn.onclick = () => {
          const val = songReqInput.value.trim();
          if (val) {
            songReqContainer.innerHTML = `<div class="song-request-success">✓ Request for "${val}" sent to the band's setlist board!</div>`;
            showToast(`✉️ Song request submitted! Thanks for voting.`);
          }
        };
      }

      // Tier 3 Bottom Navigation Event Listeners
      venueDynamicBody.querySelectorAll('.sheet-back-to-top-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const card = document.getElementById('venueDetailBottomCard');
          if (card) {
            card.scrollTo({ top: 0, behavior: 'smooth' });
            card.scrollTop = 0;
          }
        };
      });

      venueDynamicBody.querySelectorAll('.sheet-back-to-map-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('peek', { animate: true, autoPanMap: true });
        };
      });

    } else {
      // ARCHIVED GIG SECTIONS - Normalize data to guarantee full viability
      const asPlayedTracks = (show.asPlayedSetlist && show.asPlayedSetlist.length > 0)
        ? show.asPlayedSetlist
        : ((show.setlistDetails && show.setlistDetails.songs && show.setlistDetails.songs.length > 0)
            ? show.setlistDetails.songs.map((s, idx) => ({
                name: s.name,
                tag: s.tag || s.genre || (idx === 0 ? 'Opener' : (idx === show.setlistDetails.songs.length - 1 ? 'Encore' : 'Live Track')),
                duration: s.duration || '3:45',
                isUnreleased: s.isUnreleased || false,
                hasSnippet: true
              }))
            : [
                { name: "Pictures of You (The Cure cover)", tag: "Opener", duration: "4:20" },
                { name: "Say It Ain't So (Weezer cover)", tag: "High Energy", duration: "4:18" },
                { name: "Common People", tag: "Britpop", duration: "4:10" },
                { name: "Jane", tag: "Art Rock", duration: "3:45" },
                { name: "Neon Horizon [UNRELEASED NEW SONG]", isUnreleased: true, tag: "Debut", duration: "3:55" },
                { name: "Everlong (Foo Fighters)", tag: "Encore", duration: "4:10", hasSnippet: true }
              ]);

      const recapPhotos = (show.recapPhotos && show.recapPhotos.length > 0)
        ? show.recapPhotos
        : ((show.crowdAndGallery && show.crowdAndGallery.photos && show.crowdAndGallery.photos.length > 0)
            ? show.crowdAndGallery.photos.map(url => ({
                url,
                caption: "Concert Archive",
                credit: "@kins_vault"
              }))
            : [
                { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", caption: "Stage & Light Rig", credit: "@local_photographer" },
                { url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", caption: "Full Room Crowd", credit: "@rock_lens" },
                { url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80", caption: "Encore on Bar Counter", credit: "@band_archives" }
              ]);

      const highlightsList = (show.highlightsAndTrivia && show.highlightsAndTrivia.length > 0)
        ? show.highlightsAndTrivia
        : [
            show.snapshot?.highlight || "Sold out performance recorded live on soundboard master.",
            show.setlistDetails?.stageNotes || "Crowd reached full room capacity before headline set.",
            "Archived in 24-bit stereo soundboard master format."
          ];

      venueDynamicBody.innerHTML = `
        <!-- Mid-State Logistics Section (Tier 2 View) -->
        <div class="venue-quick-info-row">
          <span class="quick-chip"><i class="fa-solid fa-box-archive"></i> Tour Archive</span>
          <span class="quick-chip"><i class="fa-solid fa-id-card"></i> ${show.ageLimit || '18+'}</span>
          <span class="quick-chip"><i class="fa-solid fa-users"></i> ${show.capacity || '500'} Cap</span>
        </div>

        <!-- Recap Photos Strip (Mid State) -->
        ${recapPhotos.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div class="recap-header-title">
              <span class="left-title"><i class="fa-solid fa-camera fa-fw"></i> Gig Recap Photos</span>
              <span class="right-hint">Swipe ➔</span>
            </div>
            <div class="recap-photos-strip">
              ${recapPhotos.slice(0, 3).map(p => `
                <div class="recap-photo-card" data-photo-url="${p.url}" data-photo-caption="${p.caption}">
                  <img src="${p.url}" alt="${p.caption}" loading="lazy" />
                  <div class="photo-caption">${p.caption}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Full-Width Spotify Button (Mid State) -->
        <a href="${show.spotifyPlaylistUrl || 'https://open.spotify.com'}" target="_blank" rel="noopener noreferrer" class="spotify-as-played-btn">
          <i class="fa-brands fa-spotify"></i>
          <span>Play As-Played Setlist on Spotify</span>
        </a>

        <!-- Fixed Interactive Bottom Drawer Trigger (Tier 2 Bottom) -->
        <div class="swipe-up-hint-box" id="archiveSwipeUpTrigger" role="button" tabindex="0" title="Tap or swipe up for full archive">
          <i class="fa-solid fa-chevron-up"></i>
          <span>Swipe up for full setlist, recordings & stats</span>
        </div>

        <!-- FULL STATE ONLY EXTENDED CONTENT (Revealed via swipe-up / CTA tap) -->
        <div class="expanded-only-block" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Section 1: Official Photos & Media Gallery -->
          ${recapPhotos.length > 0 ? `
            <div class="section-divider-bar">
              <h3 class="expanded-section-title">
                <span class="left-title"><i class="fa-solid fa-images fa-fw"></i> Official Photos & Media</span>
                <span class="right-hint">Swipe ➔</span>
              </h3>
              <div class="official-media-gallery">
                ${recapPhotos.map(p => `
                  <div class="official-photo-card" data-photo-url="${p.url}" data-photo-caption="${p.caption} • ${p.credit || ''}">
                    <img src="${p.url}" alt="${p.caption}" loading="lazy" />
                    <div class="photo-credit-bar">${p.credit ? 'Photo by ' + p.credit : p.caption}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Section 2: As-Played Setlist (Guaranteed Viable) -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-compact-disc fa-fw"></i> As-Played Setlist</span>
            </h3>
            <div class="as-played-list">
              ${asPlayedTracks.map((t, idx) => `
                <div class="as-played-item">
                  <div class="track-main-info">
                    <span style="font-family: monospace; color: #71717a; font-size: 0.7rem;">${idx + 1}.</span>
                    <span>${t.name}</span>
                    ${t.isUnreleased ? `<span class="unreleased-star">⭐ UNRELEASED</span>` : ''}
                  </div>
                  ${t.hasSnippet ? `
                    <button type="button" class="snippet-btn" data-track-name="${t.name}">
                      <i class="fa-solid fa-volume-high"></i> Snippet
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 3: Show Highlights & Trivia -->
          ${highlightsList.length > 0 ? `
            <div class="section-divider-bar">
              <h3 class="expanded-section-title">
                <span class="left-title"><i class="fa-solid fa-wand-magic-sparkles fa-fw"></i> Show Highlights & Trivia</span>
              </h3>
              <div class="show-trivia-card">
                ${highlightsList.map(tr => `
                  <p class="trivia-bullet"><i class="fa-solid fa-circle-dot"></i> <span>${tr}</span></p>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Section 4: Past Shows at Venue (Chronological History List) -->
          <div class="section-divider-bar">
            <h3 class="expanded-section-title">
              <span class="left-title"><i class="fa-solid fa-clock-rotate-left fa-fw"></i> Past Shows at Venue</span>
              <span class="right-hint">${venueHistoryItems.length} Shows</span>
            </h3>
            <div class="venue-history-list">
              ${venueHistoryItems.map(item => `
                <div class="venue-history-card-row ${item.id === show.id ? 'is-current-active' : ''}" ${item.id ? `data-show-id="${item.id}"` : ''}>
                  <div class="venue-history-row-left">
                    <span class="venue-history-date">${item.dateText}</span>
                    <span class="venue-history-sub">${item.tourTitle}</span>
                  </div>
                  <div class="venue-history-row-right">
                    ${item.isNextShow 
                      ? '<span class="venue-history-badge is-live"><i class="fa-solid fa-bolt"></i> NEXT SHOW</span>'
                      : (item.type === 'upcoming'
                          ? '<span class="venue-history-badge is-upcoming"><i class="fa-solid fa-calendar-check"></i> UPCOMING</span>'
                          : '<span class="venue-history-badge is-past"><i class="fa-solid fa-box-archive"></i> COMPLETED</span>')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Tier 3 Bottom Navigation Controls (Back to Top & Back to Map) -->
          <div class="sheet-bottom-nav-row">
            <button type="button" class="sheet-nav-btn is-back-to-top sheet-back-to-top-btn" aria-label="Back to top of gig details">
              <i class="fa-solid fa-arrow-up"></i>
              <span>Back to Top</span>
            </button>
            <button type="button" class="sheet-nav-btn is-back-to-map sheet-back-to-map-btn" aria-label="Back to interactive map">
              <i class="fa-solid fa-map-location-dot"></i>
              <span>Back to Map</span>
            </button>
          </div>
        </div>
      `;

      // Wire interactive events for archive components
      const swipeUpArc = document.getElementById('archiveSwipeUpTrigger');
      if (swipeUpArc) {
        swipeUpArc.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('expanded');
        };
      }

      // History row clicks
      venueDynamicBody.querySelectorAll('.venue-history-card-row[data-show-id]').forEach(row => {
        row.addEventListener('click', () => {
          const sId = row.getAttribute('data-show-id');
          const targetShow = venue.shows.find(s => s.id === sId);
          if (targetShow && targetShow.id !== show.id) {
            displayVenueDetails(venue, targetShow);
          }
        });
      });

      // Lightbox click on photos
      venueDynamicBody.querySelectorAll('[data-photo-url]').forEach(card => {
        card.addEventListener('click', () => {
          const url = card.getAttribute('data-photo-url');
          const cap = card.getAttribute('data-photo-caption') || 'Concert Photo';
          openPhotoLightbox(url, cap);
        });
      });

      // Snippet player buttons
      venueDynamicBody.querySelectorAll('.snippet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const trackName = btn.getAttribute('data-track-name') || '';
          const trackObj = parseSetlistTrackInfo(trackName);
          showToast(`🎧 Playing soundboard snippet for ${trackObj.title}...`);
          if (window.playTrackPreview) {
            window.playTrackPreview(trackObj);
          }
        });
      });

      // Tier 3 Bottom Navigation Event Listeners
      venueDynamicBody.querySelectorAll('.sheet-back-to-top-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const card = document.getElementById('venueDetailBottomCard');
          if (card) {
            card.scrollTo({ top: 0, behavior: 'smooth' });
            card.scrollTop = 0;
          }
        };
      });

      venueDynamicBody.querySelectorAll('.sheet-back-to-map-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSnapState('peek', { animate: true, autoPanMap: true });
        };
      });
    }
  }

  // Helper for sharing show
  function triggerShareShow(v, s) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gig=${s.id}`;
    const shareData = {
      title: `Kins Live at ${v.name}`,
      text: `Check out Kins live show at ${v.name} (${s.dateText})!`,
      url: shareUrl
    };
    if (navigator.share && window.innerWidth < 768) {
      navigator.share(shareData).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`📋 Link to ${v.name} copied!`);
    } else {
      showToast(`🔗 Share: ${shareUrl}`);
    }
  }

  // 8. Update Selector Pills
  document.querySelectorAll('.gig-select-pill').forEach(pill => {
    const pillGigId = pill.getAttribute('data-gig-id');
    const pillVenueId = pill.getAttribute('data-venue-id');
    if (pillGigId === show.id || pillVenueId === venue.id) {
      pill.classList.add('active');
      pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      pill.classList.remove('active');
    }
  });

  // 10. Highlight Map Marker (Without opening duplicate popup overlay)
  markerMap.forEach((marker, vId) => {
    const el = marker.getElement();
    const v = VENUES.find(item => item.id === vId);
    if (el) {
      const wrap = el.querySelector('.custom-map-pin-wrap');
      if (wrap) {
        if (vId === venue.id) {
          wrap.classList.add('is-selected-marker');
          marker.setZIndexOffset(1000);
        } else {
          wrap.classList.remove('is-selected-marker');
          const hasNext = v && v.shows.some(s => s.isNextShow);
          marker.setZIndexOffset(hasNext ? 500 : 100);
        }
      }
    }
  });

  // Close any stray leaflet popups so the map remains clear above the bottom sheet
  if (leafletMapInstance) {
    leafletMapInstance.closePopup();
    const isDesktop = window.innerWidth >= 768;
    const targetLat = isDesktop ? venue.lat - 0.035 : venue.lat - 0.015;
    leafletMapInstance.flyTo([targetLat, venue.lng], isDesktop ? 12 : 12.5, { duration: 0.8 });
  }
}

export function filterGigs(category) {
  activeFilter = category;
  
  // Update filter buttons
  document.querySelectorAll('.gig-filter-tab').forEach(tab => {
    if (tab.getAttribute('data-filter') === category) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Filter venues
  const matchingVenues = VENUES.filter(v => {
    if (category === 'all') return true;
    if (category === 'upcoming') return v.shows.some(s => s.type === 'upcoming');
    if (category === 'past') return v.shows.some(s => s.type === 'past');
    if (category === 'newcastle') return v.region === 'newcastle';
    if (category === 'sydney') return v.region === 'sydney';
    return true;
  });

  // Re-render selector pills (Minimised compact pills)
  const selectorPillsRow = document.getElementById('gigSelectorPillsRow');
  if (selectorPillsRow) {
    if (matchingVenues.length > 0) {
      selectorPillsRow.innerHTML = matchingVenues.map(v => {
        // Pick primary show for display
        let primeShow = v.shows.find(s => s.isNextShow);
        if (!primeShow) {
          if (category === 'past') {
            primeShow = v.shows.find(s => s.type === 'past') || v.shows[0];
          } else {
            primeShow = v.shows.find(s => s.type === 'upcoming') || v.shows[0];
          }
        }

        let distanceTag = "";
        if (userLocation) {
          const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, v.lat, v.lng);
          distanceTag = `<span class="pill-distance-tag"><i class="fa-solid fa-location-arrow"></i> ${dist}km</span>`;
        }

        const isNext = primeShow.isNextShow;
        const isUp = primeShow.type === 'upcoming';
        const multiTag = v.shows.length > 1 ? `<span class="pill-multi-count">${v.shows.length}</span>` : '';

        return `
          <button class="gig-select-pill ${v.id === activeVenueId ? 'active' : ''}" data-venue-id="${v.id}" data-gig-id="${primeShow.id}">
            <span class="pill-badge-icon">${isNext ? '🔥' : (isUp ? '🎟️' : '📼')}</span>
            <span class="pill-name">${v.name}</span>
            <span class="pill-city-tag">• ${v.city.split(',')[0]}</span>
            ${multiTag}
            ${distanceTag}
          </button>
        `;
      }).join('');

      selectorPillsRow.querySelectorAll('.gig-select-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const venueId = pill.getAttribute('data-venue-id');
          const gigId = pill.getAttribute('data-gig-id');
          const targetVenue = VENUES.find(v => v.id === venueId);
          const targetShow = targetVenue ? targetVenue.shows.find(s => s.id === gigId) : null;
          if (targetVenue) displayVenueDetails(targetVenue, targetShow);
        });
      });
    } else {
      selectorPillsRow.innerHTML = `<span style="color: var(--text-muted); font-size: 0.72rem; padding: 4px 10px; display: inline-block;">No shows matching selected filter</span>`;
    }
  }

  // Update map markers visibility/opacity
  markerMap.forEach((marker, vId) => {
    const isMatch = matchingVenues.some(v => v.id === vId);
    const el = marker.getElement();
    if (el) {
      if (isMatch) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0.2';
        el.style.pointerEvents = 'none';
      }
    }
  });

  // If active venue is not matching, switch to first matching
  const isCurrentMatching = matchingVenues.some(v => v.id === activeVenueId);
  if (!isCurrentMatching && matchingVenues.length > 0) {
    displayVenueDetails(matchingVenues[0]);
  } else if (matchingVenues.length === 0) {
    displayVenueDetails(null);
  }
}

export function fitAllTourBounds() {
  if (!leafletMapInstance) return;
  const group = new window.L.featureGroup(Array.from(markerMap.values()));
  leafletMapInstance.fitBounds(group.getBounds(), {
    padding: window.innerWidth >= 768 ? [80, 80] : [40, 40],
    maxZoom: 13,
    duration: 0.8
  });
  showToast("🗺️ Viewing all Kins tour stops across NSW");
}

function updateUserLocationOnMap(lat, lng) {
  userLocation = { lat, lng };

  if (leafletMapInstance && window.L) {
    if (userLocationMarker) {
      userLocationMarker.setLatLng([lat, lng]);
    } else {
      const userIcon = window.L.divIcon({
        className: 'user-geo-pin',
        html: `
          <div class="user-geo-beacon" title="Your Live Location">
            <div class="user-geo-pulse"></div>
            <div class="user-geo-pulse ring-2"></div>
            <div class="user-geo-dot"></div>
            <div class="user-geo-label"><i class="fa-solid fa-person-rays"></i> YOU ARE HERE</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      userLocationMarker = window.L.marker([lat, lng], { 
        icon: userIcon, 
        zIndexOffset: 2000 
      }).addTo(leafletMapInstance);

      userLocationMarker.bindPopup(`
        <div class="map-popup-card" style="text-align: center; padding: 4px;">
          <strong style="color: #38bdf8; font-size: 0.78rem;"><i class="fa-solid fa-location-crosshairs"></i> Your Live Location</strong>
          <p style="font-size: 0.68rem; color: #a1a1aa; margin: 2px 0 0 0;">Proximity sorting & route active</p>
        </div>
      `, { offset: [0, -4], className: 'dark-glass-popup' });
    }
  }

  // Update locate button UI
  const locateBtn = document.getElementById('mapLocateMeBtn');
  if (locateBtn) locateBtn.classList.add('is-active');

  // Refresh filter and pills with accurate distance tags
  filterGigs(activeFilter);
}

export async function calculateAndRenderRoute(venueOrGig) {
  if (!venueOrGig) return;
  const pair = findVenueAndShow(venueOrGig.id);
  const venue = pair.venue;

  // Request user location if not yet obtained
  if (!userLocation) {
    showToast("📍 Requesting GPS location to calculate directions...");
    try {
      await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("No geolocation"));
        navigator.geolocation.getCurrentPosition(
          pos => {
            updateUserLocationOnMap(pos.coords.latitude, pos.coords.longitude);
            resolve();
          },
          err => reject(err),
          { timeout: 9000, enableHighAccuracy: true }
        );
      });
    } catch (err) {
      // Direct fallback to Google Maps
      const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.name + ', ' + venue.address)}`;
      window.open(gmapsUrl, '_blank', 'noopener,noreferrer');
      showToast(`🗺️ Opening ${venue.name} in Google Maps...`);
      return;
    }
  }

  if (!leafletMapInstance || !window.L || !userLocation) return;

  showToast(`🚗 Mapping route to ${venue.name}...`);

  let routeCoordinates = [];
  let estDurationMins = 0;
  let distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, venue.lat, venue.lng);

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${venue.lng},${venue.lat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
      estDurationMins = Math.round(route.duration / 60);
      distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    } else {
      throw new Error("OSRM routing fallback");
    }
  } catch (e) {
    // Fallback direct path
    routeCoordinates = [
      [userLocation.lat, userLocation.lng],
      [venue.lat, venue.lng]
    ];
    estDurationMins = Math.max(5, Math.round((distanceKm / 60) * 60));
  }

  // Remove previous route polyline
  if (activeRoutePolyline) {
    leafletMapInstance.removeLayer(activeRoutePolyline);
    activeRoutePolyline = null;
  }

  // Draw glowing cyan route line
  activeRoutePolyline = window.L.polyline(routeCoordinates, {
    color: '#38bdf8',
    weight: 4.5,
    opacity: 0.95,
    dashArray: '8, 8',
    className: 'active-directions-line'
  }).addTo(leafletMapInstance);

  // Fit map to show both User and Venue comfortably
  leafletMapInstance.fitBounds(activeRoutePolyline.getBounds(), {
    padding: window.innerWidth >= 768 ? [70, 70] : [36, 36],
    duration: 0.8
  });

  // Update and reveal Directions HUD
  const hud = document.getElementById('mapDirectionsHud');
  const hudDest = document.getElementById('directionsHudDest');
  const hudDuration = document.getElementById('directionsDuration');
  const hudDistance = document.getElementById('directionsDistance');
  const hudGmapsLink = document.getElementById('directionsGmapsLink');

  if (hud && hudDest && hudDuration && hudDistance && hudGmapsLink) {
    hudDest.textContent = venue.name;
    hudDuration.textContent = `~${estDurationMins} mins`;
    hudDistance.textContent = `${distanceKm} km`;
    hudGmapsLink.href = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${encodeURIComponent(venue.name + ', ' + venue.address)}`;
    hud.classList.remove('hidden');
  }

  displayVenueDetails(venue);
  showToast(`🗺️ Route mapped: ~${estDurationMins} min drive (${distanceKm} km)`);
}

export function clearActiveRoute() {
  if (activeRoutePolyline && leafletMapInstance) {
    leafletMapInstance.removeLayer(activeRoutePolyline);
    activeRoutePolyline = null;
  }
  const hud = document.getElementById('mapDirectionsHud');
  if (hud) hud.classList.add('hidden');
  showToast("📍 Route cleared from map");
}

function locateUserAndSort(flyToClosest = true) {
  if (!navigator.geolocation) {
    showToast("📍 Geolocation not supported by your browser");
    return;
  }

  const locateBtn = document.getElementById('mapLocateMeBtn');
  if (locateBtn) locateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  showToast("📍 Finding nearest Kins tour dates...");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (locateBtn) {
        locateBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i>`;
        locateBtn.classList.add('is-active');
      }
      updateUserLocationOnMap(pos.coords.latitude, pos.coords.longitude);

      // Find closest venue
      let closestVenue = VENUES[0];
      let minDistance = Infinity;
      VENUES.forEach(v => {
        const d = calculateDistanceKm(userLocation.lat, userLocation.lng, v.lat, v.lng);
        if (d < minDistance) {
          minDistance = d;
          closestVenue = v;
        }
      });

      if (closestVenue) {
        displayVenueDetails(closestVenue);
        showToast(`📍 Closest show: ${closestVenue.name} in ${closestVenue.city.split(',')[0]} (${minDistance} km away)!`);
        
        if (flyToClosest && leafletMapInstance && window.L) {
          const group = new window.L.featureGroup([
            window.L.marker([userLocation.lat, userLocation.lng]),
            window.L.marker([closestVenue.lat, closestVenue.lng])
          ]);
          leafletMapInstance.fitBounds(group.getBounds(), {
            padding: window.innerWidth >= 768 ? [70, 70] : [40, 40],
            maxZoom: 13,
            duration: 0.9
          });
        }
      }
    },
    (err) => {
      if (locateBtn) {
        locateBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i>`;
        locateBtn.classList.remove('is-active');
      }
      showToast("📍 Location access was declined or unavailable.");
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

export function initGigMapModule() {
  const floatingGigPillBtn = document.getElementById('floatingGigPillBtn');
  const gigMapModal = document.getElementById('gigMapModal');
  const closeGigMapSheet = document.getElementById('closeGigMapSheet');
  const gigPillTag = document.getElementById('gigPillTag');
  const gigPillLocation = document.getElementById('gigPillLocation');
  const gigPillTitle = document.getElementById('gigPillTitle');
  const fitBoundsBtn = document.getElementById('mapFitBoundsBtn');
  const locateMeBtn = document.getElementById('mapLocateMeBtn');
  const toggleMapDetailsBtn = document.getElementById('toggleMapDetailsBtn');
  const venueDetailCard = document.getElementById('venueDetailBottomCard');
  const sheetDragHandle = document.getElementById('sheetDragHandle');
  const lightboxCloseBtn = document.getElementById('gigLightboxClose');
  const lightboxBackdrop = document.getElementById('gigPhotoLightbox');
  const closeDirectionsHud = document.getElementById('closeDirectionsHud');
  const clearRouteHudBtn = document.getElementById('clearRouteHudBtn');

  const nextGig = LOCAL_GIGS.find(g => g.isNextShow) || LOCAL_GIGS[0];

  function updateFloatingPill() {
    if (nextGig) {
      if (gigPillTag) gigPillTag.textContent = "NEXT SHOW";
      if (gigPillTitle) gigPillTitle.textContent = "TOUR MAP";
      if (gigPillLocation) gigPillLocation.textContent = `${nextGig.venue.replace('The ', '')} • ${nextGig.city.split(',')[0]}`;
    } else {
      if (gigPillTag) gigPillTag.textContent = "TOUR";
      if (gigPillTitle) gigPillTitle.textContent = "GIG MAP";
      if (gigPillLocation) gigPillLocation.textContent = "Newcastle & Sydney";
    }
  }
  updateFloatingPill();

  // Setup Filter Tabs
  document.querySelectorAll('.gig-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter');
      filterGigs(filter || 'all');
    });
  });

  // Initialize selector pills row
  filterGigs('all');

  async function ensureLeafletLoaded() {
    if (window.L) return;

    if (!document.getElementById('leaflet-css-dyn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-dyn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js-dyn')) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'leaflet-js-dyn';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  function initGigMap() {
    const mapContainer = document.getElementById('gigMapView');
    if (!mapContainer || typeof window.L === 'undefined') return;

    if (!leafletMapInstance) {
      leafletMapInstance = window.L.map('gigMapView', {
        zoomControl: true,
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelDebounceTime: 60,
        tap: !window.L.Browser.mobile,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([-33.4, 151.4], 9);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(leafletMapInstance);

      // NSW Region Polygon (Newcastle to Sydney Catchment)
      regionPolygonInstance = window.L.polygon(COASTAL_LAND_POLYGON, {
        color: 'rgba(255, 255, 255, 0.25)',
        fillColor: '#f2f0eb',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(leafletMapInstance);

      regionPolygonInstance.bindTooltip("📍 Kins NSW Tour Corridor: Newcastle & Sydney", {
        permanent: false,
        direction: "top"
      });

      // Tour Route Polyline connecting the tour stops
      tourPolylineInstance = window.L.polyline(TOUR_CORRIDOR_PATH, {
        color: '#f2f0eb',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 8',
        className: 'tour-route-line'
      }).addTo(leafletMapInstance);

      tourPolylineInstance.bindTooltip("🚗 NSW Tour Highway: Newcastle ⇄ Central Coast ⇄ Sydney", {
        permanent: false,
        direction: "center"
      });

      markerMap.clear();

      VENUES.forEach(venue => {
        const hasNext = venue.shows.some(s => s.isNextShow);
        const hasUpcoming = venue.shows.some(s => s.type === 'upcoming');
        const showCount = venue.shows.length;
        const iconSize = hasNext ? [30, 30] : [26, 26];
        const iconAnchor = hasNext ? [15, 15] : [13, 13];
        const popupAnchor = hasNext ? [0, -16] : [0, -15];
        
        const countBadgeHtml = showCount > 1 
          ? `<span class="multi-show-counter-badge" title="${showCount} shows at this venue">${showCount}</span>` 
          : '';

        const pinIcon = window.L.divIcon({
          className: 'custom-map-pin-div',
          html: `
            <div class="custom-map-pin-wrap ${hasNext ? 'is-next-gig' : ''} ${hasUpcoming ? 'is-upcoming' : 'is-past'} ${venue.id === activeVenueId ? 'is-selected-marker' : ''}" title="${venue.name} (${showCount} show${showCount > 1 ? 's' : ''})">
              ${hasNext ? `
                <div class="next-show-top-stack">
                  <span class="next-show-pill-text">NEXT</span>
                </div>
              ` : ''}
              <div class="pin-bubble">
                <i class="fa-solid ${hasNext ? 'fa-fire' : (hasUpcoming ? 'fa-ticket' : 'fa-compact-disc')}"></i>
                ${countBadgeHtml}
              </div>
            </div>
          `,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        });

        const marker = window.L.marker([venue.lat, venue.lng], { 
          icon: pinIcon,
          riseOnHover: true,
          zIndexOffset: venue.id === activeVenueId ? 1000 : (hasNext ? 500 : 100)
        }).addTo(leafletMapInstance);

        // Marker click directly syncs the bottom sheet (no floating popup overlay)
        marker.on('click', () => {
          displayVenueDetails(venue);
          setSnapState('peek', { animate: true, autoPanMap: true });
        });

        markerMap.set(venue.id, marker);
      });

      // Restore user location marker if previously found
      if (userLocation) {
        updateUserLocationOnMap(userLocation.lat, userLocation.lng);
      }

      const initialPair = findVenueAndShow(activeGigId || activeVenueId);
      displayVenueDetails(initialPair.venue, initialPair.show);
    } else {
      const currentPair = findVenueAndShow(activeGigId || activeVenueId);
      displayVenueDetails(currentPair.venue, currentPair.show);
    }

    setTimeout(() => {
      if (leafletMapInstance) {
        leafletMapInstance.invalidateSize();
      }
    }, 300);
  }

  // ==========================================================================
  // 3-TIER FLUID BOTTOM SHEET GESTURE ENGINE (Peek / Mid / Expanded)
  // ==========================================================================
  const venueCardHeader = document.getElementById('venueCardHeader');
  const desktopSnapToggleBtn = document.getElementById('desktopSnapToggleBtn');

  let isDraggingSheet = false;
  let dragStartY = 0;
  let dragStartHeight = 0;
  let dragStartTime = 0;
  let lastTouchY = 0;
  let lastTouchTime = 0;
  let dragInitiatedFromContent = false;

  // --- MOBILE TOUCH GESTURE ENGINE (TouchStart / TouchMove / TouchEnd) ---
  if (venueDetailCard) {
    // 1. Touch Start
    venueDetailCard.addEventListener('touchstart', (e) => {
      if (window.innerWidth >= 768) return; // Desktop handles clicks/keys
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      dragStartY = touch.clientY;
      lastTouchY = touch.clientY;
      dragStartTime = performance.now();
      lastTouchTime = dragStartTime;
      dragStartHeight = venueDetailCard.getBoundingClientRect().height;
      dragInitiatedFromContent = false;

      // Check touch origination - allow interactive elements to receive taps cleanly
      const target = e.target;
      const isInteractive = target.closest('button') || 
                            target.closest('a') || 
                            target.closest('.swipe-up-hint-box') || 
                            target.closest('.sheet-nav-btn') || 
                            target.closest('.copy-address-btn') || 
                            target.closest('.setlist-preview-row') || 
                            target.closest('.as-played-item') || 
                            target.closest('.venue-history-card-row') || 
                            target.closest('.recap-photo-card') ||
                            target.closest('.venue-checkin-btn') ||
                            target.closest('.venue-booking-btn');

      if (isInteractive) {
        isDraggingSheet = false;
        dragInitiatedFromContent = false;
        return;
      }

      const isHeaderOrHandle = target.closest('#sheetDragHandle') || target.closest('#venueCardHeader');
      
      if (isHeaderOrHandle) {
        isDraggingSheet = true;
        venueDetailCard.classList.add('is-dragging');
      } else {
        // Content area touch - only engage if at top of scroll
        isDraggingSheet = false;
        if (venueDetailCard.scrollTop <= 2) {
          dragInitiatedFromContent = true;
        }
      }
    }, { passive: true });

    // 2. Touch Move
    venueDetailCard.addEventListener('touchmove', (e) => {
      if (window.innerWidth >= 768) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = dragStartY - currentY; // Positive = pulling UP, Negative = pulling DOWN
      const now = performance.now();

      lastTouchY = currentY;
      lastTouchTime = now;

      // Check if pulling down from top of scrollable content
      if (!isDraggingSheet && dragInitiatedFromContent) {
        if (venueDetailCard.scrollTop <= 0 && deltaY < -10) {
          // Hand-off: switch to dragging the sheet
          isDraggingSheet = true;
          venueDetailCard.classList.add('is-dragging');
          dragStartY = currentY; // Reset anchor to avoid jump
          dragStartHeight = venueDetailCard.getBoundingClientRect().height;
        }
      }

      if (isDraggingSheet) {
        // Prevent background viewport bounce
        if (e.cancelable) e.preventDefault();

        const snapHeights = getSnapHeights();
        let targetHeight = dragStartHeight + deltaY;

        // Apply logarithmic rubber-band resistance beyond limits
        if (targetHeight < snapHeights.peek) {
          const under = snapHeights.peek - targetHeight;
          targetHeight = snapHeights.peek - Math.pow(under, 0.72);
        } else if (targetHeight > snapHeights.expanded) {
          const over = targetHeight - snapHeights.expanded;
          targetHeight = snapHeights.expanded + Math.pow(over, 0.72);
        }

        venueDetailCard.style.height = `${Math.round(targetHeight)}px`;
      }
    }, { passive: false });

    // 3. Touch End / Cancel
    const handleTouchEnd = (e) => {
      if (!isDraggingSheet) return;
      isDraggingSheet = false;
      venueDetailCard.classList.remove('is-dragging');

      const endTime = performance.now();
      const timeDiff = Math.max(1, endTime - dragStartTime);
      const totalDeltaY = dragStartY - lastTouchY; // Positive = UP, Negative = DOWN
      const velocity = (lastTouchY - dragStartY) / timeDiff; // px/ms (Positive = DOWN, Negative = UP)
      const currentHeight = venueDetailCard.getBoundingClientRect().height;
      const snapHeights = getSnapHeights();

      // Velocity-based dynamic snapping
      if (velocity < -0.42) {
        // High-speed flick UP
        if (currentSnapState === 'peek') setSnapState('mid');
        else setSnapState('expanded');
        return;
      } else if (velocity > 0.42) {
        // High-speed flick DOWN
        if (currentSnapState === 'expanded') setSnapState('mid');
        else setSnapState('peek');
        return;
      }

      // Distance / Threshold snapping based on release height
      const midThreshold1 = (snapHeights.peek + snapHeights.mid) / 2;
      const midThreshold2 = (snapHeights.mid + snapHeights.expanded) / 2;

      if (currentHeight < midThreshold1) {
        setSnapState('peek');
      } else if (currentHeight < midThreshold2) {
        setSnapState('mid');
      } else {
        setSnapState('expanded');
      }
    };

    venueDetailCard.addEventListener('touchend', handleTouchEnd, { passive: true });
    venueDetailCard.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Tap on drag handle toggles snap states
    if (sheetDragHandle) {
      sheetDragHandle.addEventListener('click', (e) => {
        // Only trigger click if not dragged significantly
        if (Math.abs(dragStartY - lastTouchY) < 6) {
          cycleSheetState();
        }
      });
    }

    // Header click in peek state expands to mid
    if (venueCardHeader) {
      venueCardHeader.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input')) return; // Ignore interactive clicks
        if (currentSnapState === 'peek') {
          setSnapState('mid');
        }
      });
    }

    // Close button on State 3 / Full
    const sheetCloseFullBtn = document.getElementById('sheetCloseFullBtn');
    if (sheetCloseFullBtn) {
      sheetCloseFullBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSnapState('peek');
      });
    }

    // Desktop toggle button
    if (desktopSnapToggleBtn) {
      desktopSnapToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentSnapState === 'expanded' || currentSnapState === 'mid') {
          setSnapState('peek');
        } else {
          setSnapState('expanded');
        }
      });
    }
  }

  // --- KEYBOARD ACCESSIBILITY CONTROLS ---
  window.addEventListener('keydown', (e) => {
    if (!gigMapModal || !gigMapModal.classList.contains('active')) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepUpSheetState();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepDownSheetState();
    } else if (e.key === 'Escape') {
      if (lightboxBackdrop && lightboxBackdrop.classList.contains('active')) {
        closePhotoLightbox();
        return;
      }
      if (currentSnapState === 'expanded' || currentSnapState === 'mid') {
        e.preventDefault();
        setSnapState('peek');
      } else {
        gigMapModal.classList.remove('active');
        unlockScroll();
      }
    }
  });

  // Global Open Helper with Context-Aware Default State
  window.openGigMap = async function(gigOrVenueId, initialSnapState) {
    if (gigMapModal) {
      gigMapModal.classList.add('active');
      lockScroll();
      await ensureLeafletLoaded();
      
      if (gigOrVenueId) {
        const pair = findVenueAndShow(gigOrVenueId);
        activeVenueId = pair.venue.id;
        activeGigId = pair.show.id;
      }
      
      initGigMap();
      
      const pair = findVenueAndShow(gigOrVenueId || activeGigId || activeVenueId);
      displayVenueDetails(pair.venue, pair.show);
      
      // Default to Mid if opened via hero Next Show CTA, or Peek if browsing
      const isDesktop = window.innerWidth >= 768;
      const targetState = initialSnapState || (isDesktop ? 'expanded' : 'mid');
      setSnapState(targetState, { animate: true, autoPanMap: true });
      
      // Ensure Leaflet recalculates viewport sizes properly
      setTimeout(() => { if (leafletMapInstance) leafletMapInstance.invalidateSize(); }, 80);
      setTimeout(() => { if (leafletMapInstance) leafletMapInstance.invalidateSize(); }, 250);
      setTimeout(() => { if (leafletMapInstance) leafletMapInstance.invalidateSize(); }, 450);
    }
  };

  if (floatingGigPillBtn && gigMapModal) {
    floatingGigPillBtn.addEventListener('click', async () => {
      // Direct opening from Hero CTA starts in 'mid'
      await window.openGigMap(undefined, 'mid');
    });
  }

  if (closeGigMapSheet && gigMapModal) {
    closeGigMapSheet.addEventListener('click', () => {
      gigMapModal.classList.remove('active');
      unlockScroll();
    });

    gigMapModal.addEventListener('click', (e) => {
      if (e.target === gigMapModal) {
        gigMapModal.classList.remove('active');
        unlockScroll();
      }
    });
  }

  // Custom Map Controls Handlers
  if (fitBoundsBtn) {
    fitBoundsBtn.addEventListener('click', () => {
      fitAllTourBounds();
    });
  }

  if (locateMeBtn) {
    locateMeBtn.addEventListener('click', () => {
      locateUserAndSort(true);
    });
  }

  // Toggle map canvas mode (collapse/expand details)
  if (toggleMapDetailsBtn && venueDetailCard) {
    let isCollapsed = false;
    toggleMapDetailsBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        setSnapState('peek');
        toggleMapDetailsBtn.innerHTML = `<i class="fa-solid fa-sheet-plastic"></i>`;
        toggleMapDetailsBtn.title = "Show Venue Details";
        showToast("🗺️ Map Canvas Maximized");
      } else {
        setSnapState('expanded');
        toggleMapDetailsBtn.innerHTML = `<i class="fa-solid fa-map"></i>`;
        toggleMapDetailsBtn.title = "Full Map Canvas";
      }
    });
  }

  // Photo Lightbox Close
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closePhotoLightbox);
  }
  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener('click', (e) => {
      if (e.target === lightboxBackdrop) closePhotoLightbox();
    });
  }

  // Directions HUD Close & Clear buttons
  if (closeDirectionsHud) {
    closeDirectionsHud.addEventListener('click', clearActiveRoute);
  }
  if (clearRouteHudBtn) {
    clearRouteHudBtn.addEventListener('click', clearActiveRoute);
  }

  // Delegated click handler for popup action buttons, route triggers, and back to top/map buttons
  document.addEventListener('click', (e) => {
    const backToTopBtn = e.target.closest('.sheet-back-to-top-btn') || e.target.closest('#scrollTopBtn');
    if (backToTopBtn) {
      e.preventDefault();
      const card = document.getElementById('venueDetailBottomCard');
      if (card) {
        card.scrollTo({ top: 0, behavior: 'smooth' });
        card.scrollTop = 0;
      }
      return;
    }

    const backToMapBtn = e.target.closest('.sheet-back-to-map-btn') || e.target.closest('#bottomCollapseSheetBtn');
    if (backToMapBtn) {
      e.preventDefault();
      setSnapState('peek', { animate: true, autoPanMap: true });
      return;
    }

    const swipeTrigger = e.target.closest('#upcomingSwipeUpTrigger') || e.target.closest('#archiveSwipeUpTrigger');
    if (swipeTrigger) {
      e.preventDefault();
      setSnapState('expanded');
      return;
    }

    const routeBtn = e.target.closest('.map-popup-route-btn');
    if (routeBtn) {
      const venueId = routeBtn.getAttribute('data-route-venue-id') || routeBtn.getAttribute('data-route-gig-id');
      const pair = findVenueAndShow(venueId);
      if (pair.venue) {
        calculateAndRenderRoute(pair.venue);
      }
      return;
    }

    const popupBtn = e.target.closest('.map-popup-action-btn');
    if (popupBtn) {
      const venueId = popupBtn.getAttribute('data-popup-venue-id') || popupBtn.getAttribute('data-popup-gig-id');
      const showId = popupBtn.getAttribute('data-popup-gig-id');
      const pair = findVenueAndShow(showId || venueId);
      if (pair.venue) {
        displayVenueDetails(pair.venue, pair.show);
        setSnapState('mid');
      }
    }
  });

  // Check URL parameters or hash on load
  const urlParams = new URLSearchParams(window.location.search);
  const requestedGig = urlParams.get('gig') || urlParams.get('venue');
  if (requestedGig || window.location.hash === '#gig-map') {
    setTimeout(() => {
      window.openGigMap(requestedGig || undefined, 'mid');
    }, 400);
  }
}

