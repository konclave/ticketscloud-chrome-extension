import Sector from './sector';
import * as process from './process';

/**
 * Wraps every sector shape which `id` contains 'add_sector' string
 * into group <g> and moves shape `id` attribute to the group element, cutting off 'add_sector' string
 * Need to do that because of Corel Draw can't wrap single shape into group
 * @param svg {Element}
 */
function wrapSingleShapes(svg) {
  const sectorShapes = svg.querySelectorAll('[id*="add_sector"]');
  Array.prototype.forEach.call(sectorShapes, (element) => {
    const id = element.getAttribute('id');
    const group = process.wrapNodeWithGroup(element);
    group.setAttribute('id', id.replace('add_sector', '').trim());
    element.removeAttribute('id');
  });
}

function normalize(svg) {
  svg.setAttribute('main', true);
  process.cleanMeta(svg);
  process.flattenStyles(svg);
  wrapSingleShapes(svg);
  return svg;
}

export function isComplexPlan(svg) {
  return !!svg.querySelector('#sector-container');
}

export class ComplexPlan {
  constructor (svg) {
    this.svgNode = normalize(svg);
    this.sectors = [];

    const sectorNodes = this.svgNode.querySelectorAll('#sector-container > g');
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
