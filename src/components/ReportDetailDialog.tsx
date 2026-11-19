import { useEffect, useId, useRef, useState } from 'react';
import { Clock, MapPin, MessageSquare, ShieldCheck, ThumbsUp, X } from 'lucide-react';
import { SafetyReport } from '../types';
import {
  ISSUE_CATEGORY_LABELS,
  ROAD_USER_META,
  TIME_OF_DAY_LABELS,
} from '../data/westlakeData';
import { attachDialogLightDismissFallback } from '../utils/formAccessibility';

interface ReportDetailDialogProps {
  report: SafetyReport | null;
  hasUpvoted: boolean;
  onClose: () => void;
  onUpvote: (reportId: string) => void;
  onAddComment: (reportId: string, text: string) => void;
}

export function ReportDetailDialog({
  report,
  hasUpvoted,
  onClose,
  onUpvote,
  onAddComment,
}: ReportDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (report) {
      setCommentText('');
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [report]);

  useEffect(() => {
    return attachDialogLightDismissFallback(dialogRef.current);
  }, [report]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !commentText.trim()) return;
    onAddComment(report.id, commentText.trim());
    setCommentText('');
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="civic-dialog"
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = '';
        onClose();
      }}
    >
      {report && (
        <>
          <div className="dialog-header">
            <div>
              <div className="badge-row">
                <span
                  className="user-type-badge"
                  style={{ background: ROAD_USER_META[report.userType].color }}
                >
                  {ROAD_USER_META[report.userType].shortLabel}
                </span>
                <span className="jurisdiction-badge">{report.jurisdiction}</span>
                {report.status === 'included' && (
                  <span className="status-badge status-included">
                    <ShieldCheck size={13} /> Included in Review
                  </span>
                )}
              </div>
              <h2 id={titleId}>{report.corridorHint}</h2>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close report details"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="dialog-body">
            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <MapPin size={15} />
                <span>{ISSUE_CATEGORY_LABELS[report.issueCategory]}</span>
              </div>
              <div className="detail-meta-item">
                <Clock size={15} />
                <span>{TIME_OF_DAY_LABELS[report.timeOfDay]}</span>
              </div>
            </div>

            <p className="detail-description">{report.description}</p>

            {report.photoDataUrl && (
              <img
                src={report.photoDataUrl}
                alt={`Resident photo at ${report.corridorHint}`}
                className="photo-preview"
              />
            )}

            <div className="upvote-box">
              <div>
                <strong>{report.upvotes} residents</strong> confirmed this concern
                <p className="muted-small">
                  Confirming existing pins helps Westlake prioritize hotspots without duplicates.
                </p>
              </div>
              <button
                type="button"
                className={`btn ${hasUpvoted ? 'btn-confirmed' : 'btn-primary'}`}
                onClick={() => onUpvote(report.id)}
                disabled={hasUpvoted}
                autoFocus
              >
                <ThumbsUp size={16} />
                <span>{hasUpvoted ? 'Confirmed (+1)' : "I've Seen This Too"}</span>
              </button>
            </div>

            <div className="comments-section">
              <h3>
                <MessageSquare size={16} /> Resident Notes ({report.comments.length})
              </h3>
              {report.comments.length === 0 ? (
                <p className="muted-small">
                  No additional notes yet. Add context about timing or suggested improvements below.
                </p>
              ) : (
                <ul className="comments-list">
                  {report.comments.map((c) => (
                    <li key={c.id} className="comment-item">
                      <p>{c.text}</p>
                      <time dateTime={c.createdAt}>
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleCommentSubmit} className="comment-form">
                <label htmlFor="add-comment-input" className="visually-hidden">
                  Add a brief note or suggestion
                </label>
                <input
                  id="add-comment-input"
                  type="text"
                  placeholder="Add a brief observation or suggested fix..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary" disabled={!commentText.trim()}>
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
