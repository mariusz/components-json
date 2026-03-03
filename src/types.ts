/**
 * Core type definitions for the JSON component notation parser.
 */

/** Token reference pattern: {namespace.path.to.value} */
export type TokenReference = string;

/** Check if a string is a token reference */
export function isTokenReference(value: unknown): value is TokenReference {
  return typeof value === 'string' && /^\{.+\}$/.test(value);
}

/** Extract token path from reference {path.to.token} → path.to.token */
export function extractTokenPath(ref: TokenReference): string {
  return ref.slice(1, -1);
}

/** Convert token path to CSS custom property: path.to.token → --path-to-token */
export function tokenToCssVar(ref: TokenReference): string {
  const path = extractTokenPath(ref);
  return `var(--${path.replace(/\./g, '-')})`;
}

/** Allowed types for slots - can be primitives or component references */
export type AllowedType = 'text' | 'image' | string;

/** Slot definition within a component */
export interface SlotDefinition {
  $allowedTypes: AllowedType[];
  $optional?: boolean;
}

/** Font properties - nested structure in JSON */
export interface FontProperties {
  family?: TokenReference | string;
  size?: TokenReference | string;
  weight?: TokenReference | string;
  lineHeight?: TokenReference | string;
  letterSpacing?: TokenReference | string;
}

/** Style value can be a token reference, string, or number */
export type StyleValue = TokenReference | string | number | FontProperties | undefined;

/** Flat style properties (after nesting resolution) */
export type FlatStyleValue = string | number;

/** Style block definition */
export type StyleBlock = {
  [key: string]: StyleValue | StyleBlock;
};

/** Component state definition (hover, active, focus, disabled, etc.) */
export type StateDefinition = StyleBlock;

/** Component variant definition (sm, lg, primary, secondary, etc.) */
export type VariantDefinition = StyleBlock;

/** CSS axis property mappings (expand to left/right or top/bottom) */
export const CSS_AXIS_PROPS: Record<string, [string, string]> = {
  paddingX: ['padding-left', 'padding-right'],
  paddingY: ['padding-top', 'padding-bottom'],
  marginX: ['margin-left', 'margin-right'],
  marginY: ['margin-top', 'margin-bottom'],
};

/** CSS property mappings for nested objects */
export const CSS_NESTED_PROPS: Record<string, string> = {
  font: 'font',
  border: 'border',
  background: 'background',
  shadow: 'box-shadow',
  text: 'text',
};

/** Full component definition from JSON */
export interface ComponentDefinition {
  $schema?: string;
  $import?: string[];

  [componentName: string]: ComponentSchema | string | string[] | undefined;
}

/** Schema for a single component */
export interface ComponentSchema {
  $type: 'component';
  $description?: string;
  $allowedElements?: string[];

  slots?: Record<string, SlotDefinition>;

  base: StyleBlock;
  states?: Record<string, StateDefinition>;
  variants?: Record<string, VariantDefinition>;
}

/** Token file definition */
export interface TokenDefinition {
  $schema?: string;

  [tokenGroup: string]: TokenGroup | string | undefined;
}

/** Token group with nested values */
export interface TokenGroup {
  [key: string]: string | number | TokenGroup;
}

/** Parsed output structure */
export interface ParserOutput {
  /** Component name */
  name: string;

  /** Generated CSS string */
  css: string;

  /** Generated HTML template string */
  html: string;

  /** Generated Web Component JS string */
  webComponent: string;

  /** Metadata about the component */
  meta: {
    description?: string;
    allowedElements: string[];
    slots: string[];
    variants: string[];
    states: string[];
  };
}

/** Parser options */
export interface ParserOptions {
  /** Base directory for resolving imports */
  baseDir?: string;

  /** Custom class name prefix (default: empty, uses component name) */
  classPrefix?: string;

  /** Custom element tag prefix (default: 'cj') */
  elementPrefix?: string;

  /** Minify output */
  minify?: boolean;
}

/** CSS generator options */
export interface CssGeneratorOptions {
  className: string;
  baseStyles: StyleBlock;
  states?: Record<string, StateDefinition>;
  variants?: Record<string, VariantDefinition>;
  minify?: boolean;
}

/** HTML generator options */
export interface HtmlGeneratorOptions {
  tagName: string;
  className: string;
  slots?: Record<string, SlotDefinition>;
  minify?: boolean;
}

/** Web Component generator options */
export interface WebComponentOptions {
  elementName: string;
  className: string;
  slots?: Record<string, SlotDefinition>;
  variants?: string[];
  minify?: boolean;
}
