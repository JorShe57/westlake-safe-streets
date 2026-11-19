import { useEffect, useId, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X } from 'lucide-react';
import { attachDialogLightDismissFallback } from '../utils/formAccessibility';

interface QrCodeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QrCodeDialog({ open, onClose }: QrCodeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://westlake-safe-streets.demo';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0f2942', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch(() => {});
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, currentUrl]);

  useEffect(() => {
    return attachDialogLightDismissFallback(dialogRef.current);
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="civic-dialog civic-dialog-sm"
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = '';
        onClose();
      }}
    >
      <div className="dialog-header">
        <div>
          <p className="dialog-eyebrow">Pop-Up Outreach & Public Meetings</p>
          <h2 id={titleId}>Shareable QR Flyer</h2>
        </div>
        <button type="button" className="icon-btn" aria-label="Close QR code" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="dialog-body qr-body">
        <p className="muted-small">
          Display this QR code on posters at Crocker Park, Westlake Recreation Center, Porter Public
          Library, or City Council meetings so residents can drop a pin from their phone in seconds.
        </p>

        {qrDataUrl && (
          <div className="qr-frame">
            <img src={qrDataUrl} alt="QR code linking to Westlake Safe Streets Public Input Map" />
            <strong>City of Westlake · SS4A Safety Action Plan</strong>
            <span>Scan to map a traffic safety concern</span>
          </div>
        )}

        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            autoFocus
          >
            <Printer size={16} />
            <span>Print Flyer</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
