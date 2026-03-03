declare global {
  interface HTMLElementTagNameMap {
    'cj-button': Button;
  }
}

interface ButtonAttributes {
  variant?: 'sm' | 'lg';
}

declare class Button extends HTMLElement {
  static observedAttributes: string[];
  variant: 'sm' | 'lg';
}
