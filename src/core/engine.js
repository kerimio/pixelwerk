/* ===== Echtes Angular für die Übungen =====
   Die Übungen laufen gegen das echte Angular (vendor/angular.js, gebündelt mit scripts/vendor.js):
   echter JIT-Compiler, echte Signals, echte DI, echtes HttpClient, Router, Forms und TestBed. Zoneless, wie neue Angular-Apps.
   Diese Datei liefert nur das Drumherum: ein Root-Injector pro Testlauf, ein Fake-Backend für HttpClient,
   mount() für Komponenten und Hilfen für die Tests. */
function ngV() {
  if (!window.ngVendor) throw new Error('Angular ist nicht geladen (vendor/angular.js fehlt). Starte die App mit npm start oder öffne index.html im Repo-Ordner.');
  return window.ngVendor;
}
if (window.ngVendor && !window.rxjs) window.rxjs = Object.assign({}, window.ngVendor.rxjs, { operators: window.ngVendor.rxjsOperators });

/* Einmal pro Seite: Plattform + TestBed-Umgebung. Es darf nur eine Angular-Plattform geben, darum teilen sich alle Läufe diese. */
let NG_PLATFORM = null;
function ngPlatform() {
  if (NG_PLATFORM) return NG_PLATFORM;
  const V = ngV();
  V.coreTesting.TestBed.initTestEnvironment(V.platformBrowserTesting.BrowserTestingModule, V.platformBrowserTesting.platformBrowserTesting(), { teardown: { destroyAfterEach: true } });
  NG_PLATFORM = V.core.getPlatform();
  return NG_PLATFORM;
}

/* Prüft, ob etwas ein Signal / computed / beschreibbares Signal / output ist (für die Tests) */
function ngKind(x) {
  const V = window.ngVendor; if (!V || typeof x !== 'function' && typeof x !== 'object' || !x) return {};
  const sig = V.core.isSignal(x);
  const node = sig ? x[V.core.ɵSIGNAL || Object.getOwnPropertySymbols(x).find(s => String(s) === 'Symbol(SIGNAL)')] : null;
  return {
    signal: sig,
    computed: !!(node && typeof node.computation === 'function' && !('source' in node)),
    writable: sig && typeof x.set === 'function',
    output: !!(x && typeof x.emit === 'function' && typeof x.subscribe === 'function')
  };
}

