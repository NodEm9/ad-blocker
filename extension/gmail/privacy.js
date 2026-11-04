'use strict';

// This feature ONLY changes visual presentation in this browser tab.
// It does not encrypt, delete, or protect the underlying Gmail message data.
(() => {
  const STORAGE_KEY = 'gmailPrivacyEnabled';
  const ATTRIBUTE = 'data-dongo-gmail-private';

  function applyPrivacyMode(enabled) {
    document.documentElement.toggleAttribute(ATTRIBUTE, enabled === true);
  }

  chrome.storage.local.get({ [STORAGE_KEY]: false })
    .then((settings) => applyPrivacyMode(settings[STORAGE_KEY]))
    .catch((error) => console.warn('Dongo could not read Gmail mode:', error));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !Object.hasOwn(changes, STORAGE_KEY)) return;
    applyPrivacyMode(changes[STORAGE_KEY].newValue);
  });
})();
