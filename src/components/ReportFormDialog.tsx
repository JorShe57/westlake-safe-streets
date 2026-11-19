import { useEffect, useId, useRef, useState } from 'react';
import { Check, MapPin, Upload, X } from 'lucide-react';
import { IssueCategory, RoadUserType, SafetyReport, TimeOfDay } from '../types';
import {
  ISSUE_CATEGORY_LABELS,
  ROAD_USER_META,
  TIME_OF_DAY_LABELS,
  inferLocationContext,
} from '../data/westlakeData';
import {
  attachDialogLightDismissFallback,
  attachFormValidationSync,
} from '../utils/formAccessibility';

interface ReportFormDialogProps {
  pickedLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmitReport: (
    report: Omit<SafetyReport, 'id' | 'upvotes' | 'status' | 'comments' | 'createdAt'>
  ) => void;
}

export function ReportFormDialog({
  pickedLocation,
  onClose,
  onSubmitReport,
}: ReportFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const titleId = useId();

  const [userType, setUserType] = useState<RoadUserType>('pedestrian');
  const [issueCategory, setIssueCategory] = useState<IssueCategory>('difficult_crossing');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('evening_rush');
  const [corridorHint, setCorridorHint] = useState('');
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);

  const locationContext = pickedLocation
    ? inferLocationContext(pickedLocation.lat, pickedLocation.lng)
    : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (pickedLocation) {
      const ctx = inferLocationContext(pickedLocation.lat, pickedLocation.lng);
      setCorridorHint(ctx.corridorHint);
      setDescription('');
      setPhotoDataUrl(undefined);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [pickedLocation]);

  useEffect(() => {
    const cleanDialog = attachDialogLightDismissFallback(dialogRef.current);
    const cleanForm = attachFormValidationSync(formRef.current);
    return () => {
      cleanDialog();
      cleanForm();
    };
  }, [pickedLocation]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pickedLocation || !locationContext) return;

    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }

    onSubmitReport({
      lat: pickedLocation.lat,
      lng: pickedLocation.lng,
      corridorHint: corridorHint.trim() || locationContext.corridorHint,
      jurisdiction: locationContext.jurisdiction,
      userType,
      issueCategory,
      timeOfDay,
      description: description.trim(),
      photoDataUrl,
    });
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
      <div className="dialog-header">
        <div>
          <p className="dialog-eyebrow">SS4A Public Input Pin</p>
          <h2 id={titleId}>Report a Traffic Safety Concern</h2>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close report form"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      {pickedLocation && locationContext && (
        <form ref={formRef} onSubmit={handleSubmit} className="dialog-body" noValidate>
          <div className="location-banner">
            <MapPin size={18} className="location-banner-icon" />
            <div>
              <strong>
                Pin dropped at {pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)}
              </strong>
              <span className="jurisdiction-pill">
                Auto-detected jurisdiction: {locationContext.jurisdiction}
              </span>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="report-corridor">Intersection or Street Name</label>
            <span id="corridor-hint-help" className="field-hint">
              Pre-filled from map location — edit to add a specific cross-street or landmark.
            </span>
            <input
              id="report-corridor"
              type="text"
              required
              minLength={3}
              value={corridorHint}
              onChange={(e) => setCorridorHint(e.target.value)}
              aria-describedby="corridor-hint-help"
              data-error="corridor-error"
              autoFocus
            />
            <div id="corridor-error" className="error-msg">
              <span role="img" aria-label="Error">
                ⚠️
              </span>{' '}
              Please enter an intersection, street, or nearby landmark (at least 3 characters).
            </div>
          </div>

          <fieldset className="form-field">
            <legend>How were you traveling here?</legend>
            <div className="chip-radio-grid">
              {(Object.keys(ROAD_USER_META) as RoadUserType[]).map((key) => {
                const meta = ROAD_USER_META[key];
                const active = userType === key;
                return (
                  <label
                    key={key}
                    className={`chip-radio ${active ? 'is-active' : ''}`}
                    style={{ '--chip-accent': meta.color } as React.CSSProperties}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={key}
                      checked={active}
                      onChange={() => setUserType(key)}
                    />
                    <span className="chip-dot" style={{ background: meta.color }} />
                    <span>{meta.shortLabel}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="form-field">
            <legend>Primary Safety Concern</legend>
            <div className="mc-grid mc-grid-2">
              {(Object.keys(ISSUE_CATEGORY_LABELS) as IssueCategory[]).map((key) => {
                const active = issueCategory === key;
                return (
                  <label key={key} className={`mc-option mc-option-compact ${active ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="issueCategory"
                      value={key}
                      checked={active}
                      onChange={() => setIssueCategory(key)}
                    />
                    <span className="mc-check" aria-hidden="true">
                      {active && <Check size={12} />}
                    </span>
                    <span className="mc-text">{ISSUE_CATEGORY_LABELS[key]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="form-field">
            <legend>When does this occur?</legend>
            <div className="chip-radio-grid">
              {(Object.keys(TIME_OF_DAY_LABELS) as TimeOfDay[]).map((key) => {
                const active = timeOfDay === key;
                return (
                  <label key={key} className={`chip-radio ${active ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="timeOfDay"
                      value={key}
                      checked={active}
                      onChange={() => setTimeOfDay(key)}
                    />
                    <span>{TIME_OF_DAY_LABELS[key]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="report-desc">Describe what makes this location feel unsafe</label>
            <span id="desc-hint" className="field-hint">
              Include specific behaviors, sightline issues, or ideas that could help (min. 12 characters).
            </span>
            <textarea
              id="report-desc"
              rows={3}
              required
              minLength={12}
              placeholder="Example: Cars turning right on red rarely yield to students crossing to the park..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="desc-hint"
              data-error="desc-error"
            />
            <div id="desc-error" className="error-msg">
              <span role="img" aria-label="Error">
                ⚠️
              </span>{' '}
              Please share at least 12 characters so engineers understand the safety concern.
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="report-photo">Optional Photo (stored locally in demo)</label>
            <label className="file-upload-box" htmlFor="report-photo">
              <Upload size={16} />
              <span>{photoDataUrl ? 'Photo attached — click to replace' : 'Attach a street or crossing photo'}</span>
              <input
                id="report-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="visually-hidden"
              />
            </label>
            {photoDataUrl && (
              <img
                src={photoDataUrl}
                alt="Preview of uploaded roadway safety concern"
                className="photo-preview"
              />
            )}
          </div>

          <div className="dialog-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Safety Pin
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
