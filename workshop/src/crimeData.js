export const mockIncidents = [
  {
    id: "crm-001",
    title: "Bicycle Theft Reported",
    category: "Theft",
    date: "2026-07-28",
    time: "14:15",
    location: "Main Library Bike Racks",
    coordinates: [37.42745, -122.1704],
    threatLevel: "low",
    description: "A student reported a locked blue mountain bike stolen during study hours. Security camera footage is under review.",
    resolved: false
  },
  {
    id: "crm-002",
    title: "Vandalism & Graffiti",
    category: "Vandalism",
    date: "2026-07-27",
    time: "23:40",
    location: "Dormitory Alpha West Wall",
    coordinates: [37.42625, -122.1708],
    threatLevel: "low",
    description: "Spray paint vandalism reported on the outer concrete facade. Facilities crew dispatched for cleanup.",
    resolved: true
  },
  {
    id: "crm-003",
    title: "Suspicious Loitering",
    category: "Suspicious",
    date: "2026-07-29",
    time: "02:10",
    location: "Engineering Lab Parking Lot B",
    coordinates: [37.42845, -122.1686],
    threatLevel: "medium",
    description: "Individual spotted trying car door handles. Security patrol responded but the suspect fled northbound.",
    resolved: false
  },
  {
    id: "crm-004",
    title: "Verbal Altercation",
    category: "Assault",
    date: "2026-07-25",
    time: "19:00",
    location: "Student Center Plaza",
    coordinates: [37.42735, -122.1690],
    threatLevel: "medium",
    description: "Dispute between two individuals resolved by campus safety officers. No physical injuries reported.",
    resolved: true
  },
  {
    id: "crm-005",
    title: "Trespassing at Solar Farm",
    category: "Suspicious",
    date: "2026-07-29",
    time: "21:30",
    location: "Solar Farm Perimeter Fence",
    coordinates: [37.42845, -122.1672],
    threatLevel: "high",
    description: "Intruder detected climbing security fencing. Campus police dispatched. Suspect detained for questioning.",
    resolved: false
  }
];

// Fully Lit Blue-light Security Escort Paths (safe paths)
export const safePaths = [
  {
    name: "North-South Main Escort Path",
    coordinates: [
      [37.42845, -122.1704], // Science Hall
      [37.42735, -122.1704], // Library
      [37.42625, -122.1704], // Dorm A
      [37.42625, -122.1690]  // Dorm B
    ]
  },
  {
    name: "East-West Academic Corridor",
    coordinates: [
      [37.42845, -122.1704], // Science Hall
      [37.42845, -122.1690], // Engineering
      [37.42845, -122.1676]  // Solar Farm
    ]
  }
];
