/**
 * HTML generator for JSON component notation.
 * Generates HTML templates from slot definitions.
 */

import { SlotDefinition, HtmlGeneratorOptions } from './types.js';

/**
 * Generate slot HTML element.
 */
function generateSlot(name: string, _optional: boolean): string {
  // Standard slots for Web Components
  return `<slot name="${name}"></slot>`;
}

/**
 * Generate HTML template for a component.
 */
export function generateHtml(options: HtmlGeneratorOptions): string {
  const { tagName, className, slots, minify } = options;
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';

  const slotElements: string[] = [];

  if (slots) {
    for (const [slotName, slotDef] of Object.entries(slots)) {
      slotElements.push(`${indent}${generateSlot(slotName, slotDef.$optional ?? false)}`);
    }
  }

  // If no slots defined, create a default content slot
  if (slotElements.length === 0) {
    slotElements.push(`${indent}<slot></slot>`);
  }

  const attributes = [`class="${className}"`];
  const openingTag = `<${tagName} ${attributes.join(' ')}>`;
  const closingTag = `</${tagName}>`;

  const innerContent = slotElements.join(newline);
  const slotContent = slotElements.length > 0 ? `${newline}${innerContent}${newline}` : '';

  return `${openingTag}${slotContent}${closingTag}`;
}

/**
 * Generate a comment block describing slot usage.
 */
export function generateSlotDocs(slots?: Record<string, SlotDefinition>): string {
  if (!slots || Object.keys(slots).length === 0) {
    return '<!-- No slots defined -->';
  }

  const lines: string[] = ['<!-- Slot usage:'];

  for (const [name, def] of Object.entries(slots)) {
    const optional = def.$optional ? ' (optional)' : ' (required)';
    const types = def.$allowedTypes.join(' | ');
    lines.push(`  - ${name}${optional}: ${types}`);
  }

  lines.push('-->');
  return lines.join('\n');
}

/**
 * Generate example HTML showing how to use the component.
 */
export function generateUsageExample(
  tagName: string,
  slots?: Record<string, SlotDefinition>
): string {
  if (!slots || Object.keys(slots).length === 0) {
    return `<${tagName}>Content here</${tagName}>`;
  }

  const children: string[] = [];

  for (const [name, def] of Object.entries(slots)) {
    // Generate placeholder content based on allowed types
    const types = def.$allowedTypes;
    let placeholder = '...';

    if (types.includes('text')) {
      placeholder = name === 'label' ? 'Button' : 'Text';
    } else if (types.includes('image')) {
      placeholder = '<img src="..." alt="..." />';
    } else if (types.some(t => t.includes('icon'))) {
      placeholder = '<svg>...</svg>';
    }

    children.push(`  <span slot="${name}">${placeholder}</span>`);
  }

  return `<${tagName}>
${children.join('\n')}
</${tagName}>`;
}
