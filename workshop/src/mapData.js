export const CAMPUS_CENTER = [37.4275, -122.1697];

export const buildingsData = [
  {
    id: "science_hall",
    name: "Science Hall",
    type: "academic",
    coordinates: [
      [37.4282, -122.1708],
      [37.4287, -122.1708],
      [37.4287, -122.1700],
      [37.4282, -122.1700]
    ],
    center: [37.42845, -122.1704],
    floors: 4,
    yearBuilt: 2015,
    areaSqFt: 45000,
    maxOccupancy: 350,
    solarCapacity: 75, // kW
    baseEnergy: 120, // kW base load
    defaultHVAC: 22.0,
    description: "Multi-disciplinary science research and teaching facility equipped with smart chemical hoods and specialized laboratories."
  },
  {
    id: "engineering_lab",
    name: "Engineering Lab",
    type: "academic",
    coordinates: [
      [37.4282, -122.1694],
      [37.4287, -122.1694],
      [37.4287, -122.1686],
      [37.4282, -122.1686]
    ],
    center: [37.42845, -122.1690],
    floors: 3,
    yearBuilt: 2018,
    areaSqFt: 38000,
    maxOccupancy: 280,
    solarCapacity: 50,
    baseEnergy: 140, // Higher base load due to computer servers and heavy machines
    defaultHVAC: 21.5,
    description: "Advanced engineering center housing robotics, clean rooms, computer engineering labs, and the campus local server hub."
  },
  {
    id: "main_library",
    name: "Main Library",
    type: "academic",
    coordinates: [
      [37.4271, -122.1708],
      [37.4276, -122.1708],
      [37.4276, -122.1700],
      [37.4271, -122.1700]
    ],
    center: [37.42735, -122.1704],
    floors: 5,
    yearBuilt: 2002,
    areaSqFt: 62000,
    maxOccupancy: 600,
    solarCapacity: 120,
    baseEnergy: 90,
    defaultHVAC: 21.0,
    description: "Central repository of literature and media, featuring quiet zones, group study suites, and historical archives with sensitive environmental controls."
  },
  {
    id: "student_center",
    name: "Student Center",
    type: "recreational",
    coordinates: [
      [37.4271, -122.1694],
      [37.4276, -122.1694],
      [37.4276, -122.1686],
      [37.4271, -122.1686]
    ],
    center: [37.42735, -122.1690],
    floors: 2,
    yearBuilt: 2012,
    areaSqFt: 32000,
    maxOccupancy: 450,
    solarCapacity: 60,
    baseEnergy: 80,
    defaultHVAC: 22.5,
    description: "The heart of student life, featuring dining areas, student council offices, recreation lounges, and indoor gathering areas."
  },
  {
    id: "dormitory_a",
    name: "Dormitory A (West)",
    type: "residential",
    coordinates: [
      [37.4293, -122.1712],
      [37.4298, -122.1712],
      [37.4298, -122.1704],
      [37.4293, -122.1704]
    ],
    center: [37.42955, -122.1708],
    floors: 4,
    yearBuilt: 2010,
    areaSqFt: 50000,
    maxOccupancy: 200,
    solarCapacity: 40,
    baseEnergy: 60,
    defaultHVAC: 22.0,
    description: "Co-ed residential hall featuring smart lighting, energy-efficient laundering rooms, and individual climate zone controls."
  },
  {
    id: "dormitory_b",
    name: "Dormitory B (East)",
    type: "residential",
    coordinates: [
      [37.4293, -122.1690],
      [37.4298, -122.1690],
      [37.4298, -122.1682],
      [37.4293, -122.1682]
    ],
    center: [37.42955, -122.1686],
    floors: 4,
    yearBuilt: 2011,
    areaSqFt: 50000,
    maxOccupancy: 200,
    solarCapacity: 40,
    baseEnergy: 60,
    defaultHVAC: 22.0,
    description: "Residential hall supporting student living, with integrated smart showers and automated common room occupancy controls."
  },
  {
    id: "athletic_arena",
    name: "Athletic Arena",
    type: "recreational",
    coordinates: [
      [37.4258, -122.1712],
      [37.4264, -122.1712],
      [37.4264, -122.1700],
      [37.4258, -122.1700]
    ],
    center: [37.4261, -122.1706],
    floors: 2,
    yearBuilt: 2008,
    areaSqFt: 75000,
    maxOccupancy: 1200,
    solarCapacity: 150,
    baseEnergy: 100,
    defaultHVAC: 20.0,
    description: "Multi-sport arena, gymnasium, and indoor swimming pool equipped with variable-frequency ventilation systems and heavy water recycling."
  },
  {
    id: "solar_farm",
    name: "Solar Farm & Utility Grid",
    type: "utility",
    coordinates: [
      [37.4258, -122.1692],
      [37.4264, -122.1692],
      [37.4264, -122.1680],
      [37.4258, -122.1680]
    ],
    center: [37.4261, -122.1686],
    floors: 1,
    yearBuilt: 2021,
    areaSqFt: 25000,
    maxOccupancy: 15,
    solarCapacity: 450, // Massive solar array
    baseEnergy: 15, // Low power draw, mostly exports
    defaultHVAC: 18.0, // Server cooling for grid controllers
    description: "Central smart grid utility node containing high-capacity battery storage banks, solar trackers, and power inverters."
  }
];
