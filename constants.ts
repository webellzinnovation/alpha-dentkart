
import { Category, Product, PromoBanner, HeroSlide, BrandProfile, User } from "./types";

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge: "Clinic Supplies",
    title: "Premium Dental \nEquipments & Materials",
    subtitle: "UP TO 30% OFF",
    image: "https://placehold.co/1200x800/fbcfe8/DD3B5F?text=Professional+Dental+Equipment",
    bgClass: "bg-pink-50 dark:bg-gray-800",
    gradientClass: "from-pink-50 via-pink-50/80"
  },
  {
    id: 2,
    badge: "Digital Dentistry",
    title: "Advanced Intraoral \nScanners & Imaging",
    subtitle: "STARTING ₹49,999",
    image: "https://placehold.co/1200x800/e0f2fe/0ea5e9?text=Digital+Imaging",
    bgClass: "bg-sky-50 dark:bg-gray-800",
    gradientClass: "from-sky-50 via-sky-50/80"
  },
  {
    id: 3,
    badge: "Hygiene Essentials",
    title: "Premium Sterilization \n& Disposables",
    subtitle: "BUY 2 GET 1 FREE",
    image: "https://placehold.co/1200x800/dcfce7/16a34a?text=Hygiene+Essentials",
    bgClass: "bg-green-50 dark:bg-gray-800",
    gradientClass: "from-green-50 via-green-50/80"
  }
];

export const CATEGORIES: Category[] = [
  { id: 1, name: "Endodontics", iconClass: "fas fa-teeth-open" },
  { id: 2, name: "Restorative", iconClass: "fas fa-fill-drip" },
  { id: 3, name: "Instruments", iconClass: "fas fa-tools" },
  { id: 4, name: "Equipment", iconClass: "fas fa-chair" },
  { id: 5, name: "Disposables", iconClass: "fas fa-box-open" },
  { id: 6, name: "Orthodontics", iconClass: "fas fa-teeth" },
  { id: 7, name: "Prosthetics", iconClass: "fas fa-crown" },
  { id: 8, name: "Burs", iconClass: "fas fa-gem" },
];

export const BRANDS = [
  "3M", "Dentsply", "GC", "Kerr", "Woodpecker", "NSK", "Ivoclar", "Shofu", "Mani", "Coltene", "Meta", "Hu-Friedy", "Zhermack"
];

export const BRAND_PROFILES: BrandProfile[] = [
  {
    id: 1,
    name: "3M",
    logo: "https://placehold.co/200x200/white/DD3B5F?text=3M",
    description: "Science applied to life. Leading manufacturer of dental restoratives and bonding agents.",
    productCount: 45
  },
  {
    id: 2,
    name: "Dentsply",
    logo: "https://placehold.co/200x200/white/003366?text=Dentsply",
    description: "Empowering dental professionals to provide better, safer, and faster dental care.",
    productCount: 62
  },
  {
    id: 3,
    name: "GC",
    logo: "https://placehold.co/200x200/white/0099CC?text=GC",
    description: "Global leader in glass ionomer technology and minimum intervention dentistry.",
    productCount: 38
  },
  {
    id: 4,
    name: "Kerr",
    logo: "https://placehold.co/200x200/white/FF6600?text=Kerr",
    description: "Premier dental consumables manufacturer known for innovation and quality.",
    productCount: 29
  },
  {
    id: 5,
    name: "Woodpecker",
    logo: "https://placehold.co/200x200/white/008000?text=Woodpecker",
    description: "Specialized in high-tech dental medical instruments like scalers and curing lights.",
    productCount: 51
  },
  {
    id: 6,
    name: "NSK",
    logo: "https://placehold.co/200x200/white/333333?text=NSK",
    description: "World's largest manufacturer of rotary dental instruments.",
    productCount: 40
  },
  {
    id: 7,
    name: "Ivoclar",
    logo: "https://placehold.co/200x200/white/6600CC?text=Ivoclar",
    description: "Integrated solutions for high-quality dental applications.",
    productCount: 35
  },
  {
    id: 8,
    name: "Shofu",
    logo: "https://placehold.co/200x200/white/CC0000?text=Shofu",
    description: "Proven products for minimally invasive cosmetic dentistry.",
    productCount: 22
  },
  {
    id: 9,
    name: "Mani",
    logo: "https://placehold.co/200x200/white/000066?text=Mani",
    description: "Japanese precision in surgical and rotary dental instruments.",
    productCount: 18
  },
  {
    id: 10,
    name: "Coltene",
    logo: "https://placehold.co/200x200/white/006699?text=Coltene",
    description: "Smart solutions for the dental practice.",
    productCount: 15
  },
  {
    id: 11,
    name: "Meta",
    logo: "https://placehold.co/200x200/white/990000?text=Meta",
    description: "High quality endodontic materials and equipment.",
    productCount: 12
  },
  {
    id: 12,
    name: "MDI",
    logo: "https://placehold.co/200x200/white/000000?text=MDI",
    description: "Quality dental instruments and consumables.",
    productCount: 8
  },
  {
    id: 13,
    name: "Prevest",
    logo: "https://placehold.co/200x200/white/cc3300?text=Prevest",
    description: "Quality dental materials and chemicals.",
    productCount: 15
  }
];

