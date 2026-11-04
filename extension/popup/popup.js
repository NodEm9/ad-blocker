'use strict';

const RULESET_ID = 'dongo_ads';
const ADS_KEY = 'adsEnabled';
const GMAIL_KEY = 'gmailPrivacyEnabled';

const adsToggle = document.querySelector('#ads-toggle');
const gmailToggle = document.querySelector('#gmail-toggle');
const status = document.querySelector('#status');

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

async function initialize() {
  try {
    const [rulesets, settings] = await Promise.all([
      chrome.declarativeNetRequest.getEnabledRulesets(),
      chrome.storage.local.get({ [GMAIL_KEY]: false }),
    ]);
    adsToggle.checked = rulesets.includes(RULESET_ID);
    gmailToggle.checked = settings[GMAIL_KEY] === true;
    adsToggle.disabled = false;
    gmailToggle.disabled = false;
  } catch (error) {
    console.error(error);
    showStatus('Unable to load extension settings.', true);
  }
}

adsToggle.addEventListener('change', async () => {
  const enabled = adsToggle.checked;
  adsToggle.disabled = true;
  showStatus('Updating ad rules…');
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets(
      enabled
        ? { enableRulesetIds: [RULESET_ID] }
        : { disableRulesetIds: [RULESET_ID] }
    );
    await chrome.storage.local.set({ [ADS_KEY]: enabled });
    showStatus(enabled ? 'Ad blocking enabled.' : 'Ad blocking paused.');
  } catch (error) {
    // Recheck the actual rule state: an update may have succeeded even if
    // saving the preference failed.
    const rulesets = await chrome.declarativeNetRequest.getEnabledRulesets().catch(() => []);
    adsToggle.checked = rulesets.includes(RULESET_ID);
    console.error(error);
    showStatus('Could not save the ad-blocking setting.', true);
  } finally {
    adsToggle.disabled = false;
  }
});

gmailToggle.addEventListener('change', async () => {
  const enabled = gmailToggle.checked;
  gmailToggle.disabled = true;
  try {
    await chrome.storage.local.set({ [GMAIL_KEY]: enabled });
    showStatus(enabled ? 'Gmail screen privacy enabled.' : 'Gmail screen privacy disabled.');
  } catch (error) {
    gmailToggle.checked = !enabled;
    console.error(error);
    showStatus('Could not save the Gmail setting.', true);
  } finally {
    gmailToggle.disabled = false;
  }
});

void initialize();
