import '../styles/main.css';

function requestContentData(params, callback) {
  window.chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (callback) {
      window.chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'popup', subject: params}, callback);
    } else {
      window.chrome.tabs.sendMessage(
        tabs[0].id,
        {from: 'popup', subject: params});
    }
  });
}

function setSectorRowSeatData(obj) {
  const seatInput = document.querySelector('#seat');
  if (obj) {
    if (obj.seat) {
      seatInput.previousSibling.previousSibling.innerHTML = 'Номер места';
      seatInput.setAttribute('value', obj.seat);
    } else {
      seatInput.previousSibling.previousSibling.innerHTML = 'Диапазон мест (через двоеточие)';
      seatInput.setAttribute('value', '');
    }

    const lengthNode = document.getElementById('len');
    if (lengthNode && obj.range) {
      lengthNode.innerHTML = obj.range;
    }

    document.querySelector('#row').setAttribute('value', obj.row);
    document.querySelector('#sector').value = obj.sector || '';
    document.querySelector('#savedata').removeAttribute('disabled');
  } else {
    document.querySelector('#savedata').setAttribute('disabled', true);
  }

  seatInput.focus();
  seatInput.select();
}

function copyToClipboard(text) {
  const copyDiv = document.createElement('textarea');
  document.body.appendChild(copyDiv);
  copyDiv.value = text;
  copyDiv.focus();
  document.execCommand('SelectAll');
  document.execCommand('Copy', false, null);
  document.body.removeChild(copyDiv);
}

function attachEventHandlers() {
  document.querySelector('form').addEventListener('submit', (e) => {
    let data;
    e.preventDefault();
    if (document.querySelector('form').dataset.complex) {
      data = {
        title: document.querySelector('#sector').value,
        link: document.querySelector('#link').value
      };
    } else {
      data = {
        seat: document.getElementById('seat').value,
        row: document.getElementById('row').value,
        sector: document.getElementById('sector').value
      };
    }
    requestContentData(data);
    window.close();
  });

  document.getElementById('cbcopy').addEventListener('click', (e) => {
    e.preventDefault();
    e.target.style.background = 'tomato';
    requestContentData({action: 'getSVG'}, copyToClipboard);
  });

  document.querySelector('#zoomin').addEventListener('click', () => {
    requestContentData({action: 'zoomin'});
  });

  document.querySelector('#zoomout').addEventListener('click', () => {
    requestContentData({action: 'zoomout'});
  });
}

function processData(data) {
  if (data.isComplex) {
    document.querySelector('form').dataset.complex = true;
    const sectorInput = document.querySelector('#sector');
    Array.prototype.forEach.call(document.querySelectorAll('.simple'), (node) => node.classList.add('hidden'));
    Array.prototype.forEach.call(document.querySelectorAll('.complex'), (node) => node.classList.remove('hidden'));
    sectorInput.focus();
    sectorInput.select();

    if (data.sectors.length === 1) {
      document.querySelector('#sector').value = data.sectors[0].sectorTitle;
      document.querySelector('#link').value = data.sectors[0].svgLink;
    }
  } else {
    document.querySelector('form').removeAttribute('data-complex');
    Array.prototype.forEach.call(document.querySelectorAll('.simple'), (node) => node.classList.remove('hidden'));
    Array.prototype.forEach.call(document.querySelectorAll('.complex'), (node) => node.classList.add('hidden'));

    setSectorRowSeatData(data);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  requestContentData({action: 'getData'}, processData);
  attachEventHandlers();
});
