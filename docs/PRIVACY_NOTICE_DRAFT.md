# Dongo Adblocker — Privacy notice (draft)

**Operator:** Abinod — operated by Emmanuel Abiodun Nodolomwanyi, Gelsenkirchen, Germany.
**Contact:** contact@abinod.com

This notice concerns the Chrome extension, not the privacy practices of websites you visit. Review it again when implementation or hosting changes.

## What Dongo does

Dongo uses a packaged set of browser-native filtering rules to block requests to a limited set of known third-party advertising domains. The filtering occurs in Chrome. Dongo does not operate a proxy server or send browsing histories to Abinod.

An optional Gmail screen-privacy setting applies a blur effect to message bodies displayed in Gmail. It is off by default. The extension changes local page styling; it does not copy, upload, encrypt or delete email content. The text may remain available through the page DOM, browser accessibility tools or other authenticated Gmail sessions. The visual effect may not work after Gmail layout changes.

## Data and storage

The extension stores two settings locally in Chrome: whether ad blocking is enabled and whether Gmail screen privacy is enabled. The extension does not transmit these settings to Abinod. It does not run analytics, create accounts, collect browsing histories, or send message contents to an external service.

The Gmail content script runs only on mail.google.com and reads its local feature toggle to apply browser-side styling. The ad blocker uses declarativeNetRequest rules; its JavaScript does not inspect request bodies.

## Permissions

- `declarativeNetRequest`: enable or disable the packaged network rules.
- `storage`: remember the two local switches.
- Gmail-only content script: apply optional visual concealment to Gmail pages.

## Questions

Email contact@abinod.com. For statutory operator information, see Abinod's Impressum at https://www.abinod.com/impressum/.

**Publication check:** Update this notice if analytics, sync storage, remote filter downloads, crash reporting, external services or any additional data collection are introduced. Separately verify the legal basis and disclosure requirements for the actual deployed product and website hosting.
