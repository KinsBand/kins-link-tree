/**
 * Single Source of Truth (SSOT) configuration for the Kins Official Store.
 * Complete band merchandise catalog featuring a structured pricing ladder
 * from low-barrier impulse buys (<$10) to premium signature collectibles and digital assets.
 */

export interface ProductVariant {
  id: string;
  name: string;
  inStock: boolean;
  sku: string;
  priceOffset?: number;
}

export interface StoreProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'apparel' | 'music' | 'swag' | 'lifestyle' | 'art' | 'digital';
  price: number;
  currency: string;
  compareAtPrice?: number;
  badge?: 'LIMITED' | 'PRE-ORDER' | 'SOLD OUT' | 'NEW' | 'POPULAR' | 'TOUR EXCLUSIVE';
  status: 'in_stock' | 'low_stock' | 'pre_order' | 'sold_out';
  images: {
    primary: string;
    secondary?: string;
    alt: string;
  };
  variants: ProductVariant[];
  details: {
    material?: string;
    fit?: string;
    shippingInfo?: string;
    tracklist?: string[];
    specifications?: string[];
  };
  featured?: boolean;
}

export interface StoreCategory {
  id: string;
  name: string;
  icon: string;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  shippingNotice: string;
  dropName: string;
  dropHeadline: string;
  dropSubtitle: string;
  dropDateIso: string;
  enableCountdown: boolean;
  categories: StoreCategory[];
  promoCodes: Record<string, { discountPercent: number; code: string; label: string }>;
  products: StoreProduct[];
}

