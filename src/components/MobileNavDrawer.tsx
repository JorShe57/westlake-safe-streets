import { useEffect, useRef } from 'react';
import {
  BarChart3,
  ClipboardList,
  Map as MapIcon,
  QrCode,
  Route,
  ShieldCheck,
  X,
} from 'lucide-react';

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
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const isClosingRef = useRef(false);
  const hasOpenedRef = useRef(false);
  const closeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const finalizeClose = () => {
    clearTimeout(closeFallbackTimerRef.current);
    const dialog = dialogRef.current;
    isClosingRef.current = false;
    hasOpenedRef.current = false;
    if (dialog?.open) {
      dialog.close();
    }
    onClose();
  };

  const slideClosed = () => {
    const scroller = scrollerRef.current;
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) return;
    isClosingRef.current = true;
    if (scroller && scroller.scrollLeft > 2) {
      scroller.scrollTo({ left: 0, behavior: 'auto' });
      clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = setTimeout(() => {
        if (isClosingRef.current) finalizeClose();
      }, 450);
    } else {
      finalizeClose();
    }
  };

  // Sync open prop -> showModal() + scroll sheet into view from the right
  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return;

    if (open && !dialog.open) {
      isClosingRef.current = false;
      hasOpenedRef.current = false;
      dialog.showModal();
      // Start at closed stop (left: 0 = spacer visible, sheet off-screen right)
      scroller.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (dialog.open && !isClosingRef.current) {
            scroller.scrollTo({ left: sheet.offsetWidth, behavior: 'auto' });
          }
        });
      });
    } else if (!open && dialog.open && !isClosingRef.current) {
      slideClosed();
    }
  }, [open]);

  // IntersectionObserver for drawer open/closed state + scroll fallback for backdrop fade
  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry || !dialog.open) return;

        if (entry.intersectionRatio >= 0.95) {
          hasOpenedRef.current = true;
          return;
        }

        if (
          entry.intersectionRatio < visibleThreshold &&
          (isClosingRef.current || hasOpenedRef.current)
        ) {
          finalizeClose();
        }
      },
      { root: dialog, threshold: [visibleThreshold, 0.95, 1] }
    );
    observer.observe(sheet);

    const supportsScrollTimeline =
      typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');

    const handleScroll = () => {
      if (!supportsScrollTimeline && sheet.offsetWidth > 0) {
        const ratio = Math.min(1, Math.max(0, scroller.scrollLeft / sheet.offsetWidth));
        dialog.style.setProperty('--drawer-backdrop', String(ratio));
      }
    };

    if (!supportsScrollTimeline) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
    }

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        slideClosed();
      }
    };

    dialog.addEventListener('cancel', handleCancel);

    return () => {
      observer.disconnect();
      if (!supportsScrollTimeline) {
        scroller.removeEventListener('scroll', handleScroll);
      }
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleChooseTab = (tab: AppTab) => {
    onSelectTab(tab);
    slideClosed();
  };

  const handleChooseQr = () => {
    slideClosed();
    setTimeout(() => onOpenQr(), 180);
  };

  return (
    <dialog
      ref={dialogRef}
      id="mobile-nav-drawer"
      className="nav-drawer"
      aria-label="Navigation menu"
      onClick={(e) => {
        if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
          slideClosed();
        }
      }}
    >
      <div ref={scrollerRef} className="nav-drawer-scroller">
        <nav ref={sheetRef} className="nav-drawer-sheet" aria-label="Mobile navigation">
          <div className="nav-drawer-header">
            <div className="nav-drawer-brand">
              <span className="brand-mark brand-mark-sm" aria-hidden="true">
                <ShieldCheck size={17} />
              </span>
              <div>
                <strong>Westlake Safe Streets</strong>
                <span>SS4A Prototype</span>
              </div>
            </div>
            <button
              type="button"
              className="nav-drawer-close"
              aria-label="Close menu"
              autoFocus
              onClick={slideClosed}
            >
              <X size={20} />
            </button>
          </div>

          <div className="nav-drawer-body">
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
              <button
                type="button"
                className="nav-drawer-item"
                onClick={handleChooseQr}
              >
                <QrCode size={18} />
                <span>Shareable QR Flyer</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </dialog>
  );
}
