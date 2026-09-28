import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Copy, 
  Download, 
  PlusCircle, 
  QrCode, 
  ExternalLink,
  ShieldCheck,
  Link2
} from 'lucide-react';
import { formatBytes, formatExpiry } from '../utils/formatters';

export default function ShareModal({ uploadedFiles, onReset, showToast }) {
  const [copiedLinkIndex, setCopiedLinkIndex] = useState(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [copiedIdIndex, setCopiedIdIndex] = useState(null);
  const [showQrIndex, setShowQrIndex] = useState(0); // Show QR code by default

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#000000', '#333333', '#666666', '#999999', '#ffffff'],
      });
    } catch (e) {}
  }, []);

  const copyToClipboard = (text, type, index) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLinkIndex(index);
      setTimeout(() => setCopiedLinkIndex(null), 2500);
      showToast('Shareable download link copied!', 'success');
    } else if (type === 'id') {
      setCopiedIdIndex(index);
      setTimeout(() => setCopiedIdIndex(null), 2500);
      showToast('Transfer ID copied!', 'success');
    } else {
      setCopiedCodeIndex(index);
      setTimeout(() => setCopiedCodeIndex(null), 2500);
      showToast('Quick Code copied!', 'success');
    }
  };

  const getFullShareUrl = (file) => {
    const origin = window.location.origin;
    const transferId = file.transferId || file.id;
    return `${origin}/download/${transferId}`;
  };

  return (
    <div className="glass-card success-card" id="share-success-card">
      <div className="success-badge-icon">
        <ShieldCheck size={36} color="#ffffff" />
      </div>

      <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', color: '#000000' }}>
        Upload Successful!
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 1.5rem', fontWeight: 500 }}>
        Your file is uploaded and ready. Copy the shareable download link or scan the QR code below.
      </p>

      {uploadedFiles.map((file, idx) => {
        const shareUrl = getFullShareUrl(file);
        const isQrOpen = showQrIndex === idx;
        const transferId = file.transferId || file.id;

        return (
          <div 
            key={transferId || idx} 
            style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              padding: '1.75rem', 
              marginBottom: '1.5rem',
              border: '2px solid #000000',
              boxShadow: '4px 4px 0px #000000'
            }}
          >
            {/* File Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000000' }}>
                  {file.originalName}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span className="chip chip-downloads">{formatBytes(file.size)}</span>
                  {file.expiresAt && <span className="chip chip-expiry">{formatExpiry(file.expiresAt)}</span>}
                  {file.burnAfterDownload && <span className="chip chip-burn">1-time download</span>}
                </div>
              </div>
            </div>

            {/* Shareable Link Box */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.82rem', color: '#000000', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Link2 size={14} color="#000000" />
                <span>Shareable Download Link</span>
              </label>
              <div className="link-input-group">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="link-input"
                  id={`share-link-input-${idx}`}
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                  onClick={() => copyToClipboard(shareUrl, 'link', idx)}
                  id={`copy-link-btn-${idx}`}
                >
                  {copiedLinkIndex === idx ? <Check size={16} color="#ffffff" /> : <Copy size={16} color="#ffffff" />}
                  <span>{copiedLinkIndex === idx ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Transfer ID & 6-Digit Code Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Unique Transfer ID */}
              <div className="share-code-box" style={{ margin: 0, padding: '1rem' }}>
                <span className="code-title">Transfer ID</span>
                <span 
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.84rem', 
                    color: '#000000',
                    fontWeight: 700,
                    wordBreak: 'break-all',
                    textAlign: 'center',
                    padding: '0.2rem 0'
                  }}
                  id={`transfer-id-${idx}`}
                >
                  {transferId}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: '0.6rem', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                  onClick={() => copyToClipboard(transferId, 'id', idx)}
                  id={`copy-id-btn-${idx}`}
                >
                  {copiedIdIndex === idx ? <Check size={13} color="#000000" /> : <Copy size={13} color="#000000" />}
                  <span>{copiedIdIndex === idx ? 'Copied ID!' : 'Copy ID'}</span>
                </button>
              </div>

              {/* 6-Digit Quick Code */}
              <div className="share-code-box" style={{ margin: 0, padding: '1rem' }}>
                <span className="code-title">Quick Code</span>
                <span className="share-code-display" style={{ fontSize: '1.85rem', color: '#000000' }} id={`shortcode-${file.shortCode}`}>
                  {file.shortCode}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: '0.6rem', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                  onClick={() => copyToClipboard(file.shortCode, 'code', idx)}
                  id={`copy-code-btn-${idx}`}
                >
                  {copiedCodeIndex === idx ? <Check size={13} color="#000000" /> : <Copy size={13} color="#000000" />}
                  <span>{copiedCodeIndex === idx ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            {isQrOpen && (
              <div className="qr-preview-box" id={`qr-code-box-${idx}`}>
                <QRCodeSVG
                  value={shareUrl}
                  size={160}
                  level="M"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
                <p style={{ color: '#000000', fontSize: '0.78rem', marginTop: '0.5rem', fontWeight: 700 }}>
                  Scan with any phone camera
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowQrIndex(isQrOpen ? null : idx)}
                id={`toggle-qr-btn-${idx}`}
              >
                <QrCode size={16} color="#000000" />
                <span>{isQrOpen ? 'Hide QR Code' : 'Show QR Code'}</span>
              </button>

              <a
                href={`/download/${transferId}`}
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
                id={`view-download-page-btn-${idx}`}
              >
                <ExternalLink size={16} color="#000000" />
                <span>Open Download Page</span>
              </a>

              <a
                href={`/api/download/${transferId}`}
                download={file.originalName}
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
                id={`direct-download-btn-${idx}`}
              >
                <Download size={16} color="#000000" />
                <span>Direct Download</span>
              </a>
            </div>
          </div>
        );
      })}

      {/* Share another file */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onReset}
          id="share-more-files-btn"
        >
          <PlusCircle size={18} color="#ffffff" />
          <span>Upload Another File</span>
        </button>
      </div>
    </div>
  );
}
