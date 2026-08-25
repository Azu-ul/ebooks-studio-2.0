import { toJpeg, toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BookSettings, PageSize } from '../types';

export interface ExportProgress {
  currentPage: number;
  totalPages: number;
  status: 'idle' | 'rendering' | 'compiling' | 'success' | 'error';
  message: string;
}

// Returns page dimensions in mm
export function getPageDimensions(size: PageSize, orientation: 'portrait' | 'landscape') {
  let width = 148; // A5 default
  let height = 210;

  switch (size) {
    case 'A4':
      width = 210;
      height = 297;
      break;
    case 'A5':
      width = 148;
      height = 210;
      break;
    case 'Letter':
      width = 215.9;
      height = 279.4;
      break;
    case 'B5':
      width = 176;
      height = 250;
      break;
  }

  if (orientation === 'landscape') {
    return { width: height, height: width };
  }
  return { width, height };
}

// In-memory cache for base64 font blobs & processed CSS
const fontBase64Cache = new Map<string, string>();
const fontCssCache = new Map<string, string>();

async function fetchBlobAsBase64(url: string): Promise<string> {
  if (fontBase64Cache.has(url)) {
    return fontBase64Cache.get(url)!;
  }
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      fontBase64Cache.set(url, dataUrl);
      resolve(dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function inlineUrlsInCss(rawCss: string, cacheKey: string): Promise<string> {
  const urlRegex = /url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^"')]+)\1\)/g;
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(rawCss)) !== null) {
    urls.push(m[2]);
  }

  const uniqueUrls = Array.from(new Set(urls));
  
  // Download all font files and convert them to Base64 in parallel
  await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        await fetchBlobAsBase64(url);
      } catch (e) {
        console.warn('Could not inline font binary:', url, e);
      }
    })
  );

  // Replace remote URLs with base64 data URIs
  const inlinedCss = rawCss.replace(/url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^"')]+)\1\)/g, (match, quote, url) => {
    const base64Data = fontBase64Cache.get(url);
    if (base64Data) {
      return `url("${base64Data}")`;
    }
    return match;
  });

  fontCssCache.set(cacheKey, inlinedCss);
  return inlinedCss;
}

export async function getInlinedFontsCSS(fontHeading: string, fontBody: string): Promise<string> {
  const fontKey = `${fontHeading}___${fontBody}`;
  if (fontCssCache.has(fontKey)) {
    return fontCssCache.get(fontKey)!;
  }

  try {
    const cleanHeading = fontHeading.replace(/['",]/g, '').trim();
    const cleanBody = fontBody.replace(/['",]/g, '').trim();
    const uniqueFonts = Array.from(new Set([cleanHeading, cleanBody, 'Cinzel', 'Libre Baskerville', 'Inter', 'Playfair Display']));

    const familiesQuery = uniqueFonts
      .map(font => `family=${encodeURIComponent(font)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700`)
      .join('&');

    const googleFontUrl = `https://fonts.googleapis.com/css2?${familiesQuery}&display=swap`;

    const cssResponse = await fetch(googleFontUrl);
    if (cssResponse.ok) {
      const rawCss = await cssResponse.text();
      return await inlineUrlsInCss(rawCss, fontKey);
    }
  } catch (err) {
    console.warn('Direct Google Fonts fetch failed, trying existing link tag:', err);
  }

  // Fallback: search existing link in document
  try {
    const fontLink = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com/css2"]');
    if (fontLink && fontLink.href) {
      const resp = await fetch(fontLink.href);
      if (resp.ok) {
        const rawCss = await resp.text();
        return await inlineUrlsInCss(rawCss, fontKey);
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return '';
}

export async function exportBookToPdf(
  containerSelector: string,
  settings: BookSettings,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error('Contenedor de páginas no encontrado');
  }

  const pageElements = container.querySelectorAll<HTMLElement>('.ebook-page-sheet');
  if (pageElements.length === 0) {
    throw new Error('No se encontraron páginas para exportar');
  }

  const totalPages = pageElements.length;

  onProgress?.({
    currentPage: 0,
    totalPages,
    status: 'rendering',
    message: `Incrustando tipografías (${settings.fontHeading} / ${settings.fontBody})...`,
  });

  // Ensure all web fonts are loaded in document.fonts
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load(`16px "${settings.fontHeading}"`),
        document.fonts.load(`bold 16px "${settings.fontHeading}"`),
        document.fonts.load(`14px "${settings.fontBody}"`),
        document.fonts.load(`italic 14px "${settings.fontBody}"`),
        document.fonts.load(`bold 14px "${settings.fontBody}"`),
        document.fonts.ready,
      ]);
    } catch {
      // Continue if browser font API is partially supported
    }
  }

  // Pre-fetch and convert web fonts to embedded base64 data URIs so Canvas / SVG never falls back
  const inlinedFontCSS = await getInlinedFontsCSS(settings.fontHeading, settings.fontBody);

  const { width: pageMmWidth, height: pageMmHeight } = getPageDimensions(settings.pageSize, settings.orientation);

  const doc = new jsPDF({
    orientation: settings.orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: [pageMmWidth, pageMmHeight],
    compress: true,
  });

  for (let i = 0; i < totalPages; i++) {
    const pageEl = pageElements[i];

    onProgress?.({
      currentPage: i + 1,
      totalPages,
      status: 'rendering',
      message: `Exportando página ${i + 1} de ${totalPages} con tipografía fiel...`,
    });

    if (i > 0) {
      doc.addPage([pageMmWidth, pageMmHeight], settings.orientation === 'landscape' ? 'l' : 'p');
    }

    const bgColor = settings.backgroundColor || '#ffffff';
    // Fill entire jsPDF page with matching background color
    doc.setFillColor(bgColor);
    doc.rect(0, 0, pageMmWidth, pageMmHeight, 'F');

    // Render page with high resolution scale and embedded base64 fonts
    let imgData: string | null = null;
    const renderOptions = {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: bgColor,
      cacheBust: true,
      fontEmbedCSS: inlinedFontCSS || undefined,
      skipFonts: false,
      style: {
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
        margin: '0',
      },
    };

    try {
      imgData = await toJpeg(pageEl, renderOptions);
    } catch (renderErr) {
      console.warn('html-to-image toJpeg failed for page', i + 1, renderErr);
      try {
        imgData = await toPng(pageEl, {
          ...renderOptions,
          pixelRatio: 2.2,
        });
      } catch (pngErr) {
        console.warn('Fallback to html2canvas for page', i + 1, pngErr);
        const canvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: bgColor,
          logging: false,
        });
        imgData = canvas.toDataURL('image/jpeg', 0.98);
      }
    }

    if (imgData) {
      doc.addImage(imgData, 'JPEG', 0, 0, pageMmWidth, pageMmHeight, undefined, 'FAST');
    }
  }

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    status: 'compiling',
    message: 'Compilando documento final y optimizando PDF...',
  });

  // Keep the exact title written by the user, removing only characters forbidden in file systems (e.g. / \ : * ? " < > |)
  let cleanTitle = (settings.bookTitle || '').trim();
  cleanTitle = cleanTitle.replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, '').trim();
  if (!cleanTitle) {
    cleanTitle = 'Mi Ebook';
  }

  doc.save(`${cleanTitle}.pdf`);

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    status: 'success',
    message: '¡Ebook exportado exitosamente con tipografías fieles!',
  });
}

// Direct vector print via browser engine
export function triggerBrowserPrint(title?: string) {
  const originalTitle = document.title;
  let cleanTitle = (title || '').trim().replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, '').trim();
  if (cleanTitle) {
    document.title = cleanTitle;
  }
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

