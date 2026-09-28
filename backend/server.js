import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24-hour default expiry

// Ensure temporary uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory file repository
// Map<transferId, FileRecord> & Map<shortCode, transferId>
const filesStore = new Map();
const shortCodeMap = new Map();

// Helper: Generate a unique 6-digit share code (e.g. 748291)
function generateUniqueShortCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (shortCodeMap.has(code) && attempts < 100);
  return code;
}

// Helper: Calculate 24h expiration date
function calculateExpiryDate(expiryOption) {
  const now = Date.now();
  switch (expiryOption) {
    case '10m':
      return new Date(now + 10 * 60 * 1000);
    case '1h':
      return new Date(now + 60 * 60 * 1000);
    case '24h':
    default:
      return new Date(now + DEFAULT_EXPIRY_MS); // 24 hours standard expiry
  }
}

// Helper: Delete file from disk and store
function removeFileRecord(transferId) {
  const file = filesStore.get(transferId);
  if (!file) return;

  const filePath = path.join(uploadsDir, file.storedFileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`[Storage] Deleted file from disk: ${file.storedFileName}`);
    } catch (err) {
      console.error(`[Storage] Error deleting ${file.storedFileName}:`, err);
    }
  }

  shortCodeMap.delete(file.shortCode);
  filesStore.delete(transferId);
}

// Helper: Clean up expired temporary files and orphan disk files
function cleanupExpiredFiles() {
  const now = new Date();
  
  // 1. Remove expired registered records
  for (const [id, file] of filesStore.entries()) {
    if (file.expiresAt && new Date(file.expiresAt) < now) {
      console.log(`[Auto-cleanup] Removing 24h expired file: "${file.originalName}" (${id})`);
      removeFileRecord(id);
    }
  }

  // 2. Clean orphan disk files older than 24 hours
  try {
    const diskFiles = fs.readdirSync(uploadsDir);
    const activeStoredNames = new Set(Array.from(filesStore.values()).map((f) => f.storedFileName));

    for (const fileName of diskFiles) {
      if (!activeStoredNames.has(fileName)) {
        const filePath = path.join(uploadsDir, fileName);
        try {
          const stats = fs.statSync(filePath);
          const ageMs = Date.now() - stats.mtimeMs;
          if (ageMs > DEFAULT_EXPIRY_MS) {
            fs.unlinkSync(filePath);
            console.log(`[Auto-cleanup] Removed orphan temporary file: ${fileName}`);
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[Auto-cleanup] Error scanning uploads dir:', err);
  }
}

// Run periodic cleanup every 60 seconds
setInterval(cleanupExpiredFiles, 60 * 1000);
cleanupExpiredFiles(); // Run on startup

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${uuidv4().slice(0, 8)}`;
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${uniquePrefix}-${sanitizedBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // 1 file at a time
  },
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// Routes

// 1. Health check
app.get('/api/health', (req, res) => {
  cleanupExpiredFiles();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeFiles: filesStore.size,
    maxFileSizeMB: MAX_FILE_SIZE_MB,
    defaultExpiryHours: 24,
  });
});

// 2. Upload single file
const uploadMiddleware = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 1 },
]);

app.post('/api/upload', (req, res) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `File size exceeds the ${MAX_FILE_SIZE_MB} MB workshop limit. Please select a smaller file.`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: 'Please upload only one file at a time.',
        });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: 'Server error during file upload.' });
    }

    const file = (req.files?.file && req.files.file[0]) || (req.files?.files && req.files.files[0]) || req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file received. Please select a file to upload.' });
    }

    const { expiry = '24h', burnAfterDownload = 'false' } = req.body;
    const isBurnAfterDownload = burnAfterDownload === 'true' || burnAfterDownload === true;
    const expiresAt = calculateExpiryDate(expiry);

    const transferId = uuidv4();
    const shortCode = generateUniqueShortCode();

    const record = {
      transferId,
      id: transferId,
      shortCode,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      storedFileName: file.filename,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(), // 24h expiration timestamp
      burnAfterDownload: isBurnAfterDownload,
      downloadCount: 0,
      downloadUrl: `http://localhost:${PORT}/api/download/${transferId}`,
    };

    filesStore.set(transferId, record);
    shortCodeMap.set(shortCode, transferId);

    console.log(`[Upload] Transfer created: ID=${transferId}, Name="${record.originalName}", Size=${record.size}B, Expires=${record.expiresAt}`);

    return res.status(201).json({
      message: 'File uploaded successfully!',
      transferId,
      file: record,
      files: [record],
    });
  });
});

// 3. Get active files
app.get('/api/files', (req, res) => {
  cleanupExpiredFiles();
  const fileList = Array.from(filesStore.values()).map((f) => ({
    transferId: f.transferId,
    id: f.id,
    shortCode: f.shortCode,
    originalName: f.originalName,
    mimeType: f.mimeType,
    size: f.size,
    uploadedAt: f.uploadedAt,
    expiresAt: f.expiresAt,
    burnAfterDownload: f.burnAfterDownload,
    downloadCount: f.downloadCount,
    downloadUrl: f.downloadUrl,
  }));

  fileList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  res.json({
    total: fileList.length,
    files: fileList,
  });
});

// 4. Get file metadata by Transfer ID or Short Code
app.get('/api/files/:idOrCode', (req, res) => {
  const { idOrCode } = req.params;
  const transferId = shortCodeMap.get(idOrCode) || idOrCode;
  const file = filesStore.get(transferId);

  if (!file) {
    return res.status(404).json({ error: 'Transfer not found or has been removed.' });
  }

  // Check 24-hour expiration
  if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
    removeFileRecord(transferId);
    return res.status(410).json({ error: 'This file transfer has reached its 24-hour expiry limit and has been deleted.' });
  }

  res.json({
    transferId: file.transferId,
    id: file.id,
    shortCode: file.shortCode,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: file.uploadedAt,
    expiresAt: file.expiresAt,
    burnAfterDownload: file.burnAfterDownload,
    downloadCount: file.downloadCount,
    downloadUrl: file.downloadUrl,
  });
});

// 5. Download file by Transfer ID or Short Code
app.get('/api/download/:idOrCode', (req, res) => {
  const { idOrCode } = req.params;
  const transferId = shortCodeMap.get(idOrCode) || idOrCode;
  const file = filesStore.get(transferId);

  if (!file) {
    return res.status(404).json({ error: 'Transfer file not found or has been removed.' });
  }

  // Check 24-hour expiration
  if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
    removeFileRecord(transferId);
    return res.status(410).json({ error: 'This transfer link has expired (24h limit) and the file has been removed.' });
  }

  const filePath = path.join(uploadsDir, file.storedFileName);
  if (!fs.existsSync(filePath)) {
    removeFileRecord(transferId);
    return res.status(404).json({ error: 'File data missing on server.' });
  }

  file.downloadCount += 1;

  res.download(filePath, file.originalName, (err) => {
    if (err) {
      console.error('Download stream error:', err);
    } else {
      if (file.burnAfterDownload) {
        removeFileRecord(transferId);
        console.log(`[Burn-After-Download] Deleted file ${file.originalName} (${transferId})`);
      }
    }
  });
});

// 6. Delete file manually
app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const file = filesStore.get(id);

  if (!file) {
    return res.status(404).json({ error: 'Transfer not found.' });
  }

  removeFileRecord(id);
  res.json({ message: 'File deleted successfully.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 QuickShare Backend running on http://localhost:${PORT}`);
  console.log(`📂 Upload directory: ${uploadsDir} (24h Auto-Expiry Active, Max: ${MAX_FILE_SIZE_MB}MB)`);
});
