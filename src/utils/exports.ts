import { ActionPlanProject, SafetyReport } from '../types';
import { ISSUE_CATEGORY_LABELS, ROAD_USER_META, TIME_OF_DAY_LABELS } from '../data/westlakeData';

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all non-hidden (or filtered) reports as RFC 7946 GeoJSON
 * ready for ArcGIS Pro / QGIS overlay with ODOT crash data & HIN (Deliverable 9).
 */
export function exportReportsToGeoJSON(reports: SafetyReport[]) {
  const featureCollection = {
    type: 'FeatureCollection',
    name: 'Westlake_SS4A_Public_Safety_Input',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    generated_at: new Date().toISOString(),
    features: reports.map((r) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(r.lng.toFixed(6)), Number(r.lat.toFixed(6))],
      },
      properties: {
        id: r.id,
        corridor_hint: r.corridorHint,
        jurisdiction: r.jurisdiction,
        road_user_type: ROAD_USER_META[r.userType].label,
        issue_category: ISSUE_CATEGORY_LABELS[r.issueCategory],
        time_of_day: TIME_OF_DAY_LABELS[r.timeOfDay],
        description: r.description,
        confirmations_upvotes: r.upvotes,
        comments_count: r.comments.length,
        review_status: r.status,
        submitted_at: r.createdAt,
      },
    })),
  };

  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerDownload(
    JSON.stringify(featureCollection, null, 2),
    `westlake-ss4a-public-input-${dateStamp}.geojson`,
    'application/geo+json;charset=utf-8'
  );
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports reports as RFC 4180 CSV for Excel analysis & Ohio public records compliance.
 */
export function exportReportsToCSV(reports: SafetyReport[]) {
  const headers = [
    'Report ID',
    'Submitted At',
    'Status',
    'Corridor / Location',
    'Probable Jurisdiction',
    'Latitude',
    'Longitude',
    'Road User Type',
    'Issue Category',
    'Time of Day',
    'Confirmations (+1)',
    'Comments Count',
    'Description',
  ];

  const rows = reports.map((r) => [
    r.id,
    r.createdAt,
    r.status,
    r.corridorHint,
    r.jurisdiction,
    r.lat.toFixed(6),
    r.lng.toFixed(6),
    ROAD_USER_META[r.userType].label,
    ISSUE_CATEGORY_LABELS[r.issueCategory],
    TIME_OF_DAY_LABELS[r.timeOfDay],
    r.upvotes,
    r.comments.length,
    r.description,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerDownload(
    csvContent,
    `westlake-ss4a-public-input-${dateStamp}.csv`,
    'text/csv;charset=utf-8'
  );
}

/**
 * Exports Deliverable 6: Prioritized Project and Strategy Database as CSV.
 */
export function exportActionPlanToCSV(projects: ActionPlanProject[], reports: SafetyReport[]) {
  const headers = [
    'Project ID',
    'Priority Score',
    'Project Title',
    'Location',
    'Problem Summary',
    'Proposed Countermeasure',
    'Estimated Cost',
    'Timeframe / Horizon',
    'Lead Agency',
    'Funding Opportunities',
    'Status',
    'Linked Resident Confirmations',
  ];

  const rows = projects.map((p) => {
    const linkedConfirmations = reports
      .filter((r) => p.linkedReportIds.includes(r.id))
      .reduce((sum, r) => sum + r.upvotes, 0);

    return [
      p.id,
      p.priorityScore,
      p.title,
      p.location,
      p.problemSummary,
      p.countermeasure,
      p.estimatedCost,
      p.horizon,
      p.leadAgency,
      p.fundingSources.join('; '),
      p.status,
      linkedConfirmations,
    ];
  });

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerDownload(
    csvContent,
    `westlake-ss4a-prioritized-projects-${dateStamp}.csv`,
    'text/csv;charset=utf-8'
  );
}