function createNg() {
  const V = ngV(); const core = V.core, rx = V.rxjs;
  const platform = ngPlatform();
  const logs = [], fixtures = new Set(), envs = [];
  function log(level, msg) { logs.push({ level, msg }); if (api.onLog) api.onLog(level, msg); }
  let problems = [];
  const errorHandler = { handleError: e => { problems.push(e); log('error', 'ERROR ' + (e && e.message || e)); } };

  /* ---------- Fake-Backend: HttpClient ist echt, nur die Antworten kommen aus backend.routes ---------- */
  const backend = { routes: {}, calls: [], delay: 30 };
  const H = V.http;
  class FakeBackend {
    handle(req) {
      return new rx.Observable(sub => {
        const url = req.urlWithParams; backend.calls.push({ method: req.method, url, body: req.body });
        const t = setTimeout(() => {
          const filePath = url.split('?')[0], q = new URLSearchParams(url.split('?')[1] || '');
          const h = backend.routes[req.method + ' ' + filePath] || backend.routes[filePath];
          const fail = (status, text, error) => sub.error(new H.HttpErrorResponse({ status, statusText: text, url, error }));
          if (!h) return fail(404, 'Not Found', 'Http 404: ' + url);
          try {
            const res = typeof h === 'function' ? h({ q, body: req.body, url, req }) : h;
            if (res && res.ɵerror) return fail(res.ɵerror.status || 500, res.ɵerror.message || 'Error', res.ɵerror);
            sub.next(new H.HttpResponse({ status: 200, statusText: 'OK', url, body: res === undefined ? null : JSON.parse(JSON.stringify(res)) })); sub.complete();
          } catch (e) { fail(500, 'Server Error', e && e.message || String(e)); }
        }, backend.delay);
        return () => clearTimeout(t);
      });
    }
  }
  const fakeBackend = new FakeBackend();

  /* ---------- Injectoren ---------- */
  const base = () => [
    core.importProvidersFrom(V.platformBrowser.BrowserModule),
    core.provideZonelessChangeDetection(),
    H.provideHttpClient(),
    { provide: core.ErrorHandler, useValue: errorHandler }
  ];
  const ending = () => [{ provide: H.HttpBackend, useValue: fakeBackend }];
  function newerEnv(providers, parent) {
    const env = core.createEnvironmentInjector(parent ? [].concat(providers || [], ending()) : [].concat(base(), providers || [], ending()), parent || platform.injector, 'Übung');
    envs.push(env); return env;
  }
  /* Root: Provider lassen sich vor der ersten Benutzung noch ergänzen (root.add) */
  const rootProv = []; let rootEnv = null;
  const root = {
    add(p) { if (rootEnv) throw new Error('root.add() geht nur vor dem ersten inject().'); rootProv.push(p); },
    env() { return rootEnv || (rootEnv = newerEnv(rootProv)); },
    get(t, o) { return root.env().get(t, o); }
  };
  /* new ng.Injector(parent, providers): eigener Injector, z. B. mit den appProviders der Übung */
  function Injector(parent, providers) { return newerEnv(providers, parent && parent.env ? parent.env() : parent || null); }
  const envOf = i => !i ? root.env() : i.env ? i.env() : i;

  /* ---------- Komponenten anzeigen ---------- */
  function throwErrors() { if (problems.length) { const e = problems[0]; problems = []; throw e; } }
  function tickAll() { envs.forEach(env => { try { const a = env.get(core.ApplicationRef, null); if (a && !a.destroyed) a.tick(); } catch (e) { errorHandler.handleError(e); } }); }
  async function flush(ms) {
    await new Promise(r => setTimeout(r, ms || 0));
    tickAll(); await Promise.resolve();
  }
  function mount(cls, opts) {
    opts = opts || {};
    const env = envOf(opts.injector);
    const host = opts.host || document.createElement('div');
    const appRef = env.get(core.ApplicationRef);
    let ref;
    problems = [];
    try { ref = core.createComponent(cls, { environmentInjector: env, hostElement: host }); }
    catch (e) { if (opts.onError) { opts.onError(e); return null; } throw e; }
    if (opts.inputs) for (const k in opts.inputs) ref.setInput(k, opts.inputs[k]);
    appRef.attachView(ref.hostView);
    const f = {
      ref, instance: ref.instance, host, onError: opts.onError,
      render() { ref.injector.get(core.ChangeDetectorRef).markForCheck(); appRef.tick(); if (!f.onError) throwErrors(); else if (problems.length) { f.onError(problems[0]); problems = []; } return f; },
      text() { return host.textContent.replace(/\s+/g, ' ').trim(); },
      q(s) { return host.querySelector(s); }, qa(s) { return Array.from(host.querySelectorAll(s)); },
      click(s) { const e = typeof s === 'string' ? host.querySelector(s) : s; if (!e) throw new Error('Kein Element gefunden für "' + s + '"'); e.click(); return flush(); },
      type(s, value) { const e = typeof s === 'string' ? host.querySelector(s) : s; if (!e) throw new Error('Kein Eingabefeld gefunden für "' + s + '"'); e.value = value; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return flush(); },
      setInput(k, val) { ref.setInput(k, val); return flush(); },
      destroy() { fixtures.delete(f); try { appRef.detachView(ref.hostView); } catch (e) {} ref.destroy(); }
    };
    fixtures.add(f);
    f.render();
    return f;
  }
  function runInInjectionContext(inj, fn) { return core.runInInjectionContext(envOf(inj), fn); }

  /* ---------- Module für require() im Übungscode ---------- */
  const modules = {
    '@angular/core': core, '@angular/common': V.common,
    '@angular/common/http': H, '@angular/common/http/testing': V.httpTesting,
    '@angular/core/rxjs-interop': V.rxjsInterop, '@angular/core/testing': V.coreTesting,
    '@angular/platform-browser': V.platformBrowser, '@angular/platform-browser/testing': V.platformBrowserTesting,
    '@angular/router': Object.assign({}, V.router, { matchRoute }), '@angular/router/testing': V.routerTesting, '@angular/forms': V.forms, '@angular/forms/signals': V.formsSignals,
    'rxjs': rx, 'rxjs/operators': V.rxjsOperators, 'vitest': miniVitest().mod
  };
  const tb = {
    resetTestingModule() { try { V.coreTesting.TestBed.resetTestingModule(); } catch (e) {} },
    TestBed: V.coreTesting.TestBed
  };
  const api = {
    core, modules, root, mount, flush, backend, logs, log, inject: (t, o) => root.get(t, o), runInInjectionContext, fixtures, onLog: null, Injector, ɵtb: tb,
    destroy() {
      fixtures.forEach(f => { try { f.destroy(); } catch (e) {} });
      envs.splice(0).forEach(e => { try { e.destroy(); } catch (x) {} });
      tb.resetTestingModule();
    }
  };
  return api;
}

