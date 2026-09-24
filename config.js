var DEFAULTS = {
    difficulty: false,
    acceptanceRate: false,
    lockedQuestions: false,
    constraints: false
};

document.addEventListener('DOMContentLoaded', () => {
    var container = document.getElementById('container'),
        keys = Object.keys(DEFAULTS);

    chrome.storage.sync.get('lc_options', (items) => {
        var opts = Object.assign({}, DEFAULTS, items.lc_options);

        keys.forEach((key) => {
            document.getElementById(key).checked = opts[key];
        });
    });

    // The content script listens for storage changes, so saving is enough to
    // update any open LeetCode tabs.
    container.addEventListener('change', () => {
        var options = {};

        keys.forEach((key) => {
            options[key] = document.getElementById(key).checked;
        });

        chrome.storage.sync.set({lc_options: options});
    });
});
