import { BookSettings, BookTemplate, ImageAsset, ParagraphStylePreset } from '../types';

export const DEFAULT_PARAGRAPH_STYLES: ParagraphStylePreset[] = [
  {
    id: 'estilo_estandar',
    name: 'Estándar Editorial',
    description: 'Párrafo general con sangría de primera línea y espaciado equilibrado',
    firstLineIndent: 20,
    spaceBefore: 0,
    spaceAfter: 10,
    lineHeight: 1.65,
    textAlign: 'justify',
    fontStyle: 'normal',
    fontWeight: 'normal',
    isDefault: true,
  },
  {
    id: 'estilo_dialogo',
    name: 'Diálogo Literario',
    description: 'Sangría pronunciada de primera línea con raya de diálogo y espacio compacto',
    firstLineIndent: 28,
    spaceBefore: 2,
    spaceAfter: 4,
    lineHeight: 1.55,
    textAlign: 'justify',
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
  {
    id: 'estilo_academico',
    name: 'Párrafo Académico / Formal',
    description: 'Interlineado amplio, justificación estricta y espaciado generoso',
    firstLineIndent: 24,
    spaceBefore: 4,
    spaceAfter: 14,
    lineHeight: 1.8,
    textAlign: 'justify',
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
  {
    id: 'estilo_epigrafe',
    name: 'Epígrafe & Nota Marginal',
    description: 'Texto en cursiva con borde sutil izquierdo y espaciado acotado',
    firstLineIndent: 0,
    spaceBefore: 12,
    spaceAfter: 12,
    lineHeight: 1.5,
    fontSizeDelta: -1,
    textAlign: 'left',
    fontStyle: 'italic',
    fontWeight: 'normal',
    borderLeftColor: '#B8860B',
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  {
    id: 'estilo_bloque_destacado',
    name: 'Cita en Bloque Estilizada',
    description: 'Sangrado lateral completo, tipografía refinada y fondo suave',
    firstLineIndent: 0,
    spaceBefore: 16,
    spaceAfter: 16,
    lineHeight: 1.6,
    textAlign: 'justify',
    fontStyle: 'italic',
    fontWeight: 'normal',
    borderLeftColor: '#1A1A1A',
    borderLeftWidth: 3,
    paddingLeft: 14,
  },
  {
    id: 'estilo_verso',
    name: 'Poesía / Verso Centrado',
    description: 'Alineación centrada con interlineado lírico y sin sangría',
    firstLineIndent: 0,
    spaceBefore: 6,
    spaceAfter: 6,
    lineHeight: 1.9,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
];

export const DEFAULT_BOOK_SETTINGS: BookSettings = {
  bookTitle: 'Título de tu Ebook',
  authorName: 'Nombre del Autor',
  pageSize: 'A5',
  orientation: 'portrait',
  
  // Theme
  themeId: 'editorial-aesthetic',
  backgroundColor: '#FAF9F7',
  textColor: '#2C2C2C',
  accentColor: '#B8860B',
  secondaryTextColor: '#777777',
  borderColor: '#D1CEC8',
  
  // Typography
  fontHeading: 'Libre Baskerville',
  fontBody: 'Libre Baskerville',
  fontSizeBase: 14,
  headingScale: 1.35,
  lineHeight: 1.65,
  textAlign: 'justify',
  paragraphIndent: true,
  paragraphSpacing: 12,
  
  // Advanced Paragraph Styles
  paragraphStyles: DEFAULT_PARAGRAPH_STYLES,
  
  // Margins in mm
  marginTop: 22,
  marginBottom: 22,
  marginLeft: 22,
  marginRight: 22,
  
  // Page Numbers
  showPageNumbers: true,
  pageNumberFormat: '- 1 -',
  pageNumberPosition: 'bottom-center',
  startPageNumberingOn: 3,
  hideNumberOnCover: true,
  hideNumberOnIndex: true,
  
  // Headers & Footers (No hardcoded text; if empty, running headers are hidden)
  showHeader: true,
  headerText: '',
  headerRightText: '',
  headerStyle: 'divided',
  showFooterDivider: false,
  editionBadge: '',
  
  // Chapters
  chapterStartNewPage: true,
  chapterNumberStyle: 'word',
  decorativeSeparator: 'diamond',
};

// Ready-to-use sample illustrations as default image library
export const DEFAULT_SAMPLE_IMAGES: ImageAsset[] = [
  {
    id: 'img_cover_default',
    name: 'portada_ebook.jpg',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
    caption: 'Portada oficial de la edición editorial.',
    category: 'Portadas',
    tags: ['portada', 'principal'],
    referenceId: 'portada_principal',
    sizeBytes: 142000,
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'img_graph_sales',
    name: 'grafico_ventas.png',
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
    caption: 'Figura 2.1: Esquema y métricas de crecimiento.',
    category: 'Diagramas',
    tags: ['estadísticas', 'mercado', 'figura2'],
    referenceId: 'fig_ventas',
    sizeBytes: 98000,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'img_workspace',
    name: 'espacio_trabajo.jpg',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
    caption: 'Figura 1.1: El espacio de trabajo y planificación.',
    category: 'Fotografías',
    tags: ['escritorio', 'planificacion', 'figura1'],
    referenceId: 'fig_espacio',
    sizeBytes: 120000,
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'img_author_portrait',
    name: 'autor_foto.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    caption: 'Fotografía de autor para solapa o biografía.',
    category: 'Fotografías',
    tags: ['autor', 'perfil', 'biografia'],
    referenceId: 'foto_autor',
    sizeBytes: 85000,
    createdAt: Date.now() - 3600000 * 2,
  },
];

export const THEME_PRESETS = [
  {
    id: 'editorial-aesthetic',
    name: 'Editorial Aesthetic',
    desc: 'Lino cálido, tinta profunda y detalles dorados sobrios',
    bg: '#FAF9F7',
    text: '#2C2C2C',
    accent: '#B8860B',
    secondary: '#777777',
    border: '#D1CEC8',
  },
  {
    id: 'clean-white',
    name: 'Blanco Editorial',
    desc: 'Limpio, moderno y versátil para cualquier género',
    bg: '#FFFFFF',
    text: '#18181B',
    accent: '#1A1A1A',
    secondary: '#71717A',
    border: '#E4E4E7',
  },
  {
    id: 'cream-book',
    name: 'Papel Crema / Novela',
    desc: 'Tono cálido tradicional que reduce la fatiga visual',
    bg: '#FDFBF7',
    text: '#27272A',
    accent: '#B45309',
    secondary: '#78716C',
    border: '#E7E5E4',
  },
  {
    id: 'sepia-vintage',
    name: 'Sepia Literario',
    desc: 'Aura clásica de imprenta histórica y elegancia',
    bg: '#F5EFE6',
    text: '#3E2723',
    accent: '#8D6E63',
    secondary: '#6D4C41',
    border: '#D7CCC8',
  },
  {
    id: 'nordic-minimal',
    name: 'Nórdico Minimalista',
    desc: 'Gris perla sutil con tipografía sobria y precisa',
    bg: '#F8FAFC',
    text: '#0F172A',
    accent: '#0D9488',
    secondary: '#64748B',
    border: '#E2E8F0',
  },
  {
    id: 'rose-quartz',
    name: 'Rosa Editorial Suave',
    desc: 'Perfecto para bienestar, desarrollo personal o memorias',
    bg: '#FCF8F8',
    text: '#2D1525',
    accent: '#BE185D',
    secondary: '#831843',
    border: '#FCE7F3',
  },
  {
    id: 'dark-editorial',
    name: 'Edición Nocturna Lujo',
    desc: 'Fondo oscuro de alta gama para libros técnicos o arte',
    bg: '#1A1A1A',
    text: '#F4F1EE',
    accent: '#B8860B',
    secondary: '#999999',
    border: '#333333',
  },
];

export const TYPOGRAPHY_PAIRINGS = [
  {
    name: 'Editorial Baskerville',
    heading: 'Libre Baskerville',
    body: 'Libre Baskerville',
    category: 'Serif de Imprenta',
  },
  {
    name: 'Clásico Literario',
    heading: 'Playfair Display',
    body: 'Lora',
    category: 'Serif Clásico',
  },
  {
    name: 'Best Seller Elegante',
    heading: 'Cinzel',
    body: 'Merriweather',
    category: 'Elegancia / Ficción',
  },
  {
    name: 'Garamond Renacimiento',
    heading: 'Cormorant Garamond',
    body: 'Lora',
    category: 'Histórico & Poético',
  },
  {
    name: 'Negocios & Modernidad',
    heading: 'Montserrat',
    body: 'Inter',
    category: 'Sans Moderno',
  },
  {
    name: 'Editorial Vanguardia',
    heading: 'Outfit',
    body: 'Plus Jakarta Sans',
    category: 'Moderno / Tech',
  },
  {
    name: 'Híbrido Contemporáneo',
    heading: 'Playfair Display',
    body: 'Plus Jakarta Sans',
    category: 'Serif + Sans',
  },
];

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: 'template_bestseller_guide',
    name: 'Guía Editorial & Negocios',
    description: 'Estructura lista para maquetar publicaciones con capítulos claros, cajas destacadas e imágenes.',
    category: 'Negocios & No-Ficción',
    settings: {
      themeId: 'cream-book',
      backgroundColor: '#FDFBF7',
      textColor: '#27272A',
      accentColor: '#B45309',
      fontHeading: 'Playfair Display',
      fontBody: 'Lora',
      pageSize: 'A5',
      fontSizeBase: 13.5,
      lineHeight: 1.6,
      textAlign: 'justify',
      paragraphIndent: true,
      showPageNumbers: true,
      pageNumberFormat: '- 1 -',
      decorativeSeparator: 'diamond',
    },
    sampleContent: `[portada: Título del Ebook | Subtítulo descriptivo de la obra | Nombre del Autor o Marca | portada_ebook.jpg]

[salto_de_pagina]

[indice: Tabla de Contenidos]
[elemento_indice: Prólogo: Introducción a la Obra | 3]
[elemento_indice: Capítulo 1: Fundamentos de una Buena Estructura | 4]
[elemento_indice: Capítulo 2: El Poder Visual y los Gráficos | 6]
[elemento_indice: Capítulo 3: Estrategia y Conclusiones | 8]
[elemento_indice: Recursos y Anexos | 10]

[salto_de_pagina]

[titulo: Prólogo: Introducción a la Obra]
[subtitulo: Por qué estructurar adecuadamente tu conocimiento marca la diferencia]

[parrafo: Bienvenido al fascinante mundo de la creación de publicaciones editoriales. En este libro aprenderás el método exacto para convertir tus ideas, notas y borradores en un **producto de alta calidad** listo para sus lectores[1].]

[cita: Un libro no es solo un conjunto de páginas; es una conversación estructurada que transforma la mente de quien lo lee. | Referencia de Autor]

[destacado: Consejo Clave | La maquetación profesional y el cuidado tipográfico aumentan el valor percibido de tu contenido sustancialmente.]

[nota_al_pie: 1 | Datos y referencias bibliográficas sobre maquetación editorial y diseño de lectura.]

[separador]

[capitulo: 1 | Fundamentos de una Buena Estructura]
[subtitulo: Cómo organizar capítulos, títulos y notas para cautivar al lector]

[parrafo: Toda obra memorable comienza con una arquitectura clara. Cuando estructuramos un libro, no solo transmitimos información; guiamos la atención y el ritmo cognitivo del lector a través de una experiencia inmersiva y placentera.]

[imagen: espacio_trabajo.jpg | Figura 1.1: El espacio de trabajo creativo y la planificación inicial | 100%]

[parrafo: Es fundamental establecer una jerarquía tipográfica uniforme. Los **títulos principales** deben invitar a la lectura, mientras que los subtítulos anticipan las soluciones prácticas que vendrán a continuación.]

[destacado: Regla de Oro | Evita párrafos densos de más de 8 líneas. Divide las ideas complejas con elementos de apoyo visual y listas concisas.]

[lista: Define el problema central de tu audiencia | Estructura un índice secuencial y lógico | Inserta llamadas a la acción y reflexiones profundas]

[salto_de_pagina]

[capitulo: 2 | El Poder Visual y los Gráficos]
[subtitulo: Cómo las imágenes y esquemas refuerzan tu mensaje]

[parrafo: En la era de la saturación de información, una buena imagen no solo decora: sintetiza conceptos difíciles en un solo golpe de vista.]

[imagen: grafico_ventas.png | Gráfico 2.1: Crecimiento estimado y métricas de impacto | 90%]

[parrafo: Cada gráfico debe tener un **propósito didáctico específico**. Acompaña siempre tus esquemas de un pie de foto descriptivo y referencias a fuentes contrastadas[2].]

[nota_al_pie: 2 | Fuente: Reporte editorial y estudios de lectura independiente.]

[separador]

[capitulo: 3 | Estrategia y Conclusiones]
[subtitulo: Fidelizando a tus lectores mediante una experiencia cuidada]

[parrafo: El lanzamiento de tu obra es el inicio de una relación duradera. Ofrecer un diseño impecable genera confianza instantánea y asegura una lectura fluida.]

[destacado: Recomendación Final | Cuida siempre la coherencia estilística de tus fuentes, colores de acento y márgenes de impresión.]

[cita: La excelencia no radica en añadir más elementos, sino en no tener nada que quitar. | Principio Editorial]

[parrafo: ¡Felicidades por comenzar a estructurar tu propio catálogo de publicaciones!]`,
  },
  {
    id: 'template_novel_fiction',
    name: 'Novela Literaria & Ficción',
    description: 'Estilo clásico y refinado con sangría de párrafo, letra capitular y citas literarias.',
    category: 'Novela & Ficción',
    settings: {
      themeId: 'sepia-vintage',
      backgroundColor: '#F5EFE6',
      textColor: '#3E2723',
      accentColor: '#8D6E63',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Lora',
      pageSize: 'A5',
      fontSizeBase: 14,
      lineHeight: 1.7,
      textAlign: 'justify',
      paragraphIndent: true,
      showPageNumbers: true,
      pageNumberFormat: '- 1 -',
      decorativeSeparator: 'line',
    },
    sampleContent: `[portada: Las Sombras del Faro Antiguo | Novela de Misterio en Tres Actos | Nombre del Autor | portada_ebook.jpg]

[salto_de_pagina]

[indice: Índice General]
[elemento_indice: Acto Primero: La Llegada del Forastero | 3]
[elemento_indice: Acto Segundo: El Secreto de la Marea Baja | 5]
[elemento_indice: Acto Tercero: La Última Luz | 7]

[salto_de_pagina]

[capitulo: 1 | La Llegada del Forastero]

[cita: El mar no tiene piedad ni memoria; solo guarda lo que los hombres prefieren olvidar. | Crónicas del Cabo]

[parrafo: El viento del norte azotaba los ventanales de madera corroída del viejo muelle. Hacía más de diez años que nadie desembarcaba en Puerto Esperanza con una maleta de cuero y una carta sellada con cera escarlata.]

[parrafo: Mateo contempló la silueta del faro recortada contra un cielo plomizo. Sabía que las respuestas que buscaba no estaban escritas en los libros de registro, sino en los murmullos de los pescadores al caer la noche[1].]

[nota_al_pie: 1 | Puerto Esperanza, enclave ficticio en la costa septentrional.]

[separador]

[parrafo: Avanzó por el sendero empedrado con paso firme pero precavido. Cada crujido de las tablas bajo sus botas parecía resonar en el silencio ensordecedor de la niebla.]

[salto_de_pagina]

[capitulo: 2 | El Secreto de la Marea Baja]

[parrafo: Cuando las aguas se retiraron finalmente al filo de la medianoche, los restos del navío encallado revelaron algo que nadie esperaba hallar.]

[destacado: Fragmento del Diario | "Si encuentras esta página, no intentes descifrar el reloj de arena. El tiempo aquí se detuvo hace mucho."]

[parrafo: La luz del faro giró una vez más, proyectando una sombra alargada que parecía señalar directamente hacia la cripta.]`,
  },
  {
    id: 'template_cookbook_lifestyle',
    name: 'Recetario & Estilo de Vida',
    description: 'Diseño visual luminoso y fresco, ideal para recetas, viajes, fotografía y bienestar.',
    category: 'Estilo de Vida',
    settings: {
      themeId: 'rose-quartz',
      backgroundColor: '#FCF8F8',
      textColor: '#2D1525',
      accentColor: '#BE185D',
      fontHeading: 'Cinzel',
      fontBody: 'Plus Jakarta Sans',
      pageSize: 'A4',
      fontSizeBase: 13,
      lineHeight: 1.55,
      textAlign: 'left',
      paragraphIndent: false,
      showPageNumbers: true,
      pageNumberFormat: 'Página 1',
      decorativeSeparator: 'stars',
    },
    sampleContent: `[portada: Cocina Consciente & Sabores del Huerto | 50 Recetas para Nutrir el Alma | Nombre del Chef / Autor | espacio_trabajo.jpg]

[salto_de_pagina]

[indice: Contenido del Recetario]
[elemento_indice: Desayunos Energéticos & Smoothies | 3]
[elemento_indice: Platos Principales con Especias Frescas | 4]
[elemento_indice: Postres Saludables sin Azúcares Añadidos | 6]

[salto_de_pagina]

[titulo: Bowl Silvestre de Açaí y Frutos Rojos]
[subtitulo: Un desayuno repleto de antioxidantes y frescura matutina]

[imagen: portada_ebook.jpg | Presentación sugerida con semillas de chía y flores comestibles | 90%]

[destacado: Tiempo de Preparación | 10 Minutos • Porciones: 2 personas • Dificultad: Muy Fácil]

[parrafo: **Ingredientes:**]
[lista: 200g de pulpa pura de açaí congelada | 1 plátano maduro congelado | 100ml de leche de almendras sin azúcar | 1 taza de frutos rojos frescos | Semillas de cáñamo y coco laminado para decorar]

[parrafo: **Instrucciones paso a paso:**]
[parrafo: Coloca en una batidora de alta potencia la pulpa de açaí junto con el plátano congelado y un chorrito de leche de almendras. Tritura hasta obtener una textura densa similar al helado tradicional[1].]

[nota_al_pie: 1 | Si la mezcla resulta demasiado espesa, agrega leche de almendras cucharada a cucharada para evitar que quede líquida.]`,
  },
];
