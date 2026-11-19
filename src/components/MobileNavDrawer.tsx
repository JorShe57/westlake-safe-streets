import { useEffect, useId, useRef } from 'react';
import {
  BarChart3,
  ClipboardList,
  Map as MapIcon,
  QrCode,
  Route,
  ShieldCheck,
  X,
} from 'lucide-react';
import { attachDialogLightDismissFallback } from '../utils/formAccessibility';

export type AppTab = 'map' | 'survey' | 'engineering' | 'tracker';

interface MobileNavDrawerProps {
  open: boolean;
  activeTab: AppTab;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenQr: () => void;
}

export function MobileNavDrawer({
  open,
  activeTab,
  onClose,
  onSelectTab,
  onOpenQr,
}: MobileNavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    return attachDialogLightDismissFallback(dialogRef.current);
  }, [open]);

  const handleChooseTab = (tab: AppTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handleChooseQr = () => {
    onClose();
    setTimeout(() => onOpenQr(), 60);
  };

  return (
    <dialog
      ref={dialogRef}
      id="mobile-nav-drawer"
      className="nav-drawer"
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = '';
        onClose();
      }}
    >
      <div className="nav-drawer-header">
        <div className="nav-drawer-brand">
          <span className="brand-mark brand-mark-sm" aria-hidden="true">
            <ShieldCheck size={17} />
          </span>
          <div>
            <strong id={titleId}>Westlake Safe Streets</strong>
            <span>SS4A Prototype</span>
          </div>
        </div>
        <button
          type="button"
          className="nav-drawer-close"
          aria-label="Close menu"
          autoFocus
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="nav-drawer-body" aria-label="Mobile navigation">
        <div className="nav-drawer-section">
          <span className="nav-drawer-section-label">Public Engagement</span>
          <button
            type="button"
            className={`nav-drawer-item ${activeTab === 'map' ? 'is-active' : ''}`}
            aria-current={activeTab === 'map' ? 'page' : undefined}
            onClick={() => handleChooseTab('map')}
          >
            <MapIcon size={18} />
            <span>Public Safety Map</span>
          </button>
          <button
            type="button"
            className={`nav-drawer-item ${activeTab === 'survey' ? 'is-active' : ''}`}
            aria-current={activeTab === 'survey' ? 'page' : undefined}
            onClick={() => handleChooseTab('survey')}
          >
            <ClipboardList size={18} />
            <span>Community Survey</span>
          </button>
        </div>

        <div className="nav-drawer-section">
          <span className="nav-drawer-section-label">City Engineering &amp; Demo</span>
          <button
            type="button"
            className={`nav-drawer-item ${activeTab === 'engineering' ? 'is-active' : ''}`}
            aria-current={activeTab === 'engineering' ? 'page' : undefined}
            onClick={() => handleChooseTab('engineering')}
          >
            <BarChart3 size={18} />
            <span>Engineering &amp; GIS Portal</span>
          </button>
          <button
            type="button"
            className={`nav-drawer-item ${activeTab === 'tracker' ? 'is-active' : ''}`}
            aria-current={activeTab === 'tracker' ? 'page' : undefined}
            onClick={() => handleChooseTab('tracker')}
          >
            <Route size={18} />
            <span>Action Plan Tracker</span>
            <span className="tab-pill">2028+</span>
          </button>
          <button type="button" className="nav-drawer-item" onClick={handleChooseQr}>
            <QrCode size={18} />
            <span>Shareable QR Flyer</span>
          </button>
        </div>
      </nav>
    </dialog>
  );
}
