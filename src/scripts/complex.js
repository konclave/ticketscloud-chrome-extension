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
  const styleElement = svg.getElementsByTagName('style')[0];
  const container = svg.querySelector('#sector-container');
  svg.setAttribute('main', true);
  process.cleanMeta(svg);
  process.flattenStyles(container, styleElement);
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

    this.svgNode.addEventListener('click', this.onClick.bind(this));
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

  deselectAll() {
    this.getSelected().forEach((sector) => {
      sector.deselect();
    });
  }

  getSector(element) {
    return this.sectors.filter((sector) => sector.element === element)[0];
  }

  onClick(e) {
    const sector = this.getSector(e.target.parentNode);
    if (!sector) {
      return;
    }
    const isSelected = sector.isSelected;
    this.deselectAll();
    if (!isSelected) {
      sector.select();
    }
  }
}
