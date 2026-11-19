import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, ClipboardList, Map as MapIcon } from 'lucide-react';
import { SurveyResponse } from '../types';
import { attachFormValidationSync } from '../utils/formAccessibility';

interface CommunitySurveyPageProps {
  totalResponses: number;
  onSubmitSurvey: (response: Omit<SurveyResponse, 'id' | 'createdAt'>) => void;
  onGoToMap: () => void;
}

const CONNECTION_OPTIONS = [
  'Westlake Resident',
  'Work in Westlake',
  'Parent / Student (Westlake Schools)',
  'Visit Crocker Park / Local Businesses',
  'Commute Through Westlake',
];

const TRAVEL_MODE_OPTIONS = [
  'Personal Vehicle',
  'Walking & Driving',
  'Bicycle / Scooter',
  'Transit / Mobility Aid',
];

const PRIORITY_OPTIONS = [
  'Safer major intersections (Crocker, Mills & Center Ridge)',
  'Better pedestrian crossings & nighttime lighting',
  'Speed management & neighborhood traffic calming',
  'Connected bike lanes & multi-use paths',
  'ADA curb ramps & sidewalk continuity',
  'Commercial corridor driveway & access management',
];

export function CommunitySurveyPage({
  totalResponses,
  onSubmitSurvey,
  onGoToMap,
}: CommunitySurveyPageProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [connectionToCity, setConnectionToCity] = useState(CONNECTION_OPTIONS[0]);
  const [primaryMode, setPrimaryMode] = useState(TRAVEL_MODE_OPTIONS[0]);
  const [topPriority, setTopPriority] = useState(PRIORITY_OPTIONS[0]);
  const [zipCode, setZipCode] = useState('44145');
  const [barriersText, setBarriersText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    return attachFormValidationSync(formRef.current);
  }, [submitted]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    onSubmitSurvey({
      primaryMode,
      connectionToCity,
      topPriority,
      zipCode: zipCode.trim(),
      barriersText: barriersText.trim(),
    });
    setSubmitted(true);
    setBarriersText('');
  };

  return (
    <div className="survey-page-shell">
      <div className="survey-hero-card">
        <span className="admin-eyebrow">
          <ClipboardList size={14} /> Task 5 · Community &amp; Equity Outreach
        </span>
        <h1>Westlake Safe Streets Community Survey</h1>
        <p className="muted-small">
          Takes under 1 minute on mobile or desktop. Your feedback helps the City of Westlake
          understand travel patterns and safety barriers for all road users—even if you cannot
          attend an in-person public meeting.
        </p>
        <div className="survey-meta-pill">
          {totalResponses} community response{totalResponses === 1 ? '' : 's'} collected in demo
        </div>
      </div>

      {submitted ? (
        <div className="panel-card survey-success-card">
          <CheckCircle2 size={48} className="success-icon" />
          <h2>Thank you for sharing your input</h2>
          <p className="muted-small">
            Your survey response is recorded and immediately counted in the{' '}
            <strong>Engineering &amp; GIS</strong> dashboard. Want to flag a specific intersection
            or crossing as well?
          </p>
          <div className="survey-success-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={onGoToMap}>
              <MapIcon size={17} />
              <span>Open Public Safety Map</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => setSubmitted(false)}
            >
              Submit Another Response
            </button>
          </div>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="survey-form-stack" noValidate>
          {/* Question 1 */}
          <fieldset className="panel-card choice-card-fieldset">
            <legend className="survey-q-legend">
              <span className="q-num">1</span> How are you connected to Westlake?
            </legend>
            <div className="mc-grid mc-grid-2">
              {CONNECTION_OPTIONS.map((option) => {
                const active = connectionToCity === option;
                return (
                  <label key={option} className={`mc-option ${active ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="connectionToCity"
                      value={option}
                      checked={active}
                      onChange={() => setConnectionToCity(option)}
                    />
                    <span className="mc-check" aria-hidden="true">
                      {active && <Check size={13} />}
                    </span>
                    <span className="mc-text">{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Question 2 */}
          <fieldset className="panel-card choice-card-fieldset">
            <legend className="survey-q-legend">
              <span className="q-num">2</span> How do you primarily travel in Westlake?
            </legend>
            <div className="mc-grid mc-grid-2">
              {TRAVEL_MODE_OPTIONS.map((option) => {
                const active = primaryMode === option;
                return (
                  <label key={option} className={`mc-option ${active ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="primaryMode"
                      value={option}
                      checked={active}
                      onChange={() => setPrimaryMode(option)}
                    />
                    <span className="mc-check" aria-hidden="true">
                      {active && <Check size={13} />}
                    </span>
                    <span className="mc-text">{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Question 3 */}
          <fieldset className="panel-card choice-card-fieldset">
            <legend className="survey-q-legend">
              <span className="q-num">3</span> What should be Westlake&apos;s top traffic safety
              priority?
            </legend>
            <div className="mc-grid mc-grid-1">
              {PRIORITY_OPTIONS.map((option) => {
                const active = topPriority === option;
                return (
                  <label key={option} className={`mc-option ${active ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="topPriority"
                      value={option}
                      checked={active}
                      onChange={() => setTopPriority(option)}
                    />
                    <span className="mc-check" aria-hidden="true">
                      {active && <Check size={13} />}
                    </span>
                    <span className="mc-text">{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Question 4 & 5 */}
          <div className="panel-card survey-text-card">
            <div className="form-field">
              <label htmlFor="srv-zip">
                <span className="q-num-inline">4</span> ZIP Code (optional)
              </label>
              <span id="zip-hint" className="field-hint">
                5-digit ZIP (e.g. 44145) to help track geographic coverage across Westlake.
              </span>
              <input
                id="srv-zip"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                aria-describedby="zip-hint"
                data-error="zip-error"
                className="zip-input"
              />
              <div id="zip-error" className="error-msg">
                <span role="img" aria-label="Error">
                  ⚠️
                </span>{' '}
                Enter a 5-digit ZIP code (e.g., 44145).
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="srv-barriers">
                <span className="q-num-inline">5</span> Any barriers to walking, biking, or rolling
                safely in Westlake? (Optional)
              </label>
              <textarea
                id="srv-barriers"
                rows={3}
                placeholder="Share accessibility challenges, school route concerns, or general ideas..."
                value={barriersText}
                onChange={(e) => setBarriersText(e.target.value)}
              />
            </div>

            <div className="survey-submit-row">
              <button type="submit" className="btn btn-primary btn-lg btn-block">
                Submit Community Survey
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
