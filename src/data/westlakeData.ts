import {
  ActionPlanProject,
  CorridorPreset,
  HinCorridor,
  IssueCategory,
  Jurisdiction,
  RoadUserType,
  SafetyReport,
  SurveyResponse,
  TimeOfDay,
} from '../types';

export const WESTLAKE_CENTER: [number, number] = [41.4525, -81.9245];

// Verified Westlake municipal boundary polygon (OpenStreetMap)
export const WESTLAKE_BOUNDARY: [number, number][] = [
  [41.41105, -81.97026],
  [41.41375, -81.94626],
  [41.41885, -81.94599],
  [41.41879, -81.94266],
  [41.42624, -81.94279],
  [41.42897, -81.93293],
  [41.43409, -81.9326],
  [41.43395, -81.90336],
  [41.44086, -81.90293],
  [41.44073, -81.89338],
  [41.44797, -81.89306],
  [41.44811, -81.87467],
  [41.47692, -81.8737],
  [41.47804, -81.96945],
  [41.41105, -81.97026],
];

export const CORRIDOR_PRESETS: CorridorPreset[] = [
  { id: 'all', label: 'All Westlake', lat: 41.4525, lng: -81.9245, zoom: 13 },
  { id: 'crocker', label: 'Crocker Park & I-90', lat: 41.463, lng: -81.9505, zoom: 15 },
  { id: 'mills', label: 'Mills & Center Ridge', lat: 41.418107, lng: -81.9686, zoom: 16 },
  { id: 'detroit', label: 'Detroit Rd', lat: 41.4685, lng: -81.918, zoom: 15 },
  { id: 'center_ridge', label: 'Center Ridge Rd', lat: 41.449343, lng: -81.922221, zoom: 15 },
  { id: 'schools', label: 'Hilliard & Schools', lat: 41.4608, lng: -81.9265, zoom: 15 },
];

export const ROAD_USER_META: Record<
  RoadUserType,
  { label: string; shortLabel: string; color: string }
> = {
  pedestrian: { label: 'Pedestrian / Walking', shortLabel: 'Pedestrian', color: '#dc2626' },
  cyclist: { label: 'Bicyclist / Scooter', shortLabel: 'Cyclist', color: '#0284c7' },
  driver: { label: 'Motor Vehicle Driver', shortLabel: 'Driver', color: '#d97706' },
  transit: { label: 'Transit / School Bus', shortLabel: 'Transit/Bus', color: '#7c3aed' },
  mobility: { label: 'Wheelchair / Mobility Aid', shortLabel: 'Mobility Aid', color: '#059669' },
};

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  speeding: 'Speeding / Aggressive Driving',
  difficult_crossing: 'Difficult Pedestrian Crossing',
  driveway_conflict: 'Driveway / Curb-Cut Conflict',
  poor_lighting: 'Poor Nighttime Lighting',
  near_miss: 'Frequent Near-Misses',
  sidewalk_bike_gap: 'Missing Sidewalk or Bike Link',
  signal_timing: 'Traffic Signal / Turn Timing',
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning_rush: 'Morning Rush (7–9 AM)',
  midday: 'Midday (9 AM–3 PM)',
  evening_rush: 'Evening Rush (3–7 PM)',
  night: 'Night / After Dark',
  all_day: 'All Day / Ongoing',
};

/**
 * Lightweight heuristic for the frontend MVP to demonstrate automatic
 * corridor + roadway jurisdiction tagging (RFP Tasks 3 & 7).
 * In Phase 2, this is replaced by a PostGIS spatial join against Westlake's GIS layers.
 */
