export type PageSize = 'A4' | 'A5' | 'Letter' | 'B5';

export interface ImageAsset {
  id: string;
  name: string; // e.g. "portada.jpg", "grafico1.png"
  url: string;  // data URL or object URL
  caption?: string; // Default caption/legend for the image
  category?: 'Portadas' | 'Capítulos' | 'Diagramas' | 'Fotografías' | 'Ilustraciones' | 'General';
  tags?: string[];
  referenceId?: string; // unique anchor ID e.g. "fig1", "grafico_ventas"
  sizeBytes?: number;
  width?: number;
  height?: number;
  createdAt?: number;
}

export interface ParagraphStylePreset {
  id: string;
  name: string; // e.g. "Diálogo Literario", "Epígrafe", "Cita Académica", "Párrafo Destacado"
  description?: string;
  firstLineIndent: number; // in px e.g. 0 to 40px
  spaceBefore: number; // in px e.g. 0 to 32px
  spaceAfter: number; // in px e.g. 0 to 32px
  lineHeight: number; // e.g. 1.2 to 2.4
  fontSizeDelta?: number; // e.g. -2, 0, +2
  textAlign?: 'left' | 'justify' | 'center' | 'right';
  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold' | 'semibold';
  textColor?: string;
  backgroundColor?: string;
  borderLeftColor?: string;
  borderLeftWidth?: number; // in px e.g. 0, 2, 4
  paddingLeft?: number; // in px e.g. 0, 8, 16
  isDefault?: boolean;
}

export type TagType =
  | 'portada'
  | 'portada_imagen'
  | 'indice'
  | 'elemento_indice'
  | 'capitulo'
  | 'titulo'
  | 'subtitulo'
  | 'parrafo'
  | 'imagen'
  | 'nota_al_pie'
  | 'cita'
  | 'destacado'
  | 'separador'
  | 'salto_de_pagina'
  | 'lista'
  | 'ancla'
  | 'referencia'
  | 'encabezado'
  | 'editorial'
  | 'meta'
  | 'texto_plano';

export interface ParsedBlock {
  id: string;
  type: TagType;
  content: string;
  subtitle?: string;
  author?: string;
  imageFileName?: string;
  caption?: string;
  pageNumber?: string;
  footnoteNumber?: number;
  highlightType?: 'info' | 'tip' | 'warning' | 'quote';
  listItems?: string[];
  rawText?: string;
  anchorId?: string;       // Unique anchor ID e.g. "fig1", "capitulo_2", "seccion_datos"
  targetRefId?: string;    // Anchor ID being referenced
  styleName?: string;      // Paragraph style name e.g. "dialogo", "epigrafe"
  customStyle?: Partial<ParagraphStylePreset>;
  editionBadge?: string;   // Customizable badge text on cover e.g. "1ª Edición Oficial"
  headerLeft?: string;     // Custom running header left text
  headerRight?: string;    // Custom running header right text
}

export interface BookSettings {
  bookTitle: string;
  authorName: string;
  pageSize: PageSize;
  orientation: 'portrait' | 'landscape';
  
  // Theme & Colors
  themeId: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  secondaryTextColor: string;
  borderColor: string;
  
  // Typography
  fontHeading: string;
  fontBody: string;
  fontSizeBase: number; // in px e.g. 15
  headingScale: number; // e.g. 1.25, 1.4, 1.6
  lineHeight: number;   // e.g. 1.6
  textAlign: 'left' | 'justify' | 'center';
  paragraphIndent: boolean;
  paragraphSpacing: number; // in px
  
  // Advanced Paragraph Styles
  paragraphStyles: ParagraphStylePreset[];
  
  // Margins (in mm)
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  
  // Page Numbers
  showPageNumbers: boolean;
  pageNumberFormat: '1' | 'Página 1' | '- 1 -' | '1 / N' | 'romano';
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right' | 'alternating';
  startPageNumberingOn: number; // usually page 2 or 3
  hideNumberOnCover: boolean;
  hideNumberOnIndex: boolean;
  
  // Headers & Footers & Edition
  showHeader: boolean;
  headerText: string;
  headerRightText?: string;
  headerStyle: 'simple' | 'divided' | 'chapter-name';
  showFooterDivider: boolean;
  editionBadge?: string;
  
  // Chapter styling
  chapterStartNewPage: boolean;
  chapterNumberStyle: 'none' | 'numeric' | 'roman' | 'word';
  decorativeSeparator: 'none' | 'line' | 'stars' | 'diamond' | 'dots';
}

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Negocios & No-Ficción' | 'Novela & Ficción' | 'Guía & Manual' | 'Estilo de Vida' | 'Minimalista';
  sampleContent: string;
  settings: Partial<BookSettings>;
  sampleImages?: ImageAsset[];
}
