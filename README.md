# QuickShare ⚡

A fast, clean, and beginner-friendly file-sharing web application built with **React (Vite)** on the frontend and **Node.js (Express)** on the backend.

---

## 🚀 Quick Setup & Run Instructions

Open **two terminal windows**:

### 1. Backend Server (Port 5001)
```bash
cd backend
npm install
npm run dev
```
> Server runs at: **http://localhost:5001**

### 2. Frontend Client (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
> Web app opens at: **http://localhost:5173**

---

## ⚡ How to Use

1. **Upload a File**:
   - Drag & drop a file or click **"Choose File"** (up to 25 MB demo limit).
   - Click **"Upload"** and watch real-time progress.

2. **Share with Link & QR Code**:
   - **Shareable Link**: Click **"Copy Link"** to copy `http://localhost:5173/download/<transferId>`.
   - **QR Code**: Every uploaded file automatically generates an interactive QR code ready for phone camera scanning.
   - **Quick Code**: 6-digit numeric code for fast cross-device entry.

3. **Download Page**:
   - Opening the share link loads the dedicated download page displaying the file name, size, and **"Download File"** button.
   - If the link is invalid or expired, a clear error message is shown instead of a blank screen.

4. **24-Hour Auto-Expiry**:
   - Files are automatically expired after 24 hours. Expired files are permanently deleted from the server and local disk automatically.
