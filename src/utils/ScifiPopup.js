'use strict';

import STYLE from '../styles/popup.css';

export class ScifiPopup extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'opener'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.close = this.close.bind(this);
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (attrName) {
        /** Boolean attributes */
        case 'open':
          this[attrName] = this.hasAttribute(attrName);
          break;
        /** Value attributes */
        case 'opener':
          this[attrName] = newValue;
          break;
      }
    }
  }

  connectedCallback() {
    const { shadowRoot } = this;
    shadowRoot.innerHTML = `<style> ` + STYLE + `</style>
      <div class="modal" tabindex="0">
        <div class="overlay"></div>
        <div class="modal-corners">
          <div class="modal-dialog">
            <div class="modal-header">
              <button class="close">&#10006</button> 
            </div>
            <div class="modal-content"> 
              <slot></slot>
            </div>                     
          </div>
          <span class='ui-corner'></span>
          <span class='ui-corner'></span>
          <span class='ui-corner'></span>
          <span class='ui-corner'></span>   
        <div>
      </div>`; 

    shadowRoot.querySelector('button').addEventListener('click', this.close);
    shadowRoot.querySelector('.overlay').addEventListener('click', this.close);
    this.open = this.open;
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('button').removeEventListener('click', this.close);
    this.shadowRoot.querySelector('.overlay').removeEventListener('click', this.close);
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(isOpen) {
    const { shadowRoot } = this;
    shadowRoot.querySelector('.modal').classList.toggle('open', isOpen);
    // var refocus = this._refocus.bind(this);
    if (isOpen) {
      this._wasFocused = document.activeElement;
      this.setAttribute('open', '');
      document.addEventListener('keydown', this._watchEscape);
      this.focus();
      shadowRoot.querySelector('button').focus();
      shadowRoot.querySelector('.modal-content').scrollTo(0, 0);
      // this.addEventListener('focusout',refocus);
      const openEvent = new CustomEvent('popupOpened', { bubbles: true });
      this.dispatchEvent(openEvent);
    } else {
      this._wasFocused && this._wasFocused.focus && this._wasFocused.focus();
      this.removeAttribute('open');
      document.removeEventListener('keydown', this._watchEscape);
      // this.removeEventListener('focusout',refocus);
      this.close();
    }
  }


  get opener() {
    return this.getAttribute('opener');
  }

  set opener(opener) {
    if (opener) {
      this.setAttribute('opener', opener);
    } else {
      this.removeAttribute('opener');
    }
  }


  close() {
    if (this.open !== false) {
      this.open = false;
    }
    const closeEvent = new CustomEvent('popupClosed', { bubbles: true });
    this.dispatchEvent(closeEvent);
  }

  _watchEscape(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  static registerOpeners() {
    const popups = document.querySelectorAll('scifi-popup');
    for (let index = 0; index < popups.length; index++) {
      const element = popups[index];
      const button = document.getElementById(element.opener);
      button?.addEventListener('click', () => { element.open = true; })
      button?.addEventListener('touchend', () => { element.open = true; })
    }
  }

  _refocus(ev) {
    ev.preventDefault();
  }
}