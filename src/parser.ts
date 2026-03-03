/**
 * Main parser orchestrator for JSON component notation.
 * Loads definitions, resolves imports, and coordinates generators.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ComponentDefinition,
  ComponentSchema,
  ParserOutput,
  ParserOptions,
} from './types.js';
import { TokenResolver } from './tokenResolver.js';
import { generateCss } from './cssGenerator.js';
import { generateHtml, generateUsageExample } from './htmlGenerator.js';
import { generateWebComponent, generateTypeDeclarations } from './webComponentGenerator.js';

/**
 * Check if an object is a valid component schema.
 */
function isComponentSchema(obj: unknown): obj is ComponentSchema {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$type' in obj &&
    (obj as ComponentSchema).$type === 'component'
  );
}

/**
 * Load a JSON file and parse it.
 */
function loadJson(filePath: string): Record<string, unknown> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Parse a JSON component definition and generate outputs.
 */
export function parse(
  input: string | ComponentDefinition,
  options: ParserOptions = {}
): ParserOutput {
  const { baseDir = process.cwd(), classPrefix = '', elementPrefix = 'cj', minify = false } = options;

  // Load input
  let definition: ComponentDefinition;
  let inputDir = baseDir;

  if (typeof input === 'string') {
    definition = loadJson(input) as ComponentDefinition;
    inputDir = path.dirname(path.resolve(baseDir, input));
  } else {
    definition = input;
  }

  // Find the component (first key that's not a $-property)
  let componentName = '';
  let componentSchema: ComponentSchema | undefined;

  for (const [key, value] of Object.entries(definition)) {
    if (key.startsWith('$')) continue;
    if (isComponentSchema(value)) {
      componentName = key;
      componentSchema = value;
      break;
    }
  }

  if (!componentName || !componentSchema) {
    throw new Error('No component definition found in input');
  }

  // Create token resolver and load imported tokens
  const resolver = new TokenResolver();

  // Load token imports
  if (definition.$import) {
    for (const importPath of definition.$import) {
      const resolvedPath = path.resolve(inputDir, importPath);
      if (fs.existsSync(resolvedPath)) {
        const tokens = loadJson(resolvedPath);
        resolver.loadTokens(tokens);
      } else {
        console.warn(`Warning: Could not resolve import: ${importPath}`);
      }
    }
  }

  // Extract component properties
  const { slots, base, states, variants } = componentSchema;
  const description = componentSchema.$description;
  const allowedElements = componentSchema.$allowedElements || ['div'];

  // Determine class name and element name
  const className = classPrefix ? `${classPrefix}-${componentName}` : componentName;
  const elementName = `${elementPrefix}-${componentName}`;
  const tagName = allowedElements[0] || 'div';

  // Generate CSS
  const cssOutput = generateCss(
    {
      className,
      baseStyles: base,
      states,
      variants,
      minify,
    },
    resolver
  );

  // Generate HTML template
  const htmlOutput = generateHtml({
    tagName,
    className,
    slots,
    minify,
  });

  // Generate Web Component
  const webComponentOutput = generateWebComponent(
    {
      elementName,
      className,
      slots,
      variants: variants ? Object.keys(variants) : [],
      minify,
    },
    cssOutput,
    htmlOutput
  );

  // Build metadata
  const meta = {
    description,
    allowedElements,
    slots: slots ? Object.keys(slots) : [],
    variants: variants ? Object.keys(variants) : [],
    states: states ? Object.keys(states) : [],
  };

  return {
    name: componentName,
    css: cssOutput,
    html: htmlOutput,
    webComponent: webComponentOutput,
    meta,
  };
}

/**
 * Parse and generate all output files.
 */
export function parseAndWrite(
  input: string,
  outputDir: string,
  options: ParserOptions = {}
): ParserOutput {
  const result = parse(input, options);

  // Ensure output directory exists
  const outDir = path.resolve(options.baseDir || process.cwd(), outputDir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write CSS file
  const cssFile = path.join(outDir, `${result.name}.css`);
  fs.writeFileSync(cssFile, result.css, 'utf-8');

  // Write HTML template file
  const htmlFile = path.join(outDir, `${result.name}.html`);
  fs.writeFileSync(htmlFile, result.html, 'utf-8');

  // Write Web Component file
  const wcFile = path.join(outDir, `${result.name}.js`);
  fs.writeFileSync(wcFile, result.webComponent, 'utf-8');

  // Write TypeScript declarations
  const dtsFile = path.join(outDir, `${result.name}.d.ts`);
  const typeDecls = generateTypeDeclarations({
    elementName: `cj-${result.name}`,
    className: result.name,
    slots: result.meta.slots.length > 0 
      ? Object.fromEntries(result.meta.slots.map(s => [s, { $allowedTypes: ['any'], $optional: true }]))
      : undefined,
    variants: result.meta.variants,
  });
  fs.writeFileSync(dtsFile, typeDecls, 'utf-8');

  return result;
}

/**
 * Generate a complete output package with all files.
 */
export function generatePackage(
  input: string,
  outputDir: string,
  options: ParserOptions = {}
): { files: string[]; output: ParserOutput } {
  const output = parseAndWrite(input, outputDir, options);

  const baseDir = path.resolve(options.baseDir || process.cwd(), outputDir);
  const files = [
    path.join(baseDir, `${output.name}.css`),
    path.join(baseDir, `${output.name}.html`),
    path.join(baseDir, `${output.name}.js`),
    path.join(baseDir, `${output.name}.d.ts`),
  ];

  // Generate usage example
  const exampleHtml = generateUsageExample(
    `cj-${output.name}`,
    Object.fromEntries(
      output.meta.slots.map(s => [s, { $allowedTypes: ['any'], $optional: true }])
    )
  );
  const exampleFile = path.join(baseDir, `${output.name}.example.html`);
  fs.writeFileSync(exampleFile, exampleHtml, 'utf-8');
  files.push(exampleFile);

  // Generate README
  const readme = generateReadme(output);
  const readmeFile = path.join(baseDir, `${output.name}.md`);
  fs.writeFileSync(readmeFile, readme, 'utf-8');
  files.push(readmeFile);

  return { files, output };
}

/**
 * Generate README documentation for the component.
 */
function generateReadme(output: ParserOutput): string {
  const lines: string[] = [
    `# ${output.name}`,
    '',
    output.meta.description || 'Auto-generated component',
    '',
    '## Usage',
    '',
    '```html',
    `<cj-${output.name}${output.meta.variants.length > 0 ? ' variant=""' : ''}>`,
    ...output.meta.slots.map(s => `  <span slot="${s}">...</span>`),
    `</cj-${output.name}>`,
    '```',
    '',
  ];

  if (output.meta.variants.length > 0) {
    lines.push('## Variants', '');
    lines.push(...output.meta.variants.map(v => `- \`${v}\``));
    lines.push('');
  }

  if (output.meta.states.length > 0) {
    lines.push('## States', '');
    lines.push(...output.meta.states.map(s => `- \`:${s}\``));
    lines.push('');
  }

  if (output.meta.slots.length > 0) {
    lines.push('## Slots', '');
    lines.push(...output.meta.slots.map(s => `- \`${s}\``));
    lines.push('');
  }

  return lines.join('\n');
}
