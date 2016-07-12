import * as utils from './utils';

function normalize(svg) {
  const container = svg.querySelector('#sector-container');
  container.setAttribute('tc-main', true);
  return svg;
}

class Sector {
  constructor (node) {
    this.element = node;
    this.element.addEventListener('click', this.onClick);
    this.title = utils.cleanId(this.element.getAttribute('id'));
    this.svgLink = null;
  }

  set link(filename) {
    this.svgLink = filename;
    this.element.setAttribute('tc-svg-link', filename);
  }

  get link() {
    return this.svgLink;
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

export function isComplexPlan(svg) {
  return !!svg.querySelector('#sector-container');
}

export class ComplexPlan {
  constructor (svg) {
    this.svgNode = normalize(svg);
    this.container = this.svgNode.querySelector('#sector-container');
    this.sectors = [];

    const sectorNodes = this.svgNode.querySelectorAll('[tc-sector-svg]');
    Array.prototype.forEach.call(sectorNodes, (node) => {
      this.sectors.push(new Sector(node));
    });
  }

  get svg () {
    return this.svgNode;
  }
}
