// Baut vendor/angular.js: echtes Angular (+ RxJS) als ein Bündel für den Browser.
// Nur nötig, wenn du die Angular-Version wechseln willst:  npm install && npm run vendor
// Danach liegt alles in vendor/ (angular.js + codemirror.css), die App braucht dann kein npm install mehr.
const esbuild = require('esbuild');
const path = require('path');
const root = path.join(__dirname, '..');
const pkgs = {
  core: '@angular/core', compiler: '@angular/compiler', common: '@angular/common', http: '@angular/common/http',
  httpTesting: '@angular/common/http/testing', coreTesting: '@angular/core/testing', rxjsInterop: '@angular/core/rxjs-interop',
  platformBrowser: '@angular/platform-browser', platformBrowserTesting: '@angular/platform-browser/testing',
  router: '@angular/router', routerTesting: '@angular/router/testing', forms: '@angular/forms', formsSignals: '@angular/forms/signals',
  rxjs: 'rxjs', rxjsOperators: 'rxjs/operators'
};
const entry = "import '@angular/compiler';\n" + Object.entries(pkgs).map(([k, p]) => `import * as ${k} from '${p}';`).join('\n') +
  `\nexport const version = core.VERSION.full;\nexport { ${Object.keys(pkgs).join(', ')} };\n`;
const v = require(path.join(root, 'node_modules/@angular/core/package.json')).version;
esbuild.build({
  stdin: { contents: entry, resolveDir: root, loader: 'js' },
  bundle: true, format: 'iife', globalName: 'ngVendor', minify: true, legalComments: 'none', target: 'es2022',
  banner: { js: `/* Angular ${v} + RxJS, gebündelt mit scripts/vendor.js. Lizenzen: Angular MIT (angular.dev/license), RxJS Apache-2.0 (rxjs.dev). Volltexte: THIRD-PARTY-NOTICES.md */` },
  outfile: path.join(root, 'vendor', 'angular.js')
}).then(() => {
  const kb = Math.round(require('fs').statSync(path.join(root, 'vendor', 'angular.js')).size / 1024);
  console.log('vendor/angular.js gebaut: Angular ' + v + ', ' + kb + ' KB');
  require('fs').writeFileSync(path.join(root, 'vendor', 'codemirror.css'), '/* CodeMirror ' + require('codemirror/package.json').version + ', Copyright (C) 2017 by Marijn Haverbeke and others. Lizenz: MIT. Volltext: THIRD-PARTY-NOTICES.md */\n' + require('fs').readFileSync(require.resolve('codemirror/lib/codemirror.css'), 'utf8'));
  console.log('vendor/codemirror.css kopiert');
});
