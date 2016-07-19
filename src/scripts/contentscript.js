import * as process from './process';
import * as utils from './utils';
import {ComplexPlan, isComplexPlan} from './complex';

let complexPlan;

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
      text.setAttribute('x', (seat.getAttribute('cx') * 1) - (text.getBBox().width / 2));
      text.setAttribute('y', (seat.getAttribute('cy') * 1) + (text.getBBox().height / 3));
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
    return;
  }

  var startIdx = getNodeIdx(start);
  var endIdx = getNodeIdx(end);
  var row = start.parentNode.querySelectorAll('circle');

  for (var i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
    setCircleActive(row.item(i));
  }
}

function attachEvents(svg) {
  svg.getElementById('plan-container').addEventListener('click', simplePlanClickCallback);
}

function simplePlanClickCallback(e) {
  const current = document.querySelectorAll('.active');
  let seat;

  if (e.target.tagName === 'text') {
    seat = e.target.previousSibling;
  } else if (e.target.tagName === 'circle') {
    seat = e.target;
  }

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

function postProcess(svg) {
  process.flattenStyles(svg);
  process.removeClasses(svg);
  process.removeIdTags(svg);
  process.sortNodes(svg);
  process.setWidthHeight(svg);
}

function isSectorBroken(sector) {
  if (sector.tagName !== 'g') {
    return 'Неверный элемент вместо группы на уровне сектора';
  }
  if (!sector.getAttribute('id')) {
    return 'Сектор без названия';
  }
  if (!sector.children.length) {
    return 'Пустой сектор';
  }
  if (sector.querySelectorAll('g').length !== sector.children.length && !sector.querySelector('[id*="sector_shape"]')) {
    return 'Неверный элемент вместо группы на уровне рядов';
  }

  return false;
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

  const sectors = container.children;
  const coord = {};

  if (Array.prototype.some.call(sectors, testSector(coord))) {
    return coord;
  }

  return true;
}

function checkStructure(svg) {
  const container = svg.getElementById('plan-container');
  const isOK = isPlanCorrect(container);
  if (isOK.error) {
    const error = isOK.error;
    delete isOK.error;
    utils.printError(error, isOK);
    return false;
  }
  return true;
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

function preprocess() {
  const svg = document.querySelector('svg');

  process.cleanMeta(svg);
  process.wrapSingleGroups(svg);

  if (!checkStructure(svg)) {
    return false;
  }

  process.cleanTransforms(svg);
  process.convertPaths(svg);
  process.sortNodes(svg);
  process.setSectorName(svg);
  process.flattenStyles(svg);

  return true;
}

function onMessageCallback(msg, sender, response) {
  if (msg.from === 'popup') {
    if (msg.subject.action) {
      applyAction(msg.subject.action, response);
    } else if (msg.subject.seat || msg.subject.row || msg.subject.sector) {
      const seat = document.querySelectorAll('.active');

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
    } else if (msg.subject.title) {
      complexPlan.setData(msg.subject);
    }
  }
}

function applyAction(action, response) {
  const res = {};
  const seat = document.querySelectorAll('.active');
  const svg = document.querySelector('svg');
  const svgClone = svg.cloneNode(true);

  switch (action) {
    case 'getData':
      if (isComplexPlan(svg)) {
        response({
          isComplex: true,
          sectors: complexPlan.getSelected()
        });
      } else if (seat.length) {
        res.row = seat.item(0).parentNode.getAttribute('tc-row-no');
        res.sector = seat.item(0).parentNode.parentNode.getAttribute('tc-sector-name');
        res.seat = seat.length > 1 ? null : seat.item(0).getAttribute('tc-seat-no');
        res.range = seat.length;
        response(res);
      } else {
        response(null);
      }
      break;
    case 'getSVG':
      if (!isComplexPlan(svg)) {
        clearTemporaryNodes(svgClone);
        postProcess(svgClone);
      }
      response(svgClone.outerHTML);
      break;
    case 'zoomin':
      zoomIn(svg);
      break;
    case 'zoomout':
      zoomOut(svg);
      break;
    default:
  }
}

function zoomIn(svg) {
  svg.setAttribute('width', `${parseInt(svg.getAttribute('width'), 10) + 10}%`);
}

function zoomOut(svg) {
  const current = parseInt(svg.getAttribute('width'), 10);
  const next = current === 100 ? current : current - 10;
  svg.setAttribute('width', `${next}%`);
}

/**
 * creates HTML page and append svg node to body
 * @param svg {Element}
 */
function appendSVG(svg) {
  const html = document.createElementNS('http://www.w3.org/1999/xhtml', 'html');
  const body = document.createElementNS('http://www.w3.org/1999/xhtml', 'body');

  html.appendChild(document.createElementNS('http://www.w3.org/1999/xhtml', 'head'));
  html.appendChild(body);
  body.appendChild(svg);
  document.appendChild(html);

  window.chrome.runtime.onMessage.addListener(onMessageCallback);
}

function init() {
  const svg = document.querySelector('svg');
  if (!svg) return;
  if (isComplexPlan(svg)) {
    complexPlan = new ComplexPlan(svg);
    appendSVG(complexPlan.svg);
  } else {
    if (preprocess()) {
      setSeatNumbers();
      setRowNumbers();
      attachEvents(svg);
    }
    appendSVG(svg);
  }
}

init();
