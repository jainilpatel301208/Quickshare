export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatExpiry(expiresAt) {
  if (!expiresAt) return 'No expiration';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `Expires in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Expires in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Expires in ${days}d`;
}

export function getFileCategory(mimeType = '', filename = '') {
  const ext = filename.split('.').pop().toLowerCase();
  
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return { type: 'image', label: 'Image' };
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return { type: 'video', label: 'Video' };
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return { type: 'audio', label: 'Audio' };
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return { type: 'pdf', label: 'PDF Document' };
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return { type: 'archive', label: 'Archive' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'cpp', 'c', 'java', 'go', 'rs'].includes(ext)) {
    return { type: 'code', label: 'Code File' };
  }
  return { type: 'file', label: 'Document' };
}
