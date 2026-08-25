import { ParsedBlock, TagType } from '../types';

let idCounter = 0;
const nextId = () => `block_${++idCounter}_${Date.now()}`;

// Utility to sanitize anchor string
export function sanitizeAnchorId(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * Safely extracts the payload between tag delimiters even if there are nested brackets like [1], [ref: x], etc.
 * Supports:
 * - [tag: content]
 * - [tag content]
 * - [tag]content[/tag]
 * - [tag]
 */
function extractTagPayload(line: string, tagName: string): { matches: boolean; payload: string } {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  const colonPrefix = `[${tagName}:`;
  const spacePrefix = `[${tagName} `;
  const exactPrefix = `[${tagName}]`;
  const closingTag = `[/${tagName}]`;

  // Check [tagName] ... [/tagName]
  if (lower.startsWith(exactPrefix) && lower.endsWith(closingTag.toLowerCase())) {
    return {
      matches: true,
      payload: trimmed.slice(exactPrefix.length, -closingTag.length).trim(),
    };
  }

  // Check [tagName: payload]
  if (lower.startsWith(colonPrefix)) {
    let payload = trimmed.slice(colonPrefix.length).trim();
    if (payload.endsWith(']')) {
      payload = payload.slice(0, -1).trim();
    }
    return { matches: true, payload };
  }

  // Check [tagName payload]
  if (lower.startsWith(spacePrefix)) {
    let payload = trimmed.slice(spacePrefix.length).trim();
    if (payload.endsWith(']')) {
      payload = payload.slice(0, -1).trim();
    }
    return { matches: true, payload };
  }

  // Check exact [tagName]
  if (lower === exactPrefix.toLowerCase()) {
    return { matches: true, payload: '' };
  }

  return { matches: false, payload: '' };
}

function parseParagraphPayload(payload: string): { content: string; styleName?: string } {
  if (!payload) return { content: '' };

  // Check for estilo=... | Content
  if (/^(?:estilo|style)=/i.test(payload)) {
    const pipeIndex = payload.indexOf('|');
    if (pipeIndex !== -1) {
      const stylePart = payload.slice(0, pipeIndex).trim();
      const contentPart = payload.slice(pipeIndex + 1).trim();
      const styleName = sanitizeAnchorId(stylePart.replace(/^(?:estilo|style)=/i, ''));
      return { content: contentPart, styleName };
    }
  }

  // Check for Content | estilo=...
  if (/\|\s*(?:estilo|style)=/i.test(payload)) {
    const match = payload.match(/\|\s*(?:estilo|style)=([^|]+)$/i);
    if (match) {
      const styleName = sanitizeAnchorId(match[1].trim());
      const content = payload.replace(/\|\s*(?:estilo|style)=[^|]+$/i, '').trim();
      return { content, styleName };
    }
  }

  return { content: payload };
}

export function parseBookText(rawText: string): ParsedBlock[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const blocks: ParsedBlock[] = [];
  const lines = rawText.split('\n');
  let currentFootnoteIndex = 1;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. ENCABEZADO / CABECERA: [encabezado: Izquierda | Derecha] or [cabecera: ...]
    const encTag = extractTagPayload(line, 'encabezado');
    const cabTag = !encTag.matches ? extractTagPayload(line, 'cabecera') : encTag;
    if (cabTag.matches) {
      const parts = cabTag.payload.split('|').map(s => s.trim());
      blocks.push({
        id: nextId(),
        type: 'encabezado',
        content: cabTag.payload,
        headerLeft: parts[0] || '',
        headerRight: parts[1] || '',
        rawText: line,
      });
      i++;
      continue;
    }

    // 2. EDITORIAL / EDICION: [editorial: Texto...] or [edicion: Texto...]
    const editTag = extractTagPayload(line, 'editorial');
    const edicTag = !editTag.matches ? extractTagPayload(line, 'edicion') : editTag;
    if (edicTag.matches) {
      blocks.push({
        id: nextId(),
        type: 'editorial',
        content: edicTag.payload,
        editionBadge: edicTag.payload,
        rawText: line,
      });
      i++;
      continue;
    }

    // 3. ANCLA: [ancla: id | Titulo Opcional]
    const anclaTag = extractTagPayload(line, 'ancla');
    if (anclaTag.matches) {
      const parts = anclaTag.payload.split('|').map(s => s.trim());
      const anchorId = sanitizeAnchorId(parts[0]);
      blocks.push({
        id: nextId(),
        type: 'ancla',
        content: parts[1] || parts[0],
        anchorId: anchorId,
        rawText: line,
      });
      i++;
      continue;
    }

    // 4. PORTADA DE IMAGEN COMPLETA: [portada_imagen: nombre_archivo.jpg] or [imagen_portada: ...]
    const portadaImgTag = extractTagPayload(line, 'portada_imagen');
    const imgPortadaTag = !portadaImgTag.matches ? extractTagPayload(line, 'imagen_portada') : portadaImgTag;
    const portadaFotoTag = !imgPortadaTag.matches ? extractTagPayload(line, 'portada_foto') : imgPortadaTag;
    const fullCoverTag = !portadaFotoTag.matches ? extractTagPayload(line, 'portada_completa') : portadaFotoTag;
    if (fullCoverTag.matches) {
      let rawFileName = fullCoverTag.payload.trim();
      // If legacy content has a pipe, extract the filename part
      if (rawFileName.includes('|')) {
        const parts = rawFileName.split('|').map(s => s.trim());
        const filePart = parts.find(p => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(p)) || parts[parts.length - 1] || parts[0];
        rawFileName = filePart;
      }
      blocks.push({
        id: nextId(),
        type: 'portada_imagen',
        imageFileName: rawFileName,
        content: rawFileName,
        anchorId: 'portada_imagen',
        rawText: line,
      });
      i++;
      continue;
    }

    // 4b. PORTADA EDITORIAL: [portada: Titulo | Subtitulo | Autor | Imagen | EdicionBadge]
    const portadaTag = extractTagPayload(line, 'portada');
    if (portadaTag.matches) {
      if (portadaTag.payload) {
        const parts = portadaTag.payload.split('|').map(s => s.trim());
        blocks.push({
          id: nextId(),
          type: 'portada',
          content: parts[0] || 'Título de tu Ebook',
          subtitle: parts[1] || '',
          author: parts[2] || '',
          imageFileName: parts[3] || '',
          editionBadge: parts[4] || '',
          anchorId: 'portada',
          rawText: line,
        });
      } else {
        blocks.push({
          id: nextId(),
          type: 'portada',
          content: 'Título de tu Ebook',
          anchorId: 'portada',
          rawText: line,
        });
      }
      i++;
      continue;
    }

    // 5. INDICE: [indice] or [indice: Titulo]
    const indiceTag = extractTagPayload(line, 'indice');
    if (indiceTag.matches) {
      blocks.push({
        id: nextId(),
        type: 'indice',
        content: indiceTag.payload || 'Índice de Contenidos',
        anchorId: 'indice_general',
        rawText: line,
      });
      i++;
      continue;
    }

    // 6. ELEMENTO_INDICE: [elemento_indice: Titulo | Pagina | id_ancla]
    const elemIndiceTag = extractTagPayload(line, 'elemento_indice');
    if (elemIndiceTag.matches) {
      const parts = elemIndiceTag.payload.split('|').map(s => s.trim());
      blocks.push({
        id: nextId(),
        type: 'elemento_indice',
        content: parts[0] || '',
        pageNumber: parts[1] || '',
        targetRefId: parts[2] ? sanitizeAnchorId(parts[2]) : undefined,
        rawText: line,
      });
      i++;
      continue;
    }

    // 7. CAPITULO: [capitulo: 1 | Titulo | id_ancla] or [capitulo: Titulo]
    const capTag = extractTagPayload(line, 'capitulo');
    if (capTag.matches) {
      const parts = capTag.payload.split('|').map(s => s.trim());
      if (parts.length > 2) {
        blocks.push({
          id: nextId(),
          type: 'capitulo',
          pageNumber: parts[0],
          content: parts[1],
          anchorId: sanitizeAnchorId(parts[2] || `capitulo_${parts[0]}`),
          rawText: line,
        });
      } else if (parts.length === 2) {
        blocks.push({
          id: nextId(),
          type: 'capitulo',
          pageNumber: parts[0],
          content: parts[1],
          anchorId: sanitizeAnchorId(`capitulo_${parts[0]}`),
          rawText: line,
        });
      } else {
        blocks.push({
          id: nextId(),
          type: 'capitulo',
          content: parts[0],
          anchorId: sanitizeAnchorId(`capitulo_${parts[0]}`),
          rawText: line,
        });
      }
      i++;
      continue;
    }

    // 8. TITULO: [titulo: ...] or [titulo: ... | id_ancla]
    const titTag = extractTagPayload(line, 'titulo');
    if (titTag.matches) {
      const parts = titTag.payload.split('|').map(s => s.trim());
      blocks.push({
        id: nextId(),
        type: 'titulo',
        content: parts[0],
        anchorId: parts[1] ? sanitizeAnchorId(parts[1]) : sanitizeAnchorId(parts[0]),
        rawText: line,
      });
      i++;
      continue;
    }

    // 9. SUBTITULO: [subtitulo: ...] or [subtitulo: ... | id_ancla]
    const subtitTag = extractTagPayload(line, 'subtitulo');
    if (subtitTag.matches) {
      const parts = subtitTag.payload.split('|').map(s => s.trim());
      blocks.push({
        id: nextId(),
        type: 'subtitulo',
        content: parts[0],
        anchorId: parts[1] ? sanitizeAnchorId(parts[1]) : undefined,
        rawText: line,
      });
      i++;
      continue;
    }

    // 10. IMAGEN: [imagen: archivo.jpg | Pie de foto | Ancho | id_ancla]
    const imgTag = extractTagPayload(line, 'imagen');
    if (imgTag.matches) {
      const parts = imgTag.payload.split('|').map(s => s.trim());
      const fileName = parts[0];
      const caption = parts[1] || '';
      const width = parts[2] || '';
      const customAnchor = parts[3] ? sanitizeAnchorId(parts[3]) : sanitizeAnchorId(fileName.replace(/\.[^/.]+$/, ''));
      blocks.push({
        id: nextId(),
        type: 'imagen',
        imageFileName: fileName,
        caption: caption,
        subtitle: width,
        content: fileName,
        anchorId: customAnchor,
        rawText: line,
      });
      i++;
      continue;
    }

    // 11. NOTA_AL_PIE: [nota_al_pie: ...] or [nota_al_pie: 1 | Texto]
    const notaTag = extractTagPayload(line, 'nota_al_pie');
    if (notaTag.matches) {
      const parts = notaTag.payload.split('|').map(s => s.trim());
      let num = currentFootnoteIndex;
      let text = parts[0];
      if (parts.length > 1 && !isNaN(Number(parts[0]))) {
        num = Number(parts[0]);
        text = parts[1];
      } else {
        currentFootnoteIndex++;
      }
      blocks.push({
        id: nextId(),
        type: 'nota_al_pie',
        footnoteNumber: num,
        content: text,
        anchorId: `nota_pie_${num}`,
        rawText: line,
      });
      i++;
      continue;
    }

    // 12. CITA: [cita: Texto de la cita | Autor | id_ancla]
    const citaTag = extractTagPayload(line, 'cita');
    if (citaTag.matches) {
      const parts = citaTag.payload.split('|').map(s => s.trim());
      // Strip any wrapping quotes from content to avoid duplicate quotes in preview and PDF
      const cleanQuoteText = (parts[0] || '').replace(/^["“«\s]+|["”»\s]+$/g, '').trim();
      blocks.push({
        id: nextId(),
        type: 'cita',
        content: cleanQuoteText,
        author: parts[1] || '',
        anchorId: parts[2] ? sanitizeAnchorId(parts[2]) : undefined,
        rawText: line,
      });
      i++;
      continue;
    }

    // 13. DESTACADO: [destacado: Titulo | Mensaje | id_ancla] or [destacado: Mensaje]
    const destTag = extractTagPayload(line, 'destacado');
    if (destTag.matches) {
      const parts = destTag.payload.split('|').map(s => s.trim());
      if (parts.length > 1) {
        blocks.push({
          id: nextId(),
          type: 'destacado',
          subtitle: parts[0],
          content: parts[1],
          anchorId: parts[2] ? sanitizeAnchorId(parts[2]) : undefined,
          rawText: line,
        });
      } else {
        blocks.push({
          id: nextId(),
          type: 'destacado',
          content: parts[0],
          rawText: line,
        });
      }
      i++;
      continue;
    }

    // 14. SEPARADOR: [separador]
    const sepTag = extractTagPayload(line, 'separador');
    if (sepTag.matches) {
      blocks.push({
        id: nextId(),
        type: 'separador',
        content: '',
        rawText: line,
      });
      i++;
      continue;
    }

    // 15. SALTO DE PAGINA: [salto_de_pagina], [salto_de_página], [salto de pagina], [pagina_nueva], [pagebreak], etc.
    const isSaltoDePagina = /^\[\s*(?:salto_de_p[aá]gina|salto\s+de\s+p[aá]gina|p[aá]gina_nueva|p[aá]gina\s+nueva|nueva_p[aá]gina|pagebreak|salto)\s*(?::.*)?\]$/i.test(line);
    if (isSaltoDePagina) {
      // Avoid pushing redundant consecutive page breaks or starting with a page break
      const lastBlock = blocks[blocks.length - 1];
      if (!lastBlock || lastBlock.type !== 'salto_de_pagina') {
        blocks.push({
          id: nextId(),
          type: 'salto_de_pagina',
          content: '',
          rawText: line,
        });
      }
      i++;
      continue;
    }

    // 16. LISTA: [lista: Item 1 | Item 2 | Item 3] or [lista: Item 1, Item 2, Item 3]
    const listTag = extractTagPayload(line, 'lista');
    if (listTag.matches) {
      // Support pipe '|' delimiter (preferred when items contain commas), fallback to comma ','
      const delimiter = listTag.payload.includes('|') ? '|' : ',';
      const items = listTag.payload
        .split(delimiter)
        .map(s => s.trim())
        .filter(Boolean);
      blocks.push({
        id: nextId(),
        type: 'lista',
        content: '',
        listItems: items,
        rawText: line,
      });
      i++;
      continue;
    }

    // 17. ESTILO: [estilo: nombre_estilo | Texto] or [estilo: nombre_estilo] Texto [/estilo]
    const estiloTag = extractTagPayload(line, 'estilo');
    if (estiloTag.matches) {
      const pipeIndex = estiloTag.payload.indexOf('|');
      if (pipeIndex !== -1) {
        const styleName = sanitizeAnchorId(estiloTag.payload.slice(0, pipeIndex));
        const textContent = estiloTag.payload.slice(pipeIndex + 1).trim();
        blocks.push({
          id: nextId(),
          type: 'parrafo',
          content: textContent,
          styleName: styleName,
          rawText: line,
        });
        i++;
        continue;
      } else {
        const spaceIndex = estiloTag.payload.indexOf(' ');
        if (spaceIndex !== -1) {
          const styleName = sanitizeAnchorId(estiloTag.payload.slice(0, spaceIndex));
          const textContent = estiloTag.payload.slice(spaceIndex + 1).trim();
          blocks.push({
            id: nextId(),
            type: 'parrafo',
            content: textContent,
            styleName: styleName,
            rawText: line,
          });
          i++;
          continue;
        } else {
          blocks.push({
            id: nextId(),
            type: 'parrafo',
            content: '',
            styleName: sanitizeAnchorId(estiloTag.payload),
            rawText: line,
          });
          i++;
          continue;
        }
      }
    }

    // 18. PARRAFO: [parrafo: ...] or [parrafo] ... [/parrafo]
    const parrafoTag = extractTagPayload(line, 'parrafo');
    if (parrafoTag.matches) {
      const { content, styleName } = parseParagraphPayload(parrafoTag.payload);
      blocks.push({
        id: nextId(),
        type: 'parrafo',
        content: content,
        styleName: styleName,
        rawText: line,
      });
      i++;
      continue;
    }

    // Default: Plain text paragraph
    blocks.push({
      id: nextId(),
      type: 'parrafo',
      content: line,
      rawText: line,
    });
    i++;
  }

  return blocks;
}

