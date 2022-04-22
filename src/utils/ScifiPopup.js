'use strict';

import STYLE from '../styles/popup.scss';

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

    const filter = `<div><svg><filter id="filter">
    <feTurbulence type="turbulence" baseFrequency="0.01 0.01" numOctaves="2" seed="2" stitchTiles="stitch" result="turbulence"/>
    <feColorMatrix type="saturate" values="30" in="turbulence" result="colormatrix"/>
    <feColorMatrix type="matrix" values="1 0 0 0 0
  0 1 0 0 0
  0 0 1 0 0
  0 0 0 150 -15" in="colormatrix" result="colormatrix1"/>
    <feComposite in="SourceGraphic" in2="colormatrix1" operator="in" result="composite"/>
    <feDisplacementMap in="SourceGraphic" in2="colormatrix1" scale="15" xChannelSelector="R" yChannelSelector="A" result="displacementMap"/>
  </filter></svg></div>`

    const filter2 = `<div><svg><filter id="filter2">
  <feTurbulence type="turbulence" baseFrequency="0.007 0.008" numOctaves="2" seed="2" stitchTiles="stitch" result="turbulence"/>
  <feColorMatrix type="saturate" values="30" in="turbulence" result="colormatrix"/>
  <feColorMatrix type="matrix" values="1 1 0 0 0
0 1 0 0 0
0 0 1 0 0
0 0 0 200 -20" in="colormatrix" result="colormatrix1"/>
  <feComposite in="SourceGraphic" in2="colormatrix1" operator="in" result="composite"/>
  <feDisplacementMap in="SourceGraphic" in2="colormatrix1" scale="20" xChannelSelector="R" yChannelSelector="A" result="displacementMap"/>
</filter></svg></div>`

    shadowRoot.innerHTML = filter + filter2 + `<style> ` + STYLE + `</style>
      <audio id="audio_in" src="/sounds/popup_in.mp3"></audio>
      <audio id="audio_out" src="/sounds/popup_out.mp3"></audio>
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
    // dont play audio_out on start
    // this.open = this.open;
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
      const openEvent = new CustomEvent('popupOpened', { bubbles: true });
      this.dispatchEvent(openEvent);
      var audio = shadowRoot.getElementById('audio_in');
      audio.play();
      document.getElementById('chevron').style.visibility='hidden';
    } else {
      this._wasFocused && this._wasFocused.focus && this._wasFocused.focus();
      this.removeAttribute('open');
      document.removeEventListener('keydown', this._watchEscape);
      var audio = shadowRoot.getElementById("audio_out");
      audio.play();
      this.close();
      document.getElementById('chevron').style.visibility='visible';
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
    var swipe = false;
    for (let index = 0; index < popups.length; index++) {
      const element = popups[index];
      const button = document.getElementById(element.opener);
      button?.addEventListener('click', () => { element.open = true; })

      button?.addEventListener('touchstart', () => { swipe = false; })
      button?.addEventListener('touchmove', () => { swipe = true; })
      button?.addEventListener('touchend', () => { if (!swipe) element.open = true; })
    }
  }

  _refocus(ev) {
    ev.preventDefault();
  }
}