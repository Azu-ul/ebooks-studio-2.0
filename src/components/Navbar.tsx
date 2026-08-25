import React from 'react';
import { 
  BookOpen, 
  Download, 
  Printer, 
  Image as ImageIcon, 
  HelpCircle, 
  Palette, 
  Eye, 
  FileText
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
  totalPageCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  activeTab,
  setActiveTab,
  onOpenImages,
  onOpenCheatsheet,
  onOpenExport,
  totalPageCount,
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
        {/* Tab switcher for mobile / medium screens */}
        <div className="flex items-center bg-[#FAF9F7] p-1 rounded border border-[#D1CEC8] shrink-0">
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

          <button
            id="nav-tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs rounded transition-all tracking-wide lg:hidden shrink-0 ${
              activeTab === 'preview'
                ? 'bg-[#1A1A1A] text-white shadow-xs font-medium'
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>Vista Previa ({totalPageCount})</span>
          </button>
        </div>
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