export const NEW_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "3M Filtek Z250 Universal Composite",
    category: "Restorative",
    brand: "3M",
    price: 3000,
    originalPrice: 3500,
    rating: 5,
    reviews: 42,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=3M+Filtek+Z250",
    badge: "Best Seller",
    badgeColor: "blue",
    timer: "08 : 16 : 30 : 26",
    description: "Filtek™ Z250 XT Universal Restorative is a visible-light accredited, radiopaque, restorative composite. It is designed for use in both anterior and posterior restorations. The filler loading is 82% by weight (60% by volume).",
    features: [
      "Excellent handling characteristics",
      "High wear resistance",
      "Easy to polish",
      "Available in 12 shades",
      "Low shrinkage"
    ],
    specs: {
      "Type": "Microhybrid Composite",
      "Curing": "Light Cure",
      "Weight": "4g Syringe",
      "Shade": "A2, A3, B1"
    },
    attributes: [
      { name: "Shade", options: ["A1", "A2", "A3", "B1", "B2"] },
      { name: "Pack Size", options: ["1 Syringe", "3 Syringes"] }
    ],
    variations: [
      {
        id: "v1",
        attributes: { "Shade": "A1", "Pack Size": "3 Syringes" },
        price: 8500,
        originalPrice: 10500
      }
    ]
  },
  {
    id: 2,
    name: "Woodpecker Endo Motor Gold",
    category: "Equipment",
    brand: "Woodpecker",
    price: 21000,
    originalPrice: 25000,
    rating: 4.5,
    reviews: 18,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Endo+Motor",
    timer: "09 : 12 : 45 : 11",
    description: "The Woodpecker Endo Motor Gold comes with an integrated apex locator. It features a brushless motor with high performance and long service life. The 360° rotatable contra-angle allows easier access to different teeth.",
    features: [
      "Integrated Apex Locator",
      "Brushless Motor",
      "360° Rotatable Head",
      "OLED Display",
      "Wireless Charging"
    ],
    specs: {
      "Speed Range": "100-2500 rpm",
      "Torque": "0.4-5.0 N.cm",
      "Battery": "2000mAh",
      "Warranty": "1 Year"
    }
  },
  {
    id: 3,
    name: "Dentsply Protaper Gold Files",
    category: "Endodontics",
    brand: "Dentsply",
    price: 3800,
    originalPrice: 4600,
    rating: 5,
    reviews: 156,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Protaper+Gold",
    badge: "Sale",
    badgeColor: "green",
    timer: "01 : 04 : 22 : 00",
    description: "ProTaper Gold files are manufactured with advanced metallurgy that provides greater flexibility and resistance to cyclic fatigue than ProTaper Universal files. The files have the same geometry as ProTaper Universal.",
    features: [
      "Increased Flexibility",
      "Higher Cyclic Fatigue Resistance",
      "Progressive Taper",
      "Short Handle for Better Access",
      "Pre-sterilized"
    ],
    specs: {
      "Material": "NiTi Gold Alloy",
      "Length": "21mm, 25mm",
      "Pack Size": "6 Files",
      "System": "Rotary"
    },
    attributes: [
      { name: "Length", options: ["21mm", "25mm", "31mm"] },
      { name: "Size", options: ["SX", "S1", "S2", "F1", "F2", "F3", "Assorted"] }
    ]
  },
  {
    id: 4,
    name: "NSK Pana Max Handpiece",
    category: "Equipment",
    brand: "NSK",
    price: 7200,
    rating: 4,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=NSK+Handpiece",
    description: "Pana-Max is the latest of NSK's popular PANA series. Every feature is engineered to deliver performance vs. cost ratio, thus offering higher reliability and endurance.",
    specs: {
      "Speed": "380,000-450,000 min-1",
      "Head Size": "Standard",
      "Water Spray": "Single Spray",
      "Body Material": "Stainless Steel"
    },
    attributes: [
      { name: "Connection", options: ["2-Hole", "4-Hole"] },
      { name: "Head Type", options: ["Standard Head", "Torque Head", "Mini Head"] }
    ]
  },
  {
    id: 5,
    name: "GC Gold Label 9 Cement",
    category: "Restorative",
    brand: "GC",
    price: 2400,
    rating: 5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=GC+Gold+Label",
    description: "Packable glass ionomer restorative. It is the gold standard for high strength wear resistant posterior restorations.",
    features: [
      "High wear resistance",
      "Packable consistency",
      "Fluoride release",
      "Chemical bonding"
    ],
    attributes: [
      { name: "Pack Type", options: ["1-1 Pack", "Mini Pack"] }
    ]
  },
  {
    id: 6,
    name: "Kerr OptiBond Universal",
    category: "Restorative",
    brand: "Kerr",
    price: 5500,
    rating: 4.5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Kerr+OptiBond",
    description: "Single-component light cure adhesive. OptiBond™ Universal is a single-component light cure adhesive, providing excellent adhesion to a variety of surfaces and substrates for direct and indirect applications."
  }
];

