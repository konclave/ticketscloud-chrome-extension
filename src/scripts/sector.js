import * as utils from './utils';

export default class Sector {
  constructor (node) {
    this.element = node;

    const id = utils.cleanId(this.element.getAttribute('id'));
    this.sectorTitle = id;
    this.element.setAttribute('tc-sector-name', id);

    const fill = this.element.children[0].getAttribute('fill');
    if (fill) {
      this.element.setAttribute('fill', fill);
      Array.prototype.forEach.call(this.element.children, (element) => {
        element.removeAttribute('fill');
      });
    }

    this.svgLink = null;
    this.isSelected = false;
  }

  get link() {
    return this.svgLink;
  }

  set link(filename) {
    this.svgLink = filename;
    this.element.setAttribute('tc-svg-link', filename);
  }

  get title() {
    return this.sectorTitle;
  }

  set title(title) {
    this.sectorTitle = title;
    this.element.setAttribute('tc-sector-name', title);
    this.element.setAttribute('id', title.replace(' ', '_'));
  }

  select() {
    this.isSelected = true;
    this.initFill = this.element.getAttribute('fill');
    this.element.setAttribute('fill', 'tomato');
  }

  deselect() {
    this.isSelected = false;
    if (this.initFill) {
      this.element.setAttribute('fill', this.initFill);
      this.initFill = null;
    } else {
      this.element.removeAttribute('fill');
    }
  }
}
