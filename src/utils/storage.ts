import { AlbumPhoto, AlbumState } from '../types/album';

const DB_NAME = 'photo_monograph_db';
const DB_VERSION = 1;
const STORE_NAME = 'album_store';
const STATE_KEY = 'current_album';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

export async function loadAlbumState(): Promise<AlbumState | null> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as AlbumState | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveAlbumState(state: AlbumState): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Gracefully ignore storage quota or private browsing restrictions
  }
}

export async function clearAlbumState(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore errors
  }
}

const MAX_IMAGE_DIMENSION = 2400;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = src;
  });
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

export async function processImageFiles(files: FileList | File[]): Promise<AlbumPhoto[]> {
  const fileArray = Array.from(files).filter((file) =>
    file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)
  );

  const results: AlbumPhoto[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const img = await loadImageElement(rawDataUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      let finalDataUrl = rawDataUrl;

      if (targetWidth > MAX_IMAGE_DIMENSION || targetHeight > MAX_IMAGE_DIMENSION) {
        const scale = Math.min(
          MAX_IMAGE_DIMENSION / targetWidth,
          MAX_IMAGE_DIMENSION / targetHeight
        );
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          finalDataUrl = canvas.toDataURL(mimeType, 0.92);
        }
      }

      results.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${i}`,
        dataUrl: finalDataUrl,
        fileName: file.name,
        title: stripExtension(file.name),
        description: '',
        width: targetWidth,
        height: targetHeight,
        createdAt: Date.now() + i,
      });
    } catch {
      // Skip unreadable/corrupted image files safely
    }
  }

  return results;
}

export async function rotatePhotoDataUrl(photo: AlbumPhoto): Promise<AlbumPhoto> {
  const img = await loadImageElement(photo.dataUrl);
  const srcWidth = img.naturalWidth || photo.width;
  const srcHeight = img.naturalHeight || photo.height;

  const canvas = document.createElement('canvas');
  canvas.width = srcHeight;
  canvas.height = srcWidth;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return photo;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -srcWidth / 2, -srcHeight / 2, srcWidth, srcHeight);

  const isPng = photo.dataUrl.startsWith('data:image/png');
  const nextDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.94);

  return {
    ...photo,
    dataUrl: nextDataUrl,
    width: srcHeight,
    height: srcWidth,
  };
}
