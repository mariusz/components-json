# components-json

A simple and performant parser for JSON component notation. Transform JSON component definitions into CSS, HTML templates, and native Web Components.

## Features

- **Token Resolution**: `{spacing.sm}` → `var(--spacing-sm)` CSS custom properties
- **CSS Generation**: Base styles, states (`:hover`, `:active`), and variants (`--sm`, `--lg`)
- **HTML Templates**: Slot-based templates from component definitions
- **Web Components**: Native custom elements with Shadow DOM encapsulation
- **TypeScript Support**: Generated type declarations for components

## Installation

```bash
npm install components-json
```

## CLI Usage

```bash
# Build a component
npx components-json build button.json --out ./dist

# Watch for changes
npx components-json watch button.json --out ./dist

# Options
npx components-json build button.json \
  --out ./dist \
  --prefix btn \
  --element-prefix my \
  --minify
```

### CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--out` | `-o` | Output directory | `./dist` |
| `--prefix` | `-p` | CSS class prefix | none |
| `--element-prefix` | `-e` | Custom element tag prefix | `cj` |
| `--minify` | `-m` | Minify output | false |
| `--help` | `-h` | Show help | - |
| `--version` | `-v` | Show version | - |

## Programmatic API

```typescript
import { parse, generatePackage } from 'components-json';

// Parse and get output
const result = parse('./button.json', {
  baseDir: process.cwd(),
  elementPrefix: 'cj',
  minify: false,
});

console.log(result.css);         // CSS string
console.log(result.html);        // HTML template
console.log(result.webComponent); // Web Component JS
console.log(result.meta);        // Component metadata

// Generate all output files
const { files, output } = generatePackage(
  './button.json',
  './dist'
);
```

## JSON Component Notation

### Component Definition

```json
{
  "$schema": "components-json/1.0",
  "$import": ["./tokens.json"],

  "button": {
    "$type": "component",
    "$description": "Base action button",
    "$allowedElements": ["button", "input"],

    "slots": {
      "iconLeft": {
        "$allowedTypes": ["image", "{components.icon}"],
        "$optional": true
      },
      "label": {
        "$allowedTypes": ["text"],
        "$optional": false
      }
    },

    "base": {
      "display": "inline-flex",
      "alignItems": "center",
      "gap": "{spacing.sm}",
      "paddingX": "{spacing.md}",
      "paddingY": "{spacing.sm}",
      "borderRadius": "{radius.sm}",
      "font": {
        "family": "{typography.font.default}",
        "size": "{typography.size.md}",
        "weight": "{typography.weight.semibold}"
      },
      "background": "{color.button.default.background.default}",
      "color": "{color.button.default.color.default}"
    },

    "states": {
      "hover": {
        "background": "{color.button.default.background.hover}"
      },
      "active": {
        "background": "{color.button.default.background.active}"
      }
    },

    "variants": {
      "sm": {
        "paddingX": "{spacing.sm}",
        "font": {
          "size": "{typography.size.sm}"
        }
      },
      "lg": {
        "paddingX": "{spacing.lg}",
        "font": {
          "size": "{typography.size.lg}"
        }
      }
    }
  }
}
```

### Token Definition

```json
{
  "spacing": {
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem"
  },
  "color": {
    "button": {
      "default": {
        "background": {
          "default": "#3b82f6",
          "hover": "#2563eb",
          "active": "#1d4ed8"
        }
      }
    }
  }
}
```

## Generated Output

### CSS

```css
.button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-inline: var(--spacing-md);
  padding-block: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-family: var(--typography-font-default);
  font-size: var(--typography-size-md);
  background: var(--color-button-default-background-default);
}

.button:hover {
  background: var(--color-button-default-background-hover);
}

.button--sm {
  padding-inline: var(--spacing-sm);
  font-size: var(--typography-size-sm);
}
```

### HTML Template

```html
<button class="button">
  <slot name="iconLeft"></slot>
  <slot name="label"></slot>
  <slot name="iconRight"></slot>
</button>
```

### Web Component

```html
<cj-button variant="sm">
  <span slot="iconLeft">←</span>
  <span slot="label">Click me</span>
  <span slot="iconRight">→</span>
</cj-button>
```

## Property Mappings

### Axis Properties

| JSON Property | CSS Output |
|---------------|------------|
| `paddingX` | `padding-left`, `padding-right` |
| `paddingY` | `padding-top`, `padding-bottom` |
| `marginX` | `margin-left`, `margin-right` |
| `marginY` | `margin-top`, `margin-bottom` |

### Nested Properties

| JSON Property | CSS Property |
|---------------|--------------|
| `font.family` | `font-family` |
| `font.size` | `font-size` |
| `font.weight` | `font-weight` |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Build and test
npm run build && node dist/cli.js build examples/button.json --out examples/output
```

## License

MIT