export const RESTORATIVE_PRODUCTS: Product[] = [
  {
    id: 101,
    name: "3M Filtek Ultimate Syringe",
    category: "Restorative",
    brand: "3M",
    price: 4600,
    rating: 5,
    reviews: 124,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=3M+Filtek+Ult",
    description: "Universal restorative with true nanofiller technology. Excellent polish retention and aesthetics.",
    attributes: [
      { name: "Shade", options: ["A1B", "A2B", "A3B", "A3.5B", "B1B", "B2B", "C2B"] }
    ]
  },
  {
    id: 102,
    name: "Ivoclar Te-Econom Flow",
    category: "Restorative",
    brand: "Ivoclar",
    price: 1800,
    rating: 4.5,
    reviews: 88,
    badge: "New",
    badgeColor: "green",
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Ivoclar+Flow",
    description: "Flowable light-curing radiopaque hybrid composite. Ideal for small cavities and lining.",
    attributes: [
      { name: "Shade", options: ["A1", "A2", "A3", "B2"] }
    ]
  },
  {
    id: 103,
    name: "Shofu Beautifil II",
    category: "Restorative",
    brand: "Shofu",
    price: 2700,
    rating: 4,
    reviews: 56,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Shofu+Beautifil",
    description: "Giomer based fluoride releasing aesthetic dental composite material.",
    attributes: [
      { name: "Shade", options: ["A1", "A2", "A3", "A3.5", "B1", "B2"] }
    ]
  },
  {
    id: 104,
    name: "Dentsply Spectrum Composite",
    category: "Restorative",
    brand: "Dentsply",
    price: 2200,
    rating: 4,
    reviews: 210,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Dentsply+Spectrum",
    attributes: [
      { name: "Shade", options: ["A1", "A2", "A3", "A3.5", "B1", "B2", "C2", "Opaque A2"] }
    ]
  },
  {
    id: 105,
    name: "3M Scotchbond Universal Adhesive",
    category: "Restorative",
    brand: "3M",
    price: 4500,
    rating: 5,
    reviews: 89,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=3M+Scotchbond",
    description: "Single-bottle adhesive solution for all direct and indirect indications."
  }
];

