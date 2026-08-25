import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Bookmark, 
  ListTree, 
  Image as ImageIcon, 
  FileText, 
  Quote, 
  Sparkles, 
  Split, 
  Scissors, 
  ListPlus, 
  Bold, 
  Italic, 
  Underline,
  Undo2,
  Redo2,
  Copy,
  Check,
  HelpCircle,
  FileSpreadsheet,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  Replace,
  ReplaceAll
} from 'lucide-react';
import { ImageAsset } from '../types';
import { getTextareaCaretCoordinates } from '../utils/caretCoordinates';

interface EditorPanelProps {
  content: string;
  onChangeContent: (content: string) => void;
  images: ImageAsset[];
  onOpenImages: () => void;
  onOpenCheatsheet: () => void;
}

interface TextMatch {
  start: number;
  end: number;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  content,
  onChangeContent,
  images,
  onOpenImages,
  onOpenCheatsheet,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [textareaClientWidth, setTextareaClientWidth] = useState<number | null>(null);

  // Undo / Redo history state
  const historyRef = useRef<string[]>([content]);
  const historyIndexRef = useRef<number>(0);
  const isInternalUpdateRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Search & Replace state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Push new state to history
  const pushToHistory = useCallback((newText: string, immediate: boolean = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentSaved = historyRef.current[historyIndexRef.current];
    if (newText === currentSaved) return;

    const performPush = () => {
      // Truncate any redo future
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(newText);
      // Keep last 150 snapshots
      if (newHistory.length > 150) {
        newHistory.shift();
      }
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      updateUndoRedoState();
    };

    if (immediate) {
      performPush();
    } else {
      debounceTimerRef.current = setTimeout(performPush, 400);
    }
  }, [updateUndoRedoState]);

