const svg = document.querySelector('svg');

function setSeatNumbers() {
  const seats = document.querySelectorAll('circle');
  Array.prototype.forEach.call(seats, function(seat) {
    var num = seat.getAttribute('tc-seat-no');
    var text;
    if (num) {
      text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.innerHTML = num;
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', seat.getAttribute('r'));
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('class', 'temporary');
      seat.parentNode.insertBefore(text, seat.nextSibling);
      text.setAttribute('x', seat.getAttribute('cx') * 1 - text.getBBox().width / 2);
      text.setAttribute('y', seat.getAttribute('cy') * 1 + text.getBBox().height / 3);
    }
  });
}

function setRowNumbers() {
  var rows = document.querySelectorAll('[tc-row-no]');
  Array.prototype.forEach.call(rows, function(row) {
    var num = row.getAttribute('tc-row-no');
    var seats = row.querySelectorAll('circle');
    var firstSeat = seats[0];
    var coords = {
      x: firstSeat.getAttribute('cx') * 1 + (firstSeat.getAttribute('r') * 3 * (isReverse(seats) ? -1 : 1)),
      y: firstSeat.getAttribute('cy') * 1 + firstSeat.getAttribute('r') / 2
    };
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    if (firstSeat) {
      text.innerHTML = num;
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y);
      text.setAttribute('fill', 'blue');
      text.setAttribute('font-size', firstSeat.getAttribute('r') * 2);
      text.setAttribute('class', 'temporary');
      firstSeat.parentNode.insertBefore(text, firstSeat);
    }
  });
}

function isReverse(seats) {
  if (seats.length && seats.length > 1) {
    var seatLeftNo = seats[0].getAttribute('tc-seat-no');
    var seatRightNo = seats[1].getAttribute('tc-seat-no');
    return !!(seatLeftNo && seatRightNo && (seatLeftNo * 1 < seatRightNo * 1));
  } else {
    return false;
  }
}

function setCircleActive(seat) {
  if (seat && seat.classList) {
    seat.classList.add('active');
    seat.setAttribute('fill', 'lime');
  }
}

function setCircleInactive(seat) {
  if (seat && seat.classList) {
    seat.classList.remove('active');
    seat.removeAttribute('fill');
  }
}

function getNodeIdx(node) {
  return Array.prototype.indexOf.call(node.parentNode.querySelectorAll('circle'), node);
}

function selectRange(start, end) {
  if (start.parentNode !== end.parentNode) {
    return false;
  }

  var startIdx = getNodeIdx(start);
  var endIdx = getNodeIdx(end);
  var row = start.parentNode.querySelectorAll('circle');

  for (var i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
    setCircleActive(row.item(i));
  }
}

function attachEvents() {
  document.getElementById('plan-container').addEventListener('click', function(e) {
    var seat;
    var current;

    if (e.target.tagName === 'text') {
      seat = e.target.previousSibling;
    } else if (e.target.tagName === 'circle') {
      seat = e.target;
    }

    current = document.querySelectorAll('.active');

    if (e.shiftKey) {
      if (current.length === 1) {
        selectRange(current.item(0), seat);
      } else {
        setCircleActive(seat);
      }
    } else {
      if (current.length) {
        Array.prototype.map.call(current, setCircleInactive);
      }

      if (current.item(0) !== seat) {
        setCircleActive(seat);
      }
    }
  });
}

function setSeatNo(seat, idx) {
  seat.setAttribute('tc-seat-no', idx);
  seat.nextSibling.innerHTML = idx;
}

function changeRange(range) {
  var start = range.split(':')[0] * 1;
  var end = range.split(':')[1] * 1;
  var idx = start;
  var selected = document.querySelectorAll('.active');

  if (Math.abs(end - start) + 1 === selected.length) {
    Array.prototype.map.call(selected, function(seat) {
      setSeatNo(seat, idx);
      idx += start < end ? 1 : -1;
    });
  }
}

