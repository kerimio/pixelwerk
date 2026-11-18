/* ================= CODE-PRÜFUNG =================
   Die Tests einer Übung prüfen das Ergebnis. Damit man sich das Ergebnis nicht „ermogeln“ kann
   (z. B. return 3 statt rechnen), prüft die App zusätzlich, WIE der Code gebaut ist:
   Jedes Konzept aus dieser Liste, das in der Musterlösung vorkommt, aber noch nicht im Startcode,
   muss auch im eigenen Code stehen. Alternativen, die genauso richtig sind, zählen mit. */
const KONZEPTE = [
  { n: 'signal()', re: /\bsignal\s*[<(]/ },
  { n: 'computed()', re: /\bcomputed\s*[<(]/ },
  { n: 'effect()', re: /\beffect\s*\(/ },
  { n: 'linkedSignal()', re: /\blinkedSignal\s*[<(]/ },
  { n: '.set() oder .update()', re: /\.(set|update)\s*\(/ },
  { n: 'input()', re: /\binput(\.required)?\s*[<(]|@Input\s*\(/ },
  { n: 'output()', re: /\boutput\s*[<(]|@Output\s*\(/ },
  { n: 'model()', re: /\bmodel(\.required)?\s*[<(]/ },
  { n: 'inject()', re: /\binject\s*\(|constructor\s*\(\s*(private|public|readonly)/ },
  { n: 'toSignal()', re: /\btoSignal\s*\(/ },
  { n: 'toObservable()', re: /\btoObservable\s*\(/ },
  { n: 'resource / rxResource / httpResource', re: /\b(rxResource|httpResource|resource)\s*[<(]/ },
  { n: '@if', re: /@if\s*\(|\*ngIf/ },
  { n: '@for mit track', re: /@for\s*\(|\*ngFor/ },
  { n: '@switch', re: /@switch\s*\(|\[ngSwitch\]/ },
  { n: '@defer', re: /@defer\b/ },
  { n: 'ng-content', re: /<ng-content/ },
  { n: 'viewChild() / contentChild()', re: /\b(viewChild|contentChild|viewChildren|contentChildren)\s*[.<(]|@(ViewChild|ContentChild)/ },
  { n: 'Event-Binding (…)', re: /\(\w+(\.\w+)*\)\s*=\s*"/ },
  { n: 'Property-Binding […]', re: /\[[\w.-]+\]\s*=\s*"/ },
  { n: 'Interpolation {{ }}', re: /\{\{[^}]+\}\}/, schwach: true },
  { n: '.pipe()', re: /\.pipe\s*\(/ },
  { n: 'map()', re: /\bmap\s*\(\s*\(?[\w{[]/, alt: /\.map\s*\(/ },
  { n: 'filter()', re: /\bfilter\s*\(/ },
  { n: 'switchMap', re: /\bswitchMap\b/ },
  { n: 'mergeMap', re: /\bmergeMap\b/ },
  { n: 'concatMap', re: /\bconcatMap\b/ },
  { n: 'exhaustMap', re: /\bexhaustMap\b/ },
  { n: 'catchError', re: /\bcatchError\b/ },
  { n: 'retry', re: /\bretry(When)?\b/ },
  { n: 'debounceTime', re: /\bdebounceTime\b/ },
  { n: 'distinctUntilChanged', re: /\bdistinctUntilChanged\b/ },
  { n: 'takeUntilDestroyed', re: /\btakeUntilDestroyed\b|\btakeUntil\b|DestroyRef/ },
  { n: 'combineLatest', re: /\bcombineLatest\b/ },
  { n: 'forkJoin', re: /\bforkJoin\b|Promise\.all/ },
  { n: 'scan', re: /\bscan\s*\(/ },
  { n: 'startWith', re: /\bstartWith\b/ },
  { n: 'shareReplay', re: /\bshareReplay\b|\bshare\s*\(/ },
  { n: 'take()', re: /\btake\s*\(\s*\d/ },
  { n: 'tap()', re: /\btap\s*\(/ },
  { n: 'Subject', re: /\bnew\s+Subject\b/ },
  { n: 'BehaviorSubject', re: /\bBehaviorSubject\b/ },
  { n: 'ReplaySubject', re: /\bReplaySubject\b/ },
  { n: 'Observable / of / from', re: /\bnew\s+Observable\b|\bof\s*\(|\bfrom\s*\(/, schwach: true },
  { n: 'interval / timer', re: /\b(interval|timer)\s*\(/ },
  { n: '?? (Nullish Coalescing)', re: /\?\?/ },
  { n: '?. (Optional Chaining)', re: /\?\.[\w(]/ },
  { n: 'let/const statt var', re: /\b(let|const)\b/, schwach: true },
  { n: 'Kopie statt Original ändern ([...] / toSorted / slice)', re: /\[\s*\.\.\.|\btoSorted\b|\.slice\s*\(\s*\)|\{\s*\.\.\./ },
  { n: 'async / await', re: /\basync\b[\s\S]*\bawait\b/ },
  { n: 'Arrow-Function', re: /=>/, schwach: true },
  { n: 'Template-String', re: /`[^`]*\$\{/, schwach: true },
  { n: 'Schleife oder Array-Methode', re: /\bfor\s*\(|\.(forEach|reduce|map|filter|some|every|find)\s*\(/, schwach: true },
  { n: 'reduce()', re: /\.reduce\s*\(/ },
  { n: 'interface oder type', re: /\b(interface|type)\s+\w+/ },
  { n: 'Union-Typ', re: /:\s*'[^']*'\s*\|\s*'/ },
  { n: 'Generics <T>', re: /<\s*T\b/ },
  { n: 'FormGroup / FormControl', re: /\bForm(Group|Control|Builder)\b|\bfb\.(group|control)\b|nonNullable/ },
  { n: 'FormArray', re: /\bFormArray\b|\.array\s*\(/ },
  { n: 'Validators', re: /\bValidators\.|ValidatorFn|ValidationErrors/ },
  { n: 'Guard (canActivate / CanActivateFn)', re: /\bcanActivate(Child)?\b|CanActivateFn|canMatch/ },
  { n: 'Lazy Loading (loadComponent / loadChildren)', re: /\bload(Component|Children)\b/ },
  { n: 'Route-Parameter', re: /:\w+'|withComponentInputBinding|ActivatedRoute|paramMap/ },
  { n: 'HttpClient', re: /\bHttpClient\b|\bhttp\.(get|post|put|delete|patch)\b/ },
  { n: 'Interceptor', re: /HttpInterceptorFn|intercept\s*\(|withInterceptors/ },
  { n: 'OnPush', re: /ChangeDetectionStrategy\.OnPush/ },
  { n: '@Pipe', re: /@Pipe\s*\(/ },
  { n: '@Directive', re: /@Directive\s*\(/ },
  { n: 'host / HostListener', re: /\bhost\s*:|@HostListener|@HostBinding/ },
  { n: '@Service / providers', re: /providedIn|providers\s*:|@Service\s*\(/ },
  { n: 'InjectionToken', re: /\bInjectionToken\b/ },
  { n: 'Test mit expect()', re: /\bexpect\s*\(/ },
  { n: 'TestBed', re: /\bTestBed\b/ },
  { n: 'alt-Text', re: /\balt\s*=\s*"[^"]/ },
  { n: '<label>', re: /<label\b/ },
  { n: '<button>', re: /<button\b/ },
  { n: 'aria-…', re: /\baria-\w+/ },
  { n: 'throw / Fehlerbehandlung', re: /\bthrow\b|\bcatch\s*\(|catchError/ },
  { n: 'if / Bedingung', re: /\bif\s*\(|\?[^?.:]+:/, schwach: true },
];
/* Was in der Lösung bewusst verschwindet (z. B. var bei der Bug-Jagd) */
const VERBOTEN = [
  { n: 'kein var', re: /\bvar\s+\w/ },
  { n: 'kein || als Standardwert für Zahlen', re: /\|\|\s*\d/ },
  { n: 'kein Abo im Abo', re: /\.subscribe\([^)]*=>[^;]*\.subscribe\(/ },
  { n: 'kein setTimeout als Trick', re: /\bsetTimeout\s*\(/ }
];
const ohneKommentare = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
/* Was die Musterlösung neu einführt, gegenüber dem Startcode */
function geforderteKonzepte(ex) {
  if (!ex || !ex.solution) return [];
  if (ex.konzepte) return KONZEPTE.filter(k => ex.konzepte.includes(k.n));
  const l = ohneKommentare(ex.solution), s = ohneKommentare(ex.starter);
  return KONZEPTE.filter(k => !k.schwach && k.re.test(l) && !k.re.test(s) && !(k.alt && k.alt.test(s)));
}
/* Fest eingetragene Ergebnisse: eine Funktion, die nur ein Literal zurückgibt, obwohl die Lösung rechnet */
function nurLiteral(src, name) {
  const m = new RegExp('(?:function\\s+' + name + '\\s*\\([^)]*\\)[^{]*\\{|' + name + '\\s*(?:=|:)\\s*(?:\\([^)]*\\)|\\w+)\\s*(?::[^=]+)?=>\\s*\\{?)([\\s\\S]*?)\\n\\}', 'm').exec(src);
  if (!m) return false;
  const body = m[1].trim().replace(/;$/, '');
  return /^(return\s+)?(-?\d+(\.\d+)?|'[^']*'|"[^"]*"|true|false|\[[^\]]*\]|\{[^}]*\})\s*;?$/.test(body);
}
function codePruefungen(ex) {
  const req = geforderteKonzepte(ex);
  const tests = [];
  if (req.length) tests.push({ name: 'Code-Check: ' + req.map(k => k.n).join(', '), code: true, run: T => {
    const c = ohneKommentare(T.src);
    const fehlt = req.filter(k => !k.re.test(c));
    T.ok(!fehlt.length, 'Das Ergebnis allein reicht nicht: Die Aufgabe übt ' + fehlt.map(k => k.n).join(', ') + '. Das fehlt noch in deinem Code.');
  } });
  const st = ohneKommentare(ex && ex.starter), sol0 = ohneKommentare(ex && ex.solution);
  const weg = VERBOTEN.filter(k => k.re.test(st) && !k.re.test(sol0));
  if (weg.length) tests.push({ name: 'Code-Check: ' + weg.map(k => k.n).join(', '), code: true, run: T => {
    const da = weg.filter(k => k.re.test(ohneKommentare(T.src)));
    T.ok(!da.length, da.map(k => k.n).join(', ') + ': Genau das ist hier der Fehler. Das Ergebnis passt vielleicht, aber der Code muss es anders lösen.');
  } });
  const sol = sol0;
  const namen = [...sol.matchAll(/export\s+function\s+(\w+)/g)].map(m => m[1]).filter(n => !nurLiteral(sol, n));
  if (namen.length) tests.push({ name: 'Code-Check: Ergebnis wird berechnet, nicht fest eingetragen', code: true, run: T => {
    const c = ohneKommentare(T.src);
    const fest = namen.filter(n => nurLiteral(c, n));
    T.ok(!fest.length, (fest.join(', ')) + ' gibt nur einen festen Wert zurück. Rechne das Ergebnis aus den Eingaben aus, statt es hinzuschreiben.');
  } });
  return tests;
}
