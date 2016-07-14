import Sector from './sector';

function normalize(svg) {
  svg.setAttribute('main', true);
  return svg;
}

export function isComplexPlan(svg) {
  return !!svg.querySelector('#sector-container');
}

export class ComplexPlan {
  constructor (svg) {
    this.svgNode = normalize(svg);
    this.container = this.svgNode.querySelector('#sector-container');
    this.sectors = [];

    const sectorNodes = this.container.querySelectorAll('[tc-sector-svg]');
    Array.prototype.forEach.call(sectorNodes, (node) => {
      this.sectors.push(new Sector(node));
    });
  }

  get svg () {
    return this.svgNode;
  }

  getSelected() {
    return this.sectors.filter((sector) => sector.isSelected);
  }

  setData(data) {
    this.getSelected().forEach((sector) => {
      sector.link = data.link;
      sector.title = data.title;
    });
  }
}
