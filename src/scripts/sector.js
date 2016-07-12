import * as utils from './utils';

export default class Sector {
  constructor (node) {
    this.element = node;
    this.element.addEventListener('click', this.onClick.bind(this));

    const id = utils.cleanId(this.element.getAttribute('id'));
    this.sectorTitle = id;
    this.element.setAttribute('tc-sector-name', id);

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

  onClick(e) {
    this.isSelected = !this.isSelected;
    if (this.isSelected) {
      this.initFill = e.target.getAttribute('fill');
      e.target.setAttribute('fill', 'tomato');
    } else if (this.initFill) {
      e.target.setAttribute('fill', this.initFill);
      this.initFill = null;
    } else {
      e.target.removeAttribute('fill');
    }
  }
}
