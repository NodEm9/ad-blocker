'use strict'

// Chrome resets static rulesets to the manifest defaults on extension updates.
// Restore the user's recorded choice after install/update.
const RULESET_ID = 'dongo_ads'

chrome.runtime.onInstalled.addListener(() => {
  void restoreAdBlockingPreference()
})

async function restoreAdBlockingPreference () {
  try {
    const { adsEnabled = true } = await chrome.storage.local.get({
      adsEnabled: true
    })
    await chrome.declarativeNetRequest.updateEnabledRulesets(
      adsEnabled
        ? { enableRulesetIds: [RULESET_ID] }
        : { disableRulesetIds: [RULESET_ID] }
    )
  } catch (error) {
    console.error('Dongo could not restore ad-blocking settings:', error)
  }
}
