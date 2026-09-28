import React from 'react';
import { Share2, HardDrive } from 'lucide-react';

export default function Navbar({ isServerOnline, fileCount }) {
  return (
    <header className="navbar">
      <a href="/" className="brand-logo" id="brand-logo">
        <div className="logo-icon-wrap">
          <Share2 size={20} strokeWidth={2.5} color="#ffffff" />
        </div>
        <div>
          <span className="brand-text-gradient">QuickShare</span>
        </div>
      </a>

      <div className="nav-actions">
        {/* Server status badge */}
        <div 
          className={`status-badge ${isServerOnline ? 'online' : 'offline'}`}
          title={isServerOnline ? 'Backend server connected' : 'Cannot connect to backend server'}
          id="server-status-badge"
        >
          <div className="status-dot" />
          <span>{isServerOnline ? 'Server Active' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