function clearTemporaryNodes(svg) {
  Array.prototype.forEach.call(svg.querySelectorAll('.temporary'), function(node) {
    node.parentNode.removeChild(node);
  });

  Array.prototype.forEach.call(svg.querySelectorAll('circle'), function(node) {
    node.removeAttribute('class');
    node.removeAttribute('fill');
  });
}

function setRowNo(seatNode, idx) {
  var rowNode = seatNode.parentNode;
  var rowNoNode = rowNode.querySelector('[fill="blue"]');
  rowNode.setAttribute('tc-row-no', rowNoNode.innerHTML = idx);
}

function setSectorTitle(seatNode, title) {
  var sectorNode = seatNode.parentNode.parentNode;
  sectorNode.setAttribute('tc-sector-name', title);
  sectorNode.setAttribute('id', title.replace(' ', '-'));
}

function seatsCompareSeatNoLtr(current, next) {
  if (current.getAttribute('tc-seat-no') * 1 > next.getAttribute('tc-seat-no') * 1) {
    return 1;
  } else if (current.getAttribute('tc-seat-no') * 1 < next.getAttribute('tc-seat-no') * 1) {
    return -1;
  } else {
    return 0;
  }
}

function rowsCompareRowNo(current, next) {
  if (current.getAttribute('tc-row-no') * 1 > next.getAttribute('tc-row-no') * 1) {
    return 1;
  } else if (current.getAttribute('tc-row-no') * 1 < next.getAttribute('tc-row-no') * 1) {
    return -1;
  } else {
    return 0;
  }
}

function removeIdTags(svg) {
  var sectorShapes = svg.querySelectorAll('[id*="sector_shape"]');
  Array.prototype.forEach.call(sectorShapes, function(sector) {
    //var id = sector.getAttribute('id').replace(/\s?sector_shape\s?/, '');
    sector.setAttribute('fill', 'lightgrey');
    //sector.setAttribute('id', id);
  });
}

function postProcess(svg) {
  flattenStyles(svg);
  removeClasses(svg);
  removeIdTags(svg);
  sortNodes(svg);
}

window.chrome.runtime.onMessage.addListener(function(msg, sender, response) {
  var seat;
  var res = {};

  if (msg.from === 'popup') {
    seat = document.querySelectorAll('.active');
    if (msg.subject.action === 'activeSeat') {
      if (seat.length) {
        res.row = seat.item(0).parentNode.getAttribute('tc-row-no');
        res.sector = seat.item(0).parentNode.parentNode.getAttribute('tc-sector-name');
        res.seat = seat.length > 1 ? null : seat.item(0).getAttribute('tc-seat-no');
        res.range = seat.length;
        response(res);
      } else {
        response(null);
      }
    } else if (msg.subject.seat || msg.subject.row || msg.subject.sector) {
      if (msg.subject.seat && seat.length) {
        if (/:/.test(msg.subject.seat)) {
          changeRange(msg.subject.seat, msg.subject.row);
        } else {
          setSeatNo(seat.item(0), msg.subject.seat);
        }
      }

      if (msg.subject.row) {
        setRowNo(seat.item(0), msg.subject.row);
      }

      if (msg.subject.sector) {
        setSectorTitle(seat.item(0), msg.subject.sector);
      }

    } else if (msg.subject.action === 'getSVG') {
      var svg;
      svg = document.querySelector('svg').cloneNode(true);
      clearTemporaryNodes(svg);
      postProcess(svg);
      response(svg.outerHTML);
    }
  }
});