export function inferLocationContext(
  lat: number,
  lng: number
): { corridorHint: string; jurisdiction: Jurisdiction } {
  // I-90 & Crocker Rd interchange (~41.4682, -81.9510)
  if (Math.hypot(lat - 41.4682, lng - -81.951) < 0.0045) {
    return { corridorHint: 'I-90 & Crocker Rd Interchange', jurisdiction: 'ODOT / State Route' };
  }
  // I-90 & Columbia Rd interchange (~41.4726, -81.9016)
  if (Math.hypot(lat - 41.4726, lng - -81.9016) < 0.005) {
    return { corridorHint: 'I-90 & Columbia Rd (SR-252)', jurisdiction: 'ODOT / State Route' };
  }
  // Mills & Center Ridge (~41.4181, -81.9686)
  if (Math.hypot(lat - 41.4181, lng - -81.9686) < 0.007) {
    return { corridorHint: 'Mills Rd & Center Ridge Rd (US-20)', jurisdiction: 'ODOT / State Route' };
  }
  // Center Ridge Rd (US-20) runs SW-NE across southern Westlake
  if (lat <= 41.451 && lat >= 41.415 && Math.abs(lat - (41.4493 + (lng - -81.9222) * 0.67)) < 0.005) {
    return { corridorHint: 'Center Ridge Rd (US-20)', jurisdiction: 'ODOT / State Route' };
  }
  // Detroit Rd runs across northern Westlake (~41.463–41.474)
  if (lat >= 41.463 && lat <= 41.475) {
    return { corridorHint: 'Detroit Rd Corridor', jurisdiction: 'Cuyahoga County' };
  }
  // Crocker Rd north-south (~ -81.947 to -81.952)
  if (Math.abs(lng - -81.9495) < 0.0055) {
    return { corridorHint: 'Crocker Rd / Crocker Park Area', jurisdiction: 'City of Westlake' };
  }
  // Dover Center Rd (~ -81.922)
  if (Math.abs(lng - -81.922) < 0.0045) {
    return { corridorHint: 'Dover Center Rd', jurisdiction: 'Cuyahoga County' };
  }
  // Clague Rd (~ -81.883)
  if (lng >= -81.89) {
    return { corridorHint: 'Clague Rd Corridor', jurisdiction: 'Cuyahoga County' };
  }
  // Hilliard Blvd & Schools (~41.445–41.463)
  if (lat >= 41.444 && lat <= 41.463) {
    return { corridorHint: 'Hilliard Blvd / Civic & School Zone', jurisdiction: 'City of Westlake' };
  }
  return { corridorHint: 'Neighborhood Street (Westlake)', jurisdiction: 'City of Westlake' };
}

