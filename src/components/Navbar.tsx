import React from 'react';
import { 
  BookOpen, 
  Download, 
  Printer, 
  Image as ImageIcon, 
  HelpCircle, 
  Palette, 
  Eye, 
  FileText,
  History,
  Bookmark,
  Columns2,
  Square
} from 'lucide-react';
import { BookSettings } from '../types';

interface NavbarProps {
  settings: BookSettings;
  onUpdateSettings: (settings: Partial<BookSettings>) => void;
  activeTab: 'editor' | 'design' | 'preview';
  setActiveTab: (tab: 'editor' | 'design' | 'preview') => void;
  onOpenImages: () => void;
  onOpenCheatsheet: () => void;
  onOpenExport: () => void;
  onOpenHistory: () => void;
  savedOutlinesCount: number;
  totalPageCount: number;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  activeTab,
  setActiveTab,
  onOpenImages,
  onOpenCheatsheet,
  onOpenExport,
  onOpenHistory,
  savedOutlinesCount,
  totalPageCount,
  isSplitView = false,
  onToggleSplitView,
}) => {
  return (
    <header className="h-14 border-b border-[#D1CEC8] bg-white flex items-center justify-between px-4 sm:px-6 select-none z-30 shrink-0 shadow-xs">
      {/* Brand & Title */}
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        <div className="w-8 h-8 bg-[#1A1A1A] flex items-center justify-center rounded text-white shrink-0 shadow-xs">
          <span className="font-serif italic text-lg font-bold leading-none">E</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#1A1A1A] truncate">
              E-Book Studio
            </h1>
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#FAF9F7] text-[#B8860B] border border-[#B8860B]/40 rounded tracking-widest uppercase shrink-0">
              PRO
            </span>
          </div>
          <input
            type="text"
            value={settings.bookTitle}
            onChange={(e) => onUpdateSettings({ bookTitle: e.target.value })}
            placeholder="Título del Ebook..."
            className="text-xs text-[#111111] font-semibold bg-[#FAF9F7] hover:bg-white focus:bg-white px-2 py-0.5 rounded border border-[#D1CEC8] focus:border-[#111111] outline-none w-32 sm:w-52 md:w-60 truncate transition-colors font-serif italic placeholder:text-[#888]"
            title="Haz clic para renombrar tu libro"
          />
        </div>
      </div>

      {/* Center navigation */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Tab switcher for all devices */}
        <div className="flex items-center bg-[#FAF9F7] p-1 rounded border border-[#D1CEC8] shrink-0">
          <button
            id="nav-tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs rounded transition-all tracking-wide shrink-0 ${
              activeTab === 'preview'
                ? 'bg-[#1A1A1A] text-white shadow-xs font-medium'
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Vista Previa</span>
            <span className="sm:hidden">Libro</span>
            <span className="text-[10px] opacity-75 font-mono">({totalPageCount})</span>
          </button>

          <button
            id="nav-tab-editor"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs rounded transition-all tracking-wide shrink-0 ${
              activeTab === 'editor'
                ? 'bg-[#1A1A1A] text-white shadow-xs font-medium'
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="inline">Editor</span>
          </button>

          <button
            id="nav-tab-design"
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs rounded transition-all tracking-wide shrink-0 ${
              activeTab === 'design'
                ? 'bg-[#1A1A1A] text-white shadow-xs font-medium'
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Estilo & Diseño</span>
            <span className="sm:hidden">Estilo</span>
          </button>
        </div>

        {/* Optional Desktop Split-screen toggle (side-by-side) */}
        {onToggleSplitView && (
          <button
            id="nav-btn-split-toggle"
            onClick={onToggleSplitView}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors shrink-0 ${
              isSplitView
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-[#FAF9F7] text-[#666] hover:text-[#1A1A1A] hover:bg-white border-[#D1CEC8]'
            }`}
            title={isSplitView ? 'Volver a vista completa (sin división)' : 'Ver editor y libro lado a lado'}
          >
            {isSplitView ? <Square className="w-3.5 h-3.5" /> : <Columns2 className="w-3.5 h-3.5 text-[#B8860B]" />}
            <span>{isSplitView ? 'Vista Completa' : 'Dividir'}</span>
          </button>
        )}
      </div>

      {/* Action buttons & tools */}
      <div className="flex items-center gap-2">
        {/* Image library trigger */}
        <button
          id="btn-images-manager"
          onClick={onOpenImages}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2C2C2C] hover:text-[#1A1A1A] bg-[#FAF9F7] hover:bg-white border border-[#D1CEC8] rounded transition-colors"
          title="Gestor de Imágenes para tu Ebook"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#B8860B]" />
          <span className="hidden sm:inline tracking-wide">Imágenes</span>
        </button>

        {/* Tag cheatsheet helper */}
        <button
          id="btn-tag-guide"
          onClick={onOpenCheatsheet}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2C2C2C] hover:text-[#1A1A1A] bg-[#FAF9F7] hover:bg-white border border-[#D1CEC8] rounded transition-colors"
          title="Guía de Etiquetas disponibles"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#666]" />
          <span className="hidden sm:inline tracking-wide">Guía</span>
        </button>

        {/* History / Outlines trigger */}
        <button
          id="btn-history-outlines"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2C2C2C] hover:text-[#1A1A1A] bg-[#FAF9F7] hover:bg-white border border-[#D1CEC8] rounded transition-colors relative"
          title="Historial de esquemas y versiones guardadas del ebook"
        >
          <History className="w-3.5 h-3.5 text-[#B8860B]" />
          <span className="hidden sm:inline tracking-wide">Esquemas</span>
          {savedOutlinesCount > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#1A1A1A] text-white rounded-full leading-tight">
              {savedOutlinesCount}
            </span>
          )}
        </button>

        {/* Primary Export Button */}
        <button
          id="btn-export-pdf"
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium tracking-wider uppercase text-white bg-[#1A1A1A] hover:bg-[#333333] rounded shadow-xs transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar PDF</span>
        </button>
      </div>
    </header>
  );
};
