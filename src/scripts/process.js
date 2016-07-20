import * as utils from './utils';

/**
 * removes unused attributes from SVG
 * @param svg {Element}
 */
function cleanMeta(svg) {
  svg.setAttribute('height', '100%');
  svg.setAttribute('width', '100%');
  svg.removeAttribute('xml:space');
  svg.removeAttribute('style');
}

function flattenStyles(svg) {
  const styleElement = svg.getElementsByTagName('style')[0];
  const defs = styleElement.parentNode;
  const styles = styleElement.innerHTML;
  for (let i = 0; i <= 100; i++) {
    try {
      const fntRegExp = new RegExp(`\\\.fnt${i}.+font-size:(\\d+)`);
      const strokeRegExp = new RegExp(`\\\.str${i}.+stroke:\\\s?((#.{6})|[A-Za-z]+)(;|\\\})`);
      const strokeWidthRegExp = new RegExp(`\\\.str${i}.+stroke-width:\\\s?(\\\d+)(;|\\\})`);
      const fillRegExp = new RegExp(`\\\.fil${i}.+fill:\\\s?((#.{6})|[A-Za-z]+)(;|\\\})`);

      if (fntRegExp.test(styles)) {
        const sectorNameFontSize = styles.match(fntRegExp)[1];
        Array.prototype.forEach.call(svg.querySelectorAll(`.fnt${i}`), setInlineFont(sectorNameFontSize));
      }
      if (strokeRegExp.test(styles)) {
        const stroke = styles.match(strokeRegExp)[1];
        Array.prototype.forEach.call(svg.querySelectorAll(`.str${i}`), setInlineStroke(stroke));
      }

      if (strokeWidthRegExp.test(styles)) {
        const strokeWidth = styles.match(strokeWidthRegExp)[1];
        Array.prototype.forEach.call(svg.querySelectorAll(`.str${i}`), setInlineStrokeWidth(strokeWidth));
      }

      if (fillRegExp.test(styles)) {
        const fill = styles.match(fillRegExp)[1];
        Array.prototype.forEach.call(svg.querySelectorAll(`.fil${i}`), setInlineFill(fill));
      }

      defs.parentNode.removeChild(defs);
    } catch (e) {
      window.console.log(`not found style fnt${i}`);
    }
  }
}

function wrapNodeWithGroup(node) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  node.parentNode.insertBefore(g, node);
  g.appendChild(node);
  return g;
}

function wrapSingleGroups() {
  const planContainer = document.getElementById('plan-container');

  if (!planContainer) return;

  const seatsWithoutRow = planContainer.querySelectorAll('[id*="add_row"]');
  if (seatsWithoutRow.length) {
    Array.prototype.forEach.call(seatsWithoutRow, (seat) => {
      const id = seat.getAttribute('id');
      const group = wrapNodeWithGroup(seat);
      seat.removeAttribute('id');
      group.setAttribute('id', id.replace(/add_row/, '').trim());
    });
  }

  const rowWithoutSector = planContainer.querySelectorAll('[id*="add_sector"]');
  if (rowWithoutSector.length) {
    Array.prototype.forEach.call(rowWithoutSector, (row) => {
      let id = row.getAttribute('id').replace(/\s?add_sector\s?/, '');
      row.removeAttribute('id');
      if (/\s?sector_shape\s?/.test(id)) {
        row.setAttribute('id', 'sector_shape');
      }

      id = id.replace(/\s?sector_shape\s?/, '');
      wrapNodeWithGroup(row).setAttribute('id', id);
    });
  }
}

function cleanTransforms(svg) {
  const sectors = svg.getElementById('plan-container').children;

  Array.prototype.forEach.call(sectors, (sector) => {
    const rows = sector.children;
    flattenTranslateTransform(sector);
    Array.prototype.forEach.call(rows, (row) => {
      flattenTranslateTransform(row);
    });
  });
}

/**
 * Converts circle-like seat paths to circles
 * inside group inside group inside #plan-container element
 * @param svg {Element}
 */
function convertPaths(svg) {
  const paths = svg.querySelectorAll('#plan-container > g > g > path');
  if (paths) {
    Array.prototype.forEach.call(paths, convertPathToCircle);
  }
}

/**
 * Converts circle-like path to circle shape
 * @param path
 * @returns {Element}
 */
function convertPathToCircle(path) {
  const params = getCircleParamsFromPath(path);
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

  circle.setAttribute('cx', params.x);
  circle.setAttribute('cy', params.y);
  circle.setAttribute('r', params.r);

  path.parentNode.replaceChild(circle, path);
  return circle;
}

function getCircleParamsFromPath(path) {
  const curve = path.getAttribute('d').substr(1).split(',');
  const x = curve[0].split(' ')[0] * 1;
  let r = curve[1].split(' ')[1] * 1;
  let y;

  if (r < 0) {
    r = -r;
    y = (curve[0].split(' ')[1].split('c')[0] * 1) + r;
  } else {
    y = (curve[0].split(' ')[1].split('c')[0] * 1) - r;
  }

  return { x, y, r };
}

function flattenTranslateTransform(node) {
  const transform = node.getAttribute('transform');
  const coords = {x: 0, y: 0};

  if (transform) {
    const translateParams = transform.match(/translate\((\d+\.?\d+?)\,? (\d+\.?\d+)?\)/);
    if (translateParams) {
      coords.x = translateParams[1];
      coords.y = translateParams[2];
    }
  }

  Array.prototype.map.call(node.querySelectorAll('circle'), function(seat) {
    const x = seat.getAttribute('cx');
    const y = seat.getAttribute('cy');

    if (x) {
      seat.setAttribute('cx', (x * 1) + (coords.x * 1));
    }

    if (y) {
      seat.setAttribute('cy', (y * 1) + (coords.y * 1));
    }
  });

  node.removeAttribute('transform');
}

