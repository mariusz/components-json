/**
 * Public API exports for components-json parser.
 */

// Types
export type {
  ComponentDefinition,
  ComponentSchema,
  SlotDefinition,
  StyleBlock,
  StyleValue,
  FlatStyleValue,
  TokenReference,
  ParserOutput,
  ParserOptions,
  StateDefinition,
  VariantDefinition,
  TokenDefinition,
} from './types.js';

export {
  isTokenReference,
  extractTokenPath,
  tokenToCssVar,
} from './types.js';

// Token Resolver
export { TokenResolver, createTokenResolver } from './tokenResolver.js';

// Generators
export { generateCss, generateTokenCss } from './cssGenerator.js';
export { generateHtml, generateSlotDocs, generateUsageExample } from './htmlGenerator.js';
export { generateWebComponent, generateTypeDeclarations } from './webComponentGenerator.js';

// Main Parser
export { parse, parseAndWrite, generatePackage } from './parser.js';
