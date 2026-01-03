/**
 * Background service worker
 * Handles extension lifecycle and message passing
 */

// Initialize extension on install/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings on first install
        chrome.storage.sync.set({
            defaultSpeed: 2.3,
            genreSpeeds: {
                Music: 1,
                Comedy: 1,
            },
            channelSpeeds: {},
            disabledVideoIds: {},
        });
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.sync.get(null, (settings) => {
            sendResponse(settings);
        });
        return true; // Will respond asynchronously
    }

    if (request.action === 'updateSettings') {
        chrome.storage.sync.set(request.settings, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});
