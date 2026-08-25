/**
 * Utility to calculate exact pixel coordinates (top, left) of any character index
 * inside a <textarea>, perfectly accounting for word-wrapping, font metrics, line-heights,
 * and padding.
 */

// Properties to copy from textarea to mirror
const propertiesToCopy = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
] as const;

let mirrorDiv: HTMLDivElement | null = null;

export function getTextareaCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number; lineHeight: number } {
  if (!mirrorDiv) {
    mirrorDiv = document.createElement('div');
    mirrorDiv.id = 'textarea-caret-position-mirror-div';
    document.body.appendChild(mirrorDiv);
  }

  const style = mirrorDiv.style;
  const computed = window.getComputedStyle(element);

  // Position mirror off-screen
  style.whiteSpace = 'pre-wrap';
  style.wordBreak = 'break-word';
  style.overflowWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '-9999px';
  style.left = '-9999px';
  style.pointerEvents = 'none';

  // Copy geometry and typography styles
  propertiesToCopy.forEach((prop) => {
    (style as unknown as Record<string, string>)[prop] = (computed as unknown as Record<string, string>)[prop];
  });

  // Match the exact client width of textarea (excludes scrollbar if present)
  style.width = `${element.clientWidth}px`;

  // Text before target position
  const textContent = element.value.substring(0, position);
  mirrorDiv.textContent = textContent;

  // Insert a marker span at target position
  const span = document.createElement('span');
  span.textContent = element.value.substring(position, position + 1) || '.';
  mirrorDiv.appendChild(span);

  const top = span.offsetTop + parseInt(computed.borderTopWidth || '0', 10);
  const left = span.offsetLeft + parseInt(computed.borderLeftWidth || '0', 10);
  const lineHeight = parseInt(computed.lineHeight || '21', 10) || 21;

  return { top, left, lineHeight };
}