function removeClasses(svg) {
  const seats = svg.querySelector('#plan-container').querySelectorAll('circle, path, polygon, rect');
  if (seats) {
    Array.prototype.forEach.call(seats, function(seat) {
      seat.removeAttribute('class');
    });
  }
}

function removeIdTags(svg) {
  const sectorShapes = svg.querySelectorAll('[id*="sector_shape"]');
  Array.prototype.forEach.call(sectorShapes, function(sector) {
    // var id = sector.getAttribute('id').replace(/\s?sector_shape\s?/, '');
    sector.setAttribute('fill', 'lightgrey');
    // sector.setAttribute('id', id);
  });
}

function sortNodes(svg) {
  const sectors = svg.getElementById('plan-container').children;

  Array.prototype.forEach.call(sectors, function(sector) {
    const rows = sector.querySelectorAll('g');

    Array.prototype.forEach.call(rows, sortSeats);
    sortRows(rows);
  });
}

function sortRows(rows) {
  if (rows.length === 0) {
    return;
  }

  const arr = Array.prototype.slice.call(rows);
  const parent = rows[0].parentNode;

  if (arr.length === 0) {
    return;
  }

  arr.sort(rowsCompare);

  appendSortedNodes(arr, parent, function(row, idx) {
    if (!row.getAttribute('tc-row-no')) {
      row.setAttribute('tc-row-no', idx + 1);
    }
  });
}

function sortSeats(row) {
  const seats = row.getElementsByTagName('circle');
  if (!Array.prototype.slice.call(seats).length) {
    const paths = row.getElementsByTagName('path');
    Array.prototype.forEach.call(paths, function(path) {
      const circle = convertPathToCircle(path);
      path.parentNode.replaceChild(circle, path);
    });
  }

  const arr = Array.prototype.slice.call(seats);

  arr.sort(seatsCompare);

  appendSortedNodes(arr, row, addSeatAttributes);
}

function rowsCompare(current, next) {
  const currentNo = current.getAttribute('tc-row-no');
  const nextNo = next.getAttribute('tc-row-no');
  const currentRawHalfLength = Math.floor(current.getElementsByTagName('circle').length / 2);
  const nextRawHalfLength = Math.floor(next.getElementsByTagName('circle').length / 2);
  const currentY = current.getElementsByTagName('circle')[currentRawHalfLength].getAttribute('cy');
  const nextY = next.getElementsByTagName('circle')[nextRawHalfLength].getAttribute('cy');

  if (currentNo && nextNo) {
    if (parseInt(currentNo, 10) > parseInt(nextNo, 10)) {
      return 1;
    } else if (parseInt(currentNo, 10) < parseInt(nextNo, 10)) {
      return -1;
    }
    return 0;
  }

  if (currentY * 1 > nextY * 1) {
    return 1;
  } else if (currentY * 1 < nextY * 1) {
    return -1;
  }
  return 0;
}

function seatsCompare(current, next) {
  const currentNo = current.getAttribute('tc-seat-no');
  const nextNo = next.getAttribute('tc-seat-no');

  if (currentNo && nextNo) {
    if (parseInt(currentNo, 10) > parseInt(nextNo, 10)) {
      return 11;
    } else if (parseInt(currentNo, 10) < parseInt(nextNo, 10)) {
      return -1;
    }
    return 0;
  }

  if (current.getAttribute('cx') * 1 > next.getAttribute('cx') * 1) {
    return -1;
  } else if (current.getAttribute('cx') * 1 < next.getAttribute('cx') * 1) {
    return 1;
  }
  return 0;
}

function appendSortedNodes(nodes, parent, callback) {
  if (!nodes.forEach) {
    nodes = Array.prototype.slice.call(nodes);
  }

  nodes.forEach(function(node, idx) {
    let crlf = null;
    if (callback && typeof callback === 'function') {
      callback(node, idx);
    }

    if (node.nextSibling && node.nextSibling.nodeType === 3) {
      crlf = node.nextSibling;
    }

    parent.appendChild(node);
    if (crlf) {
      parent.appendChild(crlf);
    }
  });
}

function addSeatAttributes(seat, idx) {
  if (!seat.getAttribute('tc-seat-no')) {
    seat.setAttribute('tc-seat-no', idx + 1);
  }
}

function setInlineFont(font) {
  return function(element) {
    element.setAttribute('font-family', 'Arial');
    if (font) {
      element.setAttribute('font-size', font);
    }
  };
}

function setInlineFill(fill) {
  return function(element) {
    if (fill) {
      element.setAttribute('fill', fill);
    }
  };
}

function setInlineStroke(stroke) {
  return function(element) {
    if (stroke) {
      element.setAttribute('stroke', stroke);
    }
  };
}

function setInlineStrokeWidth(strokeWidth) {
  return function(element) {
    if (strokeWidth) {
      element.setAttribute('stroke-width', strokeWidth);
    }
  };
}

function setSectorName(container) {
  const sectors = container.children;

  Array.prototype.forEach.call(sectors, (sector) => {
    const sectorId = sector.getAttribute('id');
    if (sectorId) {
      sector.setAttribute('tc-sector-name', utils.cleanId(sectorId));
    }
  });
}

function setWidthHeight(svg) {
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
}

export {
  cleanMeta,
  wrapSingleGroups,
  wrapNodeWithGroup,
  flattenStyles,
  cleanTransforms,
  convertPaths,
  sortNodes,
  setSectorName,
  removeClasses,
  removeIdTags,
  setWidthHeight
};
