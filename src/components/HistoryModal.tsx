import React, { useState } from 'react';
import { 
  X, 
  History, 
  Save, 
  Bookmark, 
  Check, 
  Copy, 
  Download, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Search, 
  FileText, 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { SavedBookOutline, BookSettings } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  currentSettings: BookSettings;
  outlines: SavedBookOutline[];
  onSaveOutline: (name: string) => void;
  onLoadOutline: (outline: SavedBookOutline) => void;
  onDeleteOutline: (id: string) => void;
  onUpdateOutlineName: (id: string, newName: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  currentSettings,
  outlines,
  onSaveOutline,
  onLoadOutline,
  onDeleteOutline,
  onUpdateOutlineName,
}) => {
  const [newOutlineName, setNewOutlineName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [confirmLoadOutline, setConfirmLoadOutline] = useState<SavedBookOutline | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveCurrent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = newOutlineName.trim() || `${currentSettings.bookTitle || 'Esquema de Ebook'}`;
    onSaveOutline(finalName);
    setNewOutlineName('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleCopyOutline = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadOutline = (outline: SavedBookOutline) => {
    const filename = `${outline.name.toLowerCase().replace(/[^a-z0-9_-]/gi, '_')}.txt`;
    const blob = new Blob([outline.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartEditing = (outline: SavedBookOutline) => {
    setEditingId(outline.id);
    setEditingNameValue(outline.name);
  };

  const handleSaveEditing = (id: string) => {
    if (editingNameValue.trim()) {
      onUpdateOutlineName(id, editingNameValue.trim());
    }
    setEditingId(null);
  };

  const handleExecuteLoad = (outline: SavedBookOutline) => {
    onLoadOutline(outline);
    setConfirmLoadOutline(null);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return formatDate(timestamp);
  };

  const filteredOutlines = outlines.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.bookTitle && item.bookTitle.toLowerCase().includes(q)) ||
      item.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] border border-[#D1CEC8] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D1CEC8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                Historial de Esquemas del Ebook
              </h2>
              <p className="text-xs text-[#777]">
                Guarda instantáneas completas de tu texto y estructura en el almacenamiento local para restaurarlas o editarlas cuando quieras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#777] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Quick Save Action Bar */}
          <div className="p-4 bg-white border border-[#D1CEC8] rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#B8860B]" />
                Guardar esquema actual
              </span>
              <span className="text-[11px] text-[#777]">
                Se guardará el texto íntegro ({currentContent.length} caracteres)
              </span>
            </div>

            <form onSubmit={handleSaveCurrent} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newOutlineName}
                onChange={(e) => setNewOutlineName(e.target.value)}
                placeholder={`Nombre del esquema (ej: ${currentSettings.bookTitle || 'Borrador'} - Versión final)...`}
                className="flex-1 px-3 py-2 text-xs bg-[#FAF9F7] border border-[#D1CEC8] rounded-lg focus:outline-hidden focus:bg-white focus:border-[#B8860B] transition-colors"
              />
              <button
                type="submit"
                id="btn-confirm-save-outline"
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Esquema Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#B8860B]" />
                    <span>Guardar esquema del ebook</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Search & List Header */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Esquemas Guardados ({outlines.length})
              </h3>
            </div>

            {outlines.length > 0 && (
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en esquemas guardados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D1CEC8] rounded-lg focus:outline-hidden focus:border-[#B8860B]"
                />
              </div>
            )}
          </div>

          {/* Outlines List */}
          {outlines.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-[#D1CEC8] space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8] flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">
                  Aún no tienes esquemas guardados
                </h4>
                <p className="text-xs text-[#666] leading-relaxed">
                  Haz clic en el botón <strong>"Guardar esquema del ebook"</strong> arriba para almacenar una copia de seguridad completa del contenido en tu navegador.
                </p>
              </div>
              <button
                onClick={() => handleSaveCurrent()}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Guardar esquema ahora</span>
              </button>
            </div>
          ) : filteredOutlines.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-[#D1CEC8] text-xs text-[#777]">
              No se encontraron esquemas que coincidan con "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOutlines.map((item) => {
                const isExpanded = expandedPreviewId === item.id;
                const isEditing = editingId === item.id;
                const previewSnippet = item.content.slice(0, 240);

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-[#D1CEC8] hover:border-[#999] transition-all shadow-xs space-y-3"
                  >
                    {/* Top row: Title & Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditing(item.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="text-xs font-semibold p-1 px-2 border border-[#B8860B] rounded bg-[#FAF9F7] text-[#1A1A1A] w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditing(item.id)}
                              className="px-2 py-1 bg-[#1A1A1A] text-white text-[11px] font-medium rounded hover:bg-[#333]"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-[#666] text-[11px] hover:bg-[#FAF9F7] rounded"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-[#1A1A1A] truncate">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => handleStartEditing(item)}
                              className="p-1 text-[#888] hover:text-[#1A1A1A] rounded transition-colors"
                              title="Renombrar esquema"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#777] mt-0.5">
                          <span className="flex items-center gap-1 font-medium text-[#555]">
                            <Clock className="w-3 h-3 text-[#B8860B]" />
                            {formatRelativeTime(item.savedAt)}
                          </span>
                          <span>•</span>
                          <span>{formatDate(item.savedAt)}</span>
                          {item.bookTitle && item.bookTitle !== item.name && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-[180px]">"{item.bookTitle}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats badges */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF9F7] text-[#1A1A1A] border border-[#D1CEC8] rounded">
                          {item.wordCount} palabras
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8] rounded">
                          {item.chapterCount} caps
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF9F7] text-[#777] border border-[#D1CEC8] rounded">
                          {item.characterCount} car.
                        </span>
                      </div>
                    </div>

                    {/* Preview snippet */}
                    <div className="bg-[#FAF9F7] p-2.5 rounded-lg border border-[#E0DCD6] text-xs font-mono text-[#444] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-[#888] font-sans">
                        <span className="font-bold uppercase tracking-wider">Estructura & Texto:</span>
                        <button
                          onClick={() => setExpandedPreviewId(isExpanded ? null : item.id)}
                          className="text-[#B8860B] hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <span>{isExpanded ? 'Contraer vista' : 'Ver más'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <p className={`whitespace-pre-wrap leading-relaxed text-[11px] ${isExpanded ? 'max-h-60 overflow-y-auto' : 'line-clamp-2'}`}>
                        {isExpanded ? item.content : previewSnippet + (item.content.length > 240 ? '...' : '')}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-[#F0ECE6] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Restore / Load Button */}
                        <button
                          onClick={() => setConfirmLoadOutline(item)}
                          className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                          title="Cargar y restaurar este esquema en el editor"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#B8860B]" />
                          <span>Cargar en el Editor</span>
                        </button>

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyOutline(item.content, item.id)}
                          className="px-2.5 py-1.5 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#2C2C2C] text-xs font-medium rounded-lg border border-[#D1CEC8] transition-colors flex items-center gap-1"
                          title="Copiar todo el texto del esquema"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#666]" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        {/* Download .txt button */}
                        <button
                          onClick={() => handleDownloadOutline(item)}
                          className="px-2.5 py-1.5 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#2C2C2C] text-xs font-medium rounded-lg border border-[#D1CEC8] transition-colors flex items-center gap-1"
                          title="Descargar como archivo de texto .txt"
                        >
                          <Download className="w-3.5 h-3.5 text-[#666]" />
                          <span className="hidden sm:inline">Descargar .txt</span>
                        </button>
                      </div>

                      {/* Delete button */}
                      <div>
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-rose-600 font-medium">¿Eliminar?</span>
                            <button
                              onClick={() => {
                                onDeleteOutline(item.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 text-white text-[11px] font-bold rounded hover:bg-rose-700"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-[#E5E2DE] text-[#333] text-[11px] rounded hover:bg-[#D1CEC8]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 text-[#999] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar este esquema guardado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation Modal for Loading an Outline */}
        {confirmLoadOutline && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FAF9F7] border border-[#D1CEC8] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">
                    ¿Cargar esquema en el editor?
                  </h3>
                  <p className="text-xs text-[#666]">
                    Se reemplazará el texto actual del editor con la versión seleccionada.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#D1CEC8] rounded-lg text-xs space-y-1">
                <p className="font-semibold text-[#1A1A1A]">{confirmLoadOutline.name}</p>
                <p className="text-[#666] text-[11px]">
                  Guardado el {formatDate(confirmLoadOutline.savedAt)} • {confirmLoadOutline.wordCount} palabras • {confirmLoadOutline.chapterCount} capítulos
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D1CEC8]">
                <button
                  onClick={() => setConfirmLoadOutline(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#D1CEC8] text-xs font-semibold text-[#555] hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleExecuteLoad(confirmLoadOutline)}
                  className="px-4 py-1.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#333] transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Sí, Cargar Esquema</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#D1CEC8] bg-white flex items-center justify-between text-xs text-[#777]">
          <span className="text-[11px]">
            Tus esquemas se guardan localmente en tu navegador sin límite de caducidad.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#1A1A1A] font-semibold rounded border border-[#D1CEC8] transition-colors"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};
