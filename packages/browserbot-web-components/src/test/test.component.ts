import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tailwindStyles } from '../shared/bb.element';

import style from './test.component.scss';

@customElement('test-component')
export class TestComponent extends LitElement {
  static override styles = [tailwindStyles, unsafeCSS(style)];

  @property()
  name?: string = 'World';

  render() {
    return html`
      <p>
        Hello,
        <b>${this.name}</b>
        !
      </p>
      <button class="bg-blue-200 text-yellow-200 p-2 rounded-full text-2xl">Hello world!</button>
    `;
  }
}
