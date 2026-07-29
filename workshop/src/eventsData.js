export const initialEvents = [
  {
    id: "evt-001",
    title: "ElectroWave Summer Festival 2026",
    category: "Concerts",
    date: "2026-08-15",
    time: "18:00",
    venue: "Starlight Amphitheater, Los Angeles",
    coordinates: [34.0522, -118.2437],
    description: "Experience the ultimate night of electronic dance music featuring top international DJs, state-of-the-art laser shows, and immersive art installations. Live the music, feel the beat, and dance under the summer stars.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    featured: true,
    organizer: "Pulse Entertainment Group",
    tiers: {
      general: { name: "General Admission", price: 65, capacity: 1500, sold: 1240 },
      vip: { name: "VIP Lounge Access", price: 150, capacity: 300, sold: 285 },
      backstage: { name: "All-Access Pass (Backstage)", price: 350, capacity: 50, sold: 45 }
    },
    itinerary: [
      { time: "18:00", title: "Gates Open & Warm-up Set" },
      { time: "19:30", title: "DJ Nova - Deep House Set" },
      { time: "21:00", title: "Aetheria Live - AudioVisual Experience" },
      { time: "23:00", title: "Headliner: Hyperion - Laser & Pyro Grand Finale" }
    ],
    performers: [
      { name: "DJ Nova", role: "Special Guest DJ", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
      { name: "Aetheria", role: "Live Synthesist duo", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
      { name: "Hyperion", role: "Headlining Producer", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
    ],
    popularity: 9.8
  },
  {
    id: "evt-002",
    title: "Global Tech Summit & AI Hackathon",
    category: "Tech",
    date: "2026-09-10",
    time: "09:00",
    venue: "Metropolitan Convention Center, San Francisco",
    coordinates: [37.7749, -122.4194],
    description: "Join developers, designers, and entrepreneurs for a 3-day deep dive into Next-Gen AI, decentralized apps, and quantum computing. Network with industry leaders, participate in workshops, and pitch your ideas for major prizes.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    featured: false,
    organizer: "InnovateX Lab",
    tiers: {
      general: { name: "Conference Pass", price: 120, capacity: 800, sold: 520 },
      vip: { name: "Full Summit & VIP Dinners", price: 299, capacity: 150, sold: 98 },
      backstage: { name: "VIP + Hackathon VIP Mentor Lounge", price: 499, capacity: 30, sold: 18 }
    },
    itinerary: [
      { time: "09:00", title: "Keynote Speech: The Future of Cognitive Agents" },
      { time: "11:00", title: "Panel Discussion: Ethics & Security in Generative Tech" },
      { time: "14:00", title: "Hands-on Workshop: Vector Databases & LLM Orchestration" },
      { time: "16:30", title: "AI Startup Showcase & Networking Mixer" }
    ],
    performers: [
      { name: "Dr. Elara Vance", role: "AI Research Lead at Google DeepMind", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80" },
      { name: "Marcus Thorne", role: "Founder, NeuroWeb Corp", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" }
    ],
    popularity: 9.2
  },
  {
    id: "evt-003",
    title: "Vanguard Modern Art Exhibition",
    category: "Arts",
    date: "2026-08-28",
    time: "10:00",
    venue: "Prism Contemporary Art Museum, New York",
    coordinates: [40.7128, -74.0060],
    description: "Explore boundary-pushing contemporary art including immersive augmented reality galleries, digital sculptures, and avant-garde physical installations from emerging global visionaries.",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80",
    featured: false,
    organizer: "Vanguard Arts Collective",
    tiers: {
      general: { name: "General Admission", price: 25, capacity: 500, sold: 340 },
      vip: { name: "Preview Night & Curator Tour", price: 75, capacity: 100, sold: 92 },
      backstage: { name: "VIP + Gala Dinner with the Artists", price: 200, capacity: 25, sold: 22 }
    },
    itinerary: [
      { time: "10:00", title: "Museum Gates Open" },
      { time: "11:30", title: "Guided Curatorial Exhibition Tour" },
      { time: "14:00", title: "Interactive Workshop: AI Art Co-Creation" },
      { time: "17:00", title: "Q&A Forum with Featured Artists" }
    ],
    performers: [
      { name: "Sora Takahashi", role: "Digital Media Artist", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
      { name: "Zayd Miller", role: "Eco-Sculptor", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" }
    ],
    popularity: 8.7
  },
  {
    id: "evt-004",
    title: "Eco-Luxe Culinary & Craft Expo",
    category: "Sports",
    date: "2026-09-05",
    time: "11:00",
    venue: "Verdant Fields Winery, Napa Valley",
    coordinates: [38.2976, -122.2869],
    description: "A premium farm-to-table culinary festival bringing together Michelin-starred chefs, biodynamic organic winemakers, and local artisanal crafters for a weekend of sensory delight.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    featured: false,
    organizer: "Savor Earth Org",
    tiers: {
      general: { name: "Tasting Pass", price: 80, capacity: 400, sold: 310 },
      vip: { name: "Grand Tasting & Masterclass", price: 180, capacity: 120, sold: 115 },
      backstage: { name: "Private Wine Cellar Tasting & Dinner", price: 400, capacity: 20, sold: 19 }
    },
    itinerary: [
      { time: "11:00", title: "Opening Toast & Tasting Pavilions Open" },
      { time: "13:00", title: "Masterclass: Biodynamic Wine Pairing" },
      { time: "15:30", title: "Cooking Demonstration by Chef Helene" },
      { time: "18:00", title: "Sunset Acoustic Concert & Bonfire" }
    ],
    performers: [
      { name: "Chef Helene Laurent", role: "3 Michelin-Star Chef", avatar: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=150&q=80" },
      { name: "Dimitri Markov", role: "Master Sommelier", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80" }
    ],
    popularity: 9.0
  },
  {
    id: "evt-005",
    title: "NextGen Esports Championship",
    category: "Sports",
    date: "2026-09-20",
    time: "14:00",
    venue: "CyberArena Coliseum, Chicago",
    coordinates: [41.8781, -87.6298],
    description: "Watch the world's elite pro gaming teams battle for supremacy in dynamic VR arena shooters and strategy titles. Complete with high-adrenaline live shoutcasting, cosplay contests, and tech demo booths.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    featured: false,
    organizer: "Esports Premier League",
    tiers: {
      general: { name: "Spectator Ticket", price: 40, capacity: 2000, sold: 1780 },
      vip: { name: "Floor Seating & Merch Pack", price: 110, capacity: 400, sold: 392 },
      backstage: { name: "Pro Gamer Meet-n-Greet & Lounge Pass", price: 250, capacity: 50, sold: 48 }
    },
    itinerary: [
      { time: "14:00", title: "Pre-Show Analytics & Opening Ceremony" },
      { time: "15:00", title: "Semi-Finals: Team Apex vs. Team Titan" },
      { time: "18:00", title: "Cosplay Parade & Fan Showcase" },
      { time: "20:00", title: "Grand Final Match & Award Ceremony" }
    ],
    performers: [
      { name: "Shax (David Miller)", role: "Esports Shoutcaster", avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80" },
      { name: "Valkyrie (Kim SEO-jun)", role: "Professional Cosplayer", avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&w=150&q=80" }
    ],
    popularity: 9.5
  }
];
