/**
 * Web Component generator for JSON component notation.
 * Generates native custom elements with Shadow DOM encapsulation.
 */

import { SlotDefinition, WebComponentOptions } from './types.js';

/**
 * Generate property definitions from slots.
 */
function generateObservedAttributes(_slots?: Record<string, SlotDefinition>): string[] {
  const attrs = ['variant'];
  return attrs;
}

/**
 * Generate JS slot documentation for Web Component.
 */
function generateJsSlotDocs(slots?: Record<string, SlotDefinition>): string {
  if (!slots || Object.keys(slots).length === 0) {
    return '';
  }

  const lines: string[] = ['/**'];
  lines.push(' * Slots:');

  for (const [name, def] of Object.entries(slots)) {
    const optional = def.$optional ? ' (optional)' : ' (required)';
    const types = def.$allowedTypes.join(' | ');
    lines.push(` * @slot {${types}} ${name}${optional}`);
  }

  lines.push(' */');
  return lines.join('\n');
}

/**
 * Generate the Web Component JavaScript class.
 */
export function generateWebComponent(
  options: WebComponentOptions,
  cssOutput: string,
  _htmlOutput: string
): string {
  const { elementName, className, slots, variants, minify } = options;
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';
  const doubleIndent = minify ? '' : '    ';
  const tripleIndent = minify ? '' : '      ';

  // Clean element name (remove angle brackets if present)
  const cleanElementName = elementName.replace(/[<>]/g, '');

  // Generate observed attributes
  const observedAttrs = generateObservedAttributes(slots);
  const variantList = variants || [];

  // Build the class
  const classBody = [
    `class ${toPascalCase(className)} extends HTMLElement {`,
    `${indent}static get observedAttributes() {`,
    `${doubleIndent}return [${observedAttrs.map(a => `'${a}'`).join(', ')}];`,
    `${indent}}`,
    ``,
    `${indent}constructor() {`,
    `${doubleIndent}super();`,
    `${doubleIndent}this.attachShadow({ mode: 'open' });`,
    `${indent}}`,
    ``,
    `${indent}connectedCallback() {`,
    `${doubleIndent}this._render();`,
    `${indent}}`,
    ``,
    `${indent}attributeChangedCallback(name, oldValue, newValue) {`,
    `${doubleIndent}if (oldValue === newValue) return;`,
    `${doubleIndent}if (name === 'variant') {`,
    `${tripleIndent}this._updateVariant(oldValue, newValue);`,
    `${doubleIndent}}`,
    `${indent}}`,
    ``,
    `${indent}get variant() {`,
    `${doubleIndent}return this.getAttribute('variant') || '';`,
    `${indent}}`,
    ``,
    `${indent}set variant(value) {`,
    `${doubleIndent}if (value) {`,
    `${tripleIndent}this.setAttribute('variant', value);`,
    `${doubleIndent}} else {`,
    `${tripleIndent}this.removeAttribute('variant');`,
    `${doubleIndent}}`,
    `${indent}}`,
    ``,
    `${indent}_render() {`,
    `${doubleIndent}const variant = this.variant;`,
    `${doubleIndent}const variantClass = variant ? \`\${'${className}'}--\${variant}\` : '${className}';`,
    ``,
    `${doubleIndent}this.shadowRoot.innerHTML = \``,
    `${tripleIndent}<style>`,
    cssOutput.split('\n').map(line => `${tripleIndent}${line}`).join(newline),
    `${tripleIndent}</style>`,
    ``,
    `${tripleIndent}<\${this.tagName.toLowerCase()} class="\${variantClass}">`,
    ...generateSlotRenderCode(slots, tripleIndent),
    `${tripleIndent}</\${this.tagName.toLowerCase()}>`,
    `${doubleIndent}\`;`,
    `${indent}}`,
    ``,
    `${indent}_updateVariant(oldVariant, newVariant) {`,
    `${doubleIndent}const root = this.shadowRoot.querySelector('[class*="${className}"]');`,
    `${doubleIndent}if (!root) return;`,
    ``,
    `${doubleIndent}// Remove old variant class`,
    `${doubleIndent}if (oldVariant) {`,
    `${tripleIndent}root.classList.remove(\`\${'${className}'}--\${oldVariant}\`);`,
    `${doubleIndent}}`,
    ``,
    `${doubleIndent}// Add new variant class`,
    `${doubleIndent}if (newVariant) {`,
    `${tripleIndent}root.classList.add(\`\${'${className}'}--\${newVariant}\`);`,
    `${doubleIndent}}`,
    `${doubleIndent}root.classList.toggle('${className}', !newVariant);`,
    `${indent}}`,
    `}`,
  ];

  // Build the registration code
  const registerCode = [
    ``,
    `// Register the custom element`,
    `if (!customElements.get('${cleanElementName}')) {`,
    `${indent}customElements.define('${cleanElementName}', ${toPascalCase(className)});`,
    `}`,
  ];

  // Build slot docs
  const slotDocs = generateJsSlotDocs(slots);

  // Combine everything
  const allParts = [
    `/**`,
    ` * ${toPascalCase(className)} Web Component`,
    ` * Auto-generated from JSON component definition`,
    ` *`,
    ` * @element ${cleanElementName}`,
    ` * @attr {string} variant - Component variant (${variantList.join(', ') || 'none defined'})`,
    ` */`,
    slotDocs,
    ``,
    ...classBody,
    ...registerCode,
  ];

  return allParts.join(newline);
}

/**
 * Generate slot render code for the shadow DOM template.
 */
function generateSlotRenderCode(slots: Record<string, SlotDefinition> | undefined, indent: string): string[] {
  if (!slots || Object.keys(slots).length === 0) {
    return [`${indent}<slot></slot>`];
  }

  return Object.entries(slots).map(([name]) => `${indent}<slot name="${name}"></slot>`);
}

/**
 * Convert string to PascalCase.
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate TypeScript type declarations for the component.
 */
export function generateTypeDeclarations(
  options: WebComponentOptions
): string {
  const { elementName, className, variants } = options;
  const cleanElementName = elementName.replace(/[<>]/g, '');
  const variantTypes = variants?.length ? variants.map(v => `'${v}'`).join(' | ') : 'string';

  return `declare global {
  interface HTMLElementTagNameMap {
    '${cleanElementName}': ${toPascalCase(className)};
  }
}

interface ${toPascalCase(className)}Attributes {
  variant?: ${variantTypes};
}

declare class ${toPascalCase(className)} extends HTMLElement {
  static observedAttributes: string[];
  variant: ${variantTypes};
}
`;
}