export const SEEDED_REPORTS: SafetyReport[] = [
  {
    id: 'rpt-101',
    lat: 41.468172,
    lng: -81.951007,
    corridorHint: 'I-90 & Crocker Rd Interchange',
    jurisdiction: 'ODOT / State Route',
    userType: 'driver',
    issueCategory: 'near_miss',
    timeOfDay: 'evening_rush',
    description:
      'Heavy weaving between the I-90 eastbound exit ramp and vehicles turning south toward Crocker Park. Queue frequently spills back onto the ramp during evening rush and weekends.',
    upvotes: 24,
    status: 'reviewed',
    comments: [
      {
        id: 'c-1',
        text: 'Happens every Saturday afternoon too—people cut across two lanes right off the ramp.',
        createdAt: '2026-11-12T18:20:00Z',
      },
      {
        id: 'c-2',
        text: 'Better lane markings and advance signage before the ramp split would help a lot.',
        createdAt: '2026-11-14T14:05:00Z',
      },
    ],
    createdAt: '2026-11-10T16:40:00Z',
  },
  {
    id: 'rpt-102',
    lat: 41.418107,
    lng: -81.9686,
    corridorHint: 'Mills Rd & Center Ridge Rd (US-20)',
    jurisdiction: 'ODOT / State Route',
    userType: 'driver',
    issueCategory: 'signal_timing',
    timeOfDay: 'evening_rush',
    description:
      'Left turns onto Center Ridge from Mills Rd have poor sight distance and frequent red-light running. Multiple serious angle crashes here over the last few years.',
    upvotes: 31,
    status: 'included',
    comments: [
      {
        id: 'c-3',
        text: 'Protected left-turn arrows and a longer all-red clearance interval are urgently needed here.',
        createdAt: '2026-11-15T09:10:00Z',
      },
    ],
    createdAt: '2026-11-08T17:15:00Z',
  },
  {
    id: 'rpt-103',
    lat: 41.467588,
    lng: -81.921464,
    corridorHint: 'Detroit Rd & Dover Center Rd',
    jurisdiction: 'Cuyahoga County',
    userType: 'pedestrian',
    issueCategory: 'difficult_crossing',
    timeOfDay: 'midday',
    description:
      'Wide intersection with fast right-turning vehicles on red. Walk phase feels too short for older adults crossing Detroit Rd to reach the medical offices.',
    upvotes: 18,
    status: 'reviewed',
    comments: [
      {
        id: 'c-4',
        text: 'A Leading Pedestrian Interval (LPI) or No Turn on Red during peak hours would make this much safer.',
        createdAt: '2026-11-13T11:42:00Z',
      },
    ],
    createdAt: '2026-11-11T12:05:00Z',
  },
  {
    id: 'rpt-104',
    lat: 41.470449,
    lng: -81.908615,
    corridorHint: 'Detroit Rd Commercial Corridor (26000 Block)',
    jurisdiction: 'Cuyahoga County',
    userType: 'driver',
    issueCategory: 'driveway_conflict',
    timeOfDay: 'midday',
    description:
      'Too many closely spaced commercial driveways along Detroit Rd east of Dover Center. Cars turning left out of strip plazas constantly conflict with two-way left-turn lane traffic.',
    upvotes: 14,
    status: 'new',
    comments: [],
    createdAt: '2026-11-14T13:30:00Z',
  },
  {
    id: 'rpt-105',
    lat: 41.461043,
    lng: -81.928707,
    corridorHint: 'Hilliard Blvd at Westlake High School',
    jurisdiction: 'City of Westlake',
    userType: 'pedestrian',
    issueCategory: 'speeding',
    timeOfDay: 'morning_rush',
    description:
      'Drivers routinely exceed 40 mph along Hilliard Blvd during school drop-off and dismissal. Students crossing near the high school entrance have to wait for multiple cars to stop.',
    upvotes: 22,
    status: 'included',
    comments: [
      {
        id: 'c-5',
        text: 'Flashing RRFB beacons and speed feedback signs would really slow people down during school hours.',
        createdAt: '2026-11-16T08:12:00Z',
      },
    ],
    createdAt: '2026-11-09T07:50:00Z',
  },
  {
    id: 'rpt-106',
    lat: 41.457669,
    lng: -81.949787,
    corridorHint: 'Crocker Rd & Market St (Crocker Park)',
    jurisdiction: 'City of Westlake',
    userType: 'pedestrian',
    issueCategory: 'near_miss',
    timeOfDay: 'night',
    description:
      'Heavy foot traffic between parking garages and restaurants after dark, but vehicles turning off Crocker Rd onto Market St often fail to yield at the marked crosswalks.',
    upvotes: 19,
    status: 'new',
    comments: [],
    createdAt: '2026-11-15T20:15:00Z',
  },
  {
    id: 'rpt-107',
    lat: 41.462465,
    lng: -81.882771,
    corridorHint: 'Hilliard Blvd & Clague Rd (Clague Park)',
    jurisdiction: 'Cuyahoga County',
    userType: 'cyclist',
    issueCategory: 'sidewalk_bike_gap',
    timeOfDay: 'midday',
    description:
      'No dedicated bike facility connecting Clague Park to neighborhoods along Hilliard Blvd and Clague Rd. Cyclists are forced onto narrow travel lanes near the intersection.',
    upvotes: 16,
    status: 'reviewed',
    comments: [],
    createdAt: '2026-11-12T10:30:00Z',
  },
  {
    id: 'rpt-108',
    lat: 41.449343,
    lng: -81.922221,
    corridorHint: 'Center Ridge Rd (US-20) & Dover Center Rd',
    jurisdiction: 'ODOT / State Route',
    userType: 'mobility',
    issueCategory: 'difficult_crossing',
    timeOfDay: 'all_day',
    description:
      'Curb ramps on the northeast corner are steep and collect standing water/slush, making it difficult to cross Center Ridge safely with a power wheelchair or stroller.',
    upvotes: 11,
    status: 'included',
    comments: [],
    createdAt: '2026-11-13T15:45:00Z',
  },
  {
    id: 'rpt-109',
    lat: 41.472551,
    lng: -81.901627,
    corridorHint: 'I-90 & Columbia Rd (SR-252)',
    jurisdiction: 'ODOT / State Route',
    userType: 'cyclist',
    issueCategory: 'near_miss',
    timeOfDay: 'evening_rush',
    description:
      'High-speed freeway on-ramp merge across the sidewalk/bike path on Columbia Rd. Drivers looking left for oncoming traffic rarely check right for people walking or biking.',
    upvotes: 15,
    status: 'new',
    comments: [],
    createdAt: '2026-11-16T17:35:00Z',
  },
  {
    id: 'rpt-110',
    lat: 41.447009,
    lng: -81.948236,
    corridorHint: 'Crocker Rd & Hilliard Blvd (near Rec Center)',
    jurisdiction: 'City of Westlake',
    userType: 'driver',
    issueCategory: 'speeding',
    timeOfDay: 'night',
    description:
      'Long straight stretch along Crocker Rd approaching Hilliard where cut-through traffic accelerates well above the posted limit at night, creating stressful left turns near the Rec Center.',
    upvotes: 9,
    status: 'new',
    comments: [],
    createdAt: '2026-11-17T21:10:00Z',
  },
  {
    id: 'rpt-111',
    lat: 41.46376,
    lng: -81.951329,
    corridorHint: 'Detroit Rd & Crocker Rd',
    jurisdiction: 'Cuyahoga County',
    userType: 'transit',
    issueCategory: 'driveway_conflict',
    timeOfDay: 'morning_rush',
    description:
      'RTA bus stop near the corner has limited waiting space and riders have to walk across wide commercial curb cuts with constant turning traffic.',
    upvotes: 8,
    status: 'new',
    comments: [],
    createdAt: '2026-11-15T08:25:00Z',
  },
  {
    id: 'rpt-112',
    lat: 41.45975,
    lng: -81.921797,
    corridorHint: 'Dover Center Rd & Hilliard Blvd (City Hall Area)',
    jurisdiction: 'Cuyahoga County',
    userType: 'pedestrian',
    issueCategory: 'poor_lighting',
    timeOfDay: 'night',
    description:
      'Evening pedestrians walking between City Hall, nearby neighborhoods, and commercial corners face dim crosswalk lighting during winter rush hour.',
    upvotes: 12,
    status: 'new',
    comments: [],
    createdAt: '2026-11-18T19:00:00Z',
  },
];

