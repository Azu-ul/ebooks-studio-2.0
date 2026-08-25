import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Sparkles,
  Settings2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookSettings } from '../types';
import { exportBookToPdf, triggerBrowserPrint, ExportProgress } from '../utils/pdfExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BookSettings;
  onUpdateSettings: (settings: Partial<BookSettings>) => void;
  totalPages: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  totalPages,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({
    currentPage: 0,
    totalPages: 0,
    status: 'idle',
    message: '',
  });

  if (!isOpen) return null;

  const handleExportDirectPdf = async () => {
    setIsExporting(true);
    setProgress({
      currentPage: 0,
      totalPages,
      status: 'rendering',
      message: 'Iniciando renderizado de páginas de alta calidad...',
    });

    try {
      await exportBookToPdf('#ebook-preview-container', settings, (prog) => {
        setProgress(prog);
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setIsExporting(false);
      }, 1500);
    } catch (err: any) {
      setProgress({
        currentPage: 0,
        totalPages,
        status: 'error',
        message: err.message || 'Error al exportar el PDF',
      });
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    onClose();
    setTimeout(() => {
      triggerBrowserPrint(settings.bookTitle);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] border border-[#D1CEC8] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#D1CEC8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1A1A1A]">Exportar Ebook a PDF</h2>
              <p className="text-xs text-[#777]">
                Genera tu archivo listo para comercializar o imprimir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded text-[#777] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Document Summary Card */}
          <div className="p-4 bg-white rounded border border-[#D1CEC8] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Resumen del Ebook</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FAF9F7] text-[#1A1A1A] rounded border border-[#D1CEC8]">
                {totalPages} Páginas maquetadas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[#888] block text-[11px]">Título</span>
                <span className="text-[#1A1A1A] font-semibold truncate block">{settings.bookTitle || 'Sin título'}</span>
              </div>
              <div>
                <span className="text-[#888] block text-[11px]">Formato & Papel</span>
                <span className="text-[#1A1A1A] font-medium">
                  {settings.pageSize} ({settings.orientation === 'portrait' ? 'Vertical' : 'Horizontal'})
                </span>
              </div>
              <div>
                <span className="text-[#888] block text-[11px]">Tipografía</span>
                <span className="text-[#1A1A1A] font-medium font-serif">{settings.fontHeading} + {settings.fontBody}</span>
              </div>
              <div>
                <span className="text-[#888] block text-[11px]">Numeración</span>
                <span className="text-[#1A1A1A] font-medium">
                  {settings.showPageNumbers ? settings.pageNumberFormat : 'Desactivada'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress or status */}
          {isExporting && (
            <div className="p-4 bg-white border border-[#B8860B]/40 rounded space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-[#1A1A1A]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B8860B]" />
                  {progress.message}
                </span>
                <span className="font-mono font-bold">
                  {progress.currentPage > 0 ? `${progress.currentPage} / ${progress.totalPages}` : ''}
                </span>
              </div>
              {progress.totalPages > 0 && (
                <div className="w-full bg-[#E5E2DE] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#1A1A1A] h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${(progress.currentPage / progress.totalPages) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {progress.status === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Tu archivo PDF ha sido descargado correctamente!</span>
            </div>
          )}

          {progress.status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded flex items-center gap-2 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{progress.message}</span>
            </div>
          )}

          {/* Dual Export Methods */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleExportDirectPdf}
              disabled={isExporting}
              className="w-full p-3.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-bold text-sm rounded shadow flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando Ebook...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Descargar Archivo PDF Directo (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isExporting}
              className="w-full p-3 bg-white hover:bg-[#FAF9F7] text-[#1A1A1A] font-semibold text-xs rounded border border-[#D1CEC8] flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#B8860B]" />
              <span>Imprimir / Guardar como PDF Vectorial (Nativo)</span>
            </button>
            <p className="text-[11px] text-[#777] text-center">
              Recomendación: La opción "Guardar como PDF Vectorial" ofrece textos 100% nítidos a cualquier nivel de zoom.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D1CEC8] bg-white flex justify-end">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-1.5 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#2C2C2C] text-xs font-medium rounded border border-[#D1CEC8] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
