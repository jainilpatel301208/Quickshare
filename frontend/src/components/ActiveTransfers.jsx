import React from 'react';
import { 
  FolderSync, 
  Download, 
  Copy, 
  Trash2, 
  Clock, 
  Flame, 
  File, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code,
  RefreshCw
} from 'lucide-react';
import { formatBytes, formatTimeAgo, formatExpiry, getFileCategory } from '../utils/formatters';

export default function ActiveTransfers({ 
  files = [], 
  onRefresh, 
  onDelete, 
  showToast,
  isLoading 
}) {
  const [copiedId, setCopiedId] = React.useState(null);

  const copyShareLink = (file) => {
    const transferId = file.transferId || file.id;
    const url = `${window.location.origin}/download/${transferId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(transferId);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Share link copied for "${file.originalName}"`, 'success');
  };

  const getFileIcon = (mimeType, name) => {
    const category = getFileCategory(mimeType, name);
    switch (category.type) {
      case 'image': return <ImageIcon size={20} color="#ffffff" />;
      case 'video': return <Film size={20} color="#ffffff" />;
      case 'audio': return <Music size={20} color="#ffffff" />;
      case 'pdf': return <FileText size={20} color="#ffffff" />;
      case 'archive': return <Archive size={20} color="#ffffff" />;
      case 'code': return <Code size={20} color="#ffffff" />;
      default: return <File size={20} color="#ffffff" />;
    }
  };

  return (
    <section className="active-transfers-section" id="active-transfers-section">
      <div className="section-header">
        <h3 className="section-title">
          <FolderSync size={22} color="#000000" />
          <span>Active Transfers ({files.length})</span>
        </h3>

        <button
          type="button"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
          id="refresh-transfers-btn"
        >
          <RefreshCw size={14} color="#000000" className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {files.length === 0 ? (
        <div 
          className="glass-card" 
          style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-muted)' }}
          id="empty-transfers-state"
        >
          <File size={44} style={{ color: '#a1a1aa', margin: '0 auto 1rem' }} />
          <h4 style={{ color: '#000000', marginBottom: '0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>
            No Active Transfers
          </h4>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            Uploaded files will appear here for 24 hours. Choose a file above to get started!
          </p>
        </div>
      ) : (
        <div className="transfer-grid" id="transfer-grid">
          {files.map((file) => {
            const transferId = file.transferId || file.id;
            return (
              <div key={transferId} className="transfer-card" id={`transfer-card-${transferId}`}>
                <div>
                  {/* Top Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    <div className="file-icon-box">
                      {getFileIcon(file.mimeType, file.originalName)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 
                        style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: 800, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: '#000000' 
                        }}
                        title={file.originalName}
                      >
                        {file.originalName}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
                        {formatBytes(file.size)} &bull; {formatTimeAgo(file.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="transfer-meta-badges" style={{ marginTop: '0.9rem' }}>
                    <span className="chip chip-code">
                      Code: {file.shortCode}
                    </span>
                    <span className="chip chip-downloads">
                      {file.downloadCount} {file.downloadCount === 1 ? 'dl' : 'dls'}
                    </span>
                    {file.expiresAt && (
                      <span className="chip chip-expiry">
                        {formatExpiry(file.expiresAt)}
                      </span>
                    )}
                    {file.burnAfterDownload && (
                      <span className="chip chip-burn">
                        <Flame size={12} color="#ffffff" /> 1-time
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1.5px solid #e4e4e7',
                    marginTop: '0.25rem' 
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => copyShareLink(file)}
                    id={`copy-transfer-link-${transferId}`}
                  >
                    {copiedId === transferId ? <Check size={13} color="#000000" /> : <Copy size={13} color="#000000" />}
                    <span>{copiedId === transferId ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <a
                      href={`/download/${transferId}`}
                      className="icon-btn"
                      title="Open download page"
                      id={`open-transfer-page-${transferId}`}
                    >
                      <Download size={16} color="#000000" />
                    </a>

                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => onDelete(transferId, file.originalName)}
                      title="Delete file"
                      id={`delete-transfer-btn-${transferId}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
