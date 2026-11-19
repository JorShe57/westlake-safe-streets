import { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  MapPin,
  RotateCcw,
  Shield,
  ThumbsUp,
  Users,
  ClipboardList,
} from 'lucide-react';
import { ReportStatus, SafetyReport, SurveyResponse } from '../types';
import { ISSUE_CATEGORY_LABELS, ROAD_USER_META } from '../data/westlakeData';
import { exportReportsToCSV, exportReportsToGeoJSON } from '../utils/exports';

interface EngineeringPortalProps {
  reports: SafetyReport[];
  surveys: SurveyResponse[];
  onUpdateStatus: (reportId: string, status: ReportStatus) => void;
  onViewOnMap: (report: SafetyReport) => void;
  onResetDemo: () => void;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  included: 'Included in Plan',
  hidden: 'Hidden / Flagged',
};

export function EngineeringPortal({
  reports,
  surveys,
  onUpdateStatus,
  onViewOnMap,
  onResetDemo,
}: EngineeringPortalProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');

  const activeReports = useMemo(
    () => reports.filter((r) => r.status !== 'hidden'),
    [reports]
  );

  const totalConfirmations = useMemo(
    () => activeReports.reduce((sum, r) => sum + r.upvotes, 0),
    [activeReports]
  );

  const vulnerablePercent = useMemo(() => {
    if (activeReports.length === 0) return 0;
    const count = activeReports.filter((r) =>
      ['pedestrian', 'cyclist', 'mobility', 'transit'].includes(r.userType)
    ).length;
    return Math.round((count / activeReports.length) * 100);
  }, [activeReports]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    activeReports.forEach((r) => {
      const label = ISSUE_CATEGORY_LABELS[r.issueCategory];
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeReports]);

  const topHotspots = useMemo(
    () => [...activeReports].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5),
    [activeReports]
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (jurisdictionFilter !== 'all' && r.jurisdiction !== jurisdictionFilter) return false;
      return true;
    });
  }, [reports, statusFilter, jurisdictionFilter]);

  return (
    <div className="admin-shell">
      <div className="admin-header-card">
        <div>
          <span className="admin-eyebrow">
            <Shield size={14} /> City of Westlake Engineering & SS4A Consultant Portal
          </span>
          <h1>Public Input Analytics & GIS Export Hub</h1>
          <p className="muted-small">
            Directly supports <strong>Deliverable 4</strong> (Engagement Summary),{' '}
            <strong>Deliverable 9</strong> (GIS Layers), and <strong>Task 3/7</strong> jurisdiction
            screening (City vs. County vs. ODOT).
          </p>
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => exportReportsToGeoJSON(activeReports)}
          >
            <Download size={16} />
            <span>Export GeoJSON (ArcGIS / QGIS)</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => exportReportsToCSV(reports)}
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV (Public Records)</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onResetDemo}
            title="Restore original Westlake demo pins"
          >
            <RotateCcw size={15} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-navy">
            <MapPin size={20} />
          </div>
          <div>
            <span className="kpi-label">Active Safety Pins</span>
            <strong className="kpi-value">{activeReports.length}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-green">
            <ThumbsUp size={20} />
          </div>
          <div>
            <span className="kpi-label">Resident Confirmations</span>
            <strong className="kpi-value">{totalConfirmations}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-amber">
            <Users size={20} />
          </div>
          <div>
            <span className="kpi-label">Vulnerable Road Users</span>
            <strong className="kpi-value">{vulnerablePercent}%</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-purple">
            <ClipboardList size={20} />
          </div>
          <div>
            <span className="kpi-label">Equity Survey Responses</span>
            <strong className="kpi-value">{surveys.length}</strong>
          </div>
        </div>
      </div>

      {/* Charts / Summary Row */}
      <div className="analytics-grid">
        <section className="panel-card">
          <h2>Top Resident-Confirmed Hotspots</h2>
          <ol className="hotspot-list">
            {topHotspots.map((r) => (
              <li key={r.id} className="hotspot-item">
                <div>
                  <strong>{r.corridorHint}</strong>
                  <span className="muted-small">
                    {ISSUE_CATEGORY_LABELS[r.issueCategory]} · {r.jurisdiction}
                  </span>
                </div>
                <div className="hotspot-right">
                  <span className="upvote-pill">+{r.upvotes}</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => onViewOnMap(r)}
                  >
                    Map
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel-card">
          <h2>Reported Concerns by Category</h2>
          <div className="bar-chart">
            {categoryBreakdown.map((item) => {
              const pct = activeReports.length
                ? Math.round((item.count / activeReports.length) * 100)
                : 0;
              return (
                <div key={item.label} className="bar-row">
                  <div className="bar-label-row">
                    <span>{item.label}</span>
                    <strong>
                      {item.count} ({pct}%)
                    </strong>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Responsive Moderation & Jurisdiction Table (Modern Web Guidance: responsive-table) */}
      <section className="panel-card">
        <div className="table-toolbar">
          <div>
            <h2 id="moderation-table-heading">Submissions Triage & Jurisdiction Log</h2>
            <p className="muted-small">
              Track review status for the Engagement Summary (&ldquo;You Said &rarr; We Did&rdquo;)
              and filter by responsible roadway agency.
            </p>
          </div>
          <div className="table-filters">
            <label className="inline-filter">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | ReportStatus)}
              >
                <option value="all">All ({reports.length})</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="included">Included in Plan</option>
                <option value="hidden">Hidden / Flagged</option>
              </select>
            </label>
            <label className="inline-filter">
              <span>Jurisdiction:</span>
              <select
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
              >
                <option value="all">All Agencies</option>
                <option value="City of Westlake">City of Westlake</option>
                <option value="Cuyahoga County">Cuyahoga County</option>
                <option value="ODOT / State Route">ODOT / State Route</option>
              </select>
            </label>
          </div>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="moderation-table-heading"
          className="table-wrapper"
        >
          <table className="civic-table">
            <caption className="visually-hidden">
              Westlake SS4A public safety input submissions with jurisdiction and review status
            </caption>
            <thead>
              <tr>
                <th scope="col">Location / Corridor</th>
                <th scope="col">Jurisdiction</th>
                <th scope="col">Road User</th>
                <th scope="col">Concern</th>
                <th scope="col">Confirmations</th>
                <th scope="col">Review Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id} className={r.status === 'hidden' ? 'row-hidden' : ''}>
                  <th scope="row">
                    <div className="table-loc-title">{r.corridorHint}</div>
                    <div className="table-loc-desc">{r.description}</div>
                  </th>
                  <td>
                    <span className="jurisdiction-badge">{r.jurisdiction}</span>
                  </td>
                  <td>
                    <span
                      className="user-type-badge"
                      style={{ background: ROAD_USER_META[r.userType].color }}
                    >
                      {ROAD_USER_META[r.userType].shortLabel}
                    </span>
                  </td>
                  <td>{ISSUE_CATEGORY_LABELS[r.issueCategory]}</td>
                  <td>
                    <strong>+{r.upvotes}</strong>
                  </td>
                  <td>
                    <select
                      aria-label={`Review status for ${r.corridorHint}`}
                      className={`status-select status-${r.status}`}
                      value={r.status}
                      onChange={(e) => onUpdateStatus(r.id, e.target.value as ReportStatus)}
                    >
                      {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewOnMap(r)}
                    >
                      Locate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
