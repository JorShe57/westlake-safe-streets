import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  Crosshair,
  Filter,
  Layers,
  LocateFixed,
  Map as MapIcon,
  MapPinPlus,
  QrCode,
  Route,
  Search,
  ShieldCheck,
  ThumbsUp,
  X,
} from 'lucide-react';
import {
  ActionPlanProject,
  IssueCategory,
  ReportStatus,
  RoadUserType,
  SafetyReport,
  SurveyResponse,
} from './types';
import {
  CORRIDOR_PRESETS,
  ISSUE_CATEGORY_LABELS,
  ROAD_USER_META,
  SEEDED_REPORTS,
  SEEDED_SURVEYS,
} from './data/westlakeData';
import { SafetyMap } from './components/SafetyMap';
import { ReportFormDialog } from './components/ReportFormDialog';
import { ReportDetailDialog } from './components/ReportDetailDialog';
import { CommunitySurveyPage } from './components/CommunitySurveyPage';
import { QrCodeDialog } from './components/QrCodeDialog';
import { EngineeringPortal } from './components/EngineeringPortal';
import { ActionPlanTracker } from './components/ActionPlanTracker';

const STORAGE_KEYS = {
  reports: 'westlake_ss4a_reports_v2',
  upvotes: 'westlake_ss4a_upvotes_v2',
  surveys: 'westlake_ss4a_surveys_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'survey' | 'engineering' | 'tracker'>('map');
  const [reports, setReports] = useState<SafetyReport[]>(() =>
    loadFromStorage(STORAGE_KEYS.reports, SEEDED_REPORTS)
  );
  const [upvotedIds, setUpvotedIds] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.upvotes, [])
  );
  const [surveys, setSurveys] = useState<SurveyResponse[]>(() =>
    loadFromStorage(STORAGE_KEYS.surveys, SEEDED_SURVEYS)
  );

  // Map UI states
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [showHinLayer, setShowHinLayer] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeCorridorId, setActiveCorridorId] = useState<string>('all');
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    nonce: number;
  } | null>(null);

  // Address Search & GPS
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; label: string } | null>(
    null
  );

  // Filters
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | RoadUserType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategory>('all');

  // Modals & toast
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    } catch {
      // ignore storage quota errors for large photos
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.upvotes, JSON.stringify(upvotedIds));
    } catch {
      // ignore
    }
  }, [upvotedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.surveys, JSON.stringify(surveys));
    } catch {
      // ignore
    }
  }, [surveys]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3600);
  }, []);

  const visibleReports = useMemo(() => {
    return reports
      .filter((r) => r.status !== 'hidden')
      .filter((r) => (userTypeFilter === 'all' ? true : r.userType === userTypeFilter))
      .filter((r) => (categoryFilter === 'all' ? true : r.issueCategory === categoryFilter))
      .sort((a, b) => b.upvotes - a.upvotes);
  }, [reports, userTypeFilter, categoryFilter]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  const handleCorridorClick = (preset: (typeof CORRIDOR_PRESETS)[number]) => {
    setActiveCorridorId(preset.id);
    setSearchPin(null);
    setFlyToTarget({ lat: preset.lat, lng: preset.lng, zoom: preset.zoom, nonce: Date.now() });
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const fullQuery = /westlake/i.test(q) ? q : `${q}, Westlake, OH`;
      const url =
        'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&searchExtent=-81.98,41.40,-81.86,41.49&SingleLine=' +
        encodeURIComponent(fullQuery);
      const res = await fetch(url);
      const data = await res.json();
      const candidate = data?.candidates?.[0];

      if (candidate && candidate.score >= 70) {
        const lat = candidate.location.y;
        const lng = candidate.location.x;
        setSearchPin({ lat, lng, label: candidate.address });
        setFlyToTarget({ lat, lng, zoom: 16, nonce: Date.now() });
      } else {
        showToast('Location not found in Westlake. Try an intersection like "Bradley & Detroit".');
      }
    } catch {
      showToast('Search unavailable right now. You can click directly on the map instead.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const inWestlakeArea = lat >= 41.39 && lat <= 41.51 && lng >= -82.02 && lng <= -81.82;
        if (!inWestlakeArea) {
          showToast('Your current GPS is outside Westlake — click any spot on the map to test.');
          return;
        }
        setSearchPin({ lat, lng, label: 'Your current GPS location' });
        setFlyToTarget({ lat, lng, zoom: 16, nonce: Date.now() });
      },
      () => {
        showToast('Location permission denied. You can search an address or click the map.');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleMapPickLocation = useCallback((lat: number, lng: number) => {
    setIsPinDropMode(false);
    setSearchPin(null);
    setPickedLocation({ lat, lng });
  }, []);

  const handleSubmitReport = (
    payload: Omit<SafetyReport, 'id' | 'upvotes' | 'status' | 'comments' | 'createdAt'>
  ) => {
    const newReport: SafetyReport = {
      ...payload,
      id: `rpt-${Date.now().toString(36)}`,
      upvotes: 1,
      status: 'new',
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    setUpvotedIds((prev) => [...prev, newReport.id]);
    setPickedLocation(null);
    setSearchPin(null);
    setFlyToTarget({ lat: newReport.lat, lng: newReport.lng, zoom: 16, nonce: Date.now() });
    showToast('Safety pin added to the Westlake map! Ready for GeoJSON export.');
  };

  const handleUpvote = (reportId: string) => {
    if (upvotedIds.includes(reportId)) return;
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r))
    );
    setUpvotedIds((prev) => [...prev, reportId]);
    showToast('Confirmation (+1) recorded.');
  };

  const handleAddComment = (reportId: string, text: string) => {
    const newComment = {
      id: `c-${Date.now().toString(36)}`,
      text,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, comments: [...r.comments, newComment] } : r
      )
    );
  };

  const handleUpdateStatus = (reportId: string, status: ReportStatus) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    showToast('Submission review status updated.');
  };

  const handleViewOnMap = (report: SafetyReport) => {
    setActiveTab('map');
    setUserTypeFilter('all');
    setCategoryFilter('all');
    setSelectedReportId(report.id);
    setFlyToTarget({ lat: report.lat, lng: report.lng, zoom: 16, nonce: Date.now() });
  };

  const handleLocateProject = (project: ActionPlanProject) => {
    setActiveTab('map');
    setShowHinLayer(true);
    setFlyToTarget({ lat: project.lat, lng: project.lng, zoom: 15, nonce: Date.now() });
    showToast(`Showing ${project.title} with sample HIN overlay enabled.`);
  };

  const handleSubmitSurvey = (payload: Omit<SurveyResponse, 'id' | 'createdAt'>) => {
    const newSurvey: SurveyResponse = {
      ...payload,
      id: `srv-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setSurveys((prev) => [newSurvey, ...prev]);
  };

  const handleResetDemo = () => {
    setReports(SEEDED_REPORTS);
    setUpvotedIds([]);
    setSurveys(SEEDED_SURVEYS);
    showToast('Demo data restored to original Westlake sample pins.');
  };

  return (
    <div className="app-shell">
      {/* Top Civic Header */}
      <header className="top-nav">
        <div className="brand-group">
          <div className="brand-mark" aria-hidden="true">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-title">Westlake Safe Streets</span>
              <span className="demo-badge">SS4A Prototype</span>
            </div>
            <p className="brand-subtitle">
              City of Westlake, Ohio · Department of Engineering Public Input Hub
            </p>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Primary views">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'map' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('map')}
            aria-current={activeTab === 'map' ? 'page' : undefined}
          >
            <MapIcon size={16} />
            <span>Public Safety Map</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'survey' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('survey')}
            aria-current={activeTab === 'survey' ? 'page' : undefined}
          >
            <ClipboardList size={16} />
            <span>Community Survey</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'engineering' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('engineering')}
            aria-current={activeTab === 'engineering' ? 'page' : undefined}
          >
            <BarChart3 size={16} />
            <span>Engineering &amp; GIS</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'tracker' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('tracker')}
            aria-current={activeTab === 'tracker' ? 'page' : undefined}
          >
            <Route size={16} />
            <span>Action Plan Tracker</span>
            <span className="tab-pill">2028+</span>
          </button>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="btn btn-nav-outline"
            onClick={() => setQrOpen(true)}
            title="Show printable QR code for public meetings"
          >
            <QrCode size={15} />
            <span className="hide-sm">QR Flyer</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-area">
        {activeTab === 'map' ? (
          <div className="map-workspace">
            {/* Left Sidebar */}
            <aside className="map-sidebar" aria-label="Safety concern controls and list">
              <div className="sidebar-cta-box">
                <button
                  type="button"
                  className={`btn btn-block ${
                    isPinDropMode ? 'btn-cancel-drop' : 'btn-primary btn-lg'
                  }`}
                  onClick={() => setIsPinDropMode((v) => !v)}
                >
                  {isPinDropMode ? (
                    <>
                      <X size={18} />
                      <span>Cancel Pin Placement</span>
                    </>
                  ) : (
                    <>
                      <MapPinPlus size={18} />
                      <span>Report a Safety Concern</span>
                    </>
                  )}
                </button>

                {/* Address / Intersection Search + GPS */}
                <form onSubmit={handleAddressSearch} className="search-row">
                  <label htmlFor="westlake-search" className="visually-hidden">
                    Search an intersection or address in Westlake
                  </label>
                  <div className="search-input-wrap">
                    <Search size={15} className="search-icon" aria-hidden="true" />
                    <input
                      id="westlake-search"
                      type="search"
                      placeholder="Search intersection (e.g. Bradley & Detroit)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? '…' : 'Go'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleUseMyLocation}
                    title="Use my current GPS location"
                    aria-label="Use my current GPS location"
                  >
                    <LocateFixed size={15} />
                  </button>
                </form>
              </div>

              {/* Corridor Quick-Jumps */}
              <div className="sidebar-section">
                <h2 className="section-label">Jump to Focus Corridor</h2>
                <div className="corridor-chips">
                  {CORRIDOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`corridor-chip ${
                        activeCorridorId === preset.id ? 'is-active' : ''
                      }`}
                      onClick={() => handleCorridorClick(preset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tappable Multiple-Choice Filters (Mobile-Friendly, No Dropdowns) */}
              <div className="sidebar-section">
                <h2 className="section-label">
                  <Filter size={13} /> Filter Map ({visibleReports.length} pins)
                </h2>
                <div className="filter-group">
                  <span className="filter-sublabel">Road User</span>
                  <div className="corridor-chips" role="group" aria-label="Filter by road user">
                    <button
                      type="button"
                      className={`corridor-chip ${userTypeFilter === 'all' ? 'is-active' : ''}`}
                      onClick={() => setUserTypeFilter('all')}
                    >
                      All
                    </button>
                    {(Object.keys(ROAD_USER_META) as RoadUserType[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`corridor-chip ${userTypeFilter === key ? 'is-active' : ''}`}
                        onClick={() => setUserTypeFilter(key)}
                      >
                        <span
                          className="chip-dot-sm"
                          style={{ background: ROAD_USER_META[key].color }}
                        />
                        {ROAD_USER_META[key].shortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <span className="filter-sublabel">Concern Type</span>
                  <div className="corridor-chips" role="group" aria-label="Filter by concern type">
                    <button
                      type="button"
                      className={`corridor-chip ${categoryFilter === 'all' ? 'is-active' : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      All
                    </button>
                    {(Object.keys(ISSUE_CATEGORY_LABELS) as IssueCategory[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={`corridor-chip ${categoryFilter === key ? 'is-active' : ''}`}
                        onClick={() => setCategoryFilter(key)}
                      >
                        {ISSUE_CATEGORY_LABELS[key].split(' / ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scrollable Report Feed */}
              <div className="sidebar-feed" aria-label="Submitted safety concerns">
                {visibleReports.length === 0 ? (
                  <p className="empty-state">No pins match the current filters.</p>
                ) : (
                  visibleReports.map((report) => {
                    const meta = ROAD_USER_META[report.userType];
                    return (
                      <button
                        key={report.id}
                        type="button"
                        className={`feed-card ${
                          selectedReportId === report.id ? 'is-selected' : ''
                        }`}
                        onClick={() => {
                          setSelectedReportId(report.id);
                          setFlyToTarget({
                            lat: report.lat,
                            lng: report.lng,
                            zoom: 16,
                            nonce: Date.now(),
                          });
                        }}
                      >
                        <div className="feed-card-top">
                          <span
                            className="user-type-badge"
                            style={{ background: meta.color }}
                          >
                            {meta.shortLabel}
                          </span>
                          <span className="feed-upvotes">
                            <ThumbsUp size={12} /> {report.upvotes}
                          </span>
                        </div>
                        <strong className="feed-card-title">{report.corridorHint}</strong>
                        <span className="feed-card-issue">
                          {ISSUE_CATEGORY_LABELS[report.issueCategory]}
                        </span>
                        <p className="feed-card-desc">{report.description}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Map Viewport */}
            <section className="map-stage" aria-label="Interactive Map">
              {/* Sample High-Injury Network (HIN) Overlay Toggle */}
              <div className="map-overlay-controls">
                <button
                  type="button"
                  className={`hin-toggle-btn ${showHinLayer ? 'is-active' : ''}`}
                  onClick={() => setShowHinLayer((v) => !v)}
                  aria-pressed={showHinLayer}
                >
                  <Layers size={15} />
                  <span>{showHinLayer ? 'HIN Corridors: ON' : 'Show Sample HIN Corridors'}</span>
                </button>
              </div>

              {isPinDropMode && (
                <div className="pin-drop-banner" role="status">
                  <Crosshair size={18} />
                  <span>
                    <strong>Pin Placement Active:</strong> Click anywhere on the Westlake map to
                    report a traffic safety concern.
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsPinDropMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {searchPin && !isPinDropMode && (
                <div className="search-result-banner" role="status">
                  <span>
                    <strong>Found:</strong> {searchPin.label}
                  </span>
                  <div className="search-banner-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setPickedLocation({ lat: searchPin.lat, lng: searchPin.lng });
                        setSearchPin(null);
                      }}
                    >
                      <MapPinPlus size={14} />
                      <span>Report Here</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Dismiss search location"
                      onClick={() => setSearchPin(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <SafetyMap
                reports={visibleReports}
                isPinDropMode={isPinDropMode}
                showHinLayer={showHinLayer}
                searchPin={searchPin}
                flyToTarget={flyToTarget}
                selectedReportId={selectedReportId}
                onSelectReport={(r) => setSelectedReportId(r.id)}
                onMapPickLocation={handleMapPickLocation}
              />

              {/* Compact Map Legend */}
              <div className="map-legend" aria-label="Map pin color legend">
                <span className="legend-title">Road User</span>
                <div className="legend-items">
                  {(Object.keys(ROAD_USER_META) as RoadUserType[]).map((key) => (
                    <span key={key} className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: ROAD_USER_META[key].color }}
                      />
                      {ROAD_USER_META[key].shortLabel}
                    </span>
                  ))}
                  {showHinLayer && (
                    <span className="legend-item legend-hin">
                      <span className="legend-line" />
                      Sample HIN Corridor
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : activeTab === 'survey' ? (
          <CommunitySurveyPage
            totalResponses={surveys.length}
            onSubmitSurvey={handleSubmitSurvey}
            onGoToMap={() => setActiveTab('map')}
          />
        ) : activeTab === 'engineering' ? (
          <EngineeringPortal
            reports={reports}
            surveys={surveys}
            onUpdateStatus={handleUpdateStatus}
            onViewOnMap={handleViewOnMap}
            onResetDemo={handleResetDemo}
          />
        ) : (
          <ActionPlanTracker reports={reports} onLocateProject={handleLocateProject} />
        )}
      </main>

      {/* Native <dialog> Modals */}
      <ReportFormDialog
        pickedLocation={pickedLocation}
        onClose={() => setPickedLocation(null)}
        onSubmitReport={handleSubmitReport}
      />

      <ReportDetailDialog
        report={selectedReport}
        hasUpvoted={selectedReport ? upvotedIds.includes(selectedReport.id) : false}
        onClose={() => setSelectedReportId(null)}
        onUpvote={handleUpvote}
        onAddComment={handleAddComment}
      />

      <QrCodeDialog open={qrOpen} onClose={() => setQrOpen(false)} />

      {/* Toast Notification */}
      {toast && (
        <div className="toast-banner" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