export const ENDO_PRODUCTS: Product[] = [
  {
    id: 201,
    name: "Apex Locator Woodpecker",
    category: "Endodontics",
    brand: "Woodpecker",
    price: 15000,
    originalPrice: 18500,
    rating: 4.5,
    reviews: 45,
    badge: "-18%",
    badgeColor: "red",
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Apex+Locator",
    description: "Highly precise apex locator with colorful LCD screen and folding design."
  },
  {
    id: 202,
    name: "K-Files Mani (Pack of 6)",
    category: "Endodontics",
    brand: "Mani",
    price: 750,
    rating: 5,
    reviews: 342,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Mani+K-Files",
    description: "High quality stainless steel hand files with excellent cutting efficiency.",
    attributes: [
      { name: "Length", options: ["21mm", "25mm"] },
      { name: "Size", options: ["#08", "#10", "#15", "#20", "#25", "#30", "#35", "#40", "Assorted 15-40"] }
    ]
  },
  {
    id: 203,
    name: "Hyflex EDM Files Coltene",
    category: "Endodontics",
    brand: "Coltene",
    price: 5500,
    rating: 5,
    reviews: 28,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Hyflex+EDM",
    description: "NiTi files with controlled memory effect and extreme fracture resistance.",
    attributes: [
      { name: "Sequence", options: ["Shaping Set", "Finishing Set"] },
      { name: "Length", options: ["21mm", "25mm"] }
    ]
  },
  {
    id: 204,
    name: "Paper Points Meta",
    category: "Endodontics",
    brand: "Meta",
    price: 900,
    rating: 4,
    reviews: 112,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Paper+Points",
    attributes: [
      { name: "Taper", options: ["0.02", "0.04", "0.06"] },
      { name: "Size", options: ["15", "20", "25", "30", "35", "40", "Assorted"] }
    ]
  },
  {
    id: 205,
    name: "Dentsply AH Plus Sealer",
    category: "Endodontics",
    brand: "Dentsply",
    price: 6800,
    rating: 5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=AH+Plus",
    description: "Resin-based root canal sealer with excellent radiopacity and dimensional stability."
  }
];

export const EQUIPMENT_PRODUCTS: Product[] = [
  {
    id: 301,
    name: "LED Curing Light Woodpecker",
    category: "Equipment",
    brand: "Woodpecker",
    price: 3800,
    rating: 4.5,
    reviews: 156,
    badge: "Popular",
    badgeColor: "purple",
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Curing+Light",
    attributes: [
      { name: "Color", options: ["Silver", "Black"] }
    ]
  },
  {
    id: 302,
    name: "Ultrasonic Scaler UDS-J",
    category: "Equipment",
    brand: "Woodpecker",
    price: 10000,
    rating: 4.5,
    reviews: 67,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Ultrasonic+Scaler"
  },
  {
    id: 303,
    name: "Marathon Micromotor Control Box",
    category: "Equipment",
    price: 8000,
    rating: 4,
    reviews: 89,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Micromotor"
  },
  {
    id: 304,
    name: "Dental Loupes 3.5x",
    category: "Equipment",
    price: 12500,
    rating: 5,
    reviews: 23,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Dental+Loupes",
    attributes: [
      { name: "Working Distance", options: ["320-420mm", "420-520mm"] },
      { name: "Frame Color", options: ["Black", "Silver", "Red", "Blue"] }
    ]
  }
];

// --- NEW CATEGORIES ---

export const INSTRUMENT_PRODUCTS: Product[] = [
  {
    id: 401,
    name: "Diagnostic Set (Mirror, Probe, Tweezer)",
    category: "Instruments",
    brand: "Hu-Friedy",
    price: 1200,
    rating: 4.5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Diagnostic+Set",
    description: "Premium stainless steel diagnostic kit containing mouth mirror, explorer/probe, and tweezers.",
    attributes: [{ name: "Handle Type", options: ["Round", "Octagonal"] }]
  },
  {
    id: 402,
    name: "Extraction Forceps (Set of 12)",
    category: "Instruments",
    brand: "GDC",
    price: 8500,
    rating: 4,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Forceps+Set",
    description: "Complete set of anatomical extraction forceps for upper and lower arch."
  },
  {
    id: 403,
    name: "Composite Teflon Instrument Kit",
    category: "Instruments",
    brand: "GDC",
    price: 3200,
    rating: 5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Teflon+Kit",
    description: "Non-stick teflon coated instruments for easy composite placement and sculpting."
  }
];