export const SEEDED_SURVEYS: SurveyResponse[] = [
  {
    id: 'srv-1',
    primaryMode: 'Personal Vehicle',
    connectionToCity: 'Westlake Resident',
    topPriority: 'Safer major intersections (Crocker, Mills & Center Ridge)',
    zipCode: '44145',
    barriersText: 'Speeding on Hilliard Blvd near the schools makes me hesitant to let my kids bike.',
    createdAt: '2026-11-14T10:15:00Z',
  },
  {
    id: 'srv-2',
    primaryMode: 'Walking & Driving',
    connectionToCity: 'Westlake Resident',
    topPriority: 'Better pedestrian crossings & lighting',
    zipCode: '44145',
    barriersText: 'Crossing Detroit Rd on foot feels intimidating because right-turn drivers rarely stop.',
    createdAt: '2026-11-15T14:20:00Z',
  },
  {
    id: 'srv-3',
    primaryMode: 'Bicycle / Recreation',
    connectionToCity: 'Work in Westlake',
    topPriority: 'Connected bike lanes & multi-use paths',
    zipCode: '44140',
    barriersText: 'Would love a safe bike connection from Bay Village / Detroit Rd down to Crocker Park.',
    createdAt: '2026-11-16T09:05:00Z',
  },
  {
    id: 'srv-4',
    primaryMode: 'Transit / Mobility Aid',
    connectionToCity: 'Westlake Resident',
    topPriority: 'ADA curb ramps & sidewalk continuity',
    zipCode: '44145',
    barriersText: 'Some older curb ramps along Center Ridge Rd are difficult to navigate in winter.',
    createdAt: '2026-11-17T16:40:00Z',
  },
];

