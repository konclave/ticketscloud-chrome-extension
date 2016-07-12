function requestContentData(params, callback) {
  window.chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
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

  seatInput.focus().select();
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

window.addEventListener('DOMContentLoaded', function() {

  requestContentData({action: 'activeSeat'}, setSectorRowSeatData);

  document.querySelector('#savedata').addEventListener('click', function(e) {
    e.preventDefault();

    requestContentData({
      seat: document.getElementById('seat').value,
      row: document.getElementById('row').value,
      sector: document.getElementById('sector').value
    });

    window.close();
  });

  document.getElementById('cbcopy').addEventListener('click', function(e) {
    e.preventDefault();
    e.target.style.background = 'tomato';
    requestContentData({action: 'getSVG'}, copyToClipboard);
  });
});
