/* Headless smoke test for the generated client module: no browser needed.
   Verifies the factory registers, apply() builds a stylesheet, subscribes to
   the config form, registers dictionaries and mounts a single-config settings
   row (one shared image + one shared set of appearance values). */
const fs = require('node:fs');
const path = require('node:path');

const clientPath = path.join(__dirname, '..', 'client.js');
let captured;
global.window = { __ModuleLoader__: { load: (spec) => { captured = spec; } } };
new Function(fs.readFileSync(clientPath, 'utf8'))();
if (!captured) throw new Error('client module did not register a factory');

const tags = [];
global.document = {
  baseURI: 'http://127.0.0.1:54943/',
  body: { hasAttribute: () => false },
  head: { appendChild: (tag) => tags.push(tag) },
  createElement: (name) => ({
    tagName: name, dataset: {}, textContent: '',
    remove() { const i = tags.indexOf(this); if (i >= 0) tags.splice(i, 1); },
  }),
  querySelector: () => tags.find(t => t.dataset.plugin === 'custom-wallpaper') || null,
};

const React = {
  createElement: (...args) => ({ args }),
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
};
const exportsObj = captured.factory((name) => {
  if (name === 'react') return React;
  throw new Error('unexpected require: ' + name);
});

const form = {
  getSnapshot: () => ({ value: { enabled: true, fit: 'fixed', fixedWidth: 1920 }, revision: 7 }),
  subscribe: () => () => {},
  mutate: () => Promise.resolve(true),
};
const effects = [];
let capturedRow;
const ctx = {
  get: (n) => n === 'configForms' ? { get: () => form } : undefined,
  configForms: { get: () => form },
  effect: (fn, name) => { const d = fn(); effects.push([name, typeof d]); return d; },
  locale: { register: (ns, dict) => { console.log('locale:', ns, Object.keys(dict).join(',')); return () => {}; } },
  slots: {
    inject: (key, cb) => { console.log('slot inject:', key); return cb(); },
    register: (opts, Row) => { capturedRow = Row; console.log('slot register:', opts.id, typeof Row); return {}; },
  },
};

exportsObj.apply(ctx);

const css = tags[0] && tags[0].textContent;
if (!css) throw new Error('no stylesheet produced');
const checks = [
  ['light rule', /body:not\(\[data-ds-dark-theme\]\)/],
  ['dark rule', /body\[data-ds-dark-theme\]/],
  ['fixed size', /background-size: 1920px auto/],
  ['library image URL', /plugins\/dsh-wallpaper-custom\/assets\//],
  ['theme tokens', /--dsw-alias-bg-base: rgba\(/],
  ['veil', /linear-gradient\(180deg/],
  ['no placeholders', /^((?!__[A-Z_]+__).)*$/s],
];
for (const [label, re] of checks) {
  if (!re.test(css)) throw new Error('missing: ' + label);
  console.log('ok:', label);
}
// Both theme rules must reference the exact same image.
const images = [...css.matchAll(/background-image: url\((.*?)\);/g)].map(m => m[1]);
if (images.length !== 2 || images[0] !== images[1]) {
  throw new Error('themes do not share one image: ' + JSON.stringify(images));
}
console.log('ok: both themes use the same image');
console.log('effects:', effects.map(e => e[0] + '=' + e[1]).join(' | '));
console.log('css bytes:', css.length);

// Render the settings row and confirm the split-theme UI is gone.
function strings(node, out = []) {
  if (node === null || node === undefined) return out;
  if (typeof node === 'string') { out.push(node); return out; }
  if (Array.isArray(node)) { node.forEach(n => strings(n, out)); return out; }
  if (typeof node !== 'object') return out;
  if (node.args) { node.args.forEach(n => strings(n, out)); return out; }
  Object.values(node).forEach(v => strings(v, out));
  return out;
}
if (!capturedRow) throw new Error('settings row was not registered');
const rendered = JSON.stringify(capturedRow({ t: (k) => k }));
for (const stale of ['themeLight', 'themeDark', 'sameAsLight', 'darkImageSource', 'lightScrim', 'darkScrim']) {
  if (rendered.includes(stale)) throw new Error('stale split-theme UI remains: ' + stale);
}
if (!rendered.includes('sourceLibrary') || !rendered.includes('sourceUrl')) {
  throw new Error('image source select is missing');
}
console.log('ok: single shared config in settings row (no theme tabs / follow-light option)');

const clientSrc = fs.readFileSync(clientPath, 'utf8');
for (const stale of ['lightScrim', 'darkScrim', 'darkImageSource', 'sameAsLight', 'themeLight', 'themeDark']) {
  if (clientSrc.includes(stale)) throw new Error('stale identifier in client.js: ' + stale);
}
console.log('ok: no split-theme identifiers in client.js');
console.log('\nall checks passed');
