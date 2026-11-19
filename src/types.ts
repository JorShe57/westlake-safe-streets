export type RoadUserType =
  | 'pedestrian'
  | 'cyclist'
  | 'driver'
  | 'transit'
  | 'mobility';

export type IssueCategory =
  | 'speeding'
  | 'difficult_crossing'
  | 'driveway_conflict'
  | 'poor_lighting'
  | 'near_miss'
  | 'sidewalk_bike_gap'
  | 'signal_timing';

export type TimeOfDay =
  | 'morning_rush'
  | 'midday'
  | 'evening_rush'
  | 'night'
  | 'all_day';

export type Jurisdiction =
  | 'City of Westlake'
  | 'ODOT / State Route'
  | 'Cuyahoga County';

export type ReportStatus = 'new' | 'reviewed' | 'included' | 'hidden';

export interface ReportComment {
  id: string;
  text: string;
  createdAt: string;
}

export interface SafetyReport {
  id: string;
  lat: number;
  lng: number;
  corridorHint: string;
  jurisdiction: Jurisdiction;
  userType: RoadUserType;
  issueCategory: IssueCategory;
  timeOfDay: TimeOfDay;
  description: string;
  photoDataUrl?: string;
  upvotes: number;
  status: ReportStatus;
  comments: ReportComment[];
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  primaryMode: string;
  connectionToCity: string;
  topPriority: string;
  zipCode: string;
  barriersText: string;
  createdAt: string;
}

export interface CorridorPreset {
  id: string;
  label: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface HinCorridor {
  id: string;
  name: string;
  tier: 'High Injury' | 'Elevated Systemic Risk';
  jurisdiction: Jurisdiction;
  note: string;
  coordinates: [number, number][];
}

export type ImplementationHorizon = 'Short-Term (0–2 yrs)' | 'Medium-Term (2–5 yrs)' | 'Long-Term (5+ yrs)';

export type ProjectPhaseStatus = 'Planned' | 'Grant Applied' | 'In Design' | 'Constructed';

export interface ActionPlanProject {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  problemSummary: string;
  countermeasure: string;
  priorityScore: number;
  estimatedCost: string;
  horizon: ImplementationHorizon;
  leadAgency: Jurisdiction;
  fundingSources: string[];
  status: ProjectPhaseStatus;
  linkedReportIds: string[];
}