function printError() {
  var svg = document.querySelector('svg');
  var error = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  var texts = [];

  error.setAttribute('x', 20);
  error.setAttribute('y', 20);
  error.setAttribute('fill', 'tomato');
  error.setAttribute('stroke', 'red');
  error.setAttribute('width', svg.getBBox().width / 7);
  error.setAttribute('height', svg.getBBox().height / 20);
  g.appendChild(error);

  if (arguments.length) {
    Array.prototype.forEach.call(arguments, function(attr) {
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('font-size', error.getAttribute('height') / 4);
      text.setAttribute('fill', 'black');
      text.setAttribute('x', error.getAttribute('width') / 20);

      if (typeof attr === 'string') {
        text.innerHTML = attr;
      } else if (typeof attr === 'object') {
        text.innerHTML = JSON.stringify(attr);
      }

      texts.push(text);
    });
  }

  texts.forEach(function(text) {
    g.appendChild(text);
  });

  svg.appendChild(g);

  texts.forEach(function(text, idx) {
    var width = text.getBBox().width;
    if ((width + error.getAttribute('width') / 20 * 2) > error.getAttribute('width')) {
      error.setAttribute('width', (width + error.getAttribute('width') / 20 * 2));
    }

    text.setAttribute('y', text.getBBox().height * (idx + 1) + error.getAttribute('height') / 20);
  });
}

function isSectorBroken(sector) {
  if (sector.tagName !== 'g') {
    return 'Неверный элемент вместо группы на уровне сектора';
  } else if (!sector.getAttribute('id')) {
    return 'Сектор без названия';
  } else if (!sector.children.length) {
    return 'Пустой сектор';
  } else if (sector.querySelectorAll('g').length !== sector.children.length && !sector.querySelector('[id*="sector_shape"]')) {
    return 'Неверный элемент вместо группы на уровне рядов';
  } else {
    return false;
  }
}

function isRowBroken(row) {
  if (/sector_shape/.test(row.getAttribute('id'))) {
    return false;
  }

  if (row.tagName !== 'g') {
    return 'Неверный элемент вместо группы на уровне ряда';
  } else if (!row.children.length) {
    return 'Пустой ряд';
  } else {
    return false;
  }
}

function isSeatBroken(seat) {
  if (seat.tagName !== 'circle' && seat.tagName !== 'path' && seat.tagName !== 'polygon') {
    return 'Неверный элемент на уровне места';
  } else {
    return false;
  }
}

function isPlanCorrect(container) {

  if (!container) {
    return {error: 'Нет общей группы с id="plan-container"'};
  }

  var sectors = container.children;
  var coord = {};

  if (Array.prototype.some.call(sectors, testSector(coord))) {
    return coord;
  } else {
    return true;
  }
}

function checkStructure() {
  var container = svg.getElementById('plan-container');
  var isOK;
  var error;

  isOK = isPlanCorrect(container);
  if (isOK.error) {
    error = isOK.error;
    delete isOK.error;
    printError(error, isOK);
    return false;
  } else {
    return true;
  }
}

function testSector(coord) {
  return function(sector, sectorIdx) {
    var rows;
    var isBroken = isSectorBroken(sector);
    if (!isBroken) {
      rows = sector.children;
      return Array.prototype.some.call(rows, testRow(coord, sectorIdx));
    } else {
      coord.sector = sectorIdx;
      coord.error = isBroken;
      return true;
    }
  };
}

function testRow(coord, sectorIdx) {
  return function(row, rowIdx) {
    var seats;
    var isBroken = isRowBroken(row);
    if (!isBroken) {
      seats = row.children;
      return Array.prototype.some.call(seats, testSeat(coord, sectorIdx, rowIdx));
    } else {
      coord.sector = sectorIdx;
      coord.row = rowIdx;
      coord.error = isBroken;
      return true;
    }
  };
}

function testSeat(coord, sectorIdx, rowIdx) {
  return function(seat, seatIdx) {
    var isBroken = isSeatBroken(seat);
    if (isBroken) {
      coord.sector = sectorIdx;
      coord.row = rowIdx;
      coord.seat = seatIdx;
      coord.error = isBroken;
      return true;
    }
  };
}

