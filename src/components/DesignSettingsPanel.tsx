import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Layout, 
  Hash, 
  BookOpen, 
  Sparkles, 
  Sliders, 
  AlignJustify, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Check,
  RotateCcw,
  Pilcrow,
  Plus,
  Trash2,
  Copy,
  Edit2
} from 'lucide-react';
import { BookSettings, PageSize, ParagraphStylePreset } from '../types';
import { THEME_PRESETS, TYPOGRAPHY_PAIRINGS, DEFAULT_BOOK_SETTINGS, DEFAULT_PARAGRAPH_STYLES } from '../utils/templates';

interface DesignSettingsPanelProps {
  settings: BookSettings;
  onUpdateSettings: (settings: Partial<BookSettings>) => void;
}

export const DesignSettingsPanel: React.FC<DesignSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [activeSection, setActiveSection] = useState<'theme' | 'typography' | 'styles' | 'layout' | 'numbers'>('theme');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(settings.paragraphStyles?.[0]?.id || 'dialogo');
  const [copiedStyleId, setCopiedStyleId] = useState<string | null>(null);

  const FONT_OPTIONS = [
    'Libre Baskerville',
    'Playfair Display',
    'Lora',
    'Merriweather',
    'Cinzel',
    'Cormorant Garamond',
    'Inter',
    'Plus Jakarta Sans',
    'Outfit',
    'Montserrat',
  ];

  const currentStyles = settings.paragraphStyles || DEFAULT_PARAGRAPH_STYLES;
  const rawActiveStyle = currentStyles.find((s) => s.id === selectedStyleId) || currentStyles[0] || DEFAULT_PARAGRAPH_STYLES[0];
  
  const activeStyle: ParagraphStylePreset = {
    id: rawActiveStyle?.id || 'estandar',
    name: rawActiveStyle?.name || 'Estilo Editorial',
    description: rawActiveStyle?.description || '',
    firstLineIndent: rawActiveStyle?.firstLineIndent ?? 0,
    spaceBefore: rawActiveStyle?.spaceBefore ?? 0,
    spaceAfter: rawActiveStyle?.spaceAfter ?? 8,
    lineHeight: rawActiveStyle?.lineHeight ?? 1.6,
    textAlign: rawActiveStyle?.textAlign || 'justify',
    fontStyle: rawActiveStyle?.fontStyle || 'normal',
    fontWeight: rawActiveStyle?.fontWeight || 'normal',
    borderLeftWidth: rawActiveStyle?.borderLeftWidth ?? 0,
    borderLeftColor: rawActiveStyle?.borderLeftColor || '#B8860B',
    paddingLeft: rawActiveStyle?.paddingLeft ?? 0,
    backgroundColor: rawActiveStyle?.backgroundColor || '',
    textColor: rawActiveStyle?.textColor || '',
    fontSizeDelta: rawActiveStyle?.fontSizeDelta ?? 0,
    isDefault: rawActiveStyle?.isDefault ?? false,
  };

  const handleUpdateActiveStyle = (updates: Partial<ParagraphStylePreset>) => {
    if (!rawActiveStyle) return;
    const targetId = rawActiveStyle.id;
    const updatedList = currentStyles.map((style) => {
      if (style.id === targetId) {
        return { ...style, ...updates };
      }
      return style;
    });
    onUpdateSettings({ paragraphStyles: updatedList });
  };

  const handleCreateNewStyle = () => {
    const newId = `estilo_${Date.now().toString(36)}`;
    const newStyle: ParagraphStylePreset = {
      id: newId,
      name: `Estilo Personalizado ${currentStyles.length + 1}`,
      description: 'Estilo configurable para párrafos especiales.',
      firstLineIndent: 20,
      spaceBefore: 8,
      spaceAfter: 8,
      lineHeight: 1.6,
      textAlign: 'justify',
      fontStyle: 'normal',
      fontWeight: 'normal',
      isDefault: false,
    };
    onUpdateSettings({ paragraphStyles: [...currentStyles, newStyle] });
    setSelectedStyleId(newId);
  };

  const handleDeleteStyle = (id: string) => {
    if (currentStyles.length <= 1) return;
    const filtered = currentStyles.filter((s) => s.id !== id);
    onUpdateSettings({ paragraphStyles: filtered });
    if (selectedStyleId === id) {
      setSelectedStyleId(filtered[0]?.id || 'dialogo');
    }
  };

  const handleCopyStyleTag = (style: ParagraphStylePreset) => {
    const tag = `[parrafo: estilo=${style.id} | Tu texto aquí con el estilo ${style.name}]`;
    navigator.clipboard.writeText(tag);
    setCopiedStyleId(style.id);
    setTimeout(() => setCopiedStyleId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF9F7] border-r border-[#D1CEC8] select-none overflow-hidden min-w-0">
      {/* Header & Reset */}
      <div className="shrink-0 p-3.5 sm:p-4 border-b border-[#D1CEC8] bg-white flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#B8860B]" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
            Configuración de Estilo Editorial
          </h2>
        </div>
        <button
          onClick={() => onUpdateSettings(DEFAULT_BOOK_SETTINGS)}
          className="flex items-center gap-1 text-[11px] text-[#777] hover:text-[#1A1A1A] transition-colors"
          title="Restablecer valores por defecto"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-[#D1CEC8] bg-[#FAF9F7] p-1.5 gap-1.5 overflow-x-auto z-10">
        <button
          onClick={() => setActiveSection('theme')}
          className={`shrink-0 py-2 px-3 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSection === 'theme' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          <span>Color & Papel</span>
        </button>
        <button
          onClick={() => setActiveSection('typography')}
          className={`shrink-0 py-2 px-3 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSection === 'typography' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/60'
          }`}
        >
          <Type className="w-3.5 h-3.5 shrink-0" />
          <span>Tipografía</span>
        </button>
        <button
          onClick={() => setActiveSection('styles')}
          className={`shrink-0 py-2 px-3 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSection === 'styles' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/60'
          }`}
        >
          <Pilcrow className="w-3.5 h-3.5 shrink-0" />
          <span>Estilos de Párrafo</span>
        </button>
        <button
          onClick={() => setActiveSection('layout')}
          className={`shrink-0 py-2 px-3 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSection === 'layout' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/60'
          }`}
        >
          <Layout className="w-3.5 h-3.5 shrink-0" />
          <span>Márgenes</span>
        </button>
        <button
          onClick={() => setActiveSection('numbers')}
          className={`shrink-0 py-2 px-3 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSection === 'numbers' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/60'
          }`}
        >
          <Hash className="w-3.5 h-3.5 shrink-0" />
          <span>Paginación</span>
        </button>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 min-w-0">
        {/* SECTION 1: THEME & BACKGROUND COLOR */}
        {activeSection === 'theme' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] block mb-2">
                Temas de Papel y Color
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = settings.themeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onUpdateSettings({
                          themeId: preset.id,
                          backgroundColor: preset.bg,
                          textColor: preset.text,
                          accentColor: preset.accent,
                          secondaryTextColor: preset.secondary,
                          borderColor: preset.border,
                        });
                      }}
                      className={`p-2.5 rounded border text-left flex flex-col gap-1.5 transition-all ${
                        isSelected
                          ? 'border-[#1A1A1A] bg-white ring-1 ring-[#1A1A1A]'
                          : 'border-[#D1CEC8] bg-[#FAF9F7] hover:bg-white hover:border-[#888]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                            style={{ backgroundColor: preset.bg }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{preset.name}</p>
                        <p className="text-[10px] text-[#777] line-clamp-1">{preset.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-3 shadow-xs">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Paleta Personalizada</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Color de Papel</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value, themeId: 'custom' })}
                      className="w-7 h-7 rounded border border-[#D1CEC8] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value, themeId: 'custom' })}
                      className="w-20 text-xs font-mono bg-white border border-[#C5C2BC] rounded px-2 py-1 text-[#111111] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Texto Principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => onUpdateSettings({ textColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[#D1CEC8] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.textColor}
                      onChange={(e) => onUpdateSettings({ textColor: e.target.value })}
                      className="w-20 text-xs font-mono bg-white border border-[#C5C2BC] rounded px-2 py-1 text-[#111111] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Acento (Ochre / Oro)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[#D1CEC8] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                      className="w-20 text-xs font-mono bg-white border border-[#C5C2BC] rounded px-2 py-1 text-[#111111] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Bordes y Separadores</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.borderColor}
                      onChange={(e) => onUpdateSettings({ borderColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[#D1CEC8] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.borderColor}
                      onChange={(e) => onUpdateSettings({ borderColor: e.target.value })}
                      className="w-20 text-xs font-mono bg-white border border-[#C5C2BC] rounded px-2 py-1 text-[#111111] font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: TYPOGRAPHY & SIZES */}
        {activeSection === 'typography' && (
          <div className="space-y-4">
            {/* Quick Pairings */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] block mb-2">
                Combinaciones Tipográficas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TYPOGRAPHY_PAIRINGS.map((pair) => (
                  <button
                    key={pair.name}
                    onClick={() => {
                      onUpdateSettings({
                        fontHeading: pair.heading,
                        fontBody: pair.body,
                      });
                    }}
                    className={`p-2.5 rounded border text-left transition-all ${
                      settings.fontHeading === pair.heading && settings.fontBody === pair.body
                        ? 'border-[#1A1A1A] bg-white ring-1 ring-[#1A1A1A]'
                        : 'border-[#D1CEC8] bg-[#FAF9F7] hover:bg-white hover:border-[#888]'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#1A1A1A]">{pair.name}</p>
                    <p className="text-[10px] text-[#B8860B] font-serif italic">{pair.heading} + {pair.body}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#555] block mb-1">Fuente de Títulos</label>
                <select
                  value={settings.fontHeading}
                  onChange={(e) => onUpdateSettings({ fontHeading: e.target.value })}
                  className="w-full text-xs bg-white border border-[#D1CEC8] rounded p-2 text-[#2C2C2C] outline-none focus:border-[#1A1A1A]"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#555] block mb-1">Fuente del Cuerpo</label>
                <select
                  value={settings.fontBody}
                  onChange={(e) => onUpdateSettings({ fontBody: e.target.value })}
                  className="w-full text-xs bg-white border border-[#D1CEC8] rounded p-2 text-[#2C2C2C] outline-none focus:border-[#1A1A1A]"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sizing & Line Height Controls */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-3 shadow-xs">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#333] font-medium">Tamaño de Fuente Base</span>
                  <span className="text-[#1A1A1A] font-mono font-semibold">{settings.fontSizeBase}px</span>
                </div>
                <input
                  type="range"
                  min={11}
                  max={20}
                  step={0.5}
                  value={settings.fontSizeBase}
                  onChange={(e) => onUpdateSettings({ fontSizeBase: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#333] font-medium">Escala de Títulos</span>
                  <span className="text-[#1A1A1A] font-mono font-semibold">x{settings.headingScale}</span>
                </div>
                <input
                  type="range"
                  min={1.15}
                  max={1.8}
                  step={0.05}
                  value={settings.headingScale}
                  onChange={(e) => onUpdateSettings({ headingScale: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#333] font-medium">Interlineado (Line Height)</span>
                  <span className="text-[#1A1A1A] font-mono font-semibold">{settings.lineHeight}</span>
                </div>
                <input
                  type="range"
                  min={1.3}
                  max={2.1}
                  step={0.05}
                  value={settings.lineHeight}
                  onChange={(e) => onUpdateSettings({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#333] font-medium">Espaciado entre Párrafos</span>
                  <span className="text-[#1A1A1A] font-mono font-semibold">{settings.paragraphSpacing}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={24}
                  step={2}
                  value={settings.paragraphSpacing}
                  onChange={(e) => onUpdateSettings({ paragraphSpacing: parseInt(e.target.value) })}
                  className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Alignment & Paragraph Style */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] block">Alineación del Texto</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUpdateSettings({ textAlign: 'justify' })}
                  className={`py-1.5 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    settings.textAlign === 'justify' ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-white text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                  }`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                  <span>Justificado</span>
                </button>
                <button
                  onClick={() => onUpdateSettings({ textAlign: 'left' })}
                  className={`py-1.5 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    settings.textAlign === 'left' ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-white text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Izquierda</span>
                </button>
                <button
                  onClick={() => onUpdateSettings({ textAlign: 'center' })}
                  className={`py-1.5 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    settings.textAlign === 'center' ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-white text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>Centrado</span>
                </button>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#333]">
                  <input
                    type="checkbox"
                    checked={settings.paragraphIndent}
                    onChange={(e) => onUpdateSettings({ paragraphIndent: e.target.checked })}
                    className="rounded border-[#D1CEC8] text-[#1A1A1A] focus:ring-[#1A1A1A] w-4 h-4 bg-white"
                  />
                  <span>Sangría en primera línea (Norma editorial clásica)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ADVANCED PARAGRAPH STYLES */}
        {activeSection === 'styles' && (
          <div className="space-y-5">
            {/* Style Selector & Add New */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#888]">
                  Estilos de Párrafo Disponibles
                </label>
                <button
                  onClick={handleCreateNewStyle}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#B8860B] hover:text-[#1A1A1A] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Estilo</span>
                </button>
              </div>

              {/* Presets List */}
              <div className="grid grid-cols-1 gap-2">
                {currentStyles.map((style) => {
                  const isSelected = style.id === selectedStyleId;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#1A1A1A] bg-white ring-1 ring-[#1A1A1A] shadow-xs'
                          : 'border-[#D1CEC8] bg-[#FAF9F7] hover:bg-white hover:border-[#888]'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1A1A1A]">{style.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E5E2DE] text-[#555]">
                            {style.id}
                          </span>
                        </div>
                        {style.description && (
                          <p className="text-[10px] text-[#777] truncate mt-0.5">{style.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopyStyleTag(style)}
                          className="px-2 py-1 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#2C2C2C] text-[10px] font-semibold rounded border border-[#D1CEC8] flex items-center gap-1 transition-colors"
                          title="Copiar etiqueta para el editor"
                        >
                          {copiedStyleId === style.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#B8860B]" />
                              <span>Etiqueta</span>
                            </>
                          )}
                        </button>

                        {!style.isDefault && currentStyles.length > 1 && (
                          <button
                            onClick={() => handleDeleteStyle(style.id)}
                            className="p-1 text-[#999] hover:text-rose-600 transition-colors rounded"
                            title="Eliminar estilo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Style Properties Editor */}
            {activeStyle && (
              <div className="p-4 bg-white rounded-xl border border-[#D1CEC8] space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#F0ECE6] pb-2">
                  <h3 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>Propiedades de "{activeStyle.name}"</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#888]">{activeStyle.id}</span>
                </div>

                {/* Name & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#1A1A1A] block mb-1 uppercase tracking-wider">Nombre Visible</label>
                    <input
                      type="text"
                      value={activeStyle.name}
                      onChange={(e) => handleUpdateActiveStyle({ name: e.target.value })}
                      placeholder="Nombre del estilo..."
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-[#C5C2BC] rounded-md text-[#111111] placeholder:text-[#888] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] shadow-2xs transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#1A1A1A] block mb-1 uppercase tracking-wider">Descripción</label>
                    <input
                      type="text"
                      value={activeStyle.description || ''}
                      onChange={(e) => handleUpdateActiveStyle({ description: e.target.value })}
                      placeholder="Propósito del estilo..."
                      className="w-full text-xs font-medium p-2.5 bg-white border border-[#C5C2BC] rounded-md text-[#111111] placeholder:text-[#888] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111] shadow-2xs transition-colors"
                    />
                  </div>
                </div>

                {/* Indent, Spacing & Line Height Sliders */}
                <div className="space-y-3 pt-2">
                  {/* First Line Indent */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#555] mb-1">
                      <span className="font-semibold">Sangría de Primera Línea</span>
                      <span className="font-mono text-[#1A1A1A] font-bold">{activeStyle.firstLineIndent}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={2}
                      value={activeStyle.firstLineIndent}
                      onChange={(e) => handleUpdateActiveStyle({ firstLineIndent: parseInt(e.target.value) })}
                      className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#999] mt-0.5">
                      <span>0px (Sin sangría)</span>
                      <span>24px (Estándar)</span>
                      <span>60px (Profunda)</span>
                    </div>
                  </div>

                  {/* Space Before */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#555] mb-1">
                      <span className="font-semibold">Espaciado Antes del Párrafo</span>
                      <span className="font-mono text-[#1A1A1A] font-bold">{activeStyle.spaceBefore}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={2}
                      value={activeStyle.spaceBefore}
                      onChange={(e) => handleUpdateActiveStyle({ spaceBefore: parseInt(e.target.value) })}
                      className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Space After */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#555] mb-1">
                      <span className="font-semibold">Espaciado Después del Párrafo</span>
                      <span className="font-mono text-[#1A1A1A] font-bold">{activeStyle.spaceAfter}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={2}
                      value={activeStyle.spaceAfter}
                      onChange={(e) => handleUpdateActiveStyle({ spaceAfter: parseInt(e.target.value) })}
                      className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Line Height */}
                  <div>
                    <div className="flex justify-between text-[11px] text-[#555] mb-1">
                      <span className="font-semibold">Espaciado Entre Líneas (Interlineado)</span>
                      <span className="font-mono text-[#1A1A1A] font-bold">{activeStyle.lineHeight.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={2.4}
                      step={0.05}
                      value={activeStyle.lineHeight}
                      onChange={(e) => handleUpdateActiveStyle({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#999] mt-0.5">
                      <span>1.1x (Compacto)</span>
                      <span>1.6x (Editorial)</span>
                      <span>2.2x (Abierto)</span>
                    </div>
                  </div>
                </div>

                {/* Alignment & Typography Options */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#555] block mb-1.5">Alineación</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'left', icon: AlignLeft, label: 'Izq' },
                        { id: 'justify', icon: AlignJustify, label: 'Just' },
                        { id: 'center', icon: AlignCenter, label: 'Cen' },
                        { id: 'right', icon: AlignRight, label: 'Der' },
                      ].map((align) => {
                        const Icon = align.icon;
                        return (
                          <button
                            key={align.id}
                            onClick={() => handleUpdateActiveStyle({ textAlign: align.id as any })}
                            className={`py-1.5 flex flex-col items-center justify-center rounded border transition-colors ${
                              (activeStyle.textAlign || 'justify') === align.id
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-[#FAF9F7] text-[#555] border-[#D1CEC8] hover:bg-white'
                            }`}
                            title={align.label}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#555] block mb-1.5">Estilo Tipográfico</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => handleUpdateActiveStyle({ 
                          fontStyle: activeStyle.fontStyle === 'italic' ? 'normal' : 'italic' 
                        })}
                        className={`py-1.5 text-xs font-serif rounded border italic transition-colors ${
                          activeStyle.fontStyle === 'italic'
                            ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]'
                            : 'bg-[#FAF9F7] text-[#555] border-[#D1CEC8] hover:bg-white'
                        }`}
                      >
                        Cursiva
                      </button>
                      <button
                        onClick={() => handleUpdateActiveStyle({ 
                          fontWeight: activeStyle.fontWeight === 'bold' ? 'normal' : 'bold' 
                        })}
                        className={`py-1.5 text-xs rounded border font-bold transition-colors ${
                          activeStyle.fontWeight === 'bold'
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-[#FAF9F7] text-[#555] border-[#D1CEC8] hover:bg-white'
                        }`}
                      >
                        Negrita
                      </button>
                    </div>
                  </div>
                </div>

                {/* Border Left Accent */}
                <div className="pt-2 border-t border-[#F0ECE6]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#1A1A1A]">Borde Lateral de Resalte</span>
                    <select
                      value={activeStyle.borderLeftWidth || 0}
                      onChange={(e) => handleUpdateActiveStyle({ 
                        borderLeftWidth: parseInt(e.target.value),
                        paddingLeft: parseInt(e.target.value) > 0 ? 14 : 0,
                        borderLeftColor: activeStyle.borderLeftColor || '#B8860B'
                      })}
                      className="text-xs bg-white text-[#111111] font-medium border border-[#C5C2BC] rounded-md px-2.5 py-1.5 focus:border-[#111111] outline-none"
                    >
                      <option value={0}>Sin borde lateral</option>
                      <option value={2}>Borde Fino (2px)</option>
                      <option value={3}>Borde Medio (3px)</option>
                      <option value={4}>Borde Grueso (4px)</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview Box of the Style */}
                <div className="p-3 bg-[#FAF9F7] rounded-lg border border-[#D1CEC8]">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-2">
                    Vista Previa del Estilo
                  </span>
                  <div
                    style={{
                      textIndent: `${activeStyle.firstLineIndent}px`,
                      marginTop: `${activeStyle.spaceBefore}px`,
                      marginBottom: `${activeStyle.spaceAfter}px`,
                      lineHeight: activeStyle.lineHeight,
                      textAlign: activeStyle.textAlign || 'justify',
                      fontStyle: activeStyle.fontStyle || 'normal',
                      fontWeight: activeStyle.fontWeight || 'normal',
                      borderLeft: activeStyle.borderLeftWidth ? `${activeStyle.borderLeftWidth}px solid ${activeStyle.borderLeftColor || '#B8860B'}` : 'none',
                      paddingLeft: activeStyle.paddingLeft ? `${activeStyle.paddingLeft}px` : '0px',
                      backgroundColor: activeStyle.backgroundColor || 'transparent',
                    }}
                    className="text-xs text-[#1A1A1A] font-serif transition-all"
                  >
                    «Este es un ejemplo de párrafo renderizado en tiempo real aplicando las reglas de sangría ({activeStyle.firstLineIndent}px), espaciado e interlineado configuradas».
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: FORMAT & MARGINS */}
        {activeSection === 'layout' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] block mb-2">Formato de Página</label>
              <div className="grid grid-cols-4 gap-2">
                {(['A5', 'A4', 'Letter', 'B5'] as PageSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSettings({ pageSize: size })}
                    className={`py-2 text-xs font-medium rounded border text-center transition-all ${
                      settings.pageSize === size ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-white text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                    }`}
                  >
                    {size}
                    <span className="block text-[9px] opacity-70 font-normal">
                      {size === 'A5' ? 'Ebook' : size === 'A4' ? 'Grande' : size === 'Letter' ? 'Carta US' : 'Editorial'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] block mb-2">Orientación</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSettings({ orientation: 'portrait' })}
                  className={`py-2 text-xs font-medium rounded border transition-colors ${
                    settings.orientation === 'portrait' ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-white text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                  }`}
                >
                  Vertical (Libro tradicional)
                </button>
                <button
                  onClick={() => onUpdateSettings({ orientation: 'landscape' })}
                  className={`py-2 text-xs font-medium rounded border transition-colors ${
                    settings.orientation === 'landscape' ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-white text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                  }`}
                >
                  Horizontal (Álbum / Diapositivas)
                </button>
              </div>
            </div>

            {/* Margin Sliders (mm) */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Márgenes de Impresión (mm)</h3>
                  <span className="text-[10px] text-[#2E7D32] font-medium block">
                    ✓ Interactivos: repaginan el texto automáticamente sin cortes
                  </span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ marginTop: 22, marginBottom: 22, marginLeft: 22, marginRight: 22 })}
                  className="text-[10px] text-[#B8860B] hover:underline font-semibold"
                >
                  Estándar 22mm
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[#555] mb-1">
                    <span>Superior</span>
                    <span className="font-mono text-[#1A1A1A] font-semibold">{settings.marginTop}mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={settings.marginTop}
                    onChange={(e) => onUpdateSettings({ marginTop: parseInt(e.target.value) })}
                    className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#555] mb-1">
                    <span>Inferior</span>
                    <span className="font-mono text-[#1A1A1A] font-semibold">{settings.marginBottom}mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={settings.marginBottom}
                    onChange={(e) => onUpdateSettings({ marginBottom: parseInt(e.target.value) })}
                    className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#555] mb-1">
                    <span>Izquierdo</span>
                    <span className="font-mono text-[#1A1A1A] font-semibold">{settings.marginLeft}mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={settings.marginLeft}
                    onChange={(e) => onUpdateSettings({ marginLeft: parseInt(e.target.value) })}
                    className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#555] mb-1">
                    <span>Derecho</span>
                    <span className="font-mono text-[#1A1A1A] font-semibold">{settings.marginRight}mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    value={settings.marginRight}
                    onChange={(e) => onUpdateSettings({ marginRight: parseInt(e.target.value) })}
                    className="w-full accent-[#1A1A1A] h-1.5 bg-[#E5E2DE] rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: PAGE NUMBERS & HEADERS */}
        {activeSection === 'numbers' && (
          <div className="space-y-4">
            {/* Numbering Toggle */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1A1A1A] block">
                    Numeración de Páginas
                  </span>
                  <span className="text-[11px] text-[#777]">
                    Muestra los números de página en el documento
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPageNumbers}
                  onChange={(e) => onUpdateSettings({ showPageNumbers: e.target.checked })}
                  className="rounded border-[#D1CEC8] text-[#1A1A1A] focus:ring-[#1A1A1A] w-4 h-4 bg-white cursor-pointer"
                />
              </div>

              {settings.showPageNumbers && (
                <div className="space-y-3 pt-3 border-t border-[#D1CEC8]">
                  <div>
                    <label className="text-[11px] font-medium text-[#555] block mb-1">Formato de Número</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '- 1 -', label: '- 1 -' },
                        { id: '1', label: '1' },
                        { id: 'Página 1', label: 'Página 1' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          onClick={() => onUpdateSettings({ pageNumberFormat: fmt.id as any })}
                          className={`py-1.5 text-xs rounded border transition-colors ${
                            settings.pageNumberFormat === fmt.id ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-[#FAF9F7] text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#555] block mb-1">Posición del Número</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'bottom-center', label: 'Abajo Centrado' },
                        { id: 'bottom-right', label: 'Abajo Derecha' },
                        { id: 'top-right', label: 'Arriba Derecha' },
                        { id: 'alternating', label: 'Alternado (Doble Pág)' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => onUpdateSettings({ pageNumberPosition: pos.id as any })}
                          className={`py-1.5 text-xs rounded border transition-colors ${
                            settings.pageNumberPosition === pos.id ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-[#FAF9F7] text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#333]">
                      <input
                        type="checkbox"
                        checked={settings.hideNumberOnCover}
                        onChange={(e) => onUpdateSettings({ hideNumberOnCover: e.target.checked })}
                        className="rounded border-[#D1CEC8] text-[#1A1A1A] focus:ring-[#1A1A1A] w-4 h-4 bg-white"
                      />
                      <span>Ocultar número en la Portada</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#333]">
                      <input
                        type="checkbox"
                        checked={settings.hideNumberOnIndex}
                        onChange={(e) => onUpdateSettings({ hideNumberOnIndex: e.target.checked })}
                        className="rounded border-[#D1CEC8] text-[#1A1A1A] focus:ring-[#1A1A1A] w-4 h-4 bg-white"
                      />
                      <span>Ocultar número en la página del Índice</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Running Header */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1A1A1A] block">
                    Encabezado Superior (Running Header)
                  </span>
                  <span className="text-[11px] text-[#777]">
                    Texto mostrado en la parte superior de cada página
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showHeader}
                  onChange={(e) => onUpdateSettings({ showHeader: e.target.checked })}
                  className="rounded border-[#D1CEC8] text-[#1A1A1A] focus:ring-[#1A1A1A] w-4 h-4 bg-white cursor-pointer"
                />
              </div>

              {settings.showHeader && (
                <div className="pt-2 border-t border-[#D1CEC8] space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#1A1A1A] block mb-1">Encabezado Izquierdo (Título de la obra / sección)</label>
                    <input
                      type="text"
                      value={settings.headerText}
                      onChange={(e) => onUpdateSettings({ headerText: e.target.value })}
                      placeholder="Título del libro o tema..."
                      className="w-full text-xs bg-white border border-[#C5C2BC] rounded-md p-2.5 text-[#111111] font-medium placeholder:text-[#888] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] shadow-2xs transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#1A1A1A] block mb-1">Encabezado Derecho (Capítulo / Autor)</label>
                    <input
                      type="text"
                      value={settings.headerRightText || ''}
                      onChange={(e) => onUpdateSettings({ headerRightText: e.target.value })}
                      placeholder="Dinámico: Nombre de capítulo o autor..."
                      className="w-full text-xs bg-white border border-[#C5C2BC] rounded-md p-2.5 text-[#111111] font-medium placeholder:text-[#888] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] shadow-2xs transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-[#888] italic">
                    💡 También puedes cambiar el encabezado en páginas específicas usando la etiqueta <code>[encabezado: Izq | Der]</code> en el editor de texto.
                  </p>
                </div>
              )}
            </div>

            {/* Cover Edition Badge */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1A1A1A] block">
                    Etiqueta de Portada (Badge de Edición)
                  </span>
                  <span className="text-[11px] text-[#777]">
                    Texto superior ornamental en la portada
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={settings.editionBadge ?? 'Edición Publicada'}
                onChange={(e) => onUpdateSettings({ editionBadge: e.target.value })}
                placeholder="Ej: 1ª Edición • 2026, Edición Coleccionista, etc."
                className="w-full text-xs bg-white border border-[#C5C2BC] rounded-md p-2.5 text-[#111111] font-medium placeholder:text-[#888] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] shadow-2xs transition-colors"
              />
              <p className="text-[10px] text-[#888] italic">
                💡 O puedes definirla directamente en el texto con <code>[editorial: Tu Texto]</code> o dentro de <code>[portada: ...]</code>.
              </p>
            </div>

            {/* Chapter Ornaments */}
            <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-2 shadow-xs">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] block">Separadores Ornamentales</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'diamond', label: '◆ Rombo' },
                  { id: 'stars', label: '★ Estrellas' },
                  { id: 'line', label: '— Línea' },
                  { id: 'dots', label: '••• Puntos' },
                ].map((sep) => (
                  <button
                    key={sep.id}
                    onClick={() => onUpdateSettings({ decorativeSeparator: sep.id as any })}
                    className={`py-1.5 text-xs rounded border transition-colors ${
                      settings.decorativeSeparator === sep.id ? 'bg-[#1A1A1A] text-white font-semibold border-[#1A1A1A]' : 'bg-[#FAF9F7] text-[#2C2C2C] border-[#D1CEC8] hover:border-[#888]'
                    }`}
                  >
                    {sep.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