  // Synchronize external content changes (e.g. loading templates)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    const currentSaved = historyRef.current[historyIndexRef.current];
    if (content !== currentSaved) {
      historyRef.current = [content];
      historyIndexRef.current = 0;
      updateUndoRedoState();
    }
  }, [content, updateUndoRedoState]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetContent = historyRef.current[historyIndexRef.current];
      isInternalUpdateRef.current = true;
      onChangeContent(targetContent);
      updateUndoRedoState();
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 10);
    }
  }, [onChangeContent, updateUndoRedoState]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetContent = historyRef.current[historyIndexRef.current];
      isInternalUpdateRef.current = true;
      onChangeContent(targetContent);
      updateUndoRedoState();

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 10);
    }
  }, [onChangeContent, updateUndoRedoState]);

  // Compute all text matches
  const matches = useMemo<TextMatch[]>(() => {
    if (!searchQuery) return [];
    const results: TextMatch[] = [];
    try {
      let pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        results.push({
          start: match.index,
          end: match.index + match[0].length,
        });
        if (regex.lastIndex === match.index) {
          regex.lastIndex++;
        }
      }
    } catch (err) {
      console.warn('Error in search regex:', err);
    }
    return results;
  }, [content, searchQuery, matchCase, matchWholeWord]);

  // Ensure current match index is within range
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(matches.length - 1);
    }
  }, [matches.length, currentMatchIndex]);

  // Keep backdrop width perfectly in sync with textarea client area (excluding scrollbars)
  useEffect(() => {
    const updateSize = () => {
      if (textareaRef.current) {
        setTextareaClientWidth(textareaRef.current.clientWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [content, isSearchOpen]);

  // Handle synchronized scrolling between textarea and highlight backdrop
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
      if (textareaClientWidth !== textareaRef.current.clientWidth) {
        setTextareaClientWidth(textareaRef.current.clientWidth);
      }
    }
  }, [textareaClientWidth]);

  // Jump to specific match in textarea and position it in the vertical center of the screen
  const scrollToMatch = useCallback((
    index: number,
    matchesList: TextMatch[] = matches,
    shouldFocusTextarea: boolean = false
  ) => {
    if (matchesList.length === 0 || !textareaRef.current) return;
    const safeIndex = (index + matchesList.length) % matchesList.length;
    const match = matchesList[safeIndex];
    if (!match) return;

    setCurrentMatchIndex(safeIndex);
    const textarea = textareaRef.current;
    
    // Remember current active element before selection
    const activeEl = document.activeElement as HTMLElement | null;

    // Set selection range inside textarea
    textarea.setSelectionRange(match.start, match.end);

    if (shouldFocusTextarea) {
      textarea.focus();
    } else if (activeEl && activeEl !== textarea) {
      // Keep focus on the search / replace input without losing cursor
      activeEl.focus();
    }

    // Calculate exact pixel position of the match using the geometry mirror
    const coords = getTextareaCaretCoordinates(textarea, match.start);
    const viewportHeight = textarea.clientHeight || 450;
    
    // Center in viewport: targetScrollTop = coords.top - (viewportHeight / 2)
    const desiredScrollTop = Math.max(0, coords.top - (viewportHeight / 2) + (coords.lineHeight / 2));

    textarea.scrollTo({
      top: desiredScrollTop,
      behavior: 'smooth',
    });

    if (backdropRef.current) {
      backdropRef.current.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth',
      });
    }
  }, [matches]);

  // Generate highlighted backdrop segments for all matches
  const highlightedBackdrop = useMemo(() => {
    if (!isSearchOpen || !searchQuery || matches.length === 0) return null;

    const segments: React.ReactNode[] = [];
    let lastIdx = 0;

    matches.forEach((m, idx) => {
      if (m.start > lastIdx) {
        segments.push(
          <span key={`txt-${lastIdx}`} style={{ color: 'transparent' }}>
            {content.substring(lastIdx, m.start)}
          </span>
        );
      }

      const isCurrent = idx === currentMatchIndex;
      segments.push(
        <mark
          key={`match-${m.start}-${idx}`}
          style={{
            margin: 0,
            padding: 0,
            color: 'transparent',
            backgroundColor: isCurrent ? '#E5A919' : '#FDE047',
            outline: isCurrent ? '2px solid #B8860B' : 'none',
            borderRadius: '2px',
            display: 'inline',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
        >
          {content.substring(m.start, m.end)}
        </mark>
      );

      lastIdx = m.end;
    });

    if (lastIdx < content.length) {
      segments.push(
        <span key={`txt-${lastIdx}`} style={{ color: 'transparent' }}>
          {content.substring(lastIdx)}
        </span>
      );
    }

    if (content.endsWith('\n')) {
      segments.push(<span key="tail" style={{ color: 'transparent' }}>{' '}</span>);
    }

    return segments;
  }, [isSearchOpen, searchQuery, matches, currentMatchIndex, content]);

  // When search query changes and matches exist, jump to the first match WITHOUT stealing focus
  useEffect(() => {
    if (isSearchOpen && searchQuery && matches.length > 0) {
      scrollToMatch(0, matches, false);
    }
  }, [searchQuery, isSearchOpen, matchCase, matchWholeWord]);

  // Next / Previous match navigation
  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    scrollToMatch(nextIdx, matches, false);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    scrollToMatch(prevIdx, matches, false);
  };

  // Open search bar and optionally prefill selected text
  const openSearch = useCallback((withReplace: boolean = false) => {
    setIsSearchOpen(true);
    if (withReplace) {
      setShowReplace(true);
    }
    
    // If text is selected in textarea, prefill query
    if (textareaRef.current) {
      const selStart = textareaRef.current.selectionStart;
      const selEnd = textareaRef.current.selectionEnd;
      if (selEnd > selStart) {
        const selected = content.substring(selStart, selEnd);
        if (selected.trim() && !selected.includes('\n')) {
          setSearchQuery(selected);
        }
      }
    }

    setTimeout(() => {
      if (withReplace && replaceInputRef.current && searchQuery) {
        replaceInputRef.current.focus();
        replaceInputRef.current.select();
      } else if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    }, 30);
  }, [content, searchQuery]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Replace current match
  const handleReplaceCurrent = () => {
    if (matches.length === 0) return;
    const currentMatch = matches[currentMatchIndex];
    if (!currentMatch) return;

    const newText = content.substring(0, currentMatch.start) + replaceQuery + content.substring(currentMatch.end);
    isInternalUpdateRef.current = true;
    onChangeContent(newText);
    pushToHistory(newText, true);

    setTimeout(() => {
      // Re-find matches on updated text
      const nextMatches: TextMatch[] = [];
      try {
        let pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (matchWholeWord) pattern = `\\b${pattern}\\b`;
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(pattern, flags);
        let m: RegExpExecArray | null;
        while ((m = regex.exec(newText)) !== null) {
          nextMatches.push({ start: m.index, end: m.index + m[0].length });
          if (regex.lastIndex === m.index) regex.lastIndex++;
        }
      } catch {
        // ignore
      }

      if (nextMatches.length > 0) {
        const targetIdx = currentMatchIndex < nextMatches.length ? currentMatchIndex : 0;
        scrollToMatch(targetIdx, nextMatches);
      }
    }, 10);
  };

  // Replace all matches
  const handleReplaceAll = () => {
    if (matches.length === 0 || !searchQuery) return;
    
    let pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (matchWholeWord) pattern = `\\b${pattern}\\b`;
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    
    const newText = content.replace(regex, replaceQuery);
    isInternalUpdateRef.current = true;
    onChangeContent(newText);
    pushToHistory(newText, true);
  };

  // Handle typing inside textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    isInternalUpdateRef.current = true;
    onChangeContent(newText);
    pushToHistory(newText, false);
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isModifier = e.ctrlKey || e.metaKey;
    if (!isModifier) return;

    const key = e.key.toLowerCase();

    if (key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if (key === 'y') {
      e.preventDefault();
      handleRedo();
    } else if (key === 'f') {
      e.preventDefault();
      openSearch(false);
    } else if (key === 'h') {
      e.preventDefault();
      openSearch(true);
    }
  };

  // Helper to insert tag or wrap selection
  const insertTag = (tagTemplate: string, wrapPattern?: { prefix: string; suffix: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = '';
    let newCursorPos = start;

    if (wrapPattern && selectedText) {
      const wrapped = `${wrapPattern.prefix}${selectedText}${wrapPattern.suffix}`;
      newText = content.substring(0, start) + wrapped + content.substring(end);
      newCursorPos = start + wrapped.length;
    } else {
      let insertion = tagTemplate;
      if (selectedText) {
        // Replace default placeholder with selected text
        insertion = tagTemplate.replace('Texto del párrafo', selectedText)
                               .replace('Título Principal', selectedText)
                               .replace('Subtítulo descriptivo', selectedText)
                               .replace('Título del Capítulo', selectedText);
      }
      
      const before = content.substring(0, start);
      const after = content.substring(end);
      
      // Ensure clean line breaks around block tags
      const needsLeadingNewline = before.length > 0 && !before.endsWith('\n') && !before.endsWith('\n\n');
      const prefix = needsLeadingNewline ? '\n\n' : '';
      const suffix = after.startsWith('\n') ? '' : '\n';
      
      const fullInsert = prefix + insertion + suffix;
      newText = before + fullInsert + after;
      newCursorPos = start + fullInsert.length;
    }

    isInternalUpdateRef.current = true;
    onChangeContent(newText);
    pushToHistory(newText, true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Quick statistics calculation
  const wordCount = React.useMemo(() => {
    const clean = content.replace(/\[.*?\]/g, ' ').trim();
    if (!clean) return 0;
    return clean.split(/\s+/).filter(Boolean).length;
  }, [content]);

  const characterCount = content.length;
  const estimatedReadingTime = Math.ceil(wordCount / 200);

  const chapterCount = (content.match(/\[capitulo(?::|\s)/gi) || []).length;
  const imageTagCount = (content.match(/\[imagen(?::|\s)/gi) || []).length;
  const footnoteCount = (content.match(/\[nota_al_pie(?::|\s)/gi) || []).length;

  const handleCopyText = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF9F7] border-r border-[#D1CEC8] select-none overflow-hidden min-w-0">
      {/* Top Tag Toolbar */}
      <div className="shrink-0 p-2.5 border-b border-[#D1CEC8] bg-white flex flex-wrap items-center gap-1.5 shadow-xs">
        {/* Undo & Redo Quick Buttons */}
        <div className="flex items-center gap-0.5 mr-1 bg-[#F4F1EE] p-0.5 rounded border border-[#D1CEC8]">
          <button
            id="editor-btn-undo"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1 rounded transition-colors flex items-center justify-center ${
              canUndo
                ? 'text-[#1A1A1A] hover:bg-white hover:shadow-xs active:scale-95 cursor-pointer'
                : 'text-[#BBB] cursor-not-allowed opacity-50'
            }`}
            title="Deshacer (Ctrl + Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            id="editor-btn-redo"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1 rounded transition-colors flex items-center justify-center ${
              canRedo
                ? 'text-[#1A1A1A] hover:bg-white hover:shadow-xs active:scale-95 cursor-pointer'
                : 'text-[#BBB] cursor-not-allowed opacity-50'
            }`}
            title="Rehacer (Ctrl + Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Search Button in Toolbar */}
        <button
          id="editor-btn-search"
          onClick={() => (isSearchOpen ? closeSearch() : openSearch(false))}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border transition-colors ${
            isSearchOpen
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
              : 'bg-[#F4F1EE] hover:bg-[#EBE7E1] text-[#1A1A1A] border-[#D1CEC8]'
          }`}
          title="Buscar y reemplazar en el texto (Ctrl + F)"
        >
          <Search className="w-3 h-3 text-[#B8860B]" />
          <span>Buscar</span>
        </button>

        <div className="text-[10px] font-bold text-[#888] uppercase tracking-widest px-1.5 py-0.5 flex items-center gap-1">
          <span>Insertar:</span>
        </div>

        {/* Structural tags */}
        <button
          id="tag-btn-portada"
          onClick={() => insertTag('[portada: Título de tu Obra | Subtítulo impactante | Nombre del Autor | portada.jpg]')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#1A1A1A] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Portada Tipográfica del Libro [portada]"
        >
          <Bookmark className="w-3 h-3 text-[#B8860B]" />
          <span>Portada</span>
        </button>

        <button
          id="tag-btn-portada-imagen"
          onClick={() => {
            const firstImg = images[0]?.name || 'portada_completa.jpg';
            insertTag(`[portada_imagen: ${firstImg}]`);
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#1A1A1A] rounded border border-[#D1CEC8] hover:border-[#B8860B] transition-colors"
          title="Insertar Portada de Imagen Completa a Sangre [portada_imagen: archivo.jpg]"
        >
          <ImageIcon className="w-3 h-3 text-[#B8860B]" />
          <span>Portada Imagen</span>
        </button>

        <button
          id="tag-btn-indice"
          onClick={() => insertTag('[indice: Tabla de Contenidos]\n[elemento_indice: Capítulo 1: Introducción | 3]\n[elemento_indice: Capítulo 2: Desarrollo | 5]')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#1A1A1A] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Índice de contenidos [indice]"
        >
          <ListTree className="w-3 h-3 text-[#777]" />
          <span>Índice</span>
        </button>

        <button
          id="tag-btn-capitulo"
          onClick={() => insertTag('[capitulo: 1 | Título del Capítulo]')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#1A1A1A] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar nuevo Capítulo [capitulo]"
        >
          <Heading1 className="w-3 h-3 text-[#B8860B]" />
          <span>Capítulo</span>
        </button>

        <button
          id="tag-btn-titulo"
          onClick={() => insertTag('[titulo: Título Principal]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Título [titulo]"
        >
          <Type className="w-3 h-3 text-[#777]" />
          <span>Título</span>
        </button>

        <button
          id="tag-btn-subtitulo"
          onClick={() => insertTag('[subtitulo: Subtítulo descriptivo]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Subtítulo [subtitulo]"
        >
          <Heading2 className="w-3 h-3 text-[#777]" />
          <span>Subtítulo</span>
        </button>

        <button
          id="tag-btn-parrafo"
          onClick={() => insertTag('[parrafo: Escribe aquí el texto de tu párrafo con fluidez y claridad.]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Párrafo [parrafo]"
        >
          <FileText className="w-3 h-3 text-[#777]" />
          <span>Párrafo</span>
        </button>

        <button
          id="tag-btn-encabezado"
          onClick={() => insertTag('[encabezado: Título de la Obra | Capítulo Actual]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Personalizar Encabezado superior de páginas [encabezado: Izq | Der]"
        >
          <Type className="w-3 h-3 text-[#B8860B]" />
          <span>Encabezado</span>
        </button>

        <button
          id="tag-btn-editorial"
          onClick={() => insertTag('[editorial: 1ª Edición Digital • 2026]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Definir Badge/Edición de Portada [editorial: Texto]"
        >
          <Bookmark className="w-3 h-3 text-[#B8860B]" />
          <span>Edición</span>
        </button>

        {/* Media & Enhancements */}
        <div className="h-4 w-px bg-[#D1CEC8] mx-0.5" />

        <button
          id="tag-btn-imagen"
          onClick={() => {
            const firstImg = images[0]?.name || 'portada.jpg';
            insertTag(`[imagen: ${firstImg} | Pie de foto explicativo | 90%]`);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#1A1A1A] rounded border border-[#D1CEC8] hover:border-[#B8860B] transition-colors"
          title="Insertar Imagen [imagen: archivo.jpg | pie]"
        >
          <ImageIcon className="w-3 h-3 text-[#B8860B]" />
          <span>Imagen</span>
        </button>

        <button
          id="tag-btn-nota-pie"
          onClick={() => insertTag('[nota_al_pie: 1 | Fuente consultada o aclaración bibliográfica.]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#1A1A1A] rounded border border-[#D1CEC8] hover:border-[#B8860B] transition-colors"
          title="Insertar Nota al pie [nota_al_pie]"
        >
          <FileSpreadsheet className="w-3 h-3 text-[#B8860B]" />
          <span>Nota al pie</span>
        </button>

        <button
          id="tag-btn-cita"
          onClick={() => insertTag('[cita: Frase célebre o cita memorable que inspira el capítulo. | Autor de la cita]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Cita destacada [cita]"
        >
          <Quote className="w-3 h-3 text-[#777]" />
          <span>Cita</span>
        </button>

        <button
          id="tag-btn-destacado"
          onClick={() => insertTag('[destacado: Consejo Práctico | Resalta una idea clave o advertencia importante para el lector.]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Recuadro Destacado [destacado]"
        >
          <Sparkles className="w-3 h-3 text-[#B8860B]" />
          <span>Destacado</span>
        </button>

        <button
          id="tag-btn-lista"
          onClick={() => insertTag('[lista: Primer elemento importante | Segundo elemento con detalles, fechas o comas | Tercer elemento de acción]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Lista de viñetas [lista: Elemento 1 | Elemento 2]"
        >
          <ListPlus className="w-3 h-3 text-[#777]" />
          <span>Lista</span>
        </button>

        <button
          id="tag-btn-separador"
          onClick={() => insertTag('[separador]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Separador ornamental [separador]"
        >
          <Split className="w-3 h-3 text-[#777]" />
          <span>Separador</span>
        </button>

        <button
          id="tag-btn-salto"
          onClick={() => insertTag('[salto_de_pagina]')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors"
          title="Insertar Salto de página forzado [salto_de_pagina]"
        >
          <Scissors className="w-3 h-3 text-[#777]" />
          <span>Salto Pág</span>
        </button>

        {/* Text formatting shortcuts */}
        <div className="h-4 w-px bg-[#D1CEC8] mx-0.5" />

        <button
          onClick={() => insertTag('', { prefix: '**', suffix: '**' })}
          className="p-1 text-[#666] hover:text-[#1A1A1A] hover:bg-[#F4F1EE] rounded transition-colors"
          title="Negrita (**texto**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertTag('', { prefix: '*', suffix: '*' })}
          className="p-1 text-[#666] hover:text-[#1A1A1A] hover:bg-[#F4F1EE] rounded transition-colors"
          title="Cursiva (*texto*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertTag('', { prefix: '__', suffix: '__' })}
          className="p-1 text-[#666] hover:text-[#1A1A1A] hover:bg-[#F4F1EE] rounded transition-colors"
          title="Subrayado (__texto__)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Docked Search & Replace Bar (collapsible, never obscures text) */}
      {isSearchOpen && (
        <div 
          id="editor-search-widget"
          className="shrink-0 bg-[#FAF9F7] border-b border-[#D1CEC8] px-4 py-2.5 text-xs select-none animate-in fade-in slide-in-from-top-1 duration-150 shadow-inner"
        >
          {/* Search Input Row */}
          <div className="flex items-center gap-2 max-w-2xl">
            <button
              type="button"
              onClick={() => setShowReplace(!showReplace)}
              className={`p-1 rounded text-[#666] hover:text-[#1A1A1A] hover:bg-white transition-transform ${
                showReplace ? 'rotate-90' : ''
              }`}
              title={showReplace ? 'Ocultar reemplazo' : 'Mostrar reemplazo (Ctrl + H)'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                ref={searchInputRef}
                id="editor-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handlePrevMatch();
                    } else {
                      handleNextMatch();
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeSearch();
                  }
                }}
                placeholder="Buscar palabra o frase en el ebook..."
                className="w-full pl-7 pr-16 py-1 bg-white text-[#1A1A1A] border border-[#D1CEC8] focus:border-[#B8860B] rounded outline-none text-xs font-mono transition-colors shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#888] absolute left-2 pointer-events-none" />

              {/* Match Counter Badge */}
              <span className="absolute right-2 text-[11px] font-mono text-[#666] pointer-events-none">
                {searchQuery ? (
                  matches.length > 0 ? (
                    <span className="font-semibold text-[#1A1A1A]">{currentMatchIndex + 1}/{matches.length}</span>
                  ) : (
                    <span className="text-red-500 font-semibold">0/0</span>
                  )
                ) : (
                  ''
                )}
              </span>
            </div>

            {/* Match Case & Whole Word buttons */}
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-[#D1CEC8]">
              <button
                type="button"
                onClick={() => setMatchCase(!matchCase)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                  matchCase
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
                title="Coincidir mayúsculas / minúsculas (Aa)"
              >
                Aa
              </button>
              <button
                type="button"
                onClick={() => setMatchWholeWord(!matchWholeWord)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                  matchWholeWord
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
                title="Palabras completas (\b)"
              >
                \b
              </button>
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-[#D1CEC8]">
              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={matches.length === 0}
                className="p-1 rounded text-[#555] hover:text-[#1A1A1A] hover:bg-[#F4F1EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Anterior (Shift + Enter)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                disabled={matches.length === 0}
                className="p-1 rounded text-[#555] hover:text-[#1A1A1A] hover:bg-[#F4F1EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Siguiente (Enter)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeSearch}
              className="p-1.5 rounded text-[#777] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Replace Input Row (Expandable) */}
          {showReplace && (
            <div className="mt-2 pt-2 border-t border-[#E0DCD6] flex items-center gap-2 max-w-2xl animate-in fade-in duration-100">
              <div className="w-5 shrink-0" />
              <div className="flex-1 relative">
                <input
                  ref={replaceInputRef}
                  id="editor-replace-input"
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleReplaceCurrent();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      closeSearch();
                    }
                  }}
                  placeholder="Reemplazar con..."
                  className="w-full px-2.5 py-1 bg-white text-[#1A1A1A] border border-[#D1CEC8] focus:border-[#B8860B] rounded outline-none text-xs font-mono transition-colors shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleReplaceCurrent}
                disabled={matches.length === 0}
                className="px-2.5 py-1 bg-white hover:bg-[#F4F1EE] text-[#1A1A1A] border border-[#D1CEC8] hover:border-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors shrink-0"
                title="Reemplazar la coincidencia actual"
              >
                Reemplazar
              </button>

              <button
                type="button"
                onClick={handleReplaceAll}
                disabled={matches.length === 0}
                className="px-2.5 py-1 bg-white hover:bg-[#F4F1EE] text-[#1A1A1A] border border-[#D1CEC8] hover:border-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors shrink-0"
                title="Reemplazar todas las coincidencias"
              >
                Reemplazar todo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Textarea with Highlight Backdrop */}
      <div className="flex-1 relative flex overflow-hidden bg-white">
        {/* Synchronized Highlight Backdrop */}
        {highlightedBackdrop && (
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="absolute top-0 left-0 bottom-0 pointer-events-none p-6 font-mono text-[13px] leading-[22px] whitespace-pre-wrap break-words overflow-hidden select-none border-none"
            style={{
              width: textareaClientWidth ? `${textareaClientWidth}px` : '100%',
              boxSizing: 'border-box',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              tabSize: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '22px',
              letterSpacing: '0px',
            }}
          >
            {highlightedBackdrop}
          </div>
        )}

        <textarea
          ref={textareaRef}
          id="ebook-content-editor"
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="Comienza a redactar tu ebook usando etiquetas:&#10;&#10;[portada: Título | Subtítulo | Autor | portada.jpg]&#10;[salto_de_pagina]&#10;[indice: Tabla de Contenidos]&#10;[elemento_indice: Capítulo 1 | 3]&#10;[salto_de_pagina]&#10;[capitulo: 1 | Mi Primer Capítulo]&#10;[parrafo: Tu texto aquí...]"
          className={`relative z-10 w-full h-full p-6 font-mono text-[13px] leading-[22px] text-[#2C2C2C] placeholder:text-[#AAA] resize-none outline-none overflow-y-scroll selection:bg-[#B8860B] selection:text-white border-none ${
            highlightedBackdrop ? 'bg-transparent' : 'bg-white'
          }`}
          style={{
            boxSizing: 'border-box',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            tabSize: 2,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '22px',
            letterSpacing: '0px',
          }}
          spellCheck={false}
        />
      </div>

      {/* Quick Image Insertion Helper Bar if images exist */}
      {images.length > 0 && (
        <div className="shrink-0 px-3.5 py-2 bg-[#FAF9F7] border-t border-[#D1CEC8] flex items-center gap-2 overflow-x-auto text-[11px] text-[#666]">
          <span className="text-[#1A1A1A] font-semibold shrink-0 flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-[#B8860B]" /> Insertar imagen:
          </span>
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => insertTag(`[imagen: ${img.name} | Descripción de ${img.name} | 90%]`)}
              className="px-2 py-0.5 bg-white hover:bg-[#F4F1EE] text-[#2C2C2C] rounded border border-[#D1CEC8] hover:border-[#1A1A1A] transition-colors shrink-0 flex items-center gap-1 font-mono text-[10px]"
              title={`Insertar [imagen: ${img.name}]`}
            >
              <span>{img.name}</span>
            </button>
          ))}
          <button
            onClick={onOpenImages}
            className="text-[#B8860B] hover:text-[#8D6505] underline underline-offset-2 ml-auto shrink-0 font-medium"
          >
            + Subir más
          </button>
        </div>
      )}

      {/* Bottom status bar with stats */}
      <div className="h-8 px-4 bg-white border-t border-[#D1CEC8] flex items-center justify-between text-[11px] text-[#777] shrink-0">
        <div className="flex items-center gap-3">
          <span><strong className="text-[#2C2C2C] font-semibold">{wordCount}</strong> palabras</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline"><strong className="text-[#2C2C2C] font-semibold">{characterCount}</strong> caracteres</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">~<strong className="text-[#2C2C2C] font-semibold">{estimatedReadingTime}</strong> min lectura</span>
          <span>•</span>
          <span className="text-[#B8860B] font-medium">{chapterCount} caps</span>
          <span>•</span>
          <span className="text-[#555] font-medium">{imageTagCount} fotos</span>
          <span>•</span>
          <span className="text-[#555] font-medium">{footnoteCount} notas</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1 hover:text-[#1A1A1A] px-2 py-0.5 rounded hover:bg-[#FAF9F7] transition-colors"
            title="Copiar todo el texto"
          >
            {copied ? <Check className="w-3 h-3 text-[#B8860B]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={onOpenCheatsheet}
            className="flex items-center gap-1 text-[#B8860B] hover:text-[#8D6505] font-medium px-2 py-0.5 rounded hover:bg-[#FAF9F7] transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Guía</span>
          </button>
        </div>
      </div>
    </div>
  );
};