export const SAMPLE_HIN_CORRIDORS: HinCorridor[] = [
  {
    id: 'hin-center-ridge',
    name: 'Center Ridge Rd (US-20)',
    tier: 'High Injury',
    jurisdiction: 'ODOT / State Route',
    note: 'RFP priority corridor — Mills & Center Ridge severe crash focus and ADA crossing gaps.',
    coordinates: [
      [41.418107, -81.9686],
      [41.429625, -81.946893],
      [41.449343, -81.922221],
      [41.455989, -81.902228],
      [41.456605, -81.883029],
    ],
  },
  {
    id: 'hin-crocker',
    name: 'Crocker Rd & I-90 Interchange',
    tier: 'High Injury',
    jurisdiction: 'ODOT / State Route',
    note: 'RFP priority corridor — I-90 ramp weaving, Crocker Park pedestrian crossings, and evening speeding.',
    coordinates: [
      [41.468172, -81.951007],
      [41.46376, -81.951329],
      [41.457669, -81.949787],
      [41.447009, -81.948236],
      [41.429625, -81.946893],
    ],
  },
  {
    id: 'hin-detroit',
    name: 'Detroit Rd Commercial Corridor',
    tier: 'Elevated Systemic Risk',
    jurisdiction: 'Cuyahoga County',
    note: 'RFP access management focus — dense commercial curb cuts, turning conflicts, and wide crossings.',
    coordinates: [
      [41.460991, -81.960641],
      [41.46376, -81.951329],
      [41.467588, -81.921464],
      [41.470449, -81.908615],
      [41.470156, -81.901627],
      [41.471454, -81.882405],
    ],
  },
  {
    id: 'hin-hilliard',
    name: 'Hilliard Blvd School & Civic Corridor',
    tier: 'Elevated Systemic Risk',
    jurisdiction: 'City of Westlake',
    note: 'School-zone speeding, student crossings at Westlake High School, and Rec Center / Clague Park bike gaps.',
    coordinates: [
      [41.447009, -81.948236],
      [41.445385, -81.938943],
      [41.461043, -81.928707],
      [41.45975, -81.921797],
      [41.462707, -81.901946],
      [41.462465, -81.882771],
    ],
  },
];

