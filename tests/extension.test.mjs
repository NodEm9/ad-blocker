import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../extension');
const get = (name) => readFileSync(resolve(root, name), 'utf8');
const manifest = JSON.parse(get('manifest.json'));
const rules = JSON.parse(get('rules/ads.json'));

test('Manifest V3 and minimal permissions', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual([...manifest.permissions].sort(), ['declarativeNetRequest', 'storage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://mail.google.com/*']);
  assert.ok(!get('manifest.json').includes('<all_urls>'));
});

test('every referenced package asset exists', () => {
  const refs = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap((item) => [...item.js, ...item.css]),
    ...manifest.declarative_net_request.rule_resources.map(({path}) => path)
  ];
  for (const ref of refs) assert.ok(existsSync(resolve(root, ref)), `${ref} missing`);
});

test('ad rules only block third-party requests without affecting top-level navigation', () => {
  assert.ok(rules.length >= 5);
  const ids = rules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const rule of rules) {
    assert.equal(rule.action.type, 'block');
    assert.equal(rule.condition.domainType, 'thirdParty');
    assert.ok(rule.condition.urlFilter.startsWith('||'));
    assert.ok(!rule.condition.resourceTypes.includes('main_frame'));
  }
});

test('JavaScript parses without a bundler or dependencies', () => {
  for (const file of ['background.js', 'gmail/privacy.js', 'popup/popup.js']) {
    assert.doesNotThrow(() => new vm.Script(get(file), {filename:file}));
  }
});

test('Gmail concealment is opt-in and scoped to Gmail CSS', () => {
  const js = get('gmail/privacy.js');
  const css = get('gmail/privacy.css');
  assert.ok(js.includes('[STORAGE_KEY]: false'));
  assert.ok(css.includes('html[data-dongo-gmail-private] .a3s'));
  assert.ok(!css.includes('display: none'));
  assert.ok(!js.includes('fetch('));
});

test('Gmail preference is applied and updated without extracting message contents', async () => {
  const attributes = new Set();
  let onChanged;
  const context = {
    document: { documentElement: {
      toggleAttribute: (name, enabled) => enabled ? attributes.add(name) : attributes.delete(name)
    }},
    chrome: { storage: {
      local: { get: async () => ({ gmailPrivacyEnabled: true }) },
      onChanged: { addListener: (listener) => { onChanged = listener; } }
    }},
    console,
  };
  vm.runInNewContext(get('gmail/privacy.js'), context);
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(attributes.has('data-dongo-gmail-private'));
  onChanged({gmailPrivacyEnabled: {newValue: false}}, 'local');
  assert.ok(!attributes.has('data-dongo-gmail-private'));
  onChanged({gmailPrivacyEnabled: {newValue: true}}, 'sync');
  assert.ok(!attributes.has('data-dongo-gmail-private'));
});

test('popup initializes and persists toggled ad/Gmail preferences', async () => {
  const makeElement = () => ({
    checked: false, disabled: true, textContent: '',
    listeners: {}, classList: {toggle() {}},
    addEventListener(name, fn) { this.listeners[name] = fn; },
  });
  const elements = Object.fromEntries(['#ads-toggle','#gmail-toggle','#status'].map(id => [id,makeElement()]));
  const changes = [];
  let enabled = ['dongo_ads'];
  const saved = {};
  const context = {
    document: {querySelector: (selector) => elements[selector]},
    console,
    chrome: {
      declarativeNetRequest: {
        getEnabledRulesets: async () => enabled,
        updateEnabledRulesets: async (req) => {
          changes.push(req);
          enabled = req.enableRulesetIds ? ['dongo_ads'] : [];
        }
      },
      storage: {local: {
        get: async () => ({gmailPrivacyEnabled: false}),
        set: async (values) => Object.assign(saved, values)
      }}
    }
  };
  vm.runInNewContext(get('popup/popup.js'), context);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(elements['#ads-toggle'].checked, true);
  assert.equal(elements['#ads-toggle'].disabled, false);
  assert.equal(elements['#gmail-toggle'].checked, false);
  elements['#ads-toggle'].checked = false;
  await elements['#ads-toggle'].listeners.change();
  assert.equal(saved.adsEnabled, false);
  assert.equal(enabled.length, 0);
  assert.deepEqual(Array.from(changes[0].disableRulesetIds), ['dongo_ads']);
  elements['#gmail-toggle'].checked = true;
  await elements['#gmail-toggle'].listeners.change();
  assert.equal(saved.gmailPrivacyEnabled, true);
  assert.equal(elements['#gmail-toggle'].disabled, false);
});

test('background restores disabled filtering preference after update', async () => {
  let installedHandler;
  let lastRequest;
  const context = {
    chrome: {
      runtime: {onInstalled: {addListener: (fn) => {installedHandler = fn;}}},
      storage: {local: {get: async () => ({adsEnabled: false})}},
      declarativeNetRequest: {updateEnabledRulesets: async (req) => {lastRequest=req;}}
    },
    console
  };
  vm.runInNewContext(get('background.js'), context);
  installedHandler();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(Array.from(lastRequest.disableRulesetIds), ['dongo_ads']);
});