/* Route-Konfiguration auswerten (für Tests: welche Route trifft eine Adresse?). Reine Hilfe, kein Router. */
function matchRoute(routes, url, depth) {
  const segs = String(url).split('?')[0].split('/').filter(Boolean);
  function walk(list, rest, params, chain) {
    for (const r of list || []) {
      const p = (r.path || '').split('/').filter(Boolean);
      if (r.path === '**') return { route: r, params, chain: chain.concat(r) };
      if ((r.pathMatch === 'full' || (!r.children && !r.loadChildren)) && p.length !== rest.length) continue;
      if (p.length > rest.length) continue;
      const np = Object.assign({}, params); let ok = true;
      p.forEach((x, i) => { if (x[0] === ':') np[x.slice(1)] = rest[i]; else if (x !== rest[i]) ok = false; });
      if (!ok) continue;
      if (r.redirectTo != null) return { redirect: typeof r.redirectTo === 'string' ? r.redirectTo : String(r.redirectTo()), route: r, params: np, chain: chain.concat(r) };
      if (r.children) { const m = walk(r.children, rest.slice(p.length), np, chain.concat(r)); if (m) return m; continue; }
      return { route: r, params: np, chain: chain.concat(r) };
    }
    return null;
  }
  const m = walk(routes, segs, {}, []);
  if (m && m.redirect != null && (depth || 0) < 5) { const to = m.redirect.startsWith('/') ? m.redirect : '/' + m.redirect; const n = matchRoute(routes, to, (depth || 0) + 1); return n ? Object.assign({ redirectedTo: to }, n) : null; }
  return m;
}

/* ===== Running user code ===== */
let TS_PROMISE = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Konnte ' + src + ' nicht laden')); document.head.appendChild(s); }); }
function loadTS() {
  if (window.ts) return Promise.resolve(window.ts);
  if (!TS_PROMISE) TS_PROMISE = loadScript('https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.js').then(() => window.ts).catch(e => { TS_PROMISE = null; throw e; });
  return TS_PROMISE;
}
/* TypeScript-Transformer: macht Signal-APIs (input, model, output, viewChild ...) für den Angular-JIT-Compiler sichtbar,
   wie es die Angular CLI im JIT-Modus auch tut. Hängt an jedes solche Feld einen passenden Dekorator. */
