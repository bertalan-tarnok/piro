const path = require('path');
const { build } = require('piro');
const html = require('piro/dist/html');

build({
  src: path.join(__dirname, 'src'),
  out: path.join(__dirname, 'out'),
  static: path.join(__dirname, 'static'),
  pages: 'pages',
  inject: {
    'about.html': (s = '') => {
      return html.append(s, '<p>Injected html :)</p>');
    },
  },
});
