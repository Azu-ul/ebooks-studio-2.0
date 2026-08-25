import React, { useEffect, useMemo, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  BookOpen, 
  FileText,
  Sparkles,
  Printer,
  Link as LinkIcon,
  Tag,
  Scan,
  Ruler
} from 'lucide-react';
import { BookSettings, ImageAsset, ParagraphStylePreset, ParsedBlock } from '../types';
import { renderInlineMarkdown, sanitizeAnchorId } from '../utils/parser';
import { getPageDimensions } from '../utils/pdfExport';

interface BookPreviewProps {
  blocks: ParsedBlock[];
  settings: BookSettings;
  images: ImageAsset[];
  onPageCountCalculated?: (count: number) => void;
}

interface PageData {
  pageNumber: number;
  isCover: boolean;
  isIndex: boolean;
  blocks: ParsedBlock[];
  footnotes: ParsedBlock[];
  chapterTitle?: string;
  headerLeft?: string;
  headerRight?: string;
}

export const BookPreview: React.FC<BookPreviewProps> = ({
  blocks,
  settings,
  images,
  onPageCountCalculated,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(0.85); // 0.85 default scale
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(false);

  // Map image name to URL and metadata for fast lookup
  const imageMap = useMemo(() => {
    const map = new Map<string, ImageAsset>();
    images.forEach((img) => {
      map.set(img.name.toLowerCase().trim(), img);
      if (img.referenceId) {
        map.set(img.referenceId.toLowerCase().trim(), img);
      }
    });
    return map;
  }, [images]);

  // Map paragraph styles for fast lookup
  const paragraphStyleMap = useMemo(() => {
    const map = new Map<string, ParagraphStylePreset>();
    (settings.paragraphStyles || []).forEach((style) => {
      map.set(style.id.toLowerCase().trim(), style);
      map.set(sanitizeAnchorId(style.name), style);
    });
    return map;
  }, [settings.paragraphStyles]);

  // Smooth scroll to anchor target without visual highlight flashes
  const scrollToAnchor = (targetId: string) => {
    if (!targetId) return;
    const cleanId = sanitizeAnchorId(targetId);
    const element = document.getElementById(`anchor_${cleanId}`) || 
                    document.querySelector(`[data-anchor="${cleanId}"]`) ||
                    document.getElementById(`anchor_capitulo_${cleanId}`);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Global listener for cross-reference links inside preview container
  useEffect(() => {
    const container = document.getElementById('ebook-preview-container');
    if (!container) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const linkEl = target.closest('[data-target-anchor], [data-footnote], .cross-reference-link');
      if (linkEl) {
        e.preventDefault();
        e.stopPropagation();
        const anchorAttr = linkEl.getAttribute('data-target-anchor');
        const footnoteAttr = linkEl.getAttribute('data-footnote');
        if (anchorAttr) {
          scrollToAnchor(anchorAttr);
        } else if (footnoteAttr) {
          scrollToAnchor(`nota_pie_${footnoteAttr}`);
        }
      }
    };

    container.addEventListener('click', handleLinkClick);
    return () => {
      container.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Exact page dimensions in pixels based on standard 96 DPI CSS scale
  const pageDimensions = useMemo(() => {
    const { width: widthMm, height: heightMm } = getPageDimensions(settings.pageSize, settings.orientation);
    const mmToPx = (mm: number) => Math.round(mm * 3.779527559);
    
    const widthPx = mmToPx(widthMm);
    const heightPx = mmToPx(heightMm);
    const marginTopPx = mmToPx(settings.marginTop ?? 20);
    const marginBottomPx = mmToPx(settings.marginBottom ?? 20);
    const marginLeftPx = mmToPx(settings.marginLeft ?? 20);
    const marginRightPx = mmToPx(settings.marginRight ?? 20);

    const hasConfiguredHeader = settings.showHeader && Boolean(settings.headerText?.trim() || settings.headerRightText?.trim());
    const headerHeightPx = hasConfiguredHeader ? 36 : 0;
    const pageNumberHeightPx = settings.showPageNumbers ? 32 : 0;
    
    // Margen de seguridad estándar para páginas regulares de lectura (evita que el texto toque el pie o se corte)
    const safetyBufferRegularPx = 28;
    // Margen de seguridad ajustado exclusivamente para páginas de índice (para que los elementos lleguen casi hasta el final)
    const safetyBufferIndexPx = 4;

    const contentWidthPx = Math.max(100, widthPx - marginLeftPx - marginRightPx);
    const availableContentHeightPx = Math.max(80, heightPx - marginTopPx - marginBottomPx - headerHeightPx - pageNumberHeightPx - safetyBufferRegularPx);
    const availableIndexHeightPx = Math.max(80, heightPx - marginTopPx - marginBottomPx - (hasConfiguredHeader ? 24 : 0) - (settings.showPageNumbers ? 20 : 0) - safetyBufferIndexPx);

    return {
      widthMm,
      heightMm,
      widthPx,
      heightPx,
      contentWidthPx,
      availableContentHeightPx,
      availableIndexHeightPx,
      marginTopPx,
      marginBottomPx,
      marginLeftPx,
      marginRightPx,
    };
  }, [settings.pageSize, settings.orientation, settings.marginTop, settings.marginBottom, settings.marginLeft, settings.marginRight, settings.showHeader, settings.showPageNumbers, settings.headerText, settings.headerRightText]);

  // Intelligent pagination segmentation algorithm with automatic paragraph and list splitting
  const pages: PageData[] = useMemo(() => {
    if (blocks.length === 0) {
      return [
        {
          pageNumber: 1,
          isCover: false,
          isIndex: false,
          blocks: [{
            id: 'empty_1',
            type: 'parrafo',
            content: 'Escribe tu contenido en el editor para comenzar...',
          }],
          footnotes: [],
        },
      ];
    }

    const { contentWidthPx, availableContentHeightPx, availableIndexHeightPx } = pageDimensions;
    const generatedPages: PageData[] = [];
    let currentBlocks: ParsedBlock[] = [];
    let currentFootnotes: ParsedBlock[] = [];
    let currentHeightEstimate = 0;
    let pageNum = 1;
    let currentChapterTitle = '';
    let currentHeaderLeft = settings.headerText || '';
    let currentHeaderRight = settings.headerRightText || '';

    const isBlockVisible = (b: ParsedBlock) => {
      if (!b) return false;
      if (b.type === 'ancla' || b.type === 'encabezado' || b.type === 'editorial') return false;
      if (b.type === 'salto_de_pagina') return false;
      if (b.type === 'parrafo' && (!b.content || !b.content.trim())) return false;
      return true;
    };

    const hasVisibleContent = (blocksList: ParsedBlock[], footnotesList: ParsedBlock[]) => {
      if (footnotesList && footnotesList.length > 0) return true;
      return blocksList.some(isBlockVisible);
    };

    const pushCurrentPage = (isCover = false, isIndex = false) => {
      const isVisible = isCover || isIndex || hasVisibleContent(currentBlocks, currentFootnotes);
      if (isVisible) {
        const hasIndexContent = isIndex || currentBlocks.some(b => b.type === 'indice' || b.type === 'elemento_indice');
        generatedPages.push({
          pageNumber: pageNum++,
          isCover,
          isIndex: hasIndexContent,
          blocks: [...currentBlocks],
          footnotes: [...currentFootnotes],
          chapterTitle: currentChapterTitle,
          headerLeft: currentHeaderLeft,
          headerRight: currentHeaderRight,
        });
        currentBlocks = [];
        currentFootnotes = [];
        currentHeightEstimate = 0;
      }
    };

    // Calculate characters per line based on content width and font size (accurate proportional factor)
    const getCharsPerLine = (fontSize: number) => {
      const avgCharWidth = fontSize * 0.58;
      return Math.max(12, Math.floor(contentWidthPx / avgCharWidth));
    };

    // Estimate block pixel height realistically
    const getBlockHeight = (block: ParsedBlock): number => {
      switch (block.type) {
        case 'ancla':
          return 0;
        case 'titulo': {
          const chars = (block.content || '').length;
          const fSize = settings.fontSizeBase * settings.headingScale * 1.15;
          const charsPerLine = Math.max(6, Math.floor(contentWidthPx / (fSize * 0.68)));
          const lines = Math.max(1, Math.ceil(chars / charsPerLine));
          return Math.round(lines * fSize * 1.3 + 18);
        }
        case 'subtitulo': {
          const chars = (block.content || '').length;
          const fSize = settings.fontSizeBase * 1.08;
          const charsPerLine = Math.max(8, Math.floor(contentWidthPx / (fSize * 0.64)));
          const lines = Math.max(1, Math.ceil(chars / charsPerLine));
          return Math.round(lines * fSize * 1.3 + 14);
        }
        case 'capitulo': {
          const chars = (block.content || '').length;
          const fSize = settings.fontSizeBase * settings.headingScale * 1.3;
          const charsPerLine = Math.max(6, Math.floor(contentWidthPx / (fSize * 0.68)));
          const lines = Math.max(1, Math.ceil(chars / charsPerLine));
          return Math.round(lines * fSize * 1.35 + 28);
        }
        case 'indice': {
          const fSize = settings.fontSizeBase * settings.headingScale * 1.25;
          return Math.round(fSize * 1.25 + 16);
        }
        case 'elemento_indice': {
          const itemFontSize = Math.max(11, Math.round(settings.fontSizeBase * 0.9));
          const usableWidth = Math.max(60, contentWidthPx - 50);
          const charsPerLine = Math.max(8, Math.floor(usableWidth / (itemFontSize * 0.56)));
          const chars = (block.content || '').length;
          const lines = Math.max(1, Math.ceil(chars / charsPerLine));
          return Math.round(lines * itemFontSize * 1.3 + 2);
        }
        case 'cita': {
          const chars = (block.content || '').length;
          const fSize = settings.fontSizeBase;
          const charsPerLine = Math.max(8, Math.floor((contentWidthPx - 32) / (fSize * 0.64)));
          const lines = Math.max(1, Math.ceil(chars / charsPerLine));
          const authorH = block.author ? 24 : 0;
          return Math.round(lines * fSize * 1.55 + authorH + 28);
        }
        case 'destacado': {
          const titleChars = (block.subtitle || '').length;
          const bodyChars = (block.content || '').length;
          const fSize = settings.fontSizeBase;
          const charsPerLine = Math.max(8, Math.floor((contentWidthPx - 32) / (fSize * 0.64)));
          const titleLines = titleChars ? Math.max(1, Math.ceil(titleChars / charsPerLine)) : 0;
          const bodyLines = Math.max(1, Math.ceil(bodyChars / charsPerLine));
          return Math.round((titleLines + bodyLines) * fSize * 1.5 + (block.subtitle ? 22 : 0) + 32);
        }
        case 'imagen':
          return block.caption ? 240 : 200;
        case 'separador':
          return 30;
        case 'lista': {
          const customStyle = block.styleName ? paragraphStyleMap.get(block.styleName.toLowerCase()) : null;
          const fSize = customStyle?.fontSizeDelta ? settings.fontSizeBase + customStyle.fontSizeDelta : settings.fontSizeBase;
          const lHeight = customStyle?.lineHeight || settings.lineHeight;
          const items = block.listItems || [];
          const usableListWidth = Math.max(40, contentWidthPx - 32);
          const charsPerLine = Math.max(6, Math.floor(usableListWidth / (fSize * 0.64)));
          let totalLines = 0;
          items.forEach((it) => {
            totalLines += Math.max(1, Math.ceil((it.length + 4) / charsPerLine));
          });
          const spaceBefore = customStyle?.spaceBefore ?? 4;
          const spaceAfter = customStyle?.spaceAfter ?? settings.paragraphSpacing;
          return Math.round(totalLines * fSize * lHeight + (items.length * 6) + spaceBefore + spaceAfter + 8);
        }
        case 'parrafo': {
          const customStyle = block.styleName ? paragraphStyleMap.get(block.styleName.toLowerCase()) : null;
          const fSize = customStyle?.fontSizeDelta ? settings.fontSizeBase + customStyle.fontSizeDelta : settings.fontSizeBase;
          const lHeight = customStyle?.lineHeight || settings.lineHeight;
          const spaceBefore = customStyle?.spaceBefore || 0;
          const spaceAfter = customStyle?.spaceAfter ?? settings.paragraphSpacing;
          const chars = (block.content || '').length;
          const charsPerLine = Math.max(8, Math.floor(contentWidthPx / (fSize * 0.64)));
          const lines = Math.max(1, Math.ceil(chars / charsPerLine));
          return Math.round(lines * fSize * lHeight + spaceBefore + spaceAfter + 6);
        }
        default:
          return 28;
      }
    };

    // Sequential block-by-block pagination as content comes
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // 1. Full-Bleed Cover Image Tag [portada_imagen: archivo.jpg]
      if (block.type === 'portada_imagen') {
        pushCurrentPage();
        generatedPages.push({
          pageNumber: pageNum++,
          isCover: true,
          isIndex: false,
          blocks: [block],
          footnotes: [],
          headerLeft: '',
          headerRight: '',
        });
        continue;
      }

      // 1b. Classic Editorial Cover Tag [portada: Titulo | Subtitulo | ...]
      if (block.type === 'portada') {
        pushCurrentPage();
        generatedPages.push({
          pageNumber: pageNum++,
          isCover: true,
          isIndex: false,
          blocks: [block],
          footnotes: [],
          headerLeft: currentHeaderLeft,
          headerRight: currentHeaderRight,
        });
        continue;
      }

      // Encabezado Tag [encabezado: Izq | Der]
      if (block.type === 'encabezado') {
        if (block.headerLeft !== undefined) currentHeaderLeft = block.headerLeft;
        if (block.headerRight !== undefined) currentHeaderRight = block.headerRight;
        continue;
      }

      // Editorial Tag [editorial: Edición Oficial 2026]
      if (block.type === 'editorial') {
        if (block.editionBadge) {
          const coverPage = generatedPages.find((p) => p.isCover);
          if (coverPage && coverPage.blocks[0]) {
            coverPage.blocks[0].editionBadge = block.editionBadge;
          }
        }
        continue;
      }

      // 2. Explicit Page Break
      if (block.type === 'salto_de_pagina') {
        pushCurrentPage();
        continue;
      }

      // 3. Index Tag
      if (block.type === 'indice') {
        pushCurrentPage();
        currentBlocks.push(block);
        currentHeightEstimate += 50;
        continue;
      }

      // 4. Chapter Start
      if (block.type === 'capitulo') {
        currentChapterTitle = block.content || '';
        if (settings.chapterStartNewPage && hasVisibleContent(currentBlocks, currentFootnotes)) {
          pushCurrentPage();
        }
      }

      // 5. Footnote
      if (block.type === 'nota_al_pie') {
        currentFootnotes.push(block);
        currentHeightEstimate += 28;
        continue;
      }

      // 6. Anchor block
      if (block.type === 'ancla') {
        currentBlocks.push(block);
        continue;
      }

      // 7. Regular Content Blocks (parrafo, lista, cita, destacado, imagen, separador, titulo, subtitulo, capitulo)
      const blockCost = getBlockHeight(block);

      // Determinar la altura disponible según el tipo de página actual (índice vs regular)
      const isCurrentPageIndex = currentBlocks.some(b => b.type === 'indice' || b.type === 'elemento_indice') || block.type === 'elemento_indice' || block.type === 'indice';
      const effectiveAvailableHeight = isCurrentPageIndex ? availableIndexHeightPx : availableContentHeightPx;

      // Regla de Títulos Huérfanos ("Keep with next"):
      // Si el bloque es un título, subtítulo o capítulo, debe caber en la página actual
      // JUNTO con el siguiente bloque con contenido visible (o al menos un espacio mínimo para su texto).
      // Si no caben ambos, el título se traslada directamente a la página siguiente.
      const isHeading = block.type === 'titulo' || block.type === 'subtitulo' || block.type === 'capitulo';
      if (isHeading && currentBlocks.length > 0) {
        let nextBlockRequirement = 45; // Espacio mínimo para que el título no quede solo al pie
        for (let j = i + 1; j < blocks.length; j++) {
          const nextB = blocks[j];
          if (isBlockVisible(nextB) && nextB.type !== 'nota_al_pie' && nextB.type !== 'ancla') {
            const nextCost = getBlockHeight(nextB);
            nextBlockRequirement = Math.min(nextCost, Math.max(45, Math.round(nextCost * 0.5)));
            break;
          }
        }

        if (currentHeightEstimate + blockCost + nextBlockRequirement > effectiveAvailableHeight) {
          pushCurrentPage();
        }
      } else if (currentBlocks.length > 0 && (currentHeightEstimate + blockCost > effectiveAvailableHeight)) {
        // If page already has blocks and adding this block exceeds the available content height, start on next page
        pushCurrentPage();
      }

      currentBlocks.push(block);
      currentHeightEstimate += blockCost;
    }

    pushCurrentPage();

    // Final safety filter: ensure no empty/phantom pages exist
    const filteredPages = generatedPages.filter((p) => {
      if (p.isCover || p.isIndex) return true;
      return hasVisibleContent(p.blocks, p.footnotes);
    });

    // Re-index consecutive page numbers
    filteredPages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });

    return filteredPages.length > 0 ? filteredPages : [
      {
        pageNumber: 1,
        isCover: false,
        isIndex: false,
        blocks: [{
          id: 'empty_fallback',
          type: 'parrafo',
          content: 'Escribe tu contenido en el editor para comenzar...',
        }],
        footnotes: [],
      }
    ];
  }, [blocks, settings, pageDimensions, paragraphStyleMap]);

  // Safely notify parent of page count in effect
  useEffect(() => {
    if (onPageCountCalculated) {
      onPageCountCalculated(pages.length);
    }
  }, [pages.length, onPageCountCalculated]);

  // Format page number
  const formatPageNumber = (num: number, isCover: boolean, isIndex: boolean) => {
    if (isCover && settings.hideNumberOnCover) return null;
    if (isIndex && settings.hideNumberOnIndex) return null;
    if (num < settings.startPageNumberingOn) return null;

    const displayNum = num;
    switch (settings.pageNumberFormat) {
      case '- 1 -':
        return `— ${displayNum} —`;
      case 'Página 1':
        return `Pág. ${displayNum}`;
      case '1 / N':
        return `${displayNum} / ${pages.length}`;
      default:
        return `${displayNum}`;
    }
  };

  // Render decorative separator
  const renderSeparatorSymbol = () => {
    switch (settings.decorativeSeparator) {
      case 'diamond':
        return (
          <div className="flex items-center justify-center gap-2 mt-2 mb-1 opacity-70">
            <span className="h-px w-10" style={{ backgroundColor: settings.borderColor }} />
            <span className="text-[11px]" style={{ color: settings.accentColor }}>◆</span>
            <span className="h-px w-10" style={{ backgroundColor: settings.borderColor }} />
          </div>
        );
      case 'stars':
        return (
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-1 opacity-70" style={{ color: settings.accentColor }}>
            <span className="text-[9px]">★</span>
            <span className="text-[11px]">★</span>
            <span className="text-[9px]">★</span>
          </div>
        );
      case 'dots':
        return (
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-1 opacity-60">
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: settings.accentColor }} />
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: settings.accentColor }} />
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: settings.accentColor }} />
          </div>
        );
      default:
        return (
          <div className="mt-2 mb-1 h-px w-20 mx-auto" style={{ backgroundColor: settings.borderColor }} />
        );
    }
  };

  // Render block content with anchor tags and customized paragraph styling
  const renderBlock = (block: ParsedBlock) => {
    switch (block.type) {
      case 'ancla':
        return (
          <div
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="w-0 h-0 overflow-hidden"
          />
        );

      case 'portada_imagen': {
        const imageAsset = block.imageFileName ? imageMap.get(block.imageFileName.toLowerCase().trim()) : null;
        const coverImgUrl = imageAsset ? imageAsset.url : null;
        return (
          <div
            key={block.id}
            className="w-full h-full relative overflow-hidden bg-zinc-900 flex items-center justify-center select-none"
          >
            {coverImgUrl ? (
              <img
                src={coverImgUrl}
                alt="Portada de Imagen Completa"
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-white/90 space-y-3">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <BookOpen className="w-10 h-10 text-[#B8860B]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold tracking-wide">
                    Portada de Imagen Completa
                  </h3>
                  <p className="text-xs text-white/70 font-mono">
                    [{block.imageFileName || 'portada_completa.jpg'}]
                  </p>
                </div>
                <p className="text-[11px] text-white/60 max-w-xs leading-relaxed">
                  Sube una imagen con el nombre exacto <span className="text-amber-300 font-mono font-medium">{block.imageFileName || 'portada_completa.jpg'}</span> en el Gestor de Imágenes para visualizarla a página completa recortada al tamaño {settings.pageSize}.
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'portada': {
        const imageAsset = block.imageFileName ? imageMap.get(block.imageFileName.toLowerCase().trim()) : null;
        const coverImgUrl = imageAsset ? imageAsset.url : null;
        return (
          <div
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="h-full flex flex-col justify-between text-center p-6 sm:p-10 border-2 rounded-xl relative overflow-hidden"
            style={{ borderColor: settings.borderColor }}
          >
            {/* Top ornament / editable badge */}
            {(block.editionBadge || settings.editionBadge) && (
              <div className="flex justify-center mb-4">
                <div
                  className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border"
                  style={{
                    color: settings.accentColor,
                    borderColor: settings.borderColor,
                    backgroundColor: `${settings.backgroundColor}dd`,
                  }}
                >
                  {block.editionBadge || settings.editionBadge}
                </div>
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="my-auto space-y-4">
              <h1
                className="font-bold leading-tight tracking-tight px-2"
                style={{
                  fontFamily: settings.fontHeading,
                  fontSize: `${settings.fontSizeBase * settings.headingScale * 1.6}px`,
                  color: settings.textColor,
                }}
              >
                {block.content || settings.bookTitle || 'Título del Ebook'}
              </h1>

              {block.subtitle && (
                <p
                  className="italic opacity-90 max-w-md mx-auto"
                  style={{
                    fontFamily: settings.fontBody,
                    fontSize: `${settings.fontSizeBase * 1.1}px`,
                    color: settings.secondaryTextColor,
                  }}
                >
                  {block.subtitle}
                </p>
              )}

              {/* Cover illustration / Photo if present */}
              {coverImgUrl && (
                <div className="my-6 max-h-56 max-w-xs mx-auto rounded-lg overflow-hidden shadow-lg border border-black/10">
                  <img
                    src={coverImgUrl}
                    alt="Portada"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Author Name */}
            <div className="mt-8 pt-4 border-t" style={{ borderColor: settings.borderColor }}>
              <p
                className="font-semibold uppercase tracking-wider text-xs"
                style={{
                  fontFamily: settings.fontHeading,
                  color: settings.accentColor,
                }}
              >
                {block.author || settings.authorName || 'Autor'}
              </p>
            </div>
          </div>
        );
      }

      case 'indice':
        return (
          <div 
            key={block.id} 
            id={block.anchorId ? `anchor_${block.anchorId}` : 'anchor_indice'}
            data-anchor={block.anchorId}
            className="mb-4 pb-2 border-b shrink-0" 
            style={{ borderColor: settings.borderColor }}
          >
            <h2
              className="font-bold text-center uppercase tracking-widest"
              style={{
                fontFamily: settings.fontHeading,
                fontSize: `${settings.fontSizeBase * settings.headingScale * 1.25}px`,
                color: settings.accentColor,
              }}
            >
              {block.content || 'Índice de Contenidos'}
            </h2>
          </div>
        );

      case 'elemento_indice': {
        const hasTarget = Boolean(block.targetRefId);
        const itemFontSize = Math.max(11, Math.round(settings.fontSizeBase * 0.9));
        return (
          <div
            key={block.id}
            onClick={() => block.targetRefId && scrollToAnchor(block.targetRefId)}
            className={`flex items-baseline justify-between py-1 my-0.5 text-xs transition-opacity shrink-0 ${
              hasTarget ? 'cursor-pointer hover:opacity-80 group' : ''
            }`}
            style={{
              fontFamily: settings.fontBody,
              fontSize: `${itemFontSize}px`,
              lineHeight: 1.35,
            }}
            title={hasTarget ? `Ir a: ${block.targetRefId}` : undefined}
          >
            <span
              className="font-medium pr-2 group-hover:text-[#B8860B] transition-colors leading-tight"
              style={{ color: settings.textColor }}
            >
              {block.content}
            </span>
            <span
              className="flex-1 mx-2 border-b border-dotted min-w-[20px] shrink self-center"
              style={{ borderColor: settings.secondaryTextColor }}
            />
            {block.pageNumber && (
              <span className="font-mono pl-2 shrink-0 font-semibold opacity-85" style={{ color: settings.accentColor }}>
                {block.pageNumber}
              </span>
            )}
          </div>
        );
      }

      case 'capitulo':
        return (
          <div 
            key={block.id} 
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="mt-2 mb-3 text-center space-y-1 px-2 pt-1 pb-0"
          >
            {block.pageNumber && (
              <span
                className="text-[11px] uppercase tracking-widest font-bold block mb-1"
                style={{ color: settings.accentColor }}
              >
                Capítulo {block.pageNumber}
              </span>
            )}
            <h2
              className="font-bold leading-tight"
              style={{
                fontFamily: settings.fontHeading,
                fontSize: `${settings.fontSizeBase * settings.headingScale * 1.3}px`,
                color: settings.textColor,
              }}
            >
              {block.content}
            </h2>
            {renderSeparatorSymbol()}
          </div>
        );

      case 'titulo':
        return (
          <h2
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="font-bold mt-3 mb-1.5 leading-snug px-1"
            style={{
              fontFamily: settings.fontHeading,
              fontSize: `${settings.fontSizeBase * settings.headingScale * 1.15}px`,
              color: settings.textColor,
            }}
          >
            {block.content}
          </h2>
        );

      case 'subtitulo':
        return (
          <h3
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="font-semibold mt-2 mb-1.5 opacity-90 px-1"
            style={{
              fontFamily: settings.fontHeading,
              fontSize: `${settings.fontSizeBase * 1.08}px`,
              color: settings.secondaryTextColor,
            }}
          >
            {block.content}
          </h3>
        );

      case 'parrafo': {
        // Resolve custom paragraph preset if tagged
        const customStylePreset = block.styleName ? paragraphStyleMap.get(block.styleName.toLowerCase()) : null;

        if (customStylePreset) {
          const fontSize = customStylePreset.fontSizeDelta 
            ? `${settings.fontSizeBase + customStylePreset.fontSizeDelta}px` 
            : `${settings.fontSizeBase}px`;

          return (
            <p
              key={block.id}
              id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
              data-anchor={block.anchorId}
              className="leading-relaxed transition-all"
              style={{
                fontFamily: settings.fontBody,
                fontSize: fontSize,
                lineHeight: customStylePreset.lineHeight || settings.lineHeight,
                textAlign: customStylePreset.textAlign || settings.textAlign,
                textIndent: `${customStylePreset.firstLineIndent ?? 0}px`,
                marginTop: `${customStylePreset.spaceBefore ?? 0}px`,
                marginBottom: `${customStylePreset.spaceAfter ?? settings.paragraphSpacing}px`,
                fontStyle: customStylePreset.fontStyle || 'normal',
                fontWeight: customStylePreset.fontWeight || 'normal',
                color: customStylePreset.textColor || settings.textColor,
                backgroundColor: customStylePreset.backgroundColor || undefined,
                borderLeft: customStylePreset.borderLeftWidth
                  ? `${customStylePreset.borderLeftWidth}px solid ${customStylePreset.borderLeftColor || settings.accentColor}`
                  : undefined,
                paddingLeft: customStylePreset.paddingLeft ? `${customStylePreset.paddingLeft}px` : undefined,
              }}
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content, settings.accentColor) }}
            />
          );
        }

        // Standard paragraph
        return (
          <p
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="leading-relaxed text-justify transition-all"
            style={{
              fontFamily: settings.fontBody,
              fontSize: `${settings.fontSizeBase}px`,
              lineHeight: settings.lineHeight,
              textAlign: settings.textAlign,
              textIndent: settings.paragraphIndent ? '1.5em' : '0',
              marginBottom: `${settings.paragraphSpacing}px`,
              color: settings.textColor,
            }}
            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content, settings.accentColor) }}
          />
        );
      }

      case 'imagen': {
        const imageAsset = block.imageFileName ? imageMap.get(block.imageFileName.toLowerCase().trim()) : null;
        const imgUrl = imageAsset ? imageAsset.url : null;
        const finalCaption = block.caption || (imageAsset?.caption ?? '');

        return (
          <figure 
            key={block.id} 
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="my-4 text-center transition-all p-1.5"
          >
            {imgUrl ? (
              <div className="rounded-lg overflow-hidden border shadow-sm mx-auto max-w-full" style={{ borderColor: settings.borderColor }}>
                <img
                  src={imgUrl}
                  alt={finalCaption || 'Ilustración del Ebook'}
                  className="w-full h-auto object-cover max-h-72"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div
                className="p-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center"
                style={{ borderColor: settings.borderColor, backgroundColor: `${settings.backgroundColor}88` }}
              >
                <span className="text-xs font-mono font-medium" style={{ color: settings.accentColor }}>
                  [Imagen: {block.imageFileName || 'archivo.jpg'}]
                </span>
                <span className="text-[10px] text-slate-500">
                  (Sube esta imagen en el Gestor de Imágenes con el nombre exacto)
                </span>
              </div>
            )}
            {finalCaption && (
              <figcaption
                className="text-[11px] italic mt-2 opacity-85 leading-tight text-center"
                style={{ fontFamily: settings.fontBody, color: settings.secondaryTextColor }}
              >
                {finalCaption}
              </figcaption>
            )}
          </figure>
        );
      }

      case 'cita': {
        const cleanContent = (block.content || '').replace(/^["“«\s]+|["”»\s]+$/g, '').trim();
        return (
          <blockquote
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="my-5 pl-4 border-l-2 italic space-y-1"
            style={{
              borderColor: settings.accentColor,
              fontFamily: settings.fontBody,
              color: settings.textColor,
            }}
          >
            <p className="text-sm leading-relaxed">
              “{cleanContent}”
            </p>
            {block.author && (
              <footer
                className="text-xs font-semibold not-italic tracking-wider uppercase opacity-80"
                style={{ color: settings.accentColor }}
              >
                — {block.author}
              </footer>
            )}
          </blockquote>
        );
      }

      case 'destacado':
        return (
          <aside
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="my-4 p-3.5 rounded-xl border space-y-1"
            style={{
              borderColor: `${settings.accentColor}55`,
              backgroundColor: `${settings.accentColor}10`,
            }}
          >
            {block.subtitle && (
              <h4
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                style={{ color: settings.accentColor }}
              >
                <Sparkles className="w-3 h-3" />
                <span>{block.subtitle}</span>
              </h4>
            )}
            <p
              className="text-xs leading-relaxed"
              style={{
                fontFamily: settings.fontBody,
                color: settings.textColor,
              }}
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content, settings.accentColor) }}
            />
          </aside>
        );

      case 'lista': {
        const customStylePreset = block.styleName ? paragraphStyleMap.get(block.styleName.toLowerCase()) : null;
        const fontSize = customStylePreset?.fontSizeDelta 
          ? `${settings.fontSizeBase + customStylePreset.fontSizeDelta}px` 
          : `${settings.fontSizeBase}px`;
        const lineHeight = customStylePreset?.lineHeight || settings.lineHeight;
        const textAlign = customStylePreset?.textAlign || (settings.textAlign === 'justify' ? 'justify' : settings.textAlign);
        const textColor = customStylePreset?.textColor || settings.textColor;
        const spaceBefore = customStylePreset?.spaceBefore ?? 2;
        const spaceAfter = customStylePreset?.spaceAfter ?? settings.paragraphSpacing;

        return (
          <ul
            key={block.id}
            id={block.anchorId ? `anchor_${block.anchorId}` : undefined}
            data-anchor={block.anchorId}
            className="space-y-1.5 pl-2 transition-all"
            style={{
              fontFamily: settings.fontBody,
              fontSize: fontSize,
              lineHeight: lineHeight,
              color: textColor,
              marginTop: `${spaceBefore}px`,
              marginBottom: `${spaceAfter}px`,
            }}
          >
            {(block.listItems || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 opacity-80"
                  style={{ backgroundColor: settings.accentColor }}
                />
                <span
                  className="flex-1"
                  style={{ textAlign: textAlign }}
                  dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item, settings.accentColor) }}
                />
              </li>
            ))}
          </ul>
        );
      }

      case 'separador':
        return <React.Fragment key={block.id}>{renderSeparatorSymbol()}</React.Fragment>;

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#E5E2DE]/50 overflow-hidden relative select-none">
      {/* Top Preview Control Bar */}
      <div className="h-11 px-4 border-b border-[#D1CEC8] bg-white flex items-center justify-between text-xs text-[#2C2C2C] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
            Vista Previa del Libro ({pages.length} {pages.length === 1 ? 'página' : 'páginas'})
          </span>
          <span className="text-[#D1CEC8] hidden sm:inline">|</span>
          <span className="text-[11px] text-[#B8860B] font-serif italic hidden sm:inline">
            Formato {settings.pageSize} • {settings.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
          </span>
        </div>

        {/* Zoom and page navigation controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Margin Guides */}
          <button
            onClick={() => setShowMarginGuides((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border transition-colors ${
              showMarginGuides 
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs' 
                : 'text-[#666] hover:text-[#1A1A1A] hover:bg-white bg-[#FAF9F7] border-[#D1CEC8]'
            }`}
            title="Mostrar/Ocultar Guías de Margen de Impresión Interactivas"
          >
            <Scan className="w-3.5 h-3.5 text-[#B8860B]" />
            <span className="hidden md:inline">Guías de Margen</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#FAF9F7] rounded p-0.5 border border-[#D1CEC8]">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.4, prev - 0.1))}
              className="p-1 text-[#666] hover:text-[#1A1A1A] hover:bg-white rounded transition-colors"
              title="Reducir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-2 text-[#1A1A1A] font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.1))}
              className="p-1 text-[#666] hover:text-[#1A1A1A] hover:bg-white rounded transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Zoom */}
          <button
            onClick={() => setZoomLevel(0.85)}
            className="p-1.5 text-[#666] hover:text-[#1A1A1A] hover:bg-white bg-[#FAF9F7] rounded border border-[#D1CEC8] transition-colors"
            title="Ajustar Tamaño"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Container with Zoom Scaling */}
      <div 
        id="ebook-preview-container"
        className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-8 bg-[#E5E2DE]/30 scroll-smooth"
      >
        <div
          className="transition-transform origin-top flex flex-col items-center gap-8"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >
          {pages.map((page) => {
            const isFullImageCover = page.isCover && page.blocks[0]?.type === 'portada_imagen';
            const pageNumText = formatPageNumber(page.pageNumber, page.isCover, page.isIndex);
            const hasHeaderContent = Boolean(
              page.headerLeft?.trim() || 
              page.headerRight?.trim() || 
              settings.headerText?.trim() || 
              settings.headerRightText?.trim()
            );

            if (isFullImageCover) {
              return (
                <div
                  key={page.pageNumber}
                  className="ebook-page-sheet relative shadow-xl rounded-none transition-all overflow-hidden flex flex-col justify-between shrink-0"
                  style={{
                    width: `${pageDimensions.widthPx}px`,
                    height: `${pageDimensions.heightPx}px`,
                    minHeight: `${pageDimensions.heightPx}px`,
                    maxHeight: `${pageDimensions.heightPx}px`,
                    backgroundColor: '#18181B',
                    padding: 0,
                    boxSizing: 'border-box',
                    border: `1px solid ${settings.borderColor || 'rgba(0,0,0,0.08)'}`,
                  }}
                >
                  {renderBlock(page.blocks[0])}
                </div>
              );
            }

            return (
              <div
                key={page.pageNumber}
                className="ebook-page-sheet relative shadow-xl rounded-none transition-all overflow-hidden flex flex-col justify-between shrink-0"
                style={{
                  width: `${pageDimensions.widthPx}px`,
                  height: `${pageDimensions.heightPx}px`,
                  minHeight: `${pageDimensions.heightPx}px`,
                  maxHeight: `${pageDimensions.heightPx}px`,
                  backgroundColor: settings.backgroundColor,
                  color: settings.textColor,
                  paddingTop: `${settings.marginTop}mm`,
                  paddingBottom: `${settings.marginBottom}mm`,
                  paddingLeft: `${settings.marginLeft}mm`,
                  paddingRight: `${settings.marginRight}mm`,
                  boxSizing: 'border-box',
                  border: `1px solid ${settings.borderColor || 'rgba(0,0,0,0.08)'}`,
                }}
              >
                {/* Visual Margin Guides Overlay */}
                {showMarginGuides && !page.isCover && (
                  <div 
                    className="absolute inset-0 pointer-events-none border border-dashed border-[#B8860B]/40 z-20"
                    style={{
                      top: `${settings.marginTop}mm`,
                      bottom: `${settings.marginBottom}mm`,
                      left: `${settings.marginLeft}mm`,
                      right: `${settings.marginRight}mm`,
                    }}
                  >
                    <span className="absolute -top-4 right-1 text-[8px] font-mono text-[#B8860B] bg-white/90 px-1 rounded shadow-2xs border border-[#B8860B]/30">
                      Margen: {settings.marginTop}mm Sup / {settings.marginBottom}mm Inf
                    </span>
                  </div>
                )}
                {/* Running Header - strictly conditional on having actual text configured */}
                {settings.showHeader && !page.isCover && !page.isIndex && hasHeaderContent && (
                  <div
                    className="w-full pb-2 mb-3 border-b flex items-center justify-between text-[10px] tracking-wider uppercase opacity-70 shrink-0"
                    style={{ borderColor: settings.borderColor, color: settings.secondaryTextColor }}
                  >
                    <span className="truncate max-w-[220px]">
                      {page.headerLeft || settings.headerText || ''}
                    </span>
                    <span className="truncate max-w-[220px]">
                      {page.headerRight || settings.headerRightText || page.chapterTitle || ''}
                    </span>
                  </div>
                )}

                {/* Main Page Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {page.blocks.map((b) => renderBlock(b))}
                </div>

                {/* Footnotes at bottom of page */}
                {page.footnotes.length > 0 && (
                  <div className="mt-2 mb-1 pt-1.5 border-t text-[10px] space-y-1 shrink-0" style={{ borderColor: settings.borderColor }}>
                    {page.footnotes.map((fn) => (
                      <div 
                        key={fn.id} 
                        id={fn.anchorId ? `anchor_${fn.anchorId}` : undefined}
                        data-anchor={fn.anchorId}
                        className="flex items-start gap-1.5 opacity-85 p-0.5 rounded" 
                        style={{ color: settings.secondaryTextColor }}
                      >
                        <span className="font-bold font-mono" style={{ color: settings.accentColor }}>
                          [{fn.footnoteNumber || 1}]
                        </span>
                        <span className="flex-1 leading-tight">{fn.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Running Footer & Page Number - Tratado como bloque de texto en el flujo */}
                {settings.showPageNumbers && pageNumText && (
                  <div
                    className={`h-[26px] pt-1.5 mt-auto text-[10px] font-mono tracking-widest uppercase opacity-70 shrink-0 flex items-center select-none z-10 ${
                      settings.pageNumberPosition === 'bottom-center'
                        ? 'justify-center'
                        : settings.pageNumberPosition === 'bottom-right'
                        ? 'justify-end'
                        : page.pageNumber % 2 === 0
                        ? 'justify-start'
                        : 'justify-end'
                    }`}
                    style={{ color: settings.secondaryTextColor }}
                  >
                    <span>{pageNumText}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