// Convert inline formatting like **bold**, *italic*, [1] footnotes, and [ref: id | texto] cross-references into safe HTML
export function renderInlineMarkdown(text: string, accentColor?: string): string {
  if (!text) return '';
  
  let formatted = text
    // escape dangerous html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  
  // Italic *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  
  // Underline __text__
  formatted = formatted.replace(/__(.*?)__/g, '<u class="underline decoration-1 underline-offset-2">$1</u>');
  
  // Cross-reference links: [ref: target_id | Texto del enlace] or [ref: target_id]
  formatted = formatted.replace(/\[ref:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]/gi, (match, rawTarget, rawLabel) => {
    const target = sanitizeAnchorId(rawTarget);
    const label = rawLabel ? rawLabel.trim() : rawTarget.trim();
    const linkStyle = accentColor ? `style="color: ${accentColor};"` : '';
    return `<a href="#anchor_${target}" class="cross-reference-link cursor-pointer hover:underline font-medium" ${linkStyle} data-target-anchor="${target}">${label}</a>`;
  });

  // Inline anchor marker: [ancla: mi_id]
  formatted = formatted.replace(/\[ancla:\s*([^\]]+)\]/gi, (match, rawId) => {
    const cleanId = sanitizeAnchorId(rawId);
    return `<span id="anchor_${cleanId}" class="anchor-point inline-block w-0 h-0 overflow-hidden" data-anchor="${cleanId}"></span>`;
  });

  // Footnote reference marker [n]
  const fnColorStyle = accentColor ? `style="color: ${accentColor};"` : 'style="color: var(--accent-color, currentColor);"';
  formatted = formatted.replace(
    /\[(\d+)\]/g, 
    `<sup class="text-xs font-semibold px-0.5 align-super select-none cursor-pointer hover:underline" ${fnColorStyle} data-footnote="$1">[$1]</sup>`
  );
  
  return formatted;
}
