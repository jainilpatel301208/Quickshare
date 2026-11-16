# QuickShare ⚡

A fast, solid monochrome black & white file-sharing web application built with **React (Vite)** on the frontend and **Node.js (Express)** on the backend.

---

## 🚀 Quick Setup & Run Instructions

Open **two terminal windows**:

### 1. Backend Server (Port 5001)
```bash
cd backend
npm install
npm run dev
```
> Server runs at: **http://localhost:5001** (Handles unlimited 5GB+ streaming direct to disk with 24h auto-expiry)

### 2. Frontend Client (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
> Web app opens at: **http://localhost:5173**

---

## ⚡ Key Features

1. **Unlimited File Uploads (5GB+ Supported)**:
   - No file size cap. Upload multi-gigabyte files (5GB, 10GB+) smoothly.
   - Built with high-speed direct disk streaming so large files never exhaust server RAM.
   - Socket timeouts are disabled (`timeout = 0`) to support long multi-gigabyte transfers.

2. **Solid Black & White Monochrome UI**:
   - Clean, high-contrast, modern aesthetic in pure `#000000` and `#ffffff`.

3. **Instant Shareable Links & QR Codes**:
   - **Shareable Link**: Click **"Copy Link"** to copy `http://localhost:5173/download/<transferId>`.
   - **QR Code**: Every uploaded file automatically generates an interactive QR code ready for instant mobile phone scanning.
   - **Quick Code**: 6-digit numeric code for fast cross-device entry.

4. **Dedicated Download Page**:
   - Opening the share link loads the dedicated download page displaying the file name, size, type, and **"Download File"** button.
   - If the link is invalid or expired, a clear error message is shown instead of a blank screen.

5. **24-Hour Auto-Expiry**:
   - Files are automatically expired after 24 hours. Expired files and disk storage are cleaned up permanently and automatically.

---

## 🌐 GitHub Pages Live Demo
When deployed to GitHub Pages:
- **URL**: `https://jainilpatel301208.github.io/Quickshare/`
- Supports offline in-browser storage (IndexedDB) for client-side demo sharing, plus full connection to your local backend for 5GB+ transfers!
