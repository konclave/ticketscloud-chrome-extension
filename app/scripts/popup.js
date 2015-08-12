(function() {
  'use strict';

  function requestContentData(params, callback) {
    window.chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
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
    var lengthNode;
    if (obj) {
      if (obj.seat) {
        document.querySelector('#seat').previousSibling.previousSibling.innerHTML = 'Номер места';
        document.querySelector('#seat').setAttribute('value', obj.seat);
      } else {
        document.querySelector('#seat').previousSibling.previousSibling.innerHTML = 'Диапазон мест (через двоеточие)';
        document.querySelector('#seat').setAttribute('value', '');
      }

      lengthNode = document.getElementById('len');
      if (lengthNode && obj.range) {
        lengthNode.innerHTML = obj.range;
      }

      document.querySelector('#row').setAttribute('value', obj.row);
      document.querySelector('#sector').value = obj.sector || '';
      document.querySelector('#savedata').removeAttribute('disabled');
    } else {
      document.querySelector('#savedata').setAttribute('disabled', true);
    }
  }

  function copyToClipboard(text) {
    var copyDiv = document.createElement('textarea');
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
      var radios = document.querySelectorAll('input[name="order"]');
      var order;

      Array.prototype.forEach.call(radios, function(radio) {
        if (radio.checked) {
          order = radio.value;
        }
      });

      e.preventDefault();
      e.target.style.background = 'tomato';
      requestContentData({action: 'getSVG', order: order}, copyToClipboard);
    });
  });
})();
