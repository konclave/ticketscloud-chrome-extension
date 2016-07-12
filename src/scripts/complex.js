function normalize(svg) {
  const container = svg.querySelector('#sector-container');

  container.setAttribute('tc-main', true);
}

export function isComplexPlan(svg) {
  return !!svg.querySelector('#sector-container');
}


export default class ComplexSector {
  constructor (svg) {
    this.svg = normalize(svg);
    this.container = this.svg.querySelector('#sector-container');
    this.attachEvents();
  }

  attachEvents() {
    this.container.addEventListener('click', this.onClick);
  }

  onClick(e) {
    if (e.target.getAttribute('tc-sector-svg') || e.target.parent.getAttribute('tc-sector-svg')) {

    }
  }
}

