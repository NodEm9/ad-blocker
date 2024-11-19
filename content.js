// content.js

// Function to remove elements by selector
function removeElementsBySelector(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => element.remove());
}

// Common ad-related selectors
const adSelectors = [
  '.ad',
  '.ads',
  '.advertisement',
  '.sponsored',
  '#ad',
  '#ads',
  '#advertisement',
  '#sponsored'
];

// Remove ads on page load
window.addEventListener('load', () => {
  adSelectors.forEach(selector => removeElementsBySelector(selector));
});

// Observe for dynamically loaded ads
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      adSelectors.forEach(selector => removeElementsBySelector(selector));
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