function ngJitTransform(ts) {
  const f = ts.factory;
  const QUERIES = { viewChild: 'ViewChild', viewChildren: 'ViewChildren', contentChild: 'ContentChild', contentChildren: 'ContentChildren' };
  const isNgClass = node => (ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : []).some(d => ts.isCallExpression(d.expression) && ts.isIdentifier(d.expression.expression) && /^(Component|Directive)$/.test(d.expression.expression.text));
  const ref = name => f.createPropertyAccessExpression(f.createIdentifier('ɵngJit'), name);
  const obj = props => f.createObjectLiteralExpression(Object.entries(props).filter(([, v]) => v).map(([k, v]) => f.createPropertyAssignment(k, v)));
  const lit = v => typeof v === 'boolean' ? (v ? f.createTrue() : f.createFalse()) : f.createStringLiteral(v);
  const optAlias = o => { if (!o || !ts.isObjectLiteralExpression(o)) return null; const p = o.properties.find(p => p.name && p.name.text === 'alias' && ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer)); return p ? p.initializer.text : null; };
  function deco(prop) {
    const init = prop.initializer; if (!init || !ts.isCallExpression(init) || !ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) return null;
    const name = prop.name.text; let fn = init.expression, required = false;
    if (ts.isPropertyAccessExpression(fn) && fn.name.text === 'required') { required = true; fn = fn.expression; }
    if (!ts.isIdentifier(fn)) return null;
    const a = init.arguments, k = fn.text;
    const call = (dec, arg) => f.createDecorator(f.createCallExpression(ref(dec), undefined, arg ? [arg] : []));
    if (k === 'input') { const alias = optAlias(required ? a[0] : a[1]) || name; return [call('Input', obj({ isSignal: lit(true), alias: lit(alias), required: lit(required), transform: f.createIdentifier('undefined') }))]; }
    if (k === 'model') { const alias = optAlias(required ? a[0] : a[1]) || name; return [call('Input', obj({ isSignal: lit(true), alias: lit(alias), required: lit(required) })), call('Output', lit(alias + 'Change'))]; }
    if (k === 'output' || k === 'outputFromObservable') { const alias = optAlias(k === 'output' ? a[0] : a[1]) || name; return [call('Output', lit(alias))]; }
    if (QUERIES[k] && a[0]) {
      const o = a[1] && ts.isObjectLiteralExpression(a[1]) ? a[1].properties.slice() : [];
      return [f.createDecorator(f.createCallExpression(ref(QUERIES[k]), undefined, [a[0], f.createObjectLiteralExpression(o.concat([f.createPropertyAssignment('isSignal', f.createTrue())]))]))];
    }
    return null;
  }
  /* Konstruktor-Parameter für DI sichtbar machen (wie das ctorParameters-Downleveling der Angular CLI) */
  const isDiClass = node => (ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : []).some(d => ts.isCallExpression(d.expression) && ts.isIdentifier(d.expression.expression) && /^(Component|Directive|Pipe|Injectable|Service|NgModule)$/.test(d.expression.expression.text));
  function ctorParams(node) {
    const ctor = node.members.find(m => ts.isConstructorDeclaration(m)); if (!ctor || !ctor.parameters.length) return null;
    const category = p => { const t = p.type; return t && ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName) ? f.createIdentifier(t.typeName.text) : f.createIdentifier('undefined'); };
    return f.createPropertyDeclaration([f.createModifier(ts.SyntaxKind.StaticKeyword)], 'ctorParameters', undefined, undefined,
      f.createArrowFunction(undefined, undefined, [], undefined, f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        f.createArrayLiteralExpression(ctor.parameters.map(p => f.createObjectLiteralExpression([f.createPropertyAssignment('type', category(p))])))));
  }
  return ctx => sf => {
    const visit = node => {
      if (ts.isClassDeclaration(node) && isDiClass(node) && !isNgClass(node)) {
        const cp = ctorParams(node);
        return cp ? f.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, node.members.concat([cp])) : node;
      }
      if (ts.isClassDeclaration(node) && isNgClass(node)) {
        const members = node.members.map(m => {
          if (!ts.isPropertyDeclaration(m)) return m;
          const d = deco(m); if (!d) return m;
          return f.updatePropertyDeclaration(m, (m.modifiers || []).concat(d), m.name, m.questionToken || m.exclamationToken, m.type, m.initializer);
        });
        const cp = ctorParams(node); if (cp) members.push(cp);
        return f.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members);
      }
      return ts.visitEachChild(node, visit, ctx);
    };
    return ts.visitNode(sf, visit);
  };
}

function transpile(src) {
  const ts = window.ts;
  const out = ts.transpileModule(src, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true, useDefineForClassFields: false, esModuleInterop: true }, transformers: { before: [ngJitTransform(ts)] } });
  const diags = (out.diagnostics || []).map(d => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    let line = '';
    if (d.file && d.start != null) { const lc = d.file.getLineAndCharacterOfPosition(d.start); line = 'Zeile ' + (lc.line + 1) + ': '; }
    return line + msg;
  });
  return { js: out.outputText, diags };
}
function runModule(src, ng) {
  const { js, diags } = transpile(src);
  if (diags.length) { const e = new Error('Syntax-Fehler (TypeScript):\n' + diags.join('\n')); e.kind = 'syntax'; throw e; }
  const exports = {}; const module = { exports };
  const req = name => { if (name in ng.modules) return ng.modules[name]; throw new Error('Import "' + name + '" gibt es in dieser Übung nicht.'); };
  const consoleProxy = { log: (...a) => ng.log('log', a.map(fmt).join(' ')), warn: (...a) => ng.log('warn', a.map(fmt).join(' ')), error: (...a) => ng.log('error', a.map(fmt).join(' ')), info: (...a) => ng.log('log', a.map(fmt).join(' ')) };
  new Function('require', 'exports', 'module', 'console', 'ɵngJit', js)(req, exports, module, consoleProxy, ng.core);
  return module.exports;
}
function fmt(v) { if (typeof v === 'string') return v; if (v && v.ɵsignal) return String(v); try { return JSON.stringify(v); } catch (e) { return String(v); } }

