/**
 * Prints error message on top of SVG
 */
function printError(...args) {
  const svg = document.querySelector('svg');
  const error = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const texts = [];

  error.setAttribute('x', 20);
  error.setAttribute('y', 20);
  error.setAttribute('fill', 'tomato');
  error.setAttribute('stroke', 'red');
  error.setAttribute('width', svg.getBBox().width / 7);
  error.setAttribute('height', svg.getBBox().height / 20);
  g.appendChild(error);

  if (args.length) {
    Array.prototype.forEach.call(args, function(attr) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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

  texts.forEach((text) => {
    g.appendChild(text);
  });

  svg.appendChild(g);

  texts.forEach(setErrorWidth(error));
}

function setErrorWidth(error) {
  return function(text, idx) {
    const width = text.getBBox().width;
    const rectWidth = width + ((error.getAttribute('width') / 20) * 2)
      ;
    if (rectWidth > error.getAttribute('width')) {
      error.setAttribute('width', rectWidth);
    }

    text.setAttribute('y', (text.getBBox().height * (idx + 1)) + (error.getAttribute('height') / 20));
  };
}

export default {
  printError,
};