export const ACTION_PLAN_PROJECTS: ActionPlanProject[] = [
  {
    id: 'proj-01',
    title: 'Mills Rd & Center Ridge Rd Intersection Redesign',
    location: 'Mills Rd & Center Ridge Rd (US-20)',
    lat: 41.418107,
    lng: -81.9686,
    problemSummary: 'Severe angle crashes, poor left-turn sight distance, and signal red-light running.',
    countermeasure: 'Protected left-turn phasing, backplates with retroreflective borders, geometric alignment & potential roundabout study.',
    priorityScore: 96,
    estimatedCost: '$1.8M – $2.4M',
    horizon: 'Medium-Term (2–5 yrs)',
    leadAgency: 'ODOT / State Route',
    fundingSources: ['SS4A Implementation Grant', 'ODOT Highway Safety (HSIP)'],
    status: 'Grant Applied',
    linkedReportIds: ['rpt-102'],
  },
  {
    id: 'proj-02',
    title: 'I-90 & Crocker Rd Ramp Weaving & Signal Coordination',
    location: 'I-90 & Crocker Rd Interchange',
    lat: 41.468172,
    lng: -81.951007,
    problemSummary: 'Ramp queue spillback and abrupt lane weaving approaching Crocker Park entrances.',
    countermeasure: 'Advance overhead lane-use signage, adaptive signal timing, and access management turn restrictions.',
    priorityScore: 92,
    estimatedCost: '$1.2M – $1.6M',
    horizon: 'Medium-Term (2–5 yrs)',
    leadAgency: 'ODOT / State Route',
    fundingSources: ['SS4A Implementation Grant', 'ODOT Safety', 'NOACA'],
    status: 'In Design',
    linkedReportIds: ['rpt-101', 'rpt-106'],
  },
  {
    id: 'proj-03',
    title: 'Hilliard Blvd School-Zone Speed & Crossing Package',
    location: 'Hilliard Blvd at Westlake High School',
    lat: 41.461043,
    lng: -81.928707,
    problemSummary: '40+ mph operating speeds during school arrival/dismissal and low driver yield rates.',
    countermeasure: 'Rectangular Rapid Flashing Beacons (RRFBs), dynamic speed feedback signs, high-visibility continental crosswalks.',
    priorityScore: 89,
    estimatedCost: '$180K – $260K',
    horizon: 'Short-Term (0–2 yrs)',
    leadAgency: 'City of Westlake',
    fundingSources: ['Local Capital', 'ODOT Safe Routes to School'],
    status: 'In Design',
    linkedReportIds: ['rpt-105', 'rpt-112'],
  },
  {
    id: 'proj-04',
    title: 'Detroit Rd Access Management & Pedestrian LPIs',
    location: 'Detroit Rd (Crocker Rd to Columbia Rd)',
    lat: 41.467588,
    lng: -81.921464,
    problemSummary: 'Dense commercial curb cuts causing turning conflicts and short pedestrian crossing phases.',
    countermeasure: 'Leading Pedestrian Intervals (LPIs), consolidated driveway aprons, and targeted No Turn on Red signage.',
    priorityScore: 84,
    estimatedCost: '$420K – $650K',
    horizon: 'Short-Term (0–2 yrs)',
    leadAgency: 'Cuyahoga County',
    fundingSources: ['NOACA TLCI / CMAQ', 'Cuyahoga County', 'Local Match'],
    status: 'Planned',
    linkedReportIds: ['rpt-103', 'rpt-104', 'rpt-111'],
  },
  {
    id: 'proj-05',
    title: 'Center Ridge Rd ADA Curb Ramp & Lighting Upgrades',
    location: 'Center Ridge Rd & Dover Center Rd',
    lat: 41.449343,
    lng: -81.922221,
    problemSummary: 'Steep, ponding curb ramps and dim pedestrian lighting along US-20 crossings.',
    countermeasure: 'ADA-compliant truncated dome ramps, drainage re-grading, and infill LED pedestrian-scale lighting.',
    priorityScore: 79,
    estimatedCost: '$240K – $350K',
    horizon: 'Short-Term (0–2 yrs)',
    leadAgency: 'ODOT / State Route',
    fundingSources: ['SS4A Implementation Grant', 'ODOT Systemic Safety'],
    status: 'Planned',
    linkedReportIds: ['rpt-108'],
  },
  {
    id: 'proj-06',
    title: 'Hilliard / Clague Park Multimodal Bike Connection',
    location: 'Hilliard Blvd & Clague Rd to Rec Center',
    lat: 41.462465,
    lng: -81.882771,
    problemSummary: 'Disconnected bike network forcing riders onto narrow travel lanes near parks and I-90.',
    countermeasure: 'Shared-use sidepath extension, green conflict-zone markings at I-90/Columbia ramp, and wayfinding.',
    priorityScore: 74,
    estimatedCost: '$1.4M – $2.1M',
    horizon: 'Long-Term (5+ yrs)',
    leadAgency: 'City of Westlake',
    fundingSources: ['NOACA TAP', 'ODOT Active Transportation', 'Local Capital'],
    status: 'Planned',
    linkedReportIds: ['rpt-107', 'rpt-109', 'rpt-110'],
  },
];
