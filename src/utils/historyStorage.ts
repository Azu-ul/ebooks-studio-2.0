import { SavedBookOutline, BookSettings } from '../types';

export const STORAGE_KEY_OUTLINES = 'ebook_studio_saved_outlines_v1';

export function calculateOutlineStats(content: string) {
  const clean = content.replace(/\[.*?\]/g, ' ').trim();
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = content.length;
  const chapterCount = (content.match(/\[capitulo(?::|\s)/gi) || []).length;
  return { wordCount, characterCount, chapterCount };
}

export function loadSavedOutlines(): SavedBookOutline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OUTLINES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.savedAt - a.savedAt);
    }
    return [];
  } catch (err) {
    console.warn('Error loading outlines from localStorage:', err);
    return [];
  }
}

export function saveOutlinesToStorage(outlines: SavedBookOutline[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_OUTLINES, JSON.stringify(outlines));
    return true;
  } catch (err) {
    console.error('Failed to save outlines to localStorage:', err);
    return false;
  }
}

export function saveNewOutline(params: {
  name?: string;
  content: string;
  settings?: BookSettings;
  tags?: string[];
}): SavedBookOutline {
  const { wordCount, characterCount, chapterCount } = calculateOutlineStats(params.content);
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const defaultName = params.name?.trim() || 
    (params.settings?.bookTitle ? `${params.settings.bookTitle} (${dateStr})` : `Esquema guardado (${dateStr})`);

  const newOutline: SavedBookOutline = {
    id: `outline_${now}_${Math.random().toString(36).substring(2, 7)}`,
    name: defaultName,
    savedAt: now,
    content: params.content,
    bookTitle: params.settings?.bookTitle,
    authorName: params.settings?.authorName,
    wordCount,
    characterCount,
    chapterCount,
    settings: params.settings ? { ...params.settings } : undefined,
    tags: params.tags || [],
  };

  const existing = loadSavedOutlines();
  const updated = [newOutline, ...existing];
  saveOutlinesToStorage(updated);
  return newOutline;
}

export function deleteSavedOutline(id: string): SavedBookOutline[] {
  const existing = loadSavedOutlines();
  const filtered = existing.filter((item) => item.id !== id);
  saveOutlinesToStorage(filtered);
  return filtered;
}

export function updateSavedOutline(
  id: string,
  updates: Partial<SavedBookOutline>
): SavedBookOutline[] {
  const existing = loadSavedOutlines();
  const updated = existing.map((item) => {
    if (item.id === id) {
      const merged = { ...item, ...updates };
      if (updates.content !== undefined) {
        const stats = calculateOutlineStats(updates.content);
        merged.wordCount = stats.wordCount;
        merged.characterCount = stats.characterCount;
        merged.chapterCount = stats.chapterCount;
      }
      return merged;
    }
    return item;
  });
  saveOutlinesToStorage(updated);
  return updated;
}