export const storeConfig: StoreConfig = {
  storeName: "KINS STORE",
  tagline: "Official Kins Merchandise • Apparel • Vinyl • Collectibles",
  currency: "USD",
  currencySymbol: "$",
  freeShippingThreshold: 75,
  shippingNotice: "Free worldwide shipping on all orders over $75",
  dropName: "2026 TOUR COLLECTION",
  dropHeadline: "OFFICIAL KINS MERCH",
  dropSubtitle: "Heavyweight apparel, analog media, stage-played collectibles, and studio stems direct from the band.",
  dropDateIso: "2026-10-31T00:00:00Z",
  enableCountdown: true,

  categories: [
    { id: "all", name: "ALL ITEMS", icon: "fa-solid fa-layer-group" },
    { id: "apparel", name: "APPAREL", icon: "fa-solid fa-shirt" },
    { id: "music", name: "MUSIC & MEDIA", icon: "fa-solid fa-compact-disc" },
    { id: "swag", name: "SMALL SWAG (<$15)", icon: "fa-solid fa-tags" },
    { id: "lifestyle", name: "LIFESTYLE", icon: "fa-solid fa-mug-hot" },
    { id: "art", name: "ART & PRINTS", icon: "fa-solid fa-palette" },
    { id: "digital", name: "DIGITAL & VIP", icon: "fa-solid fa-file-audio" }
  ],

  promoCodes: {
    "KINSVIP2026": { discountPercent: 15, code: "KINSVIP2026", label: "VIP Club (15% Off)" },
    "TOUR2026": { discountPercent: 10, code: "TOUR2026", label: "Tour Debut (10% Off)" }
  },

  products: [
    // --------------------------------------------------------------------------
    // 1. CORE APPAREL & WEARABLES
    // --------------------------------------------------------------------------
    {
      id: "kins-apparel-hoodie",
      slug: "kins-heavyweight-tour-hoodie",
      title: "Kins Tour Hoodie (Jet Black)",
      subtitle: "450GSM French Terry Cotton • Custom Relaxed Cut",
      description: "Heavyweight 450GSM custom-milled organic French terry. High-density Kins chest typography, double-lined brutalist hood, raw-edge stitching, and world tour backprint.",
      category: "apparel",
      price: 85,
      compareAtPrice: 95,
      currency: "USD",
      badge: "POPULAR",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2318181c'/><path d='M120 100 L200 60 L280 100 L330 180 L290 200 L270 140 L270 340 L130 340 L130 140 L110 200 L70 180 Z' fill='%23222228' stroke='%23f2fd43' stroke-width='4'/><text x='200' y='210' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='22' text-anchor='middle'>KINS TOUR</text><text x='200' y='240' fill='%23a1a1aa' font-family='sans-serif' font-weight='700' font-size='12' text-anchor='middle'>450 GSM HOODIE</text></svg>",
        secondary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141418'/><path d='M130 100 L270 100 L270 340 L130 340 Z' fill='%231c1c22' stroke='%23ffffff' stroke-width='3'/><text x='200' y='180' fill='%23f5f5f7' font-family='sans-serif' font-weight='800' font-size='18' text-anchor='middle'>TOUR DATES BACKPRINT</text><text x='200' y='220' fill='%238e8e93' font-family='monospace' font-size='11' text-anchor='middle'>SYDNEY • TOKYO • LONDON • NYC</text></svg>",
        alt: "Kins Heavyweight Tour Hoodie Front and Back"
      },
      variants: [
        { id: "hd-s", name: "S", inStock: true, sku: "KINS-HD-S" },
        { id: "hd-m", name: "M", inStock: true, sku: "KINS-HD-M" },
        { id: "hd-l", name: "L", inStock: true, sku: "KINS-HD-L" },
        { id: "hd-xl", name: "XL", inStock: true, sku: "KINS-HD-XL" },
        { id: "hd-2xl", name: "2XL", inStock: false, sku: "KINS-HD-2XL" }
      ],
      details: {
        material: "100% Organic Heavyweight Cotton (450 GSM)",
        fit: "Boxy, relaxed drop-shoulder cut.",
        shippingInfo: "Ships within 24-48 business hours."
      },
      featured: true
    },
    {
      id: "kins-apparel-tee-classic",
      slug: "kins-classic-logo-heavy-tee",
      title: "Classic Logo Heavyweight Tee",
      subtitle: "280GSM Combed Jersey • Vintage Jet Black",
      description: "Timeless Kins studio branding on thick 280GSM combed cotton. 1.25-inch thick ribbed collar and reinforced twin-needle stitching for lasting shape.",
      category: "apparel",
      price: 40,
      currency: "USD",
      badge: "NEW",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><path d='M110 110 L170 70 L230 70 L290 110 L340 170 L290 190 L270 160 L270 340 L130 340 L130 160 L110 190 L60 170 Z' fill='%23202026' stroke='%23f2fd43' stroke-width='4'/><text x='200' y='210' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='26' text-anchor='middle'>✦ KINS ✦</text><text x='200' y='240' fill='%23ffffff' font-family='monospace' font-size='12' text-anchor='middle'>CLASSIC LOGO TEE</text></svg>",
        alt: "Kins Classic Logo Heavyweight Tee"
      },
      variants: [
        { id: "tee-s", name: "S", inStock: true, sku: "KINS-TEE-S" },
        { id: "tee-m", name: "M", inStock: true, sku: "KINS-TEE-M" },
        { id: "tee-l", name: "L", inStock: true, sku: "KINS-TEE-L" },
        { id: "tee-xl", name: "XL", inStock: true, sku: "KINS-TEE-XL" },
        { id: "tee-2xl", name: "2XL", inStock: true, sku: "KINS-TEE-2XL" }
      ],
      details: {
        material: "100% Combed Heavy Cotton (280 GSM)",
        fit: "True to size boxy streetwear fit.",
        shippingInfo: "Ships within 24-48 business hours."
      },
      featured: true
    },
    {
      id: "kins-apparel-longsleeve",
      slug: "kins-sleeve-print-longsleeve",
      title: "Kins Long-Sleeve (Sleeve Print)",
      subtitle: "260GSM Jersey • Studio Typography Down Sleeves",
      description: "Heavyweight long-sleeve tee with Kins studio coordinates and song lyrics printed down both sleeves and bold chest badge.",
      category: "apparel",
      price: 52,
      currency: "USD",
      badge: "NEW",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23121216'/><path d='M110 110 L170 70 L230 70 L290 110 L370 240 L330 260 L270 170 L270 340 L130 340 L130 170 L70 260 L30 240 Z' fill='%2322222a' stroke='%23ffffff' stroke-width='3'/><text x='200' y='210' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='20' text-anchor='middle'>KINS STUDIO</text><text x='55' y='180' fill='%23f2fd43' font-family='monospace' font-size='9' transform='rotate(-45 55 180)'>/// LYRICS ///</text><text x='345' y='180' fill='%23f2fd43' font-family='monospace' font-size='9' transform='rotate(45 345 180)'>/// KINS 2026 ///</text></svg>",
        alt: "Kins Long-Sleeve Shirt with Sleeve Prints"
      },
      variants: [
        { id: "ls-s", name: "S", inStock: true, sku: "KINS-LS-S" },
        { id: "ls-m", name: "M", inStock: true, sku: "KINS-LS-M" },
        { id: "ls-l", name: "L", inStock: true, sku: "KINS-LS-L" },
        { id: "ls-xl", name: "XL", inStock: true, sku: "KINS-LS-XL" }
      ],
      details: {
        material: "100% Pre-shrunk Cotton Jersey",
        fit: "Relaxed fit with ribbed cuffs."
      },
      featured: false
    },
    {
      id: "kins-apparel-cap",
      slug: "kins-unstructured-studio-cap",
      title: "Kins Unstructured Studio Cap",
      subtitle: "100% Washed Cotton Twill • 3D Puff Embroidery",
      description: "Low-profile 6-panel unstructured dad hat with 3D puff embroidery and vintage brass buckle closure.",
      category: "apparel",
      price: 32,
      currency: "USD",
      badge: "POPULAR",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><path d='M100 240 C100 140, 300 140, 300 240 L340 260 L60 260 Z' fill='%23222228' stroke='%23f2fd43' stroke-width='4'/><text x='200' y='210' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='20' text-anchor='middle'>✦ KINS ✦</text></svg>",
        alt: "Kins Unstructured Studio Cap"
      },
      variants: [
        { id: "cap-blk", name: "Jet Black / Neon Accent", inStock: true, sku: "KINS-CAP-BLK" },
        { id: "cap-chk", name: "Vintage Chalk / Black", inStock: true, sku: "KINS-CAP-CHK" }
      ],
      details: {
        material: "100% Chino Cotton Twill",
        fit: "One Size Fits All (Adjustable brass clasp)."
      },
      featured: false
    },
    {
      id: "kins-apparel-beanie",
      slug: "kins-embroidered-ribbed-beanie",
      title: "Kins Embroidered Ribbed Beanie",
      subtitle: "Chunky Rib Knit • Woven Foldover Patch",
      description: "Warm, chunky acrylic-wool blend ribbed beanie with a high-density embroidered Kins patch on foldover cuff.",
      category: "apparel",
      price: 28,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2316161a'/><path d='M120 160 C120 80, 280 80, 280 160 L280 270 L120 270 Z' fill='%23262630' stroke='%23f2fd43' stroke-width='4'/><rect x='110' y='270' width='180' height='50' fill='%2318181c' stroke='%23f2fd43' stroke-width='3'/><text x='200' y='302' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='16' text-anchor='middle'>✦ KINS ✦</text></svg>",
        alt: "Kins Ribbed Beanie"
      },
      variants: [
        { id: "beanie-blk", name: "Black Rib", inStock: true, sku: "KINS-BN-BLK" },
        { id: "beanie-gold", name: "Gold Rib", inStock: true, sku: "KINS-BN-GLD" }
      ],
      details: {
        material: "Soft Acrylic Rib Knit",
        fit: "One Size Fits All."
      },
      featured: false
    },
    {
      id: "kins-apparel-socks",
      slug: "kins-woven-crew-socks",
      title: "Kins Woven Crew Socks (Pair)",
      subtitle: "Cushioned Sole • Jacquard Ribbed Band",
      description: "Jacquard woven ribbed crew socks with Kins brutalist typography and reinforced terry-loop heel and toe cushioning.",
      category: "apparel",
      price: 16,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><path d='M160 80 L220 80 L220 260 L270 290 L250 330 L160 280 Z' fill='%2322222a' stroke='%23f2fd43' stroke-width='4'/><text x='190' y='140' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='12' text-anchor='middle'>KINS</text><text x='190' y='160' fill='%23ffffff' font-family='monospace' font-size='10' text-anchor='middle'>2026</text></svg>",
        alt: "Kins Woven Crew Socks"
      },
      variants: [
        { id: "socks-std", name: "One Size (US 7-12)", inStock: true, sku: "KINS-SCK-01" }
      ],
      details: {
        material: "80% Cotton, 17% Polyester, 3% Elastane"
      },
      featured: false
    },

    // --------------------------------------------------------------------------
    // 2. PHYSICAL MUSIC & MEDIA
    // --------------------------------------------------------------------------
    {
      id: "kins-music-vinyl-genesis",
      slug: "genesis-180g-deluxe-vinyl-lp",
      title: "'Genesis' 180g Deluxe Vinyl LP",
      subtitle: "Gatefold Packaging • Ltd 500 Copies • 12\" Booklet",
      description: "Mastered at Abbey Road Studios for analog lacquer cut. Includes 16-page recording journal booklet, gatefold packaging with gold foil deboss, double-sided poster, and lossless download card.",
      category: "music",
      price: 38,
      currency: "USD",
      badge: "PRE-ORDER",
      status: "pre_order",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23121216'/><circle cx='200' cy='200' r='140' fill='%231c1c20' stroke='%23000000' stroke-width='6'/><circle cx='200' cy='200' r='110' fill='%23141416' stroke='%23333333' stroke-dasharray='4,4'/><circle cx='200' cy='200' r='50' fill='%23f2fd43' stroke='%23000000' stroke-width='4'/><circle cx='200' cy='200' r='8' fill='%23000000'/><text x='200' y='196' fill='%23000000' font-family='serif' font-weight='900' font-size='11' text-anchor='middle'>KINS</text><text x='200' y='212' fill='%23000000' font-family='sans-serif' font-weight='700' font-size='9' text-anchor='middle'>GENESIS LP</text></svg>",
        alt: "Genesis 180g Vinyl Gatefold LP"
      },
      variants: [
        { id: "v-gold", name: "Gold Foil Ltd (500 pressed)", inStock: true, sku: "KINS-LP-GLD" },
        { id: "v-black", name: "Audiophile Classic Black", inStock: true, sku: "KINS-LP-BLK" }
      ],
      details: {
        material: "180g Audiophile Virgin Vinyl",
        tracklist: [
          "A1. Electric Pulse (Intro)",
          "A2. Neon Horizons",
          "A3. Midnight Rehearsal",
          "B1. Velocity",
          "B2. Echoes in the Dark",
          "B3. Genesis (Live Cut)"
        ]
      },
      featured: true
    },
    {
      id: "kins-music-cd-digipak",
      slug: "genesis-debut-cd-digipak",
      title: "'Genesis' CD Digipak Edition",
      subtitle: "Eco-Wallet 6-Panel Digipak • 20-Page Lyric Booklet",
      description: "6-panel matte digipak with foil stamp detailing. Includes full lyrics booklet, studio photography, and CD-exclusive bonus acoustic track.",
      category: "music",
      price: 18,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2318181c'/><rect x='80' y='80' width='240' height='240' rx='8' fill='%2322222a' stroke='%23f2fd43' stroke-width='4'/><circle cx='200' cy='200' r='60' fill='%23141418' stroke='%23ffffff' stroke-width='2'/><circle cx='200' cy='200' r='16' fill='%23f2fd43'/><text x='200' y='140' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='18' text-anchor='middle'>KINS // GENESIS</text><text x='200' y='280' fill='%23ffffff' font-family='monospace' font-size='10' text-anchor='middle'>6-PANEL DIGIPAK CD</text></svg>",
        alt: "Genesis CD Digipak"
      },
      variants: [
        { id: "cd-std", name: "Standard 6-Panel CD", inStock: true, sku: "KINS-CD-01" }
      ],
      details: {
        material: "Eco-friendly Recycled Cardstock Digipak"
      },
      featured: false
    },
    {
      id: "kins-music-cassette",
      slug: "genesis-limited-cassette-tape",
      title: "'Genesis' Limited Cassette Tape",
      subtitle: "Smoky Tint Shell • Double-Sided J-Card",
      description: "Smoky translucent cassette shell with neon yellow pad print. Includes full folding J-card with handwritten notes from the band.",
      category: "music",
      price: 15,
      currency: "USD",
      badge: "LIMITED",
      status: "low_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><rect x='60' y='100' width='280' height='180' rx='10' fill='%2322222a' stroke='%23f2fd43' stroke-width='4'/><rect x='110' y='130' width='180' height='80' rx='6' fill='%23141418'/><circle cx='150' cy='170' r='18' fill='%23ffffff'/><circle cx='250' cy='170' r='18' fill='%23ffffff'/><text x='200' y='250' fill='%23f2fd43' font-family='monospace' font-weight='800' font-size='14' text-anchor='middle'>KINS CASSETTE 2026</text></svg>",
        alt: "Genesis Cassette Tape"
      },
      variants: [
        { id: "tape-smk", name: "Smoky Tint Shell (Ltd 200)", inStock: true, sku: "KINS-CAS-01" }
      ],
      details: {
        material: "High-Bias Type II Chrome Tape"
      },
      featured: false
    },
    {
      id: "kins-music-usb-card",
      slug: "kins-audiophile-usb-album-card",
      title: "Kins Metal Credit-Card USB (32GB)",
      subtitle: "24-bit 96kHz Lossless Audio • Multitrack Stems • 4K Live Videos",
      description: "Laser-engraved brushed stainless steel USB card loaded with complete studio stems, 24-bit Hi-Res master files, backstage tour documentary, and high-res art deck.",
      category: "music",
      price: 25,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2318181c'/><rect x='70' y='120' width='260' height='160' rx='8' fill='%23282832' stroke='%23f2fd43' stroke-width='3'/><rect x='90' y='140' width='40' height='30' rx='2' fill='%23f2fd43'/><text x='220' y='190' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='16'>KINS 32GB USB</text><text x='220' y='215' fill='%23a1a1aa' font-family='monospace' font-size='10'>24-BIT / 96KHZ + STEMS</text></svg>",
        alt: "Kins Metal USB Card"
      },
      variants: [
        { id: "usb-32", name: "32GB Brushed Steel Card", inStock: true, sku: "KINS-USB-32" }
      ],
      details: {
        material: "Brushed Steel USB 3.0 Card (32GB)"
      },
      featured: false
    },

    // --------------------------------------------------------------------------
    // 3. SMALL SWAG & LOW-BARRIER IMPULSE BUYS (<$15)
    // --------------------------------------------------------------------------
    {
      id: "kins-swag-stickers",
      slug: "kins-weatherproof-die-cut-sticker-pack",
      title: "Die-Cut Vinyl Sticker 5-Pack",
      subtitle: "Heavy-Duty Vinyl • Waterproof & UV-Resistant",
      description: "5-piece die-cut vinyl sticker pack including the Neon Disc, Brutalist Amp Stack, Band Logotype, and Lyric Badges. Safe for guitar cases, skateboards, and laptops.",
      category: "swag",
      price: 8,
      currency: "USD",
      badge: "POPULAR",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><circle cx='140' cy='150' r='50' fill='%23f2fd43' stroke='%23000000' stroke-width='3'/><rect x='210' y='110' width='120' height='70' rx='6' fill='%2322222a' stroke='%23ffffff' stroke-width='2'/><path d='M130 240 L270 240 L290 310 L110 310 Z' fill='%23f2fd43' stroke='%23000000' stroke-width='3'/><text x='140' y='155' fill='%23000000' font-family='sans-serif' font-weight='900' font-size='12' text-anchor='middle'>KINS</text><text x='200' y='285' fill='%23000000' font-family='sans-serif' font-weight='900' font-size='14' text-anchor='middle'>5-PACK STICKERS</text></svg>",
        alt: "Kins Sticker 5-Pack"
      },
      variants: [
        { id: "stk-5", name: "Standard 5-Pack", inStock: true, sku: "KINS-STK-05" }
      ],
      details: {
        material: "Thick 6mil Waterproof Vinyl"
      },
      featured: true
    },
    {
      id: "kins-swag-pins",
      slug: "kins-hard-enamel-pin-collector-pack",
      title: "Hard Enamel Pin 4-Pack Set",
      subtitle: "Black Nickel Finish • Custom Numbered Backing Card",
      description: "Set of 4 collector hard enamel pins featuring the Neon Disc, Metronome Pendulum, Stage Plot Amp, and Verified Kins Badge.",
      category: "swag",
      price: 14,
      currency: "USD",
      badge: "LIMITED",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2318181c'/><rect x='80' y='80' width='100' height='100' rx='10' fill='%2324242a' stroke='%23f2fd43' stroke-width='3'/><rect x='220' y='80' width='100' height='100' rx='10' fill='%2324242a' stroke='%23f2fd43' stroke-width='3'/><rect x='80' y='220' width='100' height='100' rx='10' fill='%2324242a' stroke='%23f2fd43' stroke-width='3'/><rect x='220' y='220' width='100' height='100' rx='10' fill='%2324242a' stroke='%23f2fd43' stroke-width='3'/><text x='200' y='360' fill='%23ffffff' font-family='sans-serif' font-weight='800' font-size='14' text-anchor='middle'>SET OF 4 ENAMEL PINS</text></svg>",
        alt: "Kins Enamel Pin 4-Pack"
      },
      variants: [
        { id: "pins-4", name: "4-Pack Carded Set", inStock: true, sku: "KINS-PIN-04" }
      ],
      details: {
        material: "Polished Black Nickel with Hard Enamel Infill"
      },
      featured: false
    },
    {
      id: "kins-swag-guitar-picks",
      slug: "kins-custom-guitar-pick-tin-6pack",
      title: "Custom Guitar Pick Tin (6-Pack)",
      subtitle: "0.88mm Delrin Gauges • Slide-Top Collector Tin",
      description: "6 custom-printed guitar picks in assorted stage gauges (0.73mm, 0.88mm, 1.0mm) packed inside a pocket-sized matte black slide-top metal tin.",
      category: "swag",
      price: 10,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><rect x='100' y='100' width='200' height='130' rx='12' fill='%2324242e' stroke='%23f2fd43' stroke-width='3'/><path d='M160 250 L240 250 L200 310 Z' fill='%23f2fd43' stroke='%23000000' stroke-width='3'/><text x='200' y='170' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='16' text-anchor='middle'>KINS GUITAR PICKS</text><text x='200' y='195' fill='%23a1a1aa' font-family='monospace' font-size='11' text-anchor='middle'>6-PACK IN TIN</text></svg>",
        alt: "Kins Guitar Pick Tin"
      },
      variants: [
        { id: "pck-6", name: "6-Pack in Metal Tin", inStock: true, sku: "KINS-PCK-06" }
      ],
      details: {
        material: "Matte Delrin Picks + Stamped Aluminum Slide Tin"
      },
      featured: false
    },
    {
      id: "kins-swag-patch",
      slug: "kins-woven-embroidered-jacket-patch",
      title: "Woven Embroidered Patch",
      subtitle: "4-Inch Width • Iron-On / Sew-On Merrowed Border",
      description: "High-density woven jacket patch with heat-seal iron-on backing and heavy merrowed borders.",
      category: "swag",
      price: 9,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2316161a'/><rect x='80' y='140' width='240' height='120' rx='16' fill='%231e1e26' stroke='%23f2fd43' stroke-width='6'/><text x='200' y='210' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='26' text-anchor='middle'>✦ KINS ✦</text><text x='200' y='235' fill='%23ffffff' font-family='monospace' font-size='10' text-anchor='middle'>WOVEN PATCH</text></svg>",
        alt: "Kins Woven Embroidered Patch"
      },
      variants: [
        { id: "ptch-std", name: "Standard 4\" Patch", inStock: true, sku: "KINS-PTCH-01" }
      ],
      details: {
        material: "100% Polyester Woven Thread with Iron-on Adhesive"
      },
      featured: false
    },
    {
      id: "kins-swag-keychain",
      slug: "kins-flight-tag-bottle-opener-keychain",
      title: "Flight Tag Bottle Opener Keychain",
      subtitle: "Woven Flight Ribbon • Heavy-Duty Steel Opener",
      description: "Dual-sided woven brutalist flight ribbon keychain with solid steel bottle opener clip.",
      category: "swag",
      price: 12,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><circle cx='120' cy='200' r='30' fill='none' stroke='%23f2fd43' stroke-width='6'/><rect x='150' y='180' width='180' height='40' fill='%23f2fd43' stroke='%23000000' stroke-width='3'/><text x='240' y='206' fill='%23000000' font-family='sans-serif' font-weight='900' font-size='14' text-anchor='middle'>KINS CREW</text></svg>",
        alt: "Kins Keychain"
      },
      variants: [
        { id: "key-std", name: "Neon / Black Flight Ribbon", inStock: true, sku: "KINS-KEY-01" }
      ],
      details: {
        material: "Woven Jacquard Ribbon + Stainless Steel Clip"
      },
      featured: false
    },

    // --------------------------------------------------------------------------
    // 4. LIFESTYLE, DRINKWARE & EVERYDAY ACCESSORIES
    // --------------------------------------------------------------------------
    {
      id: "kins-lifestyle-tote",
      slug: "kins-heavyweight-canvas-tote-bag",
      title: "12oz Heavyweight Canvas Tote Bag",
      subtitle: "Reinforced Handles • Inner Zipper Pocket",
      description: "12oz heavy organic cotton canvas tote featuring high-contrast screenprinted Kins artwork. Built with reinforced shoulder straps and an internal zip pocket for phone and picks.",
      category: "lifestyle",
      price: 24,
      currency: "USD",
      badge: "POPULAR",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><path d='M110 150 L290 150 L270 340 L130 340 Z' fill='%23e6e4dc' stroke='%23000000' stroke-width='4'/><path d='M150 150 C150 80, 250 80, 250 150' fill='none' stroke='%23000000' stroke-width='5'/><text x='200' y='240' fill='%23000000' font-family='sans-serif' font-weight='900' font-size='22' text-anchor='middle'>KINS</text><text x='200' y='270' fill='%23000000' font-family='monospace' font-size='10' text-anchor='middle'>12OZ HEAVY CANVAS</text></svg>",
        alt: "Kins Heavyweight Canvas Tote"
      },
      variants: [
        { id: "tote-nat", name: "Natural Ecru / Black Print", inStock: true, sku: "KINS-TOT-NAT" },
        { id: "tote-blk", name: "Washed Black / Neon Print", inStock: true, sku: "KINS-TOT-BLK" }
      ],
      details: {
        material: "100% Heavyweight Organic Cotton Canvas (12oz)"
      },
      featured: true
    },
    {
      id: "kins-lifestyle-koozie",
      slug: "kins-stubby-cooler-koozie-2pack",
      title: "Kins Stubby Cooler / Koozie (2-Pack)",
      subtitle: "Neoprene Insulated • Non-Slip Base",
      description: "Set of 2 high-density neoprene can coolers with contrast Kins typography. Keeps your drink ice-cold at gigs and rehearsals.",
      category: "lifestyle",
      price: 12,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2316161a'/><rect x='130' y='110' width='140' height='190' rx='14' fill='%2322222a' stroke='%23f2fd43' stroke-width='4'/><text x='200' y='200' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='18' text-anchor='middle'>KINS</text><text x='200' y='230' fill='%23ffffff' font-family='monospace' font-size='11' text-anchor='middle'>2-PACK KOOZIE</text></svg>",
        alt: "Kins Koozie 2-Pack"
      },
      variants: [
        { id: "kz-2", name: "2-Pack (Neon + Black)", inStock: true, sku: "KINS-KZ-02" }
      ],
      details: {
        material: "4mm High-Density Neoprene"
      },
      featured: false
    },
    {
      id: "kins-lifestyle-slipmat",
      slug: "kins-12inch-turntable-slipmat-pair",
      title: "12\" Turntable Slipmats (Pair)",
      subtitle: "Glazed Bottom Felt • High-Resolution Heat Transfer",
      description: "Pair of 12-inch professional felt turntable slipmats with heat-glazed bottom for smooth scratching and vinyl playback.",
      category: "lifestyle",
      price: 22,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><circle cx='200' cy='200' r='130' fill='%231e1e24' stroke='%23f2fd43' stroke-width='4'/><circle cx='200' cy='200' r='10' fill='%23f2fd43'/><text x='200' y='160' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='22' text-anchor='middle'>✦ KINS ✦</text><text x='200' y='250' fill='%23ffffff' font-family='monospace' font-size='12' text-anchor='middle'>12\" SLIPMAT PAIR</text></svg>",
        alt: "Kins Turntable Slipmats Pair"
      },
      variants: [
        { id: "slp-pair", name: "Set of 2 Slipmats", inStock: true, sku: "KINS-SLP-02" }
      ],
      details: {
        material: "16oz Glazed Density Felt"
      },
      featured: false
    },
    {
      id: "kins-lifestyle-mug",
      slug: "kins-speckled-enamel-camping-mug",
      title: "Speckled Enamel Studio Mug (12oz)",
      subtitle: "Stainless Steel Rim • Campfire & Dishwasher Safe",
      description: "Retro speckled enamel camping mug with stainless steel rim and wrap-around Kins studio illustrations.",
      category: "lifestyle",
      price: 18,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2316161a'/><path d='M120 130 L260 130 L250 290 L130 290 Z' fill='%23f5f4ef' stroke='%23000000' stroke-width='4'/><path d='M260 160 C300 160, 300 240, 255 250' fill='none' stroke='%23000000' stroke-width='5'/><text x='190' y='210' fill='%23000000' font-family='sans-serif' font-weight='900' font-size='18' text-anchor='middle'>KINS</text></svg>",
        alt: "Kins Enamel Mug"
      },
      variants: [
        { id: "mug-std", name: "12oz Cream Speckle", inStock: true, sku: "KINS-MUG-01" }
      ],
      details: {
        material: "Steel core with ceramic enamel coating"
      },
      featured: false
    },

    // --------------------------------------------------------------------------
    // 5. ART, PRINTS & LIMITED COLLECTIBLES
    // --------------------------------------------------------------------------
    {
      id: "kins-art-tour-poster",
      slug: "kins-2026-screenprinted-tour-poster",
      title: "2026 Screen-Printed Tour Poster (18x24\")",
      subtitle: "Limited to 150 Signed & Numbered • 3-Color French Paper",
      description: "Hand-pulled 3-color screen print on heavyweight 100lb French Paper Speckletone. Hand-numbered and signed by all 4 band members. Shipped rolled in heavy kraft tubes.",
      category: "art",
      price: 35,
      currency: "USD",
      badge: "LIMITED",
      status: "low_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23121216'/><rect x='90' y='60' width='220' height='290' fill='%231e1e24' stroke='%23f2fd43' stroke-width='4'/><text x='200' y='140' fill='%23f2fd43' font-family='serif' font-weight='900' font-size='24' text-anchor='middle'>KINS 2026</text><text x='200' y='180' fill='%23ffffff' font-family='sans-serif' font-weight='800' font-size='14' text-anchor='middle'>WORLD TOUR POSTER</text><text x='200' y='320' fill='%2353fc18' font-family='monospace' font-size='10' text-anchor='middle'>LIMITED EDITION / 150</text></svg>",
        alt: "Kins Screenprinted Tour Poster"
      },
      variants: [
        { id: "pst-sng", name: "Hand-Signed & Numbered", inStock: true, sku: "KINS-PST-SNG" }
      ],
      details: {
        material: "100lb French Paper Speckletone Archival Stock"
      },
      featured: true
    },
    {
      id: "kins-art-photo-zine",
      slug: "kins-studio-recording-journal-zine",
      title: "Studio Recording Journal & Photo Zine",
      subtitle: "48 Pages • 35mm Film Photography • Chord Charts",
      description: "Saddle-stitched 48-page A5 photo zine documenting the complete recording of the 'Genesis' debut album. Includes unreleased 35mm film photos, handwritten lyrics, and guitar chord charts.",
      category: "art",
      price: 20,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%2316161a'/><rect x='100' y='70' width='200' height='270' rx='4' fill='%23f5f4ef' stroke='%23000000' stroke-width='4'/><text x='200' y='160' fill='%23000000' font-family='serif' font-weight='900' font-size='20' text-anchor='middle'>KINS</text><text x='200' y='190' fill='%23000000' font-family='sans-serif' font-weight='800' font-size='12' text-anchor='middle'>STUDIO JOURNAL</text><text x='200' y='220' fill='%23666666' font-family='monospace' font-size='10' text-anchor='middle'>48-PAGE ZINE</text></svg>",
        alt: "Kins Photo Zine"
      },
      variants: [
        { id: "zne-std", name: "48-Page A5 Zine", inStock: true, sku: "KINS-ZNE-01" }
      ],
      details: {
        material: "140GSM Uncoated Recycled Paper"
      },
      featured: false
    },

    // --------------------------------------------------------------------------
    // 6. DIGITAL OFFERINGS & EXPERIENCES
    // --------------------------------------------------------------------------
    {
      id: "kins-digital-tab-book",
      slug: "genesis-complete-instrument-tab-book",
      title: "'Genesis' Complete Tab Book (Guitar/Bass/Drums)",
      subtitle: "Official Band Transcriptions • Guitar Pro & Printable PDF",
      description: "Note-for-note accurate transcriptions of every song on the 'Genesis' LP. Includes standard notation, guitar/bass tablature, drum grooves, and interactive Guitar Pro (.gp) files.",
      category: "digital",
      price: 20,
      currency: "USD",
      badge: "POPULAR",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><rect x='90' y='80' width='220' height='250' rx='6' fill='%231c1c22' stroke='%23f2fd43' stroke-width='4'/><text x='200' y='160' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='18' text-anchor='middle'>OFFICIAL TAB BOOK</text><text x='200' y='190' fill='%23ffffff' font-family='monospace' font-size='11' text-anchor='middle'>GUITAR • BASS • DRUMS</text><text x='200' y='230' fill='%2353fc18' font-family='monospace' font-size='12' text-anchor='middle'>[PDF + GUITAR PRO]</text></svg>",
        alt: "Genesis Tab Book"
      },
      variants: [
        { id: "tab-dl", name: "Instant Digital Download (PDF + GPX)", inStock: true, sku: "KINS-TAB-DIG" }
      ],
      details: {
        shippingInfo: "Delivered instantly to your email after checkout."
      },
      featured: true
    },
    {
      id: "kins-digital-stems-pack",
      slug: "genesis-multitrack-studio-stems-pack",
      title: "'Genesis' Multitrack Studio Stems Pack",
      subtitle: "24-bit 48kHz WAV • Isolated Drums, Bass, Guitars & Vocals",
      description: "Full multitrack stems for all songs on 'Genesis'. Ideal for music producers, remixers, cover artists, and guitarists wanting isolated backing tracks.",
      category: "digital",
      price: 30,
      currency: "USD",
      status: "in_stock",
      images: {
        primary: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'><rect width='400' height='400' fill='%23141416'/><rect x='80' y='90' width='240' height='230' rx='8' fill='%2322222a' stroke='%23f2fd43' stroke-width='4'/><path d='M110 200 L130 160 L150 240 L170 170 L190 230 L210 150 L230 250 L250 180 L270 220 L290 200' fill='none' stroke='%2353fc18' stroke-width='3'/><text x='200' y='140' fill='%23f2fd43' font-family='sans-serif' font-weight='900' font-size='16' text-anchor='middle'>MULTITRACK STEMS</text></svg>",
        alt: "Genesis Studio Stems"
      },
      variants: [
        { id: "stm-dl", name: "Complete Album Stems (24-bit WAV)", inStock: true, sku: "KINS-STM-DIG" }
      ],
      details: {
        shippingInfo: "Delivered via high-speed lossless download link."
      },
      featured: false
    }
  ]
};