function flattenStyles(svg) {
  var sectorNameFontSize;
  var sectorFill;
  var stroke;
  var strokeWidth;
  var fntRegExp;
  var strokeRegExp;
  var strokeWidthRegExp;
  var styles;

  for (var i = 0; i <= 100; i++) {
    try {

      fntRegExp = new RegExp('\\\.fnt' + i + '.+font-size:(\\d+)');
      strokeRegExp = new RegExp('\\\.str' + i + '.+stroke:\\\s?((#.{6})|[A-Za-z]+)(;|\\\})');
      strokeWidthRegExp = new RegExp('\\\.str' + i + '.+stroke-width:\\\s?(\\\d+)(;|\\\})');

      styles = svg.getElementsByTagName('style')[0].innerHTML;

      if (fntRegExp.test(styles)) {
        sectorNameFontSize = styles.match(fntRegExp)[1];
        Array.prototype.map.call(svg.querySelectorAll('.fnt' + i), setInlineFont(sectorNameFontSize));
      }

      if (strokeRegExp.test(styles)) {
        stroke = styles.match(strokeRegExp)[1];
        Array.prototype.map.call(svg.querySelectorAll('.str' + i), setInlineStroke(stroke));
      }

      if (strokeWidthRegExp.test(styles)) {
        strokeWidth = styles.match(strokeWidthRegExp)[1];
        Array.prototype.map.call(svg.querySelectorAll('.str' + i), setInlineStrokeWidth(strokeWidth));
      }
    } catch (e) {
      window.console.log('not found style fnt' + i);
    }
  }
}

