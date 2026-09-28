import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code, 
  File, 
  Clock, 
  Flame, 
  ShieldCheck, 
  FileX, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Share2
} from 'lucide-react';
import { formatBytes, formatTimeAgo, formatExpiry, getFileCategory } from '../utils/formatters';

export default function DownloadPage({ transferId, onGoHome, showToast }) {
  const [fileData, setFileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  useEffect(() => {
    if (!transferId) {
      setErrorStatus('not_found');
      setErrorMessage('No transfer ID was specified in the link.');
      setIsLoading(false);
      return;
    }

    fetchFileInfo(transferId);
  }, [transferId]);

  const fetchFileInfo = async (id) => {
    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/files/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFileData(data);
      } else if (res.status === 410) {
        setErrorStatus('expired');
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || 'This file transfer link has expired and is no longer available.');
      } else if (res.status === 404) {
        setErrorStatus('not_found');
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || 'The requested file transfer does not exist or was removed.');
      } else {
        setErrorStatus('unknown');
        setErrorMessage('Unable to retrieve file details. Please try again later.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setErrorStatus('network_error');
      setErrorMessage('Could not connect to the QuickShare server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;
    const downloadId = fileData.transferId || fileData.id;
    const downloadUrl = `/api/download/${downloadId}`;

    setIsDownloading(true);
    setDownloadCompleted(true);
    showToast(`Starting download: "${fileData.originalName}"`, 'success');

    window.location.href = downloadUrl;

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);

    if (fileData.burnAfterDownload) {
      setTimeout(() => {
        setFileData(null);
        setErrorStatus('expired');
        setErrorMessage('This file was set to burn after 1 download and has been securely deleted from the server.');
      }, 4000);
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <File size={32} color="#ffffff" />;
    const category = getFileCategory(file.mimeType, file.originalName);
    switch (category.type) {
      case 'image': return <ImageIcon size={32} color="#ffffff" />;
      case 'video': return <Film size={32} color="#ffffff" />;
      case 'audio': return <Music size={32} color="#ffffff" />;
      case 'pdf': return <FileText size={32} color="#ffffff" />;
      case 'archive': return <Archive size={32} color="#ffffff" />;
      case 'code': return <Code size={32} color="#ffffff" />;
      default: return <File size={32} color="#ffffff" />;
    }
  };

  return (
    <div className="download-page-container" id="download-page-container">
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onGoHome}
          id="back-home-btn"
          style={{ fontSize: '0.86rem', padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          <span>Go to QuickShare Home</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }} id="download-loading-state">
          <Loader2 size={40} className="animate-spin" style={{ color: '#000000', margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#000000' }}>Retrieving File Transfer...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Connecting to server for ID: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#000000' }}>{transferId}</span>
          </p>
        </div>
      )}

      {/* Error / Unavailable State */}
      {!isLoading && errorStatus && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }} id="download-error-state">
          <div 
            style={{ 
              width: 68, 
              height: 68, 
              borderRadius: '50%', 
              background: '#000000', 
              color: '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem'
            }}
          >
            <FileX size={34} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#000000', marginBottom: '0.5rem' }}>
            {errorStatus === 'expired' ? 'Transfer Link Expired' : 'File Unavailable'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.75rem', lineHeight: 1.6, fontWeight: 500 }}>
            {errorMessage}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onGoHome}
              id="send-file-now-btn"
            >
              <Share2 size={16} color="#ffffff" />
              <span>Send a New File</span>
            </button>
            
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fetchFileInfo(transferId)}
              id="retry-fetch-btn"
            >
              <span>Try Again</span>
            </button>
          </div>
        </div>
      )}

      {/* File Found & Ready State */}
      {!isLoading && fileData && (
        <div className="glass-card" id="download-ready-card" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div 
              style={{ 
                width: 76, 
                height: 76, 
                borderRadius: '16px', 
                background: '#000000', 
                border: '2px solid #000000',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.25rem'
              }}
            >
              {getFileIcon(fileData)}
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <span className="hero-pill">
                <ShieldCheck size={14} color="#000000" />
                <span>Ready for Download</span>
              </span>
            </div>

            <h2 
              style={{ 
                fontSize: '1.95rem', 
                fontWeight: 800, 
                color: '#000000', 
                wordBreak: 'break-word',
                maxWidth: '650px',
                margin: '0 auto 0.5rem' 
              }}
              id="download-file-name"
            >
              {fileData.originalName}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 500 }}>
              Uploaded {formatTimeAgo(fileData.uploadedAt)} &bull; {fileData.mimeType || 'Document'}
            </p>
          </div>

          {/* Details Box */}
          <div 
            style={{ 
              background: '#fafafa', 
              borderRadius: '14px', 
              padding: '1.25rem 1.5rem', 
              border: '2px solid #000000',
              marginBottom: '2rem' 
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', textAlign: 'left' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>File Size</span>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000000', marginTop: '0.15rem' }}>
                  {formatBytes(fileData.size)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Transfer Code</span>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#000000', marginTop: '0.15rem' }}>
                  {fileData.shortCode}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Availability</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#000000', marginTop: '0.15rem' }}>
                  {formatExpiry(fileData.expiresAt)}
                </p>
              </div>
            </div>

            {fileData.burnAfterDownload && (
              <div 
                style={{ 
                  marginTop: '1rem', 
                  paddingTop: '0.9rem', 
                  borderTop: '1.5px solid #000000',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: '#000000',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                <Flame size={16} color="#000000" />
                <span>Notice: This file will delete itself immediately after this download.</span>
              </div>
            )}
          </div>

          {/* Download Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              type="button"
              className="btn-upload-primary"
              onClick={handleDownload}
              disabled={isDownloading}
              id="confirm-download-btn"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={20} className="animate-spin" color="#ffffff" />
                  <span>Preparing Download...</span>
                </>
              ) : (
                <>
                  <Download size={22} color="#ffffff" />
                  <span>Download File ({formatBytes(fileData.size)})</span>
                </>
              )}
            </button>

            {downloadCompleted && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  color: '#000000', 
                  fontSize: '0.88rem', 
                  fontWeight: 700 
                }}
              >
                <CheckCircle2 size={16} color="#000000" />
                <span>Download started! Check your downloads folder.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
