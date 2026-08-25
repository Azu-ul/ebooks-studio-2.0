import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { EditorPanel } from './components/EditorPanel';
import { DesignSettingsPanel } from './components/DesignSettingsPanel';
import { BookPreview } from './components/BookPreview';
import { ImageManagerModal } from './components/ImageManagerModal';
import { CheatsheetModal } from './components/CheatsheetModal';
import { ExportModal } from './components/ExportModal';
import { BookSettings, ImageAsset } from './types';
import { parseBookText } from './utils/parser';
import { DEFAULT_BOOK_SETTINGS, DEFAULT_SAMPLE_IMAGES, BOOK_TEMPLATES } from './utils/templates';
import { saveImagesToDB, loadImagesFromDB } from './utils/imageStorage';

const STORAGE_KEY_CONTENT = 'ebook_studio_content_v1';
const STORAGE_KEY_SETTINGS = 'ebook_studio_settings_v1';
const STORAGE_KEY_IMAGES = 'ebook_studio_images_v1';

export default function App() {
  // Load saved content or default sample
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTENT);
      return saved !== null ? saved : BOOK_TEMPLATES[0].sampleContent;
    } catch {
      return BOOK_TEMPLATES[0].sampleContent;
    }
  });

  // Settings state
  const [settings, setSettings] = useState<BookSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_BOOK_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_BOOK_SETTINGS;
  });

  // Images state (IndexedDB first, fallback to initial default sample)
  const [images, setImages] = useState<ImageAsset[]>(DEFAULT_SAMPLE_IMAGES);
  const [isImagesLoadedFromDB, setIsImagesLoadedFromDB] = useState(false);

  // Load from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedImages = await loadImagesFromDB();
        if (isMounted) {
          if (storedImages && Array.isArray(storedImages) && storedImages.length > 0) {
            setImages(storedImages);
          } else {
            // Check legacy localStorage migration if any
            try {
              const legacy = localStorage.getItem(STORAGE_KEY_IMAGES);
              if (legacy) {
                const parsed = JSON.parse(legacy);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setImages(parsed);
                  saveImagesToDB(parsed);
                }
                // Clear localStorage images to free quota
                localStorage.removeItem(STORAGE_KEY_IMAGES);
              }
            } catch {
              // Ignore legacy storage read error
            }
          }
          setIsImagesLoadedFromDB(true);
        }
      } catch (err) {
        console.warn('Error loading images from IndexedDB:', err);
        if (isMounted) setIsImagesLoadedFromDB(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<'editor' | 'design' | 'preview'>('editor');
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [isCheatsheetModalOpen, setIsCheatsheetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [totalPageCount, setTotalPageCount] = useState(1);

  // Auto-save content and settings to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTENT, content);
    } catch (e) {
      console.warn('Could not save content to localStorage:', e);
    }
  }, [content]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  }, [settings]);

  // Persist images safely to IndexedDB without blocking or crashing localStorage
  useEffect(() => {
    if (!isImagesLoadedFromDB) return;
    saveImagesToDB(images).catch((err) => {
      console.warn('Failed to persist images in IndexedDB:', err);
    });
  }, [images, isImagesLoadedFromDB]);

  const handleUpdateSettings = (updated: Partial<BookSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleAddImage = (image: ImageAsset) => {
    setImages((prev) => [image, ...prev.filter((i) => i.id !== image.id)]);
  };

  const handleAddImages = (newImages: ImageAsset[]) => {
    if (!newImages.length) return;
    setImages((prev) => {
      const newIds = new Set(newImages.map((i) => i.id));
      return [...newImages, ...prev.filter((i) => !newIds.has(i.id))];
    });
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleUpdateImageName = (id: string, newName: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, name: newName } : img))
    );
  };

  const handleUpdateImage = (id: string, updated: Partial<ImageAsset>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updated } : img))
    );
  };

  const handleInsertTagAtEnd = (tag: string) => {
    setContent((prev) => prev + '\n\n' + tag);
  };

  // Real-time parsing of tags
  const parsedBlocks = useMemo(() => {
    return parseBookText(content);
  }, [content]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF9F7] text-[#1A1A1A] overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImages={() => setIsImagesModalOpen(true)}
        onOpenCheatsheet={() => setIsCheatsheetModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        totalPageCount={totalPageCount}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-w-0 bg-[#FAF9F7]">
        {/* Left Side: Editor & Design Settings (Split pane on desktop) */}
        <div className={`w-full lg:w-1/2 flex flex-col h-full min-w-0 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          {activeTab === 'design' ? (
            <DesignSettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          ) : (
            <EditorPanel
              content={content}
              onChangeContent={setContent}
              images={images}
              onOpenImages={() => setIsImagesModalOpen(true)}
              onOpenCheatsheet={() => setIsCheatsheetModalOpen(true)}
            />
          )}
        </div>

        {/* Right Side: Real-time Live Book Preview */}
        <div className={`w-full lg:w-1/2 flex-1 h-full min-w-0 ${activeTab !== 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <BookPreview
            blocks={parsedBlocks}
            settings={settings}
            images={images}
            onPageCountCalculated={setTotalPageCount}
          />
        </div>
      </div>

      {/* Modals */}
      <ImageManagerModal
        isOpen={isImagesModalOpen}
        onClose={() => setIsImagesModalOpen(false)}
        images={images}
        onAddImage={handleAddImage}
        onAddImages={handleAddImages}
        onDeleteImage={handleDeleteImage}
        onUpdateImageName={handleUpdateImageName}
        onUpdateImage={handleUpdateImage}
        onInsertTag={handleInsertTagAtEnd}
      />

      <CheatsheetModal
        isOpen={isCheatsheetModalOpen}
        onClose={() => setIsCheatsheetModalOpen(false)}
        onInsertTag={handleInsertTagAtEnd}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        totalPages={totalPageCount}
      />
    </div>
  );
}
