import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import ShareModal from './components/ShareModal';
import ReceiveSection from './components/ReceiveSection';
import DownloadPage from './components/DownloadPage';
import ActiveTransfers from './components/ActiveTransfers';
import Toast from './components/Toast';
import { Send, DownloadCloud, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [uploadedFiles, setUploadedFiles] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [initialCodeParam, setInitialCodeParam] = useState('');
  const [downloadPageTransferId, setDownloadPageTransferId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL pathname or query parameters for /download/:id or ?code=...
  const checkUrlRoute = () => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // 1. Path route: /download/:id
    if (path.startsWith('/download/')) {
      const id = path.replace('/download/', '').trim();
      if (id) {
        setDownloadPageTransferId(id);
        return;
      }
    }

    // 2. Query param: ?download=:id
    const downloadQuery = params.get('download');
    if (downloadQuery) {
      setDownloadPageTransferId(downloadQuery);
      return;
    }

    // 3. Query param: ?code=:code
    const codeQuery = params.get('code');
    if (codeQuery) {
      setInitialCodeParam(codeQuery);
      setActiveTab('receive');
      setDownloadPageTransferId(null);
      return;
    }

    setDownloadPageTransferId(null);
  };

  useEffect(() => {
    checkUrlRoute();

    const handlePopState = () => {
      checkUrlRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToHome = () => {
    setDownloadPageTransferId(null);
    setUploadedFiles(null);
    setActiveTab('send');
    window.history.pushState({}, '', '/');
  };

  // Fetch active files and monitor server connectivity
  const fetchFiles = async () => {
    setIsLoadingTransfers(true);
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setAllFiles(data.files || []);
        setIsServerOnline(true);
      } else {
        setIsServerOnline(false);
      }
    } catch (err) {
      console.warn('Backend server not reachable:', err);
      setIsServerOnline(false);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSuccess = (files) => {
    setUploadedFiles(files);
    fetchFiles();
    showToast('File uploaded successfully! Share link is ready.', 'success');
  };

  const handleResetUpload = () => {
    setUploadedFiles(null);
    fetchFiles();
  };

  const handleDeleteFile = async (id, fileName) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Deleted "${fileName}"`, 'info');
        setAllFiles((prev) => prev.filter((f) => (f.transferId || f.id) !== id));
        if (uploadedFiles) {
          setUploadedFiles((prev) => prev?.filter((f) => (f.transferId || f.id) !== id) || null);
        }
      } else {
        showToast('Failed to delete file.', 'error');
      }
    } catch (err) {
      showToast('Network error while deleting.', 'error');
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar
        isServerOnline={isServerOnline}
        fileCount={allFiles.length}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {/* If visiting a specific Download link */}
        {downloadPageTransferId ? (
          <DownloadPage
            transferId={downloadPageTransferId}
            onGoHome={navigateToHome}
            showToast={showToast}
          />
        ) : (
          <>
            {/* Homepage Hero Section */}
            <section className="hero-section">
              <div className="hero-pill">
                <span className="hero-pill-dot" />
                <span>Next-Gen File Sharing</span>
              </div>

              <h1 className="hero-title">
                Simple, Fast &amp; <span>Private</span> File Transfer
              </h1>

              <p className="hero-subtitle">
                Drag and drop your file to instantly generate a shareable link, QR code, or 6-digit Quick Code.
              </p>
            </section>

            {/* Action Tabs: Send Files / Receive */}
            <div className="tabs-container">
              <div className="tabs-wrapper">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('send');
                    setUploadedFiles(null);
                  }}
                  id="send-tab-btn"
                >
                  <Send size={16} />
                  <span>Send File</span>
                </button>

                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'receive' ? 'active' : ''}`}
                  onClick={() => setActiveTab('receive')}
                  id="receive-tab-btn"
                >
                  <DownloadCloud size={16} />
                  <span>Receive / Download</span>
                </button>
              </div>
            </div>

            {/* Tab Views */}
            {activeTab === 'send' && (
              <div className="tab-content-area">
                {uploadedFiles ? (
                  <ShareModal
                    uploadedFiles={uploadedFiles}
                    onReset={handleResetUpload}
                    showToast={showToast}
                  />
                ) : (
                  <UploadSection
                    onUploadSuccess={handleUploadSuccess}
                    showToast={showToast}
                  />
                )}
              </div>
            )}

            {activeTab === 'receive' && (
              <div className="tab-content-area">
                <ReceiveSection
                  initialCode={initialCodeParam}
                  showToast={showToast}
                />
              </div>
            )}

            {/* Live Active Transfers List */}
            <ActiveTransfers
              files={allFiles}
              onRefresh={fetchFiles}
              onDelete={handleDeleteFile}
              showToast={showToast}
              isLoading={isLoadingTransfers}
            />
          </>
        )}
      </main>

      {/* Floating Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Clean Footer */}
      <footer className="footer">
        <p>QuickShare &bull; In-Memory Secure File Transfer &bull; Up to 25MB Demo Limit</p>
      </footer>
    </div>
  );
}