export const DISPOSABLE_PRODUCTS: Product[] = [
  {
    id: 501,
    name: "Latex Examination Gloves (Box of 100)",
    category: "Disposables",
    brand: "Generic",
    price: 450,
    rating: 4.5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Gloves",
    description: "Powdered latex examination gloves with excellent tactile sensitivity.",
    attributes: [{ name: "Size", options: ["XS", "S", "M", "L"] }]
  },
  {
    id: 502,
    name: "Face Masks 3-Ply (Box of 50)",
    category: "Disposables",
    brand: "Generic",
    price: 250,
    rating: 4,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Face+Masks",
    description: "High filtration efficiency 3-ply surgical face masks with ear loops.",
    attributes: [{ name: "Color", options: ["Blue", "Green", "Pink"] }]
  },
  {
    id: 503,
    name: "Saliva Ejectors (Pack of 100)",
    category: "Disposables",
    brand: "Generic",
    price: 350,
    rating: 4,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Saliva+Ejectors",
    description: "Flexible saliva ejectors with non-removable bonded tips."
  }
];

export const ORTHO_PRODUCTS: Product[] = [
  {
    id: 601,
    name: "Metal Brackets Kit MBT 022",
    category: "Orthodontics",
    brand: "3M",
    price: 1500,
    rating: 4.5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Brackets+Kit",
    description: "Complete metal bracket kit 5-5 upper and lower with hooks on 3,4,5."
  },
  {
    id: 602,
    name: "NiTi Archwires (Pack of 10)",
    category: "Orthodontics",
    brand: "Ortho Organizers",
    price: 800,
    rating: 4,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=NiTi+Wires",
    attributes: [{ name: "Size", options: ["012", "014", "016", "016x022", "019x025"] }, { name: "Arch", options: ["Upper", "Lower"] }]
  }
];

export const PROSTHETICS_PRODUCTS: Product[] = [
  {
    id: 701,
    name: "Zhermack Tropicalgin Alginate",
    category: "Prosthetics",
    brand: "Zhermack",
    price: 550,
    rating: 5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Alginate",
    description: "Chromatic alginate impression material with mango flavor. Fast setting."
  },
  {
    id: 702,
    name: "Addition Silicone Putty & Light",
    category: "Prosthetics",
    brand: "Zhermack",
    price: 3500,
    rating: 4.5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Silicone+Kit",
    description: "High precision addition silicone impression material kit."
  }
];

export const BUR_PRODUCTS: Product[] = [
  {
    id: 801,
    name: "Mani Diamond Burs (Pack of 5)",
    category: "Burs",
    brand: "Mani",
    price: 350,
    rating: 4.5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Diamond+Burs",
    description: "High cutting efficiency diamond burs for cavity preparation.",
    attributes: [{ name: "Shape", options: ["BR-41", "BR-45", "TF-12", "SF-11", "WR-13"] }]
  },
  {
    id: 802,
    name: "SS White Carbide Burs",
    category: "Burs",
    brand: "SS White",
    price: 600,
    rating: 5,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Carbide+Burs",
    description: "Tungsten carbide burs for efficient cutting of enamel and amalgam.",
    attributes: [{ name: "Type", options: ["Round", "Inverted Cone", "Fissure"] }]
  }
];

export const PROMOS: PromoBanner[] = [
  {
    id: 1,
    title: "High Speed Airotor Handpiece",
    subtitle: "Ceramic Bearings",
    price: "FROM ₹7,500",
    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Airotor",
    bgColorClass: "bg-cyan-50 dark:bg-gray-800",
    tag: "Clinic Essential",
    tagColorClass: "text-cyan-600"
  },
  {
    id: 2,
    title: "Composite Restoration Kit",
    subtitle: "Complete Set",
    price: "FROM ₹16,900",
    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Composite+Kit",
    bgColorClass: "bg-teal-50 dark:bg-gray-800",
    tag: "Bundle Deal",
    tagColorClass: "text-teal-600"
  },
  {
    id: 3,
    title: "Digital Apex Locator V5",
    subtitle: "Precision Measurement",
    price: "FROM ₹12,500",
    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Apex+Locator",
    bgColorClass: "bg-sky-50 dark:bg-gray-800",
    tag: "New Arrival",
    tagColorClass: "text-sky-600"
  }
];

