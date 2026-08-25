// Lightweight and resilient IndexedDB storage for images to avoid localStorage 5MB quota limits

const DB_NAME = 'ebook_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'images_store';
const STORAGE_KEY = 'all_images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

export async function saveImagesToDB(images: any[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(images, STORAGE_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error || new Error('Error saving images to IndexedDB'));
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB, falling back to memory state:', err);
    return false;
  }
}

export async function loadImagesFromDB(): Promise<any[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STORAGE_KEY);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        reject(req.error || new Error('Error reading images from IndexedDB'));
      };
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
    return null;
  }
}

/**
 * Optimizes an image file by scaling to max 1600px width/height and compressing to JPEG/WebP
 * to prevent giant memory footprints during PDF rendering while preserving crisp print quality.
 */
export function optimizeImageFile(file: File, maxDimension = 1600, quality = 0.88): Promise<{ dataUrl: string; width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    // If it's SVG, read directly as dataUrl
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({ dataUrl, width: 800, height: 600, size: file.size });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;
      
      // Calculate scaled dimensions if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to original
        resolve({ dataUrl: img.src, width: img.width, height: img.height, size: file.size });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP or JPEG for efficient memory footprint, PNG for transparency
      const isPng = file.type === 'image/png';
      const outputType = isPng ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(outputType, quality);

      // Estimate byte size from base64
      const head = `data:${outputType};base64,`;
      const size = Math.round(((dataUrl.length - head.length) * 3) / 4);

      resolve({ dataUrl, width, height, size });
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}
