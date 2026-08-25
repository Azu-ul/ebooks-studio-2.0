import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  FileText,
  Sparkles,
  Link as LinkIcon,
  Search,
  Tag,
  FolderOpen,
  Eye,
  Info,
  Loader2
} from 'lucide-react';
import { ImageAsset } from '../types';
import { sanitizeAnchorId } from '../utils/parser';
import { optimizeImageFile } from '../utils/imageStorage';

interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageAsset[];
  onAddImage: (image: ImageAsset) => void;
  onAddImages?: (images: ImageAsset[]) => void;
  onDeleteImage: (id: string) => void;
  onUpdateImageName: (id: string, newName: string) => void;
  onUpdateImage?: (id: string, updated: Partial<ImageAsset>) => void;
  onInsertTag: (tag: string) => void;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  isOpen,
  onClose,
  images,
  onAddImage,
  onAddImages,
  onDeleteImage,
  onUpdateImageName,
  onUpdateImage,
  onInsertTag,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Detailed modal or inline editing state for image metadata
  const [editingImage, setEditingImage] = useState<ImageAsset | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const CATEGORIES = ['Todas', 'Portadas', 'Capítulos', 'Diagramas', 'Fotografías', 'Ilustraciones', 'General'] as const;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: validFiles.length });

    const newAssets: ImageAsset[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const { dataUrl, size } = await optimizeImageFile(file, 1600, 0.88);
        const rawBase = file.name.replace(/\.[^/.]+$/, '');
        const sanitizedName = file.name.toLowerCase().replace(/\s+/g, '_');
        const autoRefId = sanitizeAnchorId(`fig_${rawBase}`);

        const newImage: ImageAsset = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${i}`,
          name: sanitizedName,
          url: dataUrl,
          sizeBytes: size,
          caption: `Figura ilustrativa: ${rawBase.replace(/_/g, ' ')}`,
          category: sanitizedName.includes('portada') ? 'Portadas' : 'Fotografías',
          referenceId: autoRefId,
          createdAt: Date.now(),
        };

        newAssets.push(newImage);
      } catch (err) {
        console.error(`Error processing image ${file.name}:`, err);
      }

      setProcessingProgress({ current: i + 1, total: validFiles.length });
    }

    if (newAssets.length > 0) {
      if (onAddImages) {
        onAddImages(newAssets);
      } else {
        newAssets.forEach((img) => onAddImage(img));
      }
    }

    setIsProcessing(false);
    setProcessingProgress(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleCopyTag = (tag: string, id: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredImages = images.filter((img) => {
    const matchesCat = selectedCategory === 'Todas' || img.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (img.caption && img.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (img.referenceId && img.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSaveMetadata = (img: ImageAsset) => {
    if (onUpdateImage) {
      onUpdateImage(img.id, {
        name: img.name.trim().toLowerCase().replace(/\s+/g, '_'),
        caption: img.caption,
        category: img.category,
        referenceId: sanitizeAnchorId(img.referenceId || `fig_${img.name}`),
      });
    } else {
      onUpdateImageName(img.id, img.name.trim().toLowerCase().replace(/\s+/g, '_'));
    }
    setEditingImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] border border-[#D1CEC8] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#D1CEC8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1A1A1A]">Gestor Editorial de Imágenes & Leyendas</h2>
              <p className="text-xs text-[#777]">
                Organiza imágenes por categoría, edita leyendas y genera referencias cruzadas interactivas
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
          {/* Top Row: Drag & Drop Uploader */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[#1A1A1A] bg-white'
                : 'border-[#D1CEC8] bg-white hover:border-[#888] hover:bg-[#FAF9F7]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FAF9F7] border border-[#D1CEC8] flex items-center justify-center text-[#B8860B] shrink-0">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#B8860B]" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div className="text-left">
                {isProcessing && processingProgress ? (
                  <>
                    <p className="text-xs font-bold text-[#B8860B]">
                      Optimizando e importando imágenes ({processingProgress.current} de {processingProgress.total})...
                    </p>
                    <p className="text-[11px] text-[#777]">
                      Comprimiendo y guardando en almacenamiento de alta capacidad (IndexedDB)...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Haz clic para subir o arrastra tus imágenes aquí (puedes subir múltiples a la vez)
                    </p>
                    <p className="text-[11px] text-[#777]">
                      Soporta JPG, PNG, WebP y SVG. Guardado seguro sin límite de 5MB.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors text-xs ${
                    selectedCategory === cat
                      ? 'bg-[#1A1A1A] text-white font-semibold'
                      : 'bg-white text-[#555] border border-[#D1CEC8] hover:bg-[#FAF9F7]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, ancla o leyenda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#D1CEC8] rounded-lg focus:outline-hidden focus:border-[#B8860B]"
              />
            </div>
          </div>

          {/* Images Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-[#888] uppercase tracking-widest">
                Catálogo de Imágenes ({filteredImages.length} de {images.length})
              </h3>
              <span className="text-[11px] text-[#777]">
                Inserta imágenes completas con leyenda o copia enlaces de referencia cruzada
              </span>
            </div>

            {filteredImages.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg border border-[#D1CEC8] text-[#888] text-xs space-y-1">
                <p className="font-semibold text-[#1A1A1A]">No se encontraron imágenes</p>
                <p>Sube imágenes arrastrándolas arriba o ajusta los filtros de búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredImages.map((img) => {
                  const refId = img.referenceId || sanitizeAnchorId(`fig_${img.name}`);
                  const caption = img.caption || `Figura: ${img.name}`;
                  const fullTag = `[imagen: ${img.name} | ${caption} | 90% | ${refId}]`;
                  const refLinkTag = `[ref: ${refId} | ver figura]`;

                  return (
                    <div
                      key={img.id}
                      className="p-4 bg-white rounded-xl border border-[#D1CEC8] hover:border-[#999] transition-all shadow-xs flex flex-col justify-between group space-y-3"
                    >
                      <div className="flex gap-3 items-start">
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-lg bg-[#FAF9F7] border border-[#D1CEC8] overflow-hidden shrink-0 flex items-center justify-center relative">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {img.category && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-black/70 text-white backdrop-blur-xs">
                              {img.category}
                            </span>
                          )}
                        </div>

                        {/* Info & Caption */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[#1A1A1A] truncate font-mono" title={img.name}>
                              {img.name}
                            </span>
                            <button
                              onClick={() => setEditingImage({ ...img })}
                              className="p-1 text-[#888] hover:text-[#1A1A1A] hover:bg-[#FAF9F7] rounded transition-colors"
                              title="Editar leyenda y metadatos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-[#555] line-clamp-2 leading-relaxed italic">
                            "{caption}"
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8] flex items-center gap-1">
                              <LinkIcon className="w-2.5 h-2.5" />
                              <span>#{refId}</span>
                            </span>
                            <span className="text-[10px] text-[#888]">
                              {formatFileSize(img.sizeBytes) || 'Optimizada'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-[#F0ECE6] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onInsertTag(fullTag);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white font-semibold text-[11px] rounded transition-colors flex items-center gap-1"
                            title="Insertar imagen con leyenda y ancla en el editor"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Insertar Imagen</span>
                          </button>

                          <button
                            onClick={() => handleCopyTag(refLinkTag, `ref_${img.id}`)}
                            className="px-2 py-1 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#2C2C2C] text-[11px] rounded border border-[#D1CEC8] transition-colors flex items-center gap-1"
                            title="Copiar enlace de referencia cruzada [ref: id | texto]"
                          >
                            {copiedId === `ref_${img.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3 h-3 text-[#B8860B]" />
                                <span>Ref. Cruzada</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => onDeleteImage(img.id)}
                          className="p-1 text-[#999] hover:text-rose-600 transition-colors"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Edit Image Metadata Submodal */}
        {editingImage && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FAF9F7] border border-[#D1CEC8] rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D1CEC8] pb-3">
                <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">
                  Editar Metadatos & Leyenda de Imagen
                </h3>
                <button
                  onClick={() => setEditingImage(null)}
                  className="p-1 text-[#777] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Nombre del Archivo (Slug):</label>
                  <input
                    type="text"
                    value={editingImage.name}
                    onChange={(e) => setEditingImage({ ...editingImage, name: e.target.value })}
                    className="w-full p-2 bg-white border border-[#D1CEC8] rounded font-mono text-xs focus:border-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Leyenda Editorial / Pie de Foto:</label>
                  <textarea
                    rows={2}
                    value={editingImage.caption || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, caption: e.target.value })}
                    placeholder="Ejemplo: Figura 1.2: Esquema conceptual del proceso editorial..."
                    className="w-full p-2 bg-white border border-[#D1CEC8] rounded text-xs focus:border-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">Categoría:</label>
                    <select
                      value={editingImage.category || 'General'}
                      onChange={(e) => setEditingImage({ ...editingImage, category: e.target.value as any })}
                      className="w-full p-2 bg-white border border-[#D1CEC8] rounded text-xs focus:border-[#1A1A1A]"
                    >
                      <option value="Portadas">Portadas</option>
                      <option value="Capítulos">Capítulos</option>
                      <option value="Diagramas">Diagramas</option>
                      <option value="Fotografías">Fotografías</option>
                      <option value="Ilustraciones">Ilustraciones</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">ID de Referencia Cruzada:</label>
                    <input
                      type="text"
                      value={editingImage.referenceId || ''}
                      onChange={(e) => setEditingImage({ ...editingImage, referenceId: e.target.value })}
                      placeholder="fig_mi_imagen"
                      className="w-full p-2 bg-white border border-[#D1CEC8] rounded font-mono text-xs focus:border-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D1CEC8]">
                <button
                  onClick={() => setEditingImage(null)}
                  className="px-3 py-1.5 rounded border border-[#D1CEC8] text-xs font-semibold text-[#555] hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveMetadata(editingImage)}
                  className="px-4 py-1.5 rounded bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#333]"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#D1CEC8] bg-white flex items-center justify-between text-xs text-[#777]">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>Enlaza cualquier imagen en tus párrafos usando <code className="font-mono text-[#1A1A1A] font-bold">[ref: fig_id | Ver Figura]</code></span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#1A1A1A] font-semibold rounded border border-[#D1CEC8] transition-colors"
          >
            Cerrar Gestor
          </button>
        </div>
      </div>
    </div>
  );
};