export const ALL_PRODUCTS: Product[] = [
  ...BUR_PRODUCTS,
  {
    id: 901,
    name: "Prevest DenPro Micron Luting Cement",
    category: "Restorative",
    brand: "Prevest",
    price: 1200,
    rating: 4.5,
    reviews: 32,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Luting+Cement",
    description: "Glass ionomer luting cement for crowns, bridges, inlays, and onlays."
  },
  {
    id: 902,
    name: "MDI Surgical Scalpel Blades",
    category: "Instruments",
    brand: "MDI",
    price: 850,
    rating: 4,
    reviews: 15,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Scalpel+Blades",
    description: "Stainless steel surgical blades for precision dental procedures."
  },
  {
    id: 903,
    name: "Zhermack Occlufast Rock",
    category: "Prosthetics",
    brand: "Zhermack",
    price: 2800,
    rating: 5,
    reviews: 24,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Occlufast",
    description: "Fast-setting addition silicone for bite registration."
  },
  {
    id: 904,
    name: "3M RelyX U200 Self-Adhesive Cement",
    category: "Restorative",
    brand: "3M",
    price: 6500,
    rating: 5,
    reviews: 56,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=RelyX+U200",
    description: "Universal self-adhesive resin cement for high strength bonding."
  },
  {
    id: 905,
    name: "NSK S-Max M95L Increase Head",
    category: "Equipment",
    brand: "NSK",
    price: 45000,
    rating: 5,
    reviews: 8,
    image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=NSK+S-Max",
    description: "Optic speed increasing handpiece for precise clinical work."
  }
];

export const MOCK_USER: User = {
  name: "Dr. Anjali Sharma",
  email: "anjali.sharma@example.com",
  phone: "+91 98765 43210",
  avatar: "https://placehold.co/200x200/DD3B5F/white?text=AS",
  userType: "dental-doctor",
  registrationDate: new Date().toISOString(),
  isVerified: true,
  verificationStatus: "approved",
  addresses: [
    {
      id: 1,
      type: "Clinic",
      name: "Smile Care Dental Clinic",
      street: "123 Healthcare Ave, Sector 15",
      city: "Noida",
      state: "Uttar Pradesh",
      zip: "201301",
      phone: "+91 98765 43210",
      isDefault: true
    },
    {
      id: 2,
      type: "Home",
      name: "Anjali Sharma",
      street: "B-402, Green Valley Apts",
      city: "New Delhi",
      state: "Delhi",
      zip: "110025",
      phone: "+91 99887 76655",
      isDefault: false
    }
  ],
  orders: [
    {
      id: "ORD-2023-1001",
      date: "Oct 15, 2023",
      status: "Delivered",
      total: 12500,
      customerName: "Dr. Anjali Sharma",
      items: [
        { name: "3M Filtek Z250", quantity: 2, price: 3000 },
        { name: "NSK Pana Max", quantity: 1, price: 6500 }
      ]
    },
    {
      id: "ORD-2023-1024",
      date: "Oct 28, 2023",
      status: "Processing",
      total: 4500,
      customerName: "Dr. Anjali Sharma",
      items: [
        { name: "Dentsply Protaper Gold", quantity: 1, price: 3800 },
        { name: "K-Files Mani", quantity: 1, price: 700 }
      ]
    },
    {
      id: "ORD-2023-1105",
      date: "Nov 05, 2023",
      status: "Shipped",
      total: 21000,
      customerName: "Dr. Anjali Sharma",
      items: [
        { name: "Woodpecker Endo Motor", quantity: 1, price: 21000 }
      ]
    }
  ],
  cart: [
    {
      id: 101,
      name: "3M Filtek Ultimate Syringe",
      category: "Restorative",
      brand: "3M",
      price: 4600,
      rating: 5,
      reviews: 124,
      image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=3M+Filtek+Ult",
      description: "Universal restorative with true nanofiller technology. Excellent polish retention and aesthetics.",
      cartItemId: "101-Shade:A1B",
      quantity: 2,
      selectedAttributes: { "Shade": "A1B" }
    }
  ],
  wishlist: [
    {
      id: 201,
      name: "Apex Locator Woodpecker",
      category: "Endodontics",
      brand: "Woodpecker",
      price: 15000,
      originalPrice: 18500,
      rating: 4.5,
      reviews: 45,
      badge: "-18%",
      badgeColor: "red",
      image: "https://placehold.co/300x300/e2e8f0/DD3B5F?text=Apex+Locator",
      description: "Highly precise apex locator with colorful LCD screen and folding design."
    }
  ]
};
