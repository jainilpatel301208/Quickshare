import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Search, 
  Download, 
  FileText, 
  File,
  AlertCircle,
  Loader2,
  Flame
} from 'lucide-react';
import { formatBytes, formatExpiry, getFileCategory } from '../utils/formatters';

export default function ReceiveSection({ initialCode = '', showToast }) {
  const [code, setCode] = useState(initialCode);
  const [fileData, setFileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      lookupFile(initialCode);
    }
  }, [initialCode]);

  const lookupFile = async (codeToLookup) => {
    const trimmed = (codeToLookup || code).trim();
    if (!trimmed) {
      showToast('Please enter a 6-digit code or file ID.', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setFileData(null);
    setDownloadSuccess(false);

    try {
      const res = await fetch(`/api/files/${trimmed}`);
      if (res.ok) {
        const data = await res.json();
        setFileData(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.error || 'File not found or link has expired.');
        showToast(err.error || 'File not found', 'error');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not connect to backend server.');
      showToast('Network error: Is the backend server running?', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;
    const downloadId = fileData.transferId || fileData.id;
    const downloadUrl = `/api/download/${downloadId}`;
    window.location.href = downloadUrl;
    setDownloadSuccess(true);
    showToast(`Downloading "${fileData.originalName}"...`, 'success');

    if (fileData.burnAfterDownload) {
      setTimeout(() => {
        setFileData(null);
        setErrorMessage('This file was set to burn after 1 download and has been destroyed.');
      }, 3000);
    }
  };

  return (
    <div className="glass-card receive-box" id="receive-card">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem', color: '#000000' }}>
          Receive a File
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 500 }}>
          Enter the 6-digit Quick Code or paste a Transfer ID.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookupFile(code);
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="code-input-large"
            placeholder="e.g. 748291"
            maxLength={36}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            id="receive-code-input"
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="btn-upload-primary"
          disabled={isLoading || !code.trim()}
          id="fetch-file-btn"
          style={{ width: '100%', padding: '0.95rem' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" color="#ffffff" />
              <span>Searching for File...</span>
            </>
          ) : (
            <>
              <Search size={18} color="#ffffff" />
              <span>Find File</span>
            </>
          )}
        </button>
      </form>

      {/* Error State */}
      {errorMessage && (
        <div 
          style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#000000', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
          id="receive-error-box"
        >
          <AlertCircle size={20} color="#ffffff" style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File Found Preview */}
      {fileData && (
        <div 
          style={{ 
            marginTop: '1.75rem', 
            padding: '1.5rem', 
            background: '#fafafa', 
            border: '2px solid #000000', 
            borderRadius: '14px' 
          }}
          id="file-preview-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div 
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '10px', 
                background: '#000000', 
                color: '#ffffff',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <File size={26} color="#ffffff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fileData.originalName}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem', fontWeight: 600 }}>
                {formatBytes(fileData.size)} &bull; {fileData.mimeType || 'Document'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <span className="chip chip-code">Code: {fileData.shortCode}</span>
            {fileData.expiresAt && <span className="chip chip-expiry">{formatExpiry(fileData.expiresAt)}</span>}
            {fileData.burnAfterDownload && (
              <span className="chip chip-burn">
                <Flame size={12} color="#ffffff" /> 1-time download
              </span>
            )}
            <span className="chip chip-downloads">Downloads: {fileData.downloadCount}</span>
          </div>

          <button
            type="button"
            className="btn-upload-primary"
            onClick={handleDownload}
            id="download-file-btn"
          >
            <Download size={18} color="#ffffff" />
            <span>Download File Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