function removeClasses(svg) {
  var seats = svg.querySelector('#plan-container').querySelectorAll('circle, path, polygon, rect');
  if (seats) {
    Array.prototype.forEach.call(seats, function(seat) {
      seat.removeAttribute('class');
    });
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

function cleanMeta() {
  document.querySelector('svg').setAttribute('height', '100%');
  document.querySelector('svg').setAttribute('width', '100%');
  document.querySelector('svg').removeAttribute('xml:space');
  document.querySelector('svg').removeAttribute('style');
}

function flattenTranslateTransform(row) {
  var transform = row.getAttribute('transform');
  var coords = {x: 0, y: 0};
  var translateParams;

  if (transform) {
    translateParams = transform.match(/translate\((\d+\.?\d+?)\,? (\d+\.?\d+)?\)/);
    if (translateParams) {
      coords.x = translateParams[1];
      coords.y = translateParams[2];
    }
  }

  Array.prototype.map.call(row.querySelectorAll('circle'), function(seat) {
    var x = seat.getAttribute('cx');
    var y = seat.getAttribute('cy');

    if (x) {
      seat.setAttribute('cx', x * 1 + coords.x * 1);
    }

    if (y) {
      seat.setAttribute('cy', y * 1 + coords.y * 1);
    }
  });

  row.removeAttribute('transform');
}

function convertPathToCircle(path) {
  var curve = path.getAttribute('d').substr(1).split(',');
  var r = curve[1].split(' ')[1] * 1;
  var x = curve[0].split(' ')[0] * 1;
  var y;
  if (r < 0) {
    r = -r;
    y = curve[0].split(' ')[1].split('c')[0] * 1 + r;
  } else {
    y = curve[0].split(' ')[1].split('c')[0] * 1 - r;
  }

  var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', r);

  path.parentNode.replaceChild(circle, path);
  return circle;
}

function cleanTransforms() {
  var sectors = document.getElementById('plan-container').children;

  Array.prototype.forEach.call(sectors, function(sector) {
    var rows = sector.children;
    flattenTranslateTransform(sector);
    Array.prototype.forEach.call(rows, function(row) {
      flattenTranslateTransform(row);
    });
  });
}

function convertPaths() {
  var paths = document.getElementById('plan-container').querySelectorAll(':scope > g > g > path');
  if (paths) {
    Array.prototype.forEach.call(paths, convertPathToCircle);
  }
}

function seatsCompare(current, next) {
  var currentNo = current.getAttribute('tc-seat-no');
  var nextNo = next.getAttribute('tc-seat-no');

  if (currentNo && nextNo) {
    if (parseInt(currentNo) > parseInt(nextNo)) {
      return 11;
    } else if (parseInt(currentNo) < parseInt(nextNo)) {
      return -1;
    } else {
      return 0;
    }
  } else {
    if (current.getAttribute('cx') * 1 > next.getAttribute('cx') * 1) {
      return -1;
    } else if (current.getAttribute('cx') * 1 < next.getAttribute('cx') * 1) {
      return 1;
    } else {
      return 0;
    }
  }
}

function addSeatAttributes(seat, idx) {
  if (!seat.getAttribute('tc-seat-no')) {
    seat.setAttribute('tc-seat-no', idx + 1);
  }
}

function appendSortedNodes(nodes, parent, callback) {
  var crlf;

  if (!nodes.forEach) {
    nodes = Array.prototype.slice.call(nodes);
  }

  nodes.forEach(function(node, idx) {
    crlf = null;
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

function sortSeats(row) {
  var seats;
  var arr;
  var paths;
  var circle;

  seats = row.getElementsByTagName('circle');
  if (!Array.prototype.slice.call(seats).length) {
    paths = row.getElementsByTagName('path');
    Array.prototype.forEach.call(paths, function(path) {
      circle = convertPathToCircle(path);
      path.parentNode.replaceChild(circle, path);
    });
  }

  arr = Array.prototype.slice.call(seats);

  arr.sort(seatsCompare);

  appendSortedNodes(arr, row, addSeatAttributes);
}

function rowsCompare(current, next) {
  var currentNo = current.getAttribute('tc-row-no');
  var nextNo = next.getAttribute('tc-row-no');
  var currentY = current.getElementsByTagName('circle')[Math.floor(current.getElementsByTagName('circle').length / 2)].getAttribute('cy');
  var nextY = next.getElementsByTagName('circle')[Math.floor(next.getElementsByTagName('circle').length / 2)].getAttribute('cy');

  if (currentNo && nextNo) {
    if (parseInt(currentNo) > parseInt(nextNo)) {
      return 1;
    } else if (parseInt(currentNo) < parseInt(nextNo)) {
      return -1;
    } else {
      return 0;
    }
  } else {
    if (currentY * 1 > nextY * 1) {
      return 1;
    } else if (currentY * 1 < nextY * 1) {
      return -1;
    } else {
      return 0;
    }
  }
}

function sortRows(rows) {
  var arr = Array.prototype.slice.call(rows);
  if (arr.length === 0) {
    return;
  }

  var parent = rows[0].parentNode;

  arr.sort(rowsCompare);
  appendSortedNodes(arr, parent, function(row, idx) {
    if (!row.getAttribute('tc-row-no')) {
      row.setAttribute('tc-row-no', idx + 1);
    }
  });
}

function sortNodes(svg) {
  var sectors = svg.getElementById('plan-container').children;

  Array.prototype.forEach.call(sectors, function(sector) {
    var rows = sector.querySelectorAll('g');

    Array.prototype.forEach.call(rows, function(row) {
      sortSeats(row);
    });

    sortRows(rows);
  });
}

function setSectorName() {
  var sectors = document.getElementById('plan-container').children;

  Array.prototype.forEach.call(sectors, function(sector) {
    var sectorId = sector.getAttribute('id');

    if (sector.getAttribute('tc-sector-name')) {
      return;
    }

    if (sectorId) {
      sectorId = sectorId.replace(/_(x(\d|[a|b|c|d|e]){4})_/g, function() {
        return String.fromCharCode('0' + arguments[1]);
      }).replace('-', ' ').trim();
      sector.setAttribute('tc-sector-name', sectorId);
    }
  });
}

function wrapChildrenWithGroup(node) {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  for (var i = 0, j = node.children.length; i < j; i++) {
    g.appendChild(node.children[0]);
  }

  //Array.prototype.map.call(node.children, function(seat) {
  //  g.appendChild(seat);
  //});

  node.appendChild(g);
  return g;
}

function wrapNodeWithGroup(node) {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  node.parentNode.insertBefore(g, node);
  g.appendChild(node);
  return g;
}

function wrapSingleGroups() {
  var planContainer = document.getElementById('plan-container');
  var wrapRow;
  var rowWithoutSector;
  var seatsWithoutRow;
  var id;

  if (!planContainer) return;

  wrapRow = planContainer.querySelectorAll('[id*="wrap_rows"]');
  rowWithoutSector = planContainer.querySelectorAll('[id*="add_sector"]');
  seatsWithoutRow = planContainer.querySelectorAll('[id*="add_row"]');

  if (rowWithoutSector.length) {
    Array.prototype.forEach.call(rowWithoutSector, function(row) {
      id = row.getAttribute('id').replace(/\s?add_sector\s?/, '');
      row.removeAttribute('id');
      if (/\s?sector_shape\s?/.test(id)) {
        row.setAttribute('id', 'sector_shape');
      }

      id = id.replace(/\s?sector_shape\s?/, '');
      wrapNodeWithGroup(row).setAttribute('id', id);
    });
  }

  if (seatsWithoutRow.length) {
    Array.prototype.forEach.call(seatsWithoutRow, function(seat) {
      seat.removeAttribute('id');
      wrapNodeWithGroup(seat);
    });
  }

  if (wrapRow.length) {
    var title = wrapRow[0].getAttribute('id');
    wrapRow[0].removeAttribute('id');
    title = title.replace(/\s?wrap_rows\s?/, '');
    wrapChildrenWithGroup(wrapRow[0].parentNode).setAttribute('id', title);
  }
}

function applyTranslate(element, translate) {
  switch (element.tagName) {
    case 'circle':
      element.setAttribute('cx', element.getAttribute('cx') * 1 + translate.x * 1);
      break;
    default:
  }
}

function extractChildren(element) {
  if (element.getAttribute('tc-row') || element.getAttribute('data-tc-row')) {
    element.removeAttribute('transform');
    return;
  }

  for (var i = element.children.length - 1; i >= 0; i--) {
    element.parentNode.appendChild(element.children[i]);
  }

  element.parentNode.removeChild(element);
}

function flattenTransform(element) {
  var transform = element.getAttribute('transform');

  if (transform) {
    var translate = transform.match(/translate\((\d+\.?\d+?)\)/);
    if (element.tagName === 'g') {
      Array.prototype.forEach.call(element.children, function(child) {
        applyTranslate(child, {x: translate[1]});
      });

      extractChildren(element);
    }
  }
}

function flattenTransforms(svg) {
  var groups = svg.querySelectorAll('g[transform]');
  Array.prototype.forEach.call(groups, function(group) {
    flattenTransform(group);
  });
}

function preprocess() {
  var svg = document.querySelector('svg');

  cleanMeta();
  wrapSingleGroups();
  // flattenTransforms(svg);

  if (!checkStructure()) {
    return false;
  }

  cleanTransforms();
  convertPaths();
  sortNodes(svg);
  setSectorName();
  flattenStyles(svg);

  return true;
}

if (svg) {
  if (preprocess()) {
    setSeatNumbers();
    setRowNumbers();
    attachEvents();
  }

  var html = document.createElementNS('http://www.w3.org/1999/xhtml', 'html');
  var body = document.createElementNS('http://www.w3.org/1999/xhtml', 'body');
  html.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml', 'head'));
  html.appendChild(body);
  body.appendChild(svg);
  document.appendChild(html);
}
