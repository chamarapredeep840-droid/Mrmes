import { MemeSound } from '../types/soundboard';

const DB_NAME = 'FF_Meme_Soundboard_DB';
const DB_VERSION = 1;
const STORE_MEMES = 'custom_memes';
const STORE_FAVORITES = 'favorites';
const STORE_SETTINGS = 'settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MEMES)) {
        db.createObjectStore(STORE_MEMES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredCustomMemes(): Promise<MemeSound[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMES, 'readonly');
      const store = tx.objectStore(STORE_MEMES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read error, falling back to localStorage', err);
    const saved = localStorage.getItem('ff_custom_memes');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveCustomMeme(meme: MemeSound): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMES, 'readwrite');
      const store = tx.objectStore(STORE_MEMES);
      const req = store.put(meme);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error', err);
    const existing = await getStoredCustomMemes();
    const updated = [...existing.filter(m => m.id !== meme.id), meme];
    try {
      localStorage.setItem('ff_custom_memes', JSON.stringify(updated));
    } catch {
      // localStorage size exceeded
    }
  }
}

export async function deleteCustomMeme(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEMES, 'readwrite');
      const store = tx.objectStore(STORE_MEMES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error', err);
  }
}

export function getFavoritesFromStorage(): string[] {
  try {
    const favs = localStorage.getItem('ff_favorite_memes');
    return favs ? JSON.parse(favs) : [];
  } catch {
    return [];
  }
}

export function saveFavoritesToStorage(ids: string[]): void {
  try {
    localStorage.setItem('ff_favorite_memes', JSON.stringify(ids));
  } catch (e) {
    console.warn('Error saving favorites', e);
  }
}

export function fileToDataUri(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
