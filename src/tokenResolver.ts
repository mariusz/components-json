/**
 * Token resolver for JSON component notation.
 * Resolves {token.path} references to var(--token-path) CSS custom properties.
 */

import {
  TokenReference,
  TokenDefinition,
  isTokenReference,
  extractTokenPath,
  tokenToCssVar,
  StyleValue,
  FlatStyleValue,
} from './types.js';

/**
 * Resolves token references in style values.
 */
export class TokenResolver {
  /** Loaded token definitions (from imports) */
  private tokens: Map<string, string | number> = new Map();

  /**
   * Load tokens from a token definition object.
   * Flattens nested structure into dot-notation keys.
   */
  loadTokens(definition: TokenDefinition | Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(definition)) {
      if (key.startsWith('$')) continue; // Skip metadata

      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string' || typeof value === 'number') {
        this.tokens.set(fullKey, value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested token groups
        this.loadTokens(value as Record<string, unknown>, fullKey);
      }
    }
  }

  /**
   * Resolve a single value - if it's a token reference, convert to CSS var.
   */
  resolve(value: StyleValue): FlatStyleValue {
    if (value === undefined) return '';
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      if (isTokenReference(value)) {
        return tokenToCssVar(value);
      }
      return value;
    }
    // Nested objects are handled separately
    return '';
  }

  /**
   * Check if a value is a token reference.
   */
  isToken(value: unknown): value is TokenReference {
    return isTokenReference(value);
  }

  /**
   * Get the raw token value (for validation/debugging).
   */
  getTokenValue(path: string): string | number | undefined {
    return this.tokens.get(path);
  }

  /**
   * Get all loaded token paths.
   */
  getAllTokenPaths(): string[] {
    return Array.from(this.tokens.keys());
  }

  /**
   * Extract all token references from a style block.
   */
  extractTokenRefs(styleBlock: Record<string, unknown>): TokenReference[] {
    const refs: TokenReference[] = [];

    const extract = (obj: Record<string, unknown>): void => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'string' && isTokenReference(value)) {
          refs.push(value);
        } else if (typeof value === 'object' && value !== null) {
          extract(value as Record<string, unknown>);
        }
      }
    };

    extract(styleBlock);
    return refs;
  }

  /**
   * Validate that all referenced tokens exist.
   */
  validateRefs(styleBlock: Record<string, unknown>): {
    valid: boolean;
    missing: string[];
  } {
    const refs = this.extractTokenRefs(styleBlock);
    const missing: string[] = [];

    for (const ref of refs) {
      const path = extractTokenPath(ref);
      if (!this.tokens.has(path)) {
        missing.push(path);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

/**
 * Create a default token resolver instance.
 */
export function createTokenResolver(): TokenResolver {
  return new TokenResolver();
}
