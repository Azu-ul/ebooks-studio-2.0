import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  Bot, 
  Link as LinkIcon, 
  Tag, 
  Search, 
  Layers, 
  FileCode2,
  Sparkles,
  Wand2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface CheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTag: (tag: string) => void;
}

export const CheatsheetModal: React.FC<CheatsheetModalProps> = ({
  isOpen,
  onClose,
  onInsertTag,
}) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'chatbot_prompt'>('chatbot_prompt');
  const [promptSubTab, setPromptSubTab] = useState<'generate_full' | 'convert_manuscript'>('generate_full');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  if (!isOpen) return null;

  const handleCopy = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const TAGS_GUIDE = [
    // Estructura & Portada
    {
      key: 'portada_imagen',
      category: 'Estructura & Portada',
      name: 'Portada de Imagen Completa (A Sangre)',
      syntax: '[portada_imagen: nombre_archivo.jpg]',
      desc: 'Genera una primera página ocupada al 100% por una imagen de portada sin márgenes, adaptada y recortada al tamaño de hoja seleccionado (A4, A5, Letter o B5). Recibe únicamente el nombre del archivo de imagen.',
      example: '[portada_imagen: portada_completa.jpg]',
    },
    {
      key: 'portada',
      category: 'Estructura & Portada',
      name: 'Portada Tipográfica del Ebook',
      syntax: '[portada: Título del Libro | Subtítulo Opcional | Nombre del Autor | portada.jpg | 1ª Edición 2026]',
      desc: 'Genera una carátula editorial completa con tipografía de impacto, subtítulo, autor, carátula opcional y badge de edición personalizado.',
      example: '[portada: Título de tu Ebook | Subtítulo impactante para el lector | Nombre del Autor | portada_ebook.jpg | 1ª Edición Digital]',
    },
    {
      key: 'editorial',
      category: 'Estructura & Portada',
      name: 'Badge de Edición / Editorial',
      syntax: '[editorial: Texto de la edición o sello editorial]',
      desc: 'Modifica o establece el texto de la insignia superior de la portada (ej: "Edición Conmemorativa", "1ª Edición 2026").',
      example: '[editorial: Edición Limitada • 2026]',
    },
    {
      key: 'encabezado',
      category: 'Estructura & Portada',
      name: 'Encabezado Superior de Páginas',
      syntax: '[encabezado: Texto Izquierdo | Texto Derecho]',
      desc: 'Personaliza los títulos mostrados en el encabezado superior (running header) a partir de ese punto del libro.',
      example: '[encabezado: El Arte de Escribir | Capítulo 1: Fundamentos]',
    },
    {
      key: 'indice',
      category: 'Estructura & Portada',
      name: 'Índice General',
      syntax: '[indice: Tabla de Contenidos]',
      desc: 'Encabezado con diseño editorial que marca el inicio de la tabla de contenidos.',
      example: '[indice: Índice General de la Obra]',
    },
    {
      key: 'elemento_indice',
      category: 'Estructura & Portada',
      name: 'Elemento de Índice con Enlace Opcional',
      syntax: '[elemento_indice: Título del Capítulo o Sección | Número de Página | id_ancla]',
      desc: 'Línea de índice con título, línea de puntos guía (dot leaders), página y enlace interactivo al ancla del capítulo.',
      example: '[elemento_indice: Capítulo 1: Fundamentos | 4 | cap1]',
    },
    {
      key: 'salto_de_pagina',
      category: 'Estructura & Portada',
      name: 'Salto de Página Forzado',
      syntax: '[salto_de_pagina]',
      desc: 'Corta la página actual y obliga al texto siguiente a comenzar en la parte superior de una página nueva.',
      example: '[salto_de_pagina]',
    },
    {
      key: 'separador',
      category: 'Estructura & Portada',
      name: 'Separador Ornamental',
      syntax: '[separador]',
      desc: 'Inserta el ornamento seleccionado en el panel de diseño (rombos, estrellas, puntos finos o línea sutil).',
      example: '[separador]',
    },

    // Capítulos & Jerarquía
    {
      key: 'capitulo',
      category: 'Capítulos & Jerarquía',
      name: 'Capítulo con Ancla Automática',
      syntax: '[capitulo: Número | Título del Capítulo | id_ancla_opcional]',
      desc: 'Inicia un nuevo capítulo con salto de página, número ordinal y anclaje directo para referencias cruzadas.',
      example: '[capitulo: 1 | La Arquitectura del Pensamiento | cap1]',
    },
    {
      key: 'titulo',
      category: 'Capítulos & Jerarquía',
      name: 'Título de Sección (H1)',
      syntax: '[titulo: Nombre de la Sección | id_ancla]',
      desc: 'Encabezado principal para subdividir capítulos o temas destacados en el libro.',
      example: '[titulo: Las Tres Leyes de la Claridad | sec_leyes]',
    },
    {
      key: 'subtitulo',
      category: 'Capítulos & Jerarquía',
      name: 'Subtítulo Temático (H2)',
      syntax: '[subtitulo: Descripción breve de la sección]',
      desc: 'Encabezado secundario con tipografía en escala armónica.',
      example: '[subtitulo: Cómo aplicar la metodología en proyectos reales]',
    },

    // Párrafos & Estilos Avanzados
    {
      key: 'parrafo',
      category: 'Párrafos & Estilos',
      name: 'Párrafo Estándar',
      syntax: '[parrafo: Redacta aquí tu texto con **negrita**, *cursiva*, __subrayado__ y notas [1].]',
      desc: 'Párrafo base de lectura con sangría configurable e interlineado proporcional.',
      example: '[parrafo: La lectura fluida requiere un equilibrio óptimo entre el espaciado de línea y el ancho de columna.]',
    },
    {
      key: 'parrafo_dialogo',
      category: 'Párrafos & Estilos',
      name: 'Párrafo con Estilo de Diálogo Literario',
      syntax: '[parrafo: estilo=dialogo | —Texto con sangría de diálogo y espaciado compacto.]',
      desc: 'Aplica el preset de diálogo (sangría de 28px, espaciado entre réplicas de 4px).',
      example: '[parrafo: estilo=dialogo | —El tiempo es el único recurso no renovable —susurró el maestro.]',
    },
    {
      key: 'parrafo_epigrafe',
      category: 'Párrafos & Estilos',
      name: 'Párrafo con Estilo de Epígrafe',
      syntax: '[parrafo: estilo=epigrafe | "Cita breve al margen o inicio de capítulo." — Autor]',
      desc: 'Aplica tipografía en cursiva, borde lateral dorado y espaciado acotado.',
      example: '[parrafo: estilo=epigrafe | "La sencillez es la máxima sofisticación." — Leonardo da Vinci]',
    },
    {
      key: 'parrafo_academico',
      category: 'Párrafos & Estilos',
      name: 'Párrafo con Estilo Académico / Formal',
      syntax: '[parrafo: estilo=academico | Texto con interlineado 1.8 y justificado estricto.]',
      desc: 'Aplica sangría formal y espaciado generoso para tratados, manuales o libros técnicos.',
      example: '[parrafo: estilo=academico | Los resultados experimentales confirman la hipótesis planteada en el protocolo inicial.]',
    },

    // Imágenes & Leyendas
    {
      key: 'imagen',
      category: 'Imágenes & Leyendas',
      name: 'Imagen con Leyenda y Referencia Cruzada',
      syntax: '[imagen: nombre_archivo.jpg | Leyenda o Pie de Foto | Ancho | id_referencia]',
      desc: 'Inserta una imagen del gestor con pie de foto descriptivo y anclaje ID para enlazar desde cualquier parte del libro.',
      example: '[imagen: grafico_ventas.png | Figura 2.1: Proyección de ingresos editoriales 2026 | 90% | fig_ingresos]',
    },

    // Referencias Cruzadas & Anclas
    {
      key: 'ancla',
      category: 'Referencias Cruzadas',
      name: 'Punto de Anclaje (Marcador)',
      syntax: '[ancla: mi_seccion_id | Título opcional]',
      desc: 'Crea un punto de destino invisible o visible en el documento al que puedes enlazar mediante [ref:...].',
      example: '[ancla: seccion_metodologia | Metodología Detallada]',
    },
    {
      key: 'referencia',
      category: 'Referencias Cruzadas',
      name: 'Enlace de Referencia Cruzada',
      syntax: '[ref: id_ancla | Texto del enlace interactivo]',
      desc: 'Crea un enlace cliqueable en la vista previa que salta con scroll suave y redirecciona directamente al elemento de destino (figura, capítulo, nota, etc.).',
      example: 'Como se analiza detalladamente en [ref: fig_ingresos | la Figura 2.1], los autores independientes...',
    },

    // Citas, Destacados & Notas
    {
      key: 'cita',
      category: 'Citas & Destacados',
      name: 'Cita en Bloque / Testimonio',
      syntax: '[cita: Texto memorable de la cita aquí... | Autor o Fuente | id_ancla]',
      desc: 'Bloque con borde decorativo izquierdo, sangría y autor alineado. No incluyas comillas manuales ("") dentro del texto, la aplicación las añade automáticamente.',
      example: '[cita: Un libro bien maquetado se lee sin esfuerzo y se recuerda con placer. | Elena Márquez]',
    },
    {
      key: 'destacado',
      category: 'Citas & Destacados',
      name: 'Caja Destacada / Consejo Clave',
      syntax: '[destacado: Título del Recuadro | Contenido con consejos o advertencias | id_ancla]',
      desc: 'Recuadro con fondo sutil, icono y borde temático para resaltar conceptos indispensables.',
      example: '[destacado: Consejo de Oro | Revisa siempre los saltos de línea y márgenes antes de exportar a PDF.]',
    },
    {
      key: 'nota_al_pie',
      category: 'Citas & Destacados',
      name: 'Nota al Pie de Página',
      syntax: '[nota_al_pie: 1 | Descripción bibliográfica o nota aclaratoria.]',
      desc: 'Registra la nota al pie con numeración que se coloca al final de la página correspondiente.',
      example: '[nota_al_pie: 1 | Tomado de la Encuesta Nacional de Hábitos de Lectura, 2026.]',
    },
    {
      key: 'lista',
      category: 'Citas & Destacados',
      name: 'Lista de Viñetas Estilizada',
      syntax: '[lista: Elemento 1 | Elemento 2 con comas o detalles | Elemento 3]',
      desc: 'Convierte elementos separados por pleca "|" (o comas) en elegantes viñetas. Usar "|" permite que los ítems contengan comas sin dividirse erróneamente.',
      example: '[lista: Elegir una tipografía legible, preferentemente con remates | Definir márgenes simétricos | Incorporar imágenes de alta resolución]',
    },
  ];

  const CATEGORIES = ['Todas', 'Estructura & Portada', 'Capítulos & Jerarquía', 'Párrafos & Estilos', 'Imágenes & Leyendas', 'Referencias Cruzadas', 'Citas & Destacados'];

  const filteredTags = TAGS_GUIDE.filter((tag) => {
    const matchesCategory = selectedCategory === 'Todas' || tag.category === selectedCategory;
    const matchesQuery = searchQuery === '' || 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // PROMPT 1: Generación Completa de Ebook desde Cero (Redacción y Arsenal Editorial)
  const FULL_EBOOK_GENERATOR_PROMPT = `Actúa como Escritor Bestseller, Editor Jefe y Diseñador Editorial de Alta Gama. Tu misión es REDACTAR Y ESTRUCTURAR UN EBOOK COMPLETO, cautivador, profesional y de máxima calidad sobre la temática indicada, formateado al 100% con la sintaxis editorial nativa de la aplicación "Ebook Studio".

🎯 OBJETIVO PRINCIPAL:
No te limites a redactar texto plano. Debes explotar al máximo TODO el arsenal de recursos visuales, tipográficos, interactivos y estructurales de Ebook Studio (portadas, índices enlazados, capítulos, subtítulos, epígrafes, diálogos, citas memorables, cajas de tips/destacados, listas enriquecidas con plecas |, imágenes ilustrativas con leyenda, referencias cruzadas interactivas [ref:...], notas al pie correlativas [nota_al_pie:...] y separadores ornamentales).

═══════════════════════════════════════════════════════════
ARSENAL COMPLETO DE ETIQUETAS DE EBOOK STUDIO
═══════════════════════════════════════════════════════════

1. PORTADA Y EDICIÓN:
   • Portada Tipográfica Completa:
     [portada: Título Principal del Ebook | Subtítulo Impactante y Promesa de Valor | Nombre del Autor | portada_principal.jpg | 1ª Edición Oficial 2026]
   • O si prefieres Portada de Imagen Completa a Sangre:
     [portada_imagen: portada_completa.jpg]
   • Badge de Edición independiente:
     [editorial: Edición Ilustrada • 2026]

2. CABECERA DINÁMICA DE PÁGINA (RUNNING HEADER):
   • Define en cada capítulo o sección:
     [encabezado: Título de la Obra | Capítulo X: Título del Capítulo]

3. ÍNDICE INTERACTIVO DE CONTENIDOS:
   • Inserta la tabla de contenidos con anclas de enlace:
     [indice: Índice General de la Obra]
     [elemento_indice: Capítulo 1: Fundamentos Esenciales | 3 | cap1]
     [elemento_indice: Capítulo 2: Estrategias Avanzadas | 7 | cap2]
     [elemento_indice: Capítulo 3: Aplicación Práctica y Casos | 12 | cap3]
     [elemento_indice: Conclusiones y Plan de Acción | 18 | conclusiones]

4. CAPÍTULOS, SECCIONES Y JERARQUÍA:
   • Inicio de capítulo (genera salto de página y anclaje):
     [capitulo: 1 | Título del Capítulo | cap1]
   • Títulos principales de sección (H1):
     [titulo: Nombre de la Sección | sec_nombre]
   • Subtítulos temáticos (H2):
     [subtitulo: Subtítulo Descriptivo y Atractivo]

5. PÁRRAFOS Y ESTILOS NARRATIVOS DIVERSOS:
   • Párrafo estándar con formato en línea:
     [parrafo: Redacta con profundidad. Usa **negrita** para conceptos clave, *cursiva* para términos técnicos o énfasis, __subrayado__ y llamadas a notas numéricas como [1] o [2].]
   • Epígrafe o cita de apertura de capítulo:
     [parrafo: estilo=epigrafe | "Frase célebre o cita inspiradora que sintetiza el capítulo." — Autor Famoso]
   • Diálogo o conversación narrativa:
     [parrafo: estilo=dialogo | —Cada decisión estratégica define el rumbo de la organización —afirmó el mentor.]
   • Párrafo de análisis académico o formal:
     [parrafo: estilo=academico | Los datos empíricos recopilados demuestran una correlación directa entre la claridad visual y la retención del lector.]

6. CITAS EN BLOQUE Y TESTIMONIOS (REGLA CRÍTICA):
   • Inserta citas memorables y testimonios para dar ritmo visual:
     [cita: El conocimiento sólo se convierte en poder cuando se estructura y se lleva a la práctica cotidiana. | Peter Drucker | cita_drucker]
   ⚠️ REGLA ESTRICTA DE CITAS: NO coloques comillas ("...") dentro del texto de la cita [cita:...]. La aplicación añade automáticamente las comillas tipográficas estilizadas (“...”). Si incluyes comillas manuales, se duplicarán erróneamente.

7. CAJAS DESTACADAS (TIPS IMPORTANTES, ADVERTENCIAS Y RESÚMENES):
   • Añade recuadros destacados en cada capítulo para sintetizar lecciones prácticas o advertencias clave:
     [destacado: Consejo de Oro / Tip Práctico | Aplica esta técnica durante al menos 14 días consecutivos antes de evaluar los primeros resultados medibles. | tip_habito]
     [destacado: ⚠️ Error Frecuente a Evitar | No intentes automatizar un proceso que aún no has validado manualmente.]

8. LISTAS DE VIÑETAS ESTILIZADAS (REGLA CRÍTICA DE SEPARACIÓN):
   • Para pasos a seguir, características, beneficios o checklists:
     [lista: 1. Diagnóstico Inicial: evaluar el estado actual de tu proyecto | 2. Diseño del Plan de Acción con metas trimestrales | 3. Ejecución iterativa con revisiones semanales | 4. Optimización continua y escalado]
   ⚠️ REGLA ESTRICTA DE LISTAS: Separa SIEMPRE los elementos con pleca vertical "|" (nunca con comas) para que cada ítem pueda contener comas internas o explicaciones sin romperse.

9. IMÁGENES ESTRATÉGICAS ILUSTRATIVAS:
   • Intercala imágenes, diagramas, esquemas o fotografías temáticas a lo largo del libro:
     [imagen: portada_principal.jpg | Portada oficial de la obra | 90% | img_portada]
     [imagen: infografia_proceso.jpg | Figura 1.1: Diagrama del ciclo integral de productividad | 85% | fig_ciclo]
     [imagen: matriz_decision.png | Figura 2.1: Matriz de priorización de cuatro cuadrantes | 80% | fig_matriz]

10. REFERENCIAS CRUZADAS Y NAVEGACIÓN INTERACTIVA:
    • Conecta el texto con figuras, capítulos, tips o tablas:
      [parrafo: Como se ilustra detalladamente en [ref: fig_ciclo | la Figura 1.1] y se complementa en el [ref: tip_habito | Consejo Práctico], la constancia es el factor determinante.]

11. NOTAS AL PIE Y ACLARACIONES BIBLIOGRÁFICAS:
    • Cuando menciones un dato o estudio, coloca [1] en el texto y al pie:
      [nota_al_pie: 1 | Estudio longitudinal sobre hábitos de lectura y retención cognitiva, Universidad de Oxford, 2025.]

12. ELEMENTOS DE RITMO Y PAUSA:
    • Inserta separadores ornamentales para dar respiración al texto:
      [separador]
    • Saltos de página entre secciones mayores si es necesario:
      [salto_de_pagina]

═══════════════════════════════════════════════════════════
REGLAS OBLIGATORIAS DE GENERACIÓN Y ENTREGA
═══════════════════════════════════════════════════════════

1. GENERACIÓN COMPLETA Y EXTENSA:
   - Redacta el contenido de forma profunda, persuasiva, fluida y con valor real para el lector (no un simple resumen esquemático de 3 líneas).
   - Desarrolla introducción, capítulos temáticos con subtítulos y conclusiones con plan de acción.
   - Aplica todos los recursos: alterna párrafos normales con epígrafes, listas con plecas, citas, recuadros de tips, imágenes y notas al pie.

2. FORMATO DE ENTREGA:
   - Entrega TODO el contenido del libro dentro de un ÚNICO bloque de código cercado con tres acentos graves (\`\`\`text ... \`\`\`) para poder copiarlo directamente con un solo clic.

3. 🖼️ SECCIÓN OBLIGATORIA AL FINALIZAR EL CONTENIDO (LISTA MAESTRA DE IMÁGENES REQUERIDAS):
   Inmediatamente después de cerrar el bloque de código del ebook, DEBES incluir una sección final obligatoria titulada "📁 ARCHIVOS DE IMÁGENES REQUERIDOS PARA ESTE EBOOK".
   En esta sección debes listar con total precisión:
   • Nombre Exacto del Archivo (tal cual se escribió en las etiquetas [imagen: ...] o [portada:...], ej: portada_principal.jpg, infografia_proceso.jpg, matriz_decision.png).
   • Ubicación en el Ebook (Capítulo o Sección donde aparece).
   • Descripción Visual de la Imagen (qué debe verse en la foto o ilustración).
   • Prompt Sugerido para Generación con IA (Midjourney / DALL-E / Gemini Imagen) para que el usuario pueda crearla rápidamente.

   Indica claramente al usuario la siguiente instrucción:
   "ℹ️ INSTRUCCIÓN IMPORTANTE: Para que las imágenes aparezcan de inmediato y sean válidas en tu ebook, ve al 'Gestor de Imágenes' en Ebook Studio, sube tus imágenes y asegúrate de que tengan exactamente estos mismos nombres de archivo."

═══════════════════════════════════════════════════════════
DATOS DEL EBOOK A GENERAR:
• Tema o Título del Ebook: [Escribe aquí el tema, nicho o título deseado]
• Autor / Marca: [Nombre del autor o empresa]
• Público Objetivo: [A quién va dirigido: principiantes, profesionales, etc.]
• Tono y Enfoque: [Ej: profesional, motivador, académico, narrativo, directo]
• Número de Capítulos deseados: [Ej: 3 a 5 capítulos]`;

  // PROMPT 2: Conversión y Estructuración de Manuscrito Existente
  const MANUSCRIPT_CONVERTER_PROMPT = `Actúa como Maquetador Editorial y Editor Profesional de Ebooks de Alta Gama. Tu tarea es estructurar, maquetar y etiquetar el texto sin formato que te proporcionará el usuario para la aplicación editorial "Ebook Studio", enriqueciéndolo con todos los recursos visuales disponibles.

═══════════════════════════════════════════════════════════
SISTEMA DE ETIQUETAS EDITORIALES DE EBOOK STUDIO
═══════════════════════════════════════════════════════════

1. PORTADA Y EDICIÓN:
   • Portada de imagen completa a sangre: [portada_imagen: portada_completa.jpg]
   • Portada tipográfica completa: [portada: Título de la Obra | Subtítulo Opcional | Nombre del Autor | archivo_imagen.jpg | Badge de Edición]
   • Badge de edición independiente: [editorial: 1ª Edición Oficial • 2026]

2. CABECERA SUPERIOR (RUNNING HEADER):
   • [encabezado: Texto Izquierdo (Título de la Obra) | Texto Derecho (Capítulo / Autor)]

3. ESTRUCTURA Y NAVEGACIÓN:
   • Salto de página obligatorio: [salto_de_pagina]
   • Índice de contenidos:
     [indice: Tabla de Contenidos]
     [elemento_indice: Capítulo 1: Título del Capítulo | 3 | cap1]
     [elemento_indice: Capítulo 2: Título del Capítulo | 6 | cap2]

4. CAPÍTULOS Y TÍTULOS:
   • Capítulo: [capitulo: 1 | Título del Capítulo | cap1]
   • Título de sección (H1): [titulo: Título de Sección | ancla_seccion]
   • Subtítulo (H2): [subtitulo: Subtítulo Descriptivo]

5. PÁRRAFOS Y ESTILOS AVANZADOS:
   • Párrafo estándar: [parrafo: Tu texto aquí con formato **negrita**, *cursiva* o __subrayado__.]
   • Diálogo literario: [parrafo: estilo=dialogo | —Texto con guión largo y sangría especial.]
   • Epígrafe o cita de apertura: [parrafo: estilo=epigrafe | Frase memorable de apertura. — Autor]
   • Párrafo académico / formal: [parrafo: estilo=academico | Texto de análisis formal...]

6. LISTAS Y VIÑETAS (REGLA CRÍTICA DE SEPARACIÓN):
   • Utiliza SIEMPRE la pleca vertical "|" como separador de elementos en listas:
     [lista: Primer elemento con fechas o detalles | Segundo elemento, que puede tener comas internas sin romperse | Tercer elemento]
   (⚠️ NUNCA separes ítems con comas si los elementos contienen texto explicativo o cláusulas con comas).

7. IMÁGENES Y LEYENDAS:
   • [imagen: nombre_archivo.jpg | Figura 1.1: Leyenda descriptiva del gráfico | 90% | fig1]

8. REFERENCIAS CRUZADAS Y ANCLAS:
   • Marcador de anclaje: [ancla: id_destino | Título Opcional]
   • Enlace interactivo en el texto: [ref: id_destino | Texto del enlace] (Ej: "Como vimos en [ref: fig1 | la Figura 1.1]...")

9. CITAS, DESTACADOS Y NOTAS:
   • Cita en bloque: [cita: Texto de la cita sin comillas | Autor o Fuente | ancla]
     (⚠️ REGLA CRÍTICA PARA CITAS: NO coloques comillas ("...") dentro del texto de la cita [cita:...]. La aplicación añade automáticamente las comillas tipográficas estilizadas (“...”)).
   • Recuadro destacado: [destacado: Título del Destacado | Mensaje importante o consejo práctico | ancla]
   • Nota al pie: En el párrafo pon el número [1] y abajo coloca: [nota_al_pie: 1 | Explicación bibliográfica.]
   • Separador ornamental: [separador]

═══════════════════════════════════════════════════════════
REGLAS OBLIGATORIAS DE SALIDA Y COMPATIBILIDAD
═══════════════════════════════════════════════════════════

1. FORMATO DE ENTREGA:
   - Devuelve TODO el resultado dentro de un ÚNICO bloque de código cercado con tres acentos graves (\`\`\`text ... \`\`\`) para poder copiarlo con un clic.

2. FIDELIDAD DEL CONTENIDO:
   - No resumas, inventes ni mutiles el manuscrito original, estructúralo con riqueza editorial (portada, índice, encabezados, subtítulos, cajas de destacados y notas).
   - Corrige errores ortotipográficos (usa comillas tipográficas y guiones largos — para diálogos).

3. 🖼️ LISTA MAESTRA DE IMÁGENES REQUERIDAS (AL TERMINAR EL BLOQUE DE TEXTO):
   Al final de tu respuesta (fuera del bloque de código), incluye una tabla con:
   • Nombre exacto de cada archivo de imagen sugerido/utilizado.
   • Ubicación en el texto.
   • Descripción visual y prompt recomendado para generarla.
   • Instrucción clara: "Sube estas imágenes al Gestor de Imágenes de Ebook Studio con estos nombres exactos para que aparezcan automáticamente."

═══════════════════════════════════════════════════════════
TEXTO DEL MANUSCRITO A CONVERTIR:
[Pega aquí el texto de tu manuscrito]`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] border border-[#D1CEC8] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Tabs */}
        <div className="px-6 py-4 border-b border-[#D1CEC8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FAF9F7] text-[#B8860B] border border-[#D1CEC8]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1A1A1A]">Guía Editorial & Prompts para IA</h2>
              <p className="text-xs text-[#777]">
                Glosario de sintaxis nativa y prompts maestros para generar o maquetar ebooks con ChatGPT, Claude o Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab navigation */}
            <div className="flex bg-[#FAF9F7] p-0.5 rounded-lg border border-[#D1CEC8] text-xs">
              <button
                onClick={() => setActiveTab('chatbot_prompt')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'chatbot_prompt'
                    ? 'bg-white text-[#1A1A1A] shadow-xs font-semibold text-[#B8860B]'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Prompts para IA</span>
              </button>
              <button
                onClick={() => setActiveTab('glossary')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'glossary'
                    ? 'bg-white text-[#1A1A1A] shadow-xs font-semibold'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Glosario de Etiquetas ({TAGS_GUIDE.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#777] hover:text-[#1A1A1A] hover:bg-[#E5E2DE]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Prompts para Chatbot IA */}
        {activeTab === 'chatbot_prompt' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Sub-tab Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-[#F0EDE6] rounded-xl border border-[#D1CEC8]">
              <div className="flex gap-1.5 flex-1">
                <button
                  onClick={() => setPromptSubTab('generate_full')}
                  className={`flex-1 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    promptSubTab === 'generate_full'
                      ? 'bg-white text-[#1A1A1A] shadow-xs border border-[#D1CEC8]'
                      : 'text-[#555] hover:text-[#1A1A1A] hover:bg-white/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#B8860B]" />
                  <span>1. Redactar Ebook Completo desde Cero (Recomendado)</span>
                </button>
                <button
                  onClick={() => setPromptSubTab('convert_manuscript')}
                  className={`flex-1 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    promptSubTab === 'convert_manuscript'
                      ? 'bg-white text-[#1A1A1A] shadow-xs border border-[#D1CEC8]'
                      : 'text-[#555] hover:text-[#1A1A1A] hover:bg-white/50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#666]" />
                  <span>2. Maquetar Manuscrito / Texto Existente</span>
                </button>
              </div>
            </div>

            {/* Prompt Description Header */}
            <div className="p-4 bg-gradient-to-r from-[#FAF9F7] to-[#F5F2EB] border border-[#D1CEC8] rounded-xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {promptSubTab === 'generate_full' ? (
                    <>
                      <Wand2 className="w-4 h-4 text-[#B8860B]" />
                      <h3 className="text-xs font-serif font-bold text-[#1A1A1A]">
                        Prompt Maestro para Redacción Integral de Ebooks con IA
                      </h3>
                    </>
                  ) : (
                    <>
                      <FileCode2 className="w-4 h-4 text-[#B8860B]" />
                      <h3 className="text-xs font-serif font-bold text-[#1A1A1A]">
                        Prompt Maestro para Estructurar y Etiquetar Manuscritos
                      </h3>
                    </>
                  )}
                </div>
                <p className="text-xs text-[#555] leading-relaxed">
                  {promptSubTab === 'generate_full'
                    ? 'Instruye a ChatGPT, Claude o Gemini para que redacte un ebook rico en contenido, aprovechando al máximo imágenes, citas, cajas de tips, referencias cruzadas, listas y notas al pie. Al finalizar, la IA indicará con total exactitud los nombres que deben tener las imágenes para que aparezcan en tu libro.'
                    : 'Pega este prompt junto a tu texto existente para que la IA lo organice en capítulos, portadas, índices interactivos, diálogos y cajas destacadas, detallando además los nombres requeridos para las imágenes sugeridas.'}
                </p>
              </div>

              <button
                onClick={() => handleCopy(
                  promptSubTab === 'generate_full' ? FULL_EBOOK_GENERATOR_PROMPT : MANUSCRIPT_CONVERTER_PROMPT,
                  promptSubTab === 'generate_full' ? 'full_prompt' : 'convert_prompt'
                )}
                className="px-4 py-2 bg-[#B8860B] hover:bg-[#8D6505] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === (promptSubTab === 'generate_full' ? 'full_prompt' : 'convert_prompt') ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Prompt Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Prompt Maestro</span>
                  </>
                )}
              </button>
            </div>

            {/* Key highlights banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-white border border-[#D1CEC8] rounded-lg flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A1A1A] block">100% de Recursos</span>
                  <span className="text-[#666]">Portadas, epígrafes, citas, tips, viñetas y notas.</span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-[#D1CEC8] rounded-lg flex items-start gap-2">
                <ImageIcon className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A1A1A] block">Nombres de Imágenes</span>
                  <span className="text-[#666]">Lista al final con nombres exactos para que sean válidas.</span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-[#D1CEC8] rounded-lg flex items-start gap-2">
                <LinkIcon className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A1A1A] block">Referencias Cruzadas</span>
                  <span className="text-[#666]">Conecta figuras y secciones con enlaces interactivos [ref:...].</span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-[#D1CEC8] rounded-lg flex items-start gap-2">
                <Layers className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A1A1A] block">Sin Errores de Sintaxis</span>
                  <span className="text-[#666]">Respeta plecas | en listas y omite comillas en citas.</span>
                </div>
              </div>
            </div>

            {/* Step-by-step guidance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-[#D1CEC8] rounded-lg space-y-1">
                <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white font-bold flex items-center justify-center text-[10px]">1</div>
                <h4 className="font-semibold text-[#1A1A1A]">Copia y Personaliza</h4>
                <p className="text-[#666] text-[11px]">Copia el prompt y completa los datos de tu libro (tema, autor, público y capítulos) al final del texto.</p>
              </div>

              <div className="p-3 bg-white border border-[#D1CEC8] rounded-lg space-y-1">
                <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white font-bold flex items-center justify-center text-[10px]">2</div>
                <h4 className="font-semibold text-[#1A1A1A]">Pega en tu Chatbot IA</h4>
                <p className="text-[#666] text-[11px]">Pégalo en ChatGPT, Claude o Gemini. La IA redactará el libro entero y te dará la lista de imágenes.</p>
              </div>

              <div className="p-3 bg-white border border-[#D1CEC8] rounded-lg space-y-1">
                <div className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white font-bold flex items-center justify-center text-[10px]">3</div>
                <h4 className="font-semibold text-[#1A1A1A]">Pega y Sube Imágenes</h4>
                <p className="text-[#666] text-[11px]">Pega el texto aquí en el editor y sube tus imágenes con los nombres indicados en el Gestor de Imágenes.</p>
              </div>
            </div>

            {/* Prompt Preview Block */}
            <div className="bg-white border border-[#D1CEC8] rounded-lg overflow-hidden shadow-xs">
              <div className="px-4 py-2 bg-[#FAF9F7] border-b border-[#D1CEC8] flex items-center justify-between text-xs text-[#777]">
                <span className="font-mono font-semibold text-[#1A1A1A]">
                  {promptSubTab === 'generate_full' 
                    ? 'prompt_generacion_ebook_integral_con_recursos.txt'
                    : 'prompt_maquetacion_manuscrito_editorial.txt'}
                </span>
                <button
                  onClick={() => handleCopy(
                    promptSubTab === 'generate_full' ? FULL_EBOOK_GENERATOR_PROMPT : MANUSCRIPT_CONVERTER_PROMPT,
                    promptSubTab === 'generate_full' ? 'full_prompt_sm' : 'convert_prompt_sm'
                  )}
                  className="text-xs text-[#B8860B] hover:underline font-semibold flex items-center gap-1"
                >
                  {copiedKey === (promptSubTab === 'generate_full' ? 'full_prompt_sm' : 'convert_prompt_sm') ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#2C2C2C] bg-white overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 select-all">
                {promptSubTab === 'generate_full' ? FULL_EBOOK_GENERATOR_PROMPT : MANUSCRIPT_CONVERTER_PROMPT}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Glosario de Etiquetas */}
        {activeTab === 'glossary' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar etiquetas (ej: imagen, dialogo, ref, capitulo)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D1CEC8] rounded-lg focus:outline-hidden focus:border-[#B8860B] transition-colors"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors text-[11px] ${
                      selectedCategory === cat
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'bg-white text-[#555] border border-[#D1CEC8] hover:bg-[#FAF9F7]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick tips callout */}
            <div className="p-3.5 bg-white border border-[#D1CEC8] rounded-lg shadow-xs flex items-start gap-3 text-xs text-[#2C2C2C]">
              <Lightbulb className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-[#1A1A1A]">Consejo Editorial & Formato en Línea:</strong>
                <p className="text-[#555]">
                  Puedes enriquecer cualquier texto usando <code className="font-mono text-[#1A1A1A] bg-[#FAF9F7] px-1 py-0.5 rounded border border-[#D1CEC8]">**negrita**</code>, <code className="font-mono text-[#1A1A1A] bg-[#FAF9F7] px-1 py-0.5 rounded border border-[#D1CEC8]">*cursiva*</code>, <code className="font-mono text-[#1A1A1A] bg-[#FAF9F7] px-1 py-0.5 rounded border border-[#D1CEC8]">__subrayado__</code>, llamadas de nota <code className="font-mono text-[#B8860B] bg-[#FAF9F7] px-1 py-0.5 rounded border border-[#D1CEC8]">[1]</code> y enlaces cruzados <code className="font-mono text-[#B8860B] bg-[#FAF9F7] px-1 py-0.5 rounded border border-[#D1CEC8]">[ref: ancla_id | Texto]</code>.
                </p>
              </div>
            </div>

            {/* Tags Grid / List */}
            <div className="space-y-3">
              {filteredTags.map((tag) => (
                <div
                  key={tag.key}
                  className="p-4 bg-white rounded-lg border border-[#D1CEC8] hover:border-[#999] transition-all shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-bold text-[#1A1A1A]">{tag.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF9F7] border border-[#D1CEC8] text-[#777]">
                        {tag.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onInsertTag(tag.example || tag.syntax);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#1A1A1A] hover:bg-[#333] text-white rounded transition-colors"
                      >
                        Insertar
                      </button>
                      <button
                        onClick={() => handleCopy(tag.syntax, tag.key)}
                        className="px-2.5 py-1 text-[11px] bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#2C2C2C] border border-[#D1CEC8] rounded transition-colors flex items-center gap-1"
                        title="Copiar sintaxis"
                      >
                        {copiedKey === tag.key ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F7] p-2.5 rounded font-mono text-xs text-[#1A1A1A] border border-[#D1CEC8] break-all select-all font-semibold">
                    {tag.syntax}
                  </div>

                  <p className="text-[11px] text-[#666] leading-relaxed">{tag.desc}</p>

                  {tag.example && (
                    <div className="pt-2 border-t border-[#F0ECE6] flex items-baseline gap-2 text-[11px]">
                      <span className="text-[10px] font-bold uppercase text-[#B8860B] shrink-0">Ejemplo:</span>
                      <code className="font-mono text-[#555] break-all">{tag.example}</code>
                    </div>
                  )}
                </div>
              ))}

              {filteredTags.length === 0 && (
                <div className="p-8 text-center bg-white rounded-lg border border-[#D1CEC8] text-[#777] text-xs">
                  No se encontraron etiquetas que coincidan con "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#D1CEC8] bg-white flex justify-between items-center text-xs">
          <span className="text-[#777] text-[11px]">
            Ebook Studio • Sistema de Maquetación Editorial
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#FAF9F7] hover:bg-[#E5E2DE] text-[#1A1A1A] border border-[#D1CEC8] font-semibold rounded transition-colors"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
};

