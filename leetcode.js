// Each option maps to a token in the data-lcc-hide attribute on <html> (an
// attribute rather than a class, since LeetCode overwrites the class list).
// When an option is false (i.e. the element should be hidden), its token is
// added and leetcode.css hides the matching elements. Elements that cannot be
// targeted by CSS alone are tagged with a data-lcc attribute by scan().
var DEFAULTS = {
        difficulty: false,
        acceptanceRate: false,
        lockedQuestions: false,
        constraints: false
    },
    HIDE_TOKENS = {
        difficulty: 'difficulty',
        acceptanceRate: 'acceptance',
        lockedQuestions: 'locked',
        constraints: 'constraints'
    },
    hideAttribute = '',
    DIFFICULTY_TEXT = /^(Easy|Med\.|Medium|Hard)$/,
    PERCENTAGE_TEXT = /^\d+(\.\d+)?%$/,
    // Difficulty labels whose colour classes are too generic to hide with CSS
    // alone (e.g. text-yellow), so their text is checked as well.
    DIFFICULTY_CANDIDATES = [
        '[class*="text-olive"]',
        '[class*="text-yellow"]',
        '[class*="text-pink"]',
        '[class*="lc-green"]',
        '[class*="lc-yellow"]',
        '[class*="lc-red"]',
        '[class*="difficulty"]',
        '[class*="text-sd-easy"]',
        '[class*="text-sd-medium"]',
        '[class*="text-sd-hard"]'
    ].join(','),
    applyOptions = function (options) {
        var opts = Object.assign({}, DEFAULTS, options);

        hideAttribute = Object.keys(HIDE_TOKENS).filter(function (key) {
            return !opts[key];
        }).map(function (key) {
            return HIDE_TOKENS[key];
        }).join(' ');

        ensureHideAttribute();
    },
    ensureHideAttribute = function () {
        var root = document.documentElement;

        if (root.getAttribute('data-lcc-hide') !== hideAttribute) {
            root.setAttribute('data-lcc-hide', hideAttribute);
        }
    },
    mark = function (el, type) {
        if (el && !el.hasAttribute('data-lcc')) {
            el.setAttribute('data-lcc', type);
        }
    },
    markDifficulties = function () {
        document.querySelectorAll(DIFFICULTY_CANDIDATES).forEach(function (el) {
            if (el.childElementCount === 0 && DIFFICULTY_TEXT.test(el.textContent.trim())) {
                mark(el, 'difficulty');
            }
        });
    },
    markAcceptanceRates = function () {
        // Problem lists (problemset page and the problem list drawer)
        document.querySelectorAll('a[href^="/problems/"] div').forEach(function (el) {
            if (el.childElementCount === 0 && PERCENTAGE_TEXT.test(el.textContent.trim())) {
                mark(el, 'acceptance');
            }
        });

        // "Accepted x / y | Acceptance Rate z%" stats below a question
        document.querySelectorAll('div.text-sd-muted-foreground').forEach(function (el) {
            if (el.childElementCount === 0 && el.textContent.trim() === 'Acceptance Rate') {
                mark(el.closest('.flex-wrap') || el.parentElement, 'acceptance');
            }
        });
    },
    markConstraints = function () {
        document.querySelectorAll('[data-track-load="description_content"] p > strong').forEach(function (strong) {
            var p = strong.parentElement,
                el;

            if (!/^Constraints:?$/.test(strong.textContent.trim())) {
                return;
            }

            mark(p, 'constraints');

            // Hide everything up to the next blank paragraph or next heading
            // (e.g. "Follow-up:").
            for (el = p.nextElementSibling; el; el = el.nextElementSibling) {
                if (el.tagName === 'P' && (el.textContent.trim() === '' || el.querySelector('strong'))) {
                    break;
                }
                if (el.tagName === 'STRONG') {
                    break;
                }
                mark(el, 'constraints');
            }
        });
    },
    scan = function () {
        ensureHideAttribute();
        markDifficulties();
        markAcceptanceRates();
        markConstraints();
    },
    scanScheduled = false,
    scheduleScan = function () {
        if (!scanScheduled) {
            scanScheduled = true;
            requestAnimationFrame(function () {
                scanScheduled = false;
                scan();
            });
        }
    };

// Hide everything straight away (before the stored options load) so that
// nothing flashes up on page load.
applyOptions(DEFAULTS);

chrome.storage.sync.get('lc_options', function (items) {
    applyOptions(items.lc_options);
});

chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'sync' && changes.lc_options) {
        applyOptions(changes.lc_options.newValue);
    }
});

new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['data-lcc-hide']
});
