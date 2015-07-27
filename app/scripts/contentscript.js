'use strict';
var svg = document.querySelector('svg');

function setSeatNumbers() {
  var seats = document.querySelectorAll('circle');
  Array.prototype.map.call(seats, function(seat) {
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
  Array.prototype.map.call(rows, function(row) {
    var num = row.getAttribute('tc-row-no');
    var firstSeat = row.querySelector('circle');
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.innerHTML = num;
    text.setAttribute('x', firstSeat.getAttribute('cx') * 1 + firstSeat.getAttribute('r') * 2);
    text.setAttribute('y', firstSeat.getAttribute('cy') * 1 + firstSeat.getAttribute('r') / 2);
    text.setAttribute('fill', 'blue');
    text.setAttribute('font-size', firstSeat.getAttribute('r') * 2);
    text.setAttribute('class', 'temporary');
    firstSeat.parentNode.insertBefore(text, firstSeat);
  });
}

function setCircleActive(seat) {
  seat.classList.add('active');
  seat.setAttribute('fill', 'lime');
}

function setCircleInactive(seat) {
  seat.classList.remove('active');
  seat.removeAttribute('fill');
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

  if (Math.abs(end - start) + 1 !== selected.length) {

  } else {
    Array.prototype.map.call(selected, function(seat) {
      setSeatNo(seat, idx);
      idx+= start < end ? 1 : -1;
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

function postSortRows(svg) {
  var sectors = svg.querySelectorAll('[tc-sector-name]');
  Array.prototype.forEach.call(sectors, function(sector) {
    var arr = Array.prototype.slice.call(sector.querySelectorAll('[tc-row-no]'));
    arr.sort(rowsCompareRowNo);
    appendSortedNodes(arr, sector);
  });
}

function postSortSeats(svg, params) {
  var rows;
  if (params.order === 'ltr') {
    rows = svg.querySelectorAll('[tc-row-no]');

    Array.prototype.forEach.call(rows, function(row) {
      var seats = row.querySelectorAll('[tc-seat-no]');
      var arr;

      arr = Array.prototype.slice.call(seats);
      arr.sort(seatsCompareSeatNoLtr);
      appendSortedNodes(arr, row);
    });
  }
}

function postProcess(svg, params) {
  postSortSeats(svg, params);
  postSortRows(svg);
}

chrome.runtime.onMessage.addListener(function(msg, sender, response) {
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
      postProcess(svg, {order: msg.subject.order});
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
  } else if (sector.querySelectorAll('g').length !== sector.children.length) {
    return 'Неверный элемент вместо группы на уровне рядов';
  } else {
    return false;
  }
}

function isRowBroken(row) {
  if (row.tagName !== 'g') {
    return 'Неверный элемент вместо группы на уровне ряда';
  } else if (!row.children.length) {
    return 'Пустой ряд';
  } else {
    return false;
  }
}

function isSeatBroken(seat) {
  if (seat.tagName !== 'circle' && seat.tagName !== 'path') {
    return 'Неверный элемент на уровне места';
  } else {
    return false;
  }
}

function isAttributeSet() {
  var container = svg.getElementById('plan-container');
  return container.querySelectorAll('[tc-row-no]').length || container.querySelectorAll('[tc-seat-no]').length;
}

function isPlanCorrect(container) {

  if (!container) {
    return {error: 'Нет общей группы с id="plan-container"'};
  }

  var sectors = container.children;
  var coord = {};

  if (
    Array.prototype.some.call(sectors, function(sector, sectorIdx) {
      var rows;
      var isBroken = isSectorBroken(sector);
      if (!isBroken) {
        rows = sector.children;
        return Array.prototype.some.call(rows, function(row, rowIdx) {
          var seats;
          var isBroken = isRowBroken(row);
          if (!isBroken) {
            seats = row.children;
            return Array.prototype.some.call(seats, function(seat, seatIdx) {
              var isBroken = isSeatBroken(seat);
              if (isBroken) {
                coord.sector = sectorIdx;
                coord.row = rowIdx;
                coord.seat = seatIdx;
                coord.error = isBroken;
                return true;
              }
            });
          } else {
            coord.sector = sectorIdx;
            coord.row = rowIdx;
            coord.error = isBroken;
            return true;
          }
        });
      } else {
        coord.sector = sectorIdx;
        coord.error = isBroken;
        return true;
      }
    })
  ) {
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


function cleanMeta() {
  var sectorNameFontSize;
  var fntRegexp;
  var seats;

  for (var i = 0; i <= 2; i++) {
    try {
      fntRegexp = new RegExp('\\\.fnt' + i + '.+font-size:(\\d+)');
      sectorNameFontSize = document.getElementsByTagName('style')[0].innerHTML.match(fntRegexp)[1];
      Array.prototype.map.call(document.querySelectorAll('.fnt' + i), function(txt) {
        txt.removeAttribute('class');
        txt.setAttribute('font-family', 'Arial');
        txt.setAttribute('font-size', sectorNameFontSize);
      });
    } catch (e) {
      console.log('not found style fnt' + i);
    }
  }

  seats = document.querySelector('#plan-container').querySelectorAll('circle');
  if (seats) {
    Array.prototype.forEach.call(seats, function(seat) {
      seat.removeAttribute('class');
    });
  }
  seats = document.querySelector('#plan-container').querySelectorAll('path');
  if (seats) {
    Array.prototype.forEach.call(seats, function(seat) {
      seat.removeAttribute('class');
    });
  }
  document.querySelector('svg').setAttribute('height', '100%');
  document.querySelector('svg').setAttribute('width', '100%');
  document.querySelector('svg').removeAttribute('xml:space');
  document.querySelector('svg').removeAttribute('style');
}


function flatternTranslateTransform(row) {
  var transform = row.getAttribute('transform'),
    coords = {x: 0, y: 0},
    translateParams;

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
    flatternTranslateTransform(sector);
    Array.prototype.forEach.call(rows, function(row) {
      flatternTranslateTransform(row);
    });
  });
}


function convertPaths() {
  var paths = document.getElementById('plan-container').querySelectorAll('path');
  if (paths) {
    Array.prototype.forEach.call(paths, convertPathToCircle);
  }
}


function seatsCompare(current, next) {
  if (current.getAttribute('cx') * 1 > next.getAttribute('cx') * 1) {
    return -1;
  } else if (current.getAttribute('cx') * 1 < next.getAttribute('cx') * 1) {
    return 1;
  } else {
    return 0;
  }
}


function addSeatAttributes(seat, idx) {
  seat.setAttribute('tc-seat-no', idx + 1);
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
  var currentY = current.getElementsByTagName('circle')[Math.floor(current.getElementsByTagName('circle').length / 2)].getAttribute('cy'),
    nextY = next.getElementsByTagName('circle')[Math.floor(next.getElementsByTagName('circle').length / 2)].getAttribute('cy');

  if (currentY * 1 > nextY * 1) {
    return 1;
  } else if (currentY * 1 < nextY * 1) {
    return -1;
  } else {
    return 0;
  }
}


function sortRows(rows) {
  var arr = Array.prototype.slice.call(rows);
  var parent = rows[0].parentNode;

  arr.sort(rowsCompare);
  appendSortedNodes(arr, parent, function(row, idx) {
    row.setAttribute('tc-row-no', idx + 1);
  });
}


function sortNodes() {
  var sectors = document.getElementById('plan-container').children;

  Array.prototype.forEach.call(sectors, function(sector) {
    var rows = sector.children;

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
    if (sectorId) {
      sector.setAttribute('tc-sector-name', sectorId.replace(/_(x(\d|[a|b|c|d|e]){4})_/g, function() {
        return String.fromCharCode('0' + arguments[1]);
      }).replace('-', ' '));
    }
  });
}

function wrapChildrenWithGroup(node) {
  var g;
  g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  for (var i = 0, j = node.children.length; i < j; i++) {
    g.appendChild(node.children[0]);
  }
  //Array.prototype.map.call(node.children, function(seat) {
  //  g.appendChild(seat);
  //});
  node.appendChild(g);
  return g;
}

function wrapSingleGroups() {
  var sectors;
  var rowWithoutSector = document.getElementById('plan-container').querySelector('[id*="addsector"]');
  if (rowWithoutSector) {
    rowWithoutSector.removeAttribute('id');
    wrapChildrenWithGroup(rowWithoutSector.parentNode).setAttribute('id', 'Партер');
  } else {
    sectors = document.getElementById('plan-container').children;
    Array.prototype.forEach.call(sectors, function(sector) {
      var title = sector.getAttribute('id');
      if (/_addrow/.test(title)) {
        wrapChildrenWithGroup(sector);
        sector.setAttribute('id', title.replace('_addrow', ''));
      }
    });
  }
}

function preprocess() {
  cleanMeta();
  wrapSingleGroups();

  if (!checkStructure()) {
    return false;
  }

  cleanTransforms();
  convertPaths();
  sortNodes();
  setSectorName();

  return true;
}

if (svg) {
  if (isAttributeSet() || preprocess()) {
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

