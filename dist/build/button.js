/**
 * Button Web Component
 * Auto-generated from JSON component definition
 *
 * @element cj-button
 * @attr {string} variant - Component variant (sm, lg)
 */
/**
 * Slots:
 * @slot {image | {components.icon}} iconLeft (optional)
 * @slot {text} label (required)
 * @slot {image | {components.icon}} iconRight (optional)
 */

class Button extends HTMLElement {
  static get observedAttributes() {
    return ['variant'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'variant') {
      this._updateVariant(oldValue, newValue);
    }
  }

  get variant() {
    return this.getAttribute('variant') || '';
  }

  set variant(value) {
    if (value) {
      this.setAttribute('variant', value);
    } else {
      this.removeAttribute('variant');
    }
  }

  _render() {
    const variant = this.variant;
    const variantClass = variant ? `${'button'}--${variant}` : 'button';

    this.shadowRoot.innerHTML = `
      <style>
      .button {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding-inline: var(--spacing-md);
        padding-block: var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-family: var(--typography-font-default);
        font-size: var(--typography-size-md);
        font-weight: var(--typography-weight-semibold);
        background: var(--color-button-default-background-default);
        color: var(--color-button-default-color-default);
      }
      
      .button:hover {
        background: var(--color-button-default-background-hover);
      }
      
      .button:active {
        background: var(--color-button-default-background-active);
      }
      
      .button--sm {
        padding-inline: var(--spacing-sm);
        padding-block: var(--spacing-md);
        font-size: var(--typography-size-sm);
      }
      
      .button--lg {
        padding-inline: var(--spacing-lg);
        padding-block: var(--spacing-md);
        font-size: var(--typography-size-lg);
      }
      </style>

      <${this.tagName.toLowerCase()} class="${variantClass}">
      <slot name="iconLeft"></slot>
      <slot name="label"></slot>
      <slot name="iconRight"></slot>
      </${this.tagName.toLowerCase()}>
    `;
  }

  _updateVariant(oldVariant, newVariant) {
    const root = this.shadowRoot.querySelector('[class*="button"]');
    if (!root) return;

    // Remove old variant class
    if (oldVariant) {
      root.classList.remove(`${'button'}--${oldVariant}`);
    }

    // Add new variant class
    if (newVariant) {
      root.classList.add(`${'button'}--${newVariant}`);
    }
    root.classList.toggle('button', !newVariant);
  }
}

// Register the custom element
if (!customElements.get('cj-button')) {
  customElements.define('cj-button', Button);
}