import React, { useState, useRef } from 'react';
import { 
  CloudUpload, 
  FolderUp,
  File, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code, 
  X, 
  Clock, 
  Flame, 
  ArrowUpRight,
  AlertCircle,
  Loader2,
  Lock,
  Zap,
  Globe
} from 'lucide-react';
import { formatBytes, getFileCategory } from '../utils/formatters';

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UploadSection({ onUploadSuccess, showToast }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiry, setExpiry] = useState('24h');
  const [burnAfterDownload, setBurnAfterDownload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setUploadError('');

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const errorMsg = `File "${file.name}" (${formatBytes(file.size)}) exceeds the ${MAX_FILE_SIZE_MB} MB limit.`;
      setUploadError(errorMsg);
      showToast(errorMsg, 'error');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    showToast(`Selected "${file.name}" (${formatBytes(file.size)})`, 'info');
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = () => {
    if (!selectedFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const errorMsg = `File exceeds the ${MAX_FILE_SIZE_MB} MB limit.`;
      setUploadError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('expiry', expiry);
    formData.append('burnAfterDownload', burnAfterDownload);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 95);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          try {
            const data = JSON.parse(xhr.responseText);
            setTimeout(() => {
              setIsUploading(false);
              setUploadProgress(0);
              const fileResult = data.file || (data.files && data.files[0]);
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              onUploadSuccess([fileResult]);
            }, 300);
          } catch (e) {
            setIsUploading(false);
            setUploadError('Invalid response from server.');
            showToast('Invalid server response.', 'error');
          }
        } else {
          setIsUploading(false);
          let errorMsg = 'Failed to upload file. Please try again.';
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.error) errorMsg = res.error;
          } catch (e) {}
          setUploadError(errorMsg);
          showToast(errorMsg, 'error');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        const errorMsg = 'Network Error: Cannot connect to backend server.';
        setUploadError(errorMsg);
        showToast(errorMsg, 'error');
      };

      xhr.send(formData);
    } catch (err) {
      console.error('Upload exception:', err);
      setIsUploading(false);
      setUploadError('Unexpected error occurred during upload.');
      showToast('Error preparing upload.', 'error');
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <File size={22} color="#ffffff" />;
    const category = getFileCategory(file.type, file.name);
    switch (category.type) {
      case 'image': return <ImageIcon size={22} color="#ffffff" />;
      case 'video': return <Film size={22} color="#ffffff" />;
      case 'audio': return <Music size={22} color="#ffffff" />;
      case 'pdf': return <FileText size={22} color="#ffffff" />;
      case 'archive': return <Archive size={22} color="#ffffff" />;
      case 'code': return <Code size={22} color="#ffffff" />;
      default: return <File size={22} color="#ffffff" />;
    }
  };

  return (
    <div className="transfer-card-wrapper" id="upload-card-wrapper">
      <div className="glass-card transfer-main-card" id="upload-zone-card">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple={false}
          style={{ display: 'none' }}
          id="file-input"
        />

        {/* Drag and Drop Zone */}
        <div
          className={`dropzone ${isDragOver ? 'is-active' : ''} ${selectedFile ? 'has-files' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          id="drag-drop-area"
        >
          <div className="dropzone-icon-circle">
            <CloudUpload size={36} strokeWidth={2.2} color="#ffffff" />
          </div>

          <h3 className="dropzone-title">
            {isDragOver ? 'Drop file now' : 'Drag and drop your file here'}
          </h3>
          
          <p className="dropzone-desc">
            Direct temporary storage &bull; Max {MAX_FILE_SIZE_MB} MB limit &bull; 24h Auto-Expiry
          </p>

          <div className="dropzone-action-row" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="choose-file-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              id="choose-file-btn"
            >
              <FolderUp size={18} />
              <span>{selectedFile ? 'Change File' : 'Choose File'}</span>
            </button>
            <span className="dropzone-or-text">or drop file anywhere in this card</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {uploadError && (
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '0.9rem 1.25rem', 
              background: '#000000', 
              border: '2px solid #000000', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
            id="upload-error-banner"
          >
            <AlertCircle size={18} color="#ffffff" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{uploadError}</span>
            <button 
              className="icon-btn" 
              onClick={() => setUploadError('')}
              style={{ color: '#ffffff', width: 24, height: 24, padding: 0 }}
            >
              <X size={14} color="#ffffff" />
            </button>
          </div>
        )}

        {/* Selected File Display */}
        {selectedFile && (
          <div className="selected-files-section" id="selected-files-section">
            <div className="selected-files-header">
              <div className="selected-summary">
                <span className="summary-count">Selected File</span>
                <span className="summary-bullet">&bull;</span>
                <span className="summary-size">{formatBytes(selectedFile.size)}</span>
              </div>
              <button
                type="button"
                className="clear-all-link"
                onClick={removeFile}
                disabled={isUploading}
                id="clear-selected-file-btn"
              >
                Remove
              </button>
            </div>

            <div className="selected-files-list">
              <div className="file-item-card" id="selected-file-card">
                <div className="file-info-group">
                  <div className="file-icon-box">
                    {getFileIcon(selectedFile)}
                  </div>
                  <div className="file-details">
                    <p className="file-name" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="file-meta">
                      <span className="file-size-badge">{formatBytes(selectedFile.size)}</span>
                      <span>&bull;</span>
                      <span className="file-type-text">{selectedFile.type || 'Document'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={removeFile}
                  disabled={isUploading}
                  title="Remove file"
                  aria-label="Remove selected file"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expiry and Burn Settings */}
        <div className="upload-options-bar">
          <div className="option-group">
            <Clock size={16} color="#000000" />
            <span className="option-label">Expires in:</span>
            <select
              className="select-input"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              disabled={isUploading}
              id="expiry-select"
            >
              <option value="24h">24 Hours (Standard)</option>
              <option value="1h">1 Hour</option>
              <option value="10m">10 Minutes</option>
            </select>
          </div>

          <label className="toggle-label" title="Automatically destroys the file after it is downloaded once">
            <input
              type="checkbox"
              checked={burnAfterDownload}
              onChange={(e) => setBurnAfterDownload(e.target.checked)}
              disabled={isUploading}
              id="burn-checkbox"
            />
            <Flame size={16} color="#000000" />
            <span>Burn after 1st download</span>
          </label>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="progress-container" id="upload-progress-container">
            <div className="progress-header">
              <span>Uploading to server...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }} 
              />
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="upload-btn-container">
          <button
            type="button"
            className="btn-upload-primary"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            id="start-upload-btn"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" color="#ffffff" />
                <span>Uploading ({uploadProgress}%)...</span>
              </>
            ) : (
              <>
                <CloudUpload size={20} color="#ffffff" />
                <span>
                  {selectedFile 
                    ? `Upload "${selectedFile.name.length > 25 ? selectedFile.name.slice(0, 22) + '...' : selectedFile.name}"` 
                    : 'Upload'}
                </span>
                <ArrowUpRight size={18} color="#ffffff" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="product-features-row">
        <div className="feature-pill">
          <Zap size={16} color="#000000" />
          <span>Max 25 MB Limit</span>
        </div>
        <div className="feature-pill">
          <Clock size={16} color="#000000" />
          <span>24h Auto-Expiry</span>
        </div>
        <div className="feature-pill">
          <Globe size={16} color="#000000" />
          <span>QR Code &amp; Instant Link</span>
        </div>
      </div>
    </div>
  );
}
