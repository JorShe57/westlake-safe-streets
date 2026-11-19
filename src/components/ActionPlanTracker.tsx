import { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  Sparkles,
  Target,
  TrendingDown,
} from 'lucide-react';
import {
  ActionPlanProject,
  ImplementationHorizon,
  ProjectPhaseStatus,
  SafetyReport,
} from '../types';
import { ACTION_PLAN_PROJECTS } from '../data/westlakeData';
import { exportActionPlanToCSV } from '../utils/exports';

interface ActionPlanTrackerProps {
  reports: SafetyReport[];
  onLocateProject: (project: ActionPlanProject) => void;
}

const PHASE_CLASS: Record<ProjectPhaseStatus, string> = {
  Planned: 'phase-planned',
  'Grant Applied': 'phase-grant',
  'In Design': 'phase-design',
  Constructed: 'phase-done',
};

export function ActionPlanTracker({ reports, onLocateProject }: ActionPlanTrackerProps) {
  const [horizonFilter, setHorizonFilter] = useState<'all' | ImplementationHorizon>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');

  const filteredProjects = useMemo(() => {
    return ACTION_PLAN_PROJECTS.filter((p) => {
      if (horizonFilter !== 'all' && p.horizon !== horizonFilter) return false;
      if (agencyFilter !== 'all' && p.leadAgency !== agencyFilter) return false;
      return true;
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [horizonFilter, agencyFilter]);

  const getLinkedStats = (project: ActionPlanProject) => {
    const matched = reports.filter((r) => project.linkedReportIds.includes(r.id));
    const confirmations = matched.reduce((sum, r) => sum + r.upvotes, 0);
    return { count: matched.length, confirmations };
  };

  return (
    <div className="admin-shell">
      <div className="admin-header-card">
        <div>
          <span className="admin-eyebrow">
            <Sparkles size={14} /> Phase 2 Preview · Deliverable 6 &amp; Task 8 (2028+)
          </span>
          <h1>Living Safety Action Plan &amp; Annual Progress Tracker</h1>
          <p className="muted-small">
            Shows how this exact platform transitions after 2027 public input into Westlake&apos;s
            permanent <strong>Prioritized Project Database</strong> and{' '}
            <strong>Annual Public Safety Report</strong>—avoiding throwaway consultant tools.
          </p>
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => exportActionPlanToCSV(ACTION_PLAN_PROJECTS, reports)}
          >
            <FileSpreadsheet size={16} />
            <span>Export Project Database (CSV)</span>
          </button>
        </div>
      </div>

      {/* Task 8 Annual Safety Performance Targets (Illustrative Preview) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-navy">
            <Target size={20} />
          </div>
          <div>
            <span className="kpi-label">Long-Term Vision Goal</span>
            <strong className="kpi-value">Zero KSI</strong>
            <span className="kpi-sub">Eliminate fatal &amp; serious injuries</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-green">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="kpi-label">Interim 5-Year Target (Sample)</span>
            <strong className="kpi-value">-35% KSI</strong>
            <span className="kpi-sub">Tracked annually vs. 5-yr ODOT baseline</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-amber">
            <CalendarClock size={20} />
          </div>
          <div>
            <span className="kpi-label">Prioritized Projects</span>
            <strong className="kpi-value">{ACTION_PLAN_PROJECTS.length}</strong>
            <span className="kpi-sub">3 Short-Term · 2 Medium · 1 Long-Term</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-purple">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="kpi-label">Active Grant / Design Pipeline</span>
            <strong className="kpi-value">3 of 6</strong>
            <span className="kpi-sub">SS4A Implementation, ODOT HSIP, NOACA</span>
          </div>
        </div>
      </div>

      {/* Deliverable 6 Prioritized Project Database */}
      <section className="panel-card">
        <div className="table-toolbar">
          <div>
            <h2 id="action-plan-table-heading">
              Prioritized Project &amp; Strategy Database (Deliverable 6 Sample)
            </h2>
            <p className="muted-small">
              Directly links resident confirmations from the Public Safety Map to engineering
              countermeasures, planning-level costs, lead agencies, and grant eligibility.
            </p>
          </div>
          <div className="table-filters">
            <label className="inline-filter">
              <span>Horizon:</span>
              <select
                value={horizonFilter}
                onChange={(e) => setHorizonFilter(e.target.value as 'all' | ImplementationHorizon)}
              >
                <option value="all">All Horizons</option>
                <option value="Short-Term (0–2 yrs)">Short-Term (0–2 yrs)</option>
                <option value="Medium-Term (2–5 yrs)">Medium-Term (2–5 yrs)</option>
                <option value="Long-Term (5+ yrs)">Long-Term (5+ yrs)</option>
              </select>
            </label>
            <label className="inline-filter">
              <span>Lead Agency:</span>
              <select value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)}>
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
          aria-labelledby="action-plan-table-heading"
          className="table-wrapper"
        >
          <table className="civic-table action-plan-table">
            <caption className="visually-hidden">
              Prioritized SS4A safety projects with priority score, countermeasures, cost, agency, and status
            </caption>
            <thead>
              <tr>
                <th scope="col">Project &amp; Countermeasure</th>
                <th scope="col">Score</th>
                <th scope="col">Public Input</th>
                <th scope="col">Lead Agency</th>
                <th scope="col">Est. Cost &amp; Horizon</th>
                <th scope="col">Funding &amp; Status</th>
                <th scope="col">Map</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((proj) => {
                const stats = getLinkedStats(proj);
                return (
                  <tr key={proj.id}>
                    <th scope="row">
                      <div className="table-loc-title">{proj.title}</div>
                      <div className="table-loc-desc">{proj.countermeasure}</div>
                    </th>
                    <td>
                      <span className="score-badge">{proj.priorityScore}</span>
                    </td>
                    <td>
                      <span className="muted-small">
                        <strong>+{stats.confirmations}</strong> votes ({stats.count} pin
                        {stats.count === 1 ? '' : 's'})
                      </span>
                    </td>
                    <td>
                      <span className="jurisdiction-badge">{proj.leadAgency}</span>
                    </td>
                    <td>
                      <strong>{proj.estimatedCost}</strong>
                      <div className="muted-small">{proj.horizon}</div>
                    </td>
                    <td>
                      <span className={`phase-pill ${PHASE_CLASS[proj.status]}`}>
                        {proj.status}
                      </span>
                      <div className="muted-small">{proj.fundingSources.join(' · ')}</div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onLocateProject(proj)}
                      >
                        <MapPin size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