class TestFail extends Error {}
/* Mini-Vitest: führt die Tests aus, die der Lernende selbst schreibt (gegen echte oder kaputte Implementierungen). */
function miniVitest() {
  const tests = []; let prefix = []; const before = [[]], after = [[]];
  const deq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function expect(actual) {
    const mk = neg => {
      const chk = (cond, msg) => { if (neg ? cond : !cond) throw new Error((neg ? 'NICHT: ' : '') + msg); };
      return {
        toBe: e => chk(Object.is(actual, e), 'erwartet ' + JSON.stringify(e) + ', bekommen ' + JSON.stringify(actual)),
        toEqual: e => chk(deq(actual, e), 'erwartet ' + JSON.stringify(e) + ', bekommen ' + JSON.stringify(actual)),
        toStrictEqual: e => chk(deq(actual, e), 'erwartet ' + JSON.stringify(e) + ', bekommen ' + JSON.stringify(actual)),
        toBeTruthy: () => chk(!!actual, 'erwartet etwas Wahres, bekommen ' + JSON.stringify(actual)),
        toBeFalsy: () => chk(!actual, 'erwartet etwas Falsches, bekommen ' + JSON.stringify(actual)),
        toBeNull: () => chk(actual === null, 'erwartet null'), toBeUndefined: () => chk(actual === undefined, 'erwartet undefined'), toBeDefined: () => chk(actual !== undefined, 'erwartet einen Wert'),
        toBeGreaterThan: e => chk(actual > e, 'erwartet > ' + e + ', bekommen ' + actual), toBeLessThan: e => chk(actual < e, 'erwartet < ' + e + ', bekommen ' + actual),
        toBeGreaterThanOrEqual: e => chk(actual >= e, 'erwartet >= ' + e), toBeLessThanOrEqual: e => chk(actual <= e, 'erwartet <= ' + e),
        toContain: e => chk(actual != null && actual.includes(e), 'erwartet, dass ' + JSON.stringify(e) + ' enthalten ist'),
        toHaveLength: n => chk(actual != null && actual.length === n, 'erwartet Länge ' + n),
        toThrow: () => { let t = false; try { actual(); } catch (e) { t = true; } chk(t, 'erwartet einen Fehler') },
        toHaveBeenCalled: () => chk(actual && actual.mock && actual.mock.calls.length > 0, 'erwartet, dass die Funktion aufgerufen wurde (' + (actual && actual.mock ? actual.mock.calls.length : '?') + ' Aufrufe)'),
        toHaveBeenCalledTimes: n => chk(actual && actual.mock && actual.mock.calls.length === n, 'erwartet ' + n + ' Aufrufe, bekommen ' + (actual && actual.mock ? actual.mock.calls.length : '?')),
        toHaveBeenCalledWith: (...a) => chk(actual && actual.mock && actual.mock.calls.some(c => deq(c, a)), 'erwartet einen Aufruf mit ' + JSON.stringify(a) + ', bekommen ' + JSON.stringify(actual && actual.mock ? actual.mock.calls : null)),
        toMatchObject: e => chk(actual != null && Object.keys(e).every(k => deq(actual[k], e[k])), 'erwartet, dass ' + JSON.stringify(actual) + ' ' + JSON.stringify(e) + ' enthält')
      };
    };
    const o = mk(false); o.not = mk(true); return o;
  }
  const it = (name, fn) => tests.push({ name: prefix.concat(name).join(' › '), fn, before: before.slice(), after: after.slice() });
  const describe = (name, fn) => { prefix.push(name); before.push([]); after.push([]); try { fn(); } finally { prefix.pop(); before.pop(); after.pop(); } };
  const fn = impl => { const m = function (...a) { m.mock.calls.push(a); return m.ɵimpl ? m.ɵimpl.apply(this, a) : m.ɵret; }; m.mock = { calls: [] }; m.ɵimpl = impl; m.mockReturnValue = v => { m.ɵret = v; m.ɵimpl = null; return m; }; m.mockImplementation = f => { m.ɵimpl = f; return m; }; m.mockClear = () => { m.mock.calls = []; return m; }; return m; };
  const vi = { fn, spyOn: (o, k) => { const orig = o[k]; const m = fn(function (...a) { return orig.apply(o, a); }); o[k] = m; return m; } };
  return { tests, mod: { describe, it, test: it, expect, beforeEach: f => before[before.length - 1].push(f), afterEach: f => after[after.length - 1].push(f), vi } };
}
/* Module für Übungen: Objekt, oder Funktion (ng) => Objekt, wenn das Modul Angular-Teile braucht */
function applyMods(ng, mods) { for (const k in mods || {}) ng.modules[k] = typeof mods[k] === 'function' ? mods[k](ng) : mods[k]; }
async function runSuite(src, mods) {
  const ng = createNg(); const v = miniVitest();
  ng.modules['vitest'] = v.mod; applyMods(ng, mods);
  runModule(src, ng);
  const res = [];
  for (const t of v.tests) {
    ng.ɵtb.resetTestingModule();
    try { for (const h of t.before.flat()) await h(); await t.fn(); for (const h of t.after.flat()) await h(); res.push({ name: t.name, ok: true }); } catch (e) { res.push({ name: t.name, ok: false, msg: e.message }); }
  }
  ng.destroy();
  return { total: res.length, passed: res.filter(r => r.ok).length, failed: res.filter(r => !r.ok), results: res };
}
function makeT(src, ng, mod, sandbox) {
  const T = {
    src, ng, mod, rx: ng.modules.rxjs, op: ng.modules['rxjs/operators'],
    meta: cls => ((cls && cls.__annotations__) || [])[0] || {},
    routerSpy() { const R = ng.inject(ng.modules['@angular/router'].Router), list = []; R.navigate = (c, x) => { list.push(R.createUrlTree(c, x).toString()); return Promise.resolve(true); }; R.navigateByUrl = u => { list.push(String(u)); return Promise.resolve(true); }; return list; },
    isUrlTree: (r, url) => r instanceof ng.modules['@angular/router'].UrlTree && (url == null || r.toString() === url),
    isSignal: x => !!ngKind(x).signal, isComputed: x => !!ngKind(x).computed, isWritable: x => !!ngKind(x).writable, isOutput: x => !!ngKind(x).output,
    code: src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''),
    ok(c, msg) { if (!c) throw new TestFail(msg); },
    eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new TestFail(msg + '  (erwartet: ' + JSON.stringify(b) + ', bekommen: ' + JSON.stringify(a) + ')'); },
    get(name) { const v = mod[name]; if (v === undefined) throw new TestFail('Ich finde kein "export ' + name + '". Hast du es exportiert und genau so genannt?'); return v; },
    cmp(name) { const c = T.get(name); T.ok(typeof c === 'function' && c.hasOwnProperty('ɵcmp'), name + ' braucht den @Component({...})-Dekorator.'); return c; },
    mount(cls, opts) { const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:480px;opacity:0;pointer-events:none;z-index:-1'; sandbox.appendChild(host); return ng.mount(cls, Object.assign({ host }, opts || {})); },
    inject(t) { return ng.inject(t); },
    flush: ms => ng.flush(ms),
    inCtx(fn) { return ng.runInInjectionContext(ng.root, fn); },
    match(routes, url) { return ng.modules['@angular/router'].matchRoute(routes, url); },
    suite(mods) { return runSuite(src, mods); },
    has(re) { return re.test(T.code); },
    collect(obs, ms) { return new Promise((res, rej) => { const vals = []; let done = false; const sub = obs.subscribe({ next: v => vals.push(v), error: e => { done = true; res({ vals, error: e, complete: false }); }, complete: () => { done = true; res({ vals, complete: true }); } }); setTimeout(() => { if (!done) { sub.unsubscribe(); res({ vals, complete: false }); } }, ms || 200); }); }
  };
  return T;
}
async function runTests(src, tests, sandbox, setupBackend, extraMods) {
  const results = [];
  for (const t of tests) {
    const ng = createNg(); const logs = [];
    ng.onLog = (l, m) => logs.push({ l, m });
    if (setupBackend) setupBackend(ng.backend);
    if (extraMods) applyMods(ng, extraMods);
    let mod;
    try { mod = runModule(src, ng); }
    catch (e) { return { fatal: e.message, results: [] }; }
    const T = makeT(src, ng, mod, sandbox);
    try {
      const r = await Promise.race([Promise.resolve(t.run(T)), new Promise((_, rej) => setTimeout(() => rej(new TestFail('Zeitüberschreitung: der Test hat zu lange gewartet (Endlosschleife oder fehlendes complete?).')), 4000))]);
      results.push({ name: t.name, ok: r !== false, msg: r === false ? (t.fail || 'Noch nicht richtig.') : '' });
    } catch (e) {
      results.push({ name: t.name, ok: false, msg: e instanceof TestFail ? e.message : 'Fehler beim Ausführen: ' + e.message });
    }
    ng.destroy();
    sandbox.replaceChildren();
  }
  return { results };
}
