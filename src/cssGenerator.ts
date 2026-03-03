/**
 * CSS generator for JSON component notation.
 * Transforms base styles, states, and variants into CSS.
 */

import {
  StyleBlock,
  CSS_LOGICAL_PROPS,
  FlatStyleValue,
  CssGeneratorOptions,
} from './types.js';
import { TokenResolver } from './tokenResolver.js';

/**
 * Convert camelCase to kebab-case.
 */
function toKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Flatten nested style objects and resolve tokens.
 */
function flattenStyles(
  styles: StyleBlock,
  resolver: TokenResolver,
  prefix = ''
): Record<string, FlatStyleValue> {
  const result: Record<string, FlatStyleValue> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined) continue;

    const cssKey = prefix ? `${prefix}-${toKebab(key)}` : toKebab(key);

    // Check for logical properties (paddingX, marginY, etc.)
    if (key in CSS_LOGICAL_PROPS) {
      const [startProp, endProp] = CSS_LOGICAL_PROPS[key];
      const resolved = resolver.resolve(value as FlatStyleValue);
      result[startProp] = resolved;
      result[endProp] = resolved;
      continue;
    }

    // Handle nested objects (font, border, etc.)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = flattenStyles(value as StyleBlock, resolver, cssKey);
      Object.assign(result, nested);
      continue;
    }

    // Resolve token references
    const resolved = resolver.resolve(value as FlatStyleValue);
    result[cssKey] = resolved;
  }

  return result;
}

/**
 * Convert flat style object to CSS declaration block.
 */
function stylesToCss(styles: Record<string, FlatStyleValue>, indent = '  '): string {
  const lines: string[] = [];

  for (const [prop, value] of Object.entries(styles)) {
    if (value === '' || value === undefined) continue;
    lines.push(`${indent}${prop}: ${value};`);
  }

  return lines.join('\n');
}

/**
 * Generate CSS for a component.
 */
export function generateCss(options: CssGeneratorOptions, resolver: TokenResolver): string {
  const { className, baseStyles, states, variants, minify } = options;
  const parts: string[] = [];
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';

  // Base styles
  const baseFlat = flattenStyles(baseStyles, resolver);
  const baseCss = stylesToCss(baseFlat, indent);
  parts.push(`.${className} {${newline}${baseCss}${newline}}`);

  // States (hover, active, focus, disabled, etc.)
  if (states) {
    for (const [stateName, stateStyles] of Object.entries(states)) {
      const stateFlat = flattenStyles(stateStyles, resolver);
      const stateCss = stylesToCss(stateFlat, indent);
      parts.push(`.${className}:${stateName} {${newline}${stateCss}${newline}}`);
    }
  }

  // Variants (sm, lg, primary, etc.)
  if (variants) {
    for (const [variantName, variantStyles] of Object.entries(variants)) {
      const variantFlat = flattenStyles(variantStyles, resolver);
      const variantCss = stylesToCss(variantFlat, indent);
      parts.push(`.${className}--${variantName} {${newline}${variantCss}${newline}}`);
    }
  }

  const separator = minify ? '' : '\n\n';
  return parts.join(separator);
}

/**
 * Generate CSS custom property definitions from tokens.
 * Useful for creating a :root {} block with all tokens.
 */
export function generateTokenCss(resolver: TokenResolver, minify = false): string {
  const lines: string[] = [];
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';

  const paths = resolver.getAllTokenPaths();
  paths.sort();

  for (const path of paths) {
    const value = resolver.getTokenValue(path);
    const cssVarName = `--${path.replace(/\./g, '-')}`;
    lines.push(`${indent}${cssVarName}: ${value};`);
  }

  return `:root {${newline}${lines.join(newline)}${newline}}`;
}
